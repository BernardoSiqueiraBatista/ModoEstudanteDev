/**
 * Boost pós-LLM de severidade para alertas clínicos baseado em sinais
 * conhecidos de gravidade (red flags). Complementa a classificação do LLM:
 * se um alerta menciona um red flag clássico e o LLM rotulou como info ou
 * warning, promove a critical. Não altera alertas já marcados como critical
 * e não rebaixa nenhum item.
 *
 * Os padrões são de precisão alta (não disparam em menções casuais: exigem
 * qualificadores como "súbito", "intenso", "grave", "ativo", ou números
 * específicos para febre).
 */

export const CLINICAL_RED_FLAG_PATTERNS: readonly RegExp[] = [
  /dor\s+tor[áa]cica/i,
  /dor\s+precordial/i,
  /dispn[eé]ia\s+(s[úu]bita|intensa|grave|aguda|progressiva)/i,
  /s[íi]ncope/i,
  /cefaleia\s+(thunderclap|s[úu]bita|intensa)/i,
  /pior\s+(dor\s+)?(da|de|na)\s+(minha\s+)?vida/i,
  /cefaleia\s+(mais\s+)?forte/i,
  /febre\s+(de\s+|acima\s+de\s+)?3[89]/i,
  /febre\s+(de\s+|acima\s+de\s+)?4\d/i,
  /confus[ãa]o\s+mental\s+(aguda|recente|s[úu]bita)/i,
  /sangramento\s+(ativo|volumoso|maci[çc]o|digestivo|intenso)/i,
  /hematemese/i,
  /melena/i,
  /hemoptise/i,
  /hemiparesia/i,
  /hemiplegia/i,
  /afasia\s+(aguda|s[úu]bita)?/i,
  /convuls[ãa]o/i,
  /sepse|choque\s+s[ée]ptico/i,
  /choque\s+(hipovol[êe]mico|cardiog[êe]nico|anafil[áa]tico)/i,
  /rigidez\s+de\s+nuca/i,
  /cianose/i,
  /altera[çc][ãa]o\s+de\s+(consci[êe]ncia|n[íi]vel\s+de\s+consci[êe]ncia)/i,
  /dor\s+abdominal\s+(s[úu]bita|intensa|lancinante|irradiada)/i,
  /abdome\s+em\s+t[áa]bua/i,
  /meningismo/i,
  /petequias/i,
  /anisocoria/i,
  /d[ée]ficit\s+neurol[óo]gico\s+focal/i,
];

type AlertSeverity = 'info' | 'warning' | 'critical';

interface SeverityShape {
  text: string;
  rationale: string;
  severity: AlertSeverity;
}

export function containsRedFlag(text: string | null | undefined): boolean {
  if (!text) return false;
  const s = String(text);
  return CLINICAL_RED_FLAG_PATTERNS.some((re) => re.test(s));
}

/**
 * Promove alert.severity para 'critical' se o texto ou o rationale contêm
 * um red flag clínico e o alerta ainda não estava crítico. Caso contrário,
 * retorna o alerta inalterado. Preserva quaisquer campos extras (source etc).
 */
export function boostAlertByRedFlag<T extends SeverityShape>(alert: T): T {
  if (alert.severity === 'critical') return alert;
  if (containsRedFlag(alert.text) || containsRedFlag(alert.rationale)) {
    return { ...alert, severity: 'critical' };
  }
  return alert;
}
