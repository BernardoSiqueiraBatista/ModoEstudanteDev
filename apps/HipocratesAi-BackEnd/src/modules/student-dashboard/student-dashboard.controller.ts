import { Request, Response, NextFunction } from 'express';
import { StudentDashboardService } from './student-dashboard.service';
import { AppError } from '../../shared/errors/AppError';

const service = new StudentDashboardService();

export class StudentDashboardController {
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.params.id as string;

      if (!studentId) {
        throw new AppError('O ID do aluno é obrigatório na URL.', 400);
      }

      const dashboard = await service.getDashboard(studentId);

      res.status(200).json({
        status: 'success',
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getStudyDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.params.id as string;

      if (!studentId) {
        throw new AppError('O ID do aluno é obrigatório na URL.', 400);
      }

      const dist = await service.getStudyDistribution(studentId);

      res.status(200).json({
        status: 'success',
        data: dist,
      });
    } catch (error) {
      next(error);
    }
  }

  // Task 5: áreas de foco com flag de deficiência para pop-up 1/4
  public async getFocusAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.params.id as string;
      if (!studentId) throw new AppError('O ID do aluno é obrigatório na URL.', 400);
      const result = await service.getFocusAreas(studentId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
