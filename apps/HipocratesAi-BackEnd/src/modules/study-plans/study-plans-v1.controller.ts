import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { StudyPlansService } from './study-plans.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use PDF, DOCX ou imagem.'));
  },
});

const CreatePlanV1Schema = z.object({
  student_id: z.string().uuid(),
  areas_foco: z.array(z.string()).min(1),
  duracao: z.enum(['semanal', 'mensal', 'trimestral', 'anual']),
  instrucoes: z.string().min(3),
  compromissos_fixos: z.array(z.object({
    dia: z.string(),
    inicio: z.string(),
    fim: z.string(),
    label: z.string().optional(),
  })).optional(),
  horas_dia: z.number().min(1).max(16),
  considerar_performance: z.boolean().default(false),
  uploads: z.array(z.string()).optional(),
  titulo: z.string().optional(),
  categoria: z.enum(['especializacao', 'urgencia', 'atualizacao', 'certificacao', 'geral']).default('geral'),
});

const UpdatePlanSchema = z.object({
  student_id: z.string().uuid(),
  titulo: z.string().optional(),
  areas_foco: z.array(z.string()).optional(),
  duracao: z.enum(['semanal', 'mensal', 'trimestral', 'anual']).optional(),
  instrucoes: z.string().optional(),
  compromissos_fixos: z.array(z.object({
    dia: z.string(),
    inicio: z.string(),
    fim: z.string(),
    label: z.string().optional(),
  })).optional(),
  horas_dia: z.number().optional(),
});

export class StudyPlansV1Controller {
  private service = new StudyPlansService();

  listPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.query.student_id ?? '');
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      const plans = await this.service.listPlansFiltered(studentId);
      return res.status(200).json({ planos: plans });
    } catch (e) { next(e); }
  };

  createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreatePlanV1Schema.parse(req.body);
      const result = await this.service.generateStudyPlanV1(data.student_id, data);
      return res.status(201).json({ plan_id: result.plan.id, blocks: result.blocks });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };

  getPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const details = await this.service.getPlanDetails(String(req.params.id));
      return res.status(200).json(details);
    } catch (e) { next(e); }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getPlanSummary(String(req.params.id));
      return res.status(200).json(summary);
    } catch (e) { next(e); }
  };

  updatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = UpdatePlanSchema.parse(req.body);
      const params: Record<string, unknown> = {};
      if (body.horas_dia !== undefined) params.horas_por_dia = body.horas_dia;
      if (body.compromissos_fixos !== undefined) params.compromissos_fixos = body.compromissos_fixos;

      const updated = await this.service.updatePlan(String(req.params.id), body.student_id, {
        titulo: body.titulo,
        areas_foco: body.areas_foco,
        duracao: body.duracao,
        briefing_texto: body.instrucoes,
        parametros: Object.keys(params).length > 0 ? params : undefined,
      });
      return res.status(200).json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };

  deletePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.query.student_id ?? '');
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      await this.service.softDeletePlan(String(req.params.id), studentId);
      return res.status(204).send();
    } catch (e) { next(e); }
  };

  sharePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = (req.body.student_id ?? req.query.student_id) as string;
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      const share = await this.service.sharePlan(String(req.params.id), studentId);
      return res.status(201).json(share);
    } catch (e) { next(e); }
  };

  regeneratePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = (req.body.student_id ?? req.query.student_id) as string;
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      const result = await this.service.regeneratePlan(String(req.params.id), studentId);
      return res.status(202).json({ plan_id: result.plan.id, blocks: result.blocks, status: 'regenerated' });
    } catch (e: any) {
      if (e?.statusCode === 429) {
        try {
          const parsed = JSON.parse(e.message);
          return res.status(429).json(parsed);
        } catch { /* fallthrough */ }
      }
      next(e);
    }
  };

  uploadFile = [
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const studentId = (req.body.student_id ?? req.query.student_id) as string;
        if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
        if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado', codigo: 400 });
        const ref = await this.service.saveUpload(studentId, req.file);
        return res.status(201).json({ upload_id: ref.id, original_name: ref.original_name });
      } catch (e) { next(e); }
    },
  ];
}
