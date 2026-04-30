import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { openai } from './openai-client';
import { openaiChatBreaker, CircuitOpenError } from './circuit-breaker';
import { ragService, RagResult, RagSearchOptions } from './rag.service';
import { ResearchService } from './research.service';
import { WebSearchService } from './web-search.service';
import { broadcastState } from '../ws/ws-registry';

const researchService = new ResearchService(
  ragService as any,
  new WebSearchService(),
);
import {
  buildSuggestionsSystemPrompt,
  buildSuggestionsUserPrompt,
  SUGGESTIONS_JSON_SCHEMA,
  SuggestionsJson,
  PatientContext,
} from './prompts/suggestions.prompt';
import { parsePartial, PartialParseResult } from './partial-json';
import { boostAlertByRedFlag } from './clinical-urgency-boost';
import { measureAsync, metrics } from '../../../shared/metrics/metrics';
import { performance } from 'node:perf_hooks';

const MIN_INPUT_CHARS = 50;
const MIN_CONFIDENCE_SIMILARITY = 0.6;

export interface ResolvedSource {
  index: number;
  chunkId: string | number;
  bookId: string | number | null;
  page: number | null;
  chapter: string | null;
  section: string | null;
  similarity: number;
  snippet: string;
}

export interface SuggestionItem {
  text: string;
  rationale: string;
  source: ResolvedSource | null;
}

export interface AlertItem extends SuggestionItem {
  severity: 'info' | 'warning' | 'critical';
}

export interface KeypointItem {
  text: string;
  source: ResolvedSource | null;
}

export interface SuggestionsResult {
  suggestedQuestions: SuggestionItem[];
  clinicalAlerts: AlertItem[];
  keypoints: KeypointItem[];
  sourceChunks: ResolvedSource[];
  empty: boolean;
}

function emptyResult(): SuggestionsResult {
  return {
    suggestedQuestions: [],
    clinicalAlerts: [],
    keypoints: [],
    sourceChunks: [],
    empty: true,
  };
}

function resolveSource(
  chunks: RagResult[],
  ref: number,
): ResolvedSource | null {
  const idx = Number(ref) - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx >= chunks.length) return null;
  const c = chunks[idx];
  return {
    index: idx + 1,
    chunkId: c.id,
    bookId: c.bookId,
    page: c.page,
    chapter: c.chapter,
    section: c.section,
    similarity: c.similarity,
    snippet:
      c.content.length > 300 ? `${c.content.slice(0, 300)}...` : c.content,
  };
}

export async function detectSuggestions(args: {
  consultationId: string;
  patient: PatientContext | null;
  recentTranscript: string;
  fullTranscript: string;
}): Promise<SuggestionsResult> {
  const recent = String(args.recentTranscript || '').trim();
  if (recent.length < MIN_INPUT_CHARS) return emptyResult();

  const query = recent.slice(-400);

  let chunks: RagResult[] = [];
  try {
    const research = await researchService.research(query, {
      webThreshold: MIN_CONFIDENCE_SIMILARITY,
    });
    chunks = research.chunks;

    // Se RAG fraca mas houve web results, broadcast como knowledge_sources
    if (!research.hasLocalEvidence && research.webResults.length > 0) {
      try {
        broadcastState(args.consultationId, {
          type: 'knowledge_sources',
          consultationId: args.consultationId,
          webResults: research.webResults,
          topSimilarity: research.topSimilarity,
          ts: Date.now(),
        });
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    logger.error(
      { err, consultationId: args.consultationId },
      'detectSuggestions: research failed',
    );
    return emptyResult();
  }

  if (!chunks.length) return emptyResult();
  const maxSim = chunks.reduce((m, c) => Math.max(m, c.similarity), 0);
  if (maxSim < MIN_CONFIDENCE_SIMILARITY) {
    logger.debug(
      { consultationId: args.consultationId, maxSim },
      'detectSuggestions: low similarity, skipping LLM',
    );
    return emptyResult();
  }

  const system = buildSuggestionsSystemPrompt();
  const user = buildSuggestionsUserPrompt({
    patient: args.patient,
    recentTranscript: recent,
    fullTranscript: args.fullTranscript,
    chunks,
  });

  let parsed: SuggestionsJson;
  try {
    const completion = await measureAsync('suggestions.llm_non_streaming', () =>
      openaiChatBreaker.execute(() =>
        openai.chat.completions.create({
          model: env.OPENAI_MODEL,
          temperature: 0.2,
          max_tokens: 400,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: SUGGESTIONS_JSON_SCHEMA,
          },
        }),
      ),
    );

    const raw = completion.choices?.[0]?.message?.content ?? '';
    if (!raw) {
      logger.warn(
        { consultationId: args.consultationId },
        'detectSuggestions: empty LLM output',
      );
      return emptyResult();
    }
    parsed = JSON.parse(raw) as SuggestionsJson;
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn(
        { consultationId: args.consultationId },
        'detectSuggestions: circuit open, skipping LLM',
      );
      return emptyResult();
    }
    logger.error(
      { err, consultationId: args.consultationId },
      'detectSuggestions: LLM call failed',
    );
    return emptyResult();
  }

  const suggestedQuestions: SuggestionItem[] = (parsed.suggestedQuestions || [])
    .slice(0, 3)
    .map((q) => ({
      text: q.text,
      rationale: q.rationale,
      source: resolveSource(chunks, q.sourceRef),
    }));

  const clinicalAlerts: AlertItem[] = (parsed.clinicalAlerts || [])
    .slice(0, 2)
    .map((a) =>
      boostAlertByRedFlag({
        text: a.text,
        severity: a.severity,
        rationale: a.rationale,
        source: resolveSource(chunks, a.sourceRef),
      }),
    );

  const keypoints: KeypointItem[] = (parsed.keypoints || [])
    .slice(0, 2)
    .map((k) => ({
      text: k.text,
      source: resolveSource(chunks, k.sourceRef),
    }));

  const usedIndices = new Set<number>();
  const sourceChunks: ResolvedSource[] = [];
  const collect = (s: ResolvedSource | null): void => {
    if (!s) return;
    if (usedIndices.has(s.index)) return;
    usedIndices.add(s.index);
    sourceChunks.push(s);
  };
  suggestedQuestions.forEach((q) => collect(q.source));
  clinicalAlerts.forEach((a) => collect(a.source));
  keypoints.forEach((k) => collect(k.source));

  const empty =
    suggestedQuestions.length === 0 &&
    clinicalAlerts.length === 0 &&
    keypoints.length === 0;

  return { suggestedQuestions, clinicalAlerts, keypoints, sourceChunks, empty };
}

