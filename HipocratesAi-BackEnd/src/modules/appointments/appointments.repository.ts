import { supabase } from "../../config/supabase";
import {
  AgendaListItem,
  AppointmentRow,
  AppointmentStatus,
} from "./appointments.types";
import { AppError } from "../../shared/errors/AppError";

interface CreateAppointmentParams {
  orgId: string | null;
  patientId: string;
  doctorUserId: string;
  startAt: string;
  endAt: string;
  source: "manual" | "google";
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

export class AppointmentsRepository {
  async findById(id: string): Promise<AppointmentRow | null> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .select(`
        id,
        org_id,
        patient_id,
        doctor_user_id,
        start_at,
        end_at,
        status,
        source,
        external_event_id,
        created_at
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao buscar agendamento.", 500, error);
    }

    return data as AppointmentRow | null;
  }

  async findConflicts(params: FindConflictsParams): Promise<boolean> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .select("id, start_at, end_at, status")
      .eq("doctor_user_id", params.doctorUserId)
      .not("status", "in", '("canceled","done","no_show")');

    if (error) {
      throw new AppError("Erro ao verificar conflitos de agenda.", 500, error);
    }

    const newStart = new Date(params.startAt).getTime();
    const newEnd = new Date(params.endAt).getTime();

    return (data ?? []).some((appointment) => {
      const start = new Date(appointment.start_at).getTime();
      const end = new Date(appointment.end_at).getTime();

      return newStart < end && newEnd > start;
    });
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
      external_event_id: params.externalEventId ?? null,
    };

    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .insert(payload)
      .select(`
        id,
        org_id,
        patient_id,
        doctor_user_id,
        start_at,
        end_at,
        status,
        source,
        external_event_id,
        created_at
      `)
      .single();

    if (error) {
      throw new AppError("Erro ao criar agendamento.", 500, error);
    }

    return data as AppointmentRow;
  }

  async listByDate(params: ListByDateParams): Promise<AgendaListItem[]> {
    const startOfDay = `${params.date}T00:00:00-03:00`;
    const endOfDay = `${params.date}T23:59:59-03:00`;
  
    let query = supabase
      .schema("app")
      .from("appointments")
      .select(`
        id,
        org_id,
        patient_id,
        doctor_user_id,
        start_at,
        end_at,
        status,
        source,
        external_event_id
      `)
      .gte("start_at", startOfDay)
      .lte("start_at", endOfDay)
      .order("start_at", { ascending: true });
  
    if (params.orgId) {
      query = query.eq("org_id", params.orgId);
    }
  
    if (params.doctorUserId) {
      query = query.eq("doctor_user_id", params.doctorUserId);
    }
  
    const { data: appointments, error: appointmentsError } = await query;
  
    if (appointmentsError) {
      throw new AppError("Erro ao listar agenda.", 500, appointmentsError);
    }
  
    const result = await Promise.all(
      (appointments ?? []).map(async (item: any) => {
        const { data: patient, error: patientError } = await supabase
          .schema("app")
          .from("patients")
          .select(`
            id,
            full_name,
            phone,
            document,
            birth_date,
            sex
          `)
          .eq("id", item.patient_id)
          .maybeSingle();
  
        if (patientError) {
          throw new AppError("Erro ao buscar paciente da agenda.", 500, patientError);
        }
  
        return {
          id: item.id,
          orgId: item.org_id,
          patientId: item.patient_id,
          patientName: patient?.full_name ?? "",
          patientPhone: patient?.phone ?? null,
          patientDocument: patient?.document ?? null,
          patientBirthDate: patient?.birth_date ?? null,
          patientSex: patient?.sex ?? null,
          doctorUserId: item.doctor_user_id,
          startAt: item.start_at,
          endAt: item.end_at,
          status: item.status,
          source: item.source,
          externalEventId: item.external_event_id,
        };
      })
    );
  
    return result;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentRow | null> {
    const { data, error } = await supabase
      .schema("app")
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select(`
        id,
        org_id,
        patient_id,
        doctor_user_id,
        start_at,
        end_at,
        status,
        source,
        external_event_id,
        created_at
      `)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao atualizar status do agendamento.", 500, error);
    }

    return data as AppointmentRow | null;
  }
}