import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { openaiChatBreaker, CircuitOpenError } from './circuit-breaker';
import { createChatCompletionResilient, truncateToMaxTokens } from './llm-utils';
import {
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  SUMMARY_JSON_SCHEMA,
  SummaryJson,
} from './prompts/summary.prompt';
import type { PatientContext } from './prompts/suggestions.prompt';
import { measureAsync } from '../../../shared/metrics/metrics';

export interface SummaryResult {
  structured: SummaryJson;
  plainText: string;
}

function renderPlainText(s: SummaryJson): string {
  return [
    '## Resumo Clínico (SOAP)',
    '',
    '**Subjetivo (S)**',
    s.subjective || 'não informado',
    '',
    '**Objetivo (O)**',
    s.objective || 'não informado',
    '',
    '**Avaliação (A)**',
    s.assessment || 'não informado',
    '',
    '**Plano (P)**',
    s.plan || 'não informado',
    '',
    '**Seguimento**',
    s.followUp || 'não informado',
    '',
    '**Queixa Principal**',
    s.chiefComplaint || 'não informado',
    '',
    '**Impressão Clínica**',
    s.clinicalImpression?.length ? s.clinicalImpression.map((i) => `- ${i}`).join('\n') : 'não informado',
    '',
    '**CID-10 Sugerido**',
    s.suggestedIcd10?.length
      ? s.suggestedIcd10.map((c) => `- ${c.code}: ${c.description}`).join('\n')
      : 'não informado',
  ].join('\n');
}

export async function generateSummary(args: {
  consultationId: string;
  patient: PatientContext | null;
  fullTranscript: string;
}): Promise<SummaryResult> {
  const transcript = String(args.fullTranscript || '').trim();
  if (!transcript) {
    const empty: SummaryJson = {
      subjective: 'não informado',
      objective: 'não informado',
      assessment: 'não informado',
      plan: 'não informado',
      followUp: 'não informado',
      chiefComplaint: 'não informado',
      clinicalImpression: [],
      suggestedIcd10: [],
    };
    return { structured: empty, plainText: renderPlainText(empty) };
  }

  try {
    const completion = await measureAsync('summary.llm', () =>
      openaiChatBreaker.execute(() =>
      createChatCompletionResilient({
        model: env.OPENAI_SUMMARY_MODEL,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: 'system', content: buildSummarySystemPrompt() },
        {
          role: 'user',
          content: buildSummaryUserPrompt({
            patient: args.patient,
            fullTranscript: truncateToMaxTokens(transcript, env.OPENAI_MAX_INPUT_TOKENS),
          }),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: SUMMARY_JSON_SCHEMA,
      },
      }, { consultationId: args.consultationId }),
      ),
    );

    const raw = completion.choices?.[0]?.message?.content ?? '';
    if (!raw) throw new Error('empty LLM output');
    const parsed = JSON.parse(raw) as SummaryJson;
    return { structured: parsed, plainText: renderPlainText(parsed) };
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn(
        { consultationId: args.consultationId },
        'generateSummary: circuit open, returning fallback',
      );
      const fallback: SummaryJson = {
        subjective: 'não informado',
        objective: 'não informado',
        assessment: 'não informado',
        plan: 'não informado',
        followUp: 'não informado',
        chiefComplaint: 'não informado',
        clinicalImpression: [],
        suggestedIcd10: [],
      };
      return { structured: fallback, plainText: renderPlainText(fallback) };
    }
    logger.error(
      { err, consultationId: args.consultationId },
      'generateSummary: LLM call failed',
    );
    const fallback: SummaryJson = {
      subjective: 'não informado',
      objective: 'não informado',
      assessment: 'não informado',
      plan: 'não informado',
      followUp: 'não informado',
        chiefComplaint: 'não informado',
        clinicalImpression: [],
        suggestedIcd10: [],
    };
    return { structured: fallback, plainText: renderPlainText(fallback) };
  }
}
