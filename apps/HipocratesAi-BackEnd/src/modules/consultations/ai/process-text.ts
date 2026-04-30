import crypto from 'crypto';
import { env } from '../../../config/env';
import { logger } from '../../../shared/logger/logger';
import { broadcastState } from '../ws/ws-registry';
import { ConsultationsRepository } from '../consultations.repository';
import { canCall, resetLimiter } from './rate-limiter';
import {
  detectSuggestionsStreaming,
  SuggestionsResult,
  PartialSuggestionsResult,
  SuggestionItem,
  AlertItem,
  KeypointItem,
  ResolvedSource,
} from './suggestions-detector';
import { detectConduct } from './conduct-detector';
import { detectPrescription } from './prescription-detector';
import type { PatientContext } from './prompts/suggestions.prompt';
import {
  runFastAlerts,
  cleanupFastAlerts,
  parseAllergies,
  parseMedications,
} from './fast-alerts';
import { embedText } from './embeddings.service';
import { isNonClinicalSmallTalk } from './clinical-linguistic-filter';
import { TranscriptBuffer, BufferedUtterance } from './transcript-buffer';
import { measureAsync } from '../../../shared/metrics/metrics';
import { performance } from 'node:perf_hooks';
import {
  classifyMacro,
  checklistQuestion,
  clinicalSupport,
  ClinicalLlmInsufficientEvidence,
  ClinicalLlmNoCitations,
  ClinicalLlmPending,
  ClinicalSupportResp,
  DifferentialItem,
  ClinicalChecklistItem,
  RedFlagItem,
  NextStepItem,
} from './clinical-llm';

interface PipelineState {
  transcriptBuffer: TranscriptBuffer;
  recentHashes: string[]; // last N (speaker, text) hashes for dedup
  debounceTimer: NodeJS.Timeout | null;
  lastRunAt: number;
  running: boolean;
  queued: boolean;
  patient: PatientContext | null;
  patientLoaded: boolean;
  lastInsightsHash: string;
  lastContextHash: string;
  sessionStartedAt: number;
  clinicalMacro: {
    macro: string;
    micro: string | null;
    decidedAt: number;
  } | null;
  clinicalSupportSeq: number;
  clinicalSupportAbort: AbortController | null;
  lastBroadcast: {
    questions: string[];
    alerts: string[];
    keypoints: string[];
  };
  /**
   * Promise que resolve quando a rehidratação do buffer pós-restart termina.
   * null = rehidratação ainda não foi iniciada.
   * Promise<void> = rehidratação em progresso ou concluída (always resolves, never rejects).
   */
  rehydrationPromise: Promise<void> | null;
}

const LONG_SESSION_THRESHOLD_MS = 15 * 60 * 1000;
const LONG_SESSION_THROTTLE_FACTOR = 2;
const CLINICAL_MACRO_TTL_MS = 3 * 60 * 1000;

/**
 * Throttle adaptativo: consultas com mais de 15min duplicam o intervalo
 * mínimo entre ciclos. Intenção: dar mais tempo entre atualizações depois
 * que médico já convergiu no caso (cooldown do Copilot1, adaptado à ordem
 * de grandeza da Hipocrates — base é env.INSIGHTS_THROTTLE_MS, tipicamente
 * <1s, não 30s).
 */
export function getAdaptiveThrottleMs(sessionStartedAt: number): number {
  const durationMs = Date.now() - sessionStartedAt;
  const factor =
    durationMs >= LONG_SESSION_THRESHOLD_MS ? LONG_SESSION_THROTTLE_FACTOR : 1;
  return env.INSIGHTS_THROTTLE_MS * factor;
}

const DEDUP_HISTORY = 5;
const MIN_MEANINGFUL_CHARS = 25;
const FILLER_ONLY_REGEX =
  /^(\s*(ok|ent[aã]o|n[eé]|t[aá]|certo|sim|n[aã]o|ah|hum+|hm+|[eé]|oi+|ol[aá]|bom\s*dia|boa\s*tarde|boa\s*noite|tudo\s*bem|beleza|obrigad[oa]|valeu|tchau|at[eé]\s*mais)\s*[.,!?]*)+$/i;
const SPEAKER_PREFIX_REGEX = /^\[[^\]]+\]\s*/gm;

/**
 * Determina se o texto formatado do buffer é puramente ruído:
 * curto demais ou composto só de cumprimentos/confirmações. Evita gastar
 * rate limit e chamada ao LLM com silêncio ou social talk.
 */
