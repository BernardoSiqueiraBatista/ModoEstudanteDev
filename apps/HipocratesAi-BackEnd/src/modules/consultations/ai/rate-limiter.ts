import { env } from '../../../config/env';

interface Bucket {
  calls: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const buckets = new Map<string, Bucket>();

export function canCall(consultationId: string): boolean {
  const now = Date.now();
  const b = buckets.get(consultationId);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    buckets.set(consultationId, { calls: 1, windowStart: now });
    return true;
  }
  if (b.calls >= env.INSIGHTS_MAX_CALLS_PER_MINUTE) {
    return false;
  }
  b.calls += 1;
  return true;
}

export function resetLimiter(consultationId: string): void {
  buckets.delete(consultationId);
}
