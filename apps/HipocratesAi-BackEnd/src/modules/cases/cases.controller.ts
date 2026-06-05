import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CasesService } from './cases.service';
import { CreateAttemptSchema, CreateEventSchema, FinishAttemptSchema } from './cases.dto';

export class CasesController {
  private service = new CasesService();

  // ---------------------------------------------------------------------------
  // GET /:id/intro — Retorna resumo do caso para a pop-up
  // ---------------------------------------------------------------------------

  getIntro = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const caseId = String(req.params.id);
      if (!caseId) {
        return res.status(400).json({ erro: 'Parâmetro inválido', mensagem: 'ID do caso é obrigatório.', codigo: 400 });
      }

      const intro = await this.service.getIntro(caseId);
      return res.status(200).json(intro);
    } catch (e) {
      next(e);
    }
  };

  // ---------------------------------------------------------------------------
  // POST /:id/attempts — Inicia tentativa do caso
  // ---------------------------------------------------------------------------

  startAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const caseId = String(req.params.id);
      const data = CreateAttemptSchema.parse(req.body);

      const result = await this.service.startAttempt(caseId, data.student_id, data.modo);
      return res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      }
      next(e);
    }
  };

  // ---------------------------------------------------------------------------
  // POST /attempts/:aid/events — Registra evento OSCE
  // ---------------------------------------------------------------------------

  registerEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attemptId = String(req.params.aid);
      if (!attemptId) {
        return res.status(400).json({ erro: 'Parâmetro inválido', mensagem: 'ID da tentativa é obrigatório.', codigo: 400 });
      }

      const data = CreateEventSchema.parse(req.body);

      const result = await this.service.registerEvent(attemptId, data);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      }
      next(e);
    }
  };

  // ---------------------------------------------------------------------------
  // POST /attempts/:aid/finish — Finaliza tentativa e retorna pontuação
  // ---------------------------------------------------------------------------

  finishAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attemptId = String(req.params.aid);
      if (!attemptId) {
        return res.status(400).json({ erro: 'Parâmetro inválido', mensagem: 'ID da tentativa é obrigatório.', codigo: 400 });
      }

      const data = FinishAttemptSchema.parse(req.body);

      const result = await this.service.finishAttempt(attemptId, data.student_id);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      }
      next(e);
    }
  };
}
