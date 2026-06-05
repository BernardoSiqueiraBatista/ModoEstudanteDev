import { z } from 'zod';

// =============================================================================
// Request Schemas
// =============================================================================

/** POST /cases/:id/attempts — Body */
export const CreateAttemptSchema = z.object({
  modo: z.enum(['hm', 'osce']),
  student_id: z.string().uuid(),
});
export type CreateAttemptInput = z.infer<typeof CreateAttemptSchema>;

/** POST /cases/attempts/:aid/events — Body (OSCE only) */
export const CreateEventSchema = z.object({
  tipo: z.enum(['procedimento_correto', 'erro', 'omissao']),
  ref: z.string().min(1, 'ref é obrigatório'),
  pontos: z.number().int(),
  timestamp: z.string().datetime().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

/** POST /cases/attempts/:aid/finish — Body */
export const FinishAttemptSchema = z.object({
  student_id: z.string().uuid(),
});
export type FinishAttemptInput = z.infer<typeof FinishAttemptSchema>;

// =============================================================================
// Response Types
// =============================================================================

export interface CaseIntroResponse {
  id: string;
  titulo: string;
  descricao: string;
  especialidade: string;
  dificuldade: string;
  tempo_estimado_min: number;
  checklist_osce: Array<{
    criterio: string;
    itens: string[];
  }>;
  recursos_habilitados: Record<string, boolean>;
}

export interface StartAttemptResponse {
  attempt_id: string;
  sessao: {
    case_id: string;
    titulo: string;
    paciente: Record<string, unknown>;
    queixa_principal: string;
  };
  modo: 'hm' | 'osce';
}

export interface RegisterEventResponse {
  acumulado: number;
  notificacao: {
    texto: string;
    ttl_ms: number;
  };
}

export interface FinishAttemptResponse {
  pontuacao_final: number;
  acertos: number;
  erros: number;
  tempo_segundos: number;
  feedback_llm: string;
}

// =============================================================================
// DB Row Interfaces
// =============================================================================

export interface ICaseRow {
  id: string;
  titulo: string;
  descricao: string;
  especialidade: string;
  dificuldade: string;
  payload_mock: Record<string, any>;
  tempo_estimado_min: number;
  criado_em: Date;
}

export interface ICaseAttemptRow {
  id: string;
  user_id: string;
  case_id: string;
  modo: 'hm' | 'osce';
  pontuacao: number | null;
  acertos: number;
  erros: number;
  tempo_segundos: number | null;
  status: 'em_andamento' | 'finalizado' | 'abandonado';
  iniciado_em: Date;
  finalizado_em: Date | null;
}

export interface ICaseAttemptEventRow {
  id: string;
  attempt_id: string;
  tipo: 'procedimento_correto' | 'erro' | 'omissao';
  ref: string;
  pontos: number;
  timestamp: Date;
  criado_em: Date;
}
