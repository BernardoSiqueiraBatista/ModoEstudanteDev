import { parsePartial } from '../partial-json';

describe('parsePartial', () => {
  it('returns empty result for empty string', () => {
    const r = parsePartial('');
    expect(r.isFullyDone).toBe(false);
    expect(r.completed.suggestedQuestions).toEqual([]);
    expect(r.completed.clinicalAlerts).toEqual([]);
    expect(r.completed.keypoints).toEqual([]);
  });

  it('returns empty for whitespace only', () => {
    const r = parsePartial('   \n  ');
    expect(r.isFullyDone).toBe(false);
    expect(r.completed.suggestedQuestions).toEqual([]);
  });

  it('parses fully valid JSON and marks isFullyDone=true', () => {
    const full = JSON.stringify({
      suggestedQuestions: [
        { text: 'Q1', sourceRef: 1, rationale: 'R1' },
        { text: 'Q2', sourceRef: 2, rationale: 'R2' },
      ],
      clinicalAlerts: [
        { text: 'A1', severity: 'warning', sourceRef: 1, rationale: 'r' },
      ],
      keypoints: [{ text: 'K1', sourceRef: 1 }],
    });
    const r = parsePartial(full);
    expect(r.isFullyDone).toBe(true);
    expect(r.completed.suggestedQuestions).toHaveLength(2);
    expect(r.completed.clinicalAlerts).toHaveLength(1);
    expect(r.completed.keypoints).toHaveLength(1);
  });

  it('extracts only completed items from a partial array (one full, one half-open)', () => {
    const partial =
      '{"suggestedQuestions":[' +
      '{"text":"Q1","sourceRef":1,"rationale":"R1"},' +
      '{"text":"Q2","sourceRef":2,"ration';
    const r = parsePartial(partial);
    expect(r.isFullyDone).toBe(false);
    expect(r.completed.suggestedQuestions).toHaveLength(1);
    expect(r.completed.suggestedQuestions[0].text).toBe('Q1');
  });

  it('handles strings containing { and } characters via depth tracking', () => {
    const tricky =
      '{"suggestedQuestions":[' +
      '{"text":"hello { world }","sourceRef":1,"rationale":"with { braces } inside"},' +
      '{"text":"second","sourceRef":2,"rationale":"r"}' +
      '],"clinicalAlerts":[],"keypoints":[]}';
    const r = parsePartial(tricky);
    expect(r.isFullyDone).toBe(true);
    expect(r.completed.suggestedQuestions).toHaveLength(2);
    expect(r.completed.suggestedQuestions[0].text).toBe('hello { world }');
  });

  it('handles escaped quotes inside strings', () => {
    const tricky =
      '{"suggestedQuestions":[' +
      '{"text":"he said \\"hi\\" then","sourceRef":1,"rationale":"r"}' +
      '],"clinicalAlerts":[],"keypoints":[]';
    const r = parsePartial(tricky);
    expect(r.completed.suggestedQuestions).toHaveLength(1);
    expect(r.completed.suggestedQuestions[0].text).toBe('he said "hi" then');
  });

  it('does not crash on malformed JSON; returns whatever it could parse', () => {
    const broken =
      '{"suggestedQuestions":[' +
      '{"text":"Q1","sourceRef":1,"rationale":"R1"},' +
      'this is garbage,' +
      '{"text":"Q2","sourceRef":2,"rationale":"R2"}' +
      ']';
    const r = parsePartial(broken);
    expect(r.isFullyDone).toBe(false);
    // Both fully-balanced object literals should be extracted.
    expect(r.completed.suggestedQuestions.length).toBeGreaterThanOrEqual(2);
  });

  it('parses alerts and keypoints from partial buffer', () => {
    const partial =
      '{"suggestedQuestions":[],' +
      '"clinicalAlerts":[' +
      '{"text":"A1","severity":"critical","sourceRef":1,"rationale":"r"}' +
      '],' +
      '"keypoints":[{"text":"K1","sourceRef":1';
    const r = parsePartial(partial);
    expect(r.completed.clinicalAlerts).toHaveLength(1);
    expect(r.completed.clinicalAlerts[0].severity).toBe('critical');
    expect(r.completed.keypoints).toHaveLength(0);
  });

  it('rejects alert items with invalid severity', () => {
    const partial =
      '{"suggestedQuestions":[],"clinicalAlerts":[' +
      '{"text":"A1","severity":"bogus","sourceRef":1,"rationale":"r"}' +
      '],"keypoints":[]}';
    const r = parsePartial(partial);
    expect(r.completed.clinicalAlerts).toHaveLength(0);
  });
});
