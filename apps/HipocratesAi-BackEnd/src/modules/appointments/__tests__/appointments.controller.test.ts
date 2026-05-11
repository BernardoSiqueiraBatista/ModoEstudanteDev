import '../../../__tests__/mocks/supabase.mock';

// Mock the auth middleware to inject a fake user
jest.mock('../../../shared/http/auth-middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'doctor-uuid-1', orgId: 'org-uuid-1' };
    next();
  },
}));

// Mock AppointmentsRepository
const mockRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findConflicts: jest.fn(),
  listByDate: jest.fn(),
  updateStatus: jest.fn(),
  listByWeek: jest.fn(),
};

jest.mock('../appointments.repository', () => ({
  AppointmentsRepository: jest.fn().mockImplementation(() => mockRepo),
}));

// Mock PatientsRepository
const mockPatientsRepo = {
  findById: jest.fn(),
};

jest.mock('../../patients/repositories/patients.repository', () => ({
  PatientsRepository: jest.fn().mockImplementation(() => mockPatientsRepo),
}));

// Mock DoctorsRepository
const mockDoctorsRepo = {
  findById: jest.fn(),
};

jest.mock('../../doctors/doctors.repository', () => ({
  DoctorsRepository: jest.fn().mockImplementation(() => mockDoctorsRepo),
}));

import request from 'supertest';
import { app } from '../../../app';

describe('Appointments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /appointments', () => {
    it('returns 201 with valid data', async () => {
      const appointmentData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        doctorUserId: '550e8400-e29b-41d4-a716-446655440001',
        startAt: '2026-04-10T09:00:00-03:00',
        endAt: '2026-04-10T10:00:00-03:00',
        source: 'manual',
        type: 'consulta',
      };

      mockPatientsRepo.findById.mockResolvedValue({ id: appointmentData.patientId });
      mockDoctorsRepo.findById.mockResolvedValue({ id: appointmentData.doctorUserId });
      mockRepo.findConflicts.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 'apt-1',
        ...appointmentData,
        status: 'scheduled',
      });

      const res = await request(app).post('/appointments').send(appointmentData);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('apt-1');
    });

    it('returns 400 with invalid data (missing required fields)', async () => {
      const res = await request(app).post('/appointments').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /appointments', () => {
    it('returns list for doctor', async () => {
      const appointments = [
        { id: 'apt-1', doctor_user_id: 'doctor-uuid-1', status: 'scheduled' },
        { id: 'apt-2', doctor_user_id: 'doctor-uuid-1', status: 'done' },
      ];

      mockRepo.listByDate.mockResolvedValue(appointments);

      const res = await request(app).get('/appointments').query({
        date: '2026-04-10',
        doctorUserId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('returns 400 when date format is invalid', async () => {
      const res = await request(app).get('/appointments').query({
        date: 'invalid-date',
      });

      expect(res.status).toBe(400);
    });
  });
});
