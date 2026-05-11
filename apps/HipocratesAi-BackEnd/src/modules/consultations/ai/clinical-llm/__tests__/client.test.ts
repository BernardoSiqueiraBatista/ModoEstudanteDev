import type { AxiosRequestConfig } from 'axios';

type AxiosCreateConfig = AxiosRequestConfig & {
  headers?: Record<string, string>;
};

const mockPost = jest.fn();
// tipagem explícita para evitar TS2556 no spread e TS2493 no acesso por índice
const mockAxiosCreate = jest.fn((_config?: AxiosCreateConfig) => ({
  post: mockPost,
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: (config?: AxiosCreateConfig) => mockAxiosCreate(config),
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
import { postClinicalLlm } from '../client';
import { ClinicalLlmPending } from '../errors';

describe('postClinicalLlm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clinicalLlmBreaker.reset();
  });

  it('does not retry when request is canceled via AbortSignal', async () => {
    const cancelErr = {
      isAxiosError: true,
      __CANCEL__: true,
      message: 'canceled',
    };
    mockPost.mockRejectedValueOnce(cancelErr);

    await expect(
      postClinicalLlm(
        '/clinical_support',
        { text: 'texto' },
        {
          endpointName: 'clinical_support',
          timeoutMs: 15_000,
        },
      ),
    ).rejects.toBeDefined();

    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('maps 409 into ClinicalLlmPending without retrying', async () => {
    mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      message: 'HTTP 409',
      response: {
        status: 409,
        data: { detail: { status: 'PENDING', reason: 'ambíguo' } },
      },
    });

    await expect(
      postClinicalLlm(
        '/classify_macro',
        { text: 'texto ambíguo' },
        {
          endpointName: 'classify_macro',
          timeoutMs: 8000,
        },
      ),
    ).rejects.toBeInstanceOf(ClinicalLlmPending);

    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});

describe('axios instance — X-Internal-Token header', () => {
  // O http instance é criado no topo do módulo client.ts, então precisamos
  // reimportar o módulo após setar/limpar a env var para testar os dois casos.

  afterEach(() => {
    delete process.env.CLINICAL_LLM_INTERNAL_TOKEN;
    jest.resetModules();
  });

  it('includes X-Internal-Token when CLINICAL_LLM_INTERNAL_TOKEN is set', () => {
    process.env.CLINICAL_LLM_INTERNAL_TOKEN = 'test-secret-token';
    mockAxiosCreate.mockClear();

    jest.isolateModules(() => {
      // reimporta env e client para pegar o novo valor da env var
      jest.requireActual('../../../../../config/env');
      jest.requireActual('../client');
    });

    // encontra a chamada ao create que passou o header X-Internal-Token
    const createCallConfig = mockAxiosCreate.mock.calls.find((args) => {
      const cfg = args[0];
      return (cfg?.headers as Record<string, string> | undefined)?.['X-Internal-Token'] !== undefined;
    })?.[0];

    expect(createCallConfig).toBeDefined();
    expect(
      (createCallConfig?.headers as Record<string, string>)['X-Internal-Token'],
    ).toBe('test-secret-token');
  });

  it('does not include X-Internal-Token when CLINICAL_LLM_INTERNAL_TOKEN is empty', () => {
    process.env.CLINICAL_LLM_INTERNAL_TOKEN = '';
    mockAxiosCreate.mockClear();

    jest.isolateModules(() => {
      jest.requireActual('../../../../../config/env');
      jest.requireActual('../client');
    });

    const createCallWithToken = mockAxiosCreate.mock.calls.find((args) => {
      const cfg = args[0];
      return (cfg?.headers as Record<string, string> | undefined)?.['X-Internal-Token'] !== undefined;
    });

    expect(createCallWithToken).toBeUndefined();
  });
});
