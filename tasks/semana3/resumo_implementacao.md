# 📑 Resumo de Implementação — Hipócrates Paper: My Papers (Semana 3)

Este documento reúne todas as especificações técnicas, modelagem de banco de dados, endpoints de API e lógica de negócio desenvolvidos para a funcionalidade de **Papers (My Papers)** na **Task 3**. Ele serve como um insumo completo para que uma inteligência artificial gere uma documentação técnica ou OpenApi formal das rotas.

---

## 🗄️ 1. Modelagem do Banco de Dados (PostgreSQL)

Foram criadas duas novas tabelas integradas no banco de dados local do Postgres (`postgres-db` do Docker) e sincronizadas no esquema mestre `dbSchema.sql`.

### A. Tabela `papers`
Responsável por armazenar os resumos/anotações médicas (papers) criados pelos estudantes.
* **`id`**: `UUID` (PRIMARY KEY, valor padrão: `gen_random_uuid()`)
* **`id_student`**: `UUID` (NOT NULL, FK referenciando `student(id)` com `ON DELETE CASCADE`)
* **`titulo`**: `TEXT` (NOT NULL, título do paper)
* **`conteudo`**: `TEXT` (NOT NULL, conteúdo do paper)
* **`conteudo_tipo`**: `VARCHAR(20)` (NOT NULL, padrão: `'markdown'`, aceita: `'markdown' | 'richtext' | 'html'`)
* **`tags`**: `JSONB` (NOT NULL, padrão: `'[]'`, armazena lista de strings das tags em formato JSON)
* **`fonte_paperlab_id`**: `UUID` (NULL, ID de origem opcional do laboratório)
* **`status`**: `VARCHAR(20)` (NOT NULL, padrão: `'rascunho'`, aceita: `'rascunho' | 'publicado'`)
* **`deleted_at`**: `TIMESTAMPTZ` (NULL, usado para soft delete. Se preenchido, indica exclusão)
* **`criado_em`**: `TIMESTAMPTZ` (NOT NULL, padrão: `NOW()`)
* **`atualizado_em`**: `TIMESTAMPTZ` (NOT NULL, padrão: `NOW()`)

*Índices de Performance:*
* `idx_papers_student`: Otimiza buscas por estudante.
* `idx_papers_student_active`: Otimiza a listagem de papers ativos do estudante (`WHERE deleted_at IS NULL`).
* `idx_papers_deleted_at`: Otimiza a varredura do cron-job de limpeza sobre papers deletados (`WHERE deleted_at IS NOT NULL`).

### B. Tabela `paper_shares`
Responsável pelo compartilhamento público e anônimo dos papers.
* **`id`**: `UUID` (PRIMARY KEY, valor padrão: `gen_random_uuid()`)
* **`paper_id`**: `UUID` (NOT NULL, **UNIQUE** para suportar a lógica de UPSERT/ON CONFLICT, FK referenciando `papers(id)` com `ON DELETE CASCADE`)
* **`share_token`**: `UUID` (NOT NULL, UNIQUE, valor padrão: `gen_random_uuid()`, token opaco para acesso público)
* **`visibilidade`**: `VARCHAR(20)` (NOT NULL, padrão: `'privado'`, aceita: `'link' | 'privado'`)
* **`expira_em`**: `TIMESTAMPTZ` (NULL, data/hora opcional de expiração do link)
* **`criado_em`**: `TIMESTAMPTZ` (NOT NULL, padrão: `NOW()`)

*Índices de Performance:*
* `idx_paper_shares_token`: Busca ultrarrápida do paper pelo token na rota pública.
* `idx_paper_shares_paper`: Busca rápida da relação por ID do paper.

---

## 🚀 2. Endpoints da API (Rotas REST)

Todas as rotas privadas estão agrupadas sob o prefixo `/student/:id/papers`. Apenas a rota de acesso compartilhado é pública.

