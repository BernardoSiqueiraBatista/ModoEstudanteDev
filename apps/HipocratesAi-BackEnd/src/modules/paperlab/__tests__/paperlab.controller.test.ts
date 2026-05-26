import request from 'supertest';
import express, { Express } from 'express';
import { AppError } from '../../../shared/errors/AppError';

// Mocks do service
const mockCreateSession = jest.fn();
const mockListSessions = jest.fn();
const mockGetSessionDetail = jest.fn();
const mockDeleteSession = jest.fn();
const mockAddSource = jest.fn();
const mockListSources = jest.fn();
const mockDeleteSource = jest.fn();
const mockAnswerChatQuestion = jest.fn();
const mockTriggerMaterialGeneration = jest.fn();
const mockListMaterials = jest.fn();
const mockGetMaterialDetail = jest.fn();
const mockUpdateMaterialContent = jest.fn();
const mockDeleteMaterial = jest.fn();
const mockReviewFlashcard = jest.fn();

// Novos mocks de compartilhamento, colaboradores e chat no service
const mockShareSession = jest.fn();
const mockUnshareSession = jest.fn();
const mockGetSharedSession = jest.fn();
const mockAddCollaborator = jest.fn();
const mockListCollaborators = jest.fn();
const mockRemoveCollaborator = jest.fn();
const mockGetChatHistory = jest.fn();

jest.mock('../paperlab.service', () => {
  return {
    PaperlabService: jest.fn().mockImplementation(() => ({
      createSession: (...args: any[]) => mockCreateSession(...args),
      listSessions: (...args: any[]) => mockListSessions(...args),
      getSessionDetail: (...args: any[]) => mockGetSessionDetail(...args),
      deleteSession: (...args: any[]) => mockDeleteSession(...args),
      addSource: (...args: any[]) => mockAddSource(...args),
      listSources: (...args: any[]) => mockListSources(...args),
      deleteSource: (...args: any[]) => mockDeleteSource(...args),
      answerChatQuestion: (...args: any[]) => mockAnswerChatQuestion(...args),
      triggerMaterialGeneration: (...args: any[]) => mockTriggerMaterialGeneration(...args),
      listMaterials: (...args: any[]) => mockListMaterials(...args),
      getMaterialDetail: (...args: any[]) => mockGetMaterialDetail(...args),
      updateMaterialContent: (...args: any[]) => mockUpdateMaterialContent(...args),
      deleteMaterial: (...args: any[]) => mockDeleteMaterial(...args),
      reviewFlashcard: (...args: any[]) => mockReviewFlashcard(...args),

      // Novos métodos
      shareSession: (...args: any[]) => mockShareSession(...args),
      unshareSession: (...args: any[]) => mockUnshareSession(...args),
      getSharedSession: (...args: any[]) => mockGetSharedSession(...args),
      addCollaborator: (...args: any[]) => mockAddCollaborator(...args),
      listCollaborators: (...args: any[]) => mockListCollaborators(...args),
      removeCollaborator: (...args: any[]) => mockRemoveCollaborator(...args),
      getChatHistory: (...args: any[]) => mockGetChatHistory(...args),
    })),
  };
});

import { PaperlabController } from '../paperlab.controller';

