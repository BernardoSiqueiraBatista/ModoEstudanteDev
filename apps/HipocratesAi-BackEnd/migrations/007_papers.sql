-- =============================================================================
-- Migration 007: Hipócrates Paper — My Papers
-- Tabelas: papers, paper_shares
-- Schema: public (pg Pool direto — módulos estudante)
-- =============================================================================

CREATE TABLE papers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student          UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    titulo              TEXT NOT NULL,
    conteudo            TEXT NOT NULL,
    conteudo_tipo       VARCHAR(20) NOT NULL DEFAULT 'markdown',  -- 'markdown' | 'richtext' | 'html'
    tags                JSONB NOT NULL DEFAULT '[]',
    fonte_paperlab_id   UUID DEFAULT NULL,  -- FK será adicionada quando tabela paperlab existir
    status              VARCHAR(20) NOT NULL DEFAULT 'rascunho',  -- 'rascunho' | 'publicado'
    deleted_at          TIMESTAMPTZ DEFAULT NULL,  -- NULL = ativo; preenchido = soft deleted
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_papers_student ON papers(id_student);
CREATE INDEX idx_papers_student_active ON papers(id_student) WHERE deleted_at IS NULL;
CREATE INDEX idx_papers_deleted_at ON papers(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TABLE paper_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    share_token     UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    visibilidade    VARCHAR(20) NOT NULL DEFAULT 'privado',  -- 'link' | 'privado'
    expira_em       TIMESTAMPTZ DEFAULT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paper_shares_token ON paper_shares(share_token);
CREATE INDEX idx_paper_shares_paper ON paper_shares(paper_id);