function buildResultFromJson(
  parsed: SuggestionsJson,
  chunks: RagResult[],
): SuggestionsResult {
  const suggestedQuestions: SuggestionItem[] = (parsed.suggestedQuestions || [])
    .slice(0, 3)
    .map((q) => ({
      text: q.text,
      rationale: q.rationale,
      source: resolveSource(chunks, q.sourceRef),
    }));

  const clinicalAlerts: AlertItem[] = (parsed.clinicalAlerts || [])
    .slice(0, 2)
    .map((a) =>
      boostAlertByRedFlag({
        text: a.text,
        severity: a.severity,
        rationale: a.rationale,
        source: resolveSource(chunks, a.sourceRef),
      }),
    );

  const keypoints: KeypointItem[] = (parsed.keypoints || [])
    .slice(0, 2)
    .map((k) => ({
      text: k.text,
      source: resolveSource(chunks, k.sourceRef),
    }));

  const usedIndices = new Set<number>();
  const sourceChunks: ResolvedSource[] = [];
  const collect = (s: ResolvedSource | null): void => {
    if (!s) return;
    if (usedIndices.has(s.index)) return;
    usedIndices.add(s.index);
    sourceChunks.push(s);
  };
  suggestedQuestions.forEach((q) => collect(q.source));
  clinicalAlerts.forEach((a) => collect(a.source));
  keypoints.forEach((k) => collect(k.source));

  const empty =
    suggestedQuestions.length === 0 &&
    clinicalAlerts.length === 0 &&
    keypoints.length === 0;

  return { suggestedQuestions, clinicalAlerts, keypoints, sourceChunks, empty };
}

export interface PartialSuggestionsResult {
  suggestedQuestions: SuggestionItem[];
  clinicalAlerts: AlertItem[];
  keypoints: KeypointItem[];
  isFullyDone: boolean;
}

export interface StreamingCallbacks {
  onPartial?: (result: PartialSuggestionsResult) => void;
  onComplete?: (finalResult: SuggestionsResult) => void;
}

export interface SuggestionsDetectionOptions {
  rag?: RagSearchOptions;
}

interface OpenAiStreamChunk {
  choices?: Array<{ delta?: { content?: string | null } }>;
}

function partialToResolved(
  partial: PartialParseResult,
  chunks: RagResult[],
): PartialSuggestionsResult {
  return {
    suggestedQuestions: partial.completed.suggestedQuestions
      .slice(0, 3)
      .map((q) => ({
        text: q.text,
        rationale: q.rationale,
        source: resolveSource(chunks, q.sourceRef),
      })),
    clinicalAlerts: partial.completed.clinicalAlerts.slice(0, 2).map((a) =>
      boostAlertByRedFlag({
        text: a.text,
        severity: a.severity,
        rationale: a.rationale,
        source: resolveSource(chunks, a.sourceRef),
      }),
    ),
    keypoints: partial.completed.keypoints.slice(0, 2).map((k) => ({
      text: k.text,
      source: resolveSource(chunks, k.sourceRef),
    })),
    isFullyDone: partial.isFullyDone,
  };
}

