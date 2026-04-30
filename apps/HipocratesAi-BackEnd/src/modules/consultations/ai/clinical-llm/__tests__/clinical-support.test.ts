const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ post: mockPost })),
    isAxiosError: (err: unknown) =>
      Boolean((err as { isAxiosError?: boolean })?.isAxiosError),
    isCancel: (err: unknown) =>
      Boolean((err as { __CANCEL__?: boolean })?.__CANCEL__),
  },
  isAxiosError: (err: unknown) =>
    Boolean((err as { isAxiosError?: boolean })?.isAxiosError),
  isCancel: (err: unknown) =>
    Boolean((err as { __CANCEL__?: boolean })?.__CANCEL__),
}));

jest.mock('../../../../../shared/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { clinicalLlmBreaker } from '../../circuit-breaker';
import {
  ClinicalLlmInsufficientEvidence,
  ClinicalLlmNoCitations,
} from '../errors';
import { clinicalSupport } from '../clinical-support';

function axiosError(status: number, detail: unknown): unknown {
  return {
    isAxiosError: true,
    message: `HTTP ${status}`,
    response: { status, data: { detail } },
  };
}

describe('clinicalSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clinicalLlmBreaker.reset();
  });

  it('maps 422 INSUFFICIENT_EVIDENCE into semantic error', async () => {
    mockPost.mockRejectedValueOnce(
      axiosError(422, {
        error: 'INSUFFICIENT_EVIDENCE',
        top_score: 0.31,
        min_required: 0.55,
        message: 'Evidência insuficiente.',
      }),
    );

    await expect(
      clinicalSupport('texto curto', { consultationId: 'c-1' }),
    ).rejects.toBeInstanceOf(ClinicalLlmInsufficientEvidence);
  });

  it('maps 422 NO_CITATIONS into semantic error', async () => {
    mockPost.mockRejectedValueOnce(
      axiosError(422, {
        error: 'NO_CITATIONS',
        message: 'Sem fonte para citar.',
      }),
    );

    await expect(
      clinicalSupport('dor torácica', { consultationId: 'c-1' }),
    ).rejects.toBeInstanceOf(ClinicalLlmNoCitations);
  });
});
