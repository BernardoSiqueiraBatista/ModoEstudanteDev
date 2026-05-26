import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3333';
const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';

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
  hasConflicts: boolean;
}

export interface FixedEvent {
  name: string;
  days: string[];
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

const FIXED_EVENTS_KEY = 'routine_fixed_events';

function saveFixedEvents(events: FixedEvent[]): void {
  localStorage.setItem(FIXED_EVENTS_KEY, JSON.stringify(events));
}

function loadFixedEvents(): FixedEvent[] {
  try {
    const raw = localStorage.getItem(FIXED_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as FixedEvent[]) : [];
  } catch {
    return [];
  }
}

const DATE_TO_DAYKEY: Record<number, DayKey> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

const PT_DAY_TO_KEY: Record<string, DayKey> = {
  'Segunda': 'monday',
  'Terça':   'tuesday',
  'Quarta':  'wednesday',
  'Quinta':  'thursday',
  'Sexta':   'friday',
  'Sábado':  'saturday',
  'Domingo': 'sunday',
};

const TIPO_TO_TYPE: Record<string, RoutineBlock['type']> = {
  revisao:     'revision',
  simulado:    'questions',
  aula:        'study',
  caso_clinico:'study',
  teoria:      'study',
};

const PRIORITY_TO_AREAS: Record<string, string[]> = {
  questions: ['Questões', 'Simulados'],
  revision:  ['Revisão'],
  reading:   ['Leitura', 'Teoria'],
};

function emptyWeek(): Record<DayKey, RoutineBlock[]> {
  return { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
}

function parseMins(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcDuration(start: string, end: string): number {
  return Math.max(0, parseMins(end) - parseMins(start));
}

function blocksToWeek(blocks: any[]): Record<DayKey, RoutineBlock[]> {
  const week = emptyWeek();
  for (const b of blocks) {
    const dateStr = String(b.data).split('T')[0];
    const date = new Date(`${dateStr}T12:00:00`);
    const dayKey = DATE_TO_DAYKEY[date.getDay()];
    if (!dayKey) continue;
    week[dayKey].push({
      label: b.titulo,
      type: TIPO_TO_TYPE[b.tipo] ?? 'study',
      duration_min: calcDuration(b.hora_inicio, b.hora_fim),
      start_time: b.hora_inicio,
      end_time: b.hora_fim,
    });
  }
  return week;
}

function detectConflicts(week: Record<DayKey, RoutineBlock[]>, events: FixedEvent[]): boolean {
  for (const ev of events) {
    const evStart = parseMins(ev.startTime);
    const evEnd   = parseMins(ev.endTime);
    for (const dayName of ev.days) {
      const dayKey = PT_DAY_TO_KEY[dayName];
      if (!dayKey) continue;
      for (const b of week[dayKey] ?? []) {
        const bStart = parseMins(b.start_time ?? '00:00');
        const bEnd   = parseMins(b.end_time   ?? '00:00');
        if (bStart < evEnd && bEnd > evStart) return true;
      }
    }
  }
  return false;
}

function addFixedEventsToWeek(week: Record<DayKey, RoutineBlock[]>, events: FixedEvent[]): void {
  for (const ev of events) {
    for (const dayName of ev.days) {
      const dayKey = PT_DAY_TO_KEY[dayName];
      if (!dayKey) continue;
      week[dayKey].push({
        label: ev.name,
        type: 'fixed',
        duration_min: Math.max(0, parseMins(ev.endTime) - parseMins(ev.startTime)),
        start_time: ev.startTime,
        end_time: ev.endTime,
      });
      week[dayKey].sort((a, b) => parseMins(a.start_time ?? '00:00') - parseMins(b.start_time ?? '00:00'));
    }
  }
}

function planToRoutine(plan: any, blocks: any[], fixedEvents: FixedEvent[]): RoutineResponse {
  const week = blocksToWeek(blocks);
  const hasConflicts = detectConflicts(week, fixedEvents);
  addFixedEventsToWeek(week, fixedEvents);
  return {
    routine_id: plan.id,
    week,
    ai_reasoning: '',
    suggestions: [],
    hasConflicts,
  };
}

export function useRoutineGenerator() {
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentRoutine = useCallback(async () => {
    try {
      const listRes = await fetch(`${API_BASE}/student/${STUDENT_ID}/study-plan`);
      if (!listRes.ok) return;

      const plans: any[] = await listRes.json();
      if (!plans.length) return;

      const latestPlanId = plans[0].id;
      const detailRes = await fetch(`${API_BASE}/student/${STUDENT_ID}/study-plan/${latestPlanId}`);
      if (!detailRes.ok) return;

      const { plan, blocks } = await detailRes.json();
      setRoutine(planToRoutine(plan, blocks, loadFixedEvents()));
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
    }, 60_000);

    try {
      const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const res = await fetch(`${API_BASE}/student/${STUDENT_ID}/study-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          titulo: `Plano de Estudos - ${today}`,
          categoria: 'geral',
          areas_foco: PRIORITY_TO_AREAS[params.priority] ?? ['Geral'],
          duracao: 'semanal',
          horas_por_dia: params.hoursPerDay,
          dias_semana: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
          horarios_bloqueados: params.fixedEvents.flatMap((e) =>
            e.days.map((dia) => ({ dia, inicio: e.startTime, fim: e.endTime }))
          ),
          briefing: params.briefing,
          considerar_insights: params.usePerformanceData,
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError((body as { message?: string })?.message ?? `Erro ${res.status}`);
        return;
      }

      const { plan, blocks } = await res.json();
      saveFixedEvents(params.fixedEvents);
      setRoutine(planToRoutine(plan, blocks, params.fixedEvents));
    } catch (e: unknown) {
      clearTimeout(timeout);
      if ((e as { name?: string }).name === 'AbortError') return;
      console.error('[useRoutineGenerator] generate error:', e);
      setError('Não conseguimos gerar sua rotina agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { routine, loading, error, generate, fetchCurrentRoutine, setError };
}
