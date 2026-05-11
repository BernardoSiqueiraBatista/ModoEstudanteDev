import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';
import { PatientsRepository } from '../repositories/patients.repository';
import { AppError } from '../../../shared/errors/app-error';

describe('PatientsRepository', () => {
  let repository: PatientsRepository;

  beforeEach(() => {
    repository = new PatientsRepository();
    // Reset the chain so each test starts fresh
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.insert.mockReturnThis();
    mockSupabaseAdmin.update.mockReturnThis();
    mockSupabaseAdmin.delete.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
    mockSupabaseAdmin.or.mockReturnThis();
    mockSupabaseAdmin.order.mockReturnThis();
    mockSupabaseAdmin.range.mockReturnThis();
    mockSupabaseAdmin.limit.mockReturnThis();
    mockSupabaseAdmin.in.mockReturnThis();
    mockSupabaseAdmin.is.mockReturnThis();
  });

  describe('create', () => {
    it('inserts and returns patient', async () => {
      const patientRow = {
        id: 'p-1',
        org_id: 'org-1',
        full_name: 'Maria',
        birth_date: '1985-01-01',
        sex: 'female',
        document: null,
        phone_number: '119999',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
      };

      mockSupabaseAdmin.single.mockResolvedValue({
        data: patientRow,
        error: null,
      });

      const result = await repository.create({
        org_id: 'org-1',
        full_name: 'Maria',
        birth_date: '1985-01-01',
        sex: 'female',
        document: null,
        phone_number: '119999',
        status: 'active',
      });

      expect(result).toEqual(patientRow);
      expect(mockSupabaseAdmin.schema).toHaveBeenCalledWith('app');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('patients');
    });

    it('throws AppError on supabase error', async () => {
      mockSupabaseAdmin.single.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(
        repository.create({
          org_id: 'org-1',
          full_name: 'Teste',
          birth_date: '2000-01-01',
          sex: 'male',
          document: null,
          phone_number: '119999',
          status: 'active',
        }),
      ).rejects.toThrow(AppError);

      await expect(
        repository.create({
          org_id: 'org-1',
          full_name: 'Teste',
          birth_date: '2000-01-01',
          sex: 'male',
          document: null,
          phone_number: '119999',
          status: 'active',
        }),
      ).rejects.toThrow('Erro ao criar paciente.');
    });
  });

  describe('findById', () => {
    it('returns patient when found', async () => {
      const patient = { id: 'p-1', full_name: 'João' };
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: patient,
        error: null,
      });

      const result = await repository.findById('p-1');

      expect(result).toEqual(patient);
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('id', 'p-1');
    });

    it('returns null when not found', async () => {
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('throws AppError on supabase error', async () => {
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(repository.findById('p-1')).rejects.toThrow(AppError);
      await expect(repository.findById('p-1')).rejects.toThrow('Erro ao buscar paciente.');
    });
  });

  describe('findByDocument', () => {
    it('returns patient when found by document', async () => {
      const patient = { id: 'p-1', document: '123' };
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: patient,
        error: null,
      });

      const result = await repository.findByDocument('123');

      expect(result).toEqual(patient);
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('document', '123');
    });

    it('throws on error', async () => {
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'err' },
      });

      await expect(repository.findByDocument('123')).rejects.toThrow(
        'Erro ao buscar paciente por documento.',
      );
    });
  });

  describe('findByPhoneNumber', () => {
    it('returns patient when found by phone', async () => {
      const patient = { id: 'p-1', phone_number: '119999' };
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: patient,
        error: null,
      });

      const result = await repository.findByPhoneNumber('119999');

      expect(result).toEqual(patient);
    });

    it('throws on error', async () => {
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'err' },
      });

      await expect(repository.findByPhoneNumber('119999')).rejects.toThrow(
        'Erro ao buscar paciente por telefone.',
      );
    });
  });

  describe('delete (soft delete)', () => {
    it('calls update with deleted_at and filters non-deleted', async () => {
      // Soft delete chain: update().eq().is() — the chain resolves on the last call (is).
      // Since is() returns `this`, the awaited result is the mock object; destructure { error }.
      Object.assign(mockSupabaseAdmin, { error: null });

      await repository.delete('p-1');

      expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) }),
      );
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('id', 'p-1');
      expect(mockSupabaseAdmin.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('throws AppError when supabase returns error', async () => {
      Object.assign(mockSupabaseAdmin, { error: { message: 'DB error' } });

      await expect(repository.delete('p-1')).rejects.toThrow(AppError);
      await expect(repository.delete('p-1')).rejects.toThrow('Erro ao deletar paciente.');

      // Cleanup
      Object.assign(mockSupabaseAdmin, { error: null });
    });
  });

  describe('update', () => {
    it('updates and returns patient', async () => {
      const updatedPatient = { id: 'p-1', full_name: 'Novo Nome' };
      mockSupabaseAdmin.single.mockResolvedValue({
        data: updatedPatient,
        error: null,
      });

      const result = await repository.update('p-1', { full_name: 'Novo Nome' });

      expect(result).toEqual(updatedPatient);
      expect(mockSupabaseAdmin.update).toHaveBeenCalledWith({ full_name: 'Novo Nome' });
    });

    it('throws on error', async () => {
      mockSupabaseAdmin.single.mockResolvedValue({
        data: null,
        error: { message: 'err' },
      });

      await expect(repository.update('p-1', {})).rejects.toThrow('Erro ao atualizar paciente.');
    });
  });
});
