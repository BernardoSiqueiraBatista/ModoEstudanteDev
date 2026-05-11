import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { ConsultationsRepository } from '../consultations.repository';

const paramsSchema = z.object({ patientId: z.string().uuid() });

async function assertPatientAccess(
  patientId: string,
  doctorUserId: string,
  orgId: string | null,
) {
  const { data, error } = await supabaseAdmin
    .schema('app')
    .from('patients')
    .select('id, org_id, doctor_id')
    .eq('id', patientId)
    .maybeSingle();
  if (error) throw new AppError('Erro ao verificar paciente.', 500);
  if (!data) throw new AppError('Paciente não encontrado.', 404);
  const p = data as { org_id: string; doctor_id: string | null };
  if (orgId && p.org_id !== orgId) {
    throw new AppError('Paciente não pertence à organização.', 403);
  }
  if (p.doctor_id && p.doctor_id !== doctorUserId) {
    throw new AppError('Paciente não pertence ao médico.', 403);
  }
}

function normalizeConfidence(c: number | null | undefined): 'Alta' | 'Média' | 'Baixa' {
  const v = typeof c === 'number' ? c : 0;
  if (v >= 0.7) return 'Alta';
  if (v >= 0.4) return 'Média';
  return 'Baixa';
}

export async function getPatientTimelineController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);
    const doctorUserId = req.user?.id;
    const orgId = req.user?.orgId ?? null;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    await assertPatientAccess(parsed.data.patientId, doctorUserId, orgId);

    const repo = new ConsultationsRepository();
    const consultations = await repo.listByPatient(parsed.data.patientId, doctorUserId, 50);

    const events = await Promise.all(
      consultations.map(async (c: any) => {
        const insights = await repo.listInsights(c.id);
        const hypotheses = insights
          .filter((i: any) => i.kind === 'hypothesis')
          .map((i: any) => ({
            id: i.id,
            patientId: parsed.data.patientId,
            title: i.content,
            description: i.rationale ?? '',
            status: 'ativo' as const,
            confidence: Math.round((i.confidence ?? 0.5) * 100),
            createdAt: i.created_at,
          }));
        const alerts = insights
          .filter((i: any) => i.kind === 'clinical_alert')
          .map((i: any) => i.content);

        return {
          id: c.id,
          patientId: parsed.data.patientId,
          date: c.started_at,
          title: c.summary?.split('\n')[0]?.slice(0, 80) || 'Consulta',
          doctor: '',
          specialty: 'Consulta',
          type: 'consulta' as const,
          hypotheses,
          tags: alerts.slice(0, 3),
          quote: c.doctor_notes ?? undefined,
          confidence: 'Alta' as const,
        };
      }),
    );

    return res.json({ data: events });
  } catch (err) {
    return next(err);
  }
}

export async function getPatientHypothesesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);
    const doctorUserId = req.user?.id;
    const orgId = req.user?.orgId ?? null;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    await assertPatientAccess(parsed.data.patientId, doctorUserId, orgId);

    const repo = new ConsultationsRepository();
    const consultations = await repo.listByPatient(parsed.data.patientId, doctorUserId, 100);

    const all: any[] = [];
    for (const c of consultations) {
      const insights = await repo.listInsights((c as any).id);
      for (const i of insights) {
        if ((i as any).kind !== 'hypothesis') continue;
        all.push({
          id: (i as any).id,
          patientId: parsed.data.patientId,
          title: (i as any).content,
          description: (i as any).rationale ?? '',
          status: 'ativo' as const,
          confidence: Math.round(((i as any).confidence ?? 0.5) * 100),
          createdAt: (i as any).created_at,
          lastUpdate: (i as any).created_at,
        });
      }
    }

    return res.json({ data: all });
  } catch (err) {
    return next(err);
  }
}

export async function getPatientTreatmentsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);
    const doctorUserId = req.user?.id;
    const orgId = req.user?.orgId ?? null;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    await assertPatientAccess(parsed.data.patientId, doctorUserId, orgId);

    const repo = new ConsultationsRepository();
    const consultations = await repo.listByPatient(parsed.data.patientId, doctorUserId, 100);

    const treatments: any[] = [];
    for (const c of consultations) {
      const insights = await repo.listInsights((c as any).id);
      const meds = insights.filter((i: any) => i.kind === 'medication');
      if (meds.length === 0) continue;

      const medications = meds.map((m: any) => ({
        id: m.id,
        name: m.content,
        dosage: m.metadata?.dosage ?? '',
        frequency: m.metadata?.frequency ?? '',
        duration: m.metadata?.duration ?? '',
      }));

      treatments.push({
        id: `t-${(c as any).id}`,
        patientId: parsed.data.patientId,
        name: meds[0].content,
        description: `Prescrito em consulta de ${new Date((c as any).started_at).toLocaleDateString('pt-BR')}`,
        status: (c as any).status === 'completed' ? 'concluido' : 'em_andamento',
        startDate: (c as any).started_at,
        endDate: (c as any).ended_at ?? undefined,
        medications,
      });
    }

    return res.json({ data: treatments });
  } catch (err) {
    return next(err);
  }
}

export async function getPatientCognitiveSummaryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError('ID inválido.', 400);
    const doctorUserId = req.user?.id;
    const orgId = req.user?.orgId ?? null;
    if (!doctorUserId) throw new AppError('Usuário não autenticado.', 401);

    await assertPatientAccess(parsed.data.patientId, doctorUserId, orgId);

    const repo = new ConsultationsRepository();
    const consultations = await repo.listByPatient(parsed.data.patientId, doctorUserId, 20);

    // agrega últimos insights
    let primaryFocus = 'Não informado';
    const ruledOut = new Set<string>();
    let workingHypothesis = '';
    let resolvedPhase = '';

    for (const c of consultations) {
      const insights = await repo.listInsights((c as any).id);
      for (const i of insights as any[]) {
        if (i.kind === 'hypothesis' && !workingHypothesis) {
          workingHypothesis = i.content;
          primaryFocus = i.content;
        }
        if (i.kind === 'clinical_note' && !resolvedPhase) {
          resolvedPhase = i.content?.slice(0, 120) ?? '';
        }
      }
    }

    return res.json({
      data: {
        primaryFocus,
        resolvedPhase,
        ruledOut: Array.from(ruledOut),
        workingHypothesis,
        totalConsultations: consultations.length,
        confidence: normalizeConfidence(0.7),
      },
    });
  } catch (err) {
    return next(err);
  }
}
