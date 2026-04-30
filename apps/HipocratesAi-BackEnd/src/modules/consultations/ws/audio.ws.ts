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

function normalizeText(raw: string): string {
  if (!raw) return '';
  const trimmed = String(raw).replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const parts = trimmed.split(' ');
  const out: string[] = [];
  let last = '';
  for (const p of parts) {
    const n = p.toLowerCase();
    if (n && n === last) continue;
    out.push(p);
    last = n;
  }
  return out.join(' ').trim();
}

function dominantSpeaker(words: Array<{ speaker?: number }>): number {
  const counts: Record<number, number> = {};
  for (const w of words) {
    const s = w.speaker ?? 0;
    counts[s] = (counts[s] || 0) + 1;
  }
  let best = 0;
  let max = 0;
  for (const [s, c] of Object.entries(counts)) {
    if (c > max) {
      max = c;
      best = Number(s);
    }
  }
  return best;
}

function speakerLabel(speakerId: number): string {
  if (speakerId === 0) return 'doctor';
  return `patient_${speakerId}`;
}

interface DeepgramWord {
  speaker?: number;
}

interface DeepgramAlternative {
  transcript?: string;
  words?: DeepgramWord[];
}

interface DeepgramResults {
  type?: string;
  is_final?: boolean;
  channel?: { alternatives?: DeepgramAlternative[] };
}

function isDeepgramMessage(v: unknown): v is DeepgramResults {
  return typeof v === 'object' && v !== null && 'type' in v;
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

function buildDeepgramUrl(): string {
  const params = new URLSearchParams({
    model: env.DEEPGRAM_MODEL,
    language: env.DEEPGRAM_LANGUAGE,
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
    interim_results: 'true',
    endpointing: '300',
    utterance_end_ms: '1000',
    diarize: 'true',
    smart_format: 'true',
    punctuate: 'true',
    no_delay: 'true',
  });
  const keywords = ['paciente', 'dor', 'alergia', 'medicamento'];
  for (const k of keywords) params.append('keywords', `${k}:2`);
  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
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
  const connectedAt = Date.now();

  logger.info({ consultationId }, '[WS_AUDIO] connected');

  if (!env.DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY.length < 10) {
    logger.error('[WS_AUDIO] DEEPGRAM_API_KEY not configured');
    try {
      ws.close(1011, 'deepgram_not_configured');
    } catch {
      /* ignore */
    }
    return;
  }

  let closed = false;
  let dg: WebSocket | null = null;
  let keepaliveTimer: NodeJS.Timeout | null = null;
  const pending: Buffer[] = [];
  const lastEmittedBySpeaker = new Map<number, string>();
  const recentFinalHashes: string[] = [];
  const DEDUP_WINDOW = 5;
  const isDuplicateFinal = (speaker: string, text: string): boolean => {
    const h = `${speaker}:${text.slice(0, 80)}`;
    if (recentFinalHashes.includes(h)) return true;
    recentFinalHashes.push(h);
    while (recentFinalHashes.length > DEDUP_WINDOW) recentFinalHashes.shift();
    return false;
  };

  const safeClose = (): void => {
    if (closed) return;
    closed = true;
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
    if (dg) {
      try {
        if (dg.readyState === 1) {
          dg.send(JSON.stringify({ type: 'CloseStream' }));
        }
      } catch {
        /* ignore */
      }
      const dgRef = dg;
      setTimeout(() => {
        try {
          dgRef.close();
        } catch {
          /* ignore */
        }
      }, 500);
    }
    if (session.audioSocket === ws) {
      session.audioSocket = null;
    }
    if (session.stateSockets.size === 0) {
      removeSession(consultationId);
    }
  };

  try {
    dg = new WebSocket(buildDeepgramUrl(), {
      headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` },
    });
  } catch (err) {
    logger.error({ err, consultationId }, '[WS_AUDIO] failed to open deepgram');
    safeClose();
    return;
  }

  dg.on('open', () => {
    logger.info({ consultationId }, '[WS_AUDIO] deepgram open');
    keepaliveTimer = setInterval(() => {
      if (dg && dg.readyState === 1) {
        try {
          dg.send(JSON.stringify({ type: 'KeepAlive' }));
        } catch {
          /* ignore */
        }
      }
    }, 8000);
    for (const buf of pending) {
      try {
        dg?.send(buf);
      } catch {
        /* ignore */
      }
    }
    pending.length = 0;
  });

  dg.on('message', (raw: Buffer) => {
    let msg: unknown;
    try {
      msg = JSON.parse(raw.toString('utf-8'));
    } catch {
      return;
    }
    if (!isDeepgramMessage(msg)) return;

    const type = msg.type;
    if (type === 'Results') {
      const alt = msg.channel?.alternatives?.[0];
      const transcript = (alt?.transcript || '').trim();
      if (!transcript) return;
      const words = alt?.words || [];
      const speakerNum = dominantSpeaker(words);
      const speaker = speakerLabel(speakerNum);

      if (msg.is_final !== true) {
        broadcastState(consultationId, {
          type: 'transcript_partial',
          text: transcript,
          speaker,
          rawSpeaker: speakerNum,
        });
        return;
      }

      const last = lastEmittedBySpeaker.get(speakerNum) || '';
      if (transcript === last) return;
      if (last && last.includes(transcript)) return;
      lastEmittedBySpeaker.set(speakerNum, transcript);

      const text = normalizeText(transcript);
      if (!text) return;

      if (isDuplicateFinal(speaker, text)) {
        return;
      }

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
        rawSpeaker: speakerNum,
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
      return;
    }

    if (type === 'SpeechStarted') {
      logger.debug({ consultationId }, '[WS_AUDIO] speech started');
      return;
    }

    if (type === 'UtteranceEnd') {
      logger.debug({ consultationId }, '[WS_AUDIO] utterance end');
      lastEmittedBySpeaker.clear();
      return;
    }
  });

  dg.on('error', (err: Error) => {
    logger.warn({ err: err.message, consultationId }, '[WS_AUDIO] deepgram error');
  });

  dg.on('close', (code: number) => {
    logger.info({ consultationId, code }, '[WS_AUDIO] deepgram closed');
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  });

  ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
    if (closed) return;
    const buf = Buffer.isBuffer(data)
      ? data
      : Array.isArray(data)
        ? Buffer.concat(data)
        : Buffer.from(data as ArrayBuffer);
    if (!dg || dg.readyState !== 1) {
      if (pending.length >= 50) pending.shift();
      pending.push(buf);
      return;
    }
    try {
      dg.send(buf);
    } catch (err) {
      logger.warn(
        { err: (err as Error).message, consultationId },
        '[WS_AUDIO] failed to forward chunk'
      );
    }
  });

  ws.on('close', () => {
    const seconds = Math.max(0, Math.round((Date.now() - connectedAt) / 1000));
    trackDeepgramSeconds(consultationId, seconds);
    logger.info({ consultationId, seconds }, '[WS_AUDIO] client disconnected');
    safeClose();
  });

  ws.on('error', (err: Error) => {
    logger.warn({ err: err.message, consultationId }, '[WS_AUDIO] client ws error');
    safeClose();
  });
}
