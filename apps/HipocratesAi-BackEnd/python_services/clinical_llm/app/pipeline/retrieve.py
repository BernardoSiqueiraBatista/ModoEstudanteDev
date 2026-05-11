from app.config import (
    OPENAI_MODEL_CLASSIFY,
    RETRIEVE_K_STAGE2,
    MICRO_CANDIDATES_TOPN,
    MICRO_SELECT_TOPN,
)
from app.llm.client import embed_text
from app.pipeline.macro import classify_macro
from app.db.retrieval import rpc_match_micro_candidates, rpc_match_chunks_filtered

import re
import unicodedata
import math

def fix_mojibake_if_needed(s: str) -> str:
    if not s:
        return s
    if ("Ã" in s) or ("Â" in s) or ("�" in s):
        try:
            return s.encode("latin1").decode("utf-8")
        except Exception:
            return s
    return s

def clean_text_light(s: str) -> str:
    if not s:
        return s
    s = unicodedata.normalize("NFC", s)
    s = s.replace("\u00ad", "")
    s = re.sub(r"-\s*\n\s*", "", s)
    s = re.sub(r"\s*\n\s*", " ", s)
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s.strip()

def normalize_for_output(s: str) -> str:
    return clean_text_light(fix_mojibake_if_needed(s))

def is_generic_micro(name: str) -> bool:
    n = (name or "").strip().lower()
    return n in {"geral", "generalidades", "introdução", "introducao"}

def micro_rank_score(m: dict) -> float:
    """
    Score composto:
    - privilegia top_score e avg_score
    - penaliza micros "populares" (hits altos) pra não deixar 'Geral' dominar
    """
    top = float(m.get("top_score") or 0.0)
    avg = float(m.get("avg_score") or 0.0)
    hits = int(m.get("hits") or 0)

    penalty = 0.05 * math.log1p(hits)  # ajuste fino: 0.03–0.08
    bonus_specific = 0.08 if not is_generic_micro(m.get("secao_micro", "")) else 0.0

    return (0.70 * top) + (0.30 * avg) + bonus_specific - penalty

def pick_micros(micros: list, topn: int) -> list:
    micros = [m for m in micros if m.get("secao_micro")]
    ranked = sorted(micros, key=micro_rank_score, reverse=True)

    # Regra extra: se o 1º for "Geral" mas existir um específico quase tão bom, troca.
    if ranked:
        first = ranked[0]
        if is_generic_micro(first.get("secao_micro", "")):
            # encontra melhor específico
            best_spec = next((m for m in ranked if not is_generic_micro(m.get("secao_micro", ""))), None)
            if best_spec:
                # se estiver relativamente perto, preferir específico
                if micro_rank_score(best_spec) >= micro_rank_score(first) - 0.03:
                    ranked.remove(best_spec)
                    ranked.insert(0, best_spec)

    return [m["secao_micro"] for m in ranked[:topn]]


def retrieve_only_micro_first(text: str):
    macro, status, top3, reason = classify_macro(text, model=OPENAI_MODEL_CLASSIFY)
    if not macro:
        return {"status": "PENDING", "top3": top3, "reason": reason}

    q_emb = embed_text(f"[{macro}] {text}")

    if not isinstance(q_emb, (list, tuple)):
        raise RuntimeError(f"embed_text retornou tipo inválido: {type(q_emb)}")
    if len(q_emb) != 1536:
        raise RuntimeError(f"embedding com dimensão errada: {len(q_emb)} (esperado 1536)")

    q_emb = [float(x) for x in q_emb]

    micros = rpc_match_micro_candidates(
        query_embedding=q_emb,
        secao_macro_filter=macro,
        micro_count=MICRO_CANDIDATES_TOPN
    )

    # ✅ normaliza saída (encoding + limpeza leve)
    for m in micros:
        if isinstance(m, dict):
            m["secao_micro"] = normalize_for_output(m.get("secao_micro", ""))

    micro_selected = pick_micros(micros, MICRO_SELECT_TOPN)

    chosen_micro = micro_selected[0] if micro_selected else None
    chunks = rpc_match_chunks_filtered(
        match_count=RETRIEVE_K_STAGE2,
        query_embedding=q_emb,
        secao_macro_filter=macro,
        secao_micro_filter=chosen_micro
    )

    # ✅ normaliza saída (encoding + limpeza leve)
    for c in chunks:
        if isinstance(c, dict):
            c["secao_macro"] = normalize_for_output(c.get("secao_macro", ""))
            c["secao_micro"] = normalize_for_output(c.get("secao_micro", ""))
            c["conteudo"] = normalize_for_output(c.get("conteudo", ""))

    return {
        "status": "DECIDED",
        "macro": macro,
        "micro_candidates": micros,
        "micro_selected": micro_selected,
        "chunks": chunks,
    }
