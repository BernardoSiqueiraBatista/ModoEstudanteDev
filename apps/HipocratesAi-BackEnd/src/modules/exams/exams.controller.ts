import { Request, Response } from 'express';
import { ExamsService } from './exams.service';

const examsService = new ExamsService();

export class ExamController {
  public async processExam(req: Request, res: Response): Promise<Response> {
    try {
      const { studentID, answers } = req.body;

      
      if (!studentID || !answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Dados do simulado inválidos ou incompletos.' 
        });
      }

      const result = await examsService.processExamResults(studentID, answers);

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('[EXAMS_CONTROLLER_ERROR]:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar o simulado.'
      });
    }
  }
}