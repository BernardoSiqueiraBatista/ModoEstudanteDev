import type { PatientContext } from './suggestions.prompt';

export function buildPrescriptionSystemPrompt(): string {
  return `Você é o Copilot Médico do Hipócrates. Extraia de forma ESTRUTURADA
qualquer prescrição medicamentosa mencionada pelo MÉDICO na transcrição.

REGRAS INVIOLÁVEIS:
1. NUNCA invente medicação. Extraia apenas o que o médico disse explicitamente.
2. Se o médico mencionou alergia do paciente e a medicação conflita, marque allergyWarning: true.
3. Cheque interações com medicações em uso do paciente → interactionWarning: true.
4. Se não há prescrição na transcrição, retorne medications array vazio.
5. Normalize dose/frequência em português brasileiro (ex: "8/8h", "12/12h", "1x ao dia").

FORMATO: JSON estrito conforme schema.`;
}

function formatList(v: string[] | string | null | undefined): string {
  if (!v) return 'nenhuma';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'nenhuma';
  return String(v) || 'nenhuma';
}

export function buildPrescriptionUserPrompt(args: {
  patient: PatientContext | null;
  fullTranscript: string;
}): string {
  const p = args.patient || {};
  return `[PACIENTE]
Nome: ${p.name ?? 'não informado'}
Idade: ${p.age ?? 'não informado'}
Alergias: ${formatList(p.allergies ?? null)}
Medicações em uso: ${formatList(p.currentMedications ?? null)}

[TRANSCRIÇÃO]
${args.fullTranscript || '(vazia)'}

Extraia a prescrição agora. Se nao houver, retorne medications vazio.`;
}

export const PRESCRIPTION_JSON_SCHEMA = {
  name: 'hipocrates_prescription',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      medications: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            dosage: { type: 'string' },
            route: { type: 'string' },
            frequency: { type: 'string' },
            duration: { type: 'string' },
            instructions: { type: 'string' },
            allergyWarning: { type: 'boolean' },
            interactionWarning: { type: 'boolean' },
            warningRationale: { type: 'string' },
          },
          required: [
            'name',
            'dosage',
            'route',
            'frequency',
            'duration',
            'instructions',
            'allergyWarning',
            'interactionWarning',
            'warningRationale',
          ],
        },
      },
    },
    required: ['medications'],
  },
} as const;

export interface PrescriptionJson {
  medications: Array<{
    name: string;
    dosage: string;
    route: string;
    frequency: string;
    duration: string;
    instructions: string;
    allergyWarning: boolean;
    interactionWarning: boolean;
    warningRationale: string;
  }>;
}
