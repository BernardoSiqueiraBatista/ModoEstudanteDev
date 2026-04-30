-- =============================================================================
-- Migration 003: Consultations (AI copilot) + RAG function
-- =============================================================================
-- Aplicar via Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Todo o script e rapido (<10s). Nao cria indice vetorial — o indice HNSW
-- em public.medical_chunks.embedding ja existe na infraestrutura existente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELAS DE SESSAO DE CONSULTA AO VIVO
-- -----------------------------------------------------------------------------
-- Nome "consultation_sessions" para nao colidir com a tabela "consultations"
-- pre-existente do hipocrites.AI (que tem schema diferente — pre-consulta via
-- WhatsApp).

CREATE TABLE IF NOT EXISTS app.consultation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  appointment_id uuid REFERENCES app.appointments(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES app.patients(id) NOT NULL,
  doctor_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'canceled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  audio_path text,
  summary text,
  doctor_notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_doctor_status
  ON app.consultation_sessions (doctor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_patient
  ON app.consultation_sessions (patient_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_appointment
  ON app.consultation_sessions (appointment_id);


-- Transcricao em tempo real (utterances finais do ASR)
CREATE TABLE IF NOT EXISTS app.consultation_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES app.consultation_sessions(id) ON DELETE CASCADE,
  text text NOT NULL,
  speaker text,
  is_final boolean NOT NULL DEFAULT true,
  timestamp_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_consultation_time
  ON app.consultation_transcripts (consultation_id, timestamp_ms);


-- Insights gerados pela IA
CREATE TABLE IF NOT EXISTS app.consultation_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES app.consultation_sessions(id) ON DELETE CASCADE,
  kind text NOT NULL
    CHECK (kind IN ('suggested_question', 'clinical_alert', 'keypoint', 'differential', 'exam_suggestion')),
  content text NOT NULL,
  rationale text,
  source_chunks jsonb,
  source_web jsonb,
  severity text
    CHECK (severity IS NULL OR severity IN ('info', 'warning', 'critical')),
  confidence numeric,
  acknowledged_at timestamptz,
  acknowledged_action text
    CHECK (acknowledged_action IS NULL OR acknowledged_action IN ('useful', 'not_useful', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_consultation_created
  ON app.consultation_insights (consultation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_kind
  ON app.consultation_insights (kind);


-- Trigger para manter updated_at em consultation_sessions
CREATE OR REPLACE FUNCTION app.tg_consultation_sessions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consultation_sessions_updated_at ON app.consultation_sessions;
CREATE TRIGGER trg_consultation_sessions_updated_at
  BEFORE UPDATE ON app.consultation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION app.tg_consultation_sessions_updated_at();


-- -----------------------------------------------------------------------------
-- 2. FUNCAO RPC DE BUSCA VETORIAL (nova versao com threshold configuravel)
-- -----------------------------------------------------------------------------
-- A funcao antiga public.match_medical_chunks continua intocada (usada pelo
-- hipocrites.AI). Criamos uma v2 com threshold + count parametrizaveis.

CREATE OR REPLACE FUNCTION public.match_medical_chunks_v2(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.55,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  book_id uuid,
  page_number int,
  chunk_index int,
  capitulo text,
  secao text,
  secao_macro text,
  secao_micro text,
  conteudo text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.book_id,
    mc.page_number,
    mc.chunk_index,
    mc.capitulo,
    mc.secao,
    mc.secao_macro,
    mc.secao_micro,
    mc.conteudo,
    (1 - (mc.embedding <=> query_embedding))::float AS similarity
  FROM public.medical_chunks mc
  WHERE mc.embedding IS NOT NULL
    AND (1 - (mc.embedding <=> query_embedding)) > match_threshold
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_medical_chunks_v2 TO service_role, authenticated;


-- -----------------------------------------------------------------------------
-- 3. VIEW DE CHUNK COM METADATA DO LIVRO (para citacao em insights)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.medical_chunks_with_source AS
SELECT
  mc.id,
  mc.book_id,
  mc.page_number,
  mc.capitulo,
  mc.secao,
  mc.conteudo,
  mc.embedding,
  b.titulo AS book_title,
  b.edicao AS book_edition,
  b.language AS book_language,
  b.source AS book_source
FROM public.medical_chunks mc
LEFT JOIN public.books b ON b.id = mc.book_id;

GRANT SELECT ON public.medical_chunks_with_source TO service_role, authenticated;

-- =============================================================================
-- NOTA: o indice HNSW em public.medical_chunks.embedding
-- (medical_chunks_embedding_hnsw) ja existe na infraestrutura.
-- =============================================================================
