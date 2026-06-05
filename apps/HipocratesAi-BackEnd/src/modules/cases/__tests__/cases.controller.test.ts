import request from 'supertest';
import express, { Express } from 'express';
import { AppError } from '../../../shared/errors/AppError';

// ---------------------------------------------------------------------------
// Mocks do service
// ---------------------------------------------------------------------------

const mockGetIntro = jest.fn();
const mockStartAttempt = jest.fn();
const mockRegisterEvent = jest.fn();
const mockFinishAttempt = jest.fn();

jest.mock('../cases.service', () => {
  return {
    CasesService: jest.fn().mockImplementation(() => ({
      getIntro: (...args: any[]) => mockGetIntro(...args),
      startAttempt: (...args: any[]) => mockStartAttempt(...args),
      registerEvent: (...args: any[]) => mockRegisterEvent(...args),
      finishAttempt: (...args: any[]) => mockFinishAttempt(...args),
    })),
  };
});

import { CasesController } from '../cases.controller';

describe('CasesController', () => {
  let app: Express;
  const mockCaseId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const mockStudentId = '00000000-0000-4000-8000-000000000001';
  const mockAttemptId = '00000000-0000-4000-8000-000000000002';

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new CasesController();

    // Rotas Task 7
    app.get('/student/v1/cases/:id/intro', controller.getIntro as express.RequestHandler);
    app.post('/student/v1/cases/:id/attempts', controller.startAttempt as express.RequestHandler);
    app.post('/student/v1/cases/attempts/:aid/events', controller.registerEvent as express.RequestHandler);
    app.post('/student/v1/cases/attempts/:aid/finish', controller.finishAttempt as express.RequestHandler);

    // Error handler (mesmo padrão do errorMiddleware)
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

  // =========================================================================
  // GET /:id/intro
  // =========================================================================

  describe('GET /student/v1/cases/:id/intro', () => {
    it('deve retornar 200 com resumo do caso', async () => {
      const mockIntro = {
        id: mockCaseId,
        titulo: 'Dor torácica em paciente hipertenso',
        descricao: 'Homem de 45 anos...',
        especialidade: 'Cardiologia',
        dificuldade: 'media',
        tempo_estimado_min: 20,
        checklist_osce: [
          { criterio: 'Anamnese', itens: ['Investigou OPQRST'] },
        ],
        recursos_habilitados: { audio_imersivo: true },
      };
      mockGetIntro.mockResolvedValueOnce(mockIntro);

      const response = await request(app)
        .get(`/student/v1/cases/${mockCaseId}/intro`);

      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Dor torácica em paciente hipertenso');
      expect(response.body.especialidade).toBe('Cardiologia');
      expect(response.body.checklist_osce).toHaveLength(1);
      expect(response.body.recursos_habilitados.audio_imersivo).toBe(true);
      expect(mockGetIntro).toHaveBeenCalledWith(mockCaseId);
    });

    it('deve retornar 404 para caso inexistente', async () => {
      mockGetIntro.mockRejectedValueOnce(new AppError('Caso não encontrado.', 404));

      const response = await request(app)
        .get('/student/v1/cases/inexistente/intro');

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // POST /:id/attempts
  // =========================================================================

  describe('POST /student/v1/cases/:id/attempts', () => {
    it('deve retornar 201 ao criar attempt OSCE', async () => {
      const mockResult = {
        attempt_id: mockAttemptId,
        sessao: {
          case_id: mockCaseId,
          titulo: 'Dor torácica em paciente hipertenso',
          paciente: { nome: 'Carlos Alberto', idade: 45 },
          queixa_principal: 'Dor torácica em aperto',
        },
        modo: 'osce',
      };
      mockStartAttempt.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .post(`/student/v1/cases/${mockCaseId}/attempts`)
        .send({ modo: 'osce', student_id: mockStudentId });

      expect(response.status).toBe(201);
      expect(response.body.attempt_id).toBe(mockAttemptId);
      expect(response.body.modo).toBe('osce');
      expect(response.body.sessao.titulo).toBe('Dor torácica em paciente hipertenso');
      expect(mockStartAttempt).toHaveBeenCalledWith(mockCaseId, mockStudentId, 'osce');
    });

    it('deve retornar 201 ao criar attempt HM', async () => {
      const mockResult = {
        attempt_id: mockAttemptId,
        sessao: { case_id: mockCaseId, titulo: 'Caso teste', paciente: {}, queixa_principal: '' },
        modo: 'hm',
      };
      mockStartAttempt.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .post(`/student/v1/cases/${mockCaseId}/attempts`)
        .send({ modo: 'hm', student_id: mockStudentId });

      expect(response.status).toBe(201);
      expect(response.body.modo).toBe('hm');
    });

    it('deve retornar 422 com body inválido (modo ausente)', async () => {
      const response = await request(app)
        .post(`/student/v1/cases/${mockCaseId}/attempts`)
        .send({ student_id: mockStudentId });

      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('Dados inválidos');
    });

    it('deve retornar 422 com modo inválido', async () => {
      const response = await request(app)
        .post(`/student/v1/cases/${mockCaseId}/attempts`)
        .send({ modo: 'invalido', student_id: mockStudentId });

      expect(response.status).toBe(422);
    });

    it('deve retornar 422 com student_id inválido', async () => {
      const response = await request(app)
        .post(`/student/v1/cases/${mockCaseId}/attempts`)
        .send({ modo: 'osce', student_id: 'nao-uuid' });

      expect(response.status).toBe(422);
    });

    it('deve retornar 404 quando caso não existe', async () => {
      mockStartAttempt.mockRejectedValueOnce(new AppError('Caso não encontrado.', 404));

      const response = await request(app)
        .post('/student/v1/cases/inexistente/attempts')
        .send({ modo: 'osce', student_id: mockStudentId });

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // POST /attempts/:aid/events
  // =========================================================================

  describe('POST /student/v1/cases/attempts/:aid/events', () => {
    it('deve retornar 200 ao registrar evento OSCE com acumulado', async () => {
      const mockResult = {
        acumulado: 70,
        notificacao: { texto: '+10 pts — auscultação correta', ttl_ms: 2500 },
      };
      mockRegisterEvent.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({
          tipo: 'procedimento_correto',
          ref: 'auscultacao_cardiaca',
          pontos: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.acumulado).toBe(70);
      expect(response.body.notificacao.texto).toContain('+10 pts');
      expect(response.body.notificacao.ttl_ms).toBe(2500);
    });

    it('deve retornar 200 ao registrar evento de erro (pontos negativos)', async () => {
      const mockResult = {
        acumulado: 60,
        notificacao: { texto: '-10 pts — erro — atraso conduta', ttl_ms: 2500 },
      };
      mockRegisterEvent.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({
          tipo: 'erro',
          ref: 'atraso_conduta',
          pontos: -10,
        });

      expect(response.status).toBe(200);
      expect(response.body.acumulado).toBe(60);
    });

    it('deve retornar 422 com body inválido (tipo ausente)', async () => {
      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({ ref: 'teste', pontos: 10 });

      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('Dados inválidos');
    });

    it('deve retornar 422 com tipo inválido', async () => {
      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({ tipo: 'invalido', ref: 'teste', pontos: 10 });

      expect(response.status).toBe(422);
    });

    it('deve retornar 422 ao tentar registrar evento em attempt HM', async () => {
      mockRegisterEvent.mockRejectedValueOnce(
        new AppError('Registro de eventos é permitido apenas no modo OSCE.', 422),
      );

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({ tipo: 'procedimento_correto', ref: 'teste', pontos: 10 });

      expect(response.status).toBe(422);
    });

    it('deve retornar 422 ao tentar registrar evento em attempt finalizado', async () => {
      mockRegisterEvent.mockRejectedValueOnce(
        new AppError('Esta tentativa já foi finalizada.', 422),
      );

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({ tipo: 'procedimento_correto', ref: 'teste', pontos: 10 });

      expect(response.status).toBe(422);
    });

    it('deve retornar 404 para attempt inexistente', async () => {
      mockRegisterEvent.mockRejectedValueOnce(
        new AppError('Tentativa não encontrada.', 404),
      );

      const response = await request(app)
        .post('/student/v1/cases/attempts/inexistente/events')
        .send({ tipo: 'procedimento_correto', ref: 'teste', pontos: 10 });

      expect(response.status).toBe(404);
    });

    it('deve aceitar timestamp opcional', async () => {
      const mockResult = { acumulado: 80, notificacao: { texto: '+15 pts — hipótese SCA', ttl_ms: 2500 } };
      mockRegisterEvent.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/events`)
        .send({
          tipo: 'procedimento_correto',
          ref: 'hipotese_sca',
          pontos: 15,
          timestamp: '2026-05-29T14:32:11Z',
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // POST /attempts/:aid/finish
  // =========================================================================

  describe('POST /student/v1/cases/attempts/:aid/finish', () => {
    it('deve retornar 200 com pontuação consolidada e feedback', async () => {
      const mockResult = {
        pontuacao_final: 85,
        acertos: 7,
        erros: 2,
        tempo_segundos: 1080,
        feedback_llm: 'Boa condução do exame físico. Atenção ao tempo de reavaliação.',
      };
      mockFinishAttempt.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/finish`)
        .send({ student_id: mockStudentId });

      expect(response.status).toBe(200);
      expect(response.body.pontuacao_final).toBe(85);
      expect(response.body.acertos).toBe(7);
      expect(response.body.erros).toBe(2);
      expect(response.body.tempo_segundos).toBe(1080);
      expect(response.body.feedback_llm).toContain('Boa condução');
      expect(mockFinishAttempt).toHaveBeenCalledWith(mockAttemptId, mockStudentId);
    });

    it('deve retornar 422 sem student_id', async () => {
      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/finish`)
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('Dados inválidos');
    });

    it('deve retornar 404 para attempt inexistente', async () => {
      mockFinishAttempt.mockRejectedValueOnce(
        new AppError('Tentativa não encontrada.', 404),
      );

      const response = await request(app)
        .post('/student/v1/cases/attempts/inexistente/finish')
        .send({ student_id: mockStudentId });

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando student não é dono do attempt', async () => {
      mockFinishAttempt.mockRejectedValueOnce(
        new AppError('Você não tem permissão para finalizar esta tentativa.', 403),
      );

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/finish`)
        .send({ student_id: '99999999-9999-4999-9999-999999999999' });

      expect(response.status).toBe(403);
    });

    it('deve retornar 422 quando attempt já foi finalizado', async () => {
      mockFinishAttempt.mockRejectedValueOnce(
        new AppError('Esta tentativa já foi finalizada.', 422),
      );

      const response = await request(app)
        .post(`/student/v1/cases/attempts/${mockAttemptId}/finish`)
        .send({ student_id: mockStudentId });

      expect(response.status).toBe(422);
    });
  });
});
