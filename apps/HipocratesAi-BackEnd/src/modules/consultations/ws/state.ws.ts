import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../../../shared/logger/logger';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { authenticateWsRequest } from './auth-ws';
import { getOrCreateSession, removeSession } from './ws-registry';

const wss = new WebSocketServer({ noServer: true });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseConsultationId(url: string | undefined): string | null {
  if (!url) return null;
  const u = new URL(url, 'http://localhost');
  const match = u.pathname.match(/^\/ws\/consultations\/([^/]+)\/state\/?$/);
  if (!match) return null;
  const id = match[1];
  return UUID_RE.test(id) ? id : null;
}

interface ClientMessage {
  type?: string;
  consultationId?: string;
  insightId?: string;
  action?: 'useful' | 'not_useful' | 'dismissed';
}

function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return null;
    return v as ClientMessage;
  } catch {
    return null;
  }
}

function safeSend(ws: WebSocket, payload: Record<string, unknown>): void {
  try {
    if (ws.readyState === 1) ws.send(JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

async function sendInitialState(ws: WebSocket, consultationId: string): Promise<void> {
  try {
    const [{ data: transcripts }, { data: insights }] = await Promise.all([
      supabaseAdmin
        .schema('app')
        .from('consultation_transcripts')
        .select('id, text, speaker, is_final, timestamp_ms, created_at')
        .eq('consultation_id', consultationId)
        .order('timestamp_ms', { ascending: true })
        .limit(500),
      supabaseAdmin
        .schema('app')
        .from('consultation_insights')
        .select(
          'id, kind, content, rationale, source_chunks, source_web, severity, confidence, acknowledged_at, acknowledged_action, created_at'
        )
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true })
        .limit(200),
    ]);

    safeSend(ws, {
      type: 'initial_state',
      consultationId,
      transcripts: transcripts ?? [],
      insights: insights ?? [],
      ts: Date.now(),
    });
  } catch (err) {
    logger.error({ err, consultationId }, '[WS_STATE] failed to send initial state');
  }
}

export async function handleStateUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer
): Promise<void> {
  const consultationId = parseConsultationId(request.url);
  if (!consultationId) {
    socket.destroy();
    return;
  }

  try {
    await authenticateWsRequest(request);
  } catch (err) {
    logger.warn({ err }, '[WS_STATE] auth failed');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    acceptStateConnection(ws, consultationId);
  });
}

function acceptStateConnection(ws: WebSocket, consultationId: string): void {
  const session = getOrCreateSession(consultationId);
  session.stateSockets.add(ws);

  logger.info({ consultationId }, '[WS_STATE] connected');

  void sendInitialState(ws, consultationId);

  let isAlive = true;
  const heartbeat = setInterval(() => {
    if (!isAlive) {
      try {
        ws.terminate();
      } catch {
        /* ignore */
      }
      clearInterval(heartbeat);
      return;
    }
    isAlive = false;
    try {
      ws.ping();
    } catch {
      /* ignore */
    }
  }, 30000);

  ws.on('pong', () => {
    isAlive = true;
  });

  ws.on('message', (raw: Buffer) => {
    const msg = parseClientMessage(raw.toString('utf-8'));
    if (!msg || !msg.type) return;

    if (msg.type === 'subscribe') {
      safeSend(ws, { type: 'subscribed', consultationId, ts: Date.now() });
      return;
    }

    if (msg.type === 'ping') {
      safeSend(ws, { type: 'pong', ts: Date.now() });
      return;
    }

    if (msg.type === 'insight_ack' && msg.insightId && msg.action) {
      const insightId = msg.insightId;
      const action = msg.action;
      void supabaseAdmin
        .schema('app')
        .from('consultation_insights')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_action: action,
        })
        .eq('id', insightId)
        .eq('consultation_id', consultationId)
        .then(({ error }) => {
          if (error) {
            logger.warn(
              { err: error.message, consultationId, insightId },
              '[WS_STATE] failed to ack insight'
            );
            safeSend(ws, { type: 'error', message: 'insight_ack_failed', ts: Date.now() });
            return;
          }
          safeSend(ws, {
            type: 'insight_acked',
            insightId,
            action,
            ts: Date.now(),
          });
        });
    }
  });

  ws.on('close', () => {
    clearInterval(heartbeat);
    session.stateSockets.delete(ws);
    logger.info({ consultationId }, '[WS_STATE] disconnected');
    if (session.stateSockets.size === 0 && !session.audioSocket) {
      removeSession(consultationId);
    }
  });

  ws.on('error', (err: Error) => {
    logger.warn({ err: err.message, consultationId }, '[WS_STATE] error');
  });
}
