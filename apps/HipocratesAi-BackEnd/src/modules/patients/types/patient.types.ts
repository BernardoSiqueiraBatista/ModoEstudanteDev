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
  doctor_id?: string | null;
};

/** Response format aligned with frontend Patient type */
export type PatientApiItem = {
  id: string;
  name: string;
  initials: string;
  gender: string;
  age: number;
  recordNumber: string;
  birthDate: string | null;
  document: string | null;
  phoneNumber: string | null;
  sex: string | null;
  status: 'ativo' | 'followup' | 'pendente';
  mainDiagnosis: string | null;
  observations: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
  allergies: string | null;
  currentMedications: string | null;
  createdAt: string;
  lastConsultation: {
    date: string;
    doctor: string;
  } | null;
};
