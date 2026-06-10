import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CasesService } from './cases.service';
import { CreateAttemptSchema, CreateEventSchema, FinishAttemptSchema, SendChatSchema } from './cases.dto';

export class CasesController {
  private service = new CasesService();

  // ── Dashboard / Listing ────────────────────────────────────────────────────

  listCases = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cases = await this.service.listCases({
        especialidade: req.query.especialidade ? String(req.query.especialidade) : undefined,
        dificuldade:   req.query.dificuldade   ? String(req.query.dificuldade)   : undefined,
        search:        req.query.search        ? String(req.query.search)        : undefined,
      });
      return res.status(200).json({ casos: cases, total: cases.length });
    } catch (e) { next(e); }
  };

  getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.query.student_id ?? '');
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      return res.status(200).json(await this.service.getMetrics(studentId));
    } catch (e) { next(e); }
  };

  // ── Case intro pop-up ──────────────────────────────────────────────────────

  getIntro = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json(await this.service.getIntro(String(req.params.id)));
    } catch (e) { next(e); }
  };

  // ── Start attempt ──────────────────────────────────────────────────────────

  startAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateAttemptSchema.parse(req.body);
      return res.status(201).json(await this.service.startAttempt(String(req.params.id), data.student_id, data.modo));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };

  // ── OSCE: Register event ───────────────────────────────────────────────────

  registerEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateEventSchema.parse(req.body);
      return res.status(200).json(await this.service.registerEvent(String(req.params.aid), data));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };

  // ── Finish attempt ─────────────────────────────────────────────────────────

  finishAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = FinishAttemptSchema.parse(req.body);
      return res.status(200).json(await this.service.finishAttempt(String(req.params.aid), data.student_id));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };

  // ── HM Chat ────────────────────────────────────────────────────────────────

  sendChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = SendChatSchema.parse(req.body);
      return res.status(200).json(await this.service.sendChatMessage(String(req.params.aid), data.student_id, data.mensagem));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };

  getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.query.student_id ?? '');
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      const historico = await this.service.getChatHistory(String(req.params.aid), studentId);
      return res.status(200).json({ historico, total: historico.length });
    } catch (e) { next(e); }
  };

  requestHint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = String(req.body.student_id ?? '');
      if (!studentId) return res.status(400).json({ erro: 'student_id é obrigatório', codigo: 400 });
      return res.status(200).json(await this.service.requestHint(String(req.params.aid), studentId));
    } catch (e) { next(e); }
  };

  finishHMAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const Schema = z.object({ student_id: z.string().uuid(), duracao_segundos: z.number().int().min(0).optional() });
      const data = Schema.parse(req.body);
      return res.status(200).json(await this.service.finishHMAttempt(String(req.params.aid), data.student_id, data.duracao_segundos));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      next(e);
    }
  };
}
