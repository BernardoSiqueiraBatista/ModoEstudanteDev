import { z } from 'zod';

const updatePatientSchema = z.object({
  full_name: z.string().min(1).optional(),
  birth_date: z.string().optional(),
  document: z.string().optional().nullable(),
  phone_number: z.string().optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  insurance_provider: z.string().optional().nullable(),
  insurance_number: z.string().optional().nullable(),
  chief_complaint: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  current_medications: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

describe('updatePatientSchema (Zod validation)', () => {
  it('rejects invalid sex values', () => {
    const result = updatePatientSchema.safeParse({ sex: 'invalid' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('sex');
    }
  });

  it('accepts valid partial updates', () => {
    const result = updatePatientSchema.safeParse({
      full_name: 'Novo Nome',
      sex: 'female',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe('Novo Nome');
      expect(result.data.sex).toBe('female');
    }
  });

  it('accepts empty object (no updates)', () => {
    const result = updatePatientSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects non-string full_name', () => {
    const result = updatePatientSchema.safeParse({ full_name: 123 });

    expect(result.success).toBe(false);
  });

  it('rejects non-string phone_number', () => {
    const result = updatePatientSchema.safeParse({ phone_number: 12345 });

    expect(result.success).toBe(false);
  });

  it('rejects non-string birth_date', () => {
    const result = updatePatientSchema.safeParse({ birth_date: true });

    expect(result.success).toBe(false);
  });

  it('accepts all valid sex values', () => {
    for (const sex of ['male', 'female', 'other']) {
      const result = updatePatientSchema.safeParse({ sex });
      expect(result.success).toBe(true);
    }
  });

  it('accepts nullable fields as null', () => {
    const result = updatePatientSchema.safeParse({
      document: null,
      insurance_provider: null,
      notes: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects full_name with empty string (min 1 char)', () => {
    const result = updatePatientSchema.safeParse({ full_name: '' });

    expect(result.success).toBe(false);
  });
});
