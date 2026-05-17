import request from 'supertest';
import express, { Express } from 'express';
const mockGetDashboard = jest.fn();
const mockGetStudyDistribution = jest.fn();

jest.mock('../student-dashboard.service', () => {
  return {
    StudentDashboardService: jest.fn().mockImplementation(() => ({
      getDashboard: (...args: any[]) => mockGetDashboard(...args),
      getStudyDistribution: (...args: any[]) => mockGetStudyDistribution(...args)
    }))
  };
});

import { StudentDashboardController } from '../student-dashboard.controller';
import { AppError } from '../../../shared/errors/AppError';

describe('StudentDashboardController', () => {
  let app: Express;
  const mockStudentId = 'estudante-123';

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    
    const controller = new StudentDashboardController();
    
    app.get('/student/:id/dashboard', controller.getDashboard as express.RequestHandler);
    app.get('/student/:id/study-distribution', controller.getStudyDistribution as express.RequestHandler);

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

  it('GET /dashboard deve retornar 200 com os dados', async () => {
    mockGetDashboard.mockResolvedValueOnce({ kpis: { scoreGeral: 820 } });
    
    const response = await request(app).get(`/student/${mockStudentId}/dashboard`);
    expect(response.status).toBe(200);
    expect(response.body.data.kpis.scoreGeral).toBe(820);
  });

  it('GET /study-distribution deve retornar 200 com a distribuicao', async () => {
    mockGetStudyDistribution.mockResolvedValueOnce([
      { area: 'Cardiologia', percentual: 25 }
    ]);

    const response = await request(app).get(`/student/${mockStudentId}/study-distribution`);
    expect(response.status).toBe(200);
    expect(response.body.data[0].area).toBe('Cardiologia');
  });

  it('GET /dashboard deve repassar 404 se aluno não existir (AppError)', async () => {
    mockGetDashboard.mockRejectedValueOnce(new AppError('Estudante não encontrado.', 404));

    const response = await request(app).get(`/student/nao-existe/dashboard`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Estudante não encontrado.');
  });
});
