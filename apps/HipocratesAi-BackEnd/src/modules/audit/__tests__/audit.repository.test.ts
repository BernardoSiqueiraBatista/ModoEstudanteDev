import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';
import { AuditRepository } from '../audit.repository';

describe('AuditRepository', () => {
  let repository: AuditRepository;

  beforeEach(() => {
    repository = new AuditRepository();
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.insert.mockReset();
  });

  it('inserts an audit log row with the correct shape', async () => {
    mockSupabaseAdmin.insert.mockResolvedValueOnce({ error: null });

    await repository.log({
      orgId: 'org-1',
      actorUserId: 'user-1',
      action: 'create',
      entityType: 'patient',
      entityId: 'p-1',
      metadata: { foo: 'bar' },
    });

    expect(mockSupabaseAdmin.schema).toHaveBeenCalledWith('app');
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith({
      org_id: 'org-1',
      actor_user_id: 'user-1',
      action: 'create',
      entity_type: 'patient',
      entity_id: 'p-1',
      metadata: { foo: 'bar' },
    });
  });

  it('uses null defaults when optional fields missing', async () => {
    mockSupabaseAdmin.insert.mockResolvedValueOnce({ error: null });

    await repository.log({
      actorUserId: 'user-2',
      action: 'view',
      entityType: 'patient',
    });

    expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith({
      org_id: null,
      actor_user_id: 'user-2',
      action: 'view',
      entity_type: 'patient',
      entity_id: null,
      metadata: null,
    });
  });

  it('does not throw when supabase returns an error', async () => {
    mockSupabaseAdmin.insert.mockResolvedValueOnce({ error: { message: 'DB down' } });

    await expect(
      repository.log({
        actorUserId: 'user-1',
        action: 'delete',
        entityType: 'patient',
        entityId: 'p-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when insert raises an exception', async () => {
    mockSupabaseAdmin.insert.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(
      repository.log({
        actorUserId: 'user-1',
        action: 'create',
        entityType: 'patient',
      }),
    ).resolves.toBeUndefined();
  });
});
