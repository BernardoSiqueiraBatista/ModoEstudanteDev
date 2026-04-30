-- =============================================================================
-- Migration 006: Clinical LLM enriched support
-- =============================================================================

alter table app.consultation_insights
  drop constraint if exists consultation_insights_kind_check;

alter table app.consultation_insights
  add constraint consultation_insights_kind_check
  check (
    kind in (
      'suggested_question',
      'clinical_alert',
      'keypoint',
      'differential',
      'exam_suggestion',
      'hypothesis',
      'referral',
      'orientation',
      'medical_insight',
      'clinical_note',
      'medication',
      'doctor_note',
      'clinical_support_enriched'
    )
  );

alter table app.consultation_insights
  add column if not exists support_level text
    check (support_level is null or support_level in ('evidencia', 'geral')),
  add column if not exists priority text
    check (priority is null or priority in ('alta', 'media', 'baixa')),
  add column if not exists evidence_chunk_ids text[];

alter table app.consultation_sessions
  add column if not exists clinical_macro text,
  add column if not exists clinical_micro text;

create index if not exists idx_insights_clinical_support_evidence
  on app.consultation_insights using gin (evidence_chunk_ids);

create index if not exists idx_consultation_sessions_clinical_macro
  on app.consultation_sessions (clinical_macro);
