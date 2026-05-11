import { z } from 'zod';

const isoMessage = 'Use uma data ISO válida. Ex: 2026-03-10T09:00:00-03:00';

export const appointmentStatusSchema = z.enum(['scheduled', 'canceled', 'done', 'no_show']);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSourceSchema = z.enum(['manual', 'google']);
export type AppointmentSource = z.infer<typeof appointmentSourceSchema>;

export const appointmentTypeSchema = z.enum(['consulta', 'urgencia', 'video', 'compromisso']);
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid(),
    doctorUserId: z.string().uuid(),
    orgId: z.string().uuid().nullable().optional(),
    startAt: z.string().datetime({ offset: true, message: isoMessage }),
    endAt: z.string().datetime({ offset: true, message: isoMessage }),
    source: appointmentSourceSchema.default('manual'),
    type: appointmentTypeSchema.default('consulta'),
    description: z.string().max(5000).optional().nullable(),
    externalEventId: z.string().optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startAt).getTime();
    const end = new Date(data.endAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Datas inválidas.',
        path: ['startAt'],
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endAt deve ser maior que startAt.',
        path: ['endAt'],
      });
    }
  });
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

export const listAppointmentsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  orgId: z.string().uuid().optional(),
  doctorUserId: z.string().uuid().optional(),
});
export type ListAppointmentsQueryDto = z.infer<typeof listAppointmentsQuerySchema>;

export const listWeeklyQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  orgId: z.string().uuid().optional(),
  doctorUserId: z.string().uuid().optional(),
});
export type ListWeeklyQueryDto = z.infer<typeof listWeeklyQuerySchema>;

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>;

export const agendaListItemSchema = z.object({
  id: z.string(),
  orgId: z.string().nullable(),
  patientId: z.string(),
  patientName: z.string(),
  patientPhone: z.string().nullable(),
  patientDocument: z.string().nullable(),
  patientBirthDate: z.string().nullable(),
  patientSex: z.string().nullable(),
  doctorUserId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  status: appointmentStatusSchema,
  source: appointmentSourceSchema,
  type: appointmentTypeSchema,
  description: z.string().nullable(),
  externalEventId: z.string().nullable(),
});
export type AgendaListItem = z.infer<typeof agendaListItemSchema>;
