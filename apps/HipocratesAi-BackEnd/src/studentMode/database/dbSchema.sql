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

CREATE TABLE student (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(), --REFERENCES User(id) ON DELETE CASCADE,
    study_time        INTERVAL NOT NULL DEFAULT INTERVAL '0'
    --id_achievement  UUID REFERENCES achievement(id) ON DELETE SET NULL,
);

CREATE TABLE performance (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    id_question    UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    correct_answer BOOLEAN NOT NULL,

    UNIQUE (id_student, id_question)
);

CREATE INDEX idx_alternative_question ON alternative(id_question);
CREATE INDEX idx_performance_student ON performance(id_student);
CREATE INDEX idx_performance_question ON performance(id_question);

/*
CREATE TABLE achievement (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    generalInfo     TEXT,
    achievementDate DATE NOT NULL DEFAULT CURRENT_DATE
);
*/
