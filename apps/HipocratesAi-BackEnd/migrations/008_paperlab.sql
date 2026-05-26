-- =============================================================================
-- Migration 008: Hipócrates Paperlab — Laboratório de Estudos
-- Tabelas locais do monorepo estudante
-- =============================================================================

CREATE TABLE IF NOT EXISTS paperlab_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student  UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    titulo      TEXT NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paperlab_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL, -- 'pdf' | 'docx' | 'image' | 'youtube' | 'link'
    url_ou_path     TEXT NOT NULL,
    titulo          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'indexing', -- 'indexing' | 'ready' | 'error'
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paperlab_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL, -- 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental'
    prompt          TEXT NOT NULL,
    conteudo        JSONB NOT NULL DEFAULT '{}', -- Guarda a estrutura final do material
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'ready' | 'error'
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id         UUID NOT NULL REFERENCES paperlab_materials(id) ON DELETE CASCADE,
    frente              TEXT NOT NULL,
    verso               TEXT NOT NULL,
    ultimo_review       TIMESTAMPTZ DEFAULT NULL,
    proximo_review_em   TIMESTAMPTZ DEFAULT NULL,
    acertos             INT NOT NULL DEFAULT 0,
    erros               INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_paperlab_sessions_student ON paperlab_sessions(id_student);
CREATE INDEX IF NOT EXISTS idx_paperlab_sources_session ON paperlab_sources(session_id);
CREATE INDEX IF NOT EXISTS idx_paperlab_materials_session ON paperlab_materials(session_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_material ON flashcards(material_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_review ON flashcards(proximo_review_em);
