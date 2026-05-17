import request from 'supertest';
import express, { Express } from 'express';
const mockGetCalculatedPerformance = jest.fn();

jest.mock('../performance.service', () => {
  return {
    PerformanceService: jest.fn().mockImplementation(() => ({
      getCalculatedPerformance: (...args: any[]) => mockGetCalculatedPerformance(...args)
    }))
  };
});

import { PerformanceController } from '../performance.controller';
import { PerformanceService } from '../performance.service';
import { AppError } from '../../../shared/errors/AppError';

describe('PerformanceController', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new PerformanceController();
    app.get('/student/performance/:id', controller.getStats as express.RequestHandler);
    
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

  it('Deve retornar 404 se o aluno não existir (simulado via throw AppError 404)', async () => {
    mockGetCalculatedPerformance.mockRejectedValueOnce(new AppError('Usuário não existe.', 404));

    const response = await request(app).get('/student/performance/id-inexistente');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Usuário não existe.');
  });

  it('Deve retornar 200 com os dados de performance para UUID válido', async () => {
    mockGetCalculatedPerformance.mockResolvedValueOnce({
      taxaAcertos: 0.75,
      questoesResolvidas: 100,
      tempoEstudo: 3600
    });

    const response = await request(app).get('/student/performance/id-valido');
    expect(response.status).toBe(200);
    expect(response.body.data.taxaAcertos).toBe(0.75);
  });
});
