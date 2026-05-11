import { supabase } from '../../config/supabase';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';

export class DashboardRepository {
  async countTodayAppointments(doctorUserId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00${env.TZ_OFFSET}`;
    const tomorrow = new Date(`${today}T00:00:00${env.TZ_OFFSET}`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.toISOString();

    const { count, error } = await supabase
      .schema('app')
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_user_id', doctorUserId)
      .gte('start_at', startOfDay)
      .lt('start_at', endOfDay)
      .neq('status', 'canceled');

    if (error) throw new AppError('Erro ao contar consultas.', 500, error);
    return count ?? 0;
  }

  async countActivePatients(ownerUserId: string): Promise<number> {
    const { count, error } = await supabase
      .schema('app')
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', ownerUserId)
      .eq('status', 'active');

    if (error) throw new AppError('Erro ao contar pacientes.', 500, error);
    return count ?? 0;
  }

  async countTotalPatients(ownerUserId: string): Promise<number> {
    const { count, error } = await supabase
      .schema('app')
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', ownerUserId);

    if (error) throw new AppError('Erro ao contar pacientes.', 500, error);
    return count ?? 0;
  }

  async countPendingAppointments(doctorUserId: string): Promise<number> {
    const { count, error } = await supabase
      .schema('app')
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_user_id', doctorUserId)
      .eq('status', 'scheduled');

    if (error) throw new AppError('Erro ao contar pendências.', 500, error);
    return count ?? 0;
  }

  async countFollowUpPatients(ownerUserId: string): Promise<number> {
    const { count, error } = await supabase
      .schema('app')
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', ownerUserId)
      .eq('status', 'followup');

    if (error) throw new AppError('Erro ao contar follow-ups.', 500, error);
    return count ?? 0;
  }

  async getTodayAppointments(doctorUserId: string) {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00${env.TZ_OFFSET}`;
    const tomorrow = new Date(`${today}T00:00:00${env.TZ_OFFSET}`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.toISOString();

    const { data, error } = await supabase
      .schema('app')
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor_user_id,
        start_at,
        end_at,
        status,
        source,
        type,
        patients:patient_id (
          full_name,
          phone_number
        )
      `)
      .eq('doctor_user_id', doctorUserId)
      .gte('start_at', startOfDay)
      .lt('start_at', endOfDay)
      .neq('status', 'canceled')
      .order('start_at', { ascending: true });

    if (error) throw new AppError('Erro ao buscar agenda.', 500, error);

    return (data ?? []).map((apt: any) => ({
      id: apt.id,
      patientId: apt.patient_id,
      patientName: apt.patients?.full_name ?? '',
      patientPhone: apt.patients?.phone_number ?? null,
      startAt: apt.start_at,
      endAt: apt.end_at,
      status: apt.status,
      source: apt.source,
      type: apt.type ?? 'consulta',
    }));
  }
}
