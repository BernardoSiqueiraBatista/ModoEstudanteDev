import type { PatientContext } from './suggestions.prompt';

export function buildSummarySystemPrompt(): string {
  return `Você é o Copilot Médico do Hipócrates. Gere um resumo clínico estruturado
no formato SOAP completo a partir da transcrição completa de uma consulta médica.

REGRAS:
1. NÃO invente informação. Se não há dado, escreva "não informado".
2. Destaque explicitamente alergias e medicações mencionadas.
3. Não prescreva medicação nem feche diagnóstico definitivo — registre apenas o que foi discutido.
4. SOAP deve ser detalhado (até 150 palavras por seção). Total < 800 palavras.
5. CID-10 sugerido: liste até 3 códigos prováveis com descrição. Priorize CID-10-BR.
6. Saída estritamente em JSON conforme schema.`;
}

export function buildSummaryUserPrompt(args: {
  patient: PatientContext | null;
  fullTranscript: string;
}): string {
  const p = args.patient || {};
  return `[PACIENTE]
Nome: ${p.name ?? 'não informado'}
Idade: ${p.age ?? 'não informado'}
Alergias conhecidas: ${Array.isArray(p.allergies) ? p.allergies.join(', ') : p.allergies ?? 'não informado'}
Medicações em uso: ${Array.isArray(p.currentMedications) ? p.currentMedications.join(', ') : p.currentMedications ?? 'não informado'}
Diagnóstico principal registrado: ${p.mainDiagnosis ?? 'não informado'}

[TRANSCRIÇÃO COMPLETA]
${args.fullTranscript || '(vazia)'}

Gere o resumo SOAP completo com CID-10 sugerido agora.`;
}

export const SUMMARY_JSON_SCHEMA = {
  name: 'hipocrates_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      subjective: { type: 'string' },
      objective: { type: 'string' },
      assessment: { type: 'string' },
      plan: { type: 'string' },
      followUp: { type: 'string' },
      chiefComplaint: { type: 'string' },
      clinicalImpression: {
        type: 'array',
        items: { type: 'string' },
      },
      suggestedIcd10: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            code: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['code', 'description'],
        },
      },
    },
    required: [
      'subjective',
      'objective',
      'assessment',
      'plan',
      'followUp',
      'chiefComplaint',
      'clinicalImpression',
      'suggestedIcd10',
    ],
  },
} as const;

export interface SummaryJson {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUp: string;
  chiefComplaint: string;
  clinicalImpression: string[];
  suggestedIcd10: Array<{ code: string; description: string }>;
}
