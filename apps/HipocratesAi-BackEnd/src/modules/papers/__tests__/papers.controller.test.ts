import request from 'supertest';
import express, { Express } from 'express';
import { AppError } from '../../../shared/errors/AppError';

// Mocks do service
const mockCreatePaper = jest.fn();
const mockListPapers = jest.fn();
const mockGetPaper = jest.fn();
const mockUpdatePaper = jest.fn();
const mockDeletePaper = jest.fn();
const mockSharePaper = jest.fn();
const mockGetSharedPaper = jest.fn();

jest.mock('../papers.service', () => {
  return {
    PapersService: jest.fn().mockImplementation(() => ({
      createPaper: (...args: any[]) => mockCreatePaper(...args),
      listPapers: (...args: any[]) => mockListPapers(...args),
      getPaper: (...args: any[]) => mockGetPaper(...args),
      updatePaper: (...args: any[]) => mockUpdatePaper(...args),
      deletePaper: (...args: any[]) => mockDeletePaper(...args),
      sharePaper: (...args: any[]) => mockSharePaper(...args),
      getSharedPaper: (...args: any[]) => mockGetSharedPaper(...args),
    })),
  };
});

import { PapersController } from '../papers.controller';

describe('PapersController', () => {
  let app: Express;
  const mockStudentId = 'student-uuid-123';
  const mockPaperId = 'paper-uuid-456';
  const mockShareToken = 'share-token-uuid-789';

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new PapersController();

    // Rotas do studentRouter
    app.post('/student/:id/papers', controller.createPaper as express.RequestHandler);
    app.get('/student/:id/papers', controller.listPapers as express.RequestHandler);
    app.get('/student/:id/papers/:paperId', controller.getPaper as express.RequestHandler);
    app.put('/student/:id/papers/:paperId', controller.updatePaper as express.RequestHandler);
    app.delete('/student/:id/papers/:paperId', controller.deletePaper as express.RequestHandler);
    app.post('/student/:id/papers/:paperId/share', controller.sharePaper as express.RequestHandler);

    // Rota pública
    app.get('/papers/shared/:shareToken', controller.getSharedPaper as express.RequestHandler);

    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE =====
  describe('POST /student/:id/papers', () => {
    it('deve retornar 400 se validação do Zod falhar (body vazio)', async () => {
      const response = await request(app)
        .post(`/student/${mockStudentId}/papers`)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Dados inválidos');
    });

    it('deve retornar 400 se titulo estiver ausente', async () => {
      const response = await request(app)
        .post(`/student/${mockStudentId}/papers`)
        .send({ conteudo: 'Algum conteúdo' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Dados inválidos');
    });

    it('deve retornar 201 com payload válido', async () => {
      const mockPaper = {
        id: mockPaperId,
        id_student: mockStudentId,
        titulo: 'Cardiologia Avançada',
        conteudo: '# Introdução\nConteúdo em markdown',
        conteudo_tipo: 'markdown',
        tags: ['cardiologia'],
        status: 'rascunho',
        criado_em: '2026-05-23T12:00:00Z',
        atualizado_em: '2026-05-23T12:00:00Z',
      };
      mockCreatePaper.mockResolvedValueOnce(mockPaper);

      const response = await request(app)
        .post(`/student/${mockStudentId}/papers`)
        .send({
          titulo: 'Cardiologia Avançada',
          conteudo: '# Introdução\nConteúdo em markdown',
          tags: ['cardiologia'],
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(mockPaperId);
      expect(response.body.titulo).toBe('Cardiologia Avançada');
      expect(mockCreatePaper).toHaveBeenCalledWith(
        mockStudentId,
        expect.objectContaining({
          titulo: 'Cardiologia Avançada',
          conteudo: '# Introdução\nConteúdo em markdown',
          conteudo_tipo: 'markdown', // default
          tags: ['cardiologia'],
          status: 'rascunho', // default
        }),
      );
    });

    it('deve aplicar defaults para conteudo_tipo e status', async () => {
      mockCreatePaper.mockResolvedValueOnce({ id: '1' });

      await request(app)
        .post(`/student/${mockStudentId}/papers`)
        .send({ titulo: 'Test', conteudo: 'Content' });

      expect(mockCreatePaper).toHaveBeenCalledWith(
        mockStudentId,
        expect.objectContaining({
          conteudo_tipo: 'markdown',
          status: 'rascunho',
          tags: [],
        }),
      );
    });
  });

  // ===== LIST =====
  describe('GET /student/:id/papers', () => {
    it('deve retornar 200 com lista paginada', async () => {
      const mockResult = {
        data: [{ id: '1', titulo: 'Paper 1' }],
        pagination: { page: 1, size: 20, total: 1, totalPages: 1 },
      };
      mockListPapers.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .get(`/student/${mockStudentId}/papers`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('deve passar filtros de query params ao service', async () => {
      mockListPapers.mockResolvedValueOnce({
        data: [],
        pagination: { page: 2, size: 10, total: 0, totalPages: 0 },
      });

      await request(app)
        .get(`/student/${mockStudentId}/papers?page=2&size=10&status=publicado&tag=neuro`);

      expect(mockListPapers).toHaveBeenCalledWith(
        mockStudentId,
        expect.objectContaining({
          page: 2,
          size: 10,
          status: 'publicado',
          tag: 'neuro',
        }),
      );
    });

    it('deve retornar lista vazia quando não há papers', async () => {
      mockListPapers.mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, size: 20, total: 0, totalPages: 0 },
      });

      const response = await request(app)
        .get(`/student/${mockStudentId}/papers`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  // ===== GET BY ID =====
  describe('GET /student/:id/papers/:paperId', () => {
    it('deve retornar 200 com detalhes do paper', async () => {
      const mockPaper = { id: mockPaperId, titulo: 'Paper Detalhado' };
      mockGetPaper.mockResolvedValueOnce(mockPaper);

      const response = await request(app)
        .get(`/student/${mockStudentId}/papers/${mockPaperId}`);

      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Paper Detalhado');
    });

    it('deve retornar 404 quando paper não existe', async () => {
      mockGetPaper.mockRejectedValueOnce(new AppError('Paper não encontrado.', 404));

      const response = await request(app)
        .get(`/student/${mockStudentId}/papers/inexistente`);

      expect(response.status).toBe(404);
    });
  });

  // ===== UPDATE =====
  describe('PUT /student/:id/papers/:paperId', () => {
    it('deve retornar 200 com paper atualizado', async () => {
      const updatedPaper = { id: mockPaperId, titulo: 'Título Atualizado' };
      mockUpdatePaper.mockResolvedValueOnce(updatedPaper);

      const response = await request(app)
        .put(`/student/${mockStudentId}/papers/${mockPaperId}`)
        .send({ titulo: 'Título Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Título Atualizado');
    });

    it('deve retornar 400 com dados inválidos', async () => {
      const response = await request(app)
        .put(`/student/${mockStudentId}/papers/${mockPaperId}`)
        .send({ titulo: '' }); // min length 1

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Dados inválidos');
    });

    it('deve retornar 404 quando paper não existe', async () => {
      mockUpdatePaper.mockRejectedValueOnce(new AppError('Paper não encontrado.', 404));

      const response = await request(app)
        .put(`/student/${mockStudentId}/papers/inexistente`)
        .send({ titulo: 'Novo Título' });

      expect(response.status).toBe(404);
    });
  });

  // ===== DELETE =====
  describe('DELETE /student/:id/papers/:paperId', () => {
    it('deve retornar 204 ao deletar paper', async () => {
      mockDeletePaper.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete(`/student/${mockStudentId}/papers/${mockPaperId}`);

      expect(response.status).toBe(204);
    });

    it('deve retornar 404 quando paper não existe', async () => {
      mockDeletePaper.mockRejectedValueOnce(new AppError('Paper não encontrado.', 404));

      const response = await request(app)
        .delete(`/student/${mockStudentId}/papers/inexistente`);

      expect(response.status).toBe(404);
    });
  });

  // ===== SHARE =====
  describe('POST /student/:id/papers/:paperId/share', () => {
    it('deve retornar 201 com dados de compartilhamento', async () => {
      const shareResult = {
        share_token: mockShareToken,
        url: `/papers/shared/${mockShareToken}`,
        visibilidade: 'link',
        expira_em: null,
      };
      mockSharePaper.mockResolvedValueOnce(shareResult);

      const response = await request(app)
        .post(`/student/${mockStudentId}/papers/${mockPaperId}/share`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.share_token).toBe(mockShareToken);
      expect(response.body.url).toContain('/papers/shared/');
    });

    it('deve retornar 404 quando paper não existe', async () => {
      mockSharePaper.mockRejectedValueOnce(new AppError('Paper não encontrado.', 404));

      const response = await request(app)
        .post(`/student/${mockStudentId}/papers/inexistente/share`)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  // ===== SHARED (Público) =====
  describe('GET /papers/shared/:shareToken', () => {
    it('deve retornar 200 com paper compartilhado', async () => {
      const sharedPaper = { id: mockPaperId, titulo: 'Paper Público' };
      mockGetSharedPaper.mockResolvedValueOnce(sharedPaper);

      const response = await request(app)
        .get(`/papers/shared/${mockShareToken}`);

      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Paper Público');
    });

    it('deve retornar 404 com token inválido', async () => {
      mockGetSharedPaper.mockRejectedValueOnce(
        new AppError('Paper não encontrado ou link inválido.', 404),
      );

      const response = await request(app)
        .get('/papers/shared/token-invalido');

      expect(response.status).toBe(404);
    });

    it('deve retornar 410 quando link expirou', async () => {
      mockGetSharedPaper.mockRejectedValueOnce(
        new AppError('O link de compartilhamento expirou.', 410),
      );

      const response = await request(app)
        .get(`/papers/shared/${mockShareToken}`);

      expect(response.status).toBe(410);
    });
  });
});
