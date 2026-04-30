import type { Response } from 'express';
import type { AuthRequest } from '../../shared/http/auth-request';
import { z } from 'zod';
import { DoctorsRepository } from './doctors.repository';

const updateDoctorSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).nullable().optional(),
  specialty: z.string().max(100).nullable().optional(),
  crm: z.string().max(20).nullable().optional(),
}).refine(data => Object.values(data).some(v => v !== undefined), {
  message: 'Pelo menos um campo deve ser informado.',
});

export async function getMeController(req: AuthRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const repo = new DoctorsRepository();
  const doctor = await repo.findById(userId);

  if (!doctor) {
    return res.status(404).json({ message: 'Perfil de médico não encontrado.' });
  }

  return res.json(doctor);
}

export async function updateMeController(req: AuthRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  const parsed = updateDoctorSchema.parse(req.body);

  const repo = new DoctorsRepository();
  const updated = await repo.update(userId, parsed);

  return res.json(updated);
}