export function isMeaninglessTranscript(transcript: string): boolean {
  const stripped = String(transcript || '')
    .replace(SPEAKER_PREFIX_REGEX, '')
    .replace(/\n/g, ' ')
    .trim();
  if (stripped.length < MIN_MEANINGFUL_CHARS) return true;
  if (FILLER_ONLY_REGEX.test(stripped)) return true;
  return false;
}

function makeDedupHash(speaker: string, text: string): string {
  return `${speaker}:${text.slice(0, 80)}`;
}

/**
 * Checks if the given (speaker, text) pair was recently processed.
 * Mutates recentHashes to keep only the last DEDUP_HISTORY entries.
 * Returns true if it is a duplicate (caller should skip).
 */
export function isDuplicateUtterance(
  state: { recentHashes: string[] },
  speaker: string,
  text: string,
): boolean {
  const hash = makeDedupHash(speaker, text);
  if (state.recentHashes.includes(hash)) return true;
  state.recentHashes.push(hash);
  while (state.recentHashes.length > DEDUP_HISTORY) state.recentHashes.shift();
  return false;
}

const STATES = new Map<string, PipelineState>();
const repository = new ConsultationsRepository();

function getState(consultationId: string): PipelineState {
  let s = STATES.get(consultationId);
  if (!s) {
    s = {
      transcriptBuffer: new TranscriptBuffer(),
      recentHashes: [],
      debounceTimer: null,
      lastRunAt: 0,
      running: false,
      queued: false,
      patient: null,
      patientLoaded: false,
      lastInsightsHash: '',
      lastContextHash: '',
      sessionStartedAt: Date.now(),
      clinicalMacro: null,
      clinicalSupportSeq: 0,
      clinicalSupportAbort: null,
      lastBroadcast: { questions: [], alerts: [], keypoints: [] },
      rehydrationPromise: null,
    };
    STATES.set(consultationId, s);
  }
  return s;
}

function hashResult(r: SuggestionsResult): string {
  return crypto
    .createHash('md5')
    .update(
      JSON.stringify({
        q: r.suggestedQuestions.map((x) => x.text),
        a: r.clinicalAlerts.map((x) => `${x.severity}:${x.text}`),
        k: r.keypoints.map((x) => x.text),
      }),
    )
    .digest('hex');
}

function formatUtterances(utts: readonly BufferedUtterance[]): string {
  return utts.map((u) => `[${u.speaker}] ${u.text}`).join('\n');
}

function pickNewQuestions(
  items: SuggestionItem[],
  seen: string[],
): SuggestionItem[] {
  const set = new Set(seen);
  return items.filter((it) => !set.has(it.text));
}
function pickNewAlerts(items: AlertItem[], seen: string[]): AlertItem[] {
  const set = new Set(seen);
  return items.filter((it) => !set.has(`${it.severity}:${it.text}`));
}
function pickNewKeypoints(
  items: KeypointItem[],
  seen: string[],
): KeypointItem[] {
  const set = new Set(seen);
  return items.filter((it) => !set.has(it.text));
}

function evidenceRefs(ids: string[]): Array<{ chunkId: string }> {
  return ids.map((chunkId) => ({ chunkId }));
}

function supportLevelCamel(level: string): string {
  return level === 'evidencia' ? 'evidencia' : 'geral';
}

function mapDifferentialItem(
  item: DifferentialItem,
  confidence: number,
): Record<string, unknown> {
  return {
    title: item.dx,
    confidence,
    rationale: item.rationale,
    priority: item.priority,
    supportLevel: supportLevelCamel(item.support_level),
    evidenceChunkIds: item.evidence_chunk_ids,
    citations: evidenceRefs(item.evidence_chunk_ids),
  };
}

function mapChecklistItem(
  item: ClinicalChecklistItem,
): Record<string, unknown> {
  return {
    text: item.question,
    rationale: item.why,
    priority: item.priority,
    supportLevel: supportLevelCamel(item.support_level),
    evidenceChunkIds: item.evidence_chunk_ids,
    citations: evidenceRefs(item.evidence_chunk_ids),
  };
}

function priorityToSeverity(
  priority: 'alta' | 'media' | 'baixa',
): 'critical' | 'warning' | 'info' {
  if (priority === 'alta') return 'critical';
  if (priority === 'media') return 'warning';
  return 'info';
}

