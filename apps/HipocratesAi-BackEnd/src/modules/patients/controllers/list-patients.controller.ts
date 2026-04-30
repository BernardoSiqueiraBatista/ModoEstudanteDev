import type { Response } from 'express';
import type { AuthRequest } from '../../../shared/http/auth-request';
import { AppError } from '../../../shared/errors/app-error';
import { PatientsRepository } from '../repositories/patients.repository';
import type { ListPatientsQueryDto } from '../dtos/list-patients.query';

export async function listPatientsController(req: AuthRequest, res: Response) {
  try {
    const ownerUserId = req.user?.id;

    if (!ownerUserId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const validated = (req as AuthRequest & { validatedQuery?: ListPatientsQueryDto })
      .validatedQuery;
    const page = validated?.page ?? Math.max(1, Number(req.query.page) || 1);
    const limit =
      validated?.limit ?? Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = validated?.search ?? (req.query.search as string | undefined);
    const tab =
      validated?.tab ??
      ((req.query.tab as 'all' | 'active' | 'followup' | 'critical') || 'all');

    const repo = new PatientsRepository();
    const { data, total } = await repo.listPaginated({
      ownerUserId,
      page,
      limit,
      search,
      tab,
    });

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro ao listar pacientes:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
}
