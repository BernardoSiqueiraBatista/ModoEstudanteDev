import type { NextFunction, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../shared/logger/logger';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { AuditRepository } from '../../audit/audit.repository';
import { ConsultationsRepository } from '../consultations.repository';
import { createConsultationSchema } from '../dtos/create-consultation.dto';

export async function createConsultationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createConsultationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Dados inválidos.', 400, parsed.error.flatten());
    }

    const doctorUserId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);
    if (!orgId) throw new AppError('Organização não identificada.', 400);

    const { patientId, appointmentId } = parsed.data;

    // Verify patient belongs to org
    const { data: patient, error: pErr } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .select('id, org_id')
      .eq('id', patientId)
      .maybeSingle();

    if (pErr) {
      logger.error({ err: pErr, patientId }, 'createConsultation: patient lookup failed');
      throw new AppError('Erro ao verificar paciente.', 500);
    }
    if (!patient) throw new AppError('Paciente não encontrado.', 404);
    if ((patient as { org_id: string }).org_id !== orgId) {
      throw new AppError('Paciente não pertence à organização.', 403);
    }

    // Verify appointment if provided
    if (appointmentId) {
      const { data: appt, error: aErr } = await supabaseAdmin
        .schema('app')
        .from('appointments')
        .select('id, doctor_user_id, status')
        .eq('id', appointmentId)
        .maybeSingle();

      if (aErr) {
        logger.error({ err: aErr, appointmentId }, 'createConsultation: appointment lookup failed');
        throw new AppError('Erro ao verificar agendamento.', 500);
      }
      if (!appt) throw new AppError('Agendamento não encontrado.', 404);
      const a = appt as { doctor_user_id: string; status: string };
      if (a.doctor_user_id !== doctorUserId) {
        throw new AppError('Agendamento não pertence ao médico.', 403);
      }
      if (a.status !== 'scheduled') {
        throw new AppError(
          'Agendamento não está disponível para iniciar consulta.',
          409,
        );
      }
    }

    const repo = new ConsultationsRepository();
    const consultation = await repo.create({
      orgId,
      patientId,
      doctorUserId,
      appointmentId: appointmentId ?? null,
    });

    await new AuditRepository().log({
      orgId,
      actorUserId: doctorUserId,
      action: 'create',
      entityType: 'appointment',
      entityId: consultation.id,
      metadata: { kind: 'consultation' },
    });

    return res.status(201).json({
      consultation,
      wsUrls: {
        audio: `/ws/consultations/${consultation.id}/audio`,
        state: `/ws/consultations/${consultation.id}/state`,
      },
    });
  } catch (err) {
    return next(err);
  }
}
