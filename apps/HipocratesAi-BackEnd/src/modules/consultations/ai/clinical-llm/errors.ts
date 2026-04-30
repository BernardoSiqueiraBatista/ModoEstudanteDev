export type ClinicalLlmSemanticError =
  | 'PENDING'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NO_CITATIONS';

export class ClinicalLlmError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ClinicalLlmError';
  }
}

export class ClinicalLlmPending extends ClinicalLlmError {
  constructor(detail?: unknown) {
    super('Clinical LLM classification is pending', 409, detail);
    this.name = 'ClinicalLlmPending';
  }
}

export class ClinicalLlmInsufficientEvidence extends ClinicalLlmError {
  readonly topScore?: number;
  readonly minRequired?: number;

  constructor(detail?: Record<string, unknown>) {
    super(
      String(
        detail?.message ?? 'Evidência insuficiente nos trechos recuperados.',
      ),
      422,
      detail,
    );
    this.name = 'ClinicalLlmInsufficientEvidence';
    this.topScore =
      typeof detail?.top_score === 'number' ? detail.top_score : undefined;
    this.minRequired =
      typeof detail?.min_required === 'number'
        ? detail.min_required
        : undefined;
  }
}

export class ClinicalLlmNoCitations extends ClinicalLlmError {
  constructor(detail?: Record<string, unknown>) {
    super(
      String(detail?.message ?? 'A resposta não trouxe citações rastreáveis.'),
      422,
      detail,
    );
    this.name = 'ClinicalLlmNoCitations';
  }
}

export function isClinicalLlmSemanticError(err: unknown): boolean {
  return (
    err instanceof ClinicalLlmPending ||
    err instanceof ClinicalLlmInsufficientEvidence ||
    err instanceof ClinicalLlmNoCitations
  );
}

export function clinicalLlmErrorKind(err: unknown): string {
  if (err instanceof ClinicalLlmInsufficientEvidence)
    return 'insufficient_evidence';
  if (err instanceof ClinicalLlmNoCitations) return 'no_citations';
  if (err instanceof ClinicalLlmPending) return 'pending';
  return 'unknown';
}
