import { Request, Response, NextFunction } from 'express';
import { ExamsService } from './exams.service';
import { AppError } from '../../shared/errors/AppError';

const examsService = new ExamsService();

export class ExamController {
  public async processExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentID, answers } = req.body;
      
      if (!studentID || !answers || !Array.isArray(answers) || answers.length === 0) {
        throw new AppError('Dados do simulado inválidos ou incompletos.', 400);
      }

      const result = await examsService.processExamResults(studentID, answers);
      
      res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  }
}