const SEVERITY_RANK: Record<'info' | 'warning' | 'critical', number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

function maxSeverity(
  a: 'info' | 'warning' | 'critical',
  b: 'info' | 'warning' | 'critical',
): 'info' | 'warning' | 'critical' {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/**
 * Faz merge de red flags do FastAPI com alerts do streaming base, preservando
 * a MAIOR severity quando o mesmo texto aparece dos dois lados. Antes,
 * filter() descartava o enriched se o texto já existia na base — perdendo
 * a promoção (streaming marca "dor torácica" como warning, FastAPI marca
 * como 'alta' ⇒ critical; filtrado sumia). Agora o enriched herda a
 * severity máxima entre as duas e preserva os metadados do FastAPI
 * (priority, evidence_chunk_ids, support_level).
 */
function mergeRedFlagsWithBase(
  base: AlertItem[],
  enriched: Array<AlertItem & Record<string, unknown>>,
): Array<AlertItem & Record<string, unknown>> {
  const baseByKey = new Map<string, AlertItem>();
  for (const a of base) {
    baseByKey.set(a.text.trim().toLowerCase(), a);
  }
  return enriched.map((item) => {
    const baseMatch = baseByKey.get(item.text.trim().toLowerCase());
    if (!baseMatch) return item;
    return { ...item, severity: maxSeverity(item.severity, baseMatch.severity) };
  });
}

function mapRedFlagItem(
  item: RedFlagItem,
): AlertItem & Record<string, unknown> {
  return {
    text: item.flag,
    rationale: item.why,
    severity: priorityToSeverity(item.priority),
    source: null,
    priority: item.priority,
    action: item.action,
    supportLevel: supportLevelCamel(item.support_level),
    evidenceChunkIds: item.evidence_chunk_ids,
    citations: evidenceRefs(item.evidence_chunk_ids),
  };
}

/**
 * Agrega evidence_chunk_ids dos 4 arrays do ClinicalSupportResp em um array
 * top-level no mesmo shape de ResolvedSource que o front já consome via
 * `sourceChunks`. Reusa metadados do RAG do streaming (base) quando o mesmo
 * chunk é citado, e cria stub com só chunkId quando o FastAPI cita um chunk
 * que não apareceu no RAG local (raro; acontece quando FastAPI e TS usam
 * RPCs diferentes sobre a mesma tabela).
 */
function aggregateEnrichedSourceChunks(
  baseSourceChunks: ResolvedSource[],
  support: ClinicalSupportResp,
): ResolvedSource[] {
  const byId = new Map<string, ResolvedSource>();
  for (const chunk of baseSourceChunks) {
    byId.set(String(chunk.chunkId), chunk);
  }
  const cited = [
    ...support.differential.flatMap((x) => x.evidence_chunk_ids),
    ...support.checklist_questions.flatMap((x) => x.evidence_chunk_ids),
    ...support.red_flags.flatMap((x) => x.evidence_chunk_ids),
    ...support.next_steps_suggested.flatMap((x) => x.evidence_chunk_ids),
  ];
  const seen = new Set<string>();
  const result: ResolvedSource[] = [];
  for (const id of cited) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const existing = byId.get(id);
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        index: result.length + 1,
        chunkId: id,
        bookId: null,
        page: null,
        chapter: null,
        section: null,
        similarity: 0,
        snippet: '',
      });
    }
  }
  return result;
}

function mapNextStepItem(item: NextStepItem): Record<string, unknown> {
  return {
    text: item.step,
    rationale: item.why,
    supportLevel: supportLevelCamel(item.support_level),
    evidenceChunkIds: item.evidence_chunk_ids,
    citations: evidenceRefs(item.evidence_chunk_ids),
  };
}

