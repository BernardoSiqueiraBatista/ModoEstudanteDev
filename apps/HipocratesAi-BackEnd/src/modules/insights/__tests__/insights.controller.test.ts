import request from 'supertest';
import express, { Express } from 'express';
const mockGetLastInsight = jest.fn();
const mockGenerateInsight = jest.fn();

jest.mock('../insights.service', () => {
  return {
    InsightsService: jest.fn().mockImplementation(() => ({
      getLastInsight: (...args: any[]) => mockGetLastInsight(...args),
      generateInsight: (...args: any[]) => mockGenerateInsight(...args)
    }))
  };
});

import { InsightsController } from '../insights.controller';
import { AppError } from '../../../shared/errors/AppError';

describe('InsightsController', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new InsightsController();
    app.get('/student/:id/insights', controller.getInsights as express.RequestHandler);
    app.post('/student/:id/insights/regenerate', controller.regenerateInsights as express.RequestHandler);

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /insights deve retornar 200 com insight ou null', async () => {
    mockGetLastInsight.mockResolvedValueOnce({ id: 'insight-1' });
    
    const response = await request(app).get('/student/estudante-1/insights');
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('insight-1');
  });

  it('POST /insights/regenerate deve gerar novo e retornar 201', async () => {
    mockGenerateInsight.mockResolvedValueOnce({ id: 'novo-insight' });

    const response = await request(app).post('/student/estudante-1/insights/regenerate');
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('novo-insight');
  });

  it('POST /insights/regenerate deve repassar AppError de rate limit 429', async () => {
    mockGenerateInsight.mockRejectedValueOnce(new AppError('Aguarde 6h', 429));

    const response = await request(app).post('/student/estudante-1/insights/regenerate');
    expect(response.status).toBe(429);
    expect(response.body.message).toBe('Aguarde 6h');
  });
});
