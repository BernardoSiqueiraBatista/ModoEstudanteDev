-- Task 4: Horários Bloqueados / Compromissos Fixos
-- Cria tabela dedicada para compromissos fixos vinculados a planos de estudo,
-- substituindo o armazenamento anterior em JSONB (study_plans.parametros).

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