async function resolveClinicalMacro(args: {
  consultationId: string;
  state: PipelineState;
  recentTranscript: string;
}): Promise<{ macro: string; micro: string | null } | null> {
  const { consultationId, state, recentTranscript } = args;
  if (!env.ENABLE_CLINICAL_LLM) return null;

  // Cache por TTL (3min): macro clínica tende a ser estável dentro de uma
  // mesma consulta. Antes o cache dependia do hash do contexto recente, que
  // mudava a cada fala — cache nunca hitava. Agora respeita a estabilidade
  // do diagnóstico. Para invalidar antes do TTL, espere o novo ciclo passar
  // pelo TTL ou limpe via cleanupSession.
  if (
    state.clinicalMacro &&
    Date.now() - state.clinicalMacro.decidedAt < CLINICAL_MACRO_TTL_MS
  ) {
    return {
      macro: state.clinicalMacro.macro,
      micro: state.clinicalMacro.micro,
    };
  }

  try {
    const macro = await classifyMacro(recentTranscript, { consultationId });
    logger.info(
      {
        consultationId,
        macro: macro.final,
        status: macro.status,
        score: macro.top3[0]?.score ?? null,
      },
      'clinical-llm macro classification',
    );

    if (macro.status === 'PENDING') {
      checklistQuestion(recentTranscript, macro.top3, { consultationId })
        .then((question) => {
          broadcastState(consultationId, {
            type: 'clarification_needed',
            consultationId,
            question: question.question,
            options: question.options,
            whyItMatters: question.why_it_matters,
            source: 'clinical_llm',
            ts: Date.now(),
          });
        })
        .catch((err) => {
          logger.warn(
            { err, consultationId },
            'clinical-llm checklist question failed',
          );
        });
      return null;
    }

    if (!macro.final) return null;
    state.clinicalMacro = {
      macro: macro.final,
      micro: null,
      decidedAt: Date.now(),
    };
    repository
      .updateClinicalClassification(consultationId, {
        macro: macro.final,
        micro: null,
      })
      .catch((err) => {
        logger.warn({ err, consultationId }, 'clinical macro persist failed');
      });
    return { macro: macro.final, micro: null };
  } catch (err) {
    if (err instanceof ClinicalLlmPending) {
      logger.info({ consultationId }, 'clinical-llm macro pending');
    } else {
      logger.warn(
        { err, consultationId },
        'clinical-llm macro degraded to generic RAG',
      );
    }
    return null;
  }
}

function broadcastKnowledgeStatus(
  consultationId: string,
  status: 'insufficient_evidence' | 'no_citations',
  reason: string,
): void {
  broadcastState(consultationId, {
    type: 'knowledge_status',
    consultationId,
    status,
    reason,
    source: 'clinical_llm',
    ts: Date.now(),
  });
}

function runClinicalSupportEnrichment(args: {
  consultationId: string;
  contextHash: string;
  sequence: number;
  recentTranscript: string;
  baseResult: SuggestionsResult;
}): void {
  if (!env.ENABLE_CLINICAL_LLM) return;

  const {
    consultationId,
    contextHash,
    sequence,
    recentTranscript,
    baseResult,
  } = args;

  const state = STATES.get(consultationId);
  if (!state) return;

  // Cancela chamada anterior que ainda estaria em voo. Sem isso, um novo ciclo
  // dispararia um novo clinicalSupport enquanto o antigo ainda queima tokens
  // OpenAI no FastAPI — a resposta antiga seria descartada pelo seq guard,
  // mas o custo já teria sido pago.
  state.clinicalSupportAbort?.abort();
  const abortController = new AbortController();
  state.clinicalSupportAbort = abortController;

  clinicalSupport(recentTranscript, {
    consultationId,
    signal: abortController.signal,
  })
    .then(async (support: ClinicalSupportResp) => {
      const current = STATES.get(consultationId);
      if (
        !current ||
        current.clinicalSupportSeq !== sequence ||
        current.lastContextHash !== contextHash
      ) {
        logger.debug(
          { consultationId },
          'clinical-llm support ignored (stale cycle)',
        );
        return;
      }

      current.clinicalMacro = {
        macro: support.macro,
        micro: support.micro || null,
        decidedAt: Date.now(),
      };

      const enrichedAlerts = mergeRedFlagsWithBase(
        baseResult.clinicalAlerts,
        support.red_flags.map(mapRedFlagItem),
      );

      try {
        await Promise.all([
          repository.saveEnrichedInsights(consultationId, support),
          repository.updateClinicalClassification(consultationId, {
            macro: support.macro,
            micro: support.micro,
          }),
        ]);
      } catch (err) {
        logger.warn(
          { err, consultationId },
          'clinical-llm enriched persist failed',
        );
      }

      const sourceChunks = aggregateEnrichedSourceChunks(
        baseResult.sourceChunks,
        support,
      );

      broadcastState(consultationId, {
        type: 'insights_enriched_update',
        consultationId,
        macro: support.macro,
        micro: support.micro,
        confidence: support.confidence,
        limits: support.limits,
        hypotheses: support.differential.map((item) =>
          mapDifferentialItem(item, support.confidence),
        ),
        clinicalAlerts: enrichedAlerts,
        suggestedQuestions: support.checklist_questions.map(mapChecklistItem),
        orientations: support.next_steps_suggested.map(mapNextStepItem),
        sourceChunks,
        ts: Date.now(),
      });
    })
    .catch((err) => {
      if (abortController.signal.aborted) {
        logger.debug(
          { consultationId },
          'clinical-llm support aborted (superseded by new cycle)',
        );
        return;
      }
      if (err instanceof ClinicalLlmInsufficientEvidence) {
        broadcastKnowledgeStatus(
          consultationId,
          'insufficient_evidence',
          err.message,
        );
        return;
      }
      if (err instanceof ClinicalLlmNoCitations) {
        broadcastKnowledgeStatus(consultationId, 'no_citations', err.message);
        return;
      }
      if (err instanceof ClinicalLlmPending) {
        logger.info({ err, consultationId }, 'clinical-llm support pending');
        return;
      }
      logger.warn(
        { err, consultationId },
        'clinical-llm support degraded silently',
      );
    })
    .finally(() => {
      const current = STATES.get(consultationId);
      if (current?.clinicalSupportAbort === abortController) {
        current.clinicalSupportAbort = null;
      }
    });
}

