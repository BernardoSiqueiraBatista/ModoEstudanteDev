import { Request, Response } from 'express';
import { PerformanceService } from './performance.service'; 
const performanceService = new PerformanceService();

interface PerformanceResponse {
  taxaAcertos: number;
  questoesResolvidas: number;
  tempoEstudo: number;
}

export class PerformanceController {
  public async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;

      if (!id) {
        return res.status(400).json({ 
          status: 'error',
          message: 'O campo ID do aluno é obrigatório.' 
        });
      }

      // Verificar formato do UUID (finalidade: passar melhores instruções para o FrontEnd)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'O ID fornecido possui um formato inválido. Certifique-se de usar um UUID válido.'
        });
      }
      
      const stats = await performanceService.getCalculatedPerformance(id);
      
      return res.status(200).json({
        status: 'success',
        data: stats
      });

    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ 
          status: 'error',
          message: error.message 
        });
      }

      console.error('[PERFORMANCE_ERROR]:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Ocorreu um erro interno ao processar as estatísticas.' 
      });
    }
  }
}