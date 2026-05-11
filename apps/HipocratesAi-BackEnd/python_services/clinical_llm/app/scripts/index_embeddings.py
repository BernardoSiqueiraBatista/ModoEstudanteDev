import os
import time
from dotenv import load_dotenv
from supabase import create_client
from openai import OpenAI

load_dotenv()

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
oa = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")
LIMIT_TOTAL = int(os.getenv("LIMIT_TOTAL", "200"))   # <- começa pequeno
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))
SLEEP = float(os.getenv("SLEEP_SECONDS", "0.2"))

def make_text(r):
    macro = (r.get("secao_macro") or "").strip()
    micro = (r.get("secao_micro") or "").strip()
    conteudo = (r.get("conteudo") or "").strip()
    return f"[{macro}] > [{micro}]\n{conteudo}".strip()

def main():
    done = 0
    while done < LIMIT_TOTAL:
        n = min(BATCH_SIZE, LIMIT_TOTAL - done)

        rows = (sb.table("medical_chunks")
                .select("id,secao_macro,secao_micro,conteudo")
                .is_("embedding", "null")
                .limit(n)
                .execute()).data or []

        if not rows:
            print("✅ Nada mais para indexar (embedding NULL).")
            break

        texts = [make_text(r) for r in rows]
        ids = [r["id"] for r in rows]

        emb = oa.embeddings.create(model=EMBED_MODEL, input=texts)
        vecs = [d.embedding for d in emb.data]

        for cid, v in zip(ids, vecs):
            sb.table("medical_chunks").update({"embedding": v}).eq("id", cid).execute()
            done += 1

        print(f"📌 Indexados nesta execução: {done}/{LIMIT_TOTAL}")
        time.sleep(SLEEP)

    print("✅ Execução finalizada.")

if __name__ == "__main__":
    main()
