import { z } from 'zod';

export const acknowledgeInsightSchema = z.object({
  action: z.enum(['useful', 'not_useful', 'dismissed']),
});

export type AcknowledgeInsightDTO = z.infer<typeof acknowledgeInsightSchema>;
