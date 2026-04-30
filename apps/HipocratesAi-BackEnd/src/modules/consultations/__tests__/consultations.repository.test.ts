import { mockSupabaseAdmin } from '../../../__tests__/mocks/supabase.mock';
import { ConsultationsRepository } from '../consultations.repository';
import { AppError } from '../../../shared/errors/app-error';
import type { SuggestionsResult } from '../ai/suggestions-detector';

describe('ConsultationsRepository', () => {
  let repo: ConsultationsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ConsultationsRepository();
    mockSupabaseAdmin.schema.mockReturnThis();
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.insert.mockReturnThis();
    mockSupabaseAdmin.update.mockReturnThis();
    mockSupabaseAdmin.delete.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
    mockSupabaseAdmin.neq.mockReturnThis();
    mockSupabaseAdmin.order.mockReturnThis();
    mockSupabaseAdmin.limit.mockReturnThis();
    mockSupabaseAdmin.is.mockReturnThis();
  });

  describe('create', () => {
    it('inserts a row and returns ConsultationRow', async () => {
      const row = { id: 'c-1', org_id: 'org-1', status: 'in_progress' };
      mockSupabaseAdmin.single.mockResolvedValue({ data: row, error: null });

      const result = await repo.create({
        orgId: 'org-1',
        patientId: 'p-1',
        doctorUserId: 'd-1',
        appointmentId: null,
      });

      expect(result).toEqual(row);
      expect(mockSupabaseAdmin.schema).toHaveBeenCalledWith('app');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith(
        'consultation_sessions',
      );
      expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: 'org-1',
          patient_id: 'p-1',
          doctor_user_id: 'd-1',
          status: 'in_progress',
        }),
      );
    });

    it('throws AppError on supabase error', async () => {
      mockSupabaseAdmin.single.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      await expect(
        repo.create({ orgId: 'o', patientId: 'p', doctorUserId: 'd' }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('findById', () => {
    it('returns row when found and filters canceled', async () => {
      const row = { id: 'c-1', status: 'in_progress' };
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: row,
        error: null,
      });

      const result = await repo.findById('c-1');
      expect(result).toEqual(row);
      expect(mockSupabaseAdmin.neq).toHaveBeenCalledWith('status', 'canceled');
    });

    it('returns null when not found', async () => {
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      expect(await repo.findById('x')).toBeNull();
    });
  });

  describe('findByIdForDoctor', () => {
    it('returns row when doctor owns the consultation', async () => {
      const row = { id: 'c-1', doctor_user_id: 'd-1' };
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: row,
        error: null,
      });
      expect(await repo.findByIdForDoctor('c-1', 'd-1')).toEqual(row);
    });

    it('returns null when doctor does not own', async () => {
      const row = { id: 'c-1', doctor_user_id: 'other' };
      mockSupabaseAdmin.maybeSingle.mockResolvedValue({
        data: row,
        error: null,
      });
      expect(await repo.findByIdForDoctor('c-1', 'd-1')).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('calls update with correct shape', async () => {
      Object.assign(mockSupabaseAdmin, { error: null });
      await repo.updateStatus('c-1', 'completed', {
        endedAt: '2026-01-01T00:00:00Z',
        durationSeconds: 60,
        summary: 'ok',
      });
      expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          ended_at: '2026-01-01T00:00:00Z',
          duration_seconds: 60,
          summary: 'ok',
        }),
      );
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('id', 'c-1');
    });
  });

  describe('updateClinicalClassification', () => {
    it('persists macro and micro on consultation session', async () => {
      Object.assign(mockSupabaseAdmin, { error: null });

      await repo.updateClinicalClassification('c-1', {
        macro: 'Cardiovascular',
        micro: 'Angina',
      });

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith(
        'consultation_sessions',
      );
      expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(
        expect.objectContaining({
          clinical_macro: 'Cardiovascular',
          clinical_micro: 'Angina',
        }),
      );
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('id', 'c-1');
    });
  });

  describe('listByPatient', () => {
    it('returns ordered list', async () => {
      const rows = [{ id: 'c-1' }, { id: 'c-2' }];
      // order().limit() resolves — limit returns this which is awaited
      Object.assign(mockSupabaseAdmin, { data: rows, error: null });
      const result = await repo.listByPatient('p-1', 'd-1');
      expect(result).toEqual(rows);
      expect(mockSupabaseAdmin.order).toHaveBeenCalledWith('started_at', {
        ascending: false,
      });
    });
  });

  describe('getPatientForConsultation', () => {
    it('joins consultation + patient into PatientContext', async () => {
      mockSupabaseAdmin.maybeSingle
        .mockResolvedValueOnce({ data: { patient_id: 'p-1' }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'p-1',
            full_name: 'Maria',
            birth_date: '1990-01-01',
            sex: 'female',
            allergies: 'nenhuma',
            current_medications: null,
            chief_complaint: 'dor',
          },
          error: null,
        });

      const result = await repo.getPatientForConsultation('c-1');
      expect(result).toEqual(
        expect.objectContaining({
          name: 'Maria',
          allergies: 'nenhuma',
          mainDiagnosis: 'dor',
        }),
      );
      expect(typeof result?.age).toBe('number');
    });

    it('returns null when consultation not found', async () => {
      mockSupabaseAdmin.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      expect(await repo.getPatientForConsultation('x')).toBeNull();
    });
  });

  describe('saveTranscript', () => {
    it('inserts into consultation_transcripts', async () => {
      Object.assign(mockSupabaseAdmin, { error: null });
      mockSupabaseAdmin.insert.mockReturnValue({ error: null } as never);
      await repo.saveTranscript({
        consultationId: 'c-1',
        text: 'hello',
        speaker: 'doctor',
        isFinal: true,
        timestampMs: 1000,
      });
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith(
        'consultation_transcripts',
      );
      expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          consultation_id: 'c-1',
          text: 'hello',
          is_final: true,
        }),
      );
      mockSupabaseAdmin.insert.mockReturnThis();
    });
  });

  describe('listTranscripts', () => {
    it('returns ordered list', async () => {
      const rows = [{ id: 't-1' }];
      Object.assign(mockSupabaseAdmin, { data: rows, error: null });
      const result = await repo.listTranscripts('c-1');
      expect(result).toEqual(rows);
    });
  });

  describe('saveInsights', () => {
    it('handles InsightInput[] shape', async () => {
      const inserted = [{ id: 'i-1' }];
      mockSupabaseAdmin.select.mockResolvedValueOnce({
        data: inserted,
        error: null,
      } as never);

      const result = await repo.saveInsights('c-1', [
        { kind: 'keypoint', content: 'x' },
      ]);
      expect(result).toEqual(inserted);
      expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith([
        expect.objectContaining({ kind: 'keypoint', content: 'x' }),
      ]);
      mockSupabaseAdmin.select.mockReturnThis();
    });

    it('handles SuggestionsResult shape', async () => {
      const inserted = [{ id: 'i-1' }, { id: 'i-2' }];
      mockSupabaseAdmin.select.mockResolvedValueOnce({
        data: inserted,
        error: null,
      } as never);

      const suggestions: SuggestionsResult = {
        suggestedQuestions: [{ text: 'Q1', rationale: 'r', source: null }],
        clinicalAlerts: [
          { text: 'A1', rationale: 'r', severity: 'warning', source: null },
        ],
        keypoints: [],
        sourceChunks: [],
        empty: false,
      };

      const result = await repo.saveInsights('c-1', suggestions);
      expect(result).toEqual(inserted);
      const call = mockSupabaseAdmin.insert.mock.calls.at(-1)?.[0] as Array<{
        kind: string;
      }>;
      expect(call).toHaveLength(2);
      expect(call[0].kind).toBe('suggested_question');
      expect(call[1].kind).toBe('clinical_alert');
      mockSupabaseAdmin.select.mockReturnThis();
    });

    it('returns [] for empty arrays without hitting DB', async () => {
      const result = await repo.saveInsights('c-1', []);
      expect(result).toEqual([]);
    });
  });

  describe('listInsights', () => {
    it('returns ordered list', async () => {
      const rows = [{ id: 'i-1' }];
      Object.assign(mockSupabaseAdmin, { data: rows, error: null });
      expect(await repo.listInsights('c-1')).toEqual(rows);
    });
  });

  describe('saveEnrichedInsights', () => {
    it('persists clinical_support_enriched rows with evidence metadata', async () => {
      Object.assign(mockSupabaseAdmin, { error: null });
      mockSupabaseAdmin.insert.mockReturnValue({ error: null } as never);

      await repo.saveEnrichedInsights('c-1', {
        macro: 'Cardiovascular',
        micro: 'Angina',
        differential: [
          {
            dx: 'Síndrome coronariana aguda',
            priority: 'alta',
            rationale: 'Dor torácica típica.',
            evidence_chunk_ids: ['chunk-1'],
            support_level: 'evidencia',
          },
        ],
        checklist_questions: [],
        red_flags: [],
        next_steps_suggested: [],
        confidence: 0.82,
        limits: 'Limitado ao corpus.',
      });

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith(
        'consultation_insights',
      );
      expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          kind: 'clinical_support_enriched',
          content: 'Síndrome coronariana aguda',
          support_level: 'evidencia',
          priority: 'alta',
          evidence_chunk_ids: ['chunk-1'],
          confidence: 0.82,
        }),
      ]);
      mockSupabaseAdmin.insert.mockReturnThis();
    });
  });

  describe('acknowledgeInsight', () => {
    it('updates with timestamp + action', async () => {
      Object.assign(mockSupabaseAdmin, { error: null });
      await repo.acknowledgeInsight('i-1', 'useful');
      expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(
        expect.objectContaining({
          acknowledged_action: 'useful',
          acknowledged_at: expect.any(String),
        }),
      );
      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith('id', 'i-1');
    });
  });
});
