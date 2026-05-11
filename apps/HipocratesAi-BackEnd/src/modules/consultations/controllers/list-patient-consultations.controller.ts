import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../shared/logger/logger';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { ConsultationsRepository } from '../consultations.repository';

const paramsSchema = z.object({ patientId: z.string().uuid() });

export async function listPatientConsultationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);

    const doctorUserId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);
    if (!orgId) throw new AppError('Organização não identificada.', 400);

    const { data: patient, error: pErr } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .select('id, org_id, doctor_id')
      .eq('id', parsed.data.patientId)
      .maybeSingle();

    if (pErr) {
      logger.error(
        { err: pErr, patientId: parsed.data.patientId },
        'listPatientConsultations: lookup failed',
      );
      throw new AppError('Erro ao verificar paciente.', 500);
    }
    if (!patient) throw new AppError('Paciente não encontrado.', 404);

    const p = patient as { org_id: string; doctor_id: string | null };
    if (p.org_id !== orgId) {
      throw new AppError('Paciente não pertence à organização.', 403);
    }

    const repo = new ConsultationsRepository();
    const consultations = await repo.listByPatient(
      parsed.data.patientId,
      doctorUserId,
      20,
    );

    return res.json({ data: consultations });
  } catch (err) {
    return next(err);
  }
}
