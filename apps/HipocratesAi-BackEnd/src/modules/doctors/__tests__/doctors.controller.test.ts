import '../../../__tests__/mocks/supabase.mock';

jest.mock('../../../shared/http/auth-middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'doctor-uuid-1', orgId: 'org-uuid-1' };
    next();
  },
}));

const mockDoctorsRepo = {
  findById: jest.fn(),
  update: jest.fn(),
};

jest.mock('../doctors.repository', () => ({
  DoctorsRepository: jest.fn().mockImplementation(() => mockDoctorsRepo),
}));

import request from 'supertest';
import { app } from '../../../app';

describe('Doctors Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /doctors/me', () => {
    it('returns the current doctor', async () => {
      const doctor = {
        id: 'doctor-uuid-1',
        full_name: 'Dr. House',
        phone: null,
        specialty: 'Diagnóstico',
        crm: '12345',
        created_at: '2026-01-01T00:00:00Z',
      };
      mockDoctorsRepo.findById.mockResolvedValue(doctor);

      const res = await request(app).get('/doctors/me');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(doctor);
      expect(mockDoctorsRepo.findById).toHaveBeenCalledWith('doctor-uuid-1');
    });

    it('returns 404 when doctor not found', async () => {
      mockDoctorsRepo.findById.mockResolvedValue(null);

      const res = await request(app).get('/doctors/me');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /doctors/me', () => {
    it('updates allowed fields', async () => {
      const updated = {
        id: 'doctor-uuid-1',
        full_name: 'Dr. Novo',
        phone: '11999',
        specialty: 'Cardio',
        crm: '999',
        created_at: '2026-01-01T00:00:00Z',
      };
      mockDoctorsRepo.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/doctors/me')
        .send({ full_name: 'Dr. Novo', phone: '11999' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(mockDoctorsRepo.update).toHaveBeenCalledWith(
        'doctor-uuid-1',
        expect.objectContaining({ full_name: 'Dr. Novo', phone: '11999' }),
      );
    });

    it('returns 400 when body has invalid types', async () => {
      const res = await request(app)
        .put('/doctors/me')
        .send({ full_name: 12345 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when body is empty (refine fails)', async () => {
      const res = await request(app).put('/doctors/me').send({});
      expect(res.status).toBe(400);
    });
  });
});
