# app/db/retrieval.py
from __future__ import annotations

from app.db.supabase import sb


def rpc_match_micro_candidates(
    query_embedding,
    secao_macro_filter: str,
    micro_count: int = 6,
):
    """
    Chama a RPC public.match_micro_candidates
    Retorna lista de {secao_micro, top_score, avg_score, hits}
    """
    if sb is None:
        raise RuntimeError(
            "Supabase não inicializado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env"
        )

    args = {
        "query_embedding": query_embedding,  # vector(1536) no banco
        "secao_macro_filter": secao_macro_filter,
        "micro_count": int(micro_count),
    }

    res = sb.rpc("match_micro_candidates_long", args).execute()

    return res.data or []


def rpc_match_chunks_filtered(
    match_count: int,
    query_embedding,
    secao_macro_filter: str,
    secao_micro_filter: str | None,
):
    """
    Stage 2: tenta RPC vetorial. Se falhar/voltar vazio, faz fallback por SQL (sem vetorial)
    só pra destravar o pipeline e provar que existem chunks.
    """
    if sb is None:
        raise RuntimeError(
            "Supabase não inicializado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env"
        )

    # 1) tenta RPC vetorial (versão mais recente que você tiver)
    # Primeiro tenta a _arr (float4[]) se existir; se não, tenta a normal.
    # Se qualquer uma retornar dados, sai.
    try:
        emb_arr = [float(x) for x in query_embedding]

        # tenta a RPC com float4[]
        args_arr = {
            "match_count": int(match_count),
            "query_embedding_arr": emb_arr,
            "secao_macro_filter": secao_macro_filter,
            "secao_micro_filter": secao_micro_filter,
        }
        res_arr = sb.rpc("match_medical_chunks_filtered_arr", args_arr).execute()
        data_arr = res_arr.data or []
        if data_arr:
            return data_arr
    except Exception:
        pass

    try:
        # tenta a RPC "clássica" (vector)
        args = {
            "match_count": int(match_count),
            "query_embedding": query_embedding,
            "secao_macro_filter": secao_macro_filter,
            "secao_micro_filter": secao_micro_filter,
        }
        res = sb.rpc("match_medical_chunks_filtered", args).execute()
        data = res.data or []
        if data:
            return data
    except Exception:
        pass

    # 2) fallback SEM vetorial: prova que existe linha com embedding nessa macro/micro
    q = (
        sb.table("medical_chunks")
        .select("id, book_id, page_number, chunk_index, secao_macro, secao_micro, conteudo, created_at")
        .eq("secao_macro", secao_macro_filter)
        .not_.is_("embedding", "null")
        .limit(int(match_count))
    )
    if secao_micro_filter:
        q = q.eq("secao_micro", secao_micro_filter)

    res2 = q.execute()
    data2 = res2.data or []
    for row in data2:
        row["score"] = 0.0
    return data2