### 1. Criar Paper
* **Método:** `POST`
* **Rota:** `/student/:id/papers`
* **Descrição:** Cria um novo paper para o estudante informado na rota.
* **Payload de Entrada (JSON Body):**
  ```json
  {
    "titulo": "Fisiologia Cardiovascular Avançada",
    "conteudo": "# Fisiologia do Coração\nEstudo de contração do miocárdio.",
    "conteudo_tipo": "markdown",
    "tags": ["cardiologia", "fisiologia"],
    "status": "rascunho"
  }
  ```
* **Códigos de Retorno:**
  * `201 Created`: Paper criado com sucesso. Retorna o JSON completo do Paper inserido (incluindo `id`, `criado_em` e `deleted_at`).
  * `400 Bad Request`: Erro de validação Zod (ex: título ausente).

### 2. Listar Papers (Paginado & Filtrado)
* **Método:** `GET`
* **Rota:** `/student/:id/papers`
* **Query Params (Opcionais):**
  * `page` (número, padrão: `1`): Página atual.
  * `size` (número, padrão: `20`, máx: `100`): Quantidade de itens por página.
  * `status` (`'rascunho' | 'publicado'`): Filtra pelo status.
  * `tag` (string): Filtra papers que possuam essa tag específica (usa operador JSONB `@>`).
  * `search` (string): Busca textual insensível a maiúsculas (ILIKE) no título do paper.
* **Descrição:** Retorna a lista de papers ativos (exclui soft deleted) do estudante, omitindo a coluna de conteúdo por motivos de performance na rede.
* **Payload de Saída (JSON):**
  ```json
  {
    "data": [
      {
        "id": "uuid-do-paper",
        "id_student": "uuid-do-estudante",
        "titulo": "Fisiologia Cardiovascular Avançada",
        "conteudo_tipo": "markdown",
        "tags": ["cardiologia", "fisiologia"],
        "fonte_paperlab_id": null,
        "status": "rascunho",
        "criado_em": "2026-05-25T01:00:00Z",
        "atualizado_em": "2026-05-25T01:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 5,
      "total": 1,
      "totalPages": 1
    }
  }
  ```
* **Códigos de Retorno:**
  * `200 OK`: Listagem executada com sucesso.

### 3. Detalhes de um Paper
* **Método:** `GET`
* **Rota:** `/student/:id/papers/:paperId`
* **Descrição:** Retorna os dados completos (incluindo conteúdo) de um paper específico do estudante.
* **Lógica de Segurança:** Se o paper não pertencer ao `studentId` informado na URL ou estiver com soft-delete, a API retorna `404 Not Found` por segurança (evita vazamento de dados de outros alunos).
* **Códigos de Retorno:**
  * `200 OK`: Paper retornado no JSON do corpo.
  * `404 Not Found`: Paper inexistente, deletado ou pertencente a outro estudante.

### 4. Atualizar Paper (Edição Parcial)
* **Método:** `PUT`
* **Rota:** `/student/:id/papers/:paperId`
* **Descrição:** Permite editar parcialmente qualquer campo do paper (Partial Update).
* **Payload de Entrada (JSON Body - Todos os campos opcionais):**
  ```json
  {
    "titulo": "Título Alterado",
    "status": "publicado",
    "tags": ["cardiologia", "novo-exame"]
  }
  ```
* **Lógica de Segurança:** Só permite atualização de papers ativos pertencentes ao estudante da rota.
* **Códigos de Retorno:**
  * `200 OK`: Retorna o JSON do paper com os dados atualizados e o timestamp `atualizado_em` renovado.
  * `400 Bad Request`: Dados de payload inválidos.
  * `404 Not Found`: Paper inexistente ou não pertencente ao estudante.

