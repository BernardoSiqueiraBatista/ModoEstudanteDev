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

---

# 📑 Resumo de Implementação — Hipócrates Paperlab: Laboratório de Estudos (Task 4)

Este documento reúne todas as especificações técnicas, modelagem de banco de dados híbrido, endpoints de API, motor RAG vetorial, OCR em WebAssembly local, e processamento assíncrono desenvolvidos para o módulo **Paperlab: Laboratório de Estudos (Task 4)** no estilo `notebooklm.com`.

---

## 🗄️ 1. Modelagem do Banco de Dados Híbrido

Para suportar o isolamento do monorepo estudante offline-first e buscas vetoriais de alta performance na nuvem, desenhamos uma **arquitetura híbrida** de banco:

### A. Tabelas Locais (PostgreSQL - Docker Local)

Sincronizadas no arquivo mestre `dbSchema.sql` e criadas de forma programática:

#### 1. Tabela `paperlab_sessions`
Armazena os notebooks de estudos dos estudantes.
* **`id`**: `UUID` (PRIMARY KEY, padrão: `gen_random_uuid()`)
* **`id_student`**: `UUID` (NOT NULL, FK referenciando `student(id)` com `ON DELETE CASCADE`)
* **`titulo`**: `TEXT` (NOT NULL, título do notebook. Padrão: `'Untitled notebook'`)
* **`criado_em`**: `TIMESTAMPTZ` (NOT NULL, padrão: `NOW()`)

#### 2. Tabela `paperlab_sources`
Armazena metadados das fontes de estudo carregadas.
* **`id`**: `UUID` (PRIMARY KEY, padrão: `gen_random_uuid()`)
* **`session_id`**: `UUID` (NOT NULL, FK referenciando `paperlab_sessions(id)` com `ON DELETE CASCADE`)
* **`tipo`**: `VARCHAR(20)` (NOT NULL, aceita: `'pdf' | 'docx' | 'image' | 'youtube' | 'link'`)
* **`url_ou_path`**: `TEXT` (NOT NULL, path do arquivo físico local ou URL externa)
* **`titulo`**: `TEXT` (NOT NULL, nome descritivo da fonte)
* **`status`**: `VARCHAR(20)` (NOT NULL, padrão: `'indexing'`, aceita: `'indexing' | 'ready' | 'error'`)
* **`criado_em`**: `TIMESTAMPTZ` (NOT NULL, padrão: `NOW()`)

#### 3. Tabela `paperlab_materials`
Armazena materiais didáticos de estudo gerados pela IA de forma assíncrona.
* **`id`**: `UUID` (PRIMARY KEY, padrão: `gen_random_uuid()`)
* **`session_id`**: `UUID` (NOT NULL, FK referenciando `paperlab_sessions(id)` com `ON DELETE CASCADE`)
* **`tipo`**: `VARCHAR(20)` (NOT NULL, aceita: `'flashcards' | 'resumo' | 'simulado' | 'mapa_mental'`)
* **`prompt`**: `TEXT` (NOT NULL, instrução de geração enviada pelo aluno, suporta serialização JSON de parâmetros extras de cards)
* **`conteudo`**: `JSONB` (NOT NULL, padrão: `'{}'`, conteúdo do material gerado estruturado ou Markdown textual)
* **`status`**: `VARCHAR(20)` (NOT NULL, padrão: `'pending'`, aceita: `'pending' | 'ready' | 'error'`)
* **`criado_em`**: `TIMESTAMPTZ` (NOT NULL, padrão: `NOW()`)

#### 4. Tabela `flashcards`
Armazena os cartões didáticos de memorização gerados pelo laboratório para repetição espaçada (Anki).
* **`id`**: `UUID` (PRIMARY KEY, padrão: `gen_random_uuid()`)
* **`material_id`**: `UUID` (NOT NULL, FK referenciando `paperlab_materials(id)` com `ON DELETE CASCADE`)
* **`frente`**: `TEXT` (NOT NULL, pergunta ou conceito curto de 1 a 5 palavras)
* **`verso`**: `TEXT` (NOT NULL, resposta curta e objetiva)
* **`ultimo_review`**: `TIMESTAMPTZ` (NULL, carimbo da última revisão feita)
* **`proximo_review_em`**: `TIMESTAMPTZ` (NULL, carimbo futuro calculado pelo agendador Anki. Se NULL, indica card novo)
* **`acertos`**: `INT` (NOT NULL, padrão: `0`, contador de revisões bem-sucedidas)
* **`erros`**: `INT` (NOT NULL, padrão: `0`, contador de falhas de memorização)

