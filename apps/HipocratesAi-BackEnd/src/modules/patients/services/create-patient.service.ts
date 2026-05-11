import { AppError } from '../../../shared/errors/app-error';
import type { CreatePatientDTO } from '../dtos/create-patient.dto';
import { PatientsRepository } from '../repositories/patients.repository';

type ExecuteInput = {
  dto: CreatePatientDTO;
  ownerUserId: string;
  orgId: string;
};

export class CreatePatientService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async execute({ dto, ownerUserId, orgId }: ExecuteInput) {
    if (!dto.fullName?.trim()) {
      throw new AppError('Nome completo é obrigatório.');
    }

    if (!dto.birthDate) {
      throw new AppError('Data de nascimento é obrigatória.');
    }

    if (!dto.sex) {
      throw new AppError('Sexo é obrigatório.');
    }

    if (!dto.phoneNumber?.trim()) {
      throw new AppError('Telefone é obrigatório.');
    }

    if (dto.document?.trim()) {
      const existingByDocument = await this.patientsRepository.findByDocument(dto.document.trim());
      if (existingByDocument) {
        throw new AppError('Já existe um paciente com este documento.', 409);
      }
    }

    const existingByPhone = await this.patientsRepository.findByPhoneNumber(dto.phoneNumber.trim());
    if (existingByPhone) {
      throw new AppError('Já existe um paciente com este telefone.', 409);
    }

    const patient = await this.patientsRepository.create({
      org_id: orgId,
      full_name: dto.fullName.trim(),
      birth_date: dto.birthDate,
      sex: dto.sex,
      document: dto.document?.trim() || null,
      phone_number: dto.phoneNumber.trim(),
      status: 'active',
      insurance_provider: dto.insuranceProvider?.trim() || null,
      insurance_number: dto.insuranceNumber?.trim() || null,
      chief_complaint: dto.chiefComplaint?.trim() || null,
      allergies: dto.allergies?.trim() || null,
      current_medications: dto.currentMedications?.trim() || null,
      notes: dto.notes?.trim() || null,
      doctor_id: ownerUserId,
    });

    return patient;
  }
}
