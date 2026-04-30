import { metrics } from '../../../../shared/metrics/metrics';
import { postClinicalLlm } from './client';
import type {
  ClassifyMacroReq,
  ClassifyMacroResp,
  ClinicalLlmCallOptions,
} from './types';

export async function classifyMacro(
  text: string,
  opts: ClinicalLlmCallOptions & { allowedMacro?: string[] } = {},
): Promise<ClassifyMacroResp> {
  const body: ClassifyMacroReq = {
    text,
    allowed_macro: opts.allowedMacro ?? [],
  };
  const result = await postClinicalLlm<ClassifyMacroReq, ClassifyMacroResp>(
    '/classify_macro',
    body,
    {
      endpointName: 'classify_macro',
      timeoutMs: 8_000,
      consultationId: opts.consultationId,
    },
  );
  metrics.increment(
    `clinical_llm.classify_macro.status.${result.status.toLowerCase()}`,
  );
  return result;
}
