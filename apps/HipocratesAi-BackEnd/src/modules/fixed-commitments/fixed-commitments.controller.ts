import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FixedCommitmentsService } from './fixed-commitments.service';

const CreateFixedCommitmentSchema = z
  .object({
    dia: z.enum(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']),
    inicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de horário inválido. Use HH:MM.'),
    fim: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de horário inválido. Use HH:MM.'),
    label: z.string().optional(),
    tipo: z.string().default('compromisso_fixo'),
  })
  .refine((d) => d.fim > d.inicio, {
    message: 'O horário de fim deve ser posterior ao horário de início.',
    path: ['fim'],
  });

const UpdateFixedCommitmentSchema = z.object({
  dia: z.enum(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']).optional(),
  inicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de horário inválido. Use HH:MM.')
    .optional(),
  fim: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de horário inválido. Use HH:MM.')
    .optional(),
  label: z.string().optional(),
});

export class FixedCommitmentsController {
  private service = new FixedCommitmentsService();

  /**
   * GET /:id/fixed-commitments
   * Lista todos os compromissos fixos de um plano.
   */
  listCommitments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = String(req.params.id);
      const commitments = await this.service.listByPlan(planId);
      return res.status(200).json({ compromissos_fixos: commitments });
    } catch (e) {
      next(e);
    }
  };

  /**
   * POST /:id/fixed-commitments
   * Cria um novo compromisso fixo / horário bloqueado.
   */
  createCommitment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = String(req.params.id);
      const data = CreateFixedCommitmentSchema.parse(req.body);
      const commitment = await this.service.create(planId, data);
      return res.status(201).json(commitment);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      }
      next(e);
    }
  };

  /**
   * PATCH /:id/fixed-commitments/:cid
   * Atualiza um compromisso fixo (dia, faixa horária, label).
   */
  updateCommitment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commitmentId = String(req.params.cid);
      const data = UpdateFixedCommitmentSchema.parse(req.body);
      const updated = await this.service.update(commitmentId, data);
      return res.status(200).json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(422).json({ erro: 'Dados inválidos', mensagem: e.errors, codigo: 422 });
      }
      next(e);
    }
  };

  /**
   * DELETE /:id/fixed-commitments/:cid
   * Remove um compromisso fixo.
   */
  deleteCommitment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commitmentId = String(req.params.cid);
      await this.service.delete(commitmentId);
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  };
}
