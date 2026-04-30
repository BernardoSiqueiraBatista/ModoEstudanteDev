import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InsightRow, TranscriptRow, WsServerMessage } from '@hipo/contracts';
import { ConsultationWsClient, type WsStatus } from '../lib/wsClient';
import { startPcmRecorder, type PcmRecorder } from '../lib/audioRecorder';

interface StreamState {
  status: WsStatus;
  transcripts: TranscriptRow[];
  partialBySpeaker: Record<string, string>;
  insights: InsightRow[];
  knowledgeStatus: { status: string; reason?: string } | null;
  clarification: { question: string; options?: string[]; whyItMatters?: string } | null;
  error: string | null;
}

const initialState: StreamState = {
  status: 'idle',
  transcripts: [],
  partialBySpeaker: {},
  insights: [],
  knowledgeStatus: null,
  clarification: null,
  error: null,
};

function reduceMessage(state: StreamState, msg: WsServerMessage): StreamState {
  switch (msg.type) {
    case 'initial_state': {
      const transcripts = (msg.transcripts ?? []).map(t => ({
        id: (t.id as string) ?? `${t.timestamp_ms ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        consultation_id: msg.consultationId ?? '',
        text: t.text,
        speaker: (t.speaker as string | null) ?? null,
        is_final: (t.is_final ?? t.isFinal ?? false) as boolean,
        timestamp_ms: (t.timestamp_ms ?? t.timestampMs ?? null) as number | null,
        created_at: (t.created_at as string) ?? new Date().toISOString(),
      })) satisfies TranscriptRow[];

      const insights = (msg.insights ?? []).filter(i => i.id && i.kind && i.content) as unknown as InsightRow[];
      return { ...state, transcripts, insights };
    }

    case 'transcript_partial':
      return {
        ...state,
        partialBySpeaker: { ...state.partialBySpeaker, [msg.speaker]: msg.text },
      };

    case 'transcript_final': {
      const partial = { ...state.partialBySpeaker };
      delete partial[msg.speaker];
      const item: TranscriptRow = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        consultation_id: msg.consultationId ?? '',
        text: msg.text,
        speaker: msg.speaker,
        is_final: true,
        timestamp_ms: msg.timestampMs ?? null,
        created_at: new Date().toISOString(),
      };
      return {
        ...state,
        partialBySpeaker: partial,
        transcripts: [...state.transcripts, item],
      };
    }

    case 'insights_update':
    case 'insights_enriched_update':
    case 'conduct_update':
    case 'prescription_update': {
      // The back broadcasts deltas without ids in many cases. We merge by
      // re-fetch hint instead — caller can refresh `useConsultation()` query.
      // Here we just record that something changed via a synthetic event.
      return state;
    }

    case 'clarification_needed':
      return {
        ...state,
        clarification: {
          question: msg.question,
          options: msg.options,
          whyItMatters: msg.whyItMatters,
        },
      };

    case 'knowledge_status':
      return {
        ...state,
        knowledgeStatus: { status: msg.status, reason: msg.reason },
      };

    case 'insight_acked': {
      const insights = state.insights.map(i =>
        i.id === msg.insightId
          ? { ...i, acknowledged_at: new Date().toISOString(), acknowledged_action: msg.action }
          : i,
      );
      return { ...state, insights };
    }

    case 'error':
      return { ...state, error: msg.message };

    default:
      return state;
  }
}

export interface UseConsultationStream {
  status: WsStatus;
  transcripts: TranscriptRow[];
  partialBySpeaker: Record<string, string>;
  liveInsights: InsightRow[];
  knowledgeStatus: { status: string; reason?: string } | null;
  clarification: { question: string; options?: string[]; whyItMatters?: string } | null;
  error: string | null;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  ackInsight: (insightId: string, action: 'useful' | 'not_useful' | 'dismissed') => void;
}

export function useConsultationStream(
  consultationId: string | undefined,
): UseConsultationStream {
  const [state, setState] = useState<StreamState>(initialState);
  const [isRecording, setIsRecording] = useState(false);
  const clientRef = useRef<ConsultationWsClient | null>(null);
  const recorderRef = useRef<PcmRecorder | null>(null);

  useEffect(() => {
    if (!consultationId) return;
    const client = new ConsultationWsClient({ consultationId });
    clientRef.current = client;
    const offMsg = client.on(msg => setState(prev => reduceMessage(prev, msg)));
    const offStatus = client.onStatus(status => setState(prev => ({ ...prev, status })));
    client.connect().catch(() => undefined);
    return () => {
      offMsg();
      offStatus();
      void recorderRef.current?.stop();
      recorderRef.current = null;
      client.dispose();
      clientRef.current = null;
    };
  }, [consultationId]);

  const startRecording = useCallback(async () => {
    const client = clientRef.current;
    if (!client) throw new Error('Stream client não inicializado.');
    if (recorderRef.current) return;
    await client.openAudioChannel();
    const recorder = await startPcmRecorder({
      onChunk: chunk => client.sendAudioChunk(chunk),
      onError: err => setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Erro de gravação.' })),
    });
    recorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(async () => {
    const client = clientRef.current;
    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
    }
    client?.closeAudioChannel();
    setIsRecording(false);
  }, []);

  const ackInsight = useCallback(
    (insightId: string, action: 'useful' | 'not_useful' | 'dismissed') => {
      clientRef.current?.ackInsight(insightId, action);
    },
    [],
  );

  return useMemo(
    () => ({
      status: state.status,
      transcripts: state.transcripts,
      partialBySpeaker: state.partialBySpeaker,
      liveInsights: state.insights,
      knowledgeStatus: state.knowledgeStatus,
      clarification: state.clarification,
      error: state.error,
      isRecording,
      startRecording,
      stopRecording,
      ackInsight,
    }),
    [state, isRecording, startRecording, stopRecording, ackInsight],
  );
}
