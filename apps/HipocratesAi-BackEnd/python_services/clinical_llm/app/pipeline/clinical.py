import json
from typing import Any, Dict, List

from app.llm.client import client
from app.config import OPENAI_MODEL_CLASSIFY
from app.llm.prompts import clinical_prompt
from app.llm.schemas import CLINICAL_SCHEMA


def _build_evidence_block(chunks: List[Dict[str, Any]], max_chars: int = 6000) -> str:
    lines = []
    total = 0
    for c in chunks or []:
        cid = c.get("id", "")
        txt = c.get("conteudo", "") or ""
        line = f"[chunk_id={cid}] {txt}"
        if total + len(line) > max_chars:
            break
        lines.append(line)
        total += len(line)
    return "\n\n".join(lines)


def generate_clinical_support(user_text: str, macro: str, micro_selected: List[str], micros: List[Dict[str, Any]], chunks: List[Dict[str, Any]]):
    chosen_micro = (micro_selected[0] if micro_selected else None) or ""

    micro_candidates_slim = []
    for m in (micros or [])[:10]:
        micro_candidates_slim.append({
            "secao_micro": m.get("secao_micro"),
            "top_score": m.get("top_score"),
            "avg_score": m.get("avg_score"),
            "hits": m.get("hits"),
        })

    evidence = _build_evidence_block(chunks)

    resp = client.responses.create(
        model=OPENAI_MODEL_CLASSIFY,
        input=clinical_prompt(
            user_text=user_text,
            macro=macro,
            chosen_micro=chosen_micro,
            micro_candidates=micro_candidates_slim,
            evidence=evidence,
        ),
        text={
            "format": {
                "type": "json_schema",
                "name": "clinical_support",
                "schema": CLINICAL_SCHEMA,
            }
        },
    )

    return json.loads(resp.output_text)
