import { performance } from 'node:perf_hooks';

interface StageStats {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  samples: number[];
}

export interface StageSnapshot {
  count: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50: number;
  p95: number;
  p99: number;
}

export class MetricsRegistry {
  private stages = new Map<string, StageStats>();
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  record(stage: string, durationMs: number): void {
    let s = this.stages.get(stage);
    if (!s) {
      s = { count: 0, totalMs: 0, minMs: Infinity, maxMs: 0, samples: [] };
      this.stages.set(stage, s);
    }
    s.count++;
    s.totalMs += durationMs;
    if (durationMs < s.minMs) s.minMs = durationMs;
    if (durationMs > s.maxMs) s.maxMs = durationMs;
    s.samples.push(durationMs);
    if (s.samples.length > 100) s.samples.shift();
  }

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  snapshot(): Record<string, StageSnapshot> {
    const out: Record<string, StageSnapshot> = {};
    for (const [name, s] of this.stages) {
      out[name] = this.stageSnap(s);
    }
    return out;
  }

  private stageSnap(s: StageStats): StageSnapshot {
    const sorted = [...s.samples].sort((a, b) => a - b);
    const q = (p: number): number =>
      sorted.length === 0
        ? 0
        : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
    return {
      count: s.count,
      avgMs: s.count > 0 ? Math.round(s.totalMs / s.count) : 0,
      minMs: s.minMs === Infinity ? 0 : Math.round(s.minMs),
      maxMs: Math.round(s.maxMs),
      p50: Math.round(q(0.5)),
      p95: Math.round(q(0.95)),
      p99: Math.round(q(0.99)),
    };
  }

  reset(): void {
    this.stages.clear();
    this.counters.clear();
    this.gauges.clear();
  }

  /**
   * Serializa em formato Prometheus text.
   * Cada stage vira 4 metricas: count, avg_ms, p95_ms, p99_ms.
   */
  toPrometheus(): string {
    const lines: string[] = [];
    lines.push('# HELP hipocrates_stage_count total invocations per stage');
    lines.push('# TYPE hipocrates_stage_count counter');
    lines.push(
      '# HELP hipocrates_stage_duration_ms latency per stage (avg/p95/p99)',
    );
    lines.push('# TYPE hipocrates_stage_duration_ms gauge');
    for (const [name, s] of this.stages) {
      const snap = this.stageSnap(s);
      const esc = name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`hipocrates_stage_count{stage="${esc}"} ${snap.count}`);
      lines.push(
        `hipocrates_stage_duration_ms{stage="${esc}",quantile="avg"} ${snap.avgMs}`,
      );
      lines.push(
        `hipocrates_stage_duration_ms{stage="${esc}",quantile="0.5"} ${snap.p50}`,
      );
      lines.push(
        `hipocrates_stage_duration_ms{stage="${esc}",quantile="0.95"} ${snap.p95}`,
      );
      lines.push(
        `hipocrates_stage_duration_ms{stage="${esc}",quantile="0.99"} ${snap.p99}`,
      );
    }
    lines.push('# HELP hipocrates_counter total event counters');
    lines.push('# TYPE hipocrates_counter counter');
    for (const [name, value] of this.counters) {
      const esc = name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`hipocrates_counter{name="${esc}"} ${value}`);
    }
    lines.push('# HELP hipocrates_gauge point-in-time gauges');
    lines.push('# TYPE hipocrates_gauge gauge');
    for (const [name, value] of this.gauges) {
      const esc = name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`hipocrates_gauge{name="${esc}"} ${value}`);
    }
    return lines.join('\n') + '\n';
  }
}

export const metrics = new MetricsRegistry();

/**
 * Measure an async function's duration and record it under `stage`.
 * On failure, records under `${stage}.error` and rethrows.
 */
export async function measureAsync<T>(
  stage: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    metrics.record(stage, performance.now() - start);
    return result;
  } catch (err) {
    metrics.record(`${stage}.error`, performance.now() - start);
    throw err;
  }
}
