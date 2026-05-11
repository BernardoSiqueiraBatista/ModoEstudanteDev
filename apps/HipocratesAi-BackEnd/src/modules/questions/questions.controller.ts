import { Request, Response, NextFunction } from 'express';
import { QuestionsService } from './questions.service';
import { AppError } from '../../shared/errors/AppError';

const questionsService = new QuestionsService();

export class QuestionsController {
  public async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;
      
      const categoryParam = req.query.category as string;
      const parsedCategory = parseInt(categoryParam, 10);
      const safeCategory = !isNaN(parsedCategory) ? parsedCategory : undefined;
      
      const result = await questionsService.getRandomQuestions(limit, level, safeCategory as any);

      res.status(200).json({
        count: result.length,
        questions: result
      });

    } catch (error) {
      next(error);
    }
  }
}