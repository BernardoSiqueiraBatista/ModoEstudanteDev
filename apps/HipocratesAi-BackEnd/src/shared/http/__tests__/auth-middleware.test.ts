import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';
import { authMiddleware } from '../auth-middleware';
import type { AuthRequest } from '../auth-request';
import type { Response, NextFunction } from 'express';

function makeMockRes(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis() as any,
    json: jest.fn().mockReturnThis() as any,
  };
  return res;
}

function makeMockReq(headers: Record<string, string> = {}): Partial<AuthRequest> {
  return {
    headers: headers as any,
  };
}

describe('authMiddleware', () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    // Reset chain methods
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
    mockSupabaseAdmin.limit.mockReturnThis();
  });

  it('returns 401 when no Authorization header', async () => {
    const req = makeMockReq({});
    const res = makeMockRes();

    await authMiddleware(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = makeMockReq({ authorization: 'Basic abc123' });
    const res = makeMockRes();

    await authMiddleware(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido.' });
  });

  it('returns 401 when token is invalid', async () => {
    const req = makeMockReq({ authorization: 'Bearer invalid-token' });
    const res = makeMockRes();

    mockSupabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    await authMiddleware(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido ou expirado.' });
  });

  it('sets req.user with id and orgId on valid token', async () => {
    const req = makeMockReq({ authorization: 'Bearer valid-token' });
    const res = makeMockRes();

    mockSupabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabaseAdmin.maybeSingle.mockResolvedValue({
      data: { org_id: 'org-456' },
      error: null,
    });

    await authMiddleware(req as AuthRequest, res as Response, next);

    expect((req as AuthRequest).user).toEqual({
      id: 'user-123',
      orgId: 'org-456',
    });
    expect(next).toHaveBeenCalled();
  });

  it('sets orgId to null when user has no org membership', async () => {
    const req = makeMockReq({ authorization: 'Bearer valid-token' });
    const res = makeMockRes();

    mockSupabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabaseAdmin.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    await authMiddleware(req as AuthRequest, res as Response, next);

    expect((req as AuthRequest).user).toEqual({
      id: 'user-123',
      orgId: null,
    });
    expect(next).toHaveBeenCalled();
  });
});
