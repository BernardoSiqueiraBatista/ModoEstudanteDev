import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchWeeklyAppointments } from '../service/appointments';
import { getDateStringInSP } from '../data/Dates';

const WEEK_LABELS = ['Semana 01', 'Semana 02', 'Semana 03', 'Atual'];

function getWeekRange(weekOffsetFromCurrent: number) {
  // 0 = semana atual; 1 = semana passada; ...
  const now = new Date();
  const jsDay = now.getDay(); // 0=Dom..6=Sab
  const diffToMonday = (jsDay + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday - weekOffsetFromCurrent * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: getDateStringInSP(monday),
    end: getDateStringInSP(sunday),
  };
}

export interface WeeklyActivePatientsPoint {
  label: string;
  count: number;
}

export function useWeeklyActivePatientsTrend(doctorUserId: string | undefined) {
  // Buscamos 4 semanas (3 anteriores + atual), do mais antigo para o mais recente.
  const offsets = [3, 2, 1, 0];
  const queries = useQueries({
    queries: offsets.map((offset) => {
      const { start, end } = getWeekRange(offset);
      return {
        queryKey: ['appointments', 'weekly-trend', doctorUserId ?? '', start, end],
        queryFn: () =>
          fetchWeeklyAppointments({
            weekStart: start,
            weekEnd: end,
            doctorUserId,
          }),
        enabled: Boolean(doctorUserId),
        staleTime: 5 * 60 * 1000,
      };
    }),
  });

  return useMemo(() => {
    const data: WeeklyActivePatientsPoint[] = queries.map((q, i) => {
      const items = q.data ?? [];
      const distinctPatients = new Set(
        items
          .filter((it) => it.status !== 'canceled')
          .map((it) => it.patientId),
      );
      return { label: WEEK_LABELS[i] ?? `S${i + 1}`, count: distinctPatients.size };
    });

    const current = data[data.length - 1]?.count ?? 0;
    const previous = data[data.length - 2]?.count ?? 0;
    const deltaPct =
      previous > 0
        ? Math.round(((current - previous) / previous) * 100)
        : current > 0
          ? 100
          : 0;

    return {
      data,
      current,
      deltaPct,
      isLoading: queries.some((q) => q.isLoading),
      isError: queries.some((q) => q.isError),
    };
  }, [queries]);
}