export async function detectSuggestionsStreaming(
  args: {
    consultationId: string;
    patient: PatientContext | null;
    recentTranscript: string;
    fullTranscript: string;
  },
  callbacks: StreamingCallbacks,
  options: SuggestionsDetectionOptions = {},
): Promise<SuggestionsResult> {
  return measureAsync('suggestions.total', () =>
    detectSuggestionsStreamingImpl(args, callbacks, options),
  );
}

async function detectSuggestionsStreamingImpl(
  args: {
    consultationId: string;
    patient: PatientContext | null;
    recentTranscript: string;
    fullTranscript: string;
  },
  callbacks: StreamingCallbacks,
  options: SuggestionsDetectionOptions,
): Promise<SuggestionsResult> {
  const recent = String(args.recentTranscript || '').trim();
  if (recent.length < MIN_INPUT_CHARS) {
    const r = emptyResult();
    callbacks.onComplete?.(r);
    return r;
  }

  const query = recent.slice(-400);

  let chunks: RagResult[];
  try {
    chunks = await ragService.searchMedicalChunks(query, options.rag);
  } catch (err) {
    logger.error(
      { err, consultationId: args.consultationId },
      'detectSuggestionsStreaming: RAG failed',
    );
    const r = emptyResult();
    callbacks.onComplete?.(r);
    return r;
  }

  if (!chunks.length) {
    const r = emptyResult();
    callbacks.onComplete?.(r);
    return r;
  }
  const maxSim = chunks.reduce((m, c) => Math.max(m, c.similarity), 0);
  if (maxSim < MIN_CONFIDENCE_SIMILARITY) {
    logger.debug(
      { consultationId: args.consultationId, maxSim },
      'detectSuggestionsStreaming: low similarity, skipping LLM',
    );
    const r = emptyResult();
    callbacks.onComplete?.(r);
    return r;
  }

  const system = buildSuggestionsSystemPrompt();
  const user = buildSuggestionsUserPrompt({
    patient: args.patient,
    recentTranscript: recent,
    fullTranscript: args.fullTranscript,
    chunks,
  });

  let buffer = '';
  let lastCounts = { q: 0, a: 0, k: 0 };

  try {
    const stream = (await openaiChatBreaker.execute(() =>
      openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        stream: true,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: SUGGESTIONS_JSON_SCHEMA,
        },
      }),
    )) as unknown as AsyncIterable<OpenAiStreamChunk>;

    const streamStart = performance.now();
    let ttftRecorded = false;
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (!delta) continue;
      if (!ttftRecorded) {
        metrics.record(
          'suggestions.llm_streaming.ttft',
          performance.now() - streamStart,
        );
        ttftRecorded = true;
      }
      buffer += delta;

      const partial = parsePartial(buffer);
      const counts = {
        q: partial.completed.suggestedQuestions.length,
        a: partial.completed.clinicalAlerts.length,
        k: partial.completed.keypoints.length,
      };
      if (
        counts.q > lastCounts.q ||
        counts.a > lastCounts.a ||
        counts.k > lastCounts.k
      ) {
        lastCounts = counts;
        callbacks.onPartial?.(partialToResolved(partial, chunks));
      }
    }
    metrics.record(
      'suggestions.llm_streaming.total',
      performance.now() - streamStart,
    );
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn(
        { consultationId: args.consultationId },
        'detectSuggestionsStreaming: circuit open, skipping LLM',
      );
      const r = emptyResult();
      callbacks.onComplete?.(r);
      return r;
    }
    logger.error(
      { err, consultationId: args.consultationId },
      'detectSuggestionsStreaming: LLM stream failed',
    );
    const r = emptyResult();
    callbacks.onComplete?.(r);
    return r;
  }

  if (!buffer) {
    logger.warn(
      { consultationId: args.consultationId },
      'detectSuggestionsStreaming: empty LLM output',
    );
    const r = emptyResult();
    callbacks.onComplete?.(r);
    return r;
  }

  let parsed: SuggestionsJson;
  try {
    parsed = JSON.parse(buffer) as SuggestionsJson;
  } catch (err) {
    // Fallback: salvage whatever items we managed to parse partially.
    logger.warn(
      { err, consultationId: args.consultationId },
      'detectSuggestionsStreaming: final JSON parse failed, using partial',
    );
    const partial = parsePartial(buffer);
    parsed = {
      suggestedQuestions: partial.completed.suggestedQuestions,
      clinicalAlerts: partial.completed.clinicalAlerts,
      keypoints: partial.completed.keypoints,
    };
  }

  const finalResult = buildResultFromJson(parsed, chunks);
  callbacks.onComplete?.(finalResult);
  return finalResult;
}
