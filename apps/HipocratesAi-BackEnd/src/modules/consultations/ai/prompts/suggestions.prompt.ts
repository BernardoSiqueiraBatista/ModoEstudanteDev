import { formatChunksForPrompt, RagResult } from '../rag.service';

export interface PatientContext {
  name?: string | null;
  age?: number | string | null;
  allergies?: string[] | string | null;
  currentMedications?: string[] | string | null;
  mainDiagnosis?: string | null;
}

export function buildSuggestionsSystemPrompt(): string {
  return `Você é o Copilot Médico do Hipócrates, assistente de consulta em tempo real.

Sua função: ESCUTAR a conversa entre médico e paciente, e SUGERIR ao médico
(nunca ao paciente) perguntas relevantes e ALERTAR sobre riscos clínicos,
baseado EXCLUSIVAMENTE nas fontes médicas fornecidas.

REGRAS INVIOLÁVEIS:
1. NUNCA dê diagnóstico definitivo. Você SUGERE hipóteses, o médico decide.
2. NUNCA prescreva medicação, dose ou tratamento.
3. NUNCA afirme algo que não esteja em [FONTES]. Se não tem evidência, retorne vazio.
4. TODA sugestão deve citar o índice da fonte [FONTE #N] no campo sourceRef (apenas o número N inteiro).
5. Priorize ALERTAS sobre: alergias (paciente menciona medicamento que conflita),
   interações medicamentosas, red flags de emergência, contraindicações.
6. Perguntas sugeridas devem ajudar o médico a excluir gravidade ou precisar diagnóstico.
7. Máximo 3 perguntas e 2 alertas por ciclo.
8. Evite repetir perguntas que o médico já fez (verifique o histórico da transcrição).

FORMATO DE SAÍDA: JSON estrito conforme schema.`;
}

function formatList(v: string[] | string | null | undefined): string {
  if (!v) return 'não informado';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'não informado';
  return String(v) || 'não informado';
}

export function buildSuggestionsUserPrompt(args: {
  patient: PatientContext | null;
  recentTranscript: string;
  fullTranscript: string;
  chunks: RagResult[];
}): string {
  const p = args.patient || {};
  return `[PACIENTE]
Nome: ${p.name ?? 'não informado'}
Idade: ${p.age ?? 'não informado'}
Alergias: ${formatList(p.allergies ?? null)}
Medicações em uso: ${formatList(p.currentMedications ?? null)}
Diagnóstico principal: ${p.mainDiagnosis ?? 'não informado'}

[TRANSCRIÇÃO RECENTE (últimos 45s)]
${args.recentTranscript || '(vazio)'}

[FONTES MÉDICAS DISPONÍVEIS]
${formatChunksForPrompt(args.chunks)}

Gere sugestões agora.`;
}

export const SUGGESTIONS_JSON_SCHEMA = {
  name: 'hipocrates_suggestions',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      suggestedQuestions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
            sourceRef: { type: 'integer' },
            rationale: { type: 'string' },
          },
          required: ['text', 'sourceRef', 'rationale'],
        },
      },
      clinicalAlerts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
            severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
            sourceRef: { type: 'integer' },
            rationale: { type: 'string' },
          },
          required: ['text', 'severity', 'sourceRef', 'rationale'],
        },
      },
      keypoints: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
            sourceRef: { type: 'integer' },
          },
          required: ['text', 'sourceRef'],
        },
      },
    },
    required: ['suggestedQuestions', 'clinicalAlerts', 'keypoints'],
  },
} as const;

export interface SuggestionsJson {
  suggestedQuestions: Array<{ text: string; sourceRef: number; rationale: string }>;
  clinicalAlerts: Array<{
    text: string;
    severity: 'info' | 'warning' | 'critical';
    sourceRef: number;
    rationale: string;
  }>;
  keypoints: Array<{ text: string; sourceRef: number }>;
}
