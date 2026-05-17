import { StudentDashboardService } from '../student-dashboard.service';
import { AppError } from '../../../shared/errors/AppError';

// Mock do Model
const mockGetKPIsByStudent = jest.fn();
const mockGetStudyDistribution = jest.fn();
const mockGetLastInsight = jest.fn();

jest.mock('../student-dashboard.model', () => {
  return {
    StudentDashboardModel: jest.fn().mockImplementation(() => ({
      getKPIsByStudent: mockGetKPIsByStudent,
      getStudyDistribution: mockGetStudyDistribution,
      getLastInsight: mockGetLastInsight,
    })),
  };
});

describe('StudentDashboardService', () => {
  let service: StudentDashboardService;
  const studentId = 'student-123';

  beforeEach(() => {
    service = new StudentDashboardService();
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('deve estourar AppError(404) se aluno não tiver dados/não existir', async () => {
      mockGetKPIsByStudent.mockResolvedValueOnce(null);

      await expect(service.getDashboard(studentId)).rejects.toThrow(
        new AppError('Estudante não encontrado.', 404)
      );
    });

    it('deve retornar o dashboard montado com scoreGeral e kpis', async () => {
      mockGetKPIsByStudent.mockResolvedValueOnce({
        total_resolvidas: '100',
        total_acertos: '80',
        casos_clinicos_total: '10',
        casos_clinicos_acertos: '5',
        segundos_estudo: '7200', // 2 horas
      });

      mockGetStudyDistribution.mockResolvedValueOnce([
        { area: 'Cardiologia', total_resolvidas: '60' },
        { area: 'Pediatria', total_resolvidas: '40' },
      ]);

      mockGetLastInsight.mockResolvedValueOnce({
        id: 'insight-1',
        pontos_fortes: [],
        pontos_atencao: [],
      });

      const result = await service.getDashboard(studentId);

      // Verificando KPIs
      expect(result.kpis.questoesResolvidas).toBe(100);
      expect(result.kpis.horasEstudoSemana).toBe(2);
      expect(result.kpis.casosClinicosTotal).toBe(10);
      expect(result.kpis.casosClinicosAssertividade).toBe(50.0); // 5 de 10

      // Verifica matemática do scoreGeralBase100: (80/100)*0.5 + 80*0.3 + 90*0.2 = 40 + 24 + 18 = 82
      // Score = 82 * 10 = 820
      expect(result.kpis.scoreGeral).toBe(820);
      expect(result.kpis.percentil).toBe('Top 5%');

      // Verificando Distribuição
      expect(result.distribuicao).toHaveLength(2);
      expect(result.distribuicao[0]).toEqual({ area: 'Cardiologia', percentual: 60 });
      expect(result.distribuicao[1]).toEqual({ area: 'Pediatria', percentual: 40 });

      // Verificando insight
      expect(result.ultimoInsight?.id).toBe('insight-1');
    });
  });

  describe('getStudyDistribution', () => {
    it('deve retornar o array com porcentagens mapeadas', async () => {
      mockGetStudyDistribution.mockResolvedValueOnce([
        { area: 'Cardiologia', total_resolvidas: '50' },
        { area: 'Cirurgia', total_resolvidas: '150' },
      ]); // Total = 200 resolvidas

      const result = await service.getStudyDistribution(studentId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ area: 'Cardiologia', percentual: 25 }); // 50/200 = 25%
      expect(result[1]).toEqual({ area: 'Cirurgia', percentual: 75 });    // 150/200 = 75%
    });

    it('deve retornar array vazio caso não haja resolvidas', async () => {
      mockGetStudyDistribution.mockResolvedValueOnce([]);

      const result = await service.getStudyDistribution(studentId);

      expect(result).toEqual([]);
    });
  });
});
