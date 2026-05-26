# Backend — Tasks Semana 3
**Módulo:** Elite Clinical AI — Estudante  
**Branch:** `bernardo`  
**Prefixo base:** `/student/v1/` (substituição de `/api/v1/`)

---

## Task 1 — Summary da Pop-up 4/4

### Objetivo
Expor o resumo consolidado de um plano de estudos para ser consumido pela quarta pop-up do fluxo de configuração, sem a parte azul (`render_mode: "popup_no_blue"`).

### Endpoint
| Método | Rota |
|--------|------|
| `GET` | `/student/v1/study-plans/:id/summary` |

### Resposta `200`
```json
{
  "plan_id": "uuid",
  "areas_foco": ["Cardiologia", "Nefrologia"],
  "duracao": "mensal",
  "horas_dia": 4,
  "dias_disponiveis": ["seg", "qua", "sex"],
  "compromissos_fixos": [
    { "dia": "seg", "inicio": "08:00", "fim": "10:00", "label": "Aula" }
  ],
  "briefing_preview": "Foco em ECG e simulados...",
  "render_mode": "popup_no_blue"
}
```

### Arquivos alterados
- `study-plans.model.ts` — método `getPlanSummary()`
- `study-plans.service.ts` — método `getPlanSummary()`
- `study-plans-v1.controller.ts` — handler `getSummary`
- `study-plans-v1.routes.ts` — `GET /:id/summary`

---

## Task 2 — Dashboard / Mapa de Performance

### Objetivo
O backend já existia. As rotas foram **espelhadas** na árvore `/v1/` para seguir o padrão de versionamento sem recriar lógica.

### Endpoints (novos caminhos v1, mesmos controllers)
| Método | Rota |
|--------|------|
| `GET` | `/student/v1/students/:id/dashboard` |
| `GET` | `/student/v1/students/:id/insights` |
| `POST` | `/student/v1/students/:id/insights/regenerate` |

> Os endpoints legados (`/student/:id/dashboard`, `/student/:id/insights/`) continuam funcionando normalmente.

### Arquivos alterados
- `student.routes.ts` — montagem do `v1Router` que reutiliza `dashboardRoutes` e `insightsRoutes`

---

## Task 5 — Pop-ups de Configuração de Plano (Backend)

### Objetivo
Suportar o fluxo de 4 pop-ups: áreas de foco com flag de deficiência (pop-up 1/4), upload de arquivos do ciclo (pop-up 2/4), criação do plano com o novo payload unificado das 4 pop-ups, e regeneração com rate limit de 6h.

### Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/student/v1/students/:id/focus-areas` | Áreas com flag de deficiência e justificativa para pop-up 1/4 |
| `POST` | `/student/v1/study-plans/uploads` | Upload de arquivo do ciclo (PDF, DOCX, imagem) |
| `POST` | `/student/v1/study-plans` | Cria plano com payload das 4 pop-ups, dispara LLM |
| `POST` | `/student/v1/study-plans/:id/regenerate` | Regera cronograma via LLM (rate limit: 1x a cada 6h) |

### Detalhes de cada endpoint

#### `GET /student/v1/students/:id/focus-areas`
Calcula taxa de erro por área (mínimo 3 questões respondidas). Áreas com > 50% de erros são marcadas como `deficiente: true` com justificativa. Inclui até 3 áreas sem dados ainda como sugestão de prioridade.

**Resposta `200`:**
```json
{
  "areas": [
    {
      "nome": "Nefrologia",
      "prioridade": 1,
      "deficiente": true,
      "justificativa": "67% de erros nessa área (4 de 6 questões)"
    },
    { "nome": "Cardiologia", "prioridade": 2, "deficiente": false }
  ]
}
```

#### `POST /student/v1/study-plans/uploads`
Recebe `multipart/form-data` com campo `file` e `student_id`. Tipos aceitos: PDF, DOCX, JPEG, PNG, WEBP. Limite: 20 MB. Salva referência no banco e retorna `upload_id` para usar no payload de criação do plano.

**Resposta `201`:**
```json
{ "upload_id": "uuid", "original_name": "apostila_cardio.pdf" }
```

#### `POST /student/v1/study-plans`
Novo payload unificado (substitui o formato antigo). O título é auto-gerado se não fornecido.

**Request body:**
```json
{
  "student_id": "uuid",
  "areas_foco": ["Nefrologia", "Cardiologia"],
  "duracao": "mensal",
  "instrucoes": "Revisar ECG e simulados, foco em farmacologia",
  "compromissos_fixos": [
    { "dia": "seg", "inicio": "08:00", "fim": "10:00", "label": "Aula" }
  ],
  "horas_dia": 4,
  "considerar_performance": true,
  "uploads": ["upload_id_1"],
  "titulo": "Intensivo Cardiologia",
  "categoria": "especializacao"
}
```

**Resposta `201`:**
```json
{ "plan_id": "uuid", "blocks": [ ... ] }
```

