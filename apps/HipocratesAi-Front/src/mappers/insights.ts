import type { InsightAckAction, InsightRow, InsightSeverity } from '@hipo/contracts';

/**
 * UI-facing union derived from the back's generic InsightRow. Each kind keeps
 * the source insight's id so the user can ack a specific item.
 */
export type UiInsight =
  | {
      id: string;
      kind: 'alert';
      severity: InsightSeverity;
      title: string;
      description: string;
      acknowledged: InsightAckAction | null;
    }
  | {
      id: string;
      kind: 'hypothesis';
      title: string;
      confidence: number; // 0-100
      description: string;
      acknowledged: InsightAckAction | null;
    }
  | {
      id: string;
      kind: 'medicalInsight';
      text: string;
      acknowledged: InsightAckAction | null;
    }
  | {
      id: string;
      kind: 'checklist';
      label: string;
      checked: boolean;
      acknowledged: InsightAckAction | null;
    }
  | {
      id: string;
      kind: 'examRequest';
      name: string;
      acknowledged: InsightAckAction | null;
    }
  | {
      id: string;
      kind: 'orientation';
      text: string;
      acknowledged: InsightAckAction | null;
    }
  | {
      id: string;
      kind: 'referral';
      name: string;
      acknowledged: InsightAckAction | null;
    };

function severityFor(row: InsightRow): InsightSeverity {
  if (row.severity === 'critical' || row.severity === 'warning' || row.severity === 'info') {
    return row.severity;
  }
  return 'info';
}

export function mapInsightToUi(row: InsightRow): UiInsight | null {
  const id = row.id;
  const ack = (row.acknowledged_action as InsightAckAction | null) ?? null;
  const content = row.content ?? '';

  switch (row.kind) {
    case 'clinical_alert':
      return {
        id,
        kind: 'alert',
        severity: severityFor(row),
        title: content.slice(0, 80),
        description: row.rationale ?? content,
        acknowledged: ack,
      };

    case 'hypothesis':
    case 'differential':
      return {
        id,
        kind: 'hypothesis',
        title: content,
        confidence: Math.round(((row.confidence ?? 0.5) as number) * 100),
        description: row.rationale ?? '',
        acknowledged: ack,
      };

    case 'medical_insight':
    case 'keypoint':
    case 'clinical_support_enriched':
      return { id, kind: 'medicalInsight', text: content, acknowledged: ack };

    case 'suggested_question':
      return {
        id,
        kind: 'checklist',
        label: content,
        checked: ack === 'useful',
        acknowledged: ack,
      };

    case 'exam_suggestion':
      return { id, kind: 'examRequest', name: content, acknowledged: ack };

    case 'orientation':
      return { id, kind: 'orientation', text: content, acknowledged: ack };

    case 'referral':
      return { id, kind: 'referral', name: content, acknowledged: ack };

    case 'clinical_note':
    case 'doctor_note':
    case 'medication':
      // These don't surface in the active-consultation UI; they belong to
      // closure / patient profile. Keep returning null so they're filtered out.
      return null;

    default:
      return null;
  }
}

export function mapInsightsToUi(rows: InsightRow[]): UiInsight[] {
  return rows.map(mapInsightToUi).filter((x): x is UiInsight => Boolean(x));
}

export function isAlert(i: UiInsight): i is Extract<UiInsight, { kind: 'alert' }> {
  return i.kind === 'alert';
}
export function isHypothesis(i: UiInsight): i is Extract<UiInsight, { kind: 'hypothesis' }> {
  return i.kind === 'hypothesis';
}
export function isMedicalInsight(
  i: UiInsight,
): i is Extract<UiInsight, { kind: 'medicalInsight' }> {
  return i.kind === 'medicalInsight';
}
export function isChecklist(i: UiInsight): i is Extract<UiInsight, { kind: 'checklist' }> {
  return i.kind === 'checklist';
}
export function isExamRequest(i: UiInsight): i is Extract<UiInsight, { kind: 'examRequest' }> {
  return i.kind === 'examRequest';
}
export function isOrientation(i: UiInsight): i is Extract<UiInsight, { kind: 'orientation' }> {
  return i.kind === 'orientation';
}
export function isReferral(i: UiInsight): i is Extract<UiInsight, { kind: 'referral' }> {
  return i.kind === 'referral';
}
