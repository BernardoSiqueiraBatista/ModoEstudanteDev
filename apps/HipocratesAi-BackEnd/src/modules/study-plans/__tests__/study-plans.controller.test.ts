import request from 'supertest';
import express, { Express } from 'express';
import { AppError } from '../../../shared/errors/AppError';

const mockGenerateStudyPlan = jest.fn();
const mockListPlans = jest.fn();
const mockGetPlanDetails = jest.fn();
const mockUpdateBlockStatus = jest.fn();
const mockDeletePlan = jest.fn();

jest.mock('../study-plans.service', () => {
  return {
    StudyPlansService: jest.fn().mockImplementation(() => ({
      generateStudyPlan: (...args: any[]) => mockGenerateStudyPlan(...args),
      listPlans: (...args: any[]) => mockListPlans(...args),
      getPlanDetails: (...args: any[]) => mockGetPlanDetails(...args),
      updateBlockStatus: (...args: any[]) => mockUpdateBlockStatus(...args),
      deletePlan: (...args: any[]) => mockDeletePlan(...args)
    }))
  };
});

import { StudyPlansController } from '../study-plans.controller';

describe('StudyPlansController', () => {
  let app: Express;
  const mockStudentId = 'student-123';

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new StudyPlansController();
    
    app.post('/student/:studentId/study-plans', controller.createPlan as express.RequestHandler);
    app.get('/student/:studentId/study-plans', controller.listPlans as express.RequestHandler);
    app.get('/student/study-plans/:planId', controller.getPlanDetails as express.RequestHandler);
    app.patch('/student/study-plans/blocks/:blockId/status', controller.updateBlock as express.RequestHandler);
    app.delete('/student/:studentId/study-plans/:planId', controller.deletePlan as express.RequestHandler);

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

  it('POST /study-plans: deve retornar 400 se validacao do Zod falhar', async () => {
    const response = await request(app).post(`/student/${mockStudentId}/study-plans`).send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dados inválidos');
  });

  it('POST /study-plans: deve retornar 201 com payload validado', async () => {
    mockGenerateStudyPlan.mockResolvedValueOnce({ plan: { id: 'p1' }, blocks: [] });
    
    const validPayload = {
      titulo: 'Meu plano',
      areas_foco: ['Cardiologia'],
      duracao: 'semanal',
      horas_por_dia: 2,
      dias_semana: ['segunda'],
      briefing: 'Estudar para residencia médica'
    };

    const response = await request(app)
      .post(`/student/${mockStudentId}/study-plans`)
      .send(validPayload);
      
    expect(response.status).toBe(201);
    expect(response.body.plan.id).toBe('p1');
  });

  it('GET /study-plans: lista planos', async () => {
    mockListPlans.mockResolvedValueOnce([{ id: 'p1' }]);
    const response = await request(app).get(`/student/${mockStudentId}/study-plans`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('GET /study-plans/:planId: detalhes do plano', async () => {
    mockGetPlanDetails.mockResolvedValueOnce({ plan: { id: 'p1' }, blocks: [] });
    const response = await request(app).get('/student/study-plans/p1');
    expect(response.status).toBe(200);
    expect(response.body.plan.id).toBe('p1');
  });

  it('PATCH /study-plans/blocks/:blockId/status: atualiza status (200)', async () => {
    mockUpdateBlockStatus.mockResolvedValueOnce({ id: 'b1', status: 'concluido' });
    const response = await request(app)
      .patch('/student/study-plans/blocks/b1/status')
      .send({ status: 'concluido' });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('concluido');
  });

  it('DELETE /study-plans/:planId: deleta plano (204)', async () => {
    mockDeletePlan.mockResolvedValueOnce(undefined);
    const response = await request(app).delete(`/student/${mockStudentId}/study-plans/p1`);
    expect(response.status).toBe(204);
  });
});
