import crypto from 'crypto';
import type { FastAlert } from './allergy-detector';
import { normalizeText } from './allergy-detector';

export interface RedFlagPattern {
  id: string;
  name: string;
  severity: 'critical' | 'warning';
  requires: RegExp[];
  excludes?: RegExp[];
  content: string;
  rationale: string;
}

export const RED_FLAG_PATTERNS: RedFlagPattern[] = [
  {
    id: 'sca',
    name: 'Sindrome Coronariana Aguda',
    severity: 'critical',
    requires: [
      /dor (no )?peito|dor tor[aá]cica|aperto no peito/i,
      /sudorese|suando frio|sudando|irradi[ea]|bra[cç]o esquerdo/i,
    ],
    content:
      'Padrao sugestivo de sindrome coronariana aguda (SCA). Considere ECG urgente e troponina.',
    rationale:
      'Dor toracica associada a sintomas neurovegetativos ou irradiacao para braco esquerdo aumenta a probabilidade de SCA.',
  },
  {
    id: 'hsa',
    name: 'Hemorragia Subaracnoide',
    severity: 'critical',
    requires: [
      /cefaleia|dor de cabe[çc]a/i,
      /subita|fulminante|explosiva|a pior .* vida/i,
    ],
    content:
      'Cefaleia subita intensa e um red flag para HSA. Considere TC de cranio.',
    rationale:
      'Cefaleia ictal ou "a pior da vida" e classico marcador de hemorragia subaracnoide.',
  },
  {
    id: 'meningite',
    name: 'Meningite',
    severity: 'critical',
    requires: [/febre/i, /rigidez de nuca|rigidez nucal|rigidez cervical/i],
    content:
      'Febre + rigidez de nuca sugerem meningite. Avaliar sinais meningeos e considerar puncao lombar.',
    rationale:
      'Triade febre + cefaleia + rigidez de nuca tem alto valor preditivo para meningite bacteriana.',
  },
  {
    id: 'tep',
    name: 'Tromboembolismo Pulmonar',
    severity: 'critical',
    requires: [
      /dispneia|falta de ar|cansa[çc]o/i,
      /dor pleur[ií]tica|taquicardia|hemoptise|escarro com sangue/i,
    ],
    content:
      'Padrao sugestivo de TEP. Considere D-dimero, escore de Wells, angio-TC.',
    rationale:
      'Dispneia subita associada a dor pleuritica, taquicardia ou hemoptise eleva a suspeita de TEP.',
  },
  {
    id: 'avc',
    name: 'Acidente Vascular Cerebral',
    severity: 'critical',
    requires: [
      /fraqueza|paralisia|perda de for[çc]a|assimetria|boca torta|dificuldade (de |para )?falar|fala (arrastada|embolada)/i,
      /subita|de repente|de uma hora/i,
    ],
    content:
      'Padrao neurologico focal agudo sugere AVC. Use escala FAST; janela terapeutica e curta.',
    rationale:
      'Deficit neurologico focal de instalacao subita exige investigacao imediata para AVC isquemico/hemorragico.',
  },
  {
    id: 'sepse',
    name: 'Sepse',
    severity: 'warning',
    requires: [
      /febre/i,
      /hipotens[aã]o|press[aã]o baixa|confus[aã]o|sonolencia|taquicardia|cora[çc][aã]o acelerado/i,
    ],
    content:
      'Febre + sinal sistemico sugere possivel sepse. Avaliar qSOFA e iniciar protocolo.',
    rationale:
      'Combinacao de febre com disfuncao organica/hemodinamica preenche criterios de alerta para sepse.',
  },
  {
    id: 'anafilaxia',
    name: 'Anafilaxia',
    severity: 'critical',
    requires: [
      /urtic[aá]ria|coceira no corpo|placas (no corpo|vermelhas)/i,
      /falta de ar|dispneia|dificuldade (para|de) respirar|incha(c|ç)o (na |no )?rosto|edema de face/i,
    ],
    content:
      'Quadro sugestivo de anafilaxia. Adrenalina IM 0.3-0.5mg e suporte imediato.',
    rationale:
      'Reacao cutanea associada a comprometimento respiratorio ou edema de face caracteriza anafilaxia.',
  },
  {
    id: 'hipoglicemia',
    name: 'Hipoglicemia grave',
    severity: 'critical',
    requires: [
      /diabet[ie]co|diabet[ie]s|insulina|hipoglicemiante/i,
      /sudorese|tremor|confus[aã]o|desmaio|perda de conscienc/i,
    ],
    content:
      'Risco de hipoglicemia severa em paciente diabetico. HGT imediato.',
    rationale:
      'Sintomas adrenergicos/neuroglicopenicos em paciente em uso de insulina ou hipoglicemiante orais sugerem hipoglicemia.',
  },
];

function hashId(parts: string[]): string {
  return crypto
    .createHash('md5')
    .update(parts.join('|'))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Avalia padroes de red-flag clinicos sobre o transcript recente. Os regex
 * sao aplicados sobre o texto normalizado (lowercase + sem acentos).
 */
export function detectRedFlags(input: { recentTranscript: string }): FastAlert[] {
  const text = normalizeText(input.recentTranscript || '');
  if (!text) return [];

  const alerts: FastAlert[] = [];

  for (const pattern of RED_FLAG_PATTERNS) {
    const allMatch = pattern.requires.every((re) => re.test(text));
    if (!allMatch) continue;
    if (pattern.excludes && pattern.excludes.some((re) => re.test(text))) continue;

    alerts.push({
      id: hashId(['red_flag', pattern.id]),
      kind: 'red_flag',
      severity: pattern.severity,
      content: pattern.content,
      rationale: pattern.rationale,
      triggeredBy: pattern.id,
    });
  }

  return alerts;
}
