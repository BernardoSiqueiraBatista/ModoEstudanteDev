import { Request, Response } from 'express';
import { QuestionsService } from './questions.service';

const questionsService = new QuestionsService();

export class QuestionsController {
  public async getQuestions(req: Request, res: Response): Promise<Response> {
    try {

      const limit = parseInt(req.query.limit as string) || 10;
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;
      
      
      const categoryParam = req.query.category as string;
      const parsedCategory = parseInt(categoryParam, 10);
      const safeCategory = !isNaN(parsedCategory) ? parsedCategory : undefined;
      
      const result = await questionsService.getRandomQuestions(limit, level, safeCategory as any);

      return res.status(200).json({
        count: result.length,
        questions: result
      });

    } catch (error: any) {
      console.error('[QUESTIONS_CONTROLLER_ERROR]:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao carregar o banco de questões.'
      });
    }
  }
}