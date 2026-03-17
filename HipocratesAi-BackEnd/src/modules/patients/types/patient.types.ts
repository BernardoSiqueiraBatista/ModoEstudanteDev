export type PatientSex = 'male' | 'female' | 'other';

export type PatientRow = {
  id: string;
  org_id: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  document: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
  insurance_provider?: string | null;
  insurance_number?: string | null;
  chief_complaint?: string | null;
  allergies?: string | null;
  current_medications?: string | null;
  notes?: string | null;
  owner_user_id?: string | null;
};
