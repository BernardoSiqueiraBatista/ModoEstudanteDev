import request from 'supertest';
import express, { Express } from 'express';
import { AppError } from '../../../shared/errors/AppError';

// Mocks
const mockListByPlan = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock('../fixed-commitments.service', () => {
  return {
    FixedCommitmentsService: jest.fn().mockImplementation(() => ({
      listByPlan: (...args: any[]) => mockListByPlan(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
      delete: (...args: any[]) => mockDelete(...args),
    })),
  };
});

import { FixedCommitmentsController } from '../fixed-commitments.controller';

describe('FixedCommitmentsController', () => {
  let app: Express;
  const mockPlanId = '00000000-0000-0000-0000-000000000001';
  const mockCommitmentId = '00000000-0000-0000-0000-000000000002';

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new FixedCommitmentsController();

    app.get('/study-plans/:id/fixed-commitments', controller.listCommitments as express.RequestHandler);
    app.post('/study-plans/:id/fixed-commitments', controller.createCommitment as express.RequestHandler);
    app.patch('/study-plans/:id/fixed-commitments/:cid', controller.updateCommitment as express.RequestHandler);
    app.delete('/study-plans/:id/fixed-commitments/:cid', controller.deleteCommitment as express.RequestHandler);

    // Error handler (simula errorMiddleware)
    app.use((err: any, _req: any, res: any, _next: any) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ erro: err.message, codigo: err.statusCode });
      }
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET ───────────────────────────────────────────────────────────

  describe('GET /:id/fixed-commitments', () => {
    it('deve listar compromissos fixos do plano (200)', async () => {
      const mockData = [
        { id: mockCommitmentId, id_plan: mockPlanId, dia: 'seg', inicio: '08:00', fim: '10:00', label: 'Aula', tipo: 'compromisso_fixo' },
      ];
      mockListByPlan.mockResolvedValueOnce(mockData);

      const response = await request(app).get(`/study-plans/${mockPlanId}/fixed-commitments`);

      expect(response.status).toBe(200);
      expect(response.body.compromissos_fixos).toHaveLength(1);
      expect(response.body.compromissos_fixos[0].dia).toBe('seg');
      expect(mockListByPlan).toHaveBeenCalledWith(mockPlanId);
    });

    it('deve retornar array vazio quando não há compromissos (200)', async () => {
      mockListByPlan.mockResolvedValueOnce([]);

      const response = await request(app).get(`/study-plans/${mockPlanId}/fixed-commitments`);

      expect(response.status).toBe(200);
      expect(response.body.compromissos_fixos).toHaveLength(0);
    });
  });

  // ─── POST ──────────────────────────────────────────────────────────

  describe('POST /:id/fixed-commitments', () => {
    const validPayload = {
      dia: 'qua',
      inicio: '14:00',
      fim: '16:00',
      label: 'Aula de Cardio',
      tipo: 'compromisso_fixo',
    };

    it('deve criar compromisso fixo com dados válidos (201)', async () => {
      const mockCreated = { id: mockCommitmentId, id_plan: mockPlanId, ...validPayload };
      mockCreate.mockResolvedValueOnce(mockCreated);

      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(mockCommitmentId);
      expect(response.body.dia).toBe('qua');
      expect(mockCreate).toHaveBeenCalledWith(mockPlanId, expect.objectContaining({
        dia: 'qua',
        inicio: '14:00',
        fim: '16:00',
      }));
    });

    it('deve retornar 409 quando há overlap (Conflict)', async () => {
      mockCreate.mockRejectedValueOnce(
        new AppError('Conflito de horário: já existe um compromisso fixo em qua que se sobrepõe ao intervalo 14:00–16:00.', 409)
      );

      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send(validPayload);

      expect(response.status).toBe(409);
      expect(response.body.erro).toContain('Conflito');
    });

    it('deve retornar 422 com dia inválido', async () => {
      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send({ ...validPayload, dia: 'invalido' });

      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('Dados inválidos');
    });

    it('deve retornar 422 com formato de horário inválido', async () => {
      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send({ ...validPayload, inicio: '25:00' });

      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('Dados inválidos');
    });

    it('deve retornar 422 com inicio em formato textual', async () => {
      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send({ ...validPayload, inicio: 'dez horas' });

      expect(response.status).toBe(422);
    });

    it('deve retornar 422 quando fim <= inicio', async () => {
      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send({ ...validPayload, inicio: '16:00', fim: '14:00' });

      expect(response.status).toBe(422);
    });

    it('deve retornar 422 quando fim == inicio', async () => {
      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send({ ...validPayload, inicio: '14:00', fim: '14:00' });

      expect(response.status).toBe(422);
    });

    it('deve aceitar criação sem label (campo opcional)', async () => {
      const payloadSemLabel = { dia: 'seg', inicio: '08:00', fim: '10:00' };
      const mockCreated = { id: mockCommitmentId, id_plan: mockPlanId, ...payloadSemLabel, label: null, tipo: 'compromisso_fixo' };
      mockCreate.mockResolvedValueOnce(mockCreated);

      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send(payloadSemLabel);

      expect(response.status).toBe(201);
    });

    it('deve usar tipo default "compromisso_fixo" quando não informado', async () => {
      const payloadSemTipo = { dia: 'seg', inicio: '08:00', fim: '10:00' };
      const mockCreated = { id: mockCommitmentId, id_plan: mockPlanId, ...payloadSemTipo, tipo: 'compromisso_fixo' };
      mockCreate.mockResolvedValueOnce(mockCreated);

      const response = await request(app)
        .post(`/study-plans/${mockPlanId}/fixed-commitments`)
        .send(payloadSemTipo);

      expect(response.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(
        mockPlanId,
        expect.objectContaining({ tipo: 'compromisso_fixo' })
      );
    });
  });

  // ─── PATCH ─────────────────────────────────────────────────────────

  describe('PATCH /:id/fixed-commitments/:cid', () => {
    it('deve atualizar parcialmente um compromisso fixo (200)', async () => {
      const mockUpdated = {
        id: mockCommitmentId,
        id_plan: mockPlanId,
        dia: 'qua',
        inicio: '15:00',
        fim: '17:00',
        label: 'Aula atualizada',
        tipo: 'compromisso_fixo',
      };
      mockUpdate.mockResolvedValueOnce(mockUpdated);

      const response = await request(app)
        .patch(`/study-plans/${mockPlanId}/fixed-commitments/${mockCommitmentId}`)
        .send({ label: 'Aula atualizada' });

      expect(response.status).toBe(200);
      expect(response.body.label).toBe('Aula atualizada');
      expect(mockUpdate).toHaveBeenCalledWith(
        mockCommitmentId,
        expect.objectContaining({ label: 'Aula atualizada' })
      );
    });

    it('deve retornar 409 quando atualização causa overlap', async () => {
      mockUpdate.mockRejectedValueOnce(
        new AppError('Conflito de horário.', 409)
      );

      const response = await request(app)
        .patch(`/study-plans/${mockPlanId}/fixed-commitments/${mockCommitmentId}`)
        .send({ inicio: '08:00', fim: '10:00' });

      expect(response.status).toBe(409);
    });

    it('deve retornar 404 quando compromisso não existe', async () => {
      mockUpdate.mockRejectedValueOnce(
        new AppError('Compromisso fixo não encontrado.', 404)
      );

      const response = await request(app)
        .patch(`/study-plans/${mockPlanId}/fixed-commitments/inexistente`)
        .send({ label: 'Novo label' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 422 com formato de horário inválido no PATCH', async () => {
      const response = await request(app)
        .patch(`/study-plans/${mockPlanId}/fixed-commitments/${mockCommitmentId}`)
        .send({ inicio: '99:99' });

      expect(response.status).toBe(422);
    });
  });

  // ─── DELETE ────────────────────────────────────────────────────────

  describe('DELETE /:id/fixed-commitments/:cid', () => {
    it('deve excluir compromisso fixo (204)', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete(`/study-plans/${mockPlanId}/fixed-commitments/${mockCommitmentId}`);

      expect(response.status).toBe(204);
      expect(mockDelete).toHaveBeenCalledWith(mockCommitmentId);
    });

    it('deve retornar 404 quando compromisso não existe', async () => {
      mockDelete.mockRejectedValueOnce(
        new AppError('Compromisso fixo não encontrado.', 404)
      );

      const response = await request(app)
        .delete(`/study-plans/${mockPlanId}/fixed-commitments/inexistente`);

      expect(response.status).toBe(404);
    });
  });
});
