import { z } from 'zod';

// =============================================================================
// Schema de resposta estruturada para o feedback OSCE
// =============================================================================

export const OsceFeedbackResponseSchema = z.object({
  feedback: z.string().describe('Texto do feedback em português brasileiro, com no máximo 3 frases'),
});

export type OsceFeedbackResponse = z.infer<typeof OsceFeedbackResponseSchema>;

// =============================================================================
// Prompt versionado — v1
// =============================================================================

export const OSCE_FEEDBACK_PROMPT_VERSION = 'v1';

export const getOsceFeedbackPrompt = (params: {
  case_title: string;
  specialty: string;
  score: number;
  hits: number;
  errors: number;
  duration_minutes: number;
  events_summary: string;
}): string => {
  return `
Você é um avaliador clínico especializado em avaliações OSCE (Objective Structured Clinical Examination).
Analise os eventos da simulação clínica abaixo e forneça um feedback construtivo e direto.

CASO CLÍNICO: ${params.case_title}
ESPECIALIDADE: ${params.specialty}
MODO: OSCE (avaliação por estações)
DURAÇÃO: ${params.duration_minutes} minutos

EVENTOS REGISTRADOS DURANTE A SIMULAÇÃO:
${params.events_summary}

RESULTADO FINAL:
- Pontuação: ${params.score}/100
- Acertos: ${params.hits}
- Erros: ${params.errors}

INSTRUÇÕES DE GERAÇÃO DO FEEDBACK:
1. Comece com um elogio sobre o que foi bem executado (se houver acertos).
2. Aponte o ponto de atenção/melhoria mais prioritário (se houver erros ou omissões).
3. Finalize com uma recomendação prática e específica para a próxima simulação.

REGRAS:
- Responda em português brasileiro.
- Use no máximo 3 frases, sendo direto e objetivo.
- Não use markdown, bullets ou formatação especial.
- Não mencione "OSCE" no texto — refira-se como "simulação clínica" ou "atendimento".
- Seja encorajador mas honesto.

Responda APENAS com o JSON no formato: { "feedback": "seu texto aqui" }
`.trim();
};
