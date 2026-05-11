import OpenAI from 'openai';
import { env } from '../../../config/env';
import { sharedHttpsAgent } from '../../../shared/http/keep-alive-agent';

if (!env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is missing — consultations AI pipeline cannot start.');
}

// OpenAI SDK v6 uses native fetch (undici), which already pools connections
// per-origin with keep-alive by default. We also keep `sharedHttpsAgent`
// referenced/exported so any axios/legacy clients can reuse the same agent.
// We rely on the SDK's built-in timeout/retry controls here.
void sharedHttpsAgent;

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 30_000,
  maxRetries: 0,
});
