import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),

  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),

  TZ_OFFSET: process.env.TZ_OFFSET || '-03:00',

  // Set to "true" AFTER applying migrations/002_soft_delete_and_audit.sql
  ENABLE_SOFT_DELETE: process.env.ENABLE_SOFT_DELETE === 'true',
  ENABLE_AUDIT_LOG: process.env.ENABLE_AUDIT_LOG === 'true',

  // ==========================================================================
  // AI copilot (consultations module)
  // Set ENABLE_CONSULTATIONS=true after applying migration 003
  // ==========================================================================
  ENABLE_CONSULTATIONS: process.env.ENABLE_CONSULTATIONS === 'true',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_EMBEDDING_MODEL:
    process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  OPENAI_SUMMARY_MODEL: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',

  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || '',
  DEEPGRAM_MODEL: process.env.DEEPGRAM_MODEL || 'nova-2',
  DEEPGRAM_LANGUAGE: process.env.DEEPGRAM_LANGUAGE || 'pt-BR',

  // RAG tuning
  RAG_MATCH_THRESHOLD: Number(process.env.RAG_MATCH_THRESHOLD || 0.7),
  RAG_MATCH_COUNT: Number(process.env.RAG_MATCH_COUNT || 3),
  RAG_WEB_FALLBACK_THRESHOLD: Number(
    process.env.RAG_WEB_FALLBACK_THRESHOLD || 0.7,
  ),

  // Cost/throttle guards for the AI pipeline
  INSIGHTS_DEBOUNCE_MS: Number(process.env.INSIGHTS_DEBOUNCE_MS || 1500),
  INSIGHTS_THROTTLE_MS: Number(process.env.INSIGHTS_THROTTLE_MS || 800),
  INSIGHTS_MAX_CALLS_PER_MINUTE: Number(
    process.env.INSIGHTS_MAX_CALLS_PER_MINUTE || 30,
  ),

  // Clinical LLM subservice (FastAPI).
  // Default OFF — só ativa se ENABLE_CLINICAL_LLM=true explicitamente.
  // Isso garante que containers sem a var definida não disparam chamadas
  // ao FastAPI (que causariam ruído de erro até o circuit breaker abrir).
  CLINICAL_LLM_URL: process.env.CLINICAL_LLM_URL || 'http://127.0.0.1:8010',
  ENABLE_CLINICAL_LLM: process.env.ENABLE_CLINICAL_LLM === 'true',

  // Shared secret entre backend TS e FastAPI clinical-llm.
  // Em dev, deixe vazio — o FastAPI aceita requisições sem validação.
  // Em prod, gere com: openssl rand -hex 32
  CLINICAL_LLM_INTERNAL_TOKEN: process.env.CLINICAL_LLM_INTERNAL_TOKEN || '',

  METRICS_TOKEN: process.env.METRICS_TOKEN || '',

  // Integração WhatsApp (hipocrites.AI gateway)
  WHATSAPP_GATEWAY_URL: process.env.WHATSAPP_GATEWAY_URL || '',
  WHATSAPP_GATEWAY_TOKEN: process.env.WHATSAPP_GATEWAY_TOKEN || '',

  // Fallback / robustez
  OPENAI_FALLBACK_MODEL: process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo',
  OPENAI_MAX_INPUT_TOKENS: Number(process.env.OPENAI_MAX_INPUT_TOKENS || 16000),
};
