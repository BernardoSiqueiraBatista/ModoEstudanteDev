import type { Request } from 'express';

export type AuthRequest = Request & {
  user?: {
    id: string;
    orgId?: string | null;
  };
};
