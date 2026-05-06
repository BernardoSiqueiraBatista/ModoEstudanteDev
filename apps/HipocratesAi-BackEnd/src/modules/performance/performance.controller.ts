import { Request, Response } from 'express';

interface PerformanceResponse {
  taxaAcertos: number;
  questoesResolvidas: number;
  tempoEstudo: number;
}

export class PerformanceController {
  public async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID do aluno é obrigatório' });
      }

      /* Aqui futuramente chamaremos o Service:
         const stats = await performanceService.calculateStudentStats(Number(id));
      */

      const mockResponse: PerformanceResponse = {
        taxaAcertos: 0.82,
        questoesResolvidas: 150,
        tempoEstudo: 3600
      };

      return res.status(200).json(mockResponse);

    } catch (error) {
      
      console.error('Erro no PerformanceController:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar performance' });
    }
  }
}