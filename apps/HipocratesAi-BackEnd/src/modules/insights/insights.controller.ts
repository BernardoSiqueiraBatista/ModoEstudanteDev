import { Request, Response, NextFunction } from 'express';
import { InsightsService } from './insights.service';
import { AppError } from '../../shared/errors/AppError';

const service = new InsightsService();

export class InsightsController {
  public async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.params.id as string;

      if (!studentId) {
        throw new AppError('O ID do aluno é obrigatório na URL.', 400);
      }

      const insight = await service.getLastInsight(studentId);

      res.status(200).json({
        status: 'success',
        data: insight,
      });
    } catch (error) {
      next(error);
    }
  }

  public async regenerateInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.params.id as string;

      if (!studentId) {
        throw new AppError('O ID do aluno é obrigatório na URL.', 400);
      }

      const insight = await service.generateInsight(studentId);

      res.status(201).json({
        status: 'success',
        data: insight,
      });
    } catch (error) {
      next(error);
    }
  }
}
