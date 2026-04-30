import { mapPatientToApi } from '../patient.mapper';
import type { PatientRow } from '../../types/patient.types';

const baseRow: PatientRow = {
  id: 'abcd1234-ef56-7890-abcd-1234567890ab',
  org_id: 'org-1',
  full_name: 'Maria Silva Santos',
  birth_date: '1990-06-15',
  sex: 'female',
  document: '12345678900',
  phone_number: '11999999999',
  status: 'active',
  created_at: '2024-03-10T12:00:00Z',
  insurance_provider: 'Unimed',
  insurance_number: 'U-123',
  chief_complaint: 'Dor de cabeça',
  allergies: 'Dipirona',
  current_medications: 'Paracetamol',
  notes: 'obs',
};

describe('mapPatientToApi', () => {
  it('maps all fields correctly', () => {
    const result = mapPatientToApi(baseRow, null);

    expect(result.id).toBe(baseRow.id);
    expect(result.name).toBe('Maria Silva Santos');
    expect(result.gender).toBe('Feminino');
    expect(result.document).toBe('12345678900');
    expect(result.phoneNumber).toBe('11999999999');
    expect(result.status).toBe('ativo');
    expect(result.mainDiagnosis).toBe('Dor de cabeça');
    expect(result.observations).toBe('obs');
    expect(result.insuranceProvider).toBe('Unimed');
    expect(result.insuranceNumber).toBe('U-123');
    expect(result.allergies).toBe('Dipirona');
    expect(result.currentMedications).toBe('Paracetamol');
    expect(result.createdAt).toBe('2024-03-10T12:00:00Z');
  });

  it('computes age from birthDate', () => {
    const result = mapPatientToApi({ ...baseRow, birth_date: '2000-01-01' }, null);
    const expected = new Date().getFullYear() - 2000 - (new Date() < new Date(`${new Date().getFullYear()}-01-01`) ? 1 : 0);
    expect(result.age).toBe(expected);
  });

  it('generates initials from full_name (max 2)', () => {
    expect(mapPatientToApi(baseRow, null).initials).toBe('MS');
    expect(mapPatientToApi({ ...baseRow, full_name: 'Ana' }, null).initials).toBe('A');
  });

  it('returns age 0 when birth_date is null', () => {
    const result = mapPatientToApi({ ...baseRow, birth_date: null }, null);
    expect(result.age).toBe(0);
    expect(result.birthDate).toBeNull();
  });

  it('generates recordNumber from id and createdAt', () => {
    const result = mapPatientToApi(baseRow, null);
    expect(result.recordNumber).toBe('#HP-2024-ABCD');
  });

  it('maps lastConsultation when provided', () => {
    const result = mapPatientToApi(baseRow, {
      date: '2026-01-01',
      doctorName: 'Dr. House',
    });
    expect(result.lastConsultation).toEqual({ date: '2026-01-01', doctor: 'Dr. House' });
  });

  it('returns null lastConsultation when not provided', () => {
    expect(mapPatientToApi(baseRow, null).lastConsultation).toBeNull();
  });
});
