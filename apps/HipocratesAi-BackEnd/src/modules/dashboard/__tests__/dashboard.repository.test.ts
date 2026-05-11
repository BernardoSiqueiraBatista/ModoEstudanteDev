import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';
import { DashboardRepository } from '../dashboard.repository';
import { AppError } from '../../../shared/errors/AppError';

describe('DashboardRepository', () => {
  let repo: DashboardRepository;

  beforeEach(() => {
    repo = new DashboardRepository();
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
    mockSupabaseAdmin.order.mockReturnThis();
    // gte/lt/neq not in default mock — add them as chainable
    (mockSupabaseAdmin as any).gte = jest.fn().mockReturnThis();
    (mockSupabaseAdmin as any).lt = jest.fn().mockReturnThis();
    (mockSupabaseAdmin as any).neq = jest.fn().mockReturnThis();
  });

  describe('countTodayAppointments', () => {
    it('returns count and queries appointments with doctor filter', async () => {
      Object.assign(mockSupabaseAdmin, { count: 5, error: null });

      const result = await repo.countTodayAppointments('doctor-1');

      expect(result).toBe(5);
      expect(mockSupabaseAdmin.schema).toHaveBeenCalledWith('app');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('appointments');
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('doctor_user_id', 'doctor-1');
    });

    it('returns 0 when count is null', async () => {
      Object.assign(mockSupabaseAdmin, { count: null, error: null });
      const result = await repo.countTodayAppointments('doctor-1');
      expect(result).toBe(0);
    });

    it('throws AppError on supabase error', async () => {
      Object.assign(mockSupabaseAdmin, { count: null, error: { message: 'db' } });
      await expect(repo.countTodayAppointments('doctor-1')).rejects.toThrow(AppError);
      Object.assign(mockSupabaseAdmin, { error: null });
    });
  });

  describe('countActivePatients', () => {
    it('queries patients with doctor_id and active status', async () => {
      Object.assign(mockSupabaseAdmin, { count: 12, error: null });

      const result = await repo.countActivePatients('owner-1');

      expect(result).toBe(12);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('patients');
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('doctor_id', 'owner-1');
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('status', 'active');
    });
  });

  describe('getTodayAppointments', () => {
    it('maps appointments to expected shape', async () => {
      const data = [
        {
          id: 'apt-1',
          patient_id: 'p-1',
          doctor_user_id: 'd-1',
          start_at: '2026-04-07T10:00:00Z',
          end_at: '2026-04-07T11:00:00Z',
          status: 'scheduled',
          source: 'manual',
          type: 'consulta',
          patients: { full_name: 'João', phone_number: '119999' },
        },
      ];
      Object.assign(mockSupabaseAdmin, { data, error: null });
      mockSupabaseAdmin.order.mockResolvedValue({ data, error: null } as any);

      const result = await repo.getTodayAppointments('d-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'apt-1',
        patientName: 'João',
        patientPhone: '119999',
        type: 'consulta',
      });
    });

    it('returns empty array when no appointments', async () => {
      mockSupabaseAdmin.order.mockResolvedValue({ data: [], error: null } as any);
      const result = await repo.getTodayAppointments('d-1');
      expect(result).toEqual([]);
    });
  });
});
