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
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(), --REFERENCES User(id) ON DELETE CASCADE,
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