#### `POST /student/v1/study-plans/:id/regenerate`
Re-executa o LLM com os parâmetros originais do plano, apaga os blocos antigos e cria novos. Retorna `429` se a última regeneração foi há menos de 6 horas.

**Resposta `202`:**
```json
{ "plan_id": "uuid", "blocks": [ ... ], "status": "regenerated" }
```

**Resposta `429`:**
```json
{ "status": "rate_limited", "proxima_execucao_permitida_em": "2026-05-26T20:00:00Z" }
```

### Arquivos alterados / criados
- `student-dashboard.model.ts` — `getFocusAreasBySubject()`
- `student-dashboard.service.ts` — `getFocusAreas()` + mapeamento de `question_subject → nome da área`
- `student-dashboard.controller.ts` — `getFocusAreas()`
- `student-dashboard.routes.ts` — `GET /focus-areas`
- `study-plans.model.ts` — `saveUploadRef()`, `getLastRegenerateTime()`, `setLastRegenerateTime()`, `deleteBlocksByPlan()`
- `study-plans.service.ts` — `generateStudyPlanV1()`, `regeneratePlan()`, `saveUpload()`
- `study-plans-v1.controller.ts` — handlers `createPlan`, `regeneratePlan`, `uploadFile`
- `study-plans-v1.routes.ts` — rotas correspondentes
- `study-plans.prompt.ts` — suporte ao campo `label` em `horarios_bloqueados`

---

## Task 6 — Gestão de Planos de Estudo

### Objetivo
CRUD completo de planos com soft delete, edição e compartilhamento via token opaco.

### Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/student/v1/study-plans?student_id=` | Lista planos ativos (exclui deletados) |
| `GET` | `/student/v1/study-plans/:id` | Detalhe do plano + blocos |
| `PUT` | `/student/v1/study-plans/:id` | Edita campos do plano |
| `DELETE` | `/student/v1/study-plans/:id?student_id=` | Soft delete (seta `deleted_at`) |
| `POST` | `/student/v1/study-plans/:id/share` | Gera/renova token de compartilhamento |

### Detalhes

#### `PUT /student/v1/study-plans/:id`
Atualiza somente os campos enviados (PATCH semântico via `COALESCE`).

**Request body:**
```json
{
  "student_id": "uuid",
  "titulo": "Novo título",
  "areas_foco": ["Cardiologia"],
  "duracao": "trimestral",
  "instrucoes": "Novas instruções",
  "compromissos_fixos": [],
  "horas_dia": 5
}
```

#### `DELETE /student/v1/study-plans/:id`
Soft delete: seta `deleted_at = NOW()`. O plano desaparece da listagem mas pode ser recuperado diretamente no banco. Retorna `404` se o plano não pertencer ao `student_id` informado.

#### `POST /student/v1/study-plans/:id/share`
Gera um UUID opaco (`share_token`). Se já existir um share para o plano, renova o token. O `user_id` nunca é exposto na URL pública.

**Resposta `201`:**
```json
{
  "share_token": "uuid",
  "url": "/student/v1/study-plans/shared/uuid",
  "visibilidade": "link",
  "expira_em": null
}
```

### Arquivos alterados / criados
- `study-plans.model.ts` — `softDeletePlan()`, `updatePlan()`, `listPlansFiltered()`, `getPlanByIdAndStudent()`, `createOrUpdateShare()`
- `study-plans.service.ts` — `softDeletePlan()`, `updatePlan()`, `listPlansFiltered()`, `sharePlan()`
- `study-plans-v1.controller.ts` — handlers `listPlans`, `getPlan`, `updatePlan`, `deletePlan`, `sharePlan`
- `study-plans-v1.routes.ts` — rotas correspondentes

---

## Schema do Banco — Alterações

### Colunas adicionadas em `study_plans`
```sql
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMP;
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS ultima_regeneracao TIMESTAMP;
```

### Nova tabela `study_plan_shares`
```sql
CREATE TABLE study_plan_shares (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id      UUID        NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    share_token  UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    visibilidade VARCHAR(20) NOT NULL DEFAULT 'link',
    expira_em    TIMESTAMP,
    criado_em    TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_sps_plan ON study_plan_shares(plan_id);
```

### Nova tabela `study_plan_uploads`
```sql
CREATE TABLE study_plan_uploads (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID        NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    original_name TEXT        NOT NULL,
    tipo          VARCHAR(20) NOT NULL DEFAULT 'pdf',
    criado_em     TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_spu_student ON study_plan_uploads(student_id);
```

---

## Obs: Migração para JWT

Atualmente `student_id` é passado por query param ou body (padrão atual do projeto). Quando o `authMiddleware` for habilitado no módulo de estudante:

1. Adicionar `authMiddleware` no topo de `study-plans-v1.routes.ts` (1 linha)
2. Substituir `String(req.query.student_id)` / `req.body.student_id` por `req.user.id` no controller (10 linhas)
3. Remover `student_id` dos schemas Zod
4. Toda lógica de negócio (service + model + SQL) permanece **inalterada**
