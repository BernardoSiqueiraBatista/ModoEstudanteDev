import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateConsultationDto,
  FinishConsultationBody,
  InsightAckAction,
  ResearchBody,
  SaveDoctorNoteBody,
} from '@hipo/contracts';
import {
  acknowledgeInsight,
  cancelConsultation,
  createConsultation,
  fetchConsultation,
  finishConsultation,
  generateDraftSummary,
  researchConsultation,
  saveDoctorNote,
} from '../service/consultations';

export const consultationsKeys = {
  all: ['consultations'] as const,
  byId: (id: string) => [...consultationsKeys.all, 'byId', id] as const,
};

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConsultationDto) => createConsultation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationsKeys.all });
    },
  });
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: consultationsKeys.byId(id ?? ''),
    queryFn: () => fetchConsultation(id!),
    enabled: Boolean(id),
  });
}

export function useFinishConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FinishConsultationBody = {}) => finishConsultation(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationsKeys.byId(id) });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelConsultation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationsKeys.byId(id) });
    },
  });
}

export function useDraftSummary(id: string) {
  return useMutation({
    mutationFn: () => generateDraftSummary(id),
  });
}

export function useResearchConsultation(id: string) {
  return useMutation({
    mutationFn: (body: ResearchBody) => researchConsultation(id, body),
  });
}

export function useSaveDoctorNote(id: string) {
  return useMutation({
    mutationFn: (body: SaveDoctorNoteBody) => saveDoctorNote(id, body),
  });
}

export function useAcknowledgeInsight(consultationId: string) {
  return useMutation({
    mutationFn: ({ insightId, action }: { insightId: string; action: InsightAckAction }) =>
      acknowledgeInsight(consultationId, insightId, action),
  });
}
