# Task 3 — Hipócrates Paper: My Papers (Backend)

Nova página dedicada aos papers do aluno. CRUD completo com compartilhamento via token opaco, soft delete com limpeza automática, e paginação.

---

## Decisões de Design Alinhadas

| Decisão | Escolha |
|---|---|
| **Banco de dados** | pg Pool direto (schema `public`) |
| **Estrutura de arquivos** | Híbrido escalável (flat + dtos/ + types/) |
| **Soft delete** | `deleted_at TIMESTAMPTZ` + `status` separados |
| **Limpeza automática** | Hard delete após 30 dias via cron job |
| **Roteamento** | Dentro do `studentRouter` (`/:id/papers`) |
| **Tags** | JSONB nativo (`tags JSONB DEFAULT '[]'`) |
| **Conteúdo** | TEXT + flag `conteudo_tipo` (markdown/richtext) |
| **Share token** | UUID v4 opaco via `crypto.randomUUID()` |
| **Paginação** | Offset-based (`?page=&size=`) |
| **Testes** | Jest + supertest |

---

## Proposed Changes

### Database — Migration

#### [NEW] [007_papers.sql](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/migrations/007_papers.sql)

```sql
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
```

> [!NOTE]
> Também atualizar [dbSchema.sql](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/src/config/dbSchema.sql) com as novas tabelas para manter o schema de referência sincronizado.

---

### Módulo Papers — Estrutura de Arquivos

#### Todos os arquivos são [NEW] dentro de `src/modules/papers/`

```
src/modules/papers/
├── __tests__/
│   ├── papers.controller.test.ts
│   └── papers.service.test.ts
├── dtos/
│   ├── create-paper.dto.ts
│   ├── update-paper.dto.ts
│   └── list-papers.query.ts
├── types/
│   └── paper.types.ts
├── papers.routes.ts
├── papers.controller.ts
├── papers.service.ts
└── papers.model.ts
```

---

### Types

#### [NEW] paper.types.ts

```typescript
export interface PaperRow {
  id: string;
  id_student: string;
  titulo: string;
  conteudo: string;
  conteudo_tipo: 'markdown' | 'richtext' | 'html';
  tags: string[];
  fonte_paperlab_id: string | null;
  status: 'rascunho' | 'publicado';
  deleted_at: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface PaperShareRow {
  id: string;
  paper_id: string;
  share_token: string;
  visibilidade: 'link' | 'privado';
  expira_em: string | null;
  criado_em: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}
```

---

### DTOs (Validação Zod)

#### [NEW] create-paper.dto.ts

```typescript
import { z } from 'zod';

export const CreatePaperSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(500),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  conteudo_tipo: z.enum(['markdown', 'richtext', 'html']).default('markdown'),
  tags: z.array(z.string().max(100)).max(50).default([]),
  fonte_paperlab_id: z.string().uuid().nullable().optional(),
  status: z.enum(['rascunho', 'publicado']).default('rascunho'),
});

export type CreatePaperDto = z.infer<typeof CreatePaperSchema>;
```

#### [NEW] update-paper.dto.ts

```typescript
import { z } from 'zod';

export const UpdatePaperSchema = z.object({
  titulo: z.string().min(1).max(500).optional(),
  conteudo: z.string().min(1).optional(),
  conteudo_tipo: z.enum(['markdown', 'richtext', 'html']).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  status: z.enum(['rascunho', 'publicado']).optional(),
});

export type UpdatePaperDto = z.infer<typeof UpdatePaperSchema>;
```

#### [NEW] list-papers.query.ts

```typescript
import { z } from 'zod';

export const ListPapersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['rascunho', 'publicado']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export type ListPapersQuery = z.infer<typeof ListPapersQuerySchema>;
```

---

### Endpoints Completos

