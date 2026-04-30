import { TranscriptBuffer } from '../transcript-buffer';

function make(text: string, overrides: Partial<{ speaker: string; timestampMs: number; receivedAt: number }> = {}) {
  const now = Date.now();
  return {
    text,
    speaker: overrides.speaker ?? 'doctor',
    timestampMs: overrides.timestampMs ?? now,
    receivedAt: overrides.receivedAt ?? now,
  };
}

describe('TranscriptBuffer', () => {
  it('append + last(n) returns the last n utterances in order', () => {
    const b = new TranscriptBuffer();
    b.append(make('a'));
    b.append(make('b'));
    b.append(make('c'));
    expect(b.last(2).map((u) => u.text)).toEqual(['b', 'c']);
  });

  it('size() and textJoined() reflect contents', () => {
    const b = new TranscriptBuffer();
    b.append(make('hello'));
    b.append(make('world'));
    expect(b.size()).toBe(2);
    expect(b.textJoined()).toBe('hello world');
  });

  it('sinceMs filters by receivedAt window', () => {
    const b = new TranscriptBuffer();
    const now = Date.now();
    b.append(make('old', { receivedAt: now - 60_000 }));
    b.append(make('fresh', { receivedAt: now - 1_000 }));
    const recent = b.sinceMs(5_000);
    expect(recent.map((u) => u.text)).toEqual(['fresh']);
  });

  it('evicts by maxItems (oldest first)', () => {
    const b = new TranscriptBuffer(3);
    b.append(make('a'));
    b.append(make('b'));
    b.append(make('c'));
    b.append(make('d'));
    expect(b.size()).toBe(3);
    expect(b.all().map((u) => u.text)).toEqual(['b', 'c', 'd']);
  });

  it('evicts by maxAgeMs', () => {
    const b = new TranscriptBuffer(100, 1_000);
    const now = Date.now();
    b.append(make('old', { receivedAt: now - 5_000 }));
    b.append(make('new'));
    expect(b.size()).toBe(1);
    expect(b.all()[0].text).toBe('new');
  });

  it('clear() empties the buffer', () => {
    const b = new TranscriptBuffer();
    b.append(make('x'));
    b.clear();
    expect(b.size()).toBe(0);
    expect(b.last(5)).toEqual([]);
  });

  it('last(0) returns empty', () => {
    const b = new TranscriptBuffer();
    b.append(make('x'));
    expect(b.last(0)).toEqual([]);
  });
});
