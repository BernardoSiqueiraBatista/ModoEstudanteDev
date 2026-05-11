import type { IncomingMessage } from 'http';
import { supabase } from '../../../config/supabase';

export interface WsAuthContext {
  userId: string;
  orgId: string | null;
}

export async function authenticateWsRequest(req: IncomingMessage): Promise<WsAuthContext> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const queryToken = url.searchParams.get('token');
  const authHeader = req.headers['authorization'];

  let token: string | null = null;
  if (queryToken && queryToken.length > 0) {
    token = queryToken;
  } else if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    throw new Error('missing_token');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error('invalid_token');
  }

  const { data: orgMember } = await supabase
    .schema('app')
    .from('org_members')
    .select('org_id')
    .eq('user_id', data.user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return {
    userId: data.user.id,
    orgId: (orgMember?.org_id as string | undefined) ?? null,
  };
}
