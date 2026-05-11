import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';
import { AppError } from '../../shared/errors/AppError';

const performanceService = new PerformanceService();

export class PerformanceController {
  public async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new AppError('O campo ID do aluno é obrigatório.', 400);
      }
      
      const stats = await performanceService.getCalculatedPerformance(id);
      
      res.status(200).json({
        status: 'success',
        data: stats
      });

    } catch (error) {
      next(error);
    }
  }
}