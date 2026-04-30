import { z } from 'zod';
import { appointmentSourceSchema, appointmentStatusSchema, appointmentTypeSchema } from './appointments';

export const dashboardAgendaItemSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientPhone: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  status: appointmentStatusSchema,
  source: appointmentSourceSchema,
  type: appointmentTypeSchema,
});
export type DashboardAgendaItem = z.infer<typeof dashboardAgendaItemSchema>;

export const dashboardStatsSchema = z.object({
  consultasHoje: z.number().int(),
  pacientesAtivos: z.number().int(),
  totalPacientes: z.number().int(),
  pendencias: z.number().int(),
  followUps: z.number().int(),
  agendaHoje: z.array(dashboardAgendaItemSchema),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
