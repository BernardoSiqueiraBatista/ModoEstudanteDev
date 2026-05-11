import { Response } from 'express';
import type { AuthRequest } from '../../shared/http/auth-request';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private readonly service = new DashboardService()) {}

  getStats = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const stats = await this.service.getStats(userId);
    return res.json(stats);
  };
}
