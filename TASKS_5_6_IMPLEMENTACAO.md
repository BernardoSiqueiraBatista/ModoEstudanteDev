# Tasks 5 e 6 — Implementação Backend (Contrato 4)

## Visão Geral

Implementação das Tasks 5 e 6 do ciclo de retrabalhos Elite Clinical AI no backend Node/Express/PostgreSQL. Nenhuma rota `/api` existia — o projeto já usa `/student` como prefixo base.

---

## Task 5 — Visualização Diária do Plano de Estudos

### O que foi feito

Adicionados 4 novos endpoints ao router `study-plans-v1` (prefixo `/student/v1/study-plans`):

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/daily` | Retorna blocos do dia + compromissos fixos ativos |
| `GET` | `/:id/compromissos-fixos` | Lista compromissos fixos de um plano |
| `PATCH` | `/:id/compromissos-fixos/:idx` | Atualiza um compromisso fixo pelo índice |
| `DELETE` | `/:id/compromissos-fixos/:idx` | Remove um compromisso fixo pelo índice |

### Endpoint principal: `GET /student/v1/study-plans/daily`

**Query params:**
- `student_id` (obrigatório) — UUID do aluno
- `date` (obrigatório) — data no formato `YYYY-MM-DD`
- `types` (opcional) — tipos separados por vírgula: `revisao,simulado,teoria,caso_clinico,aula,compromisso_fixo`
- `search` (opcional) — busca por título (case-insensitive)

**Resposta:**
```json
{
  "data": "2024-01-15",
  "total": 5,
  "blocks": [...],          // study_plan_blocks do dia (com filtros aplicados no banco)
  "compromissos_fixos": [...] // horários bloqueados que se aplicam ao dia da semana
}
```

**Lógica de compromissos fixos:** O dia da semana é inferido a partir da `date` passada. Os compromissos fixos ficam no campo `parametros.compromissos_fixos` (JSONB) de cada plano. O backend mapeia o dia da semana em português para todos os aliases (`segunda`, `seg`, `mon`, etc.) e filtra os que se aplicam àquele dia.

### CRUD de Compromissos Fixos (Task 4 integrada)

O `DELETE /:id/compromissos-fixos/:idx` retorna `{ compromissos_fixos: [...], regenerar_disponivel: true }`, sinalizando ao frontend que pode oferecer a opção de regerar o cronograma. A regeneração em si é feita pelo endpoint já existente `POST /:id/regenerate`.

### Arquivos modificados
- `src/modules/study-plans/study-plans.model.ts` — métodos `getDailyBlocks`, `getFixedCommitments`, `updateFixedCommitment`, `deleteFixedCommitment`
- `src/modules/study-plans/study-plans.service.ts` — métodos correspondentes com lógica de negócio
- `src/modules/study-plans/study-plans-v1.controller.ts` — handlers `getDailyView`, `listFixedCommitments`, `updateFixedCommitment`, `deleteFixedCommitment`
- `src/modules/study-plans/study-plans-v1.routes.ts` — 4 novas rotas registradas

---

## Task 6 — Hipócrates Cases Dashboard

### O que foi feito

Criado módulo completo `cases` e registrado em `/student/cases`.

### Tabelas criadas no banco

**`hipocretes_cases`** — catálogo de casos clínicos
```
id, titulo, especialidade, descricao, dificuldade (facil/medio/dificil),
paciente_nome, queixa_principal, contexto, status (disponivel/em_breve), criado_em
```

**`case_attempts`** — tentativas dos alunos
```
id, case_id, student_id, modo (hm/osce), status (em_andamento/concluido/abandonado),
pontuacao, acertos, erros, duracao_segundos, iniciado_em, concluido_em
```

### Dados mockados

8 casos clínicos inseridos no `dbSchema.sql`, cobrindo: Cardiologia (2), Pneumologia (2), Endocrinologia (1), Cirurgia Geral (1), Neurologia (1), Nefrologia (1).

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/student/cases` | Lista casos disponíveis |
| `GET` | `/student/cases/metrics?student_id=` | Métricas do dashboard |
| `GET` | `/student/cases/:id` | Detalhe de um caso |
| `POST` | `/student/cases/:id/attempts` | Inicia uma tentativa (HM ou OSCE) |
| `PATCH` | `/student/cases/:id/attempts/:attemptId/finish` | Finaliza uma tentativa |

### Métricas retornadas em `/student/cases/metrics`
```json
{
  "total_resolvidos": 12,
  "assertividade_media": 78.5,
  "tempo_medio_segundos": 1240,
  "distribuicao_especialidade": [
    { "especialidade": "Cardiologia", "total": 5 }
  ],
  "evolucao": {
    "periodo_atual": 4,
    "periodo_anterior": 3,
    "delta": 33
  }
}
```

Filtros suportados no `GET /student/cases`:
- `especialidade` — filtro exato
- `dificuldade` — `facil`, `medio`, `dificil`
- `search` — busca por título ou queixa principal

### Arquivos criados
- `src/modules/cases/cases.model.ts`
- `src/modules/cases/cases.service.ts`
- `src/modules/cases/cases.controller.ts`
- `src/modules/cases/cases.routes.ts`

### Arquivos modificados
- `src/modules/student/student.routes.ts` — import e registro de `casesRouter` em `/cases`
- `src/config/dbSchema.sql` — tabelas + índices + mocks

---

## Observações Gerais

- Todas as rotas já usam `/student` como prefixo — nenhuma mudança de `/api` para `/student` foi necessária (o projeto já seguia esse padrão).
- TypeScript compilou sem erros após as alterações (`tsc --noEmit` limpo).
- Os filtros de `daily` são aplicados no banco (não no cliente), conforme a infra definida no escopo.
- O módulo `cases` está preparado para suportar a Task 7 (attempts com modo HM/OSCE), sendo necessário apenas adicionar a tabela `case_attempt_events` quando essa task for desenvolvida.
