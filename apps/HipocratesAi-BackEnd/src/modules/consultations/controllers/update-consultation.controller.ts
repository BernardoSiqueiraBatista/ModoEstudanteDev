import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { ConsultationsRepository } from '../consultations.repository';
import { updateConsultationSchema } from '../dtos/update-consultation.dto';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function updateConsultationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paramsParsed = paramsSchema.safeParse(req.params);
    if (!paramsParsed.success) throw new AppError('ID inválido.', 400);

    const bodyParsed = updateConsultationSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new AppError('Dados inválidos.', 400, bodyParsed.error.flatten());
    }

    const doctorUserId = req.user?.id;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    const repo = new ConsultationsRepository();
    const existing = await repo.findByIdForDoctor(paramsParsed.data.id, doctorUserId);
    if (!existing) throw new AppError('Consulta não encontrada.', 404);

    await repo.updateStatus(existing.id, existing.status, {
      doctorNotes: bodyParsed.data.doctorNotes,
      audioPath: bodyParsed.data.audioPath,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
