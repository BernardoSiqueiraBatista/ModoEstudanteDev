import { Response } from 'express';
import type { AuthRequest } from '../../shared/http/auth-request';
import {
  createAppointmentSchema,
  getAppointmentByIdSchema,
  listAppointmentsQuerySchema,
  listWeeklyQuerySchema,
  updateAppointmentStatusSchema,
} from './appointments.dto';
import { AppointmentsService } from './appointments.service';

export class AppointmentsController {
  constructor(private readonly appointmentsService = new AppointmentsService()) {}

  create = async (req: AuthRequest, res: Response) => {
    const body = createAppointmentSchema.parse(req.body);
    const result = await this.appointmentsService.create(body);
    return res.status(201).json(result);
  };

  getById = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const params = getAppointmentByIdSchema.parse(req.params);
    const result = await this.appointmentsService.getById(params.id, userId);
    return res.json(result);
  };

  list = async (req: AuthRequest, res: Response) => {
    const validated = (req as AuthRequest & { validatedQuery?: unknown }).validatedQuery;
    const query = validated
      ? (validated as ReturnType<typeof listAppointmentsQuerySchema.parse>)
      : listAppointmentsQuerySchema.parse(req.query);
    const result = await this.appointmentsService.list(query);
    return res.json(result);
  };

  updateStatus = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const params = getAppointmentByIdSchema.parse(req.params);
    const body = updateAppointmentStatusSchema.parse(req.body);
    const result = await this.appointmentsService.updateStatus(params.id, body, userId);
    return res.json(result);
  };

  listWeekly = async (req: AuthRequest, res: Response) => {
    const validated = (req as AuthRequest & { validatedQuery?: unknown }).validatedQuery;
    const query = validated
      ? (validated as ReturnType<typeof listWeeklyQuerySchema.parse>)
      : listWeeklyQuerySchema.parse(req.query);
    const result = await this.appointmentsService.listWeekly(query);
    return res.json(result);
  };
}
