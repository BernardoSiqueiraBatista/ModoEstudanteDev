import { createHash } from 'node:crypto';

/**
 * Simple in-memory LRU for embeddings. Keyed by SHA-256 of normalized text.
 * Default max 500 entries (~3MB for 1536-dim float arrays).
 * Evicts least-recently-used on overflow.
 */
export class EmbeddingsCache {
  private cache = new Map<string, number[]>();
  private readonly max: number;

  constructor(max = 500) {
    this.max = max;
  }

  get(text: string): number[] | undefined {
    const key = this.key(text);
    const val = this.cache.get(key);
    if (val) {
      // LRU: re-insert to mark as most recently used
      this.cache.delete(key);
      this.cache.set(key, val);
    }
    return val;
  }

  set(text: string, embedding: number[]): void {
    const key = this.key(text);
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, embedding);
    while (this.cache.size > this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey === undefined) break;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private key(text: string): string {
    return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  }
}

export const embeddingsCache = new EmbeddingsCache();
