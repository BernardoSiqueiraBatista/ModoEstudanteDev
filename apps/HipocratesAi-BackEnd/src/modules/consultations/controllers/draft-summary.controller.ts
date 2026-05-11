import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { ConsultationsRepository } from '../consultations.repository';
import { generateSummary } from '../ai/summary-generator';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function draftSummaryController(
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

    const [transcripts, patient] = await Promise.all([
      repo.listTranscripts(consultation.id),
      repo.getPatientForConsultation(consultation.id),
    ]);

    const fullTranscript = transcripts
      .filter((t) => t.is_final)
      .map((t) => `[${t.speaker ?? 'unknown'}] ${t.text}`)
      .join('\n');

    const summary = await generateSummary({
      consultationId: consultation.id,
      patient,
      fullTranscript,
    });

    return res.json({
      consultationId: consultation.id,
      structured: summary.structured,
      plainText: summary.plainText,
    });
  } catch (err) {
    return next(err);
  }
}
