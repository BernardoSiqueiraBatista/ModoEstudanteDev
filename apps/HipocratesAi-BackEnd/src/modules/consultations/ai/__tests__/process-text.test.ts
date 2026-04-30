jest.mock('../../../../shared/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../suggestions-detector', () => ({
  detectSuggestions: jest.fn(),
  detectSuggestionsStreaming: jest.fn(),
}));

jest.mock('../embeddings.service', () => ({
  embedText: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

const mockBroadcast = jest.fn();
jest.mock('../../ws/ws-registry', () => ({
  broadcastState: (...args: unknown[]) => mockBroadcast(...args),
}));

const mockGetPatient = jest.fn();
const mockSaveInsights = jest.fn();
const mockUpdateClinicalClassification = jest.fn();
const mockSaveEnrichedInsights = jest.fn();
const mockGetRecentTranscripts = jest.fn();
jest.mock('../../consultations.repository', () => ({
  ConsultationsRepository: jest.fn().mockImplementation(() => ({
    getPatientForConsultation: mockGetPatient,
    saveInsights: mockSaveInsights,
    updateClinicalClassification: mockUpdateClinicalClassification,
    saveEnrichedInsights: mockSaveEnrichedInsights,
    getRecentTranscripts: mockGetRecentTranscripts,
  })),
}));

const mockCanCall = jest.fn();
jest.mock('../rate-limiter', () => ({
  canCall: (...args: unknown[]) => mockCanCall(...args),
  resetLimiter: jest.fn(),
}));

const mockClassifyMacro = jest.fn();
const mockChecklistQuestion = jest.fn();
const mockClinicalSupport = jest.fn();
class MockClinicalLlmInsufficientEvidence extends Error {}
class MockClinicalLlmNoCitations extends Error {}
class MockClinicalLlmPending extends Error {}
jest.mock('../clinical-llm', () => ({
  classifyMacro: (...args: unknown[]) => mockClassifyMacro(...args),
  checklistQuestion: (...args: unknown[]) => mockChecklistQuestion(...args),
  clinicalSupport: (...args: unknown[]) => mockClinicalSupport(...args),
  ClinicalLlmInsufficientEvidence: MockClinicalLlmInsufficientEvidence,
  ClinicalLlmNoCitations: MockClinicalLlmNoCitations,
  ClinicalLlmPending: MockClinicalLlmPending,
}));

import {
  processTranscriptFinal,
  cleanupSession,
  isMeaninglessTranscript,
  getAdaptiveThrottleMs,
} from '../process-text';
import { detectSuggestionsStreaming } from '../suggestions-detector';
import { env } from '../../../../config/env';

const mockedDetect = detectSuggestionsStreaming as jest.MockedFunction<
  typeof detectSuggestionsStreaming
>;

// Transcrições clínicas realistas (>= 25 chars, não-filler) usadas nos testes.
const CLINICAL_TEXT_1 = 'paciente relata dor abdominal há três dias';
const CLINICAL_TEXT_2 =
  'exame físico mostra abdome doloroso à palpação em fossa ilíaca direita';

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('process-text pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask'] });
    mockCanCall.mockReturnValue(true);
    mockGetPatient.mockResolvedValue(null);
    mockSaveInsights.mockResolvedValue([]);
    mockUpdateClinicalClassification.mockResolvedValue(undefined);
    mockSaveEnrichedInsights.mockResolvedValue(undefined);
    mockClassifyMacro.mockResolvedValue({
      final: 'Cardiovascular',
      status: 'DECIDED',
      top3: [{ macro: 'Cardiovascular', score: 0.9 }],
      reason: 'dor torácica',
    });
    mockChecklistQuestion.mockResolvedValue({
      question: 'A dor piora ao esforço?',
      options: ['sim', 'não'],
      why_it_matters: 'Ajuda a separar origem cardíaca.',
    });
    mockClinicalSupport.mockResolvedValue({
      macro: 'Cardiovascular',
      micro: 'Angina',
      differential: [],
      checklist_questions: [],
      red_flags: [],
      next_steps_suggested: [],
      confidence: 0.8,
      limits: 'Citações limitadas ao corpus.',
    });
    env.ENABLE_CLINICAL_LLM = false;
    mockGetRecentTranscripts.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanupSession('c-1');
    jest.useRealTimers();
  });

  it('buffers text and schedules debounce', () => {
    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    expect(mockedDetect).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBeGreaterThan(0);
  });

  it('debounce fires and calls detectSuggestionsStreaming', async () => {
    mockedDetect.mockResolvedValue({
      suggestedQuestions: [],
      clinicalAlerts: [],
      keypoints: [],
      sourceChunks: [],
      empty: true,
    });

    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();
    await flushPromises();

    expect(mockedDetect).toHaveBeenCalledTimes(1);
  });

  it('rate limit exceeded skips cycle without error', async () => {
    mockCanCall.mockReturnValue(false);
    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();
    expect(mockedDetect).not.toHaveBeenCalled();
  });

  it('empty insights result does not broadcast', async () => {
    mockedDetect.mockResolvedValue({
      suggestedQuestions: [],
      clinicalAlerts: [],
      keypoints: [],
      sourceChunks: [],
      empty: true,
    });
    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();
    await flushPromises();
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it('same insights hash does not broadcast twice (dedup)', async () => {
    const payload = {
      suggestedQuestions: [{ text: 'Q', rationale: 'r', source: null }],
      clinicalAlerts: [],
      keypoints: [],
      sourceChunks: [],
      empty: false,
    };
    mockedDetect.mockResolvedValue(payload);

    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();
    await flushPromises();
    expect(mockBroadcast).toHaveBeenCalledTimes(1);

    // Force throttle to pass
    jest.advanceTimersByTime(env.INSIGHTS_THROTTLE_MS + 10);

    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_2,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
  });

  it('concurrent runs are queued via mutex (second call queued)', async () => {
    let resolveFirst:
      | ((v: Awaited<ReturnType<typeof detectSuggestionsStreaming>>) => void)
      | null = null;
    mockedDetect.mockImplementationOnce(
      () =>
        new Promise<Awaited<ReturnType<typeof detectSuggestionsStreaming>>>(
          (resolve) => {
            resolveFirst = resolve;
          },
        ),
    );

    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();
    // first cycle running, not resolved

    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_2,
      speaker: 'doctor',
    });
    jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
    await flushPromises();

    // still only one detect call
    expect(mockedDetect).toHaveBeenCalledTimes(1);

    resolveFirst!({
      suggestedQuestions: [],
      clinicalAlerts: [],
      keypoints: [],
      sourceChunks: [],
      empty: true,
    });
    await flushPromises();
  });

  it('cleanupSession clears timers and state', () => {
    processTranscriptFinal({
      consultationId: 'c-1',
      text: CLINICAL_TEXT_1,
      speaker: 'doctor',
    });
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    cleanupSession('c-1');
    // After cleanup, processing again creates a fresh state — no stale timers referenced
    expect(() => cleanupSession('c-1')).not.toThrow();
  });

  describe('adaptive throttle (fase 1.3)', () => {
    it('returns base throttle for short sessions (<15min)', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      try {
        const startedAt = 1_000_000 - 5 * 60 * 1000; // 5 minutes ago
        expect(getAdaptiveThrottleMs(startedAt)).toBe(env.INSIGHTS_THROTTLE_MS);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('doubles throttle for long sessions (>=15min)', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      try {
        const startedAt = 1_000_000 - 16 * 60 * 1000; // 16 minutes ago
        expect(getAdaptiveThrottleMs(startedAt)).toBe(
          env.INSIGHTS_THROTTLE_MS * 2,
        );
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('transitions exactly at 15min boundary', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      try {
        const baseStart = 1_000_000 - 15 * 60 * 1000; // exactly 15min
        expect(getAdaptiveThrottleMs(baseStart)).toBe(
          env.INSIGHTS_THROTTLE_MS * 2,
        );
        const justUnder = 1_000_000 - (15 * 60 * 1000 - 1); // 1ms under
        expect(getAdaptiveThrottleMs(justUnder)).toBe(env.INSIGHTS_THROTTLE_MS);
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('noise filter (fase 1.1)', () => {
    it('skips cycle when transcript is below minimum length', async () => {
      processTranscriptFinal({
        consultationId: 'c-1',
        text: 'oi',
        speaker: 'patient',
      });
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();
      expect(mockedDetect).not.toHaveBeenCalled();
    });

    it('skips cycle when transcript is only filler/greeting', async () => {
      processTranscriptFinal({
        consultationId: 'c-1',
        text: 'bom dia tudo bem obrigado',
        speaker: 'patient',
      });
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();
      expect(mockedDetect).not.toHaveBeenCalled();
    });

    it('isMeaninglessTranscript: strips speaker prefix and detects filler', () => {
      expect(isMeaninglessTranscript('')).toBe(true);
      expect(isMeaninglessTranscript('[doctor] oi')).toBe(true);
      expect(isMeaninglessTranscript('[patient] bom dia')).toBe(true);
      expect(isMeaninglessTranscript('[doctor] ok então tá')).toBe(true);
      expect(
        isMeaninglessTranscript(
          '[patient] paciente relata dor abdominal há três dias',
        ),
      ).toBe(false);
    });
  });

  describe('rehydration pós-restart (fase 3.4)', () => {
    it('popula o buffer com 4 utterances: 3 rehidratadas + 1 nova', async () => {
      const historicTranscripts = [
        { text: 'paciente relata dor abdominal há três dias', speaker: 'patient', timestampMs: 1000 },
        { text: 'quando começou exatamente a dor', speaker: 'doctor', timestampMs: 2000 },
        { text: 'começou depois do almoço de ontem', speaker: 'patient', timestampMs: 3000 },
      ];
      mockGetRecentTranscripts.mockResolvedValueOnce(historicTranscripts);
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_2,
        speaker: 'doctor',
      });

      // Aguarda a rehidratação (async dentro de processTranscriptFinal)
      await flushPromises();
      await flushPromises();

      expect(mockGetRecentTranscripts).toHaveBeenCalledTimes(1);
      expect(mockGetRecentTranscripts).toHaveBeenCalledWith('c-1');

      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();

      // O ciclo foi disparado, o que confirma que o buffer foi populado sem erros.
      // detectSuggestionsStreaming recebe fullTranscript com as 4 utterances.
      expect(mockedDetect).toHaveBeenCalledTimes(1);
      const callArgs = mockedDetect.mock.calls[0][0] as { fullTranscript: string };
      expect(callArgs.fullTranscript).toContain('paciente relata dor abdominal há três dias');
      expect(callArgs.fullTranscript).toContain('quando começou exatamente a dor');
      expect(callArgs.fullTranscript).toContain('começou depois do almoço de ontem');
      expect(callArgs.fullTranscript).toContain(CLINICAL_TEXT_2);
    });

    it('buffer vazio quando getRecentTranscripts retorna [] — sem crash, 1 utterance', async () => {
      mockGetRecentTranscripts.mockResolvedValueOnce([]);
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });

      await flushPromises();
      await flushPromises();

      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();

      expect(mockedDetect).toHaveBeenCalledTimes(1);
      const callArgs = mockedDetect.mock.calls[0][0] as { fullTranscript: string };
      // Deve conter apenas a fala nova
      expect(callArgs.fullTranscript).toContain(CLINICAL_TEXT_1);
    });

    it('não chama getRecentTranscripts de novo quando já rehydrated', async () => {
      mockGetRecentTranscripts.mockResolvedValue([]);
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      // Primeira chamada — deve rehydratar
      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });
      await flushPromises();
      await flushPromises();

      expect(mockGetRecentTranscripts).toHaveBeenCalledTimes(1);

      // Advance throttle e debounce
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + env.INSIGHTS_THROTTLE_MS + 100);
      await flushPromises();
      await flushPromises();

      // Segunda chamada — NÃO deve rehydratar novamente
      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_2,
        speaker: 'doctor',
      });
      await flushPromises();
      await flushPromises();

      expect(mockGetRecentTranscripts).toHaveBeenCalledTimes(1);
    });

    it('rehydration com timeout não quebra o fluxo', async () => {
      // Simula query que demora mais que REHYDRATION_TIMEOUT_MS (300ms)
      mockGetRecentTranscripts.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000)),
      );
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });

      // Avança 300ms para estourar o timeout de rehidratação
      jest.advanceTimersByTime(300);
      await flushPromises();
      await flushPromises();

      // Pipeline continua normalmente após timeout
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();

      expect(mockedDetect).toHaveBeenCalledTimes(1);
    });
  });

  describe('clinical LLM integration (fase 2)', () => {
    it('feature flag disabled preserves generic suggestions flow', async () => {
      env.ENABLE_CLINICAL_LLM = false;
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();

      expect(mockClassifyMacro).not.toHaveBeenCalled();
      expect(mockedDetect).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        { rag: undefined },
      );
    });

    it('DECIDED macro is passed as filtered RAG option', async () => {
      env.ENABLE_CLINICAL_LLM = true;
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();

      expect(mockClassifyMacro).toHaveBeenCalledTimes(1);
      expect(mockedDetect).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        { rag: { macroFilter: 'Cardiovascular', microFilter: null } },
      );
    });

    it('PENDING macro broadcasts clarification_needed without blocking the cycle', async () => {
      env.ENABLE_CLINICAL_LLM = true;
      mockClassifyMacro.mockResolvedValueOnce({
        final: null,
        status: 'PENDING',
        top3: [{ macro: 'Cardiovascular', score: 0.51 }],
        reason: 'ambíguo',
      });
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: true,
      });

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();
      await flushPromises();

      expect(mockedDetect).toHaveBeenCalledTimes(1);
      expect(mockBroadcast).toHaveBeenCalledWith(
        'c-1',
        expect.objectContaining({
          type: 'clarification_needed',
          question: 'A dor piora ao esforço?',
          source: 'clinical_llm',
        }),
      );
    });

    it('clinical_support semantic error broadcasts knowledge_status', async () => {
      env.ENABLE_CLINICAL_LLM = true;
      mockedDetect.mockResolvedValue({
        suggestedQuestions: [{ text: 'Q', rationale: 'r', source: null }],
        clinicalAlerts: [],
        keypoints: [],
        sourceChunks: [],
        empty: false,
      });
      mockClinicalSupport.mockRejectedValueOnce(
        new MockClinicalLlmInsufficientEvidence('Evidência insuficiente'),
      );

      processTranscriptFinal({
        consultationId: 'c-1',
        text: CLINICAL_TEXT_1,
        speaker: 'doctor',
      });
      jest.advanceTimersByTime(env.INSIGHTS_DEBOUNCE_MS + 10);
      await flushPromises();
      await flushPromises();
      await flushPromises();

      expect(mockBroadcast).toHaveBeenCalledWith(
        'c-1',
        expect.objectContaining({
          type: 'knowledge_status',
          status: 'insufficient_evidence',
          source: 'clinical_llm',
        }),
      );
    });
  });
});
