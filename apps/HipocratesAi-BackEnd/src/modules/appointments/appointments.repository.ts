import { supabase } from "../../config/supabase";
import {
  AgendaListItem,
  AppointmentRow,
  AppointmentStatus,
  AppointmentType,
} from "./appointments.types";
import { AppError } from "../../shared/errors/AppError";
import { env } from "../../config/env";

interface CreateAppointmentParams {
  orgId: string | null;
  patientId: string;
  doctorUserId: string;
  startAt: string;
  endAt: string;
  source: "manual" | "google";
  type: AppointmentType;
  description?: string | null;
  notes?: string | null;
  externalEventId?: string | null;
}

interface FindConflictsParams {
  doctorUserId: string;
  startAt: string;
  endAt: string;
}

interface ListByDateParams {
  date: string;
  orgId?: string;
  doctorUserId?: string;
}

interface ListByWeekParams {
  weekStart: string;
  weekEnd: string;
  orgId?: string;
  doctorUserId?: string;
}

const APPOINTMENT_COLUMNS = `
  id,
  org_id,
  patient_id,
  doctor_user_id,
  start_at,
  end_at,
  status,
  source,
  type,
  description,
  notes,
  external_event_id,
  created_at
`;

const APPOINTMENT_WITH_PATIENT = `
  id,
  org_id,
  patient_id,
  doctor_user_id,
  start_at,
  end_at,
  status,
  source,
  type,
  description,
  external_event_id,
  patients:patient_id (
    id,
    full_name,
    phone_number,
    document,
    birth_date,
    sex
  )
`;

function mapToAgendaItem(item: any): AgendaListItem {
  const patient = item.patients;
  return {
    id: item.id,
    orgId: item.org_id,
    patientId: item.patient_id,
    patientName: patient?.full_name ?? "",
    patientPhone: patient?.phone_number ?? null,
    patientDocument: patient?.document ?? null,
    patientBirthDate: patient?.birth_date ?? null,
    patientSex: patient?.sex ?? null,
    doctorUserId: item.doctor_user_id,
    startAt: item.start_at,
    endAt: item.end_at,
    status: item.status,
    source: item.source,
    type: item.type ?? "consulta",
    description: item.description ?? null,
    externalEventId: item.external_event_id,
  };
}

export class AppointmentsRepository {
  async findById(id: string): Promise<AppointmentRow | null> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .select(APPOINTMENT_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao buscar agendamento.", 500, error);
    }

    return data as AppointmentRow | null;
  }

  async findByIdEnriched(id: string): Promise<AgendaListItem | null> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .select(APPOINTMENT_WITH_PATIENT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao buscar agendamento.", 500, error);
    }

    if (!data) return null;
    return mapToAgendaItem(data);
  }

  async findConflicts(params: FindConflictsParams): Promise<boolean> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .select("id")
      .eq("doctor_user_id", params.doctorUserId)
      .not("status", "in", '("canceled","done","no_show")')
      .lt("start_at", params.endAt)
      .gt("end_at", params.startAt)
      .limit(1);

    if (error) {
      throw new AppError("Erro ao verificar conflitos de agenda.", 500, error);
    }

    return (data ?? []).length > 0;
  }

  async create(params: CreateAppointmentParams): Promise<AppointmentRow> {
    const payload = {
      org_id: params.orgId,
      patient_id: params.patientId,
      doctor_user_id: params.doctorUserId,
      start_at: params.startAt,
      end_at: params.endAt,
      status: "scheduled",
      source: params.source,
      type: params.type,
      description: params.description ?? null,
      notes: params.notes ?? null,
      external_event_id: params.externalEventId ?? null,
    };

    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .insert(payload)
      .select(APPOINTMENT_COLUMNS)
      .single();

    if (error) {
      throw new AppError("Erro ao criar agendamento.", 500, error);
    }

    return data as AppointmentRow;
  }

  async listByDate(params: ListByDateParams): Promise<AgendaListItem[]> {
    const startOfDay = `${params.date}T00:00:00${env.TZ_OFFSET}`;
    const nextDay = new Date(`${params.date}T00:00:00${env.TZ_OFFSET}`);
    nextDay.setDate(nextDay.getDate() + 1);
    const endOfDay = nextDay.toISOString();

    let query = supabase
      .schema("app")
      .from("appointments")
      .select(APPOINTMENT_WITH_PATIENT)
      .gte("start_at", startOfDay)
      .lt("start_at", endOfDay)
      .order("start_at", { ascending: true });

    if (params.orgId) {
      query = query.eq("org_id", params.orgId);
    }

    if (params.doctorUserId) {
      query = query.eq("doctor_user_id", params.doctorUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError("Erro ao listar agenda.", 500, error);
    }

    return (data ?? []).map(mapToAgendaItem);
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentRow | null> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select(APPOINTMENT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao atualizar status do agendamento.", 500, error);
    }

    return data as AppointmentRow | null;
  }

  async listByWeek(params: ListByWeekParams): Promise<AgendaListItem[]> {
    const startOfWeek = `${params.weekStart}T00:00:00${env.TZ_OFFSET}`;
    const nextDay = new Date(`${params.weekEnd}T00:00:00${env.TZ_OFFSET}`);
    nextDay.setDate(nextDay.getDate() + 1);
    const endOfWeek = nextDay.toISOString();

    let query = supabase
      .schema("app")
      .from("appointments")
      .select(APPOINTMENT_WITH_PATIENT)
      .gte("start_at", startOfWeek)
      .lt("start_at", endOfWeek)
      .order("start_at", { ascending: true });

    if (params.orgId) {
      query = query.eq("org_id", params.orgId);
    }
    if (params.doctorUserId) {
      query = query.eq("doctor_user_id", params.doctorUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError("Erro ao listar agenda semanal.", 500, error);
    }

    return (data ?? []).map(mapToAgendaItem);
  }
}
