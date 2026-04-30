/**
 * Pré-filtro linguístico para conteúdo não-clínico (conversa social,
 * logística de consulta, clima, pagamento). Complementa o filtro de
 * ruído do process-text — aqui o transcript pode ter 25+ chars e não
 * ser filler puro, mas ainda não ter sinal clínico. Skip conservador:
 * só pula se houver sinal claro de small talk E zero sinal clínico.
 *
 * Inspirado no seemsLikeQuestion do Copilot1, adaptado para o domínio
 * de anamnese (detecção positiva de termos clínicos, não de perguntas).
 */

const CLINICAL_CONTEXT_PATTERNS: readonly RegExp[] = [
  /\b(dor|ardor|queima[çc][ãa]o|tontura|vertigem|febre|n[áa]usea|v[ôo]mito|diarreia|constipa[çc][ãa]o|cefaleia|enxaqueca)\b/i,
  /\b(falta\s+de\s+ar|dispn[eé]ia|fadiga|cansa[çc]o|palpita[çc][ãa]o|suor|sudorese)\b/i,
  /\b(h[áa]|faz|desde)\s+(\d+|um|uma|dois|duas|tr[êe]s|quatro|cinco|seis|sete|oito|nove|dez)\s+(dia|semana|m[êe]s|ano|hora|minuto)/i,
  /\b(paciente|sintoma|sinto|tenho|sente|sentiu|sentindo|queixa|refere|relata|apresenta)\b/i,
  /\b(medica[çc][ãa]o|rem[ée]dio|comprimido|dose|ampola|aplicar|tomar|prescri[çc][ãa]o)\b/i,
  /\b\d+\s*(mg|ml|mcg|g|ui|gotas?|comprimidos?)\b/i,
  /\b(exame|hemograma|ecg|ekg|raio\s?x|tomografia|resson[âa]ncia|ultrassom|ultrassonografia|laborat[óo]rio)\b/i,
  /\b(diagn[óo]stico|hip[óo]tese|tratamento|progn[óo]stico|encaminhamento)\b/i,
  /\b(al[ée]rgic|alergia|intoler[âa]ncia|anafilaxia)\b/i,
  /\b(press[ãa]o|glicemia|diabetes|hipertens[ãa]o|colesterol)\b/i,
  /\b(cirurgia|interna[çc][ãa]o|ambulat[óo]rio|emerg[êe]ncia|pronto\s*socorro)\b/i,
];

const SOCIAL_OR_LOGISTICAL_PATTERNS: readonly RegExp[] = [
  /\b(quanto\s+(custa|fica|paga)|qual\s+o\s+valor|valor\s+da\s+consulta|estacionamento|plano\s+(de\s+)?sa[úu]de\s+(aceita|cobre))\b/i,
  /\btempo\s+(t[áa]|bom|ruim|feio|bonito|hoje|l[áa])/i,
  /\bl[áa]\s+fora\b/i,
  /\b(chuva|calor|frio)\s+(hoje|l[áa]\s+fora|forte|intens[oa])/i,
  /\b(vou\s+marcar|agendar\s+(o\s+)?retorno|remarcar|quando\s+posso\s+(voltar|retornar))\b/i,
  /\b(tr[âa]nsito|transporte|uber|[ôo]nibus|metr[ôo])\b/i,
];

export function hasClinicalSignal(text: string | null | undefined): boolean {
  if (!text) return false;
  const s = String(text);
  return CLINICAL_CONTEXT_PATTERNS.some((re) => re.test(s));
}

export function hasSocialOrLogisticalTalk(text: string | null | undefined): boolean {
  if (!text) return false;
  return SOCIAL_OR_LOGISTICAL_PATTERNS.some((re) => re.test(String(text)));
}

/**
 * Decide se o transcript é small talk não-clínico — critério conservador:
 * só retorna true se identificar padrão social/logístico E nenhum sinal
 * clínico. Na dúvida, retorna false (prefere gastar LLM a perder contexto).
 */
export function isNonClinicalSmallTalk(transcript: string | null | undefined): boolean {
  if (!transcript) return false;
  if (hasClinicalSignal(transcript)) return false;
  return hasSocialOrLogisticalTalk(transcript);
}
