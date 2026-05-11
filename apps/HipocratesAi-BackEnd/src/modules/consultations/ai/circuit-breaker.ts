import { logger } from '../../../shared/logger/logger';

type State = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  openDurationMs: number;
  halfOpenSuccessThreshold: number;
}

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker open: ${name}`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: State = 'closed';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private openedAt = 0;

  constructor(private readonly opts: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.opts.openDurationMs) {
        this.state = 'half_open';
        this.consecutiveSuccesses = 0;
        logger.info({ circuit: this.opts.name }, 'circuit: open -> half_open');
      } else {
        throw new CircuitOpenError(this.opts.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.state === 'half_open') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.opts.halfOpenSuccessThreshold) {
        this.state = 'closed';
        logger.info(
          { circuit: this.opts.name },
          'circuit: half_open -> closed',
        );
      }
    }
  }

  private onFailure(err: unknown): void {
    this.consecutiveFailures++;
    if (this.state === 'half_open') {
      this.state = 'open';
      this.openedAt = Date.now();
      logger.warn(
        { circuit: this.opts.name, err },
        'circuit: half_open -> open (probe failed)',
      );
      return;
    }
    if (
      this.state === 'closed' &&
      this.consecutiveFailures >= this.opts.failureThreshold
    ) {
      this.state = 'open';
      this.openedAt = Date.now();
      logger.warn(
        {
          circuit: this.opts.name,
          consecutiveFailures: this.consecutiveFailures,
        },
        'circuit: closed -> open',
      );
    }
  }

  isOpen(): boolean {
    return this.state === 'open';
  }

  getState(): State {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = 0;
  }
}

export const openaiChatBreaker = new CircuitBreaker({
  name: 'openai-chat',
  failureThreshold: 3,
  openDurationMs: 30_000,
  halfOpenSuccessThreshold: 1,
});

export const openaiEmbeddingsBreaker = new CircuitBreaker({
  name: 'openai-embeddings',
  failureThreshold: 5,
  openDurationMs: 15_000,
  halfOpenSuccessThreshold: 1,
});

export const clinicalLlmBreaker = new CircuitBreaker({
  name: 'clinical-llm',
  failureThreshold: 3,
  openDurationMs: 30_000,
  halfOpenSuccessThreshold: 1,
});
