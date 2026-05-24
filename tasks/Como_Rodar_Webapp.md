# 🚀 Como Rodar o WebApp HipocratesAI (Front-End & Back-End)

Este guia prático fornece o passo a passo completo para configurar, rodar e testar todo o ecossistema do **HipocratesAI** (Back-End em Express + TypeScript, Front-End em React + Vite + Tailwind, e banco de dados PostgreSQL via Docker).

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
1. **Node.js** (versão `>= 20`)
2. **PNPM** (gerenciador de pacotes padrão do monorepo, instalável via `npm install -g pnpm`)
3. **Docker & Docker Compose** (para gerenciar o banco de dados PostgreSQL local)
4. **Python 3** (necessário para rodar o script de seed sintético do banco)

---

## 🛠️ Passo 1: Instalação de Dependências

A estrutura do projeto é um monorepo gerenciado via **PNPM Workspaces**. Portanto, você só precisa rodar a instalação uma única vez na raiz do projeto:

```bash
# Na raiz do monorepo, execute:
pnpm install
```

Isso instalará e linkará automaticamente todas as dependências do Back-End, do Front-End e do pacote compartilhado de contratos (`@hipo/contracts`).

---

## 🗄️ Passo 2: Configuração do Banco de Dados (PostgreSQL)

O Back-End utiliza um banco PostgreSQL local que roda em um container Docker.

### 1. Subir o container do PostgreSQL:
```bash
# Entre na pasta do backend
cd apps/HipocratesAi-BackEnd

# Suba o banco de dados
pnpm db:up
```

### 2. Criar tabelas e aplicar o Seed Sintético:
Temos um script Python robusto que limpa o esquema, cria todas as tabelas (lendo o arquivo `src/config/dbSchema.sql` que já inclui as novas tabelas de **papers** e **paper_shares** criadas na Task 3) e insere dados falsos de estudantes, blocos de estudo, questões e performance.

Para preparar o banco de dados completamente, execute:
```bash
# Ainda em apps/HipocratesAi-BackEnd:
pnpm db:seed
```
*Dica:* Se preferir rodar tudo em um único comando que sobe o banco e já aplica o seed, execute `pnpm db:setup`.

---

## ⚙️ Passo 3: Configuração das Variáveis de Ambiente (`.env`)

Tanto o front quanto o back necessitam de variáveis de ambiente configuradas localmente.

### Back-End (`apps/HipocratesAi-BackEnd`)
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```
Preencha as variáveis de acesso ao banco de dados com as credenciais do seu container PostgreSQL local (por padrão, as variáveis de banco de dados do Docker Compose local são configuradas no `.env` criado automaticamente pelo script ou já disponíveis no seu setup).

### Front-End (`apps/HipocratesAi-Front`)
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```
Confirme se a variável `VITE_API_URL` aponta para o backend local:
```env
VITE_API_URL=http://127.0.0.1:3333
```

---

## 🚀 Passo 4: Compilando e Iniciando a Aplicação

Para rodar todo o sistema localmente em modo de desenvolvimento, siga estes passos:

### 1. Compilar os Contratos Compartilhados (Importante!)
Antes de iniciar os apps, você deve garantir que o pacote de contratos (`@hipo/contracts`) está compilado, pois ambos os apps dependem dele:
```bash
# Na raiz do monorepo, execute:
pnpm build:contracts
```

### 2. Iniciar o Back-End (API)
```bash
# Na raiz do monorepo, execute:
pnpm dev:api
```
O servidor de API backend iniciará e ficará ouvindo na porta `3333` (`http://localhost:3333`).

### 3. Iniciar o Front-End
```bash
# Em outro terminal, na raiz do monorepo, execute:
pnpm dev:web
```
O servidor de desenvolvimento do Vite iniciará e você poderá acessar o webapp na porta padrão (`http://localhost:5173`).

---

## 🧪 Passo 5: Rodando os Testes Automatizados (Back-End)

Para garantir que o módulo de **papers** e todas as novas funcionalidades estão perfeitamente funcionais e seguras, você pode executar nossa suite de testes:

```bash
# Entre na pasta do backend
cd apps/HipocratesAi-BackEnd

# Rodar os testes de Service do módulo Papers:
node ../../node_modules/jest/bin/jest.js src/modules/papers/__tests__/papers.service.test.ts --no-cache --forceExit

# Rodar os testes de Controller do módulo Papers:
node ../../node_modules/jest/bin/jest.js src/modules/papers/__tests__/papers.controller.test.ts --no-cache --forceExit
```

*Nota:* No total, são **34 testes cobrindo 100%** dos cenários críticos de CRUD, segurança por ID do estudante, paginação correta, soft delete automatizado e expiração de links públicos compartilhados.

---

## 💡 Dicas Úteis para Testes no Postman/Insomnia

O script de seed (`pnpm db:seed`) cria IDs estáticos no banco para facilitar testes manuais e de rotas:
- **Base URL:** `http://localhost:3333`
- **Student ID Fixo:** `e1925b44-9694-477c-a496-5e638e4a9e25`
- **Exemplo de chamada para criar um paper:**
  - `POST http://localhost:3333/student/e1925b44-9694-477c-a496-5e638e4a9e25/papers`
  - Body:
    ```json
    {
      "titulo": "Mecanismos da Fisiologia Cardiovascular",
      "conteudo": "Lorem ipsum dolor sit amet...",
      "conteudo_tipo": "markdown",
      "tags": ["cardiologia", "fisiologia"],
      "status": "publicado"
    }
    ```
