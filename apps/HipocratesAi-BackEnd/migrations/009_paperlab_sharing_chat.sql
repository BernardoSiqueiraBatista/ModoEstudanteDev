-- =============================================================================
-- Migration 009: Paperlab — Compartilhamento e Histórico de Chat
-- =============================================================================

-- Compartilhamento por LINK PÚBLICO
CREATE TABLE IF NOT EXISTS paperlab_session_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL UNIQUE REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    share_token     UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    visibilidade    VARCHAR(20) NOT NULL DEFAULT 'privado',  -- 'link' | 'privado'
    expira_em       TIMESTAMPTZ DEFAULT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_shares_token ON paperlab_session_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_session_shares_session ON paperlab_session_shares(session_id);

-- Compartilhamento por CONVITE entre estudantes
CREATE TABLE IF NOT EXISTS paperlab_session_collaborators (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    id_student      UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    permissao       VARCHAR(20) NOT NULL DEFAULT 'leitura_chat',  -- 'leitura_chat'
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, id_student)
);

CREATE INDEX IF NOT EXISTS idx_session_collabs_student ON paperlab_session_collaborators(id_student);
CREATE INDEX IF NOT EXISTS idx_session_collabs_session ON paperlab_session_collaborators(session_id);

-- Histórico de Chat persistido
CREATE TABLE IF NOT EXISTS paperlab_chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    id_student      UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL,  -- 'user' | 'assistant'
    content         TEXT NOT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON paperlab_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time ON paperlab_chat_messages(session_id, criado_em DESC);
