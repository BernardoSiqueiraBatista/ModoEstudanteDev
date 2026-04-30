import type { Request, Response } from 'express';
import { supabaseAdmin } from '../../infra/supabase/supabase-admin';
import { logger } from '../../shared/logger/logger';
import { env } from '../../config/env';
import { openaiChatBreaker } from '../consultations/ai/circuit-breaker';

type CheckStatus = 'ok' | 'fail' | 'degraded';

interface Check {
  status: CheckStatus;
  latency?: number;
  error?: string;
  note?: string;
}

async function checkSupabase(): Promise<Check> {
  const t0 = Date.now();
  try {
    const { error } = await supabaseAdmin.schema('app').from('patients').select('id').limit(1);
    if (error) throw error;
    return { status: 'ok', latency: Date.now() - t0 };
  } catch (err) {
    return { status: 'fail', latency: Date.now() - t0, error: (err as Error).message };
  }
}

async function checkOpenAI(): Promise<Check> {
  const state = (openaiChatBreaker as any).state ?? 'CLOSED';
  if (state === 'OPEN') return { status: 'degraded', note: 'circuit open' };
  if (!env.OPENAI_API_KEY) return { status: 'fail', error: 'missing_key' };
  return { status: 'ok', note: `breaker=${state}` };
}

async function checkDeepgram(): Promise<Check> {
  if (!env.DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY.length < 10) {
    return { status: 'fail', error: 'missing_key' };
  }
  return { status: 'ok', note: 'key present' };
}

export async function healthCheckController(_req: Request, res: Response) {
  const started = Date.now();
  const [supabase, openai, deepgram] = await Promise.all([
    checkSupabase(),
    checkOpenAI(),
    checkDeepgram(),
  ]);

  const checks = { supabase, openai, deepgram };
  const hasFail = Object.values(checks).some((c) => c.status === 'fail');
  const hasDegraded = Object.values(checks).some((c) => c.status === 'degraded');
  const overall: CheckStatus = hasFail ? 'fail' : hasDegraded ? 'degraded' : 'ok';

  if (hasFail) {
    logger.error({ checks }, 'health check degraded');
  }

  res.status(hasFail ? 503 : 200).json({
    status: overall,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    latency: Date.now() - started,
    checks,
  });
}
