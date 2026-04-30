-- Ampliar valores permitidos em consultation_insights.kind para cobrir:
--   hypothesis (hipótese diagnóstica), referral (encaminhamento),
--   orientation (orientação), medical_insight (insight do caso),
--   clinical_note (HDA/impressão), medication (prescrição),
--   doctor_note (anotação manual do médico).

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
      'doctor_note'
    )
  );

-- Coluna opcional metadata para payloads estruturados (dosage de medicação,
-- cid-10, especialidade etc) sem poluir content.
alter table app.consultation_insights
  add column if not exists metadata jsonb;
