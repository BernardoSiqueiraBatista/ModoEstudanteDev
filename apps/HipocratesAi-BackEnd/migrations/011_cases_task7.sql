-- =============================================================================
-- Task 7 — Hipócrates Cases · Pop-up e Tela de Consulta
-- =============================================================================

-- Tabela de casos clínicos (IF NOT EXISTS — pode já existir via Task 6)
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


-- Tabela de tentativas de caso (IF NOT EXISTS — pode já existir via Task 6)
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


-- NOVA tabela: eventos OSCE persistidos para auditoria e feedback final
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
