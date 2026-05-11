import {
  detectAllergyAlerts,
  parseAllergies,
  type FastAlert,
} from './allergy-detector';
import { detectRedFlags } from './red-flag-detector';

export { detectAllergyAlerts, parseAllergies, ALLERGY_FAMILIES } from './allergy-detector';
export { detectRedFlags, RED_FLAG_PATTERNS } from './red-flag-detector';
export type { FastAlert, AllergyAlertInput } from './allergy-detector';
export type { RedFlagPattern } from './red-flag-detector';

export function parseMedications(raw: string | null | undefined): string[] {
  return parseAllergies(raw);
}

const EMITTED: Map<string, Set<string>> = new Map();

export interface RunFastAlertsInput {
  consultationId: string;
  utteranceText: string;
  recentTranscript: string;
  patientAllergies: string[];
  patientMedications?: string[];
}

/**
 * Executa todos os detectores deterministicos (zero LLM) e retorna apenas os
 * alertas que ainda nao foram emitidos para esta consulta.
 */
export async function runFastAlerts(
  input: RunFastAlertsInput,
): Promise<FastAlert[]> {
  const allergyAlerts = detectAllergyAlerts({
    utteranceText: input.utteranceText,
    patientAllergies: input.patientAllergies,
  });
  const redFlagAlerts = detectRedFlags({
    recentTranscript: input.recentTranscript,
  });

  const merged: FastAlert[] = [];
  const seen = new Set<string>();
  for (const a of [...allergyAlerts, ...redFlagAlerts]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    merged.push(a);
  }

  let emitted = EMITTED.get(input.consultationId);
  if (!emitted) {
    emitted = new Set<string>();
    EMITTED.set(input.consultationId, emitted);
  }

  const fresh: FastAlert[] = [];
  for (const a of merged) {
    if (emitted.has(a.id)) continue;
    emitted.add(a.id);
    fresh.push(a);
  }

  return fresh;
}

export function cleanupFastAlerts(consultationId: string): void {
  EMITTED.delete(consultationId);
}

/** Test-only helper. */
export function __resetFastAlertsRegistry(): void {
  EMITTED.clear();
}
