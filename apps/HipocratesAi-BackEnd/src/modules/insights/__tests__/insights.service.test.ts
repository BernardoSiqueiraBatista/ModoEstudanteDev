import { InsightsService } from '../insights.service';
import { AppError } from '../../../shared/errors/AppError';

// 1. Mocar as dependencias do InsightsModel
const mockGetLastInsight = jest.fn();
const mockGetStatsLast30Days = jest.fn();
const mockSaveInsight = jest.fn();

jest.mock('../insights.model', () => {
  return {
    InsightsModel: jest.fn().mockImplementation(() => ({
      getLastInsight: mockGetLastInsight,
      getStatsLast30Days: mockGetStatsLast30Days,
      saveInsight: mockSaveInsight
    }))
  };
});

// 2. Mocar OpenAI Client
jest.mock('openai', () => {
  const mOpenAI = {
    chat: {
      completions: {
        parse: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              parsed: {
                pontos_fortes: [{ titulo: 'Forte 1', descricao_curta: 'desc 1', modulo_referencia: 'Geral', severidade: null }],
                pontos_atencao: [{ titulo: 'Atenção 1', descricao_curta: 'desc aten', modulo_referencia: 'Cardio', severidade: 'alta' }]
              }
            }
          }]
        })
      }
    }
  };
  return { OpenAI: jest.fn(() => mOpenAI) };
});

describe('InsightsService', () => {
  let service: InsightsService;
  const studentId = 'student-123';

  beforeEach(() => {
    service = new InsightsService();
    jest.clearAllMocks();
  });

  describe('getLastInsight', () => {
    it('deve retornar o ultimo insight do banco', async () => {
      mockGetLastInsight.mockResolvedValueOnce({ id: 'insight-id' });
      const result = await service.getLastInsight(studentId);
      expect(result).toEqual({ id: 'insight-id' });
    });
  });

  describe('generateInsight', () => {
    it('deve estourar AppError se a geracao anterior foi ha menos de 6 horas', async () => {
      const now = new Date();
      // Criando data 2 horas atras
      const pastDate = new Date(now.getTime() - 2 * 3600000).toISOString();

      mockGetLastInsight.mockResolvedValueOnce({ gerado_em: pastDate });

      await expect(service.generateInsight(studentId)).rejects.toThrow(
        new AppError('Você só pode gerar um novo mapa de performance a cada 6 horas.', 429)
      );
    });

    it('deve estourar AppError se não houver questoes resolvidas nos ultimos 30 dias', async () => {
      // insight anterior antigo ou nulo para passar no rate limit
      mockGetLastInsight.mockResolvedValueOnce(null);
      mockGetStatsLast30Days.mockResolvedValueOnce({ total_resolvidas: '0' });

      await expect(service.generateInsight(studentId)).rejects.toThrow(
        new AppError('Não há dados suficientes de performance para gerar insights.', 400)
      );
    });

    it('deve gerar insight usando OpenAI e salva-lo', async () => {
      mockGetLastInsight.mockResolvedValueOnce(null);
      mockGetStatsLast30Days.mockResolvedValueOnce({
        total_resolvidas: '100',
        total_acertos: '80',
        segundos_estudo: '7200'
      });

      mockSaveInsight.mockResolvedValueOnce({ id: 'novo-insight' });

      const result = await service.generateInsight(studentId);

      expect(result.id).toBe('novo-insight');
      expect(mockSaveInsight).toHaveBeenCalledWith(
        studentId,
        expect.any(Array),
        expect.any(Array),
        'v1'
      );
    });
  });
});
