import os, time, json, random, asyncio
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv

import httpx
from supabase import create_client, ClientOptions
from openai import AsyncOpenAI

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

TABLE = "medical_chunks"
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small").strip()

# 🔥 ARROCHO (default mais agressivo, mas configurável por .env)
PAGE_SIZE = int(os.getenv("EMBED_PAGE_SIZE", "2000"))
BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "256"))       # se der payload grande, baixa p/ 128
SLEEP = float(os.getenv("EMBED_SLEEP_SECONDS", "0"))         # tira o freio
MAX_RETRIES = int(os.getenv("EMBED_MAX_RETRIES", "12"))
PROGRESS_FILE = os.getenv("EMBED_PROGRESS_FILE", "embed_progress.json")

# 🔥 Concorrência de embeddings (turbo real)
EMBED_CONCURRENCY = int(os.getenv("EMBED_CONCURRENCY", "6"))  # 4-10 costuma ser bom

SAVE_AS_STRING = os.getenv("SAVE_EMBEDDING_AS_STRING", "false").lower() == "true"
if SAVE_AS_STRING:
    raise RuntimeError("SAVE_EMBEDDING_AS_STRING=true vai quebrar vector. Troque para false no .env")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no .env")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY ausente no .env")

# ✅ timeout maior pro PostgREST (evita read timeout em bulk_update)
timeout = httpx.Timeout(240.0, connect=30.0)  # 4 min total
sb = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    options=ClientOptions(postgrest_client_timeout=timeout),
)

oa = AsyncOpenAI(api_key=OPENAI_API_KEY)


def backoff(attempt: int, base: float = 1.0):
    # exponencial + jitter, cap 60s
    sleep_s = min(60.0, base * (2 ** attempt)) + random.random()
    time.sleep(sleep_s)


def load_progress() -> Dict[str, Any]:
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_progress(d: Dict[str, Any]):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)


def fetch_page(cursor_created_at: Optional[str], cursor_id: Optional[str], page_size: int) -> List[Dict[str, Any]]:
    args = {
        "cursor_created_at": cursor_created_at,
        "cursor_id": cursor_id,
        "page_size": page_size
    }
    for attempt in range(MAX_RETRIES):
        try:
            res = sb.rpc("fetch_chunks_missing_embedding", args).execute()
            return res.data or []
        except Exception as e:
            print(f"⚠️ fetch retry {attempt+1}/{MAX_RETRIES}: {e}")
            backoff(attempt, base=2.0)
    raise RuntimeError("Falha persistente ao buscar página via RPC.")


def bulk_update(items: List[Dict[str, Any]]) -> int:
    # ✅ mande a lista direto (jsonb array), não string
    payload = items

    for attempt in range(MAX_RETRIES):
        try:
            res = sb.rpc("bulk_update_embeddings", {"payload": payload}).execute()
            data = res.data

            if isinstance(data, int):
                return data

            if isinstance(data, list) and data:
                first = data[0]
                if isinstance(first, int):
                    return first
                if isinstance(first, dict):
                    for k in ("bulk_update_embeddings", "updated_count", "count"):
                        if k in first:
                            return int(first[k])

            return 0

        except Exception as e:
            msg = str(e)
            print(f"⚠️ bulk_update retry {attempt+1}/{MAX_RETRIES}: {msg}")
            # timeout/502/503 -> backoff mais forte
            if any(x in msg for x in ["timed out", "ReadTimeout", "Timeout", "502", "503", "504"]):
                backoff(attempt, base=4.0)
            else:
                backoff(attempt, base=2.0)

    raise RuntimeError("Falha persistente no bulk_update_embeddings.")


async def embed_one_batch(texts: List[str]) -> List[List[float]]:
    r = await oa.embeddings.create(model=EMBED_MODEL, input=texts)
    data = sorted(r.data, key=lambda x: x.index)
    return [d.embedding for d in data]


async def embed_many_batches(batches: List[List[str]]) -> List[List[List[float]]]:
    sem = asyncio.Semaphore(EMBED_CONCURRENCY)

    async def run(batch: List[str]) -> List[List[float]]:
        async with sem:
            # retry interno p/ embeddings
            for attempt in range(MAX_RETRIES):
                try:
                    return await embed_one_batch(batch)
                except Exception as e:
                    msg = str(e)
                    print(f"⚠️ embed retry {attempt+1}/{MAX_RETRIES}: {msg}")
                    # rate limit / server errors -> backoff maior
                    if any(x in msg for x in ["rate limit", "429", "server_error", "500", "502", "503", "504", "ReadTimeout", "Timeout"]):
                        await asyncio.sleep(min(60.0, 2 ** attempt) + random.random())
                    else:
                        await asyncio.sleep(min(30.0, 1.5 ** attempt) + random.random())
            raise RuntimeError("Falha persistente em embeddings para um batch.")

    tasks = [asyncio.create_task(run(b)) for b in batches]
    return await asyncio.gather(*tasks)


