import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import type { PatientRow } from '../types/patient.types';

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
  owner_user_id?: string | null;
};

export class PatientsRepository {
  async create(input: CreatePatientRepositoryInput): Promise<PatientRow> {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data as PatientRow;
  }

  async findByDocument(document: string) {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .select('*')
      .eq('document', document)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async findByPhoneNumber(phoneNumber: string) {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async listByOwnerUserId(ownerUserId: string) {
    const { data, error } = await supabaseAdmin
      .schema('app')
      .from('patients')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as PatientRow[];
  }
}
