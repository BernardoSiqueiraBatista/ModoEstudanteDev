export type ConsultationStatus = 'in_progress' | 'completed' | 'canceled';

export interface ConsultationRow {
  id: string;
  org_id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_user_id: string;
  status: ConsultationStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  audio_path: string | null;
  summary: string | null;
  doctor_notes: string | null;
  metadata: Record<string, unknown> | null;
  clinical_macro: string | null;
  clinical_micro: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptRow {
  id: string;
  consultation_id: string;
  text: string;
  speaker: string | null;
  is_final: boolean;
  timestamp_ms: number | null;
  created_at: string;
}

export type InsightKind =
  | 'suggested_question'
  | 'clinical_alert'
  | 'keypoint'
  | 'differential'
  | 'exam_suggestion'
  | 'hypothesis'
  | 'referral'
  | 'orientation'
  | 'medical_insight'
  | 'clinical_note'
  | 'medication'
  | 'doctor_note'
  | 'clinical_support_enriched';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export type InsightAckAction = 'useful' | 'not_useful' | 'dismissed';

export interface InsightRow {
  id: string;
  consultation_id: string;
  kind: InsightKind;
  content: string;
  rationale: string | null;
  source_chunks: unknown;
  source_web: unknown;
  severity: InsightSeverity | null;
  confidence: number | null;
  support_level?: string | null;
  priority?: string | null;
  evidence_chunk_ids?: string[] | null;
  acknowledged_at: string | null;
  acknowledged_action: InsightAckAction | null;
  created_at: string;
}

export interface InsightInput {
  kind: InsightKind;
  content: string;
  rationale?: string | null;
  source_chunks?: unknown;
  source_web?: unknown;
  severity?: InsightSeverity | null;
  confidence?: number | null;
}

export interface ConsultationPatientRow {
  id: string;
  org_id: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  allergies: string | null;
  current_medications: string | null;
  chief_complaint: string | null;
  notes: string | null;
  doctor_id: string | null;
}
