-- =============================================================================
-- Migration 008: Hipócrates Paperlab (Supabase)
-- Tabela para buscas vetoriais do RAG
-- =============================================================================

-- Criar a extensão vector caso não exista
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela no Supabase para busca vetorial
CREATE TABLE IF NOT EXISTS source_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id   UUID NOT NULL, -- Mapeia com paperlab_sources(id) local
    session_id  UUID NOT NULL, -- Otimiza buscas RAG restritas ao notebook
    chunk_text  TEXT NOT NULL,
    embedding   VECTOR(1536), -- Vector da OpenAI (text-embedding-3-small)
    ordem       INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_source_chunks_session ON source_chunks(session_id);
-- Índice HNSW no Supabase para busca de cosseno de alta performance
CREATE INDEX IF NOT EXISTS idx_source_chunks_embedding ON source_chunks USING hnsw (embedding vector_cosine_ops);


-- Função de banco de dados no Supabase para busca vetorial RAG
CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_session_id UUID
) RETURNS TABLE (
  id UUID,
  source_id UUID,
  session_id UUID,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    source_chunks.id,
    source_chunks.source_id,
    source_chunks.session_id,
    source_chunks.chunk_text,
    1 - (source_chunks.embedding <=> query_embedding) AS similarity
  FROM source_chunks
  WHERE source_chunks.session_id = p_session_id
    AND 1 - (source_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY source_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
