import { PatientsRepository } from '../repositories/patients.repository';

export class ListPatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async execute(ownerUserId: string) {
    return this.patientsRepository.listByOwnerUserId(ownerUserId);
  }
}
