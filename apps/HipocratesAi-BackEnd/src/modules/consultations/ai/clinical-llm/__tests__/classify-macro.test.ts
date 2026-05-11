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
import { classifyMacro } from '../classify-macro';

describe('classifyMacro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clinicalLlmBreaker.reset();
  });

  it('posts typed payload to /classify_macro and returns response', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        final: 'Cardiovascular',
        status: 'DECIDED',
        top3: [{ macro: 'Cardiovascular', score: 0.91 }],
        reason: 'dor torácica',
      },
    });

    const result = await classifyMacro('paciente relata dor torácica', {
      consultationId: 'c-1',
      allowedMacro: ['Cardiovascular'],
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/classify_macro',
      {
        text: 'paciente relata dor torácica',
        allowed_macro: ['Cardiovascular'],
      },
      { timeout: 8000 },
    );
    expect(result.status).toBe('DECIDED');
    expect(result.final).toBe('Cardiovascular');
  });
});
