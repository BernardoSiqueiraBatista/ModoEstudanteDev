import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { ConsultationsRepository } from '../consultations.repository';
import { acknowledgeInsightSchema } from '../dtos/acknowledge-insight.dto';

const paramsSchema = z.object({
  consultationId: z.string().uuid(),
  insightId: z.string().uuid(),
});

export async function acknowledgeInsightController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paramsParsed = paramsSchema.safeParse(req.params);
    if (!paramsParsed.success) throw new AppError('Parâmetros inválidos.', 400);

    const bodyParsed = acknowledgeInsightSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new AppError('Dados inválidos.', 400, bodyParsed.error.flatten());
    }

    const doctorUserId = req.user?.id;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    const repo = new ConsultationsRepository();
    const consultation = await repo.findByIdForDoctor(
      paramsParsed.data.consultationId,
      doctorUserId,
    );
    if (!consultation) throw new AppError('Consulta não encontrada.', 404);

    await repo.acknowledgeInsight(paramsParsed.data.insightId, bodyParsed.data.action);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
