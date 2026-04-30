/**
 * Acumulador de custos por consultation_id em memoria.
 * Persistido via flush() ao finish/cancel.
 */

// Tabela de precos em USD/1M tokens (OpenAI Outubro 2024)
const MODEL_PRICES_PER_M_TOKENS: Record<
  string,
  { input: number; output: number }
> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
};

const EMBEDDING_PRICES_PER_M_TOKENS: Record<string, number> = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
};

// Deepgram Nova-2: $0.0043/min
const DEEPGRAM_PRICE_PER_SECOND = 0.0043 / 60;

interface CostEntry {
  tokensInput: number;
  tokensOutput: number;
  embeddingTokens: number;
  deepgramSeconds: number;
  clinicalLlmCalls: number;
  clinicalLlmCostUsd: number;
  costUsd: number;
}

const costByConsultation = new Map<string, CostEntry>();

function getEntry(consultationId: string): CostEntry {
  let e = costByConsultation.get(consultationId);
  if (!e) {
    e = {
      tokensInput: 0,
      tokensOutput: 0,
      embeddingTokens: 0,
      deepgramSeconds: 0,
      clinicalLlmCalls: 0,
      clinicalLlmCostUsd: 0,
      costUsd: 0,
    };
    costByConsultation.set(consultationId, e);
  }
  return e;
}

export function trackLLMUsage(
  consultationId: string | undefined,
  model: string,
  usage:
    | { prompt_tokens?: number; completion_tokens?: number }
    | null
    | undefined,
): void {
  if (!consultationId || !usage) return;
  const prices =
    MODEL_PRICES_PER_M_TOKENS[model] ??
    MODEL_PRICES_PER_M_TOKENS['gpt-4o-mini'];
  const inTok = usage.prompt_tokens ?? 0;
  const outTok = usage.completion_tokens ?? 0;
  const cost =
    (inTok * prices.input) / 1_000_000 + (outTok * prices.output) / 1_000_000;
  const e = getEntry(consultationId);
  e.tokensInput += inTok;
  e.tokensOutput += outTok;
  e.costUsd += cost;
}

export function trackEmbeddingUsage(
  consultationId: string | undefined,
  model: string,
  tokens: number,
): void {
  if (!consultationId || !tokens) return;
  const pricePerM = EMBEDDING_PRICES_PER_M_TOKENS[model] ?? 0.02;
  const cost = (tokens * pricePerM) / 1_000_000;
  const e = getEntry(consultationId);
  e.embeddingTokens += tokens;
  e.costUsd += cost;
}

export function trackDeepgramSeconds(
  consultationId: string | undefined,
  seconds: number,
): void {
  if (!consultationId || seconds <= 0) return;
  const e = getEntry(consultationId);
  e.deepgramSeconds += seconds;
  e.costUsd += seconds * DEEPGRAM_PRICE_PER_SECOND;
}

export function trackClinicalLlmCall(
  consultationId: string | undefined,
  estimatedCostUsd = 0,
): void {
  if (!consultationId) return;
  const e = getEntry(consultationId);
  e.clinicalLlmCalls += 1;
  e.clinicalLlmCostUsd += estimatedCostUsd;
  e.costUsd += estimatedCostUsd;
}

export function getCost(consultationId: string): CostEntry | null {
  return costByConsultation.get(consultationId) ?? null;
}

export function flushCost(consultationId: string): CostEntry | null {
  const e = costByConsultation.get(consultationId) ?? null;
  costByConsultation.delete(consultationId);
  return e;
}
