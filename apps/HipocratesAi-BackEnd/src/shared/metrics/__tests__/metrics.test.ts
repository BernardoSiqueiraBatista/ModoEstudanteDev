import { MetricsRegistry, measureAsync, metrics } from '../metrics';

describe('MetricsRegistry', () => {
  it('record() updates count, sum, min, max', () => {
    const r = new MetricsRegistry();
    r.record('stage', 10);
    r.record('stage', 20);
    r.record('stage', 30);
    const snap = r.snapshot();
    expect(snap.stage.count).toBe(3);
    expect(snap.stage.avgMs).toBe(20);
    expect(snap.stage.minMs).toBe(10);
    expect(snap.stage.maxMs).toBe(30);
  });

  it('snapshot() returns correct p50/p95/p99', () => {
    const r = new MetricsRegistry();
    for (let i = 1; i <= 100; i++) r.record('s', i);
    const snap = r.snapshot();
    expect(snap.s.p50).toBeGreaterThanOrEqual(50);
    expect(snap.s.p50).toBeLessThanOrEqual(52);
    expect(snap.s.p95).toBeGreaterThanOrEqual(95);
    expect(snap.s.p95).toBeLessThanOrEqual(96);
    expect(snap.s.p99).toBeGreaterThanOrEqual(99);
  });

  it('samples sliding window keeps only last 100', () => {
    const r = new MetricsRegistry();
    for (let i = 0; i < 110; i++) r.record('s', i);
    // internal samples limited to 100 — p50 should reflect last 100 (10..109)
    const snap = r.snapshot();
    expect(snap.s.count).toBe(110);
    expect(snap.s.p50).toBeGreaterThanOrEqual(59);
  });

  it('measureAsync records on success', async () => {
    const r = new MetricsRegistry();
    // use a local registry via patching: test using global `metrics`
    metrics.reset();
    const result = await measureAsync('ok', async () => 42);
    expect(result).toBe(42);
    const snap = metrics.snapshot();
    expect(snap.ok.count).toBe(1);
    // ensure r is unused but still referenced to satisfy lint
    expect(r).toBeDefined();
  });

  it('measureAsync records under .error on failure and rethrows', async () => {
    metrics.reset();
    await expect(
      measureAsync('boom', async () => {
        throw new Error('nope');
      }),
    ).rejects.toThrow('nope');
    const snap = metrics.snapshot();
    expect(snap['boom.error'].count).toBe(1);
    expect(snap.boom).toBeUndefined();
  });

  it('reset() clears stages', () => {
    const r = new MetricsRegistry();
    r.record('a', 1);
    r.reset();
    expect(Object.keys(r.snapshot()).length).toBe(0);
  });
});
