import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StudyPlansService } from './study-plans.service';

const CreatePlanSchema = z.object({
  titulo: z.string().min(3),
  categoria: z.enum(['especializacao', 'urgencia', 'atualizacao', 'certificacao', 'geral']).default('geral'),
  areas_foco: z.array(z.string()).min(1),
  duracao: z.enum(['semanal', 'mensal', 'trimestral', 'anual']),
  horas_por_dia: z.number().min(1).max(12),
  dias_semana: z.array(z.string()).min(1),
  horarios_bloqueados: z.array(z.object({
    dia: z.string(),
    inicio: z.string(),
    fim: z.string()
  })).optional(),
  briefing: z.string().min(10),
  considerar_insights: z.boolean().default(false)
});

const UpdateBlockSchema = z.object({
  status: z.enum(['pendente', 'concluido', 'pulado'])
});

export class StudyPlansController {
  private service: StudyPlansService;

  constructor() {
    this.service = new StudyPlansService();
  }

  createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      if (!studentId) {
        return res.status(400).json({ message: 'studentId é obrigatório' });
      }

      const validatedData = CreatePlanSchema.parse(req.body);

      const result = await this.service.generateStudyPlan(studentId, validatedData);

      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      next(error);
    }
  };

  listPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      if (!studentId) return res.status(400).json({ message: 'studentId é obrigatório' });

      const plans = await this.service.listPlans(studentId);
      return res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  };

  getPlanDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = req.params.planId as string;
      const details = await this.service.getPlanDetails(planId);
      return res.status(200).json(details);
    } catch (error) {
      next(error);
    }
  };

  updateBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('DEBUG [updateBlock] Body:', req.body);
      console.log('DEBUG [updateBlock] Content-Type:', req.headers['content-type']);

      const blockId = req.params.blockId as string;
      const { status } = UpdateBlockSchema.parse(req.body);

      const updated = await this.service.updateBlockStatus(blockId, status);

      return res.status(200).json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Status inválido', errors: error.errors });
      }
      next(error);
    }
  };

  deletePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id as string;
      const planId = req.params.planId as string;
      await this.service.deletePlan(planId, studentId);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
