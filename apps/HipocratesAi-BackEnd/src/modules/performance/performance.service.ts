import { PerformanceModel } from './performance.model';
import { AppError } from '../../shared/errors/AppError';

export interface IStudentPerformance {
  taxaAcertos: number;
  questoesResolvidas: number;
  tempoEstudo: number;
}

export class PerformanceService {
  private model: PerformanceModel;

  constructor() {
    this.model = new PerformanceModel();
  }

public async getCalculatedPerformance(studentId: string): Promise<IStudentPerformance> {
  const rawData = await this.model.getRawStatsByStudent(studentId);

  if (!rawData) {
      throw new AppError('Usuário não existe.', 404);
  }

    const resolvidas = parseInt(rawData.total_resolvidas, 10);
    const acertos = parseInt(rawData.total_acertos, 10);
    
    const taxaAcertos = resolvidas > 0 ? parseFloat((acertos / resolvidas).toFixed(2)) : 0;

    return {
        taxaAcertos,
        questoesResolvidas: resolvidas,
        tempoEstudo: Math.floor(rawData.segundos_estudo || 0)
  };
}
}