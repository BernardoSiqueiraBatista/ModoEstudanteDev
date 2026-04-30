import type { Request, Response, NextFunction } from 'express';
import { metrics } from '../../shared/metrics/metrics';
import { env } from '../../config/env';

/**
 * Guard for the /metrics endpoint using a shared secret header.
 * If METRICS_TOKEN is empty (dev), access is open.
 * In production, this should ALSO be placed behind a reverse-proxy ACL —
 * this endpoint is not intended to be publicly exposed.
 */
export function requireMetricsToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = env.METRICS_TOKEN;
  if (!token) {
    next();
    return;
  }
  if (req.headers['x-metrics-token'] !== token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

export function getMetricsController(req: Request, res: Response): void {
  // Suporta formato Prometheus se Accept inclui text/plain
  const wantsPrometheus =
    req.query.format === 'prometheus' ||
    String(req.headers['accept'] || '').includes('text/plain');

  if (wantsPrometheus) {
    res.type('text/plain; version=0.0.4');
    res.send(metrics.toPrometheus());
    return;
  }

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stages: metrics.snapshot(),
  });
}