const REHYDRATION_TIMEOUT_MS = 300;

/**
 * Inicia (uma única vez por session) a rehidratação do buffer com transcrições
 * persistidas no Supabase. Retorna sempre uma Promise<void> que resolve (nunca
 * rejeita), com timeout de 300ms para não bloquear o primeiro ciclo da pipeline.
 *
 * Design: a Promise é armazenada em state.rehydrationPromise para que:
 * 1. Chamadas concorrentes reutilizem a mesma Promise (idempotente).
 * 2. O debounce callback a awaite antes de chamar runCycle, garantindo que o
 *    histórico esteja no buffer antes do primeiro ciclo de análise.
 * 3. O append da utterance atual acontece APÓS a rehidratação, preservando
 *    a ordem cronológica: histórico persistido → fala nova recebida.
 */
function buildRehydrationPromise(
  consultationId: string,
  state: PipelineState,
  utterance: { text: string; speaker: string; timestampMs: number; receivedAt: number },
): Promise<void> {
  if (state.rehydrationPromise !== null) {
    // Sessão já rehidratada (ou em progresso): apenas appenda a utterance atual
    // após a Promise existente resolver (garante ordem em corridas concorrentes
    // no segundo+ utterance enquanto o primeiro ainda está rehidratando).
    return state.rehydrationPromise.then(() => {
      state.transcriptBuffer.append(utterance);
    });
  }

  state.rehydrationPromise = (async () => {
    const timeoutPromise = new Promise<
      Array<{ text: string; speaker: string; timestampMs: number }>
    >((_, reject) =>
      setTimeout(
        () => reject(new Error('rehydration timeout')),
        REHYDRATION_TIMEOUT_MS,
      ),
    );

    let transcripts: Array<{ text: string; speaker: string; timestampMs: number }>;
    try {
      transcripts = await Promise.race([
        repository.getRecentTranscripts(consultationId),
        timeoutPromise,
      ]);
    } catch (err) {
      logger.warn(
        { err, consultationId },
        'process-text: rehydration failed or timed out — continuing without history',
      );
      transcripts = [];
    }

    const now = Date.now();
    for (const t of transcripts) {
      state.transcriptBuffer.append({
        text: t.text,
        speaker: t.speaker,
        timestampMs: t.timestampMs,
        receivedAt: now,
      });
    }

    if (transcripts.length > 0) {
      logger.info(
        { consultationId, rehydratedCount: transcripts.length },
        'process-text: buffer rehydrated from Supabase after restart',
      );
    }

    // Appenda a utterance atual DEPOIS do histórico para preservar ordem cronológica.
    state.transcriptBuffer.append(utterance);
  })();

  return state.rehydrationPromise;
}

