import { AppError } from '../../../shared/errors/app-error';
import { PatientsRepository } from '../repositories/patients.repository';

type UpdatePatientInput = {
  id: string;
  ownerUserId: string;
  data: {
    full_name?: string;
    birth_date?: string;
    sex?: string;
    document?: string | null;
    phone_number?: string;
    status?: string;
    insurance_provider?: string | null;
    insurance_number?: string | null;
    chief_complaint?: string | null;
    allergies?: string | null;
    current_medications?: string | null;
    notes?: string | null;
  };
};

export class UpdatePatientService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async execute({ id, ownerUserId, data }: UpdatePatientInput) {
    const existing = await this.patientsRepository.findById(id);

    if (!existing) {
      throw new AppError('Paciente não encontrado.', 404);
    }

    if (existing.doctor_id !== ownerUserId) {
      throw new AppError('Sem permissão para editar este paciente.', 403);
    }

    if (data.document?.trim()) {
      const byDoc = await this.patientsRepository.findByDocument(data.document.trim());
      if (byDoc && byDoc.id !== id) {
        throw new AppError('Já existe um paciente com este documento.', 409);
      }
    }

    if (data.phone_number?.trim()) {
      const byPhone = await this.patientsRepository.findByPhoneNumber(data.phone_number.trim());
      if (byPhone && byPhone.id !== id) {
        throw new AppError('Já existe um paciente com este telefone.', 409);
      }
    }

    return this.patientsRepository.update(id, data);
  }
}
