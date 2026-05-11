import { supabaseAdmin } from '../../infra/supabase/supabase-admin';
import { AppError } from '../../shared/errors/app-error';
import { logger } from '../../shared/logger/logger';
import type {
  ConsultationRow,
  ConsultationStatus,
  TranscriptRow,
  InsightRow,
  InsightInput,
  InsightAckAction,
  ConsultationPatientRow,
} from './types';
import type { PatientContext } from './ai/prompts/suggestions.prompt';
import type { SuggestionsResult } from './ai/suggestions-detector';
import type { ClinicalSupportResp } from './ai/clinical-llm/types';
import { measureAsync } from '../../shared/metrics/metrics';

interface CreateConsultationInput {
  orgId: string;
  appointmentId?: string | null;
  patientId: string;
  doctorUserId: string;
}

interface UpdateStatusExtra {
  endedAt?: string;
  durationSeconds?: number;
  summary?: string;
  doctorNotes?: string;
  audioPath?: string;
}

export interface SaveTranscriptInput {
  consultationId: string;
  text: string;
  speaker: string | null;
  isFinal: boolean;
  timestampMs: number | null;
}

function computeAgeYears(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return years >= 0 && years < 150 ? years : null;
}

export class ConsultationsRepository {
  async create(input: CreateConsultationInput): Promise<ConsultationRow> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .insert({
        org_id: input.orgId,
        appointment_id: input.appointmentId ?? null,
        patient_id: input.patientId,
        doctor_user_id: input.doctorUserId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error }, '[ConsultationsRepository.create]');
      throw new AppError('Erro ao criar consulta.', 500);
    }

    return data as ConsultationRow;
  }

  async findById(id: string): Promise<ConsultationRow | null> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .select('*')
      .eq('id', id)
      .neq('status', 'canceled')
      .maybeSingle();

    if (error) {
      logger.error({ err: error, id }, '[ConsultationsRepository.findById]');
      throw new AppError('Erro ao buscar consulta.', 500);
    }

    return (data as ConsultationRow | null) ?? null;
  }

  async findByIdForDoctor(
    id: string,
    doctorUserId: string,
  ): Promise<ConsultationRow | null> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error(
        { err: error, id, doctorUserId },
        '[ConsultationsRepository.findByIdForDoctor]',
      );
      throw new AppError('Erro ao buscar consulta.', 500);
    }

    const row = data as ConsultationRow | null;
    if (!row) return null;
    if (row.doctor_user_id !== doctorUserId) return null;
    return row;
  }

  async updateStatus(
    id: string,
    status: ConsultationStatus,
    extra?: UpdateStatusExtra,
  ): Promise<void> {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (extra?.endedAt !== undefined) patch.ended_at = extra.endedAt;
    if (extra?.durationSeconds !== undefined)
      patch.duration_seconds = extra.durationSeconds;
    if (extra?.summary !== undefined) patch.summary = extra.summary;
    if (extra?.doctorNotes !== undefined)
      patch.doctor_notes = extra.doctorNotes;
    if (extra?.audioPath !== undefined) patch.audio_path = extra.audioPath;

    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .update(patch)
      .eq('id', id);

    if (error) {
      logger.error(
        { err: error, id, status },
        '[ConsultationsRepository.updateStatus]',
      );
      throw new AppError('Erro ao atualizar consulta.', 500);
    }
  }

  async updateClinicalClassification(
    consultationId: string,
    classification: { macro: string | null; micro?: string | null },
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .update({
        clinical_macro: classification.macro,
        clinical_micro: classification.micro ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultationId);

    if (error) {
      logger.warn(
        { err: error, consultationId },
        '[ConsultationsRepository.updateClinicalClassification]',
      );
    }
  }

  async listByPatient(
    patientId: string,
    doctorUserId: string,
    limit = 20,
  ): Promise<ConsultationRow[]> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('doctor_user_id', doctorUserId)
      .neq('status', 'canceled')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(
        { err: error, patientId, doctorUserId },
        '[ConsultationsRepository.listByPatient]',
      );
      throw new AppError('Erro ao listar consultas do paciente.', 500);
    }

    return (data ?? []) as ConsultationRow[];
  }

  /**
   * Returns a lightweight patient context object used by the AI pipeline
   * to build prompts. Returns null on error or not found.
   */
  async getPatientForConsultation(
    consultationId: string,
  ): Promise<PatientContext | null> {
    return measureAsync('db.getPatientForConsultation', () =>
      this.getPatientForConsultationImpl(consultationId),
    );
  }

  private async getPatientForConsultationImpl(
    consultationId: string,
  ): Promise<PatientContext | null> {
    const { data: consultation, error: cErr } = await supabaseAdmin
      .schema('app')
      .from('consultation_sessions')
      .select('patient_id')
      .eq('id', consultationId)
      .maybeSingle();

    if (cErr || !consultation) {
      if (cErr) {
        logger.error(
          { err: cErr, consultationId },
          '[ConsultationsRepository.getPatientForConsultation] consultation',
        );
      }
      return null;
    }

    const { data: patient, error: pErr } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .select(
        'id, full_name, birth_date, sex, allergies, current_medications, chief_complaint',
      )
      .eq('id', (consultation as { patient_id: string }).patient_id)
      .maybeSingle();

    if (pErr || !patient) {
      if (pErr) {
        logger.error(
          { err: pErr, consultationId },
          '[ConsultationsRepository.getPatientForConsultation] patient',
        );
      }
      return null;
    }

    const row = patient as Partial<ConsultationPatientRow>;
    return {
      name: row.full_name ?? null,
      age: computeAgeYears(row.birth_date ?? null),
      allergies: row.allergies ?? null,
      currentMedications: row.current_medications ?? null,
      mainDiagnosis: row.chief_complaint ?? null,
    };
  }

  async saveTranscriptsBulk(items: SaveTranscriptInput[]): Promise<void> {
    return measureAsync('db.saveTranscriptsBulk', () =>
      this.saveTranscriptsBulkImpl(items),
    );
  }

  private async saveTranscriptsBulkImpl(
    items: SaveTranscriptInput[],
  ): Promise<void> {
    if (items.length === 0) return;
    const rows = items.map((i) => ({
      consultation_id: i.consultationId,
      text: i.text,
      speaker: i.speaker,
      is_final: i.isFinal,
      timestamp_ms: i.timestampMs,
    }));
    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_transcripts')
      .insert(rows);

    if (error) {
      logger.error(
        { err: error, count: rows.length },
        '[ConsultationsRepository.saveTranscriptsBulk]',
      );
      throw new AppError('Erro ao salvar transcrições em lote.', 500);
    }
  }

  async saveTranscript(input: SaveTranscriptInput): Promise<void> {
    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_transcripts')
      .insert({
        consultation_id: input.consultationId,
        text: input.text,
        speaker: input.speaker,
        is_final: input.isFinal,
        timestamp_ms: input.timestampMs,
      });

    if (error) {
      logger.error(
        { err: error, consultationId: input.consultationId },
        '[ConsultationsRepository.saveTranscript]',
      );
      throw new AppError('Erro ao salvar transcrição.', 500);
    }
  }

  /**
   * Returns the most recent transcripts for a consultation, ordered
   * chronologically (ASC). Intended for in-memory rehydration after a backend
   * restart — degrades silently (returns []) instead of throwing, so the
   * pipeline always continues even when the DB is unreachable.
   */
  async getRecentTranscripts(
    consultationId: string,
    opts: { limit?: number } = {},
  ): Promise<Array<{ text: string; speaker: string; timestampMs: number }>> {
    const limit = opts.limit ?? 200;
    try {
      const { data, error } = await supabaseAdmin
        .schema('app')
        .from('consultation_transcripts')
        .select('text, speaker, timestamp_ms, created_at')
        .eq('consultation_id', consultationId)
        .eq('is_final', true)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.warn(
          { err: error, consultationId },
          '[ConsultationsRepository.getRecentTranscripts] query failed — rehydration skipped',
        );
        return [];
      }

      return (data ?? []).map((row) => {
        const r = row as {
          text: string;
          speaker: string | null;
          timestamp_ms: number | null;
          created_at: string;
        };
        return {
          text: r.text,
          speaker: r.speaker ?? 'unknown',
          timestampMs: r.timestamp_ms ?? new Date(r.created_at).getTime(),
        };
      });
    } catch (err) {
      logger.warn(
        { err, consultationId },
        '[ConsultationsRepository.getRecentTranscripts] unexpected error — rehydration skipped',
      );
      return [];
    }
  }

  async listTranscripts(consultationId: string): Promise<TranscriptRow[]> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_transcripts')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('timestamp_ms', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(
        { err: error, consultationId },
        '[ConsultationsRepository.listTranscripts]',
      );
      throw new AppError('Erro ao listar transcrições.', 500);
    }

    return (data ?? []) as TranscriptRow[];
  }

  /**
   * Bulk insert insights. Accepts either an InsightInput[] from REST callers
   * or a SuggestionsResult from the AI pipeline and normalizes them.
   */
  async saveInsights(
    consultationId: string,
    insights: InsightInput[] | SuggestionsResult,
  ): Promise<InsightRow[]> {
    return measureAsync('db.saveInsights', () =>
      this.saveInsightsImpl(consultationId, insights),
    );
  }

  private async saveInsightsImpl(
    consultationId: string,
    insights: InsightInput[] | SuggestionsResult,
  ): Promise<InsightRow[]> {
    const rows = this.normalizeInsights(consultationId, insights);
    if (rows.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .insert(rows)
      .select('*');

    if (error) {
      logger.error(
        { err: error, consultationId },
        '[ConsultationsRepository.saveInsights]',
      );
      throw new AppError('Erro ao salvar insights.', 500);
    }

    return (data ?? []) as InsightRow[];
  }

  private normalizeInsights(
    consultationId: string,
    insights: InsightInput[] | SuggestionsResult,
  ): Array<Record<string, unknown>> {
    if (Array.isArray(insights)) {
      return insights.map((i) => ({
        consultation_id: consultationId,
        kind: i.kind,
        content: i.content,
        rationale: i.rationale ?? null,
        source_chunks: i.source_chunks ?? null,
        source_web: i.source_web ?? null,
        severity: i.severity ?? null,
        confidence: i.confidence ?? null,
      }));
    }

    const out: Array<Record<string, unknown>> = [];
    for (const q of insights.suggestedQuestions ?? []) {
      out.push({
        consultation_id: consultationId,
        kind: 'suggested_question',
        content: q.text,
        rationale: q.rationale ?? null,
        source_chunks: q.source ? [q.source] : null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }
    for (const a of insights.clinicalAlerts ?? []) {
      out.push({
        consultation_id: consultationId,
        kind: 'clinical_alert',
        content: a.text,
        rationale: a.rationale ?? null,
        source_chunks: a.source ? [a.source] : null,
        source_web: null,
        severity: a.severity,
        confidence: null,
      });
    }
    for (const k of insights.keypoints ?? []) {
      out.push({
        consultation_id: consultationId,
        kind: 'keypoint',
        content: k.text,
        rationale: null,
        source_chunks: k.source ? [k.source] : null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }
    return out;
  }

  async saveConduct(
    consultationId: string,
    conduct: {
      hypotheses: Array<{
        title: string;
        confidence: number;
        rationale: string;
      }>;
      examRequests: Array<{ name: string; rationale: string }>;
      referrals: Array<{ name: string; specialty: string }>;
      orientations: Array<{ text: string }>;
      medicalInsight: string;
      clinicalNote: { hda: string; clinicalImpression: string[] };
    },
  ): Promise<void> {
    const rows: Array<Record<string, unknown>> = [];
    for (const h of conduct.hypotheses) {
      rows.push({
        consultation_id: consultationId,
        kind: 'hypothesis',
        content: h.title,
        rationale: h.rationale,
        confidence: h.confidence,
        source_chunks: null,
        source_web: null,
        severity: null,
      });
    }
    for (const e of conduct.examRequests) {
      rows.push({
        consultation_id: consultationId,
        kind: 'exam_suggestion',
        content: e.name,
        rationale: e.rationale,
        source_chunks: null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }
    for (const r of conduct.referrals) {
      rows.push({
        consultation_id: consultationId,
        kind: 'referral',
        content: r.name,
        rationale: null,
        metadata: { specialty: r.specialty },
        source_chunks: null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }
    for (const o of conduct.orientations) {
      rows.push({
        consultation_id: consultationId,
        kind: 'orientation',
        content: o.text,
        rationale: null,
        source_chunks: null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }
    if (conduct.medicalInsight) {
      rows.push({
        consultation_id: consultationId,
        kind: 'medical_insight',
        content: conduct.medicalInsight,
        rationale: null,
        source_chunks: null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }
    if (
      conduct.clinicalNote?.hda ||
      conduct.clinicalNote?.clinicalImpression?.length
    ) {
      rows.push({
        consultation_id: consultationId,
        kind: 'clinical_note',
        content: conduct.clinicalNote.hda || '(sem HDA)',
        rationale: null,
        metadata: {
          clinicalImpression: conduct.clinicalNote.clinicalImpression,
        },
        source_chunks: null,
        source_web: null,
        severity: null,
        confidence: null,
      });
    }

    if (rows.length === 0) return;

    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .insert(rows);

    if (error) {
      logger.error(
        { err: error, consultationId },
        '[ConsultationsRepository.saveConduct]',
      );
    }
  }

  async savePrescription(
    consultationId: string,
    medications: Array<{
      name: string;
      dosage: string;
      route: string;
      frequency: string;
      duration: string;
      instructions: string;
      allergyWarning: boolean;
      interactionWarning: boolean;
      warningRationale: string;
    }>,
  ): Promise<void> {
    if (!medications.length) return;

    const rows = medications.map((m) => ({
      consultation_id: consultationId,
      kind: 'medication',
      content: m.name,
      rationale: m.warningRationale || null,
      severity: m.allergyWarning || m.interactionWarning ? 'warning' : null,
      confidence: null,
      source_chunks: null,
      source_web: null,
      metadata: {
        dosage: m.dosage,
        route: m.route,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
        allergyWarning: m.allergyWarning,
        interactionWarning: m.interactionWarning,
      },
    }));

    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .insert(rows);

    if (error) {
      logger.error(
        { err: error, consultationId },
        '[ConsultationsRepository.savePrescription]',
      );
    }
  }

  async saveEnrichedInsights(
    consultationId: string,
    enriched: ClinicalSupportResp,
  ): Promise<void> {
    const rows: Array<Record<string, unknown>> = [];

    for (const item of enriched.differential ?? []) {
      rows.push({
        consultation_id: consultationId,
        kind: 'clinical_support_enriched',
        content: item.dx,
        rationale: item.rationale,
        severity: null,
        confidence: enriched.confidence,
        source_chunks: null,
        source_web: null,
        support_level: item.support_level,
        priority: item.priority,
        evidence_chunk_ids: item.evidence_chunk_ids,
        metadata: {
          category: 'differential',
          macro: enriched.macro,
          micro: enriched.micro,
        },
      });
    }

    for (const item of enriched.checklist_questions ?? []) {
      rows.push({
        consultation_id: consultationId,
        kind: 'clinical_support_enriched',
        content: item.question,
        rationale: item.why,
        severity: null,
        confidence: enriched.confidence,
        source_chunks: null,
        source_web: null,
        support_level: item.support_level,
        priority: item.priority,
        evidence_chunk_ids: item.evidence_chunk_ids,
        metadata: {
          category: 'checklist_question',
          macro: enriched.macro,
          micro: enriched.micro,
        },
      });
    }

    for (const item of enriched.red_flags ?? []) {
      rows.push({
        consultation_id: consultationId,
        kind: 'clinical_support_enriched',
        content: item.flag,
        rationale: item.why,
        severity: item.priority === 'alta' ? 'critical' : 'warning',
        confidence: enriched.confidence,
        source_chunks: null,
        source_web: null,
        support_level: item.support_level,
        priority: item.priority,
        evidence_chunk_ids: item.evidence_chunk_ids,
        metadata: {
          category: 'red_flag',
          action: item.action,
          macro: enriched.macro,
          micro: enriched.micro,
        },
      });
    }

    for (const item of enriched.next_steps_suggested ?? []) {
      rows.push({
        consultation_id: consultationId,
        kind: 'clinical_support_enriched',
        content: item.step,
        rationale: item.why,
        severity: null,
        confidence: enriched.confidence,
        source_chunks: null,
        source_web: null,
        support_level: item.support_level,
        priority: null,
        evidence_chunk_ids: item.evidence_chunk_ids,
        metadata: {
          category: 'next_step',
          macro: enriched.macro,
          micro: enriched.micro,
        },
      });
    }

    if (rows.length === 0) return;

    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .insert(rows);

    if (error) {
      logger.warn(
        { err: error, consultationId },
        '[ConsultationsRepository.saveEnrichedInsights]',
      );
    }
  }

  async saveDoctorNote(
    consultationId: string,
    text: string,
  ): Promise<InsightRow | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .insert({
        consultation_id: consultationId,
        kind: 'doctor_note',
        content: trimmed,
        rationale: null,
        source_chunks: null,
        source_web: null,
        severity: null,
        confidence: null,
      })
      .select('*')
      .single();

    if (error) {
      logger.error(
        { err: error, consultationId },
        '[ConsultationsRepository.saveDoctorNote]',
      );
      throw new AppError('Erro ao salvar anotação.', 500);
    }

    return data as InsightRow;
  }

  async listInsights(consultationId: string): Promise<InsightRow[]> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(
        { err: error, consultationId },
        '[ConsultationsRepository.listInsights]',
      );
      throw new AppError('Erro ao listar insights.', 500);
    }

    return (data ?? []) as InsightRow[];
  }

  async acknowledgeInsight(
    insightId: string,
    action: InsightAckAction,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .schema('app')
      .from('consultation_insights')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_action: action,
      })
      .eq('id', insightId);

    if (error) {
      logger.error(
        { err: error, insightId, action },
        '[ConsultationsRepository.acknowledgeInsight]',
      );
      throw new AppError('Erro ao registrar feedback do insight.', 500);
    }
  }
}
