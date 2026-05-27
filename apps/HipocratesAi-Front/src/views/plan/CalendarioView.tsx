import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WeekCalendarHeader from '../../components/agenda/week/WeekCalendarHeader';
import WeekCalendarGrid from '../../components/agenda/week/WeekCalendarGrid';
import { useRoutineGenerator, type DayKey, type RoutineBlock, type FixedEvent } from '../../hooks/useRoutineGenerator';
import { weekDays } from '../../data/WeekCalendarData';
import type { Apontamento, Patient } from '../../types/PatientTypes';
import type { EventType } from '../../components/agenda/week/Calendarevent';
import FixedEventModal from '../../components/plan/FixedEventModal';
import FixedEventPill from '../../components/plan/FixedEventPill';

// ─── Geometry ────────────────────────────────────────────────────────────────
const CALENDAR_START = '06:00';
const PX_PER_HOUR   = 80;
const PX_PER_MIN    = PX_PER_HOUR / 60;

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

function parseMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}
function timeToTop(t: string) {
  return Math.round(Math.max(0, (parseMins(t) - parseMins(CALENDAR_START)) * PX_PER_MIN));
}
function addMins(t: string, m: number): string {
  const total = parseMins(t) + m;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─── Mapping routine → appointments ─────────────────────────────────────────
const DAY_ORDER: DayKey[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const STUB_PATIENT: Patient = {
  id: 'student-0', name: 'Estudante', initials: 'ES',
  gender: 'M', age: 0, recordNumber: '—',
  lastConsultation: { date: '', doctor: '' }, status: 'ativo',
};

const TYPE_MAP: Record<string, EventType>    = { study:'consulta', questions:'urgencia', revision:'compromisso', fixed:'video' };
const DESC_MAP: Record<string, string>       = { study:'Estudo teórico', questions:'Questões', revision:'Revisão', fixed:'Compromisso fixo' };

function toAppointments(week: Record<DayKey, RoutineBlock[]>): Apontamento[] {
  const out: Apontamento[] = [];
  DAY_ORDER.forEach((day, dayIndex) => {
    let cursor = '08:00';
    (week[day] ?? []).forEach((b) => {
      const start = b.start_time ?? cursor;
      const end   = b.end_time   ?? addMins(start, b.duration_min);
      out.push({
        dayIndex, patient: STUB_PATIENT, title: b.label,
        startTime: start, endTime: end,
        type: TYPE_MAP[b.type] ?? 'consulta',
        description: DESC_MAP[b.type] ?? 'Estudo',
        top: timeToTop(start),
        height: Math.min(240, Math.max(40, Math.round(b.duration_min * PX_PER_MIN))),
      });
      cursor = addMins(end, 15);
    });
  });
  return out;
}


function getWeekLabel(): string {
  const today = new Date();
  const diff  = (today.getDay() + 6) % 7;
  const mon   = new Date(today); mon.setDate(today.getDate() - diff);
  const sun   = new Date(mon);   sun.setDate(mon.getDate() + 6);
  const fmt   = (d: Date, extra?: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('pt-BR', { day:'numeric', month:'long', ...extra });
  return `${fmt(mon)} a ${fmt(sun, { year:'numeric' })}`;
}

// ─── Stats sub-components ────────────────────────────────────────────────────
const LEGEND = [
  { label:'Estudo Teórico',   cls:'bg-blue-50   border-blue-200   text-blue-700'   },
  { label:'Questões',         cls:'bg-orange-50 border-orange-200 text-orange-700' },
  { label:'Revisão',          cls:'bg-slate-50  border-slate-200  text-slate-600'  },
  { label:'Compromisso Fixo', cls:'bg-indigo-50 border-indigo-200 text-indigo-700' },
];

function StudyChart({ events }: { events: Apontamento[] }) {
  const days = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const hrs  = Array.from({length:7}, (_,i) =>
    events.filter(e => e.dayIndex === i)
      .reduce((s,e) => s + Math.max(0,(parseMins(e.endTime) - parseMins(e.startTime))/60), 0)
  );
  const max = Math.max(...hrs, 1);

  return (
    <div className="lg:col-span-2 bg-white border border-light rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-title">Intensidade de Estudos</h2>
        <div className="flex items-center gap-4 text-[10px] font-bold text-subtitle">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"/>Ativo</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"/>Média</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 h-28 px-2">
        {hrs.map((h, i) => (
          <div key={i} className="grow rounded-t-lg transition-all duration-500"
            style={{ height:`${Math.max(4,(h/max)*100)}%`, backgroundColor: h>0?'#1773cf':'#e2e8f0', opacity: h>0?(0.35+(h/max)*0.65):1 }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3 px-2">
        {days.map(d=><span key={d} className="text-[10px] font-bold text-subtitle opacity-60">{d}</span>)}
      </div>
    </div>
  );
}

function GoalCard({ hours, goal }: { hours:number; goal:number }) {
  const pct = Math.min(100, Math.round((hours/Math.max(1,goal))*100));
  return (
    <div className="bg-primary p-6 rounded-2xl flex flex-col justify-between text-white relative overflow-hidden">
      <div className="relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Meta Semanal</span>
        <h3 className="text-3xl font-extrabold mt-2 tracking-tight">{goal}h Foco</h3>
        <p className="text-sm mt-2 opacity-90 font-medium">
          {hours>0 ? `Você completou ${pct}% da meta. Continue assim!` : 'Gere sua rotina no Plano para ver sua meta.'}
        </p>
      </div>
      <div className="mt-6 relative z-10">
        <div className="w-full bg-white/20 h-1.5 rounded-full mb-5 overflow-hidden">
          <div className="bg-white h-full rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
        </div>
        <button className="w-full bg-white text-primary py-2.5 rounded-full text-xs font-bold hover:bg-white/90 transition-colors">
          Detalhes do Progresso
        </button>
      </div>
      <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[180px] opacity-[0.05] pointer-events-none">
        clinical_notes
      </span>
    </div>
  );
}

const FIXED_EVENTS_KEY = 'routine_fixed_events';

function loadStoredFixedEvents(): FixedEvent[] {
  try {
    const raw = localStorage.getItem(FIXED_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as FixedEvent[]) : [];
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CalendarioView() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const planId    = (location.state as { planId?: string } | null)?.planId;
  const { routine, loading, fetchCurrentRoutine, fetchPlanById } = useRoutineGenerator();

  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>(loadStoredFixedEvents);
  const [showFixedModal, setShowFixedModal] = useState(false);

  useEffect(() => {
    if (planId) {
      fetchPlanById(planId);
    } else {
      fetchCurrentRoutine();
    }
  }, [planId, fetchCurrentRoutine, fetchPlanById]);

  function handleAddFixed(ev: FixedEvent) {
    const updated = [...fixedEvents, ev];
    setFixedEvents(updated);
    localStorage.setItem(FIXED_EVENTS_KEY, JSON.stringify(updated));
    if (planId) fetchPlanById(planId); else fetchCurrentRoutine();
  }

  function handleRemoveFixed(idx: number) {
    const updated = fixedEvents.filter((_, i) => i !== idx);
    setFixedEvents(updated);
    localStorage.setItem(FIXED_EVENTS_KEY, JSON.stringify(updated));
    if (planId) fetchPlanById(planId); else fetchCurrentRoutine();
  }

  const todayIndex = weekDays.findIndex(d => d.isToday);

  const events = useMemo(() => {
    if (!routine) return [];
    return toAppointments(routine.week);
  }, [routine]);

  const currentTimePos = useMemo(() => {
    const now = new Date();
    return timeToTop(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
  }, []);

  const totalHours = useMemo(() =>
    events.reduce((s,e) => s + Math.max(0,(parseMins(e.endTime)-parseMins(e.startTime))/60), 0),
    [events]
  );

  return (
    <div className="flex flex-col pb-16">

      {/* Page title row */}
      <div className="flex items-start justify-between px-10 py-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-title">Calendário de Estudos</h1>
          <p className="text-sm text-subtitle mt-1 font-medium">{getWeekLabel()}</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => setShowFixedModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-light rounded-full text-sm font-semibold text-on-surface hover:bg-surface-light transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">event_busy</span>
            Compromissos fixos
            {fixedEvents.length > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {fixedEvents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/plan')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-light rounded-full text-sm font-semibold text-on-surface hover:bg-surface-light transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Voltar ao Plano
          </button>
        </div>
      </div>

      {/* Fixed events pills */}
      {fixedEvents.length > 0 && (
        <div className="px-10 pb-2 flex flex-wrap gap-2">
          {fixedEvents.map((ev, idx) => (
            <FixedEventPill key={idx} event={ev} onRemove={() => handleRemoveFixed(idx)} />
          ))}
        </div>
      )}

      {/* Info bar */}
      {!routine && !loading && (
        <div className="px-10 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-[16px]">info</span>
          <p className="text-xs text-amber-700 font-medium">
            Visualização de exemplo. Gere sua rotina na tela de Plano para ver seus eventos reais.
          </p>
          <button
            onClick={() => navigate('/plan')}
            className="ml-auto text-xs text-amber-700 font-bold underline"
          >
            Ir para o Plano
          </button>
        </div>
      )}
      {routine && !loading && (
        <div className="px-10 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>
            check_circle
          </span>
          <p className="text-xs text-green-700 font-medium">Sua rotina está ativa nesta semana.</p>
        </div>
      )}

      {/* Calendar */}
      <div className="mx-6 mt-6 mb-4 bg-white border border-light rounded-2xl overflow-hidden shadow-sm">

        {/* Legend + loading */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-light bg-slate-50/50">
          {LEGEND.map(l => (
            <span key={l.label} className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${l.cls}`}>
              {l.label}
            </span>
          ))}
          {loading && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-subtitle font-medium">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Carregando rotina...
            </span>
          )}
        </div>

        {/* Scrollable grid */}
        <div className="overflow-auto no-scrollbar" style={{ maxHeight:'calc(100vh - 300px)', minHeight:'500px' }}>
          <WeekCalendarHeader days={weekDays} />
          <WeekCalendarGrid
            timeSlots={TIME_SLOTS}
            events={events}
            currentTimePosition={currentTimePos}
            todayIndex={todayIndex}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StudyChart events={events} />
        <GoalCard hours={Math.round(totalHours)} goal={routine ? 30 : 20} />
      </div>

      {showFixedModal && (
        <FixedEventModal
          onAdd={handleAddFixed}
          onClose={() => setShowFixedModal(false)}
          existingEvents={fixedEvents}
        />
      )}

    </div>
  );
}
