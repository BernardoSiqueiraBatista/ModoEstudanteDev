import { postClinicalLlm } from './client';
import type {
  ChecklistQuestionReq,
  ChecklistQuestionResp,
  ClinicalLlmCallOptions,
  MacroScore,
} from './types';

export async function checklistQuestion(
  text: string,
  top3: MacroScore[],
  opts: ClinicalLlmCallOptions = {},
): Promise<ChecklistQuestionResp> {
  const body: ChecklistQuestionReq = { text, top3 };
  return postClinicalLlm<ChecklistQuestionReq, ChecklistQuestionResp>(
    '/checklist_question',
    body,
    {
      endpointName: 'checklist_question',
      timeoutMs: 8_000,
      consultationId: opts.consultationId,
    },
  );
}
