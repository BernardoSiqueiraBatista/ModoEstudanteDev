export interface BufferedUtterance {
  text: string;
  speaker: string;
  timestampMs: number;
  receivedAt: number;
}

/**
 * Sliding-window buffer for transcript utterances.
 * Evicts by both count (maxItems) and age (maxAgeMs) to bound memory
 * during long consultations.
 */
export class TranscriptBuffer {
  private items: BufferedUtterance[] = [];
  private readonly maxItems: number;
  private readonly maxAgeMs: number;

  constructor(maxItems = 100, maxAgeMs = 10 * 60 * 1000) {
    this.maxItems = maxItems;
    this.maxAgeMs = maxAgeMs;
  }

  append(utterance: BufferedUtterance): void {
    this.items.push(utterance);
    this.evict();
  }

  private evict(): void {
    while (this.items.length > this.maxItems) this.items.shift();
    const cutoff = Date.now() - this.maxAgeMs;
    while (this.items.length > 0 && this.items[0].receivedAt < cutoff) {
      this.items.shift();
    }
  }

  last(n: number): BufferedUtterance[] {
    if (n <= 0) return [];
    return this.items.slice(-n);
  }

  sinceMs(windowMs: number): BufferedUtterance[] {
    const cutoff = Date.now() - windowMs;
    return this.items.filter((u) => u.receivedAt >= cutoff);
  }

  all(): readonly BufferedUtterance[] {
    return this.items;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  textJoined(): string {
    return this.items.map((u) => u.text).join(' ');
  }
}
