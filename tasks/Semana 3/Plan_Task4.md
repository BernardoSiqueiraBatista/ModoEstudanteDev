# Plano de Implementação — Task 4 — Paperlab: Laboratório de Estudos (Backend)

Este documento descreve o plano detalhado de arquitetura e implementação para o **Paperlab** no back-end. A funcionalidade oferece uma experiência completa no estilo `notebooklm.com`, incluindo chat baseado em fontes (RAG), uploads com OCR e geração de materiais assíncronos (Flashcards/Anki, resumos e mapas mentais em ASCII).

---

## 📐 Decisões de Design Alinhadas

| Decisão | Escolha | Racional |
|---|---|---|
| **Arquitetura de Banco** | **Híbrida (Postgres Local + Supabase)** | Sessões, fontes, materiais e flashcards salvos localmente (coerência com os outros módulos do estudante). Os embeddings vetoriais (`source_chunks` com `pgvector`) salvos no Supabase Cloud (suporte nativo e gratuito à busca por vetor). |
| **Prefixos das Rotas** | **Rotas do Estudante** | Centralizadas sob `/student/:id/paperlab/sessions/...` para manter o isolamento por ID de estudante e consistência com os outros módulos. |
| **OCR de Imagens** | **Tesseract.js (WebAssembly)** | Roda 100% local no Node.js. Excelente precisão, sem a necessidade de instalar binários externos de Tesseract no sistema operacional. |
| **Fila Assíncrona** | **Queue-on-DB (Fila no Postgres)** | Processamento em segundo plano de materiais e fontes via status no banco local (`'pending'`, `'indexing'`). Resiliente a falhas e escalável horizontalmente em produção com travas do Postgres (`SELECT FOR UPDATE SKIP LOCKED`). |
| **Agendamento Anki** | **Filtro de Cards Vencidos (Due)** | O detalhe do material traz todos os cards. A rota ou filtro de estudo (`?only_due=true`) retorna apenas os cartões desbloqueados (`proximo_review_em <= NOW()` ou `IS NULL`). |
| **Rate Limit** | **6h validado no banco** | Impede nova geração se houver registro criado nos últimos 6h. |

---

## 🗄️ Proposed Changes

### 1. Database — Migrations & Schemas

#### [NEW] [008_paperlab.sql](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/migrations/008_paperlab.sql)
Migration a ser aplicada no Postgres Local (via `dbSchema.sql` e Docker):

```sql
-- =============================================================================
-- Migration 008: Hipócrates Paperlab — Laboratório de Estudos
-- Tabelas locais do monorepo estudante
-- =============================================================================

CREATE TABLE paperlab_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_student  UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    titulo      TEXT NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paperlab_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL, -- 'pdf' | 'docx' | 'image' | 'youtube' | 'link'
    url_ou_path     TEXT NOT NULL,
    titulo          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'indexing', -- 'indexing' | 'ready' | 'error'
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paperlab_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL, -- 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental'
    prompt          TEXT NOT NULL,
    conteudo        JSONB NOT NULL DEFAULT '{}', -- Guarda a estrutura final do material
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'ready' | 'error'
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flashcards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id         UUID NOT NULL REFERENCES paperlab_materials(id) ON DELETE CASCADE,
    frente              TEXT NOT NULL,
    verso               TEXT NOT NULL,
    ultimo_review       TIMESTAMPTZ DEFAULT NULL,
    proximo_review_em   TIMESTAMPTZ DEFAULT NULL,
    acertos             INT NOT NULL DEFAULT 0,
    erros               INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_paperlab_sessions_student ON paperlab_sessions(id_student);
CREATE INDEX idx_paperlab_sources_session ON paperlab_sources(session_id);
CREATE INDEX idx_paperlab_materials_session ON paperlab_materials(session_id);
CREATE INDEX idx_flashcards_material ON flashcards(material_id);
CREATE INDEX idx_flashcards_review ON flashcards(proximo_review_em);
```

#### [NEW] [source_chunks (Supabase Table)](file:///C:/Users/joao_/.gemini/antigravity/worktrees/ModoEstudanteDev/hollow-luna-sparks-09h56/apps/HipocratesAi-BackEnd/migrations/008_paperlab_supabase.sql)
Tabela a ser criada no console do Supabase (Cloud) para busca RAG vetorial:

```sql
-- Criar a extensão vector caso não exista
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela no Supabase para busca vetorial
CREATE TABLE source_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id   UUID NOT NULL, -- Mapeia com paperlab_sources(id) local
    session_id  UUID NOT NULL, -- Otimiza buscas RAG restritas ao notebook
    chunk_text  TEXT NOT NULL,
    embedding   VECTOR(1536), -- Vector da OpenAI (text-embedding-3-small)
    ordem       INT NOT NULL
);

CREATE INDEX idx_source_chunks_session ON source_chunks(session_id);
-- Índice HNSW no Supabase para busca de cosseno de alta performance
CREATE INDEX idx_source_chunks_embedding ON source_chunks USING hnsw (embedding vector_cosine_ops);
```

---

### 2. Endpoints Completos da API

Prefixos da API: `/student/:id/paperlab`

