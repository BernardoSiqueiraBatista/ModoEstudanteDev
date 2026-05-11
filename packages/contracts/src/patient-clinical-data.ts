import { z } from 'zod';

export const hypothesisStatusSchema = z.enum(['ativo', 'investigando', 'descartado']);
export type HypothesisStatus = z.infer<typeof hypothesisStatusSchema>;

export const treatmentStatusSchema = z.enum([
  'em_andamento',
  'concluido',
  'pendente',
  'interrompido',
]);
export type TreatmentStatus = z.infer<typeof treatmentStatusSchema>;

export const timelineConfidenceSchema = z.enum(['Alta', 'Média', 'Baixa']);
export type TimelineConfidence = z.infer<typeof timelineConfidenceSchema>;

export const timelineHypothesisSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  title: z.string(),
  description: z.string(),
  status: hypothesisStatusSchema,
  confidence: z.number(),
  createdAt: z.string(),
});

export const timelineEventSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  date: z.string(),
  title: z.string(),
  doctor: z.string(),
  specialty: z.string(),
  type: z.enum(['consulta', 'exame', 'retorno', 'telemedicina']),
  hypotheses: z.array(timelineHypothesisSchema).optional(),
  tags: z.array(z.string()).optional(),
  quote: z.string().optional(),
  isExpanded: z.boolean().optional(),
  confidence: timelineConfidenceSchema.optional(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const hypothesisSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  title: z.string(),
  description: z.string(),
  status: hypothesisStatusSchema,
  confidence: z.number(),
  createdAt: z.string(),
  lastUpdate: z.string().optional(),
});
export type Hypothesis = z.infer<typeof hypothesisSchema>;

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
});
export type Medication = z.infer<typeof medicationSchema>;

export const treatmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  name: z.string(),
  description: z.string(),
  status: treatmentStatusSchema,
  startDate: z.string(),
  endDate: z.string().optional(),
  medications: z.array(medicationSchema).optional(),
});
export type Treatment = z.infer<typeof treatmentSchema>;

export const cognitiveSummarySchema = z.object({
  primaryFocus: z.string(),
  resolvedPhase: z.string(),
  ruledOut: z.array(z.string()),
  longitudinalInsight: z.string().optional(),
  correlationPercentage: z.number().optional(),
  workingHypothesis: z.string().optional(),
  totalConsultations: z.number().int().optional(),
  confidence: timelineConfidenceSchema.optional(),
});
export type CognitiveSummary = z.infer<typeof cognitiveSummarySchema>;

/** Backend wraps clinical data lists in `{ data: T[] }`. */
export const clinicalDataEnvelopeSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item) });

export const cognitiveSummaryEnvelopeSchema = z.object({
  data: cognitiveSummarySchema,
});
