import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { openai } from './openai-client';
import { embeddingsCache } from './embeddings-cache';
import { openaiEmbeddingsBreaker, CircuitOpenError } from './circuit-breaker';
import { measureAsync, metrics } from '../../../shared/metrics/metrics';

export class EmbeddingsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingsUnavailableError';
  }
}

export async function embedText(text: string): Promise<number[]> {
  const input = String(text || '').trim();
  if (!input) {
    throw new Error('embedText: empty input');
  }

  const cached = embeddingsCache.get(input);
  if (cached) {
    metrics.record('embeddings.cache_hit', 0);
    logger.debug({ len: input.length }, 'embedText: cache hit');
    return cached;
  }

  try {
    const res = await measureAsync('openai.embedding', () =>
      openaiEmbeddingsBreaker.execute(() =>
        openai.embeddings.create({
          model: env.OPENAI_EMBEDDING_MODEL,
          input,
        }),
      ),
    );
    const vec = res.data?.[0]?.embedding;
    if (!vec || !Array.isArray(vec)) {
      throw new Error('embedText: embedding missing from response');
    }
    embeddingsCache.set(input, vec);
    return vec;
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn({ err }, 'embedText: circuit open, embeddings unavailable');
      throw new EmbeddingsUnavailableError('embeddings circuit breaker open');
    }
    logger.error({ err }, 'embedText: failed to create embedding');
    throw err;
  }
}
