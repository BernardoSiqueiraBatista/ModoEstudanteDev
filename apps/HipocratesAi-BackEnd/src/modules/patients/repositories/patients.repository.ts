import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import type { PatientRow, PatientApiItem } from '../types/patient.types';
import { mapPatientToApi } from '../mappers/patient.mapper';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../shared/logger/logger';
import { env } from '../../../config/env';

type CreatePatientRepositoryInput = {
  org_id: string;
  full_name: string;
  birth_date: string;
  sex: string;
  document: string | null;
  phone_number: string;
  status: string;
  insurance_provider?: string | null;
  insurance_number?: string | null;
  chief_complaint?: string | null;
  allergies?: string | null;
  current_medications?: string | null;
  notes?: string | null;
  doctor_id?: string | null;
};

/**
 * Helper: applies `.is('deleted_at', null)` only if soft delete is enabled.
 * Keeps the code working both with and without the migration applied.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withSoftDeleteFilter<T extends { is: (col: string, val: any) => T }>(q: T): T {
  return env.ENABLE_SOFT_DELETE ? q.is('deleted_at', null) : q;
}

export class PatientsRepository {
  async create(input: CreatePatientRepositoryInput): Promise<PatientRow> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error }, '[PatientsRepository.create]');
      throw new AppError('Erro ao criar paciente.', 500);
    }

    return data as PatientRow;
  }

  async findById(id: string): Promise<PatientRow | null> {
    const baseQuery = supabaseAdmin.schema('app').from('patients').select('*').eq('id', id);
    const { data, error } = await withSoftDeleteFilter(baseQuery).maybeSingle();

    if (error) {
      throw new AppError('Erro ao buscar paciente.', 500);
    }

    return data as PatientRow | null;
  }

  async findByDocument(document: string) {
    const baseQuery = supabaseAdmin.schema('app').from('patients').select('*').eq('document', document);
    const { data, error } = await withSoftDeleteFilter(baseQuery).maybeSingle();

    if (error) {
      throw new AppError('Erro ao buscar paciente por documento.', 500);
    }

    return data;
  }

  async findByPhoneNumber(phoneNumber: string) {
    const baseQuery = supabaseAdmin.schema('app').from('patients').select('*').eq('phone_number', phoneNumber);
    const { data, error } = await withSoftDeleteFilter(baseQuery).maybeSingle();

    if (error) {
      throw new AppError('Erro ao buscar paciente por telefone.', 500);
    }

    return data;
  }

  async listByOwnerUserId(ownerUserId: string) {
    const baseQuery = supabaseAdmin.schema('app').from('patients').select('*').eq('doctor_id', ownerUserId);
    const { data, error } = await withSoftDeleteFilter(baseQuery).order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Erro ao listar pacientes.', 500);
    }

    return (data ?? []) as PatientRow[];
  }

  async update(id: string, input: Partial<CreatePatientRepositoryInput>): Promise<PatientRow> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error, id }, 'Failed to update patient');
      throw new AppError('Erro ao atualizar paciente.', 500);
    }
    return data as PatientRow;
  }

  async delete(id: string): Promise<void> {
    if (env.ENABLE_SOFT_DELETE) {
      // Soft delete: set deleted_at, keep the row
      const { error } = await supabaseAdmin
        .schema('app')
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) {
        logger.error({ err: error, id }, 'Failed to soft delete patient');
        throw new AppError('Erro ao deletar paciente.', 500);
      }
      return;
    }

    // Hard delete fallback: remove appointments first, then patient
    const { error: apptError } = await supabaseAdmin
      .schema('app')
      .from('appointments')
      .delete()
      .eq('patient_id', id);

    if (apptError) {
      logger.error({ err: apptError, id }, '[PatientsRepository.delete] appointments');
      throw new AppError('Erro ao deletar agendamentos do paciente.', 500);
    }

    const { error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error({ err: error, id }, '[PatientsRepository.delete] patient');
      throw new AppError('Erro ao deletar paciente.', 500);
    }
  }

  async listPaginated(params: {
    ownerUserId: string;
    page: number;
    limit: number;
    search?: string;
    tab?: 'all' | 'active' | 'followup' | 'critical';
  }): Promise<{ data: PatientApiItem[]; total: number }> {
    const { ownerUserId, page, limit, search, tab } = params;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .schema('app')
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('doctor_id', ownerUserId);

    query = withSoftDeleteFilter(query);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (search) {
      const sanitized = search.replace(/[%_,.()"'\\]/g, '').trim();
      if (sanitized.length > 0) {
        const digitsOnly = sanitized.replace(/\D/g, '');
        const filters = [`full_name.ilike.%${sanitized}%`];
        if (digitsOnly.length > 0) {
          filters.push(`document.ilike.%${digitsOnly}%`);
          filters.push(`phone_number.ilike.%${digitsOnly}%`);
        } else {
          filters.push(`document.ilike.%${sanitized}%`);
          filters.push(`phone_number.ilike.%${sanitized}%`);
        }
        query = query.or(filters.join(','));
      }
    }

    if (tab === 'active') {
      query = query.eq('status', 'active');
    } else if (tab === 'followup') {
      query = query.eq('status', 'followup');
    } else if (tab === 'critical') {
      query = query.eq('status', 'critical');
    }

    const { data, error, count } = await query;

    if (error) throw new AppError('Erro ao listar pacientes.', 500);

    const patients = (data ?? []) as PatientRow[];

    // Enrich with last consultation - batched to avoid N+1 queries
    const patientIds = patients.map((p) => p.id);

    if (patientIds.length === 0) {
      return { data: [], total: count ?? 0 };
    }

    // 1) Fetch all done appointments for these patients in one query
    const { data: allAppointments } = await supabaseAdmin
      .schema('app')
      .from('appointments')
      .select('patient_id, start_at, doctor_user_id')
      .in('patient_id', patientIds)
      .eq('status', 'done')
      .order('start_at', { ascending: false });

    // Build a map of patient_id -> latest appointment
    const latestAppointmentMap = new Map<string, { start_at: string; doctor_user_id: string }>();
    for (const apt of allAppointments ?? []) {
      if (!latestAppointmentMap.has(apt.patient_id)) {
        latestAppointmentMap.set(apt.patient_id, apt);
      }
    }

    // 2) Fetch all unique doctors referenced in one query
    const doctorIds = [...new Set(
      [...latestAppointmentMap.values()].map((a) => a.doctor_user_id)
    )];

    const doctorMap = new Map<string, string>();
    if (doctorIds.length > 0) {
      const { data: doctors } = await supabaseAdmin
        .schema('app')
        .from('doctors')
        .select('id, full_name')
        .in('id', doctorIds);

      for (const doc of doctors ?? []) {
        doctorMap.set(doc.id, doc.full_name);
      }
    }

    // 3) Map in memory
    const enriched: PatientApiItem[] = patients.map((patient) => {
      const latestApt = latestAppointmentMap.get(patient.id);
      let lastConsultation: { date: string; doctorName: string } | null = null;

      if (latestApt) {
        lastConsultation = {
          date: latestApt.start_at,
          doctorName: doctorMap.get(latestApt.doctor_user_id) ?? '',
        };
      }

      return mapPatientToApi(patient, lastConsultation);
    });

    return { data: enriched, total: count ?? 0 };
  }
}
