import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { ConsultationsRepository } from '../consultations.repository';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function getConsultationController(
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
    if (!consultation) {
      throw new AppError('Consulta não encontrada.', 404);
    }

    const [transcripts, insights] = await Promise.all([
      repo.listTranscripts(consultation.id),
      repo.listInsights(consultation.id),
    ]);

    return res.json({ consultation, transcripts, insights });
  } catch (err) {
    return next(err);
  }
}
