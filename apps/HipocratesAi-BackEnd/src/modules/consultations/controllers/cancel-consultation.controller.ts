import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { ConsultationsRepository } from '../consultations.repository';
import { cleanupSession } from '../ai/process-text';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function cancelConsultationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);

    const doctorUserId = req.user?.id;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    const repo = new ConsultationsRepository();
    const consultation = await repo.findByIdForDoctor(parsed.data.id, doctorUserId);
    if (!consultation) throw new AppError('Consulta não encontrada.', 404);
    if (consultation.status !== 'in_progress') {
      throw new AppError('Consulta não está em andamento.', 409);
    }

    await repo.updateStatus(consultation.id, 'canceled', {
      endedAt: new Date().toISOString(),
    });

    cleanupSession(consultation.id);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
