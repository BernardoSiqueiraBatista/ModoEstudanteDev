jest.mock('../../../shared/logger/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { TranscriptBatcher } from '../consultations.transcript-batcher';
import type { ConsultationsRepository, SaveTranscriptInput } from '../consultations.repository';

function makeItem(text: string): SaveTranscriptInput {
  return {
    consultationId: 'c-1',
    text,
    speaker: 'doctor',
    isFinal: true,
    timestampMs: 0,
  };
}

function fakeRepo(): { repo: ConsultationsRepository; bulk: jest.Mock } {
  const bulk = jest.fn().mockResolvedValue(undefined);
  const repo = { saveTranscriptsBulk: bulk } as unknown as ConsultationsRepository;
  return { repo, bulk };
}

describe('TranscriptBatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask'] });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('enqueue below maxBatchSize waits for timer then flushes', async () => {
    const { repo, bulk } = fakeRepo();
    const b = new TranscriptBatcher(repo, 2000, 20);
    b.enqueue(makeItem('a'));
    b.enqueue(makeItem('b'));
    expect(bulk).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2100);
    await Promise.resolve();
    expect(bulk).toHaveBeenCalledTimes(1);
    expect(bulk.mock.calls[0][0]).toHaveLength(2);
  });

  it('enqueue reaching maxBatchSize flushes immediately', async () => {
    const { repo, bulk } = fakeRepo();
    const b = new TranscriptBatcher(repo, 2000, 3);
    b.enqueue(makeItem('a'));
    b.enqueue(makeItem('b'));
    b.enqueue(makeItem('c'));
    await Promise.resolve();
    await Promise.resolve();
    expect(bulk).toHaveBeenCalledTimes(1);
    expect(bulk.mock.calls[0][0]).toHaveLength(3);
  });

  it('flushAll manually flushes pending items', async () => {
    const { repo, bulk } = fakeRepo();
    const b = new TranscriptBatcher(repo, 2000, 20);
    b.enqueue(makeItem('a'));
    await b.flushAll();
    expect(bulk).toHaveBeenCalledTimes(1);
  });

  it('empty flush is a no-op', async () => {
    const { repo, bulk } = fakeRepo();
    const b = new TranscriptBatcher(repo);
    await b.flush();
    expect(bulk).not.toHaveBeenCalled();
  });

  it('flush failure does not crash and queue is not repopulated', async () => {
    const bulk = jest.fn().mockRejectedValue(new Error('boom'));
    const repo = { saveTranscriptsBulk: bulk } as unknown as ConsultationsRepository;
    const b = new TranscriptBatcher(repo, 2000, 20);
    b.enqueue(makeItem('a'));
    await b.flushAll();
    expect(bulk).toHaveBeenCalledTimes(1);
    expect(b.size()).toBe(0);
  });

  it('scheduled flush clears timer after reaching maxBatchSize', async () => {
    const { repo, bulk } = fakeRepo();
    const b = new TranscriptBatcher(repo, 2000, 2);
    b.enqueue(makeItem('a'));
    b.enqueue(makeItem('b')); // triggers immediate flush
    await Promise.resolve();
    await Promise.resolve();
    expect(bulk).toHaveBeenCalledTimes(1);
    // Advancing time should not trigger another flush
    jest.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(bulk).toHaveBeenCalledTimes(1);
  });
});
