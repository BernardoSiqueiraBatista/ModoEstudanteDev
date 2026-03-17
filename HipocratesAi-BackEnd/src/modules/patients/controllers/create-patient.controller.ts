import type { Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import type { AuthRequest } from '../../../shared/http/auth-request';
import type { CreatePatientDTO } from '../dtos/create-patient.dto';
import { PatientsRepository } from '../repositories/patients.repository';
import { CreatePatientService } from '../services/create-patient.service';

export async function createPatientController(req: AuthRequest, res: Response) {
  try {
    const dto = req.body as CreatePatientDTO;

    const ownerUserId = req.user?.id;
    const orgId = req.user?.orgId;

    if (!ownerUserId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!orgId) {
      return res.status(400).json({ message: 'Organização não identificada.' });
    }

    const service = new CreatePatientService(new PatientsRepository());
    const patient = await service.execute({
      dto,
      ownerUserId,
      orgId,
    });

    return res.status(201).json(patient);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Erro ao criar paciente:', error);
    return res.status(500).json({ message: 'Erro interno ao criar paciente.' });
  }
}
