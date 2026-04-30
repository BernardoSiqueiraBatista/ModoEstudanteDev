/**
 * Pragmatic incremental JSON parser tailored to the suggestions schema:
 * {
 *   "suggestedQuestions": [ {...}, ... ],
 *   "clinicalAlerts":     [ {...}, ... ],
 *   "keypoints":          [ {...}, ... ]
 * }
 *
 * Strategy:
 *  1. Try a full JSON.parse on the buffer. If it works, we're done.
 *  2. Otherwise, locate each top-level array key and walk its contents,
 *     extracting only the object items whose braces fully balance. Each
 *     candidate item is then parsed individually with JSON.parse — items
 *     that fail to parse are silently ignored.
 *
 * This is intentionally NOT a general JSON parser. It only needs to handle
 * the specific shape produced by the LLM under our strict json_schema.
 */

export interface PartialSuggestionItem {
  text: string;
  sourceRef: number;
  rationale: string;
}

export interface PartialAlertItem {
  text: string;
  severity: 'info' | 'warning' | 'critical';
  sourceRef: number;
  rationale: string;
}

export interface PartialKeypointItem {
  text: string;
  sourceRef: number;
}

export interface PartialParseResult {
  completed: {
    suggestedQuestions: PartialSuggestionItem[];
    clinicalAlerts: PartialAlertItem[];
    keypoints: PartialKeypointItem[];
  };
  isFullyDone: boolean;
}

function emptyResult(isFullyDone = false): PartialParseResult {
  return {
    completed: {
      suggestedQuestions: [],
      clinicalAlerts: [],
      keypoints: [],
    },
    isFullyDone,
  };
}

/**
 * Find the index of `"key"` at the top level of the object literal in `text`.
 * Skips over string literals so that braces/quotes inside strings don't
 * confuse the search. Returns the index of the OPENING `[` of that key's
 * array value, or -1 if not found.
 */
function findArrayStart(text: string, key: string): number {
  const needle = `"${key}"`;
  let i = 0;
  while (i < text.length) {
    if (text.startsWith(needle, i)) {
      // Advance past the key
      let j = i + needle.length;
      // Skip whitespace and the colon
      while (j < text.length && text[j] !== '[') {
        if (text[j] === '"') {
          // Wrong key occurrence (inside a value); bail
          j = -1;
          break;
        }
        j++;
      }
      if (j > 0 && j < text.length && text[j] === '[') return j;
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

/**
 * Given index `i` pointing at a `"` in `text`, return the index just past the
 * closing `"`. Honors `\"` escape sequences. If the string never closes,
 * returns text.length.
 */
function skipString(text: string, i: number): number {
  let j = i + 1;
  while (j < text.length) {
    const ch = text[j];
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (ch === '"') return j + 1;
    j++;
  }
  return text.length;
}

/**
 * Walk the array starting at index `arrayStart` (which points at `[`) and
 * yield the substrings of each fully-balanced top-level `{...}` object.
 */
function extractCompleteObjects(text: string, arrayStart: number): string[] {
  const items: string[] = [];
  let i = arrayStart + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === ']') break;
    if (ch === '{') {
      const end = findMatchingBrace(text, i);
      if (end === -1) break; // unbalanced — stop here
      items.push(text.slice(i, end + 1));
      i = end + 1;
      continue;
    }
    i++;
  }
  return items;
}

/**
 * Given index `i` pointing at `{`, return the index of the matching `}`,
 * or -1 if the object doesn't close within `text`. String-aware.
 */
function findMatchingBrace(text: string, i: number): number {
  let depth = 0;
  let j = i;
  while (j < text.length) {
    const ch = text[j];
    if (ch === '"') {
      j = skipString(text, j);
      continue;
    }
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return j;
    }
    j++;
  }
  return -1;
}

function isSuggestionItem(v: unknown): v is PartialSuggestionItem {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.text === 'string' &&
    typeof o.sourceRef === 'number' &&
    typeof o.rationale === 'string'
  );
}

function isAlertItem(v: unknown): v is PartialAlertItem {
  if (!isSuggestionItem(v)) return false;
  const sev = (v as unknown as Record<string, unknown>).severity;
  return sev === 'info' || sev === 'warning' || sev === 'critical';
}

function isKeypointItem(v: unknown): v is PartialKeypointItem {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.text === 'string' && typeof o.sourceRef === 'number';
}

function parseItems<T>(
  text: string,
  key: string,
  guard: (v: unknown) => v is T,
): T[] {
  const start = findArrayStart(text, key);
  if (start === -1) return [];
  const candidates = extractCompleteObjects(text, start);
  const out: T[] = [];
  for (const c of candidates) {
    try {
      const parsed: unknown = JSON.parse(c);
      if (guard(parsed)) out.push(parsed);
    } catch {
      // skip malformed item
    }
  }
  return out;
}

export function parsePartial(rawText: string): PartialParseResult {
  if (!rawText || !rawText.trim()) return emptyResult(false);

  // Fast path: try full parse first.
  try {
    const parsed = JSON.parse(rawText) as {
      suggestedQuestions?: unknown;
      clinicalAlerts?: unknown;
      keypoints?: unknown;
    };
    return {
      completed: {
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
          ? (parsed.suggestedQuestions.filter(isSuggestionItem) as PartialSuggestionItem[])
          : [],
        clinicalAlerts: Array.isArray(parsed.clinicalAlerts)
          ? (parsed.clinicalAlerts.filter(isAlertItem) as PartialAlertItem[])
          : [],
        keypoints: Array.isArray(parsed.keypoints)
          ? (parsed.keypoints.filter(isKeypointItem) as PartialKeypointItem[])
          : [],
      },
      isFullyDone: true,
    };
  } catch {
    // Fall through to partial extraction
  }

  return {
    completed: {
      suggestedQuestions: parseItems(rawText, 'suggestedQuestions', isSuggestionItem),
      clinicalAlerts: parseItems(rawText, 'clinicalAlerts', isAlertItem),
      keypoints: parseItems(rawText, 'keypoints', isKeypointItem),
    },
    isFullyDone: false,
  };
}
