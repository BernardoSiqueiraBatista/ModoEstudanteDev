import { z } from 'zod';

export const patientSexSchema = z.enum(['male', 'female', 'other']);
export type PatientSex = z.infer<typeof patientSexSchema>;

export const patientStatusSchema = z.enum(['ativo', 'followup', 'pendente']);
export type PatientStatus = z.infer<typeof patientStatusSchema>;

export const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório.'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória.'),
  sex: patientSexSchema,
  phoneNumber: z.string().min(1, 'Telefone é obrigatório.'),
  document: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insuranceNumber: z.string().optional().nullable(),
  chiefComplaint: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  currentMedications: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export type CreatePatientDto = z.infer<typeof createPatientSchema>;

export const patientApiItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  gender: z.string(),
  age: z.number(),
  recordNumber: z.string(),
  birthDate: z.string().nullable(),
  document: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  sex: z.string().nullable(),
  status: patientStatusSchema,
  mainDiagnosis: z.string().nullable(),
  observations: z.string().nullable(),
  insuranceProvider: z.string().nullable(),
  insuranceNumber: z.string().nullable(),
  allergies: z.string().nullable(),
  currentMedications: z.string().nullable(),
  createdAt: z.string(),
  lastConsultation: z
    .object({
      date: z.string(),
      doctor: z.string(),
    })
    .nullable(),
});
export type PatientApiItem = z.infer<typeof patientApiItemSchema>;

export const patientTabSchema = z.enum(['all', 'active', 'followup', 'critical']);
export type PatientTab = z.infer<typeof patientTabSchema>;

export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  tab: patientTabSchema.default('all'),
});
export type ListPatientsQueryDto = z.infer<typeof listPatientsQuerySchema>;

export const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const paginatedPatientsResponseSchema = z.object({
  data: z.array(patientApiItemSchema),
  pagination: paginationSchema,
});
export type PaginatedPatientsResponse = z.infer<typeof paginatedPatientsResponseSchema>;

/**
 * Backend update endpoint expects snake_case (matches DB row schema).
 */
export const updatePatientSchema = z.object({
  full_name: z.string().min(1).optional(),
  birth_date: z.string().optional(),
  document: z.string().optional().nullable(),
  phone_number: z.string().optional(),
  sex: patientSexSchema.optional(),
  insurance_provider: z.string().optional().nullable(),
  insurance_number: z.string().optional().nullable(),
  chief_complaint: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  current_medications: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;
