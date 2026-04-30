import crypto from 'crypto';

export interface AllergyAlertInput {
  utteranceText: string;
  patientAllergies: string[];
}

export interface FastAlert {
  id: string;
  kind: 'allergy' | 'red_flag' | 'drug_interaction';
  severity: 'warning' | 'critical';
  content: string;
  rationale: string;
  triggeredBy: string;
}

/**
 * Famílias de alergias: chave normalizada -> drogas relacionadas (todas
 * normalizadas, lowercase, sem acentos). A chave também é incluída como
 * "alias de si mesma" implicitamente.
 */
export const ALLERGY_FAMILIES: Record<string, string[]> = {
  dipirona: ['dipirona', 'metamizol', 'novalgina'],
  penicilina: [
    'penicilina',
    'amoxicilina',
    'ampicilina',
    'benzetacil',
    'oxacilina',
    'piperacilina',
  ],
  aas: ['aas', 'aspirina', 'acido acetilsalicilico'],
  'anti-inflamatorio': [
    'anti-inflamatorio',
    'antiinflamatorio',
    'aine',
    'ibuprofeno',
    'diclofenaco',
    'nimesulida',
    'cetoprofeno',
    'naproxeno',
    'piroxicam',
    'meloxicam',
  ],
  sulfa: ['sulfa', 'sulfametoxazol', 'bactrim', 'sulfadiazina'],
  cefalosporina: [
    'cefalosporina',
    'cefalexina',
    'cefazolina',
    'ceftriaxona',
    'cefuroxima',
    'cefepima',
  ],
  macrolideo: ['macrolideo', 'azitromicina', 'claritromicina', 'eritromicina'],
  quinolona: [
    'quinolona',
    'ciprofloxacino',
    'levofloxacino',
    'moxifloxacino',
    'norfloxacino',
  ],
  paracetamol: ['paracetamol', 'acetaminofeno', 'tylenol'],
  codeina: ['codeina', 'tylex'],
  morfina: ['morfina', 'dimorf'],
  iodo: ['iodo', 'contraste iodado'],
  latex: ['latex'],
};

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function parseAllergies(raw: string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        (raw as unknown as string[])
          .map((x) => normalizeText(String(x)))
          .filter(Boolean),
      ),
    );
  }
  const parts = String(raw)
    .split(/[,;\n]| e /gi)
    .map((p) => normalizeText(p))
    .filter((p) => p.length > 1);
  return Array.from(new Set(parts));
}

function hashId(parts: string[]): string {
  return crypto
    .createHash('md5')
    .update(parts.join('|'))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Para cada alergia do paciente, verifica se a fala atual menciona qualquer
 * droga da família correspondente. Retorna alertas críticos deduplicados pela
 * combinação kind|triggeredBy.
 */
export function detectAllergyAlerts(input: AllergyAlertInput): FastAlert[] {
  const text = ' ' + normalizeText(input.utteranceText) + ' ';
  if (!text.trim() || input.patientAllergies.length === 0) return [];

  const seen = new Set<string>();
  const alerts: FastAlert[] = [];

  for (const rawAllergy of input.patientAllergies) {
    const allergy = normalizeText(rawAllergy);
    if (!allergy) continue;

    // Resolve família: tenta match exato; senão verifica se a string da
    // alergia bate com alguma chave de família.
    const family =
      ALLERGY_FAMILIES[allergy] ??
      Object.entries(ALLERGY_FAMILIES).find(
        ([key]) => allergy.includes(key) || key.includes(allergy),
      )?.[1] ??
      [allergy];

    for (const drug of family) {
      const needle = ' ' + drug + ' ';
      // word-boundary suave: permite pontuação ao redor
      const re = new RegExp(
        `(^|[^a-z0-9])${drug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`,
        'i',
      );
      if (text.includes(needle) || re.test(text)) {
        const id = hashId(['allergy', drug]);
        if (seen.has(id)) continue;
        seen.add(id);
        alerts.push({
          id,
          kind: 'allergy',
          severity: 'critical',
          content: `ALERTA DE ALERGIA: paciente alergico a "${rawAllergy}" e foi mencionado "${drug}".`,
          rationale: `O paciente possui alergia registrada a "${rawAllergy}". A substancia "${drug}" pertence ao mesmo grupo e nao deve ser administrada.`,
          triggeredBy: drug,
        });
        break; // já achou um match dessa família
      }
    }
  }

  return alerts;
}
