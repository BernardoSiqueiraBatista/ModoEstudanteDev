from app.config import DECIDE_MIN_SCORE, DECIDE_MIN_GAP, AVOID_GERAL_GAP
from app.llm.client import llm_answer
from app.llm.prompts import macro_classify_prompt
from app.llm.schemas import MACRO_CLASSIFY_SCHEMA
import json

def avoid_geral_and_decide(top3):
    top3 = sorted(top3, key=lambda x: x["score"], reverse=True)
    top1, top2 = top3[0], top3[1]

    if top1["macro"] == "Geral" and top2["score"] >= top1["score"] - AVOID_GERAL_GAP:
        top1, top2 = top2, top1

    gap = top1["score"] - top2["score"]

    if top1["macro"] != "Geral" and top1["score"] >= DECIDE_MIN_SCORE and gap >= DECIDE_MIN_GAP:
        return top1["macro"], "DECIDED", f"score={top1['score']:.2f} gap={gap:.2f}"

    return None, "PENDING", f"ambíguo (top1={top1['macro']} {top1['score']:.2f}, gap={gap:.2f})"

def classify_macro(text: str, model: str):
    out = llm_answer(
        model=model,
        input_text=macro_classify_prompt(text),
        json_schema_format={
            "type": "json_schema",
            "name": "macro_classification",
            "schema": MACRO_CLASSIFY_SCHEMA,
        },
    )
    parsed = json.loads(out)
    top3 = parsed["top3"]
    final, status, reason = avoid_geral_and_decide(top3)
    return final, status, top3, reason
