import type { WebSocket } from 'ws';

export interface PipelineState {
  transcriptBuffer: string[];
  lastInsightsHash: string | null;
  debounceTimer: NodeJS.Timeout | null;
  lastCallAt: number;
  callsThisMinute: number;
  minuteWindowStart: number;
  startedAt: number;
}

export interface ConsultationWsSession {
  consultationId: string;
  audioSocket: WebSocket | null;
  stateSockets: Set<WebSocket>;
  pipelineState: PipelineState;
}

const sessions = new Map<string, ConsultationWsSession>();

export function getOrCreateSession(consultationId: string): ConsultationWsSession {
  let s = sessions.get(consultationId);
  if (!s) {
    s = {
      consultationId,
      audioSocket: null,
      stateSockets: new Set(),
      pipelineState: {
        transcriptBuffer: [],
        lastInsightsHash: null,
        debounceTimer: null,
        lastCallAt: 0,
        callsThisMinute: 0,
        minuteWindowStart: Date.now(),
        startedAt: Date.now(),
      },
    };
    sessions.set(consultationId, s);
  }
  return s;
}

export function getSession(consultationId: string): ConsultationWsSession | null {
  return sessions.get(consultationId) ?? null;
}

export function removeSession(consultationId: string): void {
  const s = sessions.get(consultationId);
  if (!s) return;
  if (s.pipelineState.debounceTimer) {
    clearTimeout(s.pipelineState.debounceTimer);
  }
  sessions.delete(consultationId);
}

export function broadcastState(
  consultationId: string,
  message: Record<string, unknown>
): void {
  const s = sessions.get(consultationId);
  if (!s) return;
  const payload = JSON.stringify({ consultationId, ts: Date.now(), ...message });
  for (const ws of s.stateSockets) {
    try {
      if (ws.readyState === 1) ws.send(payload);
    } catch {
      /* ignore */
    }
  }
}