*Índices Locais de Performance:*
* `idx_paperlab_sessions_student`: Busca rápida de notebooks de cada estudante.
* `idx_paperlab_sources_session`: Otimiza buscas de fontes restritas ao notebook atual.
* `idx_paperlab_materials_session`: Listagem rápida de materiais do notebook.
* `idx_flashcards_material`: Busca de cards vinculados a um material gerado.
* `idx_flashcards_review`: Indice chave para consultar cartões vencidos (`proximo_review_em <= NOW()`).

---

### B. Tabela Vetorial Remota (Supabase Cloud pgvector)

Utilizada para busca vetorial de similaridade semântica de alta performance do RAG:

#### 1. Tabela `source_chunks`
* **`id`**: `UUID` (PRIMARY KEY, padrão: `gen_random_uuid()`)
* **`source_id`**: `UUID` (NOT NULL, id da fonte mapeada localmente no Postgres)
* **`session_id`**: `UUID` (NOT NULL, id do notebook para isolamento da pesquisa)
* **`chunk_text`**: `TEXT` (NOT NULL, bloco fatiado de texto da fonte)
* **`embedding`**: `VECTOR(1536)` (Extensão pgvector, guarda os vetores da OpenAI `text-embedding-3-small`)
* **`ordem`**: `INT` (NOT NULL, indexa a ordem sequencial original do chunk no arquivo)

*Índices Vetoriais:*
* `idx_source_chunks_session`: Otimiza filtragem semântica restrita à sessão do notebook.
* `idx_source_chunks_embedding`: **Índice HNSW** utilizando distância de cosseno (`vector_cosine_ops`) de alta performance no Supabase.

