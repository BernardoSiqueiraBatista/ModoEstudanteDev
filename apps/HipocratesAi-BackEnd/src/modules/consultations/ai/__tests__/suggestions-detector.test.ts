jest.mock('../../../../shared/logger/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../rag.service', () => {
  const actual = jest.requireActual('../rag.service');
  return {
    ...actual,
    ragService: { searchMedicalChunks: jest.fn() },
  };
});

jest.mock('../openai-client', () => ({
  openai: { chat: { completions: { create: jest.fn() } } },
}));

jest.mock('../circuit-breaker', () => {
  const actual = jest.requireActual('../circuit-breaker');
  return {
    ...actual,
    openaiChatBreaker: {
      execute: jest.fn(<T,>(fn: () => Promise<T>) => fn()),
    },
  };
});

import {
  detectSuggestions,
  detectSuggestionsStreaming,
  PartialSuggestionsResult,
  SuggestionsResult,
} from '../suggestions-detector';
import { ragService, RagResult } from '../rag.service';
import { openai } from '../openai-client';
import { openaiChatBreaker, CircuitOpenError } from '../circuit-breaker';

const mockedBreakerExecute = openaiChatBreaker.execute as unknown as jest.Mock;

const mockedSearch = ragService.searchMedicalChunks as jest.MockedFunction<
  typeof ragService.searchMedicalChunks
>;
const mockedCreate = openai.chat.completions.create as unknown as jest.Mock;

function makeChunk(similarity: number, id = 'c1'): RagResult {
  return {
    id,
    bookId: 'b1',
    page: 10,
    chapter: 'Cap 1',
    section: null,
    content: 'conteudo medico relevante',
    similarity,
  };
}

const longTranscript =
  'Paciente relata dor toracica intensa ha duas horas com irradiacao para braco esquerdo e sudorese.';

