import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3333';
const STUDENT_ID = 'd8cc8dd6-6737-4abd-8a51-8dcd13e58256';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface RoutineBlock {
  label: string;
  type: 'study' | 'questions' | 'revision' | 'fixed';
  duration_min: number;
  topic_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface SuggestionCard {
  id: string;
  badge: 'urgente' | 'simulado' | 'recomendado';
  title: string;
  description: string;
  action_label: string;
  icon?: string;
  topic_id?: string;
}

export interface RoutineResponse {
  routine_id: string;
  week: Record<DayKey, RoutineBlock[]>;
  ai_reasoning: string;
  suggestions: SuggestionCard[];
}

export interface FixedEvent {
  name: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface GenerateParams {
  briefing: string;
  hoursPerDay: number;
  priority: 'questions' | 'revision' | 'reading';
  usePerformanceData: boolean;
  fixedEvents: FixedEvent[];
}

function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split('T')[0]!;
}

export function useRoutineGenerator() {
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentRoutine = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/student/routine/current?user_id=${STUDENT_ID}`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json?.data ?? json;
      if (data?.routine_id) setRoutine(data as RoutineResponse);
    } catch {
      // silent — no current routine
    }
  }, []);

  const generate = useCallback(async (params: GenerateParams) => {
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      setError('timeout');
      setLoading(false);
    }, 10_000);

    try {
      const res = await fetch(`${API_BASE}/student/routine/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          user_id: STUDENT_ID,
          briefing: params.briefing,
          params: {
            hours_per_day: params.hoursPerDay,
            priority: params.priority,
            use_performance_data: params.usePerformanceData,
            fixed_events: params.fixedEvents,
            week_start: getNextMonday(),
          },
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError((body as { message?: string })?.message ?? `Erro ${res.status}`);
        return;
      }

      const json = await res.json();
      const data = (json?.data ?? json) as RoutineResponse;
      setRoutine(data);
    } catch (e: unknown) {
      clearTimeout(timeout);
      if ((e as { name?: string }).name === 'AbortError') return;
      setError('Não conseguimos gerar sua rotina agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { routine, loading, error, generate, fetchCurrentRoutine, setError };
}