#### 2. Função de Busca RPC `match_chunks`
Função PL/pgSQL registrada no Supabase SQL Editor para consulta vetorial:
```sql
CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_session_id UUID
) RETURNS TABLE (
  id UUID,
  source_id UUID,
  session_id UUID,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    source_chunks.id,
    source_chunks.source_id,
    source_chunks.session_id,
    source_chunks.chunk_text,
    1 - (source_chunks.embedding <=> query_embedding) AS similarity
  FROM source_chunks
  WHERE source_chunks.session_id = p_session_id
    AND 1 - (source_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY source_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 🚀 2. Endpoints da API (Rotas REST)

Prefixos da API: `/student/:id/paperlab`

### 1. Criar Notebook (Sessão)
* **Método:** `POST`
* **Rota:** `/student/:id/paperlab/sessions`
* **Descrição:** Cria uma nova sessão (notebook). O título é opcional; se omitido, o notebook é criado por padrão como `'Untitled notebook'`.
* **Payload de Entrada (JSON Body - Opcional):**
  ```json
  { "titulo": "Anatomia Humana I" }
  ```
* **Códigos de Retorno:** `201 Created` (Retorna JSON com `id`, `id_student`, `titulo`, `criado_em`).

### 2. Listar Notebooks
* **Método:** `GET`
* **Rota:** `/student/:id/paperlab/sessions`
* **Códigos de Retorno:** `200 OK` (Retorna a lista de notebooks do estudante).

### 3. Detalhes de um Notebook
* **Método:** `GET`
* **Rota:** `/student/:id/paperlab/sessions/:sessionId`
* **Descrição:** Retorna os metadados do notebook juntamente com todas as suas fontes carregadas e materiais gerados.
* **Códigos de Retorno:** `200 OK` | `404 Not Found`.

### 4. Adicionar Fonte (Ingestão RAG)
* **Método:** `POST`
* **Rota:** `/student/:id/paperlab/sessions/:sessionId/sources`
* **Descrição:** Faz o upload de um arquivo físico ou envia um link/YouTube. O arquivo físico é interceptado via `multer` e gravado localmente na pasta `uploads/paperlab/` de forma offline-first e resiliente. O processamento vetorial ocorre de forma assíncrona.
* **Body:** `Multipart/Form-Data` (contendo `tipo: 'pdf' | 'docx' | 'image' | 'youtube' | 'link'`, `titulo`, `file` ou `url`).
* **Códigos de Retorno:** `202 Accepted` (Retorna a fonte criada com status `'indexing'`).

### 5. Chat Universal (RAG Semântico)
* **Método:** `POST`
* **Rota:** `/student/:id/paperlab/sessions/:sessionId/chat`
* **Descrição:** Pergunta baseada nas fontes de estudo. O backend gera o embedding da pergunta, pesquisa os 5 chunks mais similares no Supabase através do RPC `match_chunks` restritos ao notebook, envia os trechos ao GPT-4o-mini e formula a resposta final contendo citações e nomes das fontes.
* **Payload de Entrada (JSON Body):**
  ```json
  { "pergunta": "Como ocorre o potencial de ação no miocárdio de acordo com as aulas?" }
  ```
* **Payload de Saída (JSON):**
  ```json
  {
    "resposta": "O potencial de ação no miocárdio inicia com a despolarização rápida... (Markdown rico)",
    "fontesCitadas": ["Aula 1 - Fisiologia.pdf"]
  }
  ```
* **Códigos de Retorno:** `200 OK` | `400 Bad Request`.

### 6. Solicitar Geração de Materiais de Estudo
* **Método:** `POST`
* **Rota:** `/student/:id/paperlab/sessions/:sessionId/materials`
* **Descrição:** Enfileira a geração assíncrona baseada na IA. Suporta parâmetros de personalização premium para flashcards:
* **Payload de Entrada (JSON Body):**
  ```json
  {
    "tipo": "flashcards", // 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental'
    "prompt": "Fisiologia Renal",
    "numeroCards": "menos", // 'menos' (10-15) | 'padrao' (20-30) | 'mais' (40-50)
    "dificuldade": "facil"  // 'facil' | 'medio' | 'dificil'
  }
  ```
* **Lógica de Rate Limit e Ingestão:**
  * O notebook precisa de pelo menos uma fonte ativa (`status = 'ready'`).
  * Não permite gerar duas vezes o mesmo material no mesmo notebook em menos de **6 horas** (retorna `429 Too Many Requests`).
* **Códigos de Retorno:** `202 Accepted` (Material criado com status `'pending'`) | `429 Too Many Requests`.

### 7. Agendamento e Revisão de Flashcard (Anki Scheduler)
* **Método:** `POST`
* **Rota:** `/student/:id/paperlab/materials/:materialId/review`
* **Descrição:** Registra a resposta do estudante na revisão e recalcula a próxima exibição futura:
  * **`resultado = 'acerto'`**: Próxima revisão agendada para dali a **2 dias** (48 horas).
  * **`resultado = 'erro'`**: Cartão bloqueado e agendado para revisão dali a **10 minutos**.
* **Payload de Entrada (JSON Body):**
  ```json
  {
    "cardId": "uuid-do-flashcard",
    "resultado": "acerto" // 'acerto' | 'erro'
  }
  ```
* **Códigos de Retorno:** `200 OK` (Retorna os dados do card com o timestamp `proximo_review_em` atualizado).

---

## 🧠 3. Lógica de Ingestão RAG, OCR em WebAssembly e Fila Worker

### A. Processamento Assíncrono de Arquivos
* **Tesseract.js OCR (WebAssembly):** O motor de OCR roda 100% no Node.js local. Ele carrega a biblioteca compilada em WebAssembly em tempo de execução para extrair o texto de imagens enviadas (PNG, JPG) no idioma português (`por`) sem exigir instalações ou configurações complexas do Tesseract no Windows.
* **pdf-parse:** Lógica que faz a varredura do buffer de PDFs extraindo texto completo de todas as páginas.
* **Fatiador Semântico (Text Chunking):** Fatiador que divide o texto limpo em blocos (chunks) de ~1000 caracteres. Ele usa uma sobreposição (overlap) de 15% (150 caracteres) para garantir que fronteiras de frases ou parágrafos não quebrem o sentido semântico ao serem buscados no RAG.

### B. O Worker Assíncrono em Background (Queue-on-DB)
A classe `paperlab.worker.ts` implementa uma fila baseada em banco de dados local com travas atômicas do Postgres (**`SELECT FOR UPDATE SKIP LOCKED`**). Ela executa de forma segura e concorrente as seguintes tarefas:

#### 1. Ingestão e Embeddings de Fontes
Seleciona fontes `'indexing'`, extrai o texto, fatia em chunks semânticos, gera o embedding na API da OpenAI (`text-embedding-3-small`) usando o serviço de embeddings com circuit breaker e cache consolidado do Hipócrates, insere os chunks na tabela vetorial remota do Supabase e atualiza a fonte para `'ready'`.

#### 2. Renomeação Inteligente de Notebooks (NotebookLM Style)
Se a fonte indexada pertence a um notebook que nasceu sem título (`'Untitled notebook'`), o Worker envia as primeiras 1500 letras do texto extraído para a OpenAI formular um título médico ou acadêmico altamente descritivo e conciso (máximo 4 a 5 palavras), salvando automaticamente no notebook correspondente no Postgres.

#### 3. Geração Personalizada de Materiais de Estudo
Seleciona materiais `'pending'`, faz o retrieve de todos os chunks de texto de fontes daquela sessão no Supabase para concatenar o contexto RAG mestre, e envia para a OpenAI GPT-4o-mini formular os materiais didáticos:
* **Flashcards Personalizados:** O Worker desestrutura a configuração de quantidade de cards (10-15 para menos, 20-30 para padrão, 40-50 para mais) e dificuldade (fácil, médio, difícil). A IA gera o JSON correspondente garantindo que a frente do cartão (pergunta) seja curta (1 a 5 palavras) para favorecer a memorização rápida. O Worker realiza o parser do JSON e grava cada cartão didático individualmente na tabela `flashcards` local, mudando o status para `'ready'`.
* **Resumo:** A IA gera uma síntese executiva linda, acadêmica e estruturada em Markdown de alta legibilidade.
* **Simulado:** Cria um questionário de múltipla escolha ou discursivo com gabarito comentado ao fim em formato Markdown.
* **Mapa Mental ASCII:** Gera ramificações, caixas e diagramação relacional em arte ASCII puro de alta fidelidade visual.

---

## 📂 4. Nova Estrutura de Pastas do Módulo

O módulo foi estruturado e acoplado de forma limpa e modular sob o escopo do estudante:

```text
src/modules/paperlab/
├── __tests__/
│   ├── paperlab.controller.test.ts # Testes de integração HTTP cobrindo rotas
│   └── paperlab.service.test.ts    # Testes unitários do RAG, worker e Anki Scheduler
├── dtos/
│   ├── chat-question.dto.ts        # Validação Zod para perguntas do chat RAG
│   ├── create-material.dto.ts      # Validação Zod para geração de materiais premium
│   ├── create-session.dto.ts       # Validação Zod para notebooks sem título opcionais
│   └── review-card.dto.ts          # Validação Zod para repetição espaçada Anki
├── types/
│   └── paperlab.types.ts           # Tipagens estritas das tabelas locais, vetoriais e logs
├── paperlab.controller.ts          # Controlador das requisições REST da API Express
├── paperlab.model.ts               # Queries SQL do Postgres e SKIP LOCKED para concorrência
├── paperlab.routes.ts              # Roteamento Express, mergindo parâmetros e uploads multer
├── paperlab.service.ts             # Lógica de OCR local, pdf-parse, embeddings, RAG e Anki
└── paperlab.worker.ts              # Fila de segundo plano (Queue-on-DB) e LLM prompts
```

```
