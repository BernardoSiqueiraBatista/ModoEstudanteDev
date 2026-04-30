import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';

jest.mock('../../../shared/http/auth-middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'doctor-uuid-1', orgId: 'org-uuid-1' };
    next();
  },
}));

const mockRepo = {
  findByIdForDoctor: jest.fn(),
  listTranscripts: jest.fn(),
  getPatientForConsultation: jest.fn(),
  updateStatus: jest.fn(),
};
jest.mock('../consultations.repository', () => ({
  ConsultationsRepository: jest.fn().mockImplementation(() => mockRepo),
}));

const mockGenerateSummary = jest.fn();
jest.mock('../ai/summary-generator', () => ({
  generateSummary: (...args: unknown[]) => mockGenerateSummary(...args),
}));

jest.mock('../ai/process-text', () => ({
  cleanupSession: jest.fn(),
}));

import request from 'supertest';
import { app } from '../../../app';

const VALID_ID = '550e8400-e29b-41d4-a716-446655440010';

describe('POST /consultations/:id/finish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.update.mockReturnThis();
    mockSupabaseAdmin.eq.mockResolvedValue({ error: null } as never);

    mockRepo.listTranscripts.mockResolvedValue([]);
    mockRepo.getPatientForConsultation.mockResolvedValue(null);
    mockRepo.updateStatus.mockResolvedValue(undefined);
    mockGenerateSummary.mockResolvedValue({
      plainText: 'resumo',
      structured: { subjective: '', objective: '', assessment: '', plan: '', followUp: '' },
    });
  });

  afterEach(() => {
    mockSupabaseAdmin.eq.mockReturnThis();
  });

  it('200 generates summary and updates status', async () => {
    mockRepo.findByIdForDoctor.mockResolvedValue({
      id: VALID_ID,
      status: 'in_progress',
      started_at: new Date(Date.now() - 60_000).toISOString(),
      appointment_id: null,
    });

    const res = await request(app).post(`/consultations/${VALID_ID}/finish`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe('resumo');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      VALID_ID,
      'completed',
      expect.objectContaining({ summary: 'resumo' }),
    );
  });

  it('409 when already completed', async () => {
    mockRepo.findByIdForDoctor.mockResolvedValue({
      id: VALID_ID,
      status: 'completed',
      started_at: new Date().toISOString(),
      appointment_id: null,
    });
    const res = await request(app).post(`/consultations/${VALID_ID}/finish`);
    expect(res.status).toBe(409);
  });

  it('404 when not owner / not found', async () => {
    mockRepo.findByIdForDoctor.mockResolvedValue(null);
    const res = await request(app).post(`/consultations/${VALID_ID}/finish`);
    expect(res.status).toBe(404);
  });

  it('links back to appointment and sets it to done', async () => {
    mockRepo.findByIdForDoctor.mockResolvedValue({
      id: VALID_ID,
      status: 'in_progress',
      started_at: new Date(Date.now() - 60_000).toISOString(),
      appointment_id: 'apt-123',
    });

    const res = await request(app).post(`/consultations/${VALID_ID}/finish`);
    expect(res.status).toBe(200);
    expect(mockSupabaseAdmin.update).toHaveBeenCalledWith({ status: 'done' });
    expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('id', 'apt-123');
  });
});
