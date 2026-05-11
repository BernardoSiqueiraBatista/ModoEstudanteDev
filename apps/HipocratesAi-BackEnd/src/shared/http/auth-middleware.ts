import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth-request';
import { supabase } from '../../config/supabase';
import { logger } from '../logger/logger';

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // Get org membership for the user
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

    next();
  } catch (err) {
    logger.error({ err }, '[AUTH_MIDDLEWARE]');
    return res.status(401).json({ message: 'Erro na autenticação.' });
  }
}
