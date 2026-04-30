import {
  agendaListItemSchema,
  type AgendaListItem,
  type CreateAppointmentDto,
} from '@hipo/contracts';
import { z } from 'zod';
import { httpClient } from '../lib/http';

export type AppointmentApiItem = AgendaListItem;

const agendaListSchema = z.array(agendaListItemSchema);

export async function fetchAppointmentsByDoctor(params: {
  date: string;
  doctorUserId: string;
}): Promise<AppointmentApiItem[]> {
  const query = new URLSearchParams({
    date: params.date,
    doctorUserId: params.doctorUserId,
  });

  return httpClient.get<AppointmentApiItem[]>(`/appointments?${query.toString()}`, {
    schema: agendaListSchema,
  });
}

export async function fetchWeeklyAppointments(params: {
  weekStart: string;
  weekEnd: string;
  doctorUserId?: string;
}): Promise<AppointmentApiItem[]> {
  const query = new URLSearchParams({
    weekStart: params.weekStart,
    weekEnd: params.weekEnd,
  });
  if (params.doctorUserId) query.set('doctorUserId', params.doctorUserId);

  return httpClient.get<AppointmentApiItem[]>(`/appointments/weekly?${query.toString()}`, {
    schema: agendaListSchema,
  });
}

export async function createAppointment(
  payload: Omit<CreateAppointmentDto, 'source'> & { source?: CreateAppointmentDto['source'] },
): Promise<AppointmentApiItem> {
  return httpClient.post<AppointmentApiItem>('/appointments', {
    ...payload,
    source: payload.source ?? 'manual',
  });
}
