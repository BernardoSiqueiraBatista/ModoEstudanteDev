import { logger } from '../../shared/logger/logger';
import {
  ConsultationsRepository,
  SaveTranscriptInput,
} from './consultations.repository';

/**
 * Batches transcript writes across all consultations, flushing on a timer
 * (every 2s) or when the queue reaches maxBatchSize (20). Flush failures
 * are logged but not retried to avoid runaway duplication.
 */
export class TranscriptBatcher {
  private queue: SaveTranscriptInput[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;

  constructor(
    private readonly repository: ConsultationsRepository,
    flushIntervalMs = 2_000,
    maxBatchSize = 20,
  ) {
    this.flushIntervalMs = flushIntervalMs;
    this.maxBatchSize = maxBatchSize;
  }

  enqueue(item: SaveTranscriptInput): void {
    this.queue.push(item);
    if (this.queue.length >= this.maxBatchSize) {
      void this.flush();
      return;
    }
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.queue.length === 0) return;
    const batch = this.queue;
    this.queue = [];
    try {
      await this.repository.saveTranscriptsBulk(batch);
    } catch (err) {
      logger.error(
        { err, batchSize: batch.length },
        '[TranscriptBatcher] flush failed',
      );
    }
  }

  async flushAll(): Promise<void> {
    return this.flush();
  }

  size(): number {
    return this.queue.length;
  }
}

export const transcriptBatcher = new TranscriptBatcher(
  new ConsultationsRepository(),
);
