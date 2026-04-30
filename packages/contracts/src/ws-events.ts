import { z } from 'zod';
import { insightAckActionSchema } from './consultations';

/**
 * WebSocket — server → client
 *
 * The server emits a heterogeneous stream of typed messages on
 * `/ws/consultations/:id/state`. Each message carries `type` plus payload.
 * Schemas use `.passthrough()` so unknown fields don't break parse — keeps
 * the front forward-compatible with new server-side fields.
 */

const baseEnvelope = z.object({
  type: z.string(),
  consultationId: z.string().optional(),
  ts: z.number().optional(),
});

const transcriptItemSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  speaker: z.string().nullable().optional(),
  is_final: z.boolean().optional(),
  isFinal: z.boolean().optional(),
  timestamp_ms: z.number().nullable().optional(),
  timestampMs: z.number().nullable().optional(),
  created_at: z.string().optional(),
});
export type WsTranscriptItem = z.infer<typeof transcriptItemSchema>;

const insightItemSchema = z
  .object({
    id: z.string().optional(),
    kind: z.string().optional(),
    content: z.string().optional(),
    rationale: z.string().nullable().optional(),
    severity: z.string().nullable().optional(),
    confidence: z.number().nullable().optional(),
    acknowledged_at: z.string().nullable().optional(),
    acknowledged_action: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();
export type WsInsightItem = z.infer<typeof insightItemSchema>;

export const wsInitialStateSchema = baseEnvelope.extend({
  type: z.literal('initial_state'),
  transcripts: z.array(transcriptItemSchema).default([]),
  insights: z.array(insightItemSchema).default([]),
});
export type WsInitialState = z.infer<typeof wsInitialStateSchema>;

export const wsTranscriptPartialSchema = baseEnvelope.extend({
  type: z.literal('transcript_partial'),
  text: z.string(),
  speaker: z.string(),
  rawSpeaker: z.number().optional(),
});
export type WsTranscriptPartial = z.infer<typeof wsTranscriptPartialSchema>;

export const wsTranscriptFinalSchema = baseEnvelope.extend({
  type: z.literal('transcript_final'),
  text: z.string(),
  speaker: z.string(),
  rawSpeaker: z.number().optional(),
  timestampMs: z.number().optional(),
});
export type WsTranscriptFinal = z.infer<typeof wsTranscriptFinalSchema>;

export const wsInsightsUpdateSchema = baseEnvelope
  .extend({
    type: z.literal('insights_update'),
    suggestedQuestions: z.array(z.unknown()).optional(),
    clinicalAlerts: z.array(z.unknown()).optional(),
    keypoints: z.array(z.unknown()).optional(),
    sourceChunks: z.array(z.unknown()).optional(),
    delta: z.unknown().optional(),
    final: z.boolean().optional(),
  })
  .passthrough();
export type WsInsightsUpdate = z.infer<typeof wsInsightsUpdateSchema>;

export const wsInsightsEnrichedSchema = baseEnvelope
  .extend({
    type: z.literal('insights_enriched_update'),
    macro: z.string().optional(),
    micro: z.string().nullable().optional(),
    confidence: z.number().optional(),
    hypotheses: z.array(z.unknown()).optional(),
    clinicalAlerts: z.array(z.unknown()).optional(),
    suggestedQuestions: z.array(z.unknown()).optional(),
    orientations: z.array(z.unknown()).optional(),
  })
  .passthrough();
export type WsInsightsEnriched = z.infer<typeof wsInsightsEnrichedSchema>;

export const wsConductUpdateSchema = baseEnvelope
  .extend({
    type: z.literal('conduct_update'),
    hypotheses: z.array(z.unknown()).optional(),
    examRequests: z.array(z.unknown()).optional(),
    referrals: z.array(z.unknown()).optional(),
    orientations: z.array(z.unknown()).optional(),
    medicalInsight: z.unknown().optional(),
    clinicalNote: z.unknown().optional(),
  })
  .passthrough();
export type WsConductUpdate = z.infer<typeof wsConductUpdateSchema>;

export const wsPrescriptionUpdateSchema = baseEnvelope.extend({
  type: z.literal('prescription_update'),
  medications: z.array(z.unknown()).default([]),
});
export type WsPrescriptionUpdate = z.infer<typeof wsPrescriptionUpdateSchema>;

export const wsClarificationNeededSchema = baseEnvelope.extend({
  type: z.literal('clarification_needed'),
  question: z.string(),
  options: z.array(z.string()).optional(),
  whyItMatters: z.string().optional(),
  source: z.string().optional(),
});
export type WsClarificationNeeded = z.infer<typeof wsClarificationNeededSchema>;

export const wsKnowledgeStatusSchema = baseEnvelope.extend({
  type: z.literal('knowledge_status'),
  status: z.string(),
  reason: z.string().optional(),
  source: z.string().optional(),
});
export type WsKnowledgeStatus = z.infer<typeof wsKnowledgeStatusSchema>;

export const wsSubscribedSchema = baseEnvelope.extend({
  type: z.literal('subscribed'),
});
export type WsSubscribed = z.infer<typeof wsSubscribedSchema>;

export const wsPongSchema = baseEnvelope.extend({
  type: z.literal('pong'),
});
export type WsPong = z.infer<typeof wsPongSchema>;

export const wsInsightAckedSchema = baseEnvelope.extend({
  type: z.literal('insight_acked'),
  insightId: z.string(),
  action: insightAckActionSchema,
});
export type WsInsightAcked = z.infer<typeof wsInsightAckedSchema>;

export const wsErrorSchema = baseEnvelope.extend({
  type: z.literal('error'),
  message: z.string(),
});
export type WsError = z.infer<typeof wsErrorSchema>;

/**
 * Discriminated union of every well-known message. Unknown `type` values are
 * handled at the client (caller uses `safeParse` and skips on failure); we
 * don't include a catch-all branch here because doing so widens `type` to
 * `string` and breaks narrowing on the consumer side.
 */
export const wsServerMessageSchema = z.discriminatedUnion('type', [
  wsInitialStateSchema,
  wsTranscriptPartialSchema,
  wsTranscriptFinalSchema,
  wsInsightsUpdateSchema,
  wsInsightsEnrichedSchema,
  wsConductUpdateSchema,
  wsPrescriptionUpdateSchema,
  wsClarificationNeededSchema,
  wsKnowledgeStatusSchema,
  wsSubscribedSchema,
  wsPongSchema,
  wsInsightAckedSchema,
  wsErrorSchema,
]);
export type WsServerMessage = z.infer<typeof wsServerMessageSchema>;

/**
 * WebSocket — client → server
 */
export const wsSubscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
});
export const wsPingMessageSchema = z.object({
  type: z.literal('ping'),
});
export const wsInsightAckMessageSchema = z.object({
  type: z.literal('insight_ack'),
  insightId: z.string(),
  action: insightAckActionSchema,
});
export const wsClientMessageSchema = z.union([
  wsSubscribeMessageSchema,
  wsPingMessageSchema,
  wsInsightAckMessageSchema,
]);
export type WsClientMessage = z.infer<typeof wsClientMessageSchema>;