| Rota Efetiva | Método | Descrição |
|---|---|---|
| `GET /student/:id/papers` | GET | Lista papers do aluno (paginado, filtros) |
| `POST /student/:id/papers` | POST | Cria um novo paper |
| `GET /student/:id/papers/:paperId` | GET | Detalhe de um paper |
| `PUT /student/:id/papers/:paperId` | PUT | Edita um paper existente |
| `DELETE /student/:id/papers/:paperId` | DELETE | Soft delete de um paper |
| `POST /student/:id/papers/:paperId/share` | POST | Gera/atualiza link de compartilhamento |
| `GET /papers/shared/:shareToken` | GET | **Rota pública** — acessa paper via token |

> [!IMPORTANT]
> A rota `GET /papers/shared/:shareToken` é **pública** (sem auth) e será registrada diretamente no [app.ts](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/src/app.ts), fora do `studentRouter`.

---

### Model (Repository — SQL Puro)

#### [NEW] papers.model.ts

Métodos a implementar:

| Método | SQL | Descrição |
|---|---|---|
| `create(data)` | `INSERT INTO papers (...) VALUES (...) RETURNING *` | Cria paper |
| `findByStudentPaginated(studentId, page, size, filters)` | `SELECT ... WHERE id_student=$1 AND deleted_at IS NULL ... LIMIT/OFFSET` + `COUNT(*)` | Lista paginada |
| `findById(paperId)` | `SELECT * FROM papers WHERE id=$1 AND deleted_at IS NULL` | Detalhe |
| `update(paperId, studentId, data)` | `UPDATE papers SET ... WHERE id=$1 AND id_student=$2 AND deleted_at IS NULL RETURNING *` | Edita |
| `softDelete(paperId, studentId)` | `UPDATE papers SET deleted_at=NOW() WHERE id=$1 AND id_student=$2 RETURNING *` | Soft delete |
| `createOrUpdateShare(paperId)` | `INSERT INTO paper_shares ... ON CONFLICT (paper_id) DO UPDATE ... RETURNING *` | Gera/atualiza share |
| `findByShareToken(token)` | `SELECT p.* FROM papers p JOIN paper_shares ps ON ... WHERE ps.share_token=$1` | Acesso público |
| `hardDeleteExpired()` | `DELETE FROM papers WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'` | Cron job de limpeza |

---

### Service

#### [NEW] papers.service.ts

Responsabilidades:
- Delegar operações ao Model
- Validar regras de negócio (ex: paper pertence ao student, paper não está deletado)
- Montar response de paginação: `{ data, pagination: { page, size, total, totalPages } }`
- Gerar `share_token` via `crypto.randomUUID()` no método de compartilhamento
- Verificar expiração do share token no acesso público

---

### Controller

#### [NEW] papers.controller.ts

Padrão: classe com métodos arrow function (consistente com [StudyPlansController](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/src/modules/study-plans/study-plans.controller.ts)):

```typescript
export class PapersController {
  createPaper = async (req, res, next) => { ... }
  listPapers = async (req, res, next) => { ... }
  getPaper = async (req, res, next) => { ... }
  updatePaper = async (req, res, next) => { ... }
  deletePaper = async (req, res, next) => { ... }
  sharePaper = async (req, res, next) => { ... }
  getSharedPaper = async (req, res, next) => { ... }
}
```

Error handling: `try/catch` com `ZodError → 400`, `AppError → statusCode`, genérico → `next(error)`.

---

### Routes

#### [NEW] papers.routes.ts

```typescript
import { Router } from 'express';
import { PapersController } from './papers.controller';

const papersRoutes = Router({ mergeParams: true });
const controller = new PapersController();

papersRoutes.post('', controller.createPaper);
papersRoutes.get('', controller.listPapers);
papersRoutes.get('/:paperId', controller.getPaper);
papersRoutes.put('/:paperId', controller.updatePaper);
papersRoutes.delete('/:paperId', controller.deletePaper);
papersRoutes.post('/:paperId/share', controller.sharePaper);

export { papersRoutes };
```

---

### Integrações (Modificações em arquivos existentes)

