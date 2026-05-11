import axios, { AxiosError, AxiosInstance } from 'axios';
import crypto from 'crypto';
import { performance } from 'node:perf_hooks';
import { env } from '../../../../config/env';
import { logger } from '../../../../shared/logger/logger';
import { metrics } from '../../../../shared/metrics/metrics';
import { clinicalLlmBreaker, CircuitOpenError } from '../circuit-breaker';
import { trackClinicalLlmCall } from '../cost-tracker';
import {
  ClinicalLlmError,
  ClinicalLlmInsufficientEvidence,
  ClinicalLlmNoCitations,
  ClinicalLlmPending,
  isClinicalLlmSemanticError,
} from './errors';

type EndpointName =
  | 'classify_macro'
  | 'checklist_question'
  | 'clinical_support';

interface PostOptions {
  endpointName: EndpointName;
  timeoutMs: number;
  consultationId?: string;
  signal?: AbortSignal;
}

const RETRY_DELAYS_MS = [300, 600] as const;

const http: AxiosInstance = axios.create({
  baseURL: env.CLINICAL_LLM_URL,
  headers: {
    'content-type': 'application/json',
    ...(env.CLINICAL_LLM_INTERNAL_TOKEN
      ? { 'X-Internal-Token': env.CLINICAL_LLM_INTERNAL_TOKEN }
      : {}),
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function textFingerprint(body: unknown): {
  textLength?: number;
  textHash?: string;
} {
  if (!body || typeof body !== 'object') return {};
  const text = (body as { text?: unknown }).text;
  if (typeof text !== 'string') return {};
  return {
    textLength: text.length,
    textHash: crypto
      .createHash('sha256')
      .update(text)
      .digest('hex')
      .slice(0, 12),
  };
}

function detailObject(data: unknown): Record<string, unknown> | undefined {
  const detail =
    data && typeof data === 'object'
      ? (data as { detail?: unknown }).detail
      : undefined;
  if (detail && typeof detail === 'object')
    return detail as Record<string, unknown>;
  if (typeof detail === 'string') return { message: detail };
  return undefined;
}

function normalizeAxiosError(err: AxiosError): Error {
  const status = err.response?.status;
  const detail = detailObject(err.response?.data);
  const semantic = detail?.error;

  if (status === 409) return new ClinicalLlmPending(detail);
  if (status === 422 && semantic === 'INSUFFICIENT_EVIDENCE') {
    return new ClinicalLlmInsufficientEvidence(detail);
  }
  if (status === 422 && semantic === 'NO_CITATIONS') {
    return new ClinicalLlmNoCitations(detail);
  }

  return new ClinicalLlmError(
    err.message,
    status,
    detail ?? err.response?.data,
  );
}

function shouldRetry(err: unknown): boolean {
  if (isClinicalLlmSemanticError(err)) return false;
  if (axios.isCancel(err)) return false;
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  return !status || status >= 500;
}

function breakerGaugeValue(): number {
  const state = clinicalLlmBreaker.getState();
  if (state === 'closed') return 0;
  if (state === 'half_open') return 0.5;
  return 1;
}

function metricErrorKind(err: unknown): string {
  if (err instanceof ClinicalLlmInsufficientEvidence) return 'insufficient_evidence';
  if (err instanceof ClinicalLlmNoCitations) return 'no_citations';
  if (err instanceof ClinicalLlmPending) return 'pending';
  if (err instanceof CircuitOpenError) return 'circuit_open';
  if (err instanceof ClinicalLlmError) {
    if (err.statusCode && err.statusCode >= 500) return '5xx';
    if (!err.statusCode) return 'timeout';
  }
  return 'failed';
}

export async function postClinicalLlm<TReq, TResp>(
  path: `/${EndpointName}`,
  body: TReq,
  opts: PostOptions,
): Promise<TResp> {
  const stage = `clinical_llm.${opts.endpointName}`;
  const start = performance.now();

  try {
    const result = await clinicalLlmBreaker.execute(async () => {
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
          const response = await http.post<TResp>(path, body, {
            timeout: opts.timeoutMs,
            signal: opts.signal,
          });
          return response.data;
        } catch (err) {
          const normalized = axios.isAxiosError(err)
            ? normalizeAxiosError(err)
            : err;
          if (!shouldRetry(err) || attempt >= RETRY_DELAYS_MS.length) {
            throw normalized;
          }
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
      throw new ClinicalLlmError('Clinical LLM retry loop exhausted');
    });

    metrics.record(`${stage}.duration_ms`, performance.now() - start);
    metrics.setGauge('clinical_llm.breaker.state', breakerGaugeValue());
    trackClinicalLlmCall(opts.consultationId);
    logger.info(
      {
        consultationId: opts.consultationId,
        endpoint: opts.endpointName,
        duration_ms: Math.round(performance.now() - start),
        ...textFingerprint(body),
      },
      'clinical-llm call succeeded',
    );
    return result;
  } catch (err) {
    metrics.record(`${stage}.duration_ms`, performance.now() - start);
    metrics.increment(`${stage}.error.${metricErrorKind(err)}`);
    metrics.setGauge('clinical_llm.breaker.state', breakerGaugeValue());
    logger.warn(
      {
        err,
        consultationId: opts.consultationId,
        endpoint: opts.endpointName,
        duration_ms: Math.round(performance.now() - start),
        ...textFingerprint(body),
      },
      'clinical-llm call failed',
    );
    throw err;
  }
}
