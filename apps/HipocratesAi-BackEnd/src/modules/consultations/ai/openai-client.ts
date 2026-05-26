import OpenAI from 'openai';
import { env } from '../../../config/env';
import { sharedHttpsAgent } from '../../../shared/http/keep-alive-agent';
import { logger } from '../../../shared/logger/logger';

const apiKey = env.OPENAI_API_KEY || 'sk-mock-key-value-for-testing-purposes-only';

if (!env.OPENAI_API_KEY) {
  logger.warn('Aviso: OPENAI_API_KEY está ausente no .env. Chamadas reais à OpenAI irão falhar, mas o servidor foi iniciado com chave mockada no modo de desenvolvimento.');
}

// OpenAI SDK v6 uses native fetch (undici), which already pools connections
// per-origin with keep-alive by default. We also keep `sharedHttpsAgent`
// referenced/exported so any axios/legacy clients can reuse the same agent.
// We rely on the SDK's built-in timeout/retry controls here.
void sharedHttpsAgent;

export const openai = new OpenAI({
  apiKey: apiKey,
  timeout: 30_000,
  maxRetries: 0,
});
