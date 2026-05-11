import type { InsightRow, InsightSeverity, TranscriptRow } from '@hipo/contracts';

export interface RedFlag {
  insightId: string;
  transcriptId: string;
  /** trecho exato (substring) presente em `transcript.text` para destacar */
  phrase: string;
  /** motivo do alerta — frase curta que aparece no tooltip */
  reason: string;
  /** base teórica / referência clínica — corpo do tooltip */
  theory: string;
  severity: InsightSeverity;
  /** título curto exibido no topo do tooltip */
  title: string;
}

// Português + termos clínicos comuns. Mantemos a lista enxuta — palavras curtas
// pouco discriminativas viram ruído no matching.
const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'da', 'do', 'das', 'dos',
  'e', 'ou', 'mas', 'que', 'se', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'com', 'sem', 'sob', 'sobre',
  'é', 'foi', 'são', 'ser', 'ter', 'tem', 'há',
  'esse', 'essa', 'isso', 'este', 'esta', 'isto',
  'ao', 'à', 'aos', 'às',
  'meu', 'minha', 'seu', 'sua',
  'paciente', 'queixa', 'relata', 'refere',
  'risco', 'pode', 'deve', 'realizar', 'investigar',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w));
}

function splitSentences(text: string): string[] {
  // Quebra por pontuação preservando espaço e ordem.
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.map(s => s.trim()).filter(Boolean);
}

interface SourceChunkHint {
  phrase?: string;
  transcriptId?: string;
  evidence?: string;
}

function readBackendHints(row: InsightRow): SourceChunkHint {
  // O backend pode (no futuro) mandar `source_chunks: { phrase, transcriptId }`
  // ou `source_chunks: [{ phrase, transcriptId }]`. Aceitamos ambos.
  const raw = row.source_chunks as unknown;
  if (!raw) return {};
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (typeof candidate !== 'object' || candidate === null) return {};
  const c = candidate as Record<string, unknown>;
  return {
    phrase: typeof c.phrase === 'string' ? c.phrase : undefined,
    transcriptId: typeof c.transcriptId === 'string' ? c.transcriptId : undefined,
    evidence: typeof c.evidence === 'string' ? c.evidence : undefined,
  };
}

interface BestMatch {
  transcriptId: string;
  phrase: string;
}

/**
 * Procura, dentro dos transcripts, a frase mais provável de ter disparado o
 * alerta. Estratégia: keyword matching + escolha da sentença com maior overlap.
 */
function findBestMatch(
  alertText: string,
  transcripts: TranscriptRow[],
): BestMatch | null {
  const keywords = tokenize(alertText);
  if (keywords.length === 0) return null;

  let best: { transcriptId: string; phrase: string; score: number } | null = null;

  // Mais recentes primeiro: o alerta tende a se referir a algo dito agora.
  for (let i = transcripts.length - 1; i >= 0; i--) {
    const t = transcripts[i]!;
    const sentences = splitSentences(t.text);
    if (sentences.length === 0) continue;

    for (const sentence of sentences) {
      const norm = normalize(sentence);
      const score = keywords.reduce((acc, kw) => (norm.includes(kw) ? acc + 1 : acc), 0);
      if (score === 0) continue;
      if (!best || score > best.score) {
        best = { transcriptId: t.id, phrase: sentence, score };
      }
    }
  }

  // Exigimos pelo menos 1 keyword em comum — caso contrário não há ancoragem.
  if (!best || best.score < 1) return null;
  return { transcriptId: best.transcriptId, phrase: best.phrase };
}

function severityOf(row: InsightRow): InsightSeverity {
  if (row.severity === 'critical' || row.severity === 'warning' || row.severity === 'info') {
    return row.severity;
  }
  return 'warning';
}

function deriveTitle(row: InsightRow): string {
  // Se rationale é curto, ele já é o título.
  const content = row.content?.trim() ?? '';
  if (content.length <= 60) return content;
  return content.slice(0, 60).replace(/\s+\S*$/, '') + '…';
}

export function buildRedFlags(
  insights: InsightRow[],
  transcripts: TranscriptRow[],
): RedFlag[] {
  const flags: RedFlag[] = [];
  for (const insight of insights) {
    if (insight.kind !== 'clinical_alert') continue;

    const hints = readBackendHints(insight);
    let transcriptId = hints.transcriptId ?? null;
    let phrase = hints.phrase ?? hints.evidence ?? null;

    // Se backend só nos deu phrase sem transcriptId, localizamos o transcript
    // que contém essa phrase.
    if (phrase && !transcriptId) {
      const target = normalize(phrase);
      const found = transcripts.find(t => normalize(t.text).includes(target));
      transcriptId = found?.id ?? null;
    }

    // Sem dica do backend → heurística de keyword matching.
    if (!transcriptId || !phrase) {
      const match = findBestMatch(insight.content, transcripts);
      if (match) {
        transcriptId = match.transcriptId;
        phrase = match.phrase;
      }
    }

    if (!transcriptId || !phrase) continue;

    flags.push({
      insightId: insight.id,
      transcriptId,
      phrase: phrase.trim(),
      reason: insight.content,
      theory: insight.rationale ?? '',
      severity: severityOf(insight),
      title: deriveTitle(insight),
    });
  }

  return flags;
}

/** Agrupa flags por transcriptId — útil para o renderer. */
export function groupFlagsByTranscript(flags: RedFlag[]): Map<string, RedFlag[]> {
  const map = new Map<string, RedFlag[]>();
  for (const f of flags) {
    const list = map.get(f.transcriptId) ?? [];
    list.push(f);
    map.set(f.transcriptId, list);
  }
  return map;
}
