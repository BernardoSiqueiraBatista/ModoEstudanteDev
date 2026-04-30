// TypeScript mirror of python_services/clinical_llm/app/schemas.py.
// Keep this file in sync with the Pydantic contract until OpenAPI generation is added.

export type MacroStatus = 'DECIDED' | 'PENDING';
export type Priority = 'alta' | 'media' | 'baixa';
export type SupportLevel = 'evidencia' | 'geral';

export interface MacroScore {
  macro: string;
  score: number;
}

export interface ClassifyMacroReq {
  text: string;
  allowed_macro?: string[];
}

export interface ClassifyMacroResp {
  final: string | null;
  status: MacroStatus;
  top3: MacroScore[];
  reason: string;
}

export interface ChecklistQuestionReq {
  text: string;
  top3: MacroScore[];
}

export interface ChecklistQuestionResp {
  question: string;
  options: string[];
  why_it_matters: string;
}

export interface ClinicalSupportReq {
  text: string;
}

export interface ClinicalEvidenceRef {
  chunkId: string;
}

export interface DifferentialItem {
  dx: string;
  priority: Priority;
  rationale: string;
  evidence_chunk_ids: string[];
  support_level: SupportLevel;
}

export interface ClinicalChecklistItem {
  question: string;
  why: string;
  priority: Priority;
  evidence_chunk_ids: string[];
  support_level: SupportLevel;
}

export interface RedFlagItem {
  flag: string;
  why: string;
  action: string;
  priority: Priority;
  evidence_chunk_ids: string[];
  support_level: SupportLevel;
}

export interface NextStepItem {
  step: string;
  why: string;
  evidence_chunk_ids: string[];
  support_level: SupportLevel;
}

export interface ClinicalSupportResp {
  macro: string;
  micro: string;
  differential: DifferentialItem[];
  checklist_questions: ClinicalChecklistItem[];
  red_flags: RedFlagItem[];
  next_steps_suggested: NextStepItem[];
  confidence: number;
  limits: string;
}

export interface ClinicalLlmCallOptions {
  consultationId?: string;
  signal?: AbortSignal;
}
