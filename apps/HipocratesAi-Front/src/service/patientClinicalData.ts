import {
  clinicalDataEnvelopeSchema,
  cognitiveSummaryEnvelopeSchema,
  hypothesisSchema,
  timelineEventSchema,
  treatmentSchema,
  type CognitiveSummary,
  type Hypothesis,
  type TimelineEvent,
  type Treatment,
} from '@hipo/contracts';
import { httpClient } from '../lib/http';

const timelineEnvelope = clinicalDataEnvelopeSchema(timelineEventSchema);
const hypothesesEnvelope = clinicalDataEnvelopeSchema(hypothesisSchema);
const treatmentsEnvelope = clinicalDataEnvelopeSchema(treatmentSchema);

export async function fetchPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
  const res = await httpClient.get<{ data: TimelineEvent[] }>(`/patients/${patientId}/timeline`, {
    schema: timelineEnvelope,
  });
  return res.data;
}

export async function fetchPatientHypotheses(patientId: string): Promise<Hypothesis[]> {
  const res = await httpClient.get<{ data: Hypothesis[] }>(`/patients/${patientId}/hypotheses`, {
    schema: hypothesesEnvelope,
  });
  return res.data;
}

export async function fetchPatientTreatments(patientId: string): Promise<Treatment[]> {
  const res = await httpClient.get<{ data: Treatment[] }>(`/patients/${patientId}/treatments`, {
    schema: treatmentsEnvelope,
  });
  return res.data;
}

export async function fetchPatientCognitiveSummary(
  patientId: string,
): Promise<CognitiveSummary> {
  const res = await httpClient.get<{ data: CognitiveSummary }>(
    `/patients/${patientId}/cognitive-summary`,
    { schema: cognitiveSummaryEnvelopeSchema },
  );
  return res.data;
}
