import type { Response } from 'express';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { AppError } from '../../../shared/errors/app-error';
import { PatientsRepository } from '../repositories/patients.repository';
import { AuditRepository } from '../../audit/audit.repository';

export async function deletePatientController(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const ownerUserId = req.user?.id;

    if (!ownerUserId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const repo = new PatientsRepository();
    const patient = await repo.findById(id);

    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }

    if (patient.doctor_id !== ownerUserId) {
      return res.status(403).json({ message: 'Sem permissão para excluir este paciente.' });
    }

    await repo.delete(id);

    await new AuditRepository().log({
      orgId: req.user?.orgId ?? null,
      actorUserId: ownerUserId,
      action: 'delete',
      entityType: 'patient',
      entityId: id,
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro ao excluir paciente:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
}