def chunk_list(xs: List[Any], n: int) -> List[List[Any]]:
    return [xs[i:i+n] for i in range(0, len(xs), n)]


def main():
    prog = load_progress()
    total_done = int(prog.get("total_done", 0))
    cursor_created_at = prog.get("cursor_created_at")
    cursor_id = prog.get("cursor_id")

    print(f"▶️ Indexando embeddings | model={EMBED_MODEL}")
    print(f"   page={PAGE_SIZE} batch={BATCH_SIZE} sleep={SLEEP}s retries={MAX_RETRIES} conc={EMBED_CONCURRENCY}")
    if cursor_created_at and cursor_id:
        print(f"   retomando cursor: created_at={cursor_created_at} id={cursor_id}")

    started = time.time()
    last_log = time.time()

    # ✅ medição real por janela (últimos 60s)
    window_start = time.time()
    window_done_start = total_done

    while True:
        rows = fetch_page(cursor_created_at, cursor_id, PAGE_SIZE)
        if not rows:
            break

        # cursor pro último retornado
        cursor_created_at = rows[-1]["created_at"]
        cursor_id = rows[-1]["id"]

        ids: List[str] = []
        texts: List[str] = []
        for r in rows:
            content = (r.get("conteudo") or "").strip()
            if not content:
                continue
            macro = (r.get("secao_macro") or "").strip()
            micro = (r.get("secao_micro") or "").strip()
            enriched = f"[{macro}] [{micro}] {content}"
            ids.append(r["id"])
            texts.append(enriched)

        if not texts:
            prog.update({"total_done": total_done, "cursor_created_at": cursor_created_at, "cursor_id": cursor_id})
            save_progress(prog)
            continue

        # 🔥 quebra em batches e roda embeddings em paralelo
        text_batches = chunk_list(texts, BATCH_SIZE)
        id_batches = chunk_list(ids, BATCH_SIZE)

        try:
            embeds_batches = asyncio.run(embed_many_batches(text_batches))
        except RuntimeError as e:
            print(f"❌ {e}. Salvando progresso e abortando.")
            prog.update({"total_done": total_done, "cursor_created_at": cursor_created_at, "cursor_id": cursor_id, "finished": False})
            save_progress(prog)
            return

        # aplica updates batch a batch (sequencial p/ não matar o PostgREST)
        for chunk_ids, embeds in zip(id_batches, embeds_batches):
            update_items = [{"id": rid, "embedding": emb} for rid, emb in zip(chunk_ids, embeds)]
            updated = bulk_update(update_items)
            total_done += updated

            # ✅ log a cada ~15s + taxa real por janela 60s
            now = time.time()
            if now - last_log > 15:
                elapsed = max(now - started, 1e-6)
                avg_rate = total_done / elapsed

                if now - window_start >= 60:
                    window_rate = (total_done - window_done_start) / max(now - window_start, 1e-6)
                    window_start = now
                    window_done_start = total_done
                else:
                    window_rate = (total_done - window_done_start) / max(now - window_start, 1e-6)

                print(
                    f"✅ total_done={total_done} | avg={avg_rate:.2f}/s | last60s={window_rate:.2f}/s | cursor={cursor_created_at} {cursor_id}"
                )
                prog.update({"total_done": total_done, "cursor_created_at": cursor_created_at, "cursor_id": cursor_id})
                save_progress(prog)
                last_log = now

            if SLEEP > 0:
                time.sleep(SLEEP)

        prog.update({"total_done": total_done, "cursor_created_at": cursor_created_at, "cursor_id": cursor_id})
        save_progress(prog)

    elapsed = time.time() - started
    prog.update({"total_done": total_done, "cursor_created_at": cursor_created_at, "cursor_id": cursor_id, "finished": True})
    save_progress(prog)
    print(f"🏁 Finalizado. total_done={total_done} em {elapsed/60:.1f} min")


if __name__ == "__main__":
    main()
