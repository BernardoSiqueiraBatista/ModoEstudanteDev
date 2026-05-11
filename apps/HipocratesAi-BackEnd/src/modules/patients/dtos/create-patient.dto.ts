import { z } from 'zod';

export const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório.'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória.'),
  sex: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Sexo deve ser male, female ou other.' }),
  }),
  phoneNumber: z.string().min(1, 'Telefone é obrigatório.'),
  document: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insuranceNumber: z.string().optional().nullable(),
  chiefComplaint: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  currentMedications: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type CreatePatientDTO = z.infer<typeof createPatientSchema>;
