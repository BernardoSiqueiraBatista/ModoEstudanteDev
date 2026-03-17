import { Request, Response } from 'express';
import {
  createAppointmentSchema,
  getAppointmentByIdSchema,
  listAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
} from './appointments.dto';
import { AppointmentsService } from './appointments.service';

export class AppointmentsController {
  constructor(private readonly appointmentsService = new AppointmentsService()) {}

  create = async (req: Request, res: Response) => {
    const body = createAppointmentSchema.parse(req.body);
    const result = await this.appointmentsService.create(body);
    return res.status(201).json(result);
  };

  getById = async (req: Request, res: Response) => {
    const params = getAppointmentByIdSchema.parse(req.params);
    const result = await this.appointmentsService.getById(params.id);
    return res.json(result);
  };

  list = async (req: Request, res: Response) => {
    const query = listAppointmentsQuerySchema.parse(req.query);
    const result = await this.appointmentsService.list(query);
    return res.json(result);
  };

  updateStatus = async (req: Request, res: Response) => {
    const params = getAppointmentByIdSchema.parse(req.params);
    const body = updateAppointmentStatusSchema.parse(req.body);
    const result = await this.appointmentsService.updateStatus(params.id, body);
    return res.json(result);
  };
}