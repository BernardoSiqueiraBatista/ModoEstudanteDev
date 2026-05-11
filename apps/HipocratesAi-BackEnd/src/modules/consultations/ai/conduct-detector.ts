import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { openaiChatBreaker, CircuitOpenError } from './circuit-breaker';
import { createChatCompletionResilient, truncateToMaxTokens } from './llm-utils';
import {
  buildConductSystemPrompt,
  buildConductUserPrompt,
  CONDUCT_JSON_SCHEMA,
  ConductJson,
} from './prompts/conduct.prompt';
import type { PatientContext } from './prompts/suggestions.prompt';
import { measureAsync } from '../../../shared/metrics/metrics';

const MIN_INPUT_CHARS = 120;

export interface ConductResult {
  hypotheses: Array<{ title: string; confidence: number; rationale: string }>;
  examRequests: Array<{ name: string; rationale: string }>;
  referrals: Array<{ name: string; specialty: string }>;
  orientations: Array<{ text: string }>;
  medicalInsight: string;
  clinicalNote: { hda: string; clinicalImpression: string[] };
  empty: boolean;
}

function emptyResult(): ConductResult {
  return {
    hypotheses: [],
    examRequests: [],
    referrals: [],
    orientations: [],
    medicalInsight: '',
    clinicalNote: { hda: '', clinicalImpression: [] },
    empty: true,
  };
}

export async function detectConduct(args: {
  consultationId: string;
  patient: PatientContext | null;
  fullTranscript: string;
}): Promise<ConductResult> {
  const transcript = truncateToMaxTokens(
    String(args.fullTranscript || '').trim(),
    env.OPENAI_MAX_INPUT_TOKENS,
  );
  if (transcript.length < MIN_INPUT_CHARS) return emptyResult();

  try {
    const completion = await measureAsync('conduct.llm', () =>
      openaiChatBreaker.execute(() =>
        createChatCompletionResilient(
          {
            model: env.OPENAI_MODEL,
            temperature: 0.2,
            max_tokens: 900,
            messages: [
              { role: 'system', content: buildConductSystemPrompt() },
              {
                role: 'user',
                content: buildConductUserPrompt({
                  patient: args.patient,
                  fullTranscript: transcript,
                }),
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: CONDUCT_JSON_SCHEMA,
            },
          },
          { consultationId: args.consultationId },
        ),
      ),
    );

    const raw = completion.choices?.[0]?.message?.content ?? '';
    if (!raw) return emptyResult();

    const parsed = JSON.parse(raw) as ConductJson;

    const hypotheses = (parsed.hypotheses ?? []).slice(0, 3);
    const examRequests = (parsed.examRequests ?? []).slice(0, 5);
    const referrals = (parsed.referrals ?? []).slice(0, 3);
    const orientations = (parsed.orientations ?? []).slice(0, 4);
    const medicalInsight = String(parsed.medicalInsight ?? '').trim();
    const clinicalNote = {
      hda: String(parsed.clinicalNote?.hda ?? '').trim(),
      clinicalImpression: Array.isArray(parsed.clinicalNote?.clinicalImpression)
        ? parsed.clinicalNote.clinicalImpression.slice(0, 5)
        : [],
    };

    const empty =
      hypotheses.length === 0 &&
      examRequests.length === 0 &&
      referrals.length === 0 &&
      orientations.length === 0 &&
      !medicalInsight &&
      !clinicalNote.hda;

    return {
      hypotheses,
      examRequests,
      referrals,
      orientations,
      medicalInsight,
      clinicalNote,
      empty,
    };
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn({ consultationId: args.consultationId }, 'conduct-detector: circuit open');
    } else {
      logger.error({ err, consultationId: args.consultationId }, 'conduct-detector: failed');
    }
    return emptyResult();
  }
}
