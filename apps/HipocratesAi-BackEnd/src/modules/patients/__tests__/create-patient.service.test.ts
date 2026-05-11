import { AppError } from '../../../shared/errors/app-error';
import { CreatePatientService } from '../services/create-patient.service';
import type { PatientsRepository } from '../repositories/patients.repository';
import type { CreatePatientDTO } from '../dtos/create-patient.dto';

const makeRepository = (): jest.Mocked<PatientsRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn(),
    findByDocument: jest.fn(),
    findByPhoneNumber: jest.fn(),
    listByOwnerUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listPaginated: jest.fn(),
  }) as unknown as jest.Mocked<PatientsRepository>;

const validDto: CreatePatientDTO = {
  fullName: 'João Silva',
  birthDate: '1990-05-15',
  sex: 'male',
  phoneNumber: '11999998888',
  document: '12345678900',
  insuranceProvider: null,
  insuranceNumber: null,
  chiefComplaint: null,
  allergies: null,
  currentMedications: null,
  notes: null,
};

const ownerUserId = 'user-uuid-123';
const orgId = 'org-uuid-456';

describe('CreatePatientService', () => {
  let service: CreatePatientService;
  let repository: jest.Mocked<PatientsRepository>;

  beforeEach(() => {
    repository = makeRepository();
    service = new CreatePatientService(repository);
  });

  it('creates patient successfully with valid data', async () => {
    repository.findByDocument.mockResolvedValue(null);
    repository.findByPhoneNumber.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 'patient-1',
      org_id: orgId,
      full_name: 'João Silva',
      birth_date: '1990-05-15',
      sex: 'male',
      document: '12345678900',
      phone_number: '11999998888',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    });

    const result = await service.execute({ dto: validDto, ownerUserId, orgId });

    expect(result.id).toBe('patient-1');
    expect(result.full_name).toBe('João Silva');
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: orgId,
        full_name: 'João Silva',
        doctor_id: ownerUserId,
      }),
    );
  });

  it('throws AppError when fullName is empty', async () => {
    const dto = { ...validDto, fullName: '   ' };

    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(AppError);
    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(
      'Nome completo é obrigatório.',
    );
  });

  it('throws AppError when birthDate is missing', async () => {
    const dto = { ...validDto, birthDate: '' };

    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(AppError);
    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(
      'Data de nascimento é obrigatória.',
    );
  });

  it('throws AppError when sex is missing', async () => {
    const dto = { ...validDto, sex: '' as any };

    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(AppError);
    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(
      'Sexo é obrigatório.',
    );
  });

  it('throws AppError when phoneNumber is empty', async () => {
    const dto = { ...validDto, phoneNumber: '' };

    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(AppError);
    await expect(service.execute({ dto, ownerUserId, orgId })).rejects.toThrow(
      'Telefone é obrigatório.',
    );
  });

  it('throws AppError when duplicate document exists', async () => {
    repository.findByDocument.mockResolvedValue({ id: 'existing-patient' });

    await expect(service.execute({ dto: validDto, ownerUserId, orgId })).rejects.toThrow(AppError);
    await expect(service.execute({ dto: validDto, ownerUserId, orgId })).rejects.toThrow(
      'Já existe um paciente com este documento.',
    );
  });

  it('throws AppError when duplicate phone exists', async () => {
    repository.findByDocument.mockResolvedValue(null);
    repository.findByPhoneNumber.mockResolvedValue({ id: 'existing-patient' });

    await expect(service.execute({ dto: validDto, ownerUserId, orgId })).rejects.toThrow(AppError);
    await expect(service.execute({ dto: validDto, ownerUserId, orgId })).rejects.toThrow(
      'Já existe um paciente com este telefone.',
    );
  });

  it('skips document check when document is not provided', async () => {
    const dto = { ...validDto, document: undefined };
    repository.findByPhoneNumber.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 'patient-2',
      org_id: orgId,
      full_name: 'João Silva',
      birth_date: '1990-05-15',
      sex: 'male',
      document: null,
      phone_number: '11999998888',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    });

    await service.execute({ dto, ownerUserId, orgId });

    expect(repository.findByDocument).not.toHaveBeenCalled();
  });
});
