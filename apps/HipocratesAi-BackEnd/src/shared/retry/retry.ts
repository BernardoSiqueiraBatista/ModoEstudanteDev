import { logger } from '../logger/logger';

export interface RetryOptions {
  retries?: number;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
  factor?: number;
  signal?: AbortSignal;
  onRetry?: (attempt: number, err: unknown) => void;
  shouldRetry?: (err: unknown) => boolean;
}

function defaultShouldRetry(err: unknown): boolean {
  const e = err as any;
  const status = e?.status ?? e?.response?.status ?? e?.statusCode;
  if (typeof status === 'number') {
    if (status === 408 || status === 429) return true;
    if (status >= 500 && status < 600) return true;
    return false;
  }
  // Network errors / aborts temporarios
  const code = e?.code;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EPIPE' || code === 'ECONNREFUSED')
    return true;
  return true; // por default, tenta de novo
}

function parseRetryAfter(err: unknown): number | null {
  const e = err as any;
  const header =
    e?.headers?.['retry-after'] ??
    e?.response?.headers?.['retry-after'] ??
    e?.responseHeaders?.['retry-after'];
  if (!header) return null;
  const n = Number(header);
  if (Number.isFinite(n) && n > 0) return n * 1000;
  const dateMs = Date.parse(String(header));
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    if (delta > 0) return delta;
  }
  return null;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('aborted'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const minTimeout = opts.minTimeoutMs ?? 1000;
  const maxTimeout = opts.maxTimeoutMs ?? 8000;
  const factor = opts.factor ?? 2;
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;

  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= retries || !shouldRetry(err)) throw err;

      const hinted = parseRetryAfter(err);
      const base = Math.min(maxTimeout, minTimeout * Math.pow(factor, attempt));
      const jitter = base * (0.8 + Math.random() * 0.4);
      const delay = hinted ?? Math.round(jitter);

      opts.onRetry?.(attempt + 1, err);
      logger.warn(
        {
          attempt: attempt + 1,
          retries,
          delayMs: delay,
          err: err instanceof Error ? err.message : String(err),
        },
        '[retry] retrying after failure',
      );

      await sleep(delay, opts.signal);
      attempt++;
    }
  }

  throw lastErr;
}
