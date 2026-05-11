import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';

jest.mock('../../../shared/http/auth-middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'doctor-uuid-1', orgId: 'org-uuid-1' };
    next();
  },
}));

const mockRepo = {
  create: jest.fn(),
};
jest.mock('../consultations.repository', () => ({
  ConsultationsRepository: jest.fn().mockImplementation(() => mockRepo),
}));

const mockAuditLog = jest.fn().mockResolvedValue(undefined);
jest.mock('../../audit/audit.repository', () => ({
  AuditRepository: jest.fn().mockImplementation(() => ({ log: mockAuditLog })),
}));

import request from 'supertest';
import { app } from '../../../app';

const VALID_PATIENT = '550e8400-e29b-41d4-a716-446655440000';
const VALID_APPT = '550e8400-e29b-41d4-a716-446655440001';

describe('POST /consultations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
  });

  it('returns 201 with valid walk-in body (no appointmentId)', async () => {
    mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
      data: { id: VALID_PATIENT, org_id: 'org-uuid-1' },
      error: null,
    });
    mockRepo.create.mockResolvedValue({ id: 'c-1', status: 'in_progress' });

    const res = await request(app)
      .post('/consultations')
      .send({ patientId: VALID_PATIENT });

    expect(res.status).toBe(201);
    expect(res.body.consultation.id).toBe('c-1');
    expect(res.body.wsUrls.audio).toBe('/ws/consultations/c-1/audio');
    expect(res.body.wsUrls.state).toBe('/ws/consultations/c-1/state');
  });

  it('returns 201 with valid appointment-linked body', async () => {
    mockSupabaseAdmin.maybeSingle
      .mockResolvedValueOnce({
        data: { id: VALID_PATIENT, org_id: 'org-uuid-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: VALID_APPT, doctor_user_id: 'doctor-uuid-1', status: 'scheduled' },
        error: null,
      });
    mockRepo.create.mockResolvedValue({ id: 'c-2', status: 'in_progress' });

    const res = await request(app)
      .post('/consultations')
      .send({ patientId: VALID_PATIENT, appointmentId: VALID_APPT });

    expect(res.status).toBe(201);
    expect(res.body.consultation.id).toBe('c-2');
  });

  it('returns 400 when patientId is invalid UUID', async () => {
    const res = await request(app)
      .post('/consultations')
      .send({ patientId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when patient not found', async () => {
    mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await request(app)
      .post('/consultations')
      .send({ patientId: VALID_PATIENT });
    expect(res.status).toBe(404);
  });

  it('returns 403 when patient belongs to a different org', async () => {
    mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
      data: { id: VALID_PATIENT, org_id: 'other-org' },
      error: null,
    });
    const res = await request(app)
      .post('/consultations')
      .send({ patientId: VALID_PATIENT });
    expect(res.status).toBe(403);
  });

  it('returns 409 when linked appointment is not scheduled', async () => {
    mockSupabaseAdmin.maybeSingle
      .mockResolvedValueOnce({
        data: { id: VALID_PATIENT, org_id: 'org-uuid-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: VALID_APPT, doctor_user_id: 'doctor-uuid-1', status: 'done' },
        error: null,
      });

    const res = await request(app)
      .post('/consultations')
      .send({ patientId: VALID_PATIENT, appointmentId: VALID_APPT });
    expect(res.status).toBe(409);
  });

  it('returns wsUrls in body on success', async () => {
    mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
      data: { id: VALID_PATIENT, org_id: 'org-uuid-1' },
      error: null,
    });
    mockRepo.create.mockResolvedValue({ id: 'c-3', status: 'in_progress' });

    const res = await request(app)
      .post('/consultations')
      .send({ patientId: VALID_PATIENT });

    expect(res.body.wsUrls).toEqual({
      audio: '/ws/consultations/c-3/audio',
      state: '/ws/consultations/c-3/state',
    });
  });
});
