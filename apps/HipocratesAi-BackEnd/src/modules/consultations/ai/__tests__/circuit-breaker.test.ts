jest.mock('../../../../shared/logger/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { CircuitBreaker, CircuitOpenError } from '../circuit-breaker';

function makeBreaker(overrides: Partial<{
  failureThreshold: number;
  openDurationMs: number;
  halfOpenSuccessThreshold: number;
}> = {}): CircuitBreaker {
  return new CircuitBreaker({
    name: 'test',
    failureThreshold: 3,
    openDurationMs: 1000,
    halfOpenSuccessThreshold: 1,
    ...overrides,
  });
}

describe('CircuitBreaker', () => {
  it('starts in closed state', () => {
    const cb = makeBreaker();
    expect(cb.getState()).toBe('closed');
    expect(cb.isOpen()).toBe(false);
  });

  it('opens after N consecutive failures', async () => {
    const cb = makeBreaker({ failureThreshold: 3 });
    const failing = (): Promise<never> => Promise.reject(new Error('boom'));

    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failing)).rejects.toThrow('boom');
    }
    expect(cb.getState()).toBe('open');
    expect(cb.isOpen()).toBe(true);
  });

  it('rejects immediately with CircuitOpenError while open', async () => {
    const cb = makeBreaker({ failureThreshold: 1 });
    await expect(cb.execute(() => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(cb.getState()).toBe('open');

    const fn = jest.fn(() => Promise.resolve('ok'));
    await expect(cb.execute(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('transitions to half_open after openDurationMs and closes on probe success', async () => {
    jest.useFakeTimers();
    try {
      const cb = makeBreaker({ failureThreshold: 1, openDurationMs: 500, halfOpenSuccessThreshold: 1 });
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
      expect(cb.getState()).toBe('open');

      jest.advanceTimersByTime(600);

      const result = await cb.execute(() => Promise.resolve('ok'));
      expect(result).toBe('ok');
      expect(cb.getState()).toBe('closed');
    } finally {
      jest.useRealTimers();
    }
  });

  it('re-opens if probe fails in half_open', async () => {
    jest.useFakeTimers();
    try {
      const cb = makeBreaker({ failureThreshold: 1, openDurationMs: 500 });
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
      expect(cb.getState()).toBe('open');

      jest.advanceTimersByTime(600);

      await expect(cb.execute(() => Promise.reject(new Error('still bad')))).rejects.toThrow('still bad');
      expect(cb.getState()).toBe('open');
    } finally {
      jest.useRealTimers();
    }
  });

  it('resets consecutive failures on a success in closed state', async () => {
    const cb = makeBreaker({ failureThreshold: 3 });
    await expect(cb.execute(() => Promise.reject(new Error('a')))).rejects.toThrow();
    await expect(cb.execute(() => Promise.reject(new Error('b')))).rejects.toThrow();
    await cb.execute(() => Promise.resolve('ok'));
    // After success, the next 2 failures should NOT open the circuit
    await expect(cb.execute(() => Promise.reject(new Error('c')))).rejects.toThrow();
    await expect(cb.execute(() => Promise.reject(new Error('d')))).rejects.toThrow();
    expect(cb.getState()).toBe('closed');
  });

  it('multiple consecutive successes in closed are a no-op', async () => {
    const cb = makeBreaker();
    for (let i = 0; i < 5; i++) {
      await cb.execute(() => Promise.resolve(i));
    }
    expect(cb.getState()).toBe('closed');
  });

  it('reset() returns breaker to clean closed state', async () => {
    const cb = makeBreaker({ failureThreshold: 1 });
    await expect(cb.execute(() => Promise.reject(new Error('x')))).rejects.toThrow();
    expect(cb.getState()).toBe('open');
    cb.reset();
    expect(cb.getState()).toBe('closed');
    await cb.execute(() => Promise.resolve('ok'));
  });
});
