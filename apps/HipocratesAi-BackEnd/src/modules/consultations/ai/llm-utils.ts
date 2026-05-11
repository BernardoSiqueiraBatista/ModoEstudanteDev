import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { withRetry } from '../../../shared/retry/retry';
import { openai } from './openai-client';
import { trackLLMUsage } from './cost-tracker';

/**
 * Aproximacao de contagem de tokens sem dep. do tiktoken:
 * ~4 chars/token em ingles, ~3.5 em portugues. Usamos 4 como approx seguro.
 */
export function approxTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Trunca texto para caber em maxTokens (aprox). Mantem os ULTIMOS chars,
 * porque em transcript recente eh mais relevante que historico antigo.
 */
export function truncateToMaxTokens(text: string, maxTokens: number): string {
  const current = approxTokens(text);
  if (current <= maxTokens) return text;
  const maxChars = maxTokens * 4;
  return text.slice(-maxChars);
}

import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

type ChatArgs = Omit<ChatCompletionCreateParamsNonStreaming, 'stream'>;

/**
 * Invoca chat.completions.create com:
 * - retry exponencial (handles 429/5xx)
 * - fallback pro OPENAI_FALLBACK_MODEL se falhar apos retries
 * - metrics de uso
 */
export async function createChatCompletionResilient(
  args: ChatArgs,
  opts: { signal?: AbortSignal; consultationId?: string } = {},
): Promise<ChatCompletion> {
  const primaryModel = args.model;
  const fallbackModel = env.OPENAI_FALLBACK_MODEL;

  try {
    const r = (await withRetry(() => openai.chat.completions.create(args as any), {
      retries: 3,
      minTimeoutMs: 800,
      maxTimeoutMs: 5000,
      signal: opts.signal,
    })) as ChatCompletion;
    trackLLMUsage(opts.consultationId, String(primaryModel), (r as any)?.usage);
    return r;
  } catch (err) {
    if (!fallbackModel || fallbackModel === primaryModel) throw err;
    logger.warn(
      { primaryModel, fallbackModel, consultationId: opts.consultationId, err },
      '[llm] fallback after retries exhausted',
    );
    const r = (await withRetry(
      () => openai.chat.completions.create({ ...args, model: fallbackModel } as any),
      { retries: 1, minTimeoutMs: 500, maxTimeoutMs: 2000, signal: opts.signal },
    )) as ChatCompletion;
    trackLLMUsage(opts.consultationId, fallbackModel, (r as any)?.usage);
    return r;
  }
}
