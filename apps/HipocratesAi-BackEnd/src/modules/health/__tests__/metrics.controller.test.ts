import express from 'express';
import request from 'supertest';
import {
  getMetricsController,
  requireMetricsToken,
} from '../metrics.controller';

describe('metrics.controller', () => {
  function makeApp(): express.Express {
    const app = express();
    app.get('/metrics', requireMetricsToken, getMetricsController);
    return app;
  }

  afterEach(() => {
    delete process.env.METRICS_TOKEN;
  });

  it('returns 200 with expected shape when no token configured', async () => {
    const res = await request(makeApp()).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('stages');
  });

  it('returns 401 when METRICS_TOKEN is set and header missing/wrong', async () => {
    // Re-require env after setting token so the guard sees it.
    process.env.METRICS_TOKEN = 'secret-token';
    jest.resetModules();
    const mod = await import('../metrics.controller');
    const app = express();
    app.get('/metrics', mod.requireMetricsToken, mod.getMetricsController);

    const res = await request(app)
      .get('/metrics')
      .set('x-metrics-token', 'wrong');
    expect(res.status).toBe(401);
  });
});
