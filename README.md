# HipócratesAi

Plataforma médica que transcreve e analisa consultas em tempo real, oferecendo suporte cognitivo ao médico durante o atendimento — transcrição streaming via WebSocket, raciocínio clínico assistido por IA, alertas (red flags), hipóteses diagnósticas e geração de prescrição/condutas.

> Monorepo pnpm com frontend React + backend Node/Python + contratos compartilhados em TypeScript.

---

## Sumário
- [Stack](#stack)
- [Estrutura do monorepo](#estrutura-do-monorepo)
- [Guia de instalação](#guia-de-instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Fluxos principais](#fluxos-principais)
- [Contrato de mensagens WS](#contrato-de-mensagens-ws)
- [Convenções](#convenções)
- [Troubleshooting](#troubleshooting)

---

## Stack

### Frontend (`apps/HipocratesAi-Front`)
- **React 19** + **Vite 7** + **TypeScript 5.9**
- **TailwindCSS 4** (`@tailwindcss/postcss`) + CSS modular em `src/styles`
- **React Router 7** (rotas)
- **TanStack Query 5** (data-fetching, cache server-state)
- **Zod** (validação de mensagens WS e responses HTTP)
- **Supabase JS** (auth — sessão via JWT)

### Backend (`apps/HipocratesAi-BackEnd`)
- **Node.js (Fastify)** — REST + WebSocket (`/ws/consultations/:id/state` e `/audio`)
- **Python services** (workers de NLP/insights, LLM clínico, importação de arquivos)
- **PostgreSQL** + **Supabase**
- **Deepgram** (ASR streaming, PCM16 mono 16 kHz)
- **Docker** + `docker-compose.yml`

### Contratos (`packages/contracts`)
- **TypeScript + Zod** — schemas compartilhados de mensagens WS, rows do banco e payloads HTTP. Publicado como `@hipo/contracts` workspace.

---

## Estrutura do monorepo

```
.
├── apps
│   ├── HipocratesAi-Front          # SPA (Vite + React)
│   │   └── src
│   │       ├── auth                # Supabase session + AuthProvider
│   │       ├── components          # UI (consulta, paciente, comuns)
│   │       ├── hooks               # useConsultationStream, useConsultations…
│   │       ├── layouts             # MainLayout
│   │       ├── lib                 # wsClient, audioRecorder, supabase
│   │       ├── mappers             # Insights → ViewModel
│   │       ├── router              # rotas React Router
│   │       ├── service             # cliente HTTP
│   │       ├── styles              # tailwind + glass-effects
│   │       └── views               # páginas
│   └── HipocratesAi-BackEnd        # Fastify + workers Python
│       ├── src                     # código TS
│       ├── python_services         # workers (clinical_import, clinical_llm)
│       ├── migrations              # SQL migrations
│       └── scripts                 # utilitários
├── packages
│   └── contracts                   # @hipo/contracts (Zod + types)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Guia de instalação

### 1. Pré-requisitos

| Ferramenta | Versão mínima | Como instalar |
|---|---|---|
| **Node.js** | 20.x | https://nodejs.org/ ou via `nvm install 20` |
| **pnpm** | 9.15.0 | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| **Python** | 3.11+ | https://www.python.org/ (necessário para os workers em `python_services`) |
| **Docker Desktop** | recente | https://www.docker.com/products/docker-desktop |
| **Git** | 2.30+ | https://git-scm.com/ |

### 2. Clonar o repositório

```bash
git clone https://github.com/henriquefsousa/HipocratesAi-Front.git
cd HipocratesAi-Front
```

> Para uma branch específica (ex: `Integral`):
> ```bash
> git checkout Integral
> ```

### 3. Instalar dependências

Na raiz do monorepo:

```bash
pnpm install
```

Esse comando instala todos os pacotes do workspace de uma vez (frontend, backend e `@hipo/contracts`).

### 4. Buildar o pacote de contratos

`@hipo/contracts` é consumido pelo frontend e backend. Builde uma vez antes do primeiro `dev`:

```bash
pnpm build:contracts
```

Para desenvolvimento contínuo dos contratos (watch mode):

```bash
pnpm dev:contracts
```

### 5. Configurar variáveis de ambiente

Copie os templates `.env.example` em cada app:

```bash
cp apps/HipocratesAi-Front/.env.example  apps/HipocratesAi-Front/.env
cp apps/HipocratesAi-BackEnd/.env.example apps/HipocratesAi-BackEnd/.env
```

Edite cada `.env` com suas chaves reais (Supabase, Deepgram, Postgres). Veja [Variáveis de ambiente](#variáveis-de-ambiente).

### 6. Subir Postgres + serviços Python

Na raiz:

```bash
docker compose up -d
```

Sobe Postgres + workers Python em background. Confira com `docker ps`.

### 7. Rodar migrations do banco

```bash
cd apps/HipocratesAi-BackEnd
pnpm migrate
cd ../..
```

### 8. Subir backend e frontend (terminais separados)

**Terminal 1 — backend Fastify:**
```bash
pnpm dev:api
# escuta em http://127.0.0.1:3333
```

**Terminal 2 — frontend Vite:**
```bash
pnpm dev:web
# escuta em http://localhost:5173
```

Acesse `http://localhost:5173` no navegador.

### 9. Verificar instalação

| Teste | Como |
|---|---|
| Type-check | `pnpm typecheck` (na raiz) |
| Lint | `pnpm lint` |
| Frontend respondendo | abrir `http://localhost:5173` |
| Backend respondendo | `curl http://127.0.0.1:3333/health` |
| Workers Python ativos | `docker ps` lista containers `clinical_import` / `clinical_llm` |

---

## Variáveis de ambiente

### Frontend (`apps/HipocratesAi-Front/.env`)

```env
VITE_API_URL=http://127.0.0.1:3333
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

### Backend (`apps/HipocratesAi-BackEnd/.env`)

```env
PORT=3333
DATABASE_URL=postgres://user:pass@localhost:5432/hipocrates
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role>
DEEPGRAM_API_KEY=<chave deepgram>
JWT_SECRET=<secret forte>
```

> **⚠️ Nunca commite `.env`.** Já está coberto pelo `.gitignore`. Use `.env.example` para documentar as chaves sem valores.

---

## Scripts disponíveis

### Raiz do monorepo

| Script | O que faz |
|---|---|
| `pnpm install` | Instala todas as dependências do workspace |
| `pnpm build` | Build de tudo (contracts + apps) |
| `pnpm build:contracts` | Build apenas do `@hipo/contracts` |
| `pnpm dev:contracts` | Watch mode do `@hipo/contracts` |
| `pnpm dev:api` | Fastify dev do backend |
| `pnpm dev:web` | Vite dev do frontend |
| `pnpm typecheck` | Type-check em todos os packages |
| `pnpm lint` | ESLint em todos os packages |
| `pnpm test` | Test runners de cada package |

### Frontend (`apps/HipocratesAi-Front`)

| Script | O que faz |
|---|---|
| `pnpm dev` | Vite dev server (porta 5173) |
| `pnpm build` | Build de produção (tsc + vite build) |
| `pnpm preview` | Servir o build local |
| `pnpm typecheck` | tsc --noEmit |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |

### Backend (`apps/HipocratesAi-BackEnd`)

| Script | O que faz |
|---|---|
| `pnpm dev:api` | Fastify com hot reload |
| `pnpm test` | Jest |
| `pnpm typecheck` | tsc --noEmit |

---

## Fluxos principais

### 1. Login → Lista de pacientes → Consulta ativa
1. **Login Supabase** (`/login`) — sessão guardada e JWT injetado em todas as requisições.
2. **Pacientes** (`/pacientes`) — TanStack Query carrega lista, paginação client-side.
3. **Iniciar consulta** (`/consulta/:id`) — `useConsultation()` busca contexto + transcripts/insights iniciais via REST.
4. **Stream em tempo real**:
   - `useConsultationStream(consultationId)` instancia `ConsultationWsClient`.
   - WS `/ws/consultations/:id/state` abre **automaticamente** assim que o componente monta.
   - Token Supabase vai como query string (`?token=...`).
   - Backoff exponencial (200·2ⁿ ms até 10s, máx 10 tentativas) com jitter.
5. **Áudio**:
   - WS `/ws/consultations/:id/audio` é **lazy** — só abre quando começa a gravar.
   - `AudioWorklet` em `src/lib/audioRecorder.ts` captura via `getUserMedia`, downsample para 16 kHz mono Int16-LE e envia PCM em chunks de ~200ms.
   - Backend → Deepgram → emite `transcript_partial` e `transcript_final` no WS de state.
6. **Raciocínio Clínico** — popup arrastável com chat assistente (animação ChatGPT-style palavra-a-palavra com fade-in), hipóteses diagnósticas e busca de imagens (RAG).
7. **Encerramento** — `/consulta/encerramento/:id` consolida hipóteses, condutas e prescrição.

### 2. Captura de áudio (auto-start)
Ao entrar em `/consulta/:id`, assim que o WS de state abre o app **automaticamente** chama `startRecording()`. O navegador pede permissão de microfone, e o ícone na barra inferior fica vermelho com pulso indicando que está gravando. Botão `mic` ↔ `pause` permite controle manual.

---

## Contrato de mensagens WS

Tipadas em `@hipo/contracts`:

| Server → Client | Significado |
|---|---|
| `initial_state` | Snapshot inicial (transcripts + insights) |
| `transcript_partial` | Texto parcial por speaker |
| `transcript_final` | Sentença finalizada |
| `insights_update` | Delta de insights médicos |
| `insights_enriched_update` | Insights enriquecidos com referência |
| `conduct_update` | Atualização de conduta |
| `prescription_update` | Atualização de prescrição |
| `clarification_needed` | IA pede esclarecimento |
| `knowledge_status` | Status do RAG/knowledge base |
| `insight_acked` | Confirmação de ack de insight |
| `error` | Erro do servidor |

| Client → Server | Significado |
|---|---|
| `subscribe` | Assina canal após `open` |
| `insight_ack` | `useful` / `not_useful` / `dismissed` |

---

## Convenções

### Frontend
- **Componentes**: pequenos e focados, separação UI ↔ lógica via hooks.
- **State server**: TanStack Query — nunca refletir no Redux/Zustand.
- **State live (WS)**: reducer puro (`reduceMessage`) dentro do hook `useConsultationStream`.
- **Estilo**: TailwindCSS utilitário + `src/styles/glass-effects.css` para animações e efeitos vidro.
- **Validação**: toda mensagem WS recebida passa por `wsServerMessageSchema.safeParse` antes de chegar no listener — mensagens inválidas são descartadas.
- **Auth**: `getAccessToken()` lê `supabase.auth.getSession()` a cada handshake WS — token sempre fresco.

### Backend
- Validação Zod/Joi em todas as rotas REST.
- Health check em `/health`.
- WS exige token Supabase no query string; rejeita com close-code de auth se inválido.
- Rate limiting em endpoints públicos.

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Transcript vazio falando no mic | Permissão de microfone negada / não solicitada | Clicar no botão de mic na barra inferior; checar `state.error` |
| Pontinho de status cinza permanente | Token Supabase ausente/expirado | Re-login |
| WS desconecta sozinho | Backend caiu ou timeout intermediário | Reconexão automática (até 10 tentativas com backoff) |
| `getUserMedia` bloqueado | Página servida via HTTP em IP de rede | Usar `localhost`/`127.0.0.1` ou HTTPS |
| Build falha em `@hipo/contracts` | Pacote não buildado | `pnpm build:contracts` |
| `pnpm install` falha em peer deps | Cache pnpm desatualizado | `pnpm store prune && pnpm install` |
| Docker compose não sobe Postgres | Porta 5432 ocupada | `docker compose down`, parar Postgres local, retentar |
| 401 nos endpoints REST | JWT expirado | Re-login no frontend |
| Animação do chat travada | Componente desmontou no meio do reveal | Recarregar a página; reveals são por-mensagem e idempotentes |

---

## Licença

Proprietário — uso interno da equipe HipócratesAi.
