export type AppointmentStatus =
  | "scheduled"
  | "canceled"
  | "done"
  | "no_show";

export type AppointmentSource = "manual" | "google";

export type AppointmentType = "consulta" | "urgencia" | "video" | "compromisso";

export interface AppointmentRow {
  id: string;
  org_id: string | null;
  patient_id: string;
  doctor_user_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  type: AppointmentType;
  description: string | null;
  notes: string | null;
  external_event_id: string | null;
  created_at: string;
}

export interface AgendaListItem {
  id: string;
  orgId: string | null;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  patientDocument: string | null;
  patientBirthDate: string | null;
  patientSex: string | null;
  doctorUserId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  type: AppointmentType;
  description: string | null;
  externalEventId: string | null;
}