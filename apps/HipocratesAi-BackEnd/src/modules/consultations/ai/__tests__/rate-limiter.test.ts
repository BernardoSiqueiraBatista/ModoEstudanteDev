import { canCall, resetLimiter } from '../rate-limiter';
import { env } from '../../../../config/env';

describe('rate-limiter', () => {
  beforeEach(() => {
    resetLimiter('cA');
    resetLimiter('cB');
    jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z').getTime() });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows up to N calls in window', () => {
    for (let i = 0; i < env.INSIGHTS_MAX_CALLS_PER_MINUTE; i++) {
      expect(canCall('cA')).toBe(true);
    }
  });

  it('blocks the N+1 call', () => {
    for (let i = 0; i < env.INSIGHTS_MAX_CALLS_PER_MINUTE; i++) {
      canCall('cA');
    }
    expect(canCall('cA')).toBe(false);
  });

  it('resets after window expires', () => {
    for (let i = 0; i < env.INSIGHTS_MAX_CALLS_PER_MINUTE; i++) {
      canCall('cA');
    }
    expect(canCall('cA')).toBe(false);
    jest.advanceTimersByTime(61_000);
    expect(canCall('cA')).toBe(true);
  });

  it('tracks separate counters per consultationId', () => {
    for (let i = 0; i < env.INSIGHTS_MAX_CALLS_PER_MINUTE; i++) {
      canCall('cA');
    }
    expect(canCall('cA')).toBe(false);
    expect(canCall('cB')).toBe(true);
  });
});
