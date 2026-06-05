import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { authenticateWsRequest } from './auth-ws';
import { broadcastState, getOrCreateSession, removeSession } from './ws-registry';
import { processTranscriptFinal } from '../ai/process-text';
import { transcriptBatcher } from '../consultations.transcript-batcher';
import { trackDeepgramSeconds } from '../ai/cost-tracker';
import { attachDeepgramToSocket } from '../../../shared/deepgram/deepgram-streamer';

const wss = new WebSocketServer({ noServer: true });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseConsultationId(url: string | undefined): string | null {
  if (!url) return null;
  const u = new URL(url, 'http://localhost');
  const match = u.pathname.match(/^\/ws\/consultations\/([^/]+)\/audio\/?$/);
  if (!match) return null;
  const id = match[1];
  return UUID_RE.test(id) ? id : null;
}


async function verifyConsultationOwnership(
  consultationId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .schema('app')
    .from('consultation_sessions')
    .select('id, doctor_user_id, status')
    .eq('id', consultationId)
    .maybeSingle();
  if (error || !data) return false;
  if ((data as { doctor_user_id: string }).doctor_user_id !== userId) return false;
  return true;
}

export async function handleAudioUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer
): Promise<void> {
  const consultationId = parseConsultationId(request.url);
  if (!consultationId) {
    socket.destroy();
    return;
  }

  let auth;
  try {
    auth = await authenticateWsRequest(request);
  } catch (err) {
    logger.warn({ err }, '[WS_AUDIO] auth failed');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  const ok = await verifyConsultationOwnership(consultationId, auth.userId);
  if (!ok) {
    logger.warn({ consultationId, userId: auth.userId }, '[WS_AUDIO] forbidden');
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    acceptAudioConnection(ws, consultationId);
  });
}

function acceptAudioConnection(ws: WebSocket, consultationId: string): void {
  const session = getOrCreateSession(consultationId);
  if (session.audioSocket && session.audioSocket.readyState <= 1) {
    try {
      session.audioSocket.close(1000, 'replaced_by_new_connection');
    } catch {
      /* ignore */
    }
  }
  session.audioSocket = ws;

  logger.info({ consultationId }, '[WS_AUDIO] connected (Consultation)');

  attachDeepgramToSocket(ws, consultationId, {
    onPartial: (text, speaker, rawSpeaker) => {
      broadcastState(consultationId, {
        type: 'transcript_partial',
        text,
        speaker,
        rawSpeaker,
      });
    },
    onFinal: (text, speaker, rawSpeaker) => {
      const nowMs = Date.now();
      const offsetMs = nowMs - session.pipelineState.startedAt;

      transcriptBatcher.enqueue({
        consultationId,
        text,
        speaker,
        isFinal: true,
        timestampMs: offsetMs,
      });

      broadcastState(consultationId, {
        type: 'transcript_final',
        text,
        speaker,
        rawSpeaker,
        timestampMs: offsetMs,
      });

      Promise.resolve()
        .then(() =>
          processTranscriptFinal({
            consultationId,
            text,
            speaker,
          })
        )
        .catch((err: unknown) => {
          logger.error({ err, consultationId }, '[WS_AUDIO] processTranscriptFinal error');
        });
    },
    onClose: (secondsConnected: number) => {
      trackDeepgramSeconds(consultationId, secondsConnected);
      logger.info({ consultationId, secondsConnected }, '[WS_AUDIO] client disconnected');

      if (session.audioSocket === ws) {
        session.audioSocket = null;
      }
      if (session.stateSockets.size === 0) {
        removeSession(consultationId);
      }
    },
  });
}
