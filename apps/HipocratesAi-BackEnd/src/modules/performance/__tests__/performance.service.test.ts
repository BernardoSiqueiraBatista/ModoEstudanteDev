import { PerformanceService } from '../performance.service';
import { AppError } from '../../../shared/errors/AppError';
import { PerformanceModel } from '../performance.model';

jest.mock('../performance.model');
const mockGetRawStatsByStudent = jest.fn();
(PerformanceModel as jest.Mock).mockImplementation(() => ({
  getRawStatsByStudent: mockGetRawStatsByStudent
}));

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = new PerformanceService();
    jest.clearAllMocks();
  });

  it('getCalculatedPerformance: Deve estourar AppError 404 se aluno não existir', async () => {
    mockGetRawStatsByStudent.mockResolvedValueOnce(null);
    
    await expect(service.getCalculatedPerformance('uuid-123')).rejects.toThrow(
      new AppError('Usuário não existe.', 404)
    );
  });

  it('getCalculatedPerformance: Deve calcular a taxa corretamente e agregar dados', async () => {
    mockGetRawStatsByStudent.mockResolvedValueOnce({
      total_resolvidas: '100',
      total_acertos: '80',
      segundos_estudo: '3600'
    });

    const result = await service.getCalculatedPerformance('uuid-123');

    // 80/100 = 0.8
    expect(result.taxaAcertos).toBe(0.8);
    expect(result.questoesResolvidas).toBe(100);
    expect(result.tempoEstudo).toBe(3600);
  });

  it('getCalculatedPerformance: Deve lidar com divisão por zero (0 respondidas)', async () => {
    mockGetRawStatsByStudent.mockResolvedValueOnce({
      total_resolvidas: '0',
      total_acertos: '0',
      segundos_estudo: '0'
    });

    const result = await service.getCalculatedPerformance('uuid-123');

    expect(result.taxaAcertos).toBe(0);
    expect(result.questoesResolvidas).toBe(0);
  });
});
