import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth-request';
import { supabase } from '../../config/supabase';

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      const { data: orgMember } = await supabase
        .schema('app')
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      req.user = {
        id: user.id,
        orgId: orgMember?.org_id ?? null,
      };
    }
  } catch {
    // Ignore auth errors for optional middleware
  }

  next();
}
