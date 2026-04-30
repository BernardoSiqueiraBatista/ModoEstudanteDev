#!/usr/bin/env python3
"""
Apply the HNSW index via Supabase Management API.

Uses POST /v1/projects/{ref}/database/query with a Personal Access Token
(generated at https://supabase.com/dashboard/account/tokens).

Benefits vs direct psql:
  - No database password needed (uses Supabase account token)
  - Server-side timeout is very high (handles long CREATE INDEX)
  - No IPv6/IPv4 network issues

Usage:
  export SUPABASE_ACCESS_TOKEN="sbp_..."
  python3 scripts/apply_hnsw_via_management_api.py

Or as argument:
  python3 scripts/apply_hnsw_via_management_api.py sbp_...

Optional second arg: project ref (default: oddlwsyzowaaobqzfbzr)
"""
from __future__ import annotations

import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from typing import Any


DEFAULT_PROJECT_REF = "oddlwsyzowaaobqzfbzr"

SQL_STATEMENTS = [
    (
        "Criar indice IVFFlat (builds em 30-120s, cabe no proxy timeout)",
        # IVFFlat em vez de HNSW: constroi rapido o bastante pra caber no
        # timeout de ~2min do proxy da Management API (HNSW precisa 5-20min).
        # lists ~ sqrt(527264) = 726 -> usamos 500 (bom equilibrio)
        """
        SET statement_timeout = '10min';
        SET maintenance_work_mem = '256MB';
        CREATE INDEX IF NOT EXISTS idx_medical_chunks_embedding_ivfflat
          ON public.medical_chunks
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 500);
        """,
    ),
    (
        "Verificar criacao do indice",
        """
        SELECT indexname
          FROM pg_indexes
         WHERE schemaname = 'public'
           AND tablename = 'medical_chunks'
           AND indexname LIKE 'idx_medical_chunks_embedding_%';
        """,
    ),
]


def format_elapsed(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def ticker_thread(stop_event: threading.Event, started_at: float, label: str) -> None:
    while not stop_event.is_set():
        elapsed = time.monotonic() - started_at
        sys.stdout.write(f"\r  [{format_elapsed(elapsed)}] {label}...")
        sys.stdout.flush()
        stop_event.wait(1.0)


def management_api_query(
    token: str, project_ref: str, sql: str, timeout: float = 1800.0
) -> Any:
    """Calls POST /v1/projects/{ref}/database/query with raw SQL."""
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "hipocrates-hnsw-apply/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw


def main() -> int:
    # Token
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if len(sys.argv) > 1:
        token = sys.argv[1]
    if not token:
        print("ERRO: SUPABASE_ACCESS_TOKEN nao fornecido.")
        print()
        print("Gere um em: https://supabase.com/dashboard/account/tokens")
        print()
        print("Uso:")
        print('  export SUPABASE_ACCESS_TOKEN="sbp_..."')
        print("  python3 scripts/apply_hnsw_via_management_api.py")
        print()
        print("Ou:")
        print("  python3 scripts/apply_hnsw_via_management_api.py sbp_...")
        return 2
    if not token.startswith("sbp_"):
        print(f"AVISO: token nao comeca com 'sbp_' ({token[:6]}...) — prosseguindo mesmo assim")

    project_ref = (
        sys.argv[2]
        if len(sys.argv) > 2
        else os.environ.get("SUPABASE_PROJECT_REF", DEFAULT_PROJECT_REF)
    )
    print(f"Projeto: {project_ref}")
    print(f"Endpoint: https://api.supabase.com/v1/projects/{project_ref}/database/query")
    print()

    for title, sql in SQL_STATEMENTS:
        print(f"-> {title}")

        if "CREATE INDEX" in sql.upper():
            stop = threading.Event()
            started = time.monotonic()
            t = threading.Thread(
                target=ticker_thread,
                args=(stop, started, "construindo indice HNSW (normalmente 5-20 min)"),
                daemon=True,
            )
            t.start()
            try:
                result = management_api_query(token, project_ref, sql, timeout=3600)
            except urllib.error.HTTPError as e:
                stop.set()
                t.join(timeout=2.0)
                sys.stdout.write("\r" + " " * 80 + "\r")
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"\nERRO HTTP {e.code}: {err_body[:500]}")
                return 3
            except urllib.error.URLError as e:
                stop.set()
                t.join(timeout=2.0)
                sys.stdout.write("\r" + " " * 80 + "\r")
                print(f"\nERRO de rede: {e}")
                return 4
            finally:
                stop.set()
                t.join(timeout=2.0)
            elapsed = time.monotonic() - started
            sys.stdout.write("\r" + " " * 80 + "\r")
            print(f"   OK em {format_elapsed(elapsed)}")
        else:
            try:
                result = management_api_query(token, project_ref, sql)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"   ERRO HTTP {e.code}: {err_body[:300]}")
                return 3
            except urllib.error.URLError as e:
                print(f"   ERRO de rede: {e}")
                return 4
            if isinstance(result, list):
                if result:
                    print(f"   OK — resultado: {result}")
                else:
                    print("   OK — sem linhas retornadas")
            else:
                print(f"   OK")

    print("\nConcluido com sucesso.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
