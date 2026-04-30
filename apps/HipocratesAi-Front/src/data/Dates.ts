const today = new Date();

export const monthNames = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

export const dayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const nomeMesAtual = monthNames[today.getMonth()]; // Ex: "JUNHO"
export const diaAtual = today.getDate(); // Ex: 12
export const nomeDiaSemanaAtual = dayNames[today.getDay()]; // Ex: "Quarta-feira"
export const numeroDiaSemanaAtual = today.getDay(); // Ex: 3 (0=Dom, 1=Seg, ..., 6=Sáb)

export const dateToDayIndex = (date: Date): number => {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Seg, 6=Dom
};

export const dayIndexToJsDay = (dayIndex: number): number => {
  return dayIndex === 6 ? 0 : dayIndex + 1; // 0=Dom, 1=Seg, ..., 6=Sáb
};

export const formatDate = (date: Date) => {
  return {
    month: monthNames[date.getMonth()],
    day: date.getDate(),
    weekDay: dayNames[date.getDay()],
    weekDayShort: dayNamesShort[date.getDay()],
    dayIndex: dateToDayIndex(date),
    jsDay: date.getDay(),
    fullDate: date,
  };
};

export const SP_TIMEZONE = 'America/Sao_Paulo';

// Retorna YYYY-MM-DD interpretando a data no fuso de São Paulo,
// independentemente do fuso do browser. Defende contra hosts em UTC
// (que faziam o "hoje" virar mais cedo, por volta de 21h BRT).
export const getDateStringInSP = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const getTodayDateStringInSP = (): string => getDateStringInSP(new Date());

// 0=Dom .. 6=Sáb, calculado em SP.
export const getDayOfWeekInSP = (date: Date): number => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: SP_TIMEZONE,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[weekday] ?? 0;
};

export const isToday = (date: Date): boolean => {
  return getDateStringInSP(date) === getTodayDateStringInSP();
};