| Rota Efetiva | Método | Descrição |
|---|---|---|
| **Sessões (Notebooks)** | | |
| `POST /student/:id/paperlab/sessions` | POST | Cria uma sessão (notebook). |
| `GET /student/:id/paperlab/sessions` | GET | Lista notebooks do estudante. |
| `GET /student/:id/paperlab/sessions/:sessionId` | GET | Detalha notebook (inclui fontes e materiais). |
| `DELETE /student/:id/paperlab/sessions/:sessionId` | DELETE | Exclui o notebook por completo. |
| **Fontes (RAG Ingest)** | | |
| `POST /student/:id/paperlab/sessions/:sessionId/sources` | POST | Adiciona fonte (Multipart para arquivos PDF/Docx/Imagem; JSON para links/YouTube). Envia para indexação e retorna `202 Accepted` com status `'indexing'`. |
| `GET /student/:id/paperlab/sessions/:sessionId/sources` | GET | Lista fontes da sessão e seu status (`'indexing' \| 'ready' \| 'error'`). |
| `DELETE /student/:id/paperlab/sessions/:sessionId/sources/:sourceId` | DELETE | Remove a fonte localmente e deleta os embeddings no Supabase. |
| **Chat Universal (RAG)** | | |
| `POST /student/:id/paperlab/sessions/:sessionId/chat` | POST | Pergunta do chat; busca chunks no Supabase e passa ao GPT-4o-mini (Streaming opcional). |
| `GET /student/:id/paperlab/sessions/:sessionId/chat` | GET | Histórico das mensagens do chat da sessão. |
| **Materiais Gerados** | | |
| `POST /student/:id/paperlab/sessions/:sessionId/materials` | POST | Dispara a geração assíncrona (Flashcards, Resumo, Mapa Mental ASCII). Retorna `202 Accepted` status `'pending'`. Valida Rate Limit de 6h. |
| `GET /student/:id/paperlab/sessions/:sessionId/materials` | GET | Lista materiais e status. |
| `GET /student/:id/paperlab/materials/:materialId` | GET | Visualiza material (filtra por `?only_due=true` no caso de flashcards). |
| `PUT /student/:id/paperlab/materials/:materialId` | PUT | Edita o conteúdo de um material. |
| `DELETE /student/:id/paperlab/materials/:materialId` | DELETE | Exclui um material. |
| `POST /student/:id/paperlab/materials/:materialId/review` | POST | Registra acerto/erro de flashcard e calcula bloqueio (Anki). |

---

### 3. Mecanismo de RAG & IA (Chat & Embeddings)

1. **Ingestão (Upload):**
   * Backend Express lê arquivo.
   * Se for imagem: roda `tesseract.js` (WebAssembly local) e extrai o texto.
   * Se for PDF/DOCX: extrai texto com `pdf-parse`.
   * Se for YouTube: faz raspagem de legenda automática via `youtube-transcript`.
   * **Divisão de Chunks:** Fatiador que divide o texto em blocos de ~1000 caracteres com sobreposição de 15% (evitando quebra de frases).
   * **Geração de Vetor:** Cria o embedding chamando `openai.embeddings.create` com o modelo `text-embedding-3-small` (1536 dimensões).
   * **Salvar:** Grava os registros de chunks e embeddings no Supabase (`source_chunks`).
2. **Chat (Retrieval):**
   * Usuário envia a pergunta.
   * Backend gera o embedding da pergunta com a OpenAI.
   * **Busca Semântica:** Consulta o Supabase no `source_chunks` filtrando pela `session_id` e comparando a distância de cosseno do embedding:
     `SELECT chunk_text FROM source_chunks WHERE session_id = $1 ORDER BY embedding <=> $2 LIMIT 5;`
   * **LLM Prompt:** Concatena os 5 chunks de maior relevância no contexto da conversa e envia para a OpenAI (`gpt-4o-mini`) formular a resposta final citando as fontes.

---

### 4. Fila Assíncrona no Banco de Dados (Queue-on-DB)

Um worker assíncrono em Node.js rodará em background monitorando a base de dados:
* **Indexação de Fontes:** Seleciona fontes com status `'indexing'`, extrai o texto, fatia, gera os embeddings no Supabase e atualiza o status local para `'ready'`.
* **Geração de Materiais:** Seleciona materiais com status `'pending'`, recupera os chunks de fontes daquela sessão, cria o prompt de estruturação da IA (ex: *"Gere 10 flashcards no formato JSON com frente/verso..."*), envia para a OpenAI, processa e valida o JSON, atualiza o material local para `'ready'` e, caso seja flashcards, insere as linhas correspondentes na tabela `flashcards`.

---

## 🧪 Verification Plan

### Automated Tests (Jest)
Desenvolveremos testes unitários e de integração cobrindo:
1. **Fluxo do Scheduler (Anki):** Testar se ao acertar um flashcard ele bloqueia por 2 dias e ao errar por 10 minutos, e se a listagem filtra corretamente usando `?only_due=true`.
2. **Rate Limit 6h:** Testar se tentar gerar dois materiais em menos de 6h retorna `429`.
3. **Mock do RAG e OCR:** Mockar chamadas do `tesseract.js` e do `pgvector` do Supabase para garantir que as rotas rodam perfeitamente nos testes do Jest em memória.

### Manual Verification
* **Script de Testes de Integração:** Criaremos um `test_paperlab_api.js` com um roteiro que bate em todos os novos endpoints do Paperlab simulando ingestão de PDF, pergunta de chat e geração assíncrona.
