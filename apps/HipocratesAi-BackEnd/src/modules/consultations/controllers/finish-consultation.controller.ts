import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../shared/logger/logger';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { ConsultationsRepository } from '../consultations.repository';
import { generateSummary } from '../ai/summary-generator';
import { cleanupSession } from '../ai/process-text';
import { sendWhatsAppMessage } from '../../../shared/whatsapp/whatsapp.service';
import { flushCost } from '../ai/cost-tracker';

const paramsSchema = z.object({ id: z.string().uuid() });

const bodySchema = z
  .object({
    doctorNotes: z.string().max(10000).optional(),
    summaryOverride: z.string().max(20000).optional(),
  })
  .optional();

export async function finishConsultationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);

    const bodyParsed = bodySchema.safeParse(req.body ?? {});
    const doctorNotes = bodyParsed.success ? bodyParsed.data?.doctorNotes : undefined;
    const summaryOverride = bodyParsed.success ? bodyParsed.data?.summaryOverride : undefined;

    const doctorUserId = req.user?.id;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    const repo = new ConsultationsRepository();
    const consultation = await repo.findByIdForDoctor(parsed.data.id, doctorUserId);
    if (!consultation) throw new AppError('Consulta não encontrada.', 404);
    if (consultation.status !== 'in_progress') {
      throw new AppError('Consulta não está em andamento.', 409);
    }

    const [transcripts, patient] = await Promise.all([
      repo.listTranscripts(consultation.id),
      repo.getPatientForConsultation(consultation.id),
    ]);

    const fullTranscript = transcripts
      .filter((t) => t.is_final)
      .map((t) => `[${t.speaker ?? 'unknown'}] ${t.text}`)
      .join('\n');

    const summary = summaryOverride
      ? { plainText: summaryOverride, structured: null as any }
      : await generateSummary({
          consultationId: consultation.id,
          patient,
          fullTranscript,
        });

    const endedAt = new Date();
    const startedAt = new Date(consultation.started_at);
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    await repo.updateStatus(consultation.id, 'completed', {
      endedAt: endedAt.toISOString(),
      durationSeconds,
      summary: summary.plainText,
      doctorNotes,
    });

    if (consultation.appointment_id) {
      const { error: aErr } = await supabaseAdmin
        .schema('app')
        .from('appointments')
        .update({ status: 'done' })
        .eq('id', consultation.appointment_id);
      if (aErr) {
        logger.warn(
          { err: aErr, appointmentId: consultation.appointment_id },
          'finishConsultation: failed to update appointment',
        );
      }
    }

    cleanupSession(consultation.id);

    // Persistir custo acumulado
    const cost = flushCost(consultation.id);
    if (cost) {
      try {
        await supabaseAdmin
          .schema('app')
          .from('consultation_sessions')
          .update({
            cost_usd: Number(cost.costUsd.toFixed(4)),
            tokens_input: cost.tokensInput,
            tokens_output: cost.tokensOutput,
            deepgram_seconds: cost.deepgramSeconds,
          })
          .eq('id', consultation.id);
      } catch (err) {
        logger.warn({ err, consultationId: consultation.id }, 'persist cost failed');
      }
    }

    // Envio automatico de resumo via WhatsApp (se paciente opt-in e gateway configurado)
    if (patient && (patient as any).whatsapp_opt_in && (patient as any).phone_number) {
      const phoneNumber = (patient as any).phone_number as string;
      const patientName = (patient as any).name ?? (patient as any).full_name ?? 'Paciente';
      const firstName = String(patientName).split(' ')[0];
      const message = [
        `Olá ${firstName}, segue o resumo da sua consulta:`,
        '',
        summary.plainText,
        '',
        'Em caso de dúvidas, responda aqui.',
      ].join('\n');
      sendWhatsAppMessage({ phone: phoneNumber, message })
        .then(async (r) => {
          if (r.ok) {
            await supabaseAdmin
              .schema('app')
              .from('consultation_sessions')
              .update({ whatsapp_summary_sent_at: new Date().toISOString() })
              .eq('id', consultation.id);
          }
        })
        .catch((err) => {
          logger.warn({ err, consultationId: consultation.id }, 'whatsapp summary failed');
        });
    }

    return res.json({
      consultationId: consultation.id,
      summary: summary.plainText,
      structuredSummary: summary.structured,
    });
  } catch (err) {
    return next(err);
  }
}
