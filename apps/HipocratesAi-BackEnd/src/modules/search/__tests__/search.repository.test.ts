import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';
import { SearchRepository } from '../search.repository';

describe('SearchRepository', () => {
  let repo: SearchRepository;

  beforeEach(() => {
    repo = new SearchRepository();
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
    mockSupabaseAdmin.or.mockReturnThis();
  });

  it('returns combined patients and appointments results', async () => {
    const patients = [{ id: 'p-1', full_name: 'Maria' }];
    const appointments = [{ id: 'a-1', start_at: '2026-04-07', status: 'scheduled' }];

    mockSupabaseAdmin.limit
      .mockResolvedValueOnce({ data: patients, error: null } as any)
      .mockResolvedValueOnce({ data: appointments, error: null } as any);

    const result = await repo.globalSearch('owner-1', 'maria');

    expect(result.patients).toEqual(patients);
    expect(result.appointments).toEqual(appointments);
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('patients');
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('appointments');
  });

  it('returns empty arrays when nothing matches', async () => {
    mockSupabaseAdmin.limit
      .mockResolvedValueOnce({ data: null, error: null } as any)
      .mockResolvedValueOnce({ data: null, error: null } as any);

    const result = await repo.globalSearch('owner-1', 'zzz');

    expect(result.patients).toEqual([]);
    expect(result.appointments).toEqual([]);
  });

  it('passes query into ilike OR filters', async () => {
    mockSupabaseAdmin.limit
      .mockResolvedValueOnce({ data: [], error: null } as any)
      .mockResolvedValueOnce({ data: [], error: null } as any);

    await repo.globalSearch('owner-1', 'joao');

    const orCalls = (mockSupabaseAdmin.or as jest.Mock).mock.calls.map((c) => c[0]);
    expect(orCalls.some((c: string) => c.includes('joao'))).toBe(true);
  });
});
