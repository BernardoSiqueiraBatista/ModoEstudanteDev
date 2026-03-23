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
  'Sábado'
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

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};