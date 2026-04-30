import {
  paginatedPatientsResponseSchema,
  patientApiItemSchema,
  type CreatePatientDto,
  type ListPatientsQueryDto,
  type PaginatedPatientsResponse,
  type PatientApiItem,
  type UpdatePatientDto,
} from '@hipo/contracts';
import { httpClient } from '../lib/http';

function toQueryString(params: Partial<ListPatientsQueryDto>): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.search) sp.set('search', params.search);
  if (params.tab) sp.set('tab', params.tab);
  return sp.toString();
}

export async function fetchPatients(
  params: Partial<ListPatientsQueryDto> = {},
): Promise<PaginatedPatientsResponse> {
  const qs = toQueryString(params);
  const path = qs ? `/patients?${qs}` : '/patients';
  return httpClient.get<PaginatedPatientsResponse>(path, {
    schema: paginatedPatientsResponseSchema,
  });
}

export async function fetchPatient(id: string): Promise<PatientApiItem> {
  return httpClient.get<PatientApiItem>(`/patients/${id}`, {
    schema: patientApiItemSchema,
  });
}

export async function createPatient(payload: CreatePatientDto): Promise<PatientApiItem> {
  return httpClient.post<PatientApiItem>('/patients', payload, {
    schema: patientApiItemSchema,
  });
}

export async function updatePatient(
  id: string,
  payload: UpdatePatientDto,
): Promise<PatientApiItem> {
  return httpClient.put<PatientApiItem>(`/patients/${id}`, payload, {
    schema: patientApiItemSchema,
  });
}

export async function deletePatient(id: string): Promise<void> {
  await httpClient.delete<void>(`/patients/${id}`);
}