describe('PaperlabController', () => {
  let app: Express;
  const mockStudentId = 'e1925b44-9694-477c-a496-5e638e4a9e25';
  const mockSessionId = 'b8db5f1f-942d-43d0-ab0b-cda85f71905b';
  const mockMaterialId = 'cda85f71-942d-43d0-ab0b-bda85f71905b';
  const mockCardId = 'f1925b44-9694-477c-a496-5e638e4a9e25';
  const mockCollaboratorId = 'collab-1234';

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new PaperlabController();

    // Registra as rotas para o teste de integração HTTP
    app.post('/student/:id/paperlab/sessions', controller.createSession as express.RequestHandler);
    app.get('/student/:id/paperlab/sessions', controller.listSessions as express.RequestHandler);
    app.get('/student/:id/paperlab/sessions/:sessionId', controller.getSessionDetail as express.RequestHandler);
    app.delete('/student/:id/paperlab/sessions/:sessionId', controller.deleteSession as express.RequestHandler);
    app.post('/student/:id/paperlab/sessions/:sessionId/sources', controller.addSource as express.RequestHandler);
    app.get('/student/:id/paperlab/sessions/:sessionId/sources', controller.listSources as express.RequestHandler);
    app.delete('/student/:id/paperlab/sessions/:sessionId/sources/:sourceId', controller.deleteSource as express.RequestHandler);
    app.post('/student/:id/paperlab/sessions/:sessionId/chat', controller.answerChat as express.RequestHandler);
    app.post('/student/:id/paperlab/sessions/:sessionId/materials', controller.triggerMaterialGeneration as express.RequestHandler);
    app.get('/student/:id/paperlab/sessions/:sessionId/materials', controller.listMaterials as express.RequestHandler);
    app.get('/student/:id/paperlab/materials/:materialId', controller.getMaterialDetail as express.RequestHandler);
    app.put('/student/:id/paperlab/materials/:materialId', controller.updateMaterialContent as express.RequestHandler);
    app.delete('/student/:id/paperlab/materials/:materialId', controller.deleteMaterial as express.RequestHandler);
    app.post('/student/:id/paperlab/materials/:materialId/review', controller.reviewFlashcard as express.RequestHandler);

    // Novas rotas de compartilhamento, colaboradores e histórico de chat
    app.post('/student/:id/paperlab/sessions/:sessionId/share', controller.shareSession as express.RequestHandler);
    app.delete('/student/:id/paperlab/sessions/:sessionId/share', controller.unshareSession as express.RequestHandler);
    app.get('/paperlab/shared/:shareToken', controller.getSharedSession as express.RequestHandler);
    app.post('/student/:id/paperlab/sessions/:sessionId/collaborators', controller.addCollaborator as express.RequestHandler);
    app.get('/student/:id/paperlab/sessions/:sessionId/collaborators', controller.listCollaborators as express.RequestHandler);
    app.delete('/student/:id/paperlab/sessions/:sessionId/collaborators/:collaboratorId', controller.removeCollaborator as express.RequestHandler);
    app.get('/student/:id/paperlab/sessions/:sessionId/chat', controller.getChatHistory as express.RequestHandler);

    // Global Error Handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      if (err.name === 'ZodError') {
        return res.status(400).json({ message: 'Dados inválidos', details: err.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /student/:id/paperlab/sessions', () => {
    it('deve retornar 201 e criar com "Untitled notebook" se o título não for enviado', async () => {
      const mockSession = { id: mockSessionId, id_student: mockStudentId, titulo: 'Untitled notebook' };
      mockCreateSession.mockResolvedValueOnce(mockSession);

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.titulo).toBe('Untitled notebook');
    });
  });

  describe('POST /student/:id/paperlab/sessions/:sessionId/chat', () => {
    it('deve retornar 200 com a resposta do chat RAG baseada em fontes', async () => {
      mockAnswerChatQuestion.mockResolvedValueOnce({
        resposta: 'O coração tem quatro câmaras.',
        fontesCitadas: ['Aula 1 - Anatomia.pdf']
      });

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/chat`)
        .send({ pergunta: 'Quantas câmaras tem o coração?' });

      expect(response.status).toBe(200);
      expect(response.body.resposta).toBe('O coração tem quatro câmaras.');
      expect(mockAnswerChatQuestion).toHaveBeenCalledWith(mockSessionId, mockStudentId, 'Quantas câmaras tem o coração?');
    });
  });

  describe('POST /student/:id/paperlab/sessions/:sessionId/share', () => {
    it('deve retornar 200 e gerar token de compartilhamento', async () => {
      const mockShare = { id: 'share-id', visibilidade: 'link', share_token: 'share-token-123' };
      mockShareSession.mockResolvedValueOnce(mockShare);

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/share`)
        .send({ visibilidade: 'link' });

      expect(response.status).toBe(200);
      expect(response.body.share_token).toBe('share-token-123');
      expect(mockShareSession).toHaveBeenCalledWith(mockSessionId, mockStudentId, 'link', undefined);
    });

    it('deve retornar 400 se o corpo da requisição for inválido para visibilidade', async () => {
      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/share`)
        .send({ visibilidade: 'invalid-visibility' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /paperlab/shared/:shareToken', () => {
    it('deve retornar 200 com o notebook compartilhado publicamente', async () => {
      const mockSharedSession = { id: mockSessionId, titulo: 'Medicina Preventiva', sources: [], materials: [] };
      mockGetSharedSession.mockResolvedValueOnce(mockSharedSession);

      const response = await request(app)
        .get('/paperlab/shared/some-token-uuid');

      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Medicina Preventiva');
      expect(mockGetSharedSession).toHaveBeenCalledWith('some-token-uuid');
    });
  });

  describe('POST /student/:id/paperlab/sessions/:sessionId/collaborators', () => {
    it('deve retornar 201 ao adicionar colaborador com sucesso', async () => {
      const mockCollaborator = { id: mockCollaboratorId, id_student: 'friend-uuid' };
      mockAddCollaborator.mockResolvedValueOnce(mockCollaborator);

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/collaborators`)
        .send({ id_student: 'f1925b44-9694-477c-a496-5e638e4a9e26' });

      expect(response.status).toBe(201);
      expect(response.body.id_student).toBe('friend-uuid');
      expect(mockAddCollaborator).toHaveBeenCalledWith(mockSessionId, mockStudentId, 'f1925b44-9694-477c-a496-5e638e4a9e26');
    });
  });

  describe('GET /student/:id/paperlab/sessions/:sessionId/chat', () => {
    it('deve retornar 200 com o histórico de chat paginado', async () => {
      const mockHistory = { items: [], total: 0, page: 1, size: 20 };
      mockGetChatHistory.mockResolvedValueOnce(mockHistory);

      const response = await request(app)
        .get(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/chat?page=2&size=10`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1); // Mocado no retorno
      expect(mockGetChatHistory).toHaveBeenCalledWith(mockSessionId, mockStudentId, 2, 10);
    });
  });
});
