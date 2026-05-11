import type { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { AppError } from '../../../shared/errors/app-error';
import { PatientsRepository } from '../repositories/patients.repository';
import { UpdatePatientService } from '../services/update-patient.service';
import { mapPatientToApi } from '../mappers/patient.mapper';
import { AuditRepository } from '../../audit/audit.repository';

const updatePatientSchema = z.object({
  full_name: z.string().min(1).optional(),
  birth_date: z.string().optional(),
  document: z.string().optional().nullable(),
  phone_number: z.string().optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  insurance_provider: z.string().optional().nullable(),
  insurance_number: z.string().optional().nullable(),
  chief_complaint: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  current_medications: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function updatePatientController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const ownerUserId = req.user?.id;

    if (!ownerUserId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const data = updatePatientSchema.parse(req.body);

    const service = new UpdatePatientService(new PatientsRepository());
    const patient = await service.execute({
      id,
      ownerUserId,
      data,
    });

    await new AuditRepository().log({
      orgId: req.user?.orgId ?? null,
      actorUserId: ownerUserId,
      action: 'update',
      entityType: 'patient',
      entityId: id,
      metadata: { fields: Object.keys(data) },
    });

    return res.json(mapPatientToApi(patient, null));
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro ao atualizar paciente:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
}