export function processTranscriptFinal(args: {
  consultationId: string;
  text: string;
  speaker: string;
}): void {
  const { consultationId } = args;
  const text = String(args.text || '').trim();
  if (!consultationId || !text) return;

  const state = getState(consultationId);
  const speaker = args.speaker || 'unknown';
  const now = Date.now();

  // Prepara utterance. O append real acontece dentro de buildRehydrationPromise
  // (após o histórico ter sido carregado na primeira chamada) para preservar a
  // ordem cronológica: histórico persistido → fala nova recebida.
  const utterance = { text, speaker, timestampMs: now, receivedAt: now };

  // Fast path: alertas deterministicos (zero LLM, <50ms). O fast-path opera
  // sobre a utterance individual (não precisa do buffer histórico), por isso
  // roda imediatamente sem aguardar rehidratação.
  runFastPath(consultationId, text).catch((err) => {
    logger.warn({ err, consultationId }, 'fast-alerts failed (non-fatal)');
  });

  // Inicia (ou reutiliza) a Promise de rehidratação. Após ela resolver, o
  // buffer terá: histórico completo + utterance atual na ordem correta.
  const readyPromise = buildRehydrationPromise(consultationId, state, utterance);

  if (state.debounceTimer) clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    state.debounceTimer = null;
    // Aguarda append+rehidratação antes de rodar o ciclo para garantir que o
    // buffer contenha o contexto histórico completo.
    readyPromise
      .then(() => {
        runCycle(consultationId).catch((err) => {
          logger.error({ err, consultationId }, 'process-text: cycle failed');
        });
      })
      .catch((err) => {
        // buildRehydrationPromise nunca rejeita, mas TypeScript exige o catch.
        logger.error(
          { err, consultationId },
          'process-text: unexpected rehydration rejection',
        );
      });
  }, env.INSIGHTS_DEBOUNCE_MS);
}

async function runFastPath(
  consultationId: string,
  utteranceText: string,
): Promise<void> {
  const state = STATES.get(consultationId);
  if (!state) return;

  if (!state.patientLoaded) {
    try {
      state.patient =
        await repository.getPatientForConsultation(consultationId);
    } catch (err) {
      logger.warn(
        { err, consultationId },
        'fast-alerts: failed to load patient',
      );
      state.patient = null;
    }
    state.patientLoaded = true;
  }

  const patient = state.patient;
  if (!patient) return;

  const recent =
    state.transcriptBuffer
      .last(10)
      .map((u) => u.text)
      .join(' ') +
    ' ' +
    utteranceText;

  const alerts = await runFastAlerts({
    consultationId,
    utteranceText,
    recentTranscript: recent,
    patientAllergies: parseAllergies(
      typeof patient.allergies === 'string'
        ? patient.allergies
        : Array.isArray(patient.allergies)
          ? patient.allergies.join(', ')
          : null,
    ),
    patientMedications: parseMedications(
      typeof patient.currentMedications === 'string'
        ? patient.currentMedications
        : Array.isArray(patient.currentMedications)
          ? patient.currentMedications.join(', ')
          : null,
    ),
  });

  if (alerts.length === 0) return;

  try {
    const saved = await repository.saveInsights(
      consultationId,
      alerts.map((a) => ({
        kind: 'clinical_alert',
        content: a.content,
        rationale: a.rationale,
        severity: a.severity === 'critical' ? 'critical' : 'warning',
      })),
    );

    broadcastState(consultationId, {
      type: 'insights_update',
      delta: { clinicalAlerts: { added: saved } },
      ts: Date.now(),
    });
  } catch (err) {
    logger.warn(
      { err, consultationId },
      'fast-alerts: persist/broadcast failed',
    );
  }
}

async function runCycle(consultationId: string): Promise<void> {
  const cycleStart = performance.now();
  try {
    await measureAsync('pipeline.cycle_total', () =>
      runCycleImpl(consultationId),
    );
  } finally {
    logger.info(
      { consultationId, cycleMs: Math.round(performance.now() - cycleStart) },
      'pipeline cycle complete',
    );
  }
}

