import { z } from 'zod';
import { supabase } from './supabase';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:3333';

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiOptions<T> = Omit<RequestInit, 'body'> & {
  body?: unknown;
  schema?: z.ZodType<T>;
  /** Skip Authorization header (for public endpoints). */
  skipAuth?: boolean;
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T = unknown>(path: string, opts: ApiOptions<T> = {}): Promise<T> {
  const { body, schema, skipAuth, headers: rawHeaders, ...rest } = opts;
  const headers = new Headers(rawHeaders);

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
      payload = body as BodyInit;
    } else {
      payload = JSON.stringify(body);
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...rest, headers, body: payload });

  if (response.status === 401) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new HttpError(401, 'Sessão expirada. Faça login novamente.', 'UNAUTHENTICATED');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody && typeof errorBody === 'object' && 'message' in errorBody
        ? String((errorBody as { message: unknown }).message)
        : null) ?? `Erro HTTP ${response.status}`;
    const code =
      errorBody && typeof errorBody === 'object' && 'code' in errorBody
        ? String((errorBody as { code: unknown }).code)
        : undefined;
    throw new HttpError(response.status, message, code, errorBody);
  }

  if (response.status === 204) return undefined as T;

  const json = (await response.json()) as unknown;
  return schema ? schema.parse(json) : (json as T);
}

export const httpClient = {
  get: <T>(path: string, opts?: ApiOptions<T>) => api<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: ApiOptions<T>) =>
    api<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: ApiOptions<T>) =>
    api<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions<T>) =>
    api<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: ApiOptions<T>) => api<T>(path, { ...opts, method: 'DELETE' }),
};
