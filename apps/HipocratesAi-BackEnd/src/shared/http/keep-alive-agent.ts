import { Agent as HttpsAgent } from 'node:https';

/**
 * Shared HTTPS agent with connection keep-alive.
 * Reuses TCP/TLS connections across API calls to OpenAI, Deepgram, Supabase.
 * Saves ~100-300ms per call (handshake overhead).
 */
export const sharedHttpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 50,
  maxFreeSockets: 10,
  scheduling: 'lifo',
  timeout: 60_000,
});
