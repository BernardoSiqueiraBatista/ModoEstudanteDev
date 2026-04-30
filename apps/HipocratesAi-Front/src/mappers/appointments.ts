import type { Apontamento } from '../data/WeekCalendarData';
import type { EventType } from '../components/agenda/week/Calendarevent';
import type { AppointmentApiItem } from '../service/appointments';

const CALENDAR_START = '08:00';
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

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

function getDayIndexFromIso(iso: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(new Date(iso));
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const jsDay = map[weekday] ?? 0;
  return (jsDay + 6) % 7;
}

function mapStatusToEventType(status: AppointmentApiItem['status']): EventType {
  switch (status) {
    case 'done':
      return 'consulta';
    case 'scheduled':
      return 'consulta';
    case 'no_show':
      return 'urgencia';
    case 'canceled':
      return 'compromisso';
    default:
      return 'consulta';
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getAge(birthDate: string | null) {
  if (!birthDate) return 0;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function mapGender(sex: string | null) {
  switch ((sex ?? '').toLowerCase()) {
    case 'male':
    case 'm':
      return 'Masculino';
    case 'female':
    case 'f':
      return 'Feminino';
    case 'unknown':
      return 'Não informado';
    default:
      return 'Não informado';
  }
}

export function mapApiAppointmentsToWeekEvents(items: AppointmentApiItem[]): Apontamento[] {
  return items
    .filter(item => item.status !== 'canceled')
    .map(item => {
      const startTime = formatTime(item.startAt);
      const endTime = formatTime(item.endAt);

      return {
        id: item.id,
        dayIndex: getDayIndexFromIso(item.startAt),
        patient: {
          id: item.patientId,
          name: item.patientName,
          initials: getInitials(item.patientName),
          gender: mapGender(item.patientSex),
          age: getAge(item.patientBirthDate),
          recordNumber: item.patientDocument ?? `PAC-${item.patientId.slice(0, 8)}`,
          status: 'ativo',
        },
        title: item.patientName,
        startTime,
        endTime,
        type: mapStatusToEventType(item.status),
        description: 'Consulta Geral',
        top: timeToTop(startTime),
        height: timeToHeight(startTime, endTime),
      } as Apontamento;
    });
}
