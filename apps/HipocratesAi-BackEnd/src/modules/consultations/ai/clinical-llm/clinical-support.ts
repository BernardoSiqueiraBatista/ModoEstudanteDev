import { postClinicalLlm } from './client';
import type {
  ClinicalLlmCallOptions,
  ClinicalSupportReq,
  ClinicalSupportResp,
} from './types';

export async function clinicalSupport(
  text: string,
  opts: ClinicalLlmCallOptions = {},
): Promise<ClinicalSupportResp> {
  const body: ClinicalSupportReq = { text };
  return postClinicalLlm<ClinicalSupportReq, ClinicalSupportResp>(
    '/clinical_support',
    body,
    {
      endpointName: 'clinical_support',
      timeoutMs: 15_000,
      consultationId: opts.consultationId,
      signal: opts.signal,
    },
  );
}
