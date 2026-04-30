import {
  consultationRowSchema,
  createConsultationResponseSchema,
  draftSummaryResponseSchema,
  finishConsultationResponseSchema,
  getConsultationResponseSchema,
  researchResponseSchema,
  type ConsultationRow,
  type CreateConsultationDto,
  type CreateConsultationResponse,
  type DraftSummaryResponse,
  type FinishConsultationBody,
  type FinishConsultationResponse,
  type GetConsultationResponse,
  type InsightAckAction,
  type ResearchBody,
  type ResearchResponse,
  type SaveDoctorNoteBody,
  type UpdateConsultationBody,
} from '@hipo/contracts';
import { httpClient } from '../lib/http';

export async function createConsultation(
  payload: CreateConsultationDto,
): Promise<CreateConsultationResponse> {
  return httpClient.post<CreateConsultationResponse>('/consultations', payload, {
    schema: createConsultationResponseSchema,
  });
}

export async function fetchConsultation(id: string): Promise<GetConsultationResponse> {
  return httpClient.get<GetConsultationResponse>(`/consultations/${id}`, {
    schema: getConsultationResponseSchema,
  });
}

export async function updateConsultation(
  id: string,
  body: UpdateConsultationBody,
): Promise<ConsultationRow> {
  return httpClient.patch<ConsultationRow>(`/consultations/${id}`, body, {
    schema: consultationRowSchema,
  });
}

export async function finishConsultation(
  id: string,
  body: FinishConsultationBody = {},
): Promise<FinishConsultationResponse> {
  return httpClient.post<FinishConsultationResponse>(`/consultations/${id}/finish`, body, {
    schema: finishConsultationResponseSchema,
  });
}

export async function cancelConsultation(id: string): Promise<void> {
  await httpClient.post<void>(`/consultations/${id}/cancel`, {});
}

export async function generateDraftSummary(id: string): Promise<DraftSummaryResponse> {
  return httpClient.post<DraftSummaryResponse>(`/consultations/${id}/draft-summary`, {}, {
    schema: draftSummaryResponseSchema,
  });
}

export async function researchConsultation(
  id: string,
  body: ResearchBody,
): Promise<ResearchResponse> {
  return httpClient.post<ResearchResponse>(`/consultations/${id}/research`, body, {
    schema: researchResponseSchema,
  });
}

export async function saveDoctorNote(id: string, body: SaveDoctorNoteBody): Promise<void> {
  await httpClient.post<void>(`/consultations/${id}/notes`, body);
}

export async function acknowledgeInsight(
  consultationId: string,
  insightId: string,
  action: InsightAckAction,
): Promise<void> {
  await httpClient.post<void>(
    `/consultations/${consultationId}/insights/${insightId}/ack`,
    { action },
  );
}