async function runCycleImpl(consultationId: string): Promise<void> {
  const state = STATES.get(consultationId);
  if (!state) return;

  if (state.running) {
    state.queued = true;
    return;
  }

  const recentTranscript = formatUtterances(
    state.transcriptBuffer.sinceMs(45_000),
  );
  if (isMeaninglessTranscript(recentTranscript)) {
    logger.debug(
      { consultationId },
      'process-text: cycle skipped (filler or below minimum length)',
    );
    return;
  }

  if (isNonClinicalSmallTalk(recentTranscript)) {
    logger.debug(
      { consultationId },
      'process-text: cycle skipped (non-clinical small talk)',
    );
    return;
  }

  const contextHash = crypto
    .createHash('md5')
    .update(recentTranscript)
    .digest('hex');
  if (contextHash === state.lastContextHash) {
    logger.debug(
      { consultationId },
      'process-text: cycle skipped (context unchanged since last run)',
    );
    return;
  }

  const now = Date.now();
  const sinceLast = now - state.lastRunAt;
  const throttleMs = getAdaptiveThrottleMs(state.sessionStartedAt);
  if (state.lastRunAt > 0 && sinceLast < throttleMs) {
    const wait = throttleMs - sinceLast;
    setTimeout(() => {
      runCycle(consultationId).catch((err) =>
        logger.error(
          { err, consultationId },
          'process-text: throttled cycle failed',
        ),
      );
    }, wait);
    return;
  }

  if (!canCall(consultationId)) {
    logger.warn(
      { consultationId },
      'process-text: rate limit exceeded, skipping cycle',
    );
    return;
  }

  // Commit do hash só após passar throttle + rate-limit. Garante que um ciclo
  // adiado pelo throttle ainda seja elegível no retry (o hash ainda não bateu).
  state.lastContextHash = contextHash;
  state.running = true;
  try {
    const fullTranscript = formatUtterances(state.transcriptBuffer.all());

    // Optimization #4: parallelize first patient fetch with embedding pre-warm.
    // The pre-warm populates the LRU cache so the RAG call inside the streaming
    // detector hits the cache instead of waiting for OpenAI embeddings.
    const ragQuery = recentTranscript.trim().slice(-400);

    const patientPromise = state.patientLoaded
      ? Promise.resolve(state.patient)
      : repository.getPatientForConsultation(consultationId).catch((err) => {
          logger.warn(
            { err, consultationId },
            'process-text: failed to load patient',
          );
          return null;
        });

    const embedPromise =
      ragQuery.length > 0
        ? embedText(ragQuery).catch((err) => {
            logger.debug(
              { err, consultationId },
              'process-text: embed pre-warm failed',
            );
            return null;
          })
        : Promise.resolve(null);

    // classifyMacro roda em paralelo com patient fetch e embedding pre-warm.
    // Antes era await serial APÓS o Promise.all, bloqueando o ciclo dentro do
    // mutex por até 8s (timeout) + ~900ms (2 retries). Agora, como as 3
    // operações não têm dependência entre si, o ciclo só espera o mais lento.
    const macroPromise = resolveClinicalMacro({
      consultationId,
      state,
      recentTranscript,
    }).catch((err) => {
      logger.warn(
        { err, consultationId },
        'resolveClinicalMacro rejected (degrading to generic RAG)',
      );
      return null;
    });

    const [patientResult, , clinicalMacro] = await Promise.all([
      patientPromise,
      embedPromise,
      macroPromise,
    ]);
    if (!state.patientLoaded) {
      state.patient = patientResult;
      state.patientLoaded = true;
    }

    const handlePartial = (partial: PartialSuggestionsResult): void => {
      const newQ = pickNewQuestions(
        partial.suggestedQuestions,
        state.lastBroadcast.questions,
      );
      const newA = pickNewAlerts(
        partial.clinicalAlerts,
        state.lastBroadcast.alerts,
      );
      const newK = pickNewKeypoints(
        partial.keypoints,
        state.lastBroadcast.keypoints,
      );
      if (!newQ.length && !newA.length && !newK.length) return;

      state.lastBroadcast.questions.push(...newQ.map((x) => x.text));
      state.lastBroadcast.alerts.push(
        ...newA.map((x) => `${x.severity}:${x.text}`),
      );
      state.lastBroadcast.keypoints.push(...newK.map((x) => x.text));

      try {
        broadcastState(consultationId, {
          type: 'insights_update_partial',
          consultationId,
          suggestedQuestions: newQ,
          clinicalAlerts: newA,
          keypoints: newK,
          ts: Date.now(),
        });
      } catch (err) {
        logger.error(
          { err, consultationId },
          'process-text: partial broadcast failed',
        );
      }
    };

    const result = await detectSuggestionsStreaming(
      {
        consultationId,
        patient: state.patient,
        recentTranscript,
        fullTranscript,
      },
      { onPartial: handlePartial },
      {
        rag: clinicalMacro?.macro
          ? {
              macroFilter: clinicalMacro.macro,
              microFilter: clinicalMacro.micro,
            }
          : undefined,
      },
    );

    state.lastRunAt = Date.now();

    if (result.empty) {
      state.lastBroadcast = { questions: [], alerts: [], keypoints: [] };
      return;
    }

    const hash = hashResult(result);
    if (hash === state.lastInsightsHash) {
      state.lastBroadcast = { questions: [], alerts: [], keypoints: [] };
      return;
    }
    state.lastInsightsHash = hash;

    try {
      await repository.saveInsights(consultationId, result);
    } catch (err) {
      logger.error(
        { err, consultationId },
        'process-text: failed to save insights',
      );
    }

    const finalNewQ = pickNewQuestions(
      result.suggestedQuestions,
      state.lastBroadcast.questions,
    );
    const finalNewA = pickNewAlerts(
      result.clinicalAlerts,
      state.lastBroadcast.alerts,
    );
    const finalNewK = pickNewKeypoints(
      result.keypoints,
      state.lastBroadcast.keypoints,
    );

    try {
      broadcastState(consultationId, {
        type: 'insights_update',
        consultationId,
        suggestedQuestions: finalNewQ,
        clinicalAlerts: finalNewA,
        keypoints: finalNewK,
        sourceChunks: result.sourceChunks,
        ts: Date.now(),
        final: true,
      });
    } catch (err) {
      logger.error({ err, consultationId }, 'process-text: broadcast failed');
    }

    state.lastBroadcast = { questions: [], alerts: [], keypoints: [] };

    const clinicalSupportSeq = ++state.clinicalSupportSeq;
    runClinicalSupportEnrichment({
      consultationId,
      contextHash,
      sequence: clinicalSupportSeq,
      recentTranscript,
      baseResult: result,
    });

    // Conduct detection (hipoteses, exames, encaminhamentos, orientacoes, insight, nota)
    // Roda depois do broadcast principal para nao bloquear perguntas/alertas criticos.
    detectPrescription({
      consultationId,
      patient: state.patient,
      fullTranscript,
    })
      .then(async (rx) => {
        if (rx.empty) return;
        try {
          await repository.savePrescription(consultationId, rx.medications);
        } catch (err) {
          logger.warn(
            { err, consultationId },
            'process-text: persist prescription failed',
          );
        }
        try {
          broadcastState(consultationId, {
            type: 'prescription_update',
            consultationId,
            medications: rx.medications,
            ts: Date.now(),
          });
        } catch (err) {
          logger.error(
            { err, consultationId },
            'process-text: prescription broadcast failed',
          );
        }
      })
      .catch((err) => {
        logger.warn(
          { err, consultationId },
          'process-text: prescription detection failed',
        );
      });

    detectConduct({
      consultationId,
      patient: state.patient,
      fullTranscript,
    })
      .then(async (conduct) => {
        if (conduct.empty) return;
        try {
          await repository.saveConduct(consultationId, {
            hypotheses: conduct.hypotheses,
            examRequests: conduct.examRequests,
            referrals: conduct.referrals,
            orientations: conduct.orientations,
            medicalInsight: conduct.medicalInsight,
            clinicalNote: conduct.clinicalNote,
          });
        } catch (err) {
          logger.warn(
            { err, consultationId },
            'process-text: persist conduct failed',
          );
        }
        try {
          broadcastState(consultationId, {
            type: 'conduct_update',
            consultationId,
            hypotheses: conduct.hypotheses,
            examRequests: conduct.examRequests,
            referrals: conduct.referrals,
            orientations: conduct.orientations,
            medicalInsight: conduct.medicalInsight,
            clinicalNote: conduct.clinicalNote,
            ts: Date.now(),
          });
        } catch (err) {
          logger.error(
            { err, consultationId },
            'process-text: conduct broadcast failed',
          );
        }
      })
      .catch((err) => {
        logger.warn(
          { err, consultationId },
          'process-text: conduct detection failed',
        );
      });
  } catch (err) {
    logger.error(
      { err, consultationId },
      'process-text: cycle unhandled error',
    );
  } finally {
    state.running = false;
    if (state.queued) {
      state.queued = false;
      setTimeout(() => {
        runCycle(consultationId).catch((err) =>
          logger.error(
            { err, consultationId },
            'process-text: queued cycle failed',
          ),
        );
      }, 300);
    }
  }
}

export function cleanupSession(consultationId: string): void {
  const s = STATES.get(consultationId);
  if (s?.debounceTimer) clearTimeout(s.debounceTimer);
  s?.clinicalSupportAbort?.abort();
  STATES.delete(consultationId);
  resetLimiter(consultationId);
  cleanupFastAlerts(consultationId);
}
