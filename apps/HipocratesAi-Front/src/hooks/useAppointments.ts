import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAppointment,
  fetchAppointmentsByDoctor,
  fetchWeeklyAppointments,
  type AppointmentApiItem,
} from '../service/appointments';
import type { CreateAppointmentDto } from '@hipo/contracts';

export const appointmentsKeys = {
  all: ['appointments'] as const,
  byDoctor: (doctorUserId: string, date: string) =>
    [...appointmentsKeys.all, 'byDoctor', doctorUserId, date] as const,
  weekly: (weekStart: string, weekEnd: string, doctorUserId: string | undefined) =>
    [...appointmentsKeys.all, 'weekly', weekStart, weekEnd, doctorUserId ?? ''] as const,
};

export function useAppointmentsByDoctor(params: {
  doctorUserId: string | undefined;
  date: string;
}) {
  return useQuery<AppointmentApiItem[]>({
    queryKey: appointmentsKeys.byDoctor(params.doctorUserId ?? '', params.date),
    queryFn: () =>
      fetchAppointmentsByDoctor({
        doctorUserId: params.doctorUserId!,
        date: params.date,
      }),
    enabled: Boolean(params.doctorUserId),
  });
}

export function useWeeklyAppointments(params: {
  weekStart: string;
  weekEnd: string;
  doctorUserId?: string;
}) {
  return useQuery<AppointmentApiItem[]>({
    queryKey: appointmentsKeys.weekly(params.weekStart, params.weekEnd, params.doctorUserId),
    queryFn: () => fetchWeeklyAppointments(params),
    enabled: Boolean(params.weekStart && params.weekEnd),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentDto) => createAppointment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentsKeys.all });
    },
  });
}
