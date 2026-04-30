import { z } from 'zod';

export const consultationStatusSchema = z.enum(['in_progress', 'completed', 'canceled']);
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;

export const insightKindSchema = z.enum([
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
  'clinical_support_enriched',
]);
export type InsightKind = z.infer<typeof insightKindSchema>;

export const insightSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type InsightSeverity = z.infer<typeof insightSeveritySchema>;

export const insightAckActionSchema = z.enum(['useful', 'not_useful', 'dismissed']);
export type InsightAckAction = z.infer<typeof insightAckActionSchema>;

export const createConsultationSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  doctorNotes: z.string().max(2000).optional(),
});
export type CreateConsultationDto = z.infer<typeof createConsultationSchema>;

export const acknowledgeInsightSchema = z.object({
  action: insightAckActionSchema,
});
export type AcknowledgeInsightDto = z.infer<typeof acknowledgeInsightSchema>;

/**
 * Backend uses snake_case in `consultation_sessions` rows. The API returns
 * those rows verbatim from controllers (no mapper), so the schema mirrors the
 * DB column names — keep this in sync with `consultations.types.ts` on back.
 */
export const consultationRowSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  appointment_id: z.string().nullable(),
  patient_id: z.string(),
  doctor_user_id: z.string(),
  status: consultationStatusSchema,
  started_at: z.string(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  audio_path: z.string().nullable(),
  summary: z.string().nullable(),
  doctor_notes: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable().optional(),
  clinical_macro: z.string().nullable().optional(),
  clinical_micro: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ConsultationRow = z.infer<typeof consultationRowSchema>;

export const transcriptRowSchema = z.object({
  id: z.string(),
  consultation_id: z.string(),
  text: z.string(),
  speaker: z.string().nullable(),
  is_final: z.boolean(),
  timestamp_ms: z.number().nullable(),
  created_at: z.string(),
});
export type TranscriptRow = z.infer<typeof transcriptRowSchema>;

export const insightRowSchema = z
  .object({
    id: z.string(),
    consultation_id: z.string(),
    kind: insightKindSchema,
    content: z.string(),
    rationale: z.string().nullable(),
    source_chunks: z.unknown().optional(),
    source_web: z.unknown().optional(),
    severity: insightSeveritySchema.nullable().optional(),
    confidence: z.number().nullable().optional(),
    acknowledged_at: z.string().nullable().optional(),
    acknowledged_action: insightAckActionSchema.nullable().optional(),
    created_at: z.string(),
  })
  .passthrough();
export type InsightRow = z.infer<typeof insightRowSchema>;

export const createConsultationResponseSchema = z.object({
  consultation: consultationRowSchema,
  wsUrls: z.object({
    audio: z.string(),
    state: z.string(),
  }),
});
export type CreateConsultationResponse = z.infer<typeof createConsultationResponseSchema>;

export const getConsultationResponseSchema = z.object({
  consultation: consultationRowSchema,
  transcripts: z.array(transcriptRowSchema),
  insights: z.array(insightRowSchema),
});
export type GetConsultationResponse = z.infer<typeof getConsultationResponseSchema>;

export const draftSummaryResponseSchema = z.object({
  consultationId: z.string(),
  structured: z.unknown().nullable(),
  plainText: z.string(),
});
export type DraftSummaryResponse = z.infer<typeof draftSummaryResponseSchema>;

export const finishConsultationBodySchema = z.object({
  doctorNotes: z.string().max(10000).optional(),
  summaryOverride: z.string().max(20000).optional(),
});
export type FinishConsultationBody = z.infer<typeof finishConsultationBodySchema>;

export const finishConsultationResponseSchema = z.object({
  consultationId: z.string(),
  summary: z.string(),
  structuredSummary: z.unknown().nullable(),
});
export type FinishConsultationResponse = z.infer<typeof finishConsultationResponseSchema>;

export const researchBodySchema = z.object({
  query: z.string().min(1).max(2000),
  includeWeb: z.boolean().optional(),
});
export type ResearchBody = z.infer<typeof researchBodySchema>;

export const researchResponseSchema = z
  .object({
    chunks: z.array(z.unknown()),
    webResults: z.array(z.unknown()).optional(),
    hasLocalEvidence: z.boolean().optional(),
    topSimilarity: z.number().optional(),
  })
  .passthrough();
export type ResearchResponse = z.infer<typeof researchResponseSchema>;

export const saveDoctorNoteBodySchema = z.object({
  text: z.string().min(1).max(5000),
});
export type SaveDoctorNoteBody = z.infer<typeof saveDoctorNoteBodySchema>;

export const updateConsultationBodySchema = z
  .object({
    doctor_notes: z.string().optional(),
    summary: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();
export type UpdateConsultationBody = z.infer<typeof updateConsultationBodySchema>;

export const insightApiItemSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  kind: insightKindSchema,
  content: z.string(),
  rationale: z.string().nullable(),
  severity: insightSeveritySchema.nullable(),
  confidence: z.number().nullable(),
  acknowledgedAt: z.string().nullable(),
  acknowledgedAction: insightAckActionSchema.nullable(),
  createdAt: z.string(),
});
export type InsightApiItem = z.infer<typeof insightApiItemSchema>;
