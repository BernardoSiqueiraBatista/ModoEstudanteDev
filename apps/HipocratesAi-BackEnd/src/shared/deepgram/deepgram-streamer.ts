import { WebSocket } from 'ws';
import { env } from '../../config/env';
import { logger } from '../logger/logger';

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

function buildDeepgramUrl(): string {
  const params = new URLSearchParams({
    model: env.DEEPGRAM_MODEL || 'nova-2',
    language: env.DEEPGRAM_LANGUAGE || 'pt-BR',
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

export interface DeepgramStreamerCallbacks {
  onPartial: (text: string, speaker: string, rawSpeaker: number) => void;
  onFinal: (text: string, speaker: string, rawSpeaker: number) => void;
  onClose?: (secondsConnected: number) => void;
}

/**
 * Anexa o motor de transcrição da Deepgram a um WebSocket de cliente existente.
 * Lida com toda a lógica de buffers, keep-alive e deduplicação de textos.
 */
export function attachDeepgramToSocket(
  clientWs: WebSocket,
  sessionId: string,
  callbacks: DeepgramStreamerCallbacks
): void {
  const connectedAt = Date.now();

  if (!env.DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY.length < 10) {
    logger.error('[DEEPGRAM_STREAMER] DEEPGRAM_API_KEY not configured');
    try {
      clientWs.close(1011, 'deepgram_not_configured');
    } catch { /* ignore */ }
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
      } catch { /* ignore */ }
      const dgRef = dg;
      setTimeout(() => {
        try { dgRef.close(); } catch { /* ignore */ }
      }, 500);
    }
    
    // Dispara o evento de fechamento passando o tempo cobrável (segundos)
    const seconds = Math.max(0, Math.round((Date.now() - connectedAt) / 1000));
    if (callbacks.onClose) {
      callbacks.onClose(seconds);
    }
  };

  try {
    dg = new WebSocket(buildDeepgramUrl(), {
      headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` },
    });
  } catch (err) {
    logger.error({ err, sessionId }, '[DEEPGRAM_STREAMER] failed to open deepgram');
    safeClose();
    return;
  }

  dg.on('open', () => {
    logger.info({ sessionId }, '[DEEPGRAM_STREAMER] deepgram open');
    keepaliveTimer = setInterval(() => {
      if (dg && dg.readyState === 1) {
        try {
          dg.send(JSON.stringify({ type: 'KeepAlive' }));
        } catch { /* ignore */ }
      }
    }, 8000);
    for (const buf of pending) {
      try { dg?.send(buf); } catch { /* ignore */ }
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
        callbacks.onPartial(transcript, speaker, speakerNum);
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

      callbacks.onFinal(text, speaker, speakerNum);
      return;
    }

    if (type === 'SpeechStarted') {
      // logger.debug({ sessionId }, '[DEEPGRAM_STREAMER] speech started');
      return;
    }

    if (type === 'UtteranceEnd') {
      // logger.debug({ sessionId }, '[DEEPGRAM_STREAMER] utterance end');
      lastEmittedBySpeaker.clear();
      return;
    }
  });

  dg.on('error', (err: Error) => {
    logger.warn({ err: err.message, sessionId }, '[DEEPGRAM_STREAMER] deepgram error');
  });

  dg.on('close', (code: number) => {
    logger.info({ sessionId, code }, '[DEEPGRAM_STREAMER] deepgram closed');
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  });

  // Eventos do WebSocket do cliente repassados para a Deepgram
  clientWs.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
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
        { err: (err as Error).message, sessionId },
        '[DEEPGRAM_STREAMER] failed to forward chunk'
      );
    }
  });

  clientWs.on('close', () => {
    logger.info({ sessionId }, '[DEEPGRAM_STREAMER] client disconnected');
    safeClose();
  });

  clientWs.on('error', (err: Error) => {
    logger.warn({ err: err.message, sessionId }, '[DEEPGRAM_STREAMER] client ws error');
    safeClose();
  });
}