describe('detectSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty when recentTranscript is too short', async () => {
    const result = await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: 'ola',
      fullTranscript: 'ola',
    });
    expect(result.empty).toBe(true);
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it('returns empty when all chunks have similarity < 0.60', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.3), makeChunk(0.4)]);
    const result = await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: longTranscript,
      fullTranscript: longTranscript,
    });
    expect(result.empty).toBe(true);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('calls OpenAI with strict JSON schema', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.85)]);
    mockedCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestedQuestions: [],
              clinicalAlerts: [],
              keypoints: [],
            }),
          },
        },
      ],
    });

    await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: longTranscript,
      fullTranscript: longTranscript,
    });

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    const callArg = mockedCreate.mock.calls[0][0] as {
      response_format: { type: string };
      messages: Array<{ role: string; content: string }>;
    };
    expect(callArg.response_format.type).toBe('json_schema');
    // Optimization #3: full transcript block must NOT be sent to the LLM
    const userMsg = callArg.messages.find((m) => m.role === 'user')?.content ?? '';
    expect(userMsg).not.toContain('TRANSCRIÇÃO COMPLETA');
    expect(userMsg).toContain('TRANSCRIÇÃO RECENTE');
  });

  it('resolves sourceRef index back to chunk metadata', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.85, 'chunk-A')]);
    mockedCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestedQuestions: [
                { text: 'Q1', rationale: 'R1', sourceRef: 1 },
              ],
              clinicalAlerts: [],
              keypoints: [],
            }),
          },
        },
      ],
    });

    const result = await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: longTranscript,
      fullTranscript: longTranscript,
    });

    expect(result.suggestedQuestions).toHaveLength(1);
    expect(result.suggestedQuestions[0].source?.chunkId).toBe('chunk-A');
    expect(result.sourceChunks).toHaveLength(1);
  });

  it('respects max limits (3 questions, 2 alerts, 2 keypoints)', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.9)]);
    mockedCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestedQuestions: Array.from({ length: 10 }, (_, i) => ({
                text: `Q${i}`,
                rationale: 'r',
                sourceRef: 1,
              })),
              clinicalAlerts: Array.from({ length: 10 }, () => ({
                text: 'A',
                rationale: 'r',
                severity: 'info',
                sourceRef: 1,
              })),
              keypoints: Array.from({ length: 10 }, (_, i) => ({
                text: `K${i}`,
                sourceRef: 1,
              })),
            }),
          },
        },
      ],
    });

    const result = await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: longTranscript,
      fullTranscript: longTranscript,
    });

    expect(result.suggestedQuestions).toHaveLength(3);
    expect(result.clinicalAlerts).toHaveLength(2);
    expect(result.keypoints).toHaveLength(2);
  });

  it('detectSuggestionsStreaming emits onPartial as items complete and onComplete once', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.85, 'chunk-A')]);

    const fullJson = JSON.stringify({
      suggestedQuestions: [
        { text: 'Q1', sourceRef: 1, rationale: 'R1' },
        { text: 'Q2', sourceRef: 1, rationale: 'R2' },
      ],
      clinicalAlerts: [
        { text: 'A1', severity: 'warning', sourceRef: 1, rationale: 'r' },
      ],
      keypoints: [{ text: 'K1', sourceRef: 1 }],
    });

    // Split the JSON into 8 roughly-equal slices to simulate streaming.
    const sliceCount = 8;
    const sliceSize = Math.ceil(fullJson.length / sliceCount);
    const slices: string[] = [];
    for (let i = 0; i < fullJson.length; i += sliceSize) {
      slices.push(fullJson.slice(i, i + sliceSize));
    }

    async function* mockStream(): AsyncGenerator<{
      choices: Array<{ delta: { content: string } }>;
    }> {
      for (const s of slices) {
        yield { choices: [{ delta: { content: s } }] };
      }
    }

    mockedCreate.mockResolvedValue(mockStream());

    const partials: PartialSuggestionsResult[] = [];
    let final: SuggestionsResult | null = null;

    const result = await detectSuggestionsStreaming(
      {
        consultationId: 'c-1',
        patient: null,
        recentTranscript: longTranscript,
        fullTranscript: longTranscript,
      },
      {
        onPartial: (p) => partials.push(p),
        onComplete: (f) => {
          final = f;
        },
      },
    );

    // Stream was requested
    const callArg = mockedCreate.mock.calls[0][0] as { stream?: boolean };
    expect(callArg.stream).toBe(true);

    // At least one partial fired before complete
    expect(partials.length).toBeGreaterThan(0);

    // onComplete called exactly once with the resolved final
    expect(final).not.toBeNull();
    expect(result.suggestedQuestions).toHaveLength(2);
    expect(result.clinicalAlerts).toHaveLength(1);
    expect(result.keypoints).toHaveLength(1);
    expect(result.suggestedQuestions[0].source?.chunkId).toBe('chunk-A');
  });

  it('detectSuggestionsStreaming returns empty (and calls onComplete) when transcript is too short', async () => {
    let final: SuggestionsResult | null = null;
    const result = await detectSuggestionsStreaming(
      {
        consultationId: 'c-1',
        patient: null,
        recentTranscript: 'oi',
        fullTranscript: 'oi',
      },
      {
        onComplete: (f) => {
          final = f;
        },
      },
    );
    expect(result.empty).toBe(true);
    expect(final).not.toBeNull();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('returns empty without calling OpenAI when chat circuit breaker is open', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.9)]);
    mockedBreakerExecute.mockImplementationOnce(() => {
      throw new CircuitOpenError('openai-chat');
    });

    const result = await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: longTranscript,
      fullTranscript: longTranscript,
    });

    expect(result.empty).toBe(true);
    expect(mockedCreate).not.toHaveBeenCalled();
    // restore default pass-through for subsequent tests
    mockedBreakerExecute.mockImplementation(
      <T,>(fn: () => Promise<T>) => fn(),
    );
  });

  it('streaming returns empty without calling OpenAI when circuit is open', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.9)]);
    mockedBreakerExecute.mockImplementationOnce(() => {
      throw new CircuitOpenError('openai-chat');
    });

    let final: SuggestionsResult | null = null;
    const result = await detectSuggestionsStreaming(
      {
        consultationId: 'c-1',
        patient: null,
        recentTranscript: longTranscript,
        fullTranscript: longTranscript,
      },
      { onComplete: (f) => { final = f; } },
    );

    expect(result.empty).toBe(true);
    expect(final).not.toBeNull();
    expect(mockedCreate).not.toHaveBeenCalled();
    mockedBreakerExecute.mockImplementation(
      <T,>(fn: () => Promise<T>) => fn(),
    );
  });

  it('handles OpenAI error gracefully (returns empty)', async () => {
    mockedSearch.mockResolvedValue([makeChunk(0.85)]);
    mockedCreate.mockRejectedValue(new Error('LLM down'));

    const result = await detectSuggestions({
      consultationId: 'c-1',
      patient: null,
      recentTranscript: longTranscript,
      fullTranscript: longTranscript,
    });

    expect(result.empty).toBe(true);
    expect(result.suggestedQuestions).toEqual([]);
  });
});