#### [MODIFY] [student.routes.ts](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/src/modules/student/student.routes.ts)

Adicionar **1 linha**:
```diff
+import { papersRoutes } from '../papers/papers.routes';

 studentRouter.use('/:id/study-plan', studyPlansRoutes)
+studentRouter.use('/:id/papers', papersRoutes)
```

#### [MODIFY] [app.ts](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/src/app.ts)

Adicionar rota pública de compartilhamento + cron job:
```diff
+import { PapersController } from './modules/papers/papers.controller';
+import { startPapersCleanupJob } from './modules/papers/papers.cron';

+// Rota pública de compartilhamento de papers (sem auth)
+const papersController = new PapersController();
+app.get('/papers/shared/:shareToken', papersController.getSharedPaper);

+// Cron job: hard delete de papers excluídos há mais de 30 dias
+startPapersCleanupJob();
```

---

### Cron Job de Limpeza

#### [NEW] papers.cron.ts

```typescript
import { PapersModel } from './papers.model';
import { logger } from '../../shared/logger/logger';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
const RETENTION_DAYS = 30;

export function startPapersCleanupJob(): void {
  const model = new PapersModel();

  setInterval(async () => {
    try {
      const deletedCount = await model.hardDeleteExpired(RETENTION_DAYS);
      if (deletedCount > 0) {
        logger.info(`[papers-cleanup] ${deletedCount} papers removidos permanentemente (>30 dias excluídos)`);
      }
    } catch (error) {
      logger.error('[papers-cleanup] Erro na limpeza automática:', error);
    }
  }, CLEANUP_INTERVAL_MS);

  logger.info('[papers-cleanup] Cron job de limpeza iniciado (intervalo: 24h)');
}
```

---

### Responses Esperadas

**GET /student/:id/papers?page=1&size=20**
```json
{
  "data": [
    {
      "id": "uuid",
      "titulo": "Mecanismos da Fisiologia Cardiovascular",
      "conteudo_tipo": "markdown",
      "tags": ["cardiologia", "fisiologia"],
      "status": "publicado",
      "criado_em": "2026-05-22T12:00:00Z",
      "atualizado_em": "2026-05-22T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**POST /student/:id/papers** (201)
```json
{
  "id": "uuid",
  "titulo": "Mecanismos da Fisiologia Cardiovascular",
  "conteudo": "<markdown>",
  "conteudo_tipo": "markdown",
  "tags": ["cardiologia", "fisiologia"],
  "fonte_paperlab_id": null,
  "status": "rascunho",
  "criado_em": "2026-05-22T12:00:00Z",
  "atualizado_em": "2026-05-22T12:00:00Z"
}
```

**POST /student/:id/papers/:paperId/share** (201)
```json
{
  "share_token": "uuid",
  "url": "/papers/shared/{share_token}",
  "visibilidade": "link",
  "expira_em": null
}
```

---

## Verification Plan

### Automated Tests (Jest + supertest)

```bash
cd apps/HipocratesAi-BackEnd
npx jest --config jest.student.config.cjs --testPathPattern=papers
```

Cenários a cobrir:
1. **CRUD básico**: criar, listar, detalhar, editar, deletar paper
2. **Validação Zod**: campos obrigatórios ausentes, tipos incorretos, limites de tamanho
3. **Soft delete**: paper deletado NÃO aparece na listagem
4. **Paginação**: page/size, total correto, totalPages calculado
5. **Compartilhamento**: gerar token, acessar via token, paper privado não acessível
6. **Segurança**: paper de outro student não acessível, share token inválido → 404
7. **Estado vazio**: listagem sem papers retorna `{ data: [], pagination: { total: 0 } }`

### Manual Verification

- Testar endpoints via Postman/Insomnia
- Verificar que o cron job loga a mensagem de inicialização
- Confirmar que as tabelas foram criadas corretamente no banco
- Validar que os outros módulos (questions, study-plans, etc.) continuam funcionando
