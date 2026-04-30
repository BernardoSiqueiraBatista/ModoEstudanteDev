import { useQuery } from '@tanstack/react-query';
import {
  fetchPatientCognitiveSummary,
  fetchPatientHypotheses,
  fetchPatientTimeline,
  fetchPatientTreatments,
} from '../service/patientClinicalData';

export const clinicalKeys = {
  all: ['clinical'] as const,
  timeline: (patientId: string) => [...clinicalKeys.all, 'timeline', patientId] as const,
  hypotheses: (patientId: string) => [...clinicalKeys.all, 'hypotheses', patientId] as const,
  treatments: (patientId: string) => [...clinicalKeys.all, 'treatments', patientId] as const,
  cognitive: (patientId: string) => [...clinicalKeys.all, 'cognitive', patientId] as const,
};

export function usePatientTimeline(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicalKeys.timeline(patientId ?? ''),
    queryFn: () => fetchPatientTimeline(patientId!),
    enabled: Boolean(patientId),
  });
}

export function usePatientHypotheses(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicalKeys.hypotheses(patientId ?? ''),
    queryFn: () => fetchPatientHypotheses(patientId!),
    enabled: Boolean(patientId),
  });
}

export function usePatientTreatments(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicalKeys.treatments(patientId ?? ''),
    queryFn: () => fetchPatientTreatments(patientId!),
    enabled: Boolean(patientId),
  });
}

export function usePatientCognitiveSummary(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicalKeys.cognitive(patientId ?? ''),
    queryFn: () => fetchPatientCognitiveSummary(patientId!),
    enabled: Boolean(patientId),
  });
}
