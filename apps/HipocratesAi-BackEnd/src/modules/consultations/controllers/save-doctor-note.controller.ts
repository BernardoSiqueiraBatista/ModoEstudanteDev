import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { ConsultationsRepository } from '../consultations.repository';

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({ text: z.string().min(1).max(5000) });

export async function saveDoctorNoteController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const p = paramsSchema.safeParse(req.params);
    if (!p.success) throw new AppError('ID inválido.', 400);

    const b = bodySchema.safeParse(req.body);
    if (!b.success) throw new AppError('Texto obrigatório (1-5000 chars).', 400);

    const doctorUserId = req.user?.id;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    const repo = new ConsultationsRepository();
    const consultation = await repo.findByIdForDoctor(p.data.id, doctorUserId);
    if (!consultation) throw new AppError('Consulta não encontrada.', 404);

    const note = await repo.saveDoctorNote(consultation.id, b.data.text);
    return res.status(201).json({ note });
  } catch (err) {
    return next(err);
  }
}

export async function listDoctorNotesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const p = paramsSchema.safeParse(req.params);
    if (!p.success) throw new AppError('ID inválido.', 400);

    const doctorUserId = req.user?.id;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    const repo = new ConsultationsRepository();
    const consultation = await repo.findByIdForDoctor(p.data.id, doctorUserId);
    if (!consultation) throw new AppError('Consulta não encontrada.', 404);

    const all = await repo.listInsights(consultation.id);
    const notes = all.filter((i: any) => i.kind === 'doctor_note');
    return res.json({ notes });
  } catch (err) {
    return next(err);
  }
}