### 5. Excluir Paper (Soft Delete)
* **Método:** `DELETE`
* **Rota:** `/student/:id/papers/:paperId`
* **Descrição:** Executa a exclusão lógica do paper, definindo a coluna `deleted_at = NOW()`. O recurso deixa de aparecer em listagens e buscas comuns instantaneamente.
* **Códigos de Retorno:**
  * `204 No Content`: Exclusão lógica efetuada com sucesso.
  * `404 Not Found`: Paper inexistente ou pertencente a outro aluno.

### 6. Gerar ou Atualizar Compartilhamento
* **Método:** `POST`
* **Rota:** `/student/:id/papers/:paperId/share`
* **Descrição:** Gera ou renova o link de compartilhamento para o paper. Executa uma query de UPSERT (ON CONFLICT no `paper_id` do Postgres) para reaproveitar o mesmo registro caso um link já tenha sido gerado anteriormente.
* **Payload de Entrada (JSON Body - Opcional):**
  ```json
  {
    "visibilidade": "link", // 'link' | 'privado'
    "expira_em": null // ou data ISO para expiração temporal
  }
  ```
* **Payload de Saída (JSON):**
  ```json
  {
    "share_token": "uuid-do-token-opaco",
    "url": "/papers/shared/uuid-do-token-opaco",
    "visibilidade": "link",
    "expira_em": null
  }
  ```
* **Códigos de Retorno:**
  * `201 Created`: Dados de compartilhamento criados/atualizados com sucesso.
  * `404 Not Found`: Paper inexistente ou pertencente a outro aluno.

### 7. Acesso ao Paper Compartilhado (PÚBLICO)
* **Método:** `GET`
* **Rota:** `/papers/shared/:shareToken`
* **Descrição:** **Rota pública** (não exige qualquer middleware de autenticação JWT ou login) para ler os dados do paper através do token opaco.
* **Lógica de Negócio e Validações:**
  * Verifica se o paper não está excluído (deleted_at IS NULL).
  * Verifica se o link não está marcado como `'privado'`.
  * Valida a expiração temporal: se `expira_em` for menor do que a data atual, nega o acesso.
* **Códigos de Retorno:**
  * `200 OK`: Retorna os dados completos do paper juntamente com o status de visibilidade.
  * `404 Not Found`: Token inválido, inexistente, ou paper associado foi excluído.
  * `410 Gone`: O link de compartilhamento expirou (tempo esgotado).

---

## 🧹 3. Lógica de Limpeza de Lixeira (Cron Job)

* **Localização:** `src/modules/papers/papers.cron.ts`
* **Funcionamento:** O cron job é inicializado no boot da aplicação Express. Ele roda de forma assíncrona a cada **24 horas**.
* **Comportamento:** Executa uma limpeza física (**Hard Delete**) no Postgres, removendo permanentemente todas as linhas da tabela `papers` (e consequentemente os compartilhamentos por cascata) que possuam o campo `deleted_at` com uma data **superior a 30 dias** do momento da verificação.

---

## 📂 4. Estrutura de Pastas Implementada

O módulo foi acoplado seguindo a arquitetura em camadas (Controller, Service, Repository/Model, DTOS e Types) do projeto:

```text
src/modules/papers/
├── __tests__/
│   ├── papers.controller.test.ts  # 19 testes automatizados com supertest
│   └── papers.service.test.ts     # 15 testes automatizados com Jest mocks
├── dtos/
│   ├── create-paper.dto.ts        # Validação Zod para criação
│   ├── list-papers.query.ts       # Validação Zod para paginação/filtros
│   └── update-paper.dto.ts        # Validação Zod para edições parciais
├── types/
│   └── paper.types.ts             # Tipagens estritas de dados da API e DB
├── papers.controller.ts           # Recebimento de requisições e envios HTTP
├── papers.cron.ts                 # Cron job de hard delete de 30 dias
├── papers.model.ts                # SQL Puro / Repository otimizado com pool do pg
├── papers.routes.ts               # Roteamento dos endpoints do estudante
└── papers.service.ts              # Regras de negócio, geração de UUIDs e expirações
```
