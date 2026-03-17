import { AppError } from "../../shared/errors/AppError";
import { PatientsRepository } from "../patients/repositories/patients.repository";
import { DoctorsRepository } from "../doctors/doctors.repository";
import {
  CreateAppointmentDto,
  ListAppointmentsQueryDto,
  UpdateAppointmentStatusDto,
} from "./appointments.dto";
import { AppointmentsRepository } from "./appointments.repository";

export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository = new AppointmentsRepository(),
    private readonly patientsRepository = new PatientsRepository(),
    private readonly doctorsRepository = new DoctorsRepository()
  ) {}

  async create(data: CreateAppointmentDto) {
    const patient = await this.patientsRepository.findById(data.patientId);
    if (!patient) {
      throw new AppError("Paciente não encontrado.", 404);
    }

    const doctor = await this.doctorsRepository.findById(data.doctorUserId);
    if (!doctor) {
      throw new AppError("Médico não encontrado.", 404);
    }

    const hasConflict = await this.appointmentsRepository.findConflicts({
      doctorUserId: data.doctorUserId,
      startAt: data.startAt,
      endAt: data.endAt,
    });

    if (hasConflict) {
      throw new AppError(
        "Já existe um agendamento nesse intervalo para esse médico.",
        409
      );
    }

    return this.appointmentsRepository.create({
      orgId: data.orgId ?? null,
      patientId: data.patientId,
      doctorUserId: data.doctorUserId,
      startAt: data.startAt,
      endAt: data.endAt,
      source: data.source,
      externalEventId: data.externalEventId ?? null,
    });
  }

  async getById(id: string) {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new AppError("Agendamento não encontrado.", 404);
    }

    return appointment;
  }

  async list(query: ListAppointmentsQueryDto) {
    if (!query.orgId && !query.doctorUserId) {
      throw new AppError(
        "Informe orgId ou doctorUserId para listar a agenda.",
        400
      );
    }

    return this.appointmentsRepository.listByDate({
      date: query.date,
      orgId: query.orgId,
      doctorUserId: query.doctorUserId,
    });
  }

  async updateStatus(id: string, data: UpdateAppointmentStatusDto) {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new AppError("Agendamento não encontrado.", 404);
    }

    const updated = await this.appointmentsRepository.updateStatus(id, data.status);

    if (!updated) {
      throw new AppError("Não foi possível atualizar o status.", 500);
    }

    return updated;
  }
}