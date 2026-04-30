import type { Response } from 'express';
import type { AuthRequest } from '../../shared/http/auth-request';
import { SearchRepository } from './search.repository';
import type { SearchQueryDto } from './dtos/search.query';

export async function globalSearchController(req: AuthRequest, res: Response) {
  const ownerUserId = req.user?.id;

  if (!ownerUserId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const validated = (req as AuthRequest & { validatedQuery?: SearchQueryDto }).validatedQuery;
  const q = (validated?.q ?? (req.query.q as string) ?? '').trim();

  if (q.length < 2) {
    return res.json({ patients: [], appointments: [] });
  }

  const sanitized = q.replace(/[%_,.()"'\\`]/g, '').substring(0, 100);

  const repo = new SearchRepository();
  const results = await repo.globalSearch(ownerUserId, sanitized);

  return res.json(results);
}
