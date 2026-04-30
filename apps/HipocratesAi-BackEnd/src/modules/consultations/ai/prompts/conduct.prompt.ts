import type { PatientContext } from './suggestions.prompt';

export function buildConductSystemPrompt(): string {
  return `Você é o Copilot Médico do Hipócrates, assistente de consulta em tempo real.

Sua função: EXTRAIR de forma ESTRUTURADA a conduta médica e o raciocínio clínico
a partir da transcrição da consulta. Extraia somente o que for EXPLICITAMENTE
dito ou fortemente sugerido pela fala do médico.

REGRAS INVIOLÁVEIS:
1. NUNCA invente exame, encaminhamento ou medicação que o médico não mencionou.
2. NUNCA dê diagnóstico definitivo — apenas HIPÓTESES ordenadas por probabilidade.
3. Se a transcrição for curta ou ambígua, retorne arrays vazios (prefira vazio a inventar).
4. Linguagem: português clínico conciso. Evite primeira pessoa.
5. Máximo: 3 hipóteses, 5 exames, 3 encaminhamentos, 4 orientações.
6. Confidence de hipóteses entre 0 e 1.

FORMATO DE SAÍDA: JSON estrito conforme schema.`;
}

function formatList(v: string[] | string | null | undefined): string {
  if (!v) return 'não informado';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'não informado';
  return String(v) || 'não informado';
}

export function buildConductUserPrompt(args: {
  patient: PatientContext | null;
  fullTranscript: string;
}): string {
  const p = args.patient || {};
  return `[PACIENTE]
Nome: ${p.name ?? 'não informado'}
Idade: ${p.age ?? 'não informado'}
Alergias: ${formatList(p.allergies ?? null)}
Medicações em uso: ${formatList(p.currentMedications ?? null)}
Diagnóstico principal: ${p.mainDiagnosis ?? 'não informado'}

[TRANSCRIÇÃO COMPLETA]
${args.fullTranscript || '(vazio)'}

Extraia a conduta estruturada agora. Se nao houver evidencia suficiente, retorne arrays vazios.`;
}

export const CONDUCT_JSON_SCHEMA = {
  name: 'hipocrates_conduct',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      hypotheses: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            confidence: { type: 'number' },
            rationale: { type: 'string' },
          },
          required: ['title', 'confidence', 'rationale'],
        },
      },
      examRequests: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['name', 'rationale'],
        },
      },
      referrals: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            specialty: { type: 'string' },
          },
          required: ['name', 'specialty'],
        },
      },
      orientations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      },
      medicalInsight: { type: 'string' },
      clinicalNote: {
        type: 'object',
        additionalProperties: false,
        properties: {
          hda: { type: 'string' },
          clinicalImpression: { type: 'array', items: { type: 'string' } },
        },
        required: ['hda', 'clinicalImpression'],
      },
    },
    required: [
      'hypotheses',
      'examRequests',
      'referrals',
      'orientations',
      'medicalInsight',
      'clinicalNote',
    ],
  },
} as const;

export interface ConductJson {
  hypotheses: Array<{ title: string; confidence: number; rationale: string }>;
  examRequests: Array<{ name: string; rationale: string }>;
  referrals: Array<{ name: string; specialty: string }>;
  orientations: Array<{ text: string }>;
  medicalInsight: string;
  clinicalNote: {
    hda: string;
    clinicalImpression: string[];
  };
}
