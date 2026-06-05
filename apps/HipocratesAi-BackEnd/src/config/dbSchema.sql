CREATE TABLE question (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text    TEXT NOT NULL,
    image_url        TEXT,
    question_level   INT NOT NULL CHECK (question_level BETWEEN 1 AND 3),
    question_subject INT NOT NULL CHECK (question_subject BETWEEN 0 AND 10)
);


CREATE TABLE alternative (
    id UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    id_question UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    alternative_text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL,
    order_index INT NOT NULL,

    UNIQUE (order_index, id_question)
);
CREATE INDEX idx_alternative_question ON alternative(id_question);


CREATE TABLE student (                         -- Trocar gen_random_uuid pela referência do user id quando integrar com o banco geral no supabase
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(), --REFERENCES User(id) ON DELETE CASCADE, fk para user(id)
    study_time        INTERVAL NOT NULL DEFAULT INTERVAL '0'
);


CREATE TABLE performance (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    id_question    UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    correct_answer BOOLEAN NOT NULL,

    UNIQUE (id_student, id_question)
);
CREATE INDEX idx_performance_student ON performance(id_student);
CREATE INDEX idx_performance_question ON performance(id_question);


CREATE TABLE performance_insights (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student    UUID        NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    gerado_em     TIMESTAMP   NOT NULL DEFAULT NOW(),
    versao_prompt VARCHAR(64) NOT NULL DEFAULT 'v1',
    pontos_fortes  JSONB      NOT NULL DEFAULT '[]',
    pontos_atencao JSONB      NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_pi_student_date ON performance_insights (id_student, gerado_em DESC);


CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    duracao VARCHAR(20) NOT NULL,
    areas_foco JSONB NOT NULL DEFAULT '[]',
    parametros JSONB NOT NULL DEFAULT '{}',
    briefing_texto TEXT,
    base_conhecimento_ref TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sp_student ON study_plans(id_student);


CREATE TABLE study_plan_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_plan UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo TEXT NOT NULL,
    especialidade VARCHAR(100),
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_spb_plan ON study_plan_blocks(id_plan);
CREATE INDEX idx_spb_date ON study_plan_blocks(data);


-- Task 5/6: soft delete + rate-limit de regeneração
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS ultima_regeneracao TIMESTAMP;


-- Task 6: compartilhamento de planos (token opaco, sem expor user_id)
CREATE TABLE IF NOT EXISTS study_plan_shares (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id       UUID        NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    share_token   UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    visibilidade  VARCHAR(20) NOT NULL DEFAULT 'link',
    expira_em     TIMESTAMP,
    criado_em     TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sps_plan ON study_plan_shares(plan_id);


-- Task 5: uploads de referência vinculados a um ciclo de plano
CREATE TABLE IF NOT EXISTS study_plan_uploads (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID        NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    original_name TEXT        NOT NULL,
    tipo          VARCHAR(20) NOT NULL DEFAULT 'pdf',
    criado_em     TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spu_student ON study_plan_uploads(student_id);


-- =============================================================================
-- Task 3 — Hipócrates Paper
-- =============================================================================

CREATE TABLE papers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student          UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    titulo              TEXT NOT NULL,
    conteudo            TEXT NOT NULL,
    conteudo_tipo       VARCHAR(20) NOT NULL DEFAULT 'markdown',
    tags                JSONB NOT NULL DEFAULT '[]',
    fonte_paperlab_id   UUID DEFAULT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'rascunho',
    deleted_at          TIMESTAMPTZ DEFAULT NULL,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_papers_student ON papers(id_student);
CREATE INDEX idx_papers_student_active ON papers(id_student) WHERE deleted_at IS NULL;
CREATE INDEX idx_papers_deleted_at ON papers(deleted_at) WHERE deleted_at IS NOT NULL;


CREATE TABLE paper_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL UNIQUE REFERENCES papers(id) ON DELETE CASCADE,
    share_token     UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    visibilidade    VARCHAR(20) NOT NULL DEFAULT 'privado',
    expira_em       TIMESTAMPTZ DEFAULT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_paper_shares_token ON paper_shares(share_token);
CREATE INDEX idx_paper_shares_paper ON paper_shares(paper_id);


-- =============================================================================
-- Task 4 — Hipócrates Paperlab
-- =============================================================================

CREATE TABLE paperlab_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student  UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    titulo      TEXT NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paperlab_sources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    tipo        VARCHAR(20) NOT NULL, -- 'pdf' | 'docx' | 'image' | 'youtube' | 'link'
    url_ou_path TEXT NOT NULL,
    titulo      TEXT NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'indexing', -- 'indexing' | 'ready' | 'error'
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paperlab_materials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    tipo        VARCHAR(20) NOT NULL, -- 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental'
    prompt      TEXT NOT NULL,
    conteudo    JSONB NOT NULL DEFAULT '{}',
    status      VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'ready' | 'error'
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flashcards (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id       UUID NOT NULL REFERENCES paperlab_materials(id) ON DELETE CASCADE,
    frente            TEXT NOT NULL,
    verso             TEXT NOT NULL,
    ultimo_review     TIMESTAMPTZ DEFAULT NULL,
    proximo_review_em TIMESTAMPTZ DEFAULT NULL,
    acertos           INT NOT NULL DEFAULT 0,
    erros             INT NOT NULL DEFAULT 0
);

-- Compartilhamento por LINK PÚBLICO
CREATE TABLE paperlab_session_shares (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL UNIQUE REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    share_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    visibilidade VARCHAR(20) NOT NULL DEFAULT 'privado', -- 'link' | 'privado'
    expira_em   TIMESTAMPTZ DEFAULT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compartilhamento por CONVITE entre estudantes
CREATE TABLE paperlab_session_collaborators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    id_student  UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    permissao   VARCHAR(20) NOT NULL DEFAULT 'leitura_chat',
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, id_student)
);

-- Histórico de Chat persistido
CREATE TABLE paperlab_chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    id_student  UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL, -- 'user' | 'assistant'
    content     TEXT NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paperlab_sessions_student      ON paperlab_sessions(id_student);
CREATE INDEX idx_paperlab_sources_session       ON paperlab_sources(session_id);
CREATE INDEX idx_paperlab_materials_session     ON paperlab_materials(session_id);
CREATE INDEX idx_flashcards_material            ON flashcards(material_id);
CREATE INDEX idx_flashcards_review              ON flashcards(proximo_review_em);
CREATE INDEX idx_session_shares_token           ON paperlab_session_shares(share_token);
CREATE INDEX idx_session_shares_session         ON paperlab_session_shares(session_id);
CREATE INDEX idx_session_collabs_student        ON paperlab_session_collaborators(id_student);
CREATE INDEX idx_session_collabs_session        ON paperlab_session_collaborators(session_id);
CREATE INDEX idx_chat_messages_session          ON paperlab_chat_messages(session_id);
CREATE INDEX idx_chat_messages_session_time     ON paperlab_chat_messages(session_id, criado_em DESC);

-- =============================================================================
-- Task 4 — Horários Bloqueados / Compromissos Fixos
-- =============================================================================

CREATE TABLE IF NOT EXISTS study_plan_fixed_commitments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_plan         UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    dia             VARCHAR(3) NOT NULL CHECK (dia IN ('seg','ter','qua','qui','sex','sab','dom')),
    inicio          TIME NOT NULL,
    fim             TIME NOT NULL,
    label           TEXT,
    tipo            VARCHAR(30) NOT NULL DEFAULT 'compromisso_fixo',
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_fim_gt_inicio CHECK (fim > inicio)
);

CREATE INDEX IF NOT EXISTS idx_fixed_commitments_plan ON study_plan_fixed_commitments(id_plan);
CREATE INDEX IF NOT EXISTS idx_fixed_commitments_plan_dia ON study_plan_fixed_commitments(id_plan, dia);


-- =============================================================================
-- Task 7 — Hipócrates Cases · Pop-up e Tela de Consulta
-- =============================================================================

CREATE TABLE IF NOT EXISTS cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo              TEXT NOT NULL,
    descricao           TEXT NOT NULL,
    especialidade       VARCHAR(100) NOT NULL,
    dificuldade         VARCHAR(20) NOT NULL DEFAULT 'media'
                        CHECK (dificuldade IN ('facil', 'media', 'dificil')),
    payload_mock        JSONB NOT NULL DEFAULT '{}',
    tempo_estimado_min  INT DEFAULT 20,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_especialidade ON cases(especialidade);
CREATE INDEX IF NOT EXISTS idx_cases_dificuldade   ON cases(dificuldade);


CREATE TABLE IF NOT EXISTS case_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    modo            VARCHAR(10) NOT NULL CHECK (modo IN ('hm', 'osce')),
    pontuacao       INT,
    acertos         INT DEFAULT 0,
    erros           INT DEFAULT 0,
    tempo_segundos  INT,
    status          VARCHAR(20) NOT NULL DEFAULT 'em_andamento'
                    CHECK (status IN ('em_andamento', 'finalizado', 'abandonado')),
    iniciado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizado_em   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_case_attempts_user   ON case_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_case_attempts_case   ON case_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_case_attempts_status ON case_attempts(status);


CREATE TABLE IF NOT EXISTS case_attempt_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      UUID NOT NULL REFERENCES case_attempts(id) ON DELETE CASCADE,
    tipo            VARCHAR(50) NOT NULL
                    CHECK (tipo IN ('procedimento_correto', 'erro', 'omissao')),
    ref             VARCHAR(200) NOT NULL,
    pontos          INT NOT NULL DEFAULT 0,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_events_attempt      ON case_attempt_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_case_events_attempt_time  ON case_attempt_events(attempt_id, criado_em DESC);
