import {
  wsServerMessageSchema,
  type WsClientMessage,
  type WsServerMessage,
} from '@hipo/contracts';
import { supabase } from './supabase';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:3333';

function httpToWsBase(): string {
  const u = new URL(API_URL);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return u.origin;
}

type Listener = (msg: WsServerMessage) => void;
type StatusListener = (status: WsStatus) => void;

export type WsStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

interface ConsultationWsClientOptions {
  consultationId: string;
  /** override base URL for tests */
  baseUrl?: string;
}

const MAX_BACKOFF_MS = 10_000;
const MAX_RETRIES = 10;

export class ConsultationWsClient {
  private readonly consultationId: string;
  private readonly base: string;
  private stateSocket: WebSocket | null = null;
  private audioSocket: WebSocket | null = null;
  private retries = 0;
  private intentionallyClosed = false;
  private status: WsStatus = 'idle';
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();

  constructor(options: ConsultationWsClientOptions) {
    this.consultationId = options.consultationId;
    this.base = options.baseUrl ?? httpToWsBase();
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  getStatus(): WsStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    this.intentionallyClosed = false;
    await this.openStateSocket();
  }

  send(message: WsClientMessage): void {
    if (this.stateSocket?.readyState === WebSocket.OPEN) {
      this.stateSocket.send(JSON.stringify(message));
    }
  }

  ackInsight(insightId: string, action: 'useful' | 'not_useful' | 'dismissed'): void {
    this.send({ type: 'insight_ack', insightId, action });
  }

  /**
   * Begin streaming PCM 16-bit little-endian audio chunks (16kHz mono) to the
   * back. Caller is responsible for capturing PCM and feeding chunks via
   * `sendAudioChunk`. Open the audio socket lazily on first call.
   */
  async openAudioChannel(): Promise<void> {
    if (this.audioSocket && this.audioSocket.readyState <= WebSocket.OPEN) return;
    const token = await this.getAccessToken();
    if (!token) throw new Error('Sem token de autenticação para conectar áudio.');
    const url = `${this.base}/ws/consultations/${this.consultationId}/audio?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    this.audioSocket = ws;
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true });
      ws.addEventListener('error', () => reject(new Error('Falha ao abrir canal de áudio.')), {
        once: true,
      });
    });
  }

  sendAudioChunk(chunk: ArrayBuffer): void {
    if (this.audioSocket?.readyState === WebSocket.OPEN) {
      this.audioSocket.send(chunk);
    }
  }

  closeAudioChannel(): void {
    if (this.audioSocket) {
      try {
        this.audioSocket.close(1000, 'client_stop_audio');
      } catch {
        /* ignore */
      }
      this.audioSocket = null;
    }
  }

  dispose(): void {
    this.intentionallyClosed = true;
    this.closeAudioChannel();
    if (this.stateSocket) {
      try {
        this.stateSocket.close(1000, 'client_dispose');
      } catch {
        /* ignore */
      }
      this.stateSocket = null;
    }
    this.listeners.clear();
    this.statusListeners.clear();
    this.setStatus('closed');
  }

  private async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private setStatus(next: WsStatus): void {
    this.status = next;
    for (const fn of this.statusListeners) fn(next);
  }

  private async openStateSocket(): Promise<void> {
    this.setStatus(this.retries > 0 ? 'reconnecting' : 'connecting');
    const token = await this.getAccessToken();
    if (!token) {
      this.setStatus('closed');
      throw new Error('Sem token de autenticação para conectar.');
    }
    const url = `${this.base}/ws/consultations/${this.consultationId}/state?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.stateSocket = ws;

    ws.addEventListener('open', () => {
      this.retries = 0;
      this.setStatus('open');
      this.send({ type: 'subscribe' });
    });

    ws.addEventListener('message', evt => {
      let raw: unknown;
      try {
        raw = JSON.parse(typeof evt.data === 'string' ? evt.data : '{}');
      } catch {
        return;
      }
      const parsed = wsServerMessageSchema.safeParse(raw);
      if (!parsed.success) return;
      for (const fn of this.listeners) fn(parsed.data);
    });

    ws.addEventListener('close', () => {
      this.stateSocket = null;
      if (this.intentionallyClosed) return;
      this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // close handler will fire next; just log/ignore here
    });
  }

  private scheduleReconnect(): void {
    if (this.retries >= MAX_RETRIES) {
      this.setStatus('closed');
      return;
    }
    const base = Math.min(MAX_BACKOFF_MS, 200 * 2 ** this.retries);
    const jitter = Math.random() * 200;
    this.retries += 1;
    this.setStatus('reconnecting');
    setTimeout(() => {
      if (this.intentionallyClosed) return;
      this.openStateSocket().catch(() => this.scheduleReconnect());
    }, base + jitter);
  }
}
