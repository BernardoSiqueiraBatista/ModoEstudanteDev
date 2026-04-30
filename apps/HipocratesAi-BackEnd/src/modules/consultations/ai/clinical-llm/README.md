# Clinical LLM Subservice

Integra o backend TS ao FastAPI clínico local em `python_services/clinical_llm`.
O TS continua dono da orquestração, ASR, streaming e fast-alerts; o FastAPI fornece
classificação macro, pergunta de clarificação e suporte clínico com travas de evidência.

## Runtime local

Por padrão, `npm run dev` sobe o backend TS e o FastAPI juntos via
`concurrently`. Prefixos coloridos separam os logs (`api` ciano, `llm`
magenta). Ctrl-C derruba os dois.

```bash
npm run dev              # ambos
npm run dev:api          # só o backend TS (FastAPI desligado)
npm run dev:clinical-llm # só o FastAPI
curl http://127.0.0.1:8010/health
```

O script `dev:clinical-llm` carrega o mesmo `.env` do backend TS, cria a
venv em `python_services/clinical_llm/.venv-py<ver>` se necessário,
instala o `requirements.txt` e sobe:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

## Feature flag

- `ENABLE_CLINICAL_LLM=true`: habilita `/classify_macro` antes do RAG e
  `/clinical_support` após o broadcast final.
- `ENABLE_CLINICAL_LLM=false` (default): preserva o comportamento anterior do pipeline TS.
- Default: **OFF** — o serviço só é ativado se `ENABLE_CLINICAL_LLM=true` for setado
  explicitamente. Containers sem a variável definida ficam com o flag desligado, evitando
  chamadas com falha ao FastAPI antes do circuit breaker abrir.

## Segurança em prod

O backend TS e o FastAPI compartilham um token interno via header `X-Internal-Token`.
Isso impede que qualquer processo externo na mesma rede consiga chamar os endpoints
clínicos diretamente.

**Em dev:** deixe `CLINICAL_LLM_INTERNAL_TOKEN` vazio (ou não defina). O FastAPI aceita
qualquer requisição sem validar o header.

**Em prod:**

1. Gere um token seguro:
   ```bash
   openssl rand -hex 32
   ```
2. Defina nos dois serviços via `.env` do host (ou secrets do orquestrador):
   ```env
   CLINICAL_LLM_INTERNAL_TOKEN=<token gerado>
   ```
3. O `docker-compose.yml` passa a variável automaticamente para `backend` e `clinical-llm`.

**Diagnóstico:** se o token for configurado em apenas um dos lados, as requisições retornam
`401 invalid internal token`. Os logs do FastAPI registram `verify_internal_token: token
inválido ou ausente` com indicação se o header estava presente ou ausente, facilitando
a identificação do lado desconfigured.

## Fluxo

1. `process-text.ts` chama `classifyMacro(recentTranscript)`.
2. Se `DECIDED`, passa `macroFilter`/`microFilter` para o RAG via
   `match_medical_chunks_filtered_arr`.
3. Se `PENDING`, chama `checklistQuestion` em segundo plano e emite
   `clarification_needed`.
4. Após `insights_update` final, chama `clinicalSupport` em fire-and-forget.
5. Erros semânticos viram estado de painel:
   - `INSUFFICIENT_EVIDENCE` -> `knowledge_status: insufficient_evidence`
   - `NO_CITATIONS` -> `knowledge_status: no_citations`
   - `PENDING` -> log estruturado, sem quebrar streaming

Timeout/5xx/circuit open degradam silenciosamente para o painel, mas ficam em logs e métricas.

## Observabilidade

Métricas adicionadas no registry interno:

- `clinical_llm.classify_macro.duration_ms`
- `clinical_llm.classify_macro.status.decided|pending`
- `clinical_llm.clinical_support.duration_ms`
- `clinical_llm.<endpoint>.error.*`
- `clinical_llm.breaker.state` (`0=closed`, `0.5=half_open`, `1=open`)

Logs nunca registram o texto completo da consulta; usam tamanho e hash curto.

## Contrato TS

Os tipos em `types.ts` espelham `python_services/clinical_llm/app/schemas.py`.
Enquanto o schema Python ainda muda, a sincronização é manual e coberta por testes com fixtures.
A próxima melhoria natural é gerar tipos via OpenAPI.
