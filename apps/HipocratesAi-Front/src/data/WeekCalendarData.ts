import type { EventType } from '../components/agenda/week/Calendarevent';
import { patients } from './PatientsData'; // IMPORTANDO de patientsData
import type { Patient } from '../types/PatientTypes';

export interface Apontamento {
  id?: string;
  dayIndex: number;
  patient: Patient;
  title: string;
  startTime: string;
  endTime: string;
  type: EventType;
  description?: string;
  top: number;
  height: number;
}

export const daysinceMonday = (jsDay: number) => (jsDay + 6) % 7;

export const weekDays = (() => {
  const today = new Date();
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const jsDay = today.getDay();
  const daysSinceMonday = (jsDay + 6) % 7;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - daysSinceMonday);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    const isWeekend = i === 5 || i === 6;
    return { dayName: dayNames[i], dayNumber: d.getDate(), isToday, isWeekend };
  });
})();

// Eventos base com pacientes (AGORA IMPORTADOS)
const baseEvents = [
  {
    dayIndex: 0,
    patient: patients.find(p => p.id === '1')!, // Ana Martins
    title: 'Ana Martins',
    startTime: '08:15',
    endTime: '10:00',
    type: 'consulta' as EventType,
    description: 'Consulta Rotina',
  },
  {
    dayIndex: 1,
    patient: patients.find(p => p.id === '2')!, // João Silva
    title: 'João Silva',
    startTime: '10:00',
    endTime: '11:15',
    type: 'compromisso' as EventType,
    description: 'Sala 4',
  },
  {
    dayIndex: 2,
    patient: patients.find(p => p.id === '3')!, // Carlos Santos
    title: 'Carlos Santos',
    startTime: '09:00',
    endTime: '10:00',
    type: 'consulta' as EventType,
    description: '',
  },
  {
    dayIndex: 2,
    patient: patients.find(p => p.id === '4')!, // Maria Oliveira
    title: 'Maria Oliveira',
    startTime: '11:30',
    endTime: '12:30',
    type: 'urgencia' as EventType,
    description: 'Urgência',
  },
  {
    dayIndex: 3,
    patient: patients.find(p => p.id === '5')!, // Roberto Souza
    title: 'Roberto Souza',
    startTime: '08:15',
    endTime: '10:15',
    type: 'consulta' as EventType,
    description: 'Pós-operatório',
  },
  {
    dayIndex: 4,
    patient: patients.find(p => p.id === '5')!, // Roberto Souza
    title: 'Roberto Souza',
    startTime: '00:15',
    endTime: '02:15',
    type: 'consulta' as EventType,
    description: 'Pós-operatório',
  },
];

export const timeSlots = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

// Helpers
const CALENDAR_START = '00:00';
const PX_PER_HOUR = 80;
const PX_PER_MIN = PX_PER_HOUR / 60;

function parseTimeToMinutes(t: string) {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

function timeToTop(time: string) {
  const minutesSinceStart = parseTimeToMinutes(time) - parseTimeToMinutes(CALENDAR_START);
  return Math.round(minutesSinceStart * PX_PER_MIN);
}

function timeToHeight(start: string, end: string) {
  const duration = parseTimeToMinutes(end) - parseTimeToMinutes(start);
  return Math.max(1, Math.round(duration * PX_PER_MIN));
}

// Computed week events com top/height calculados
export const computedWeekEvents: Apontamento[] = baseEvents.map(ev => ({
  ...ev,
  top: timeToTop(ev.startTime),
  height: timeToHeight(ev.startTime, ev.endTime),
}));

// Posição dinâmica da linha "Agora"
export const currentTimePosition = (() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return timeToTop(`${hh}:${mm}`);
})();

export function getEventsByDay(events: Apontamento[], dayIndex: number) {
  return events.filter(event => event.dayIndex === dayIndex);
}

export function getEventsByType(events: Apontamento[], type: string) {
  return events.filter(event => event.type === type);
}
