import type { PatientRow, PatientApiItem } from '../types/patient.types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function mapGender(sex: string | null): string {
  switch ((sex ?? '').toLowerCase()) {
    case 'male':
      return 'Masculino';
    case 'female':
      return 'Feminino';
    case 'other':
      return 'Outro';
    default:
      return 'Não informado';
  }
}

function mapStatus(status: string): PatientApiItem['status'] {
  switch (status) {
    case 'active':
      return 'ativo';
    case 'followup':
      return 'followup';
    case 'critical':
      return 'pendente';
    default:
      return 'ativo';
  }
}

function generateRecordNumber(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const shortId = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `#HP-${year}-${shortId}`;
}

export function mapPatientToApi(
  row: PatientRow,
  lastConsultation: { date: string; doctorName: string } | null,
): PatientApiItem {
  return {
    id: row.id,
    name: row.full_name,
    initials: getInitials(row.full_name),
    gender: mapGender(row.sex),
    age: getAge(row.birth_date),
    recordNumber: generateRecordNumber(row.id, row.created_at),
    birthDate: row.birth_date,
    document: row.document,
    phoneNumber: row.phone_number,
    sex: row.sex,
    status: mapStatus(row.status),
    mainDiagnosis: row.chief_complaint ?? null,
    observations: row.notes ?? null,
    insuranceProvider: row.insurance_provider ?? null,
    insuranceNumber: row.insurance_number ?? null,
    allergies: row.allergies ?? null,
    currentMedications: row.current_medications ?? null,
    createdAt: row.created_at,
    lastConsultation: lastConsultation
      ? { date: lastConsultation.date, doctor: lastConsultation.doctorName }
      : null,
  };
}
