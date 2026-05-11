import { supabase } from '../../config/supabase';

export class SearchRepository {
  async globalSearch(ownerUserId: string, query: string) {
    const [patientsResult, appointmentsResult] = await Promise.all([
      supabase
        .schema('app')
        .from('patients')
        .select('id, full_name, document, phone_number, status')
        .eq('doctor_id', ownerUserId)
        .or(`full_name.ilike.%${query}%,document.ilike.%${query}%`)
        .limit(10),

      supabase
        .schema('app')
        .from('appointments')
        .select('id, start_at, status, type, description, patient:patient_id(id, full_name)')
        .eq('doctor_user_id', ownerUserId)
        .or(`description.ilike.%${query}%,notes.ilike.%${query}%`)
        .limit(10),
    ]);

    return {
      patients: patientsResult.data ?? [],
      appointments: appointmentsResult.data ?? [],
    };
  }
}
