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

    it('deve retornar 201 ao criar sessão de notebook com sucesso', async () => {
      const mockSession = { id: mockSessionId, id_student: mockStudentId, titulo: 'Patologia Clínica' };
      mockCreateSession.mockResolvedValueOnce(mockSession);

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions`)
        .send({ titulo: 'Patologia Clínica' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(mockSessionId);
      expect(response.body.titulo).toBe('Patologia Clínica');
    });
  });

  describe('POST /student/:id/paperlab/sessions/:sessionId/chat', () => {
    it('deve retornar 400 se a pergunta estiver ausente', async () => {
      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/chat`)
        .send({});

      expect(response.status).toBe(400);
    });

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
      expect(response.body.fontesCitadas).toContain('Aula 1 - Anatomia.pdf');
    });
  });

  describe('POST /student/:id/paperlab/sessions/:sessionId/materials', () => {
    it('deve retornar 202 Accepted ao enfileirar a geração assíncrona do material', async () => {
      const mockMaterial = { id: mockMaterialId, session_id: mockSessionId, tipo: 'resumo', status: 'pending' };
      mockTriggerMaterialGeneration.mockResolvedValueOnce(mockMaterial);

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/sessions/${mockSessionId}/materials`)
        .send({ tipo: 'resumo', prompt: 'Resuma os principais hormônios da tireoide' });

      expect(response.status).toBe(202);
      expect(response.body.id).toBe(mockMaterialId);
      expect(response.body.status).toBe('pending');
    });
  });

  describe('POST /student/:id/paperlab/materials/:materialId/review', () => {
    it('deve retornar 200 ao revisar flashcard com sucesso (Anki)', async () => {
      const mockCard = { id: mockCardId, acertos: 3, erros: 1 };
      mockReviewFlashcard.mockResolvedValueOnce(mockCard);

      const response = await request(app)
        .post(`/student/${mockStudentId}/paperlab/materials/${mockMaterialId}/review`)
        .send({ cardId: mockCardId, resultado: 'acerto' });

      expect(response.status).toBe(200);
      expect(response.body.acertos).toBe(3);
    });
  });
});
