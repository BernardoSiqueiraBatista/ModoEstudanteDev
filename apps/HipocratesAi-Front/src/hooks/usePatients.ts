import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePatientDto,
  ListPatientsQueryDto,
  UpdatePatientDto,
} from '@hipo/contracts';
import {
  createPatient,
  deletePatient,
  fetchPatient,
  fetchPatients,
  updatePatient,
} from '../service/patients';

export const patientsKeys = {
  all: ['patients'] as const,
  list: (params: Partial<ListPatientsQueryDto>) =>
    [...patientsKeys.all, 'list', params] as const,
  byId: (id: string) => [...patientsKeys.all, 'byId', id] as const,
};

export function usePatients(params: Partial<ListPatientsQueryDto> = {}) {
  return useQuery({
    queryKey: patientsKeys.list(params),
    queryFn: () => fetchPatients(params),
    placeholderData: previous => previous,
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: patientsKeys.byId(id ?? ''),
    queryFn: () => fetchPatient(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePatientDto) => createPatient(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientsKeys.all });
    },
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePatientDto) => updatePatient(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientsKeys.all });
      qc.invalidateQueries({ queryKey: patientsKeys.byId(id) });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: patientsKeys.all });
      qc.removeQueries({ queryKey: patientsKeys.byId(id) });
    },
  });
}
