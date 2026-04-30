import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { openaiChatBreaker, CircuitOpenError } from './circuit-breaker';
import { createChatCompletionResilient, truncateToMaxTokens } from './llm-utils';
import {
  buildPrescriptionSystemPrompt,
  buildPrescriptionUserPrompt,
  PRESCRIPTION_JSON_SCHEMA,
  PrescriptionJson,
} from './prompts/prescription.prompt';
import type { PatientContext } from './prompts/suggestions.prompt';
import { measureAsync } from '../../../shared/metrics/metrics';

const MIN_INPUT_CHARS = 120;

export interface PrescriptionResult {
  medications: PrescriptionJson['medications'];
  empty: boolean;
}

export async function detectPrescription(args: {
  consultationId: string;
  patient: PatientContext | null;
  fullTranscript: string;
}): Promise<PrescriptionResult> {
  const transcript = truncateToMaxTokens(
    String(args.fullTranscript || '').trim(),
    env.OPENAI_MAX_INPUT_TOKENS,
  );
  if (transcript.length < MIN_INPUT_CHARS) return { medications: [], empty: true };

  try {
    const completion = await measureAsync('prescription.llm', () =>
      openaiChatBreaker.execute(() =>
        createChatCompletionResilient(
          {
            model: env.OPENAI_MODEL,
            temperature: 0.1,
            max_tokens: 700,
            messages: [
              { role: 'system', content: buildPrescriptionSystemPrompt() },
              {
                role: 'user',
                content: buildPrescriptionUserPrompt({
                  patient: args.patient,
                  fullTranscript: transcript,
                }),
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: PRESCRIPTION_JSON_SCHEMA,
            },
          },
          { consultationId: args.consultationId },
        ),
      ),
    );

    const raw = completion.choices?.[0]?.message?.content ?? '';
    if (!raw) return { medications: [], empty: true };
    const parsed = JSON.parse(raw) as PrescriptionJson;
    const meds = (parsed.medications ?? []).slice(0, 10);
    return { medications: meds, empty: meds.length === 0 };
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn({ consultationId: args.consultationId }, 'prescription-detector: circuit open');
    } else {
      logger.error({ err, consultationId: args.consultationId }, 'prescription-detector: failed');
    }
    return { medications: [], empty: true };
  }
}
