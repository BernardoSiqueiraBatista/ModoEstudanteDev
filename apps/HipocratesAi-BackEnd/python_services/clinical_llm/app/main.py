# app/main.py
import json
import os
import logging
from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile, File

logger = logging.getLogger(__name__)


def verify_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    """Valida o shared secret entre backend TS e FastAPI.

    Em dev (CLINICAL_LLM_INTERNAL_TOKEN vazio), aceita qualquer requisição.
    Em prod, rejeita com 401 se o header estiver ausente ou incorreto.
    Se o token for configurado apenas num dos lados, a requisição falha com
    401 — verifique os logs do FastAPI para diagnosticar.
    """
    expected = os.getenv("CLINICAL_LLM_INTERNAL_TOKEN", "")
    if not expected:
        return  # dev mode — sem token configurado, validação desabilitada
    if x_internal_token != expected:
        logger.warning(
            "verify_internal_token: token inválido ou ausente "
            "(header presente: %s). Verifique CLINICAL_LLM_INTERNAL_TOKEN "
            "nos dois serviços.",
            x_internal_token is not None,
        )
        raise HTTPException(status_code=401, detail="invalid internal token")


from app.schemas import (
    ClassifyMacroReq,
    ClassifyMacroResp,
    ChecklistQuestionReq,
    ChecklistQuestionResp,
    RetrieveReq,
    RetrieveResp,
    AnswerRagReq,
    AnswerRagResp,
    ClinicalSupportReq,
    ClinicalSupportResp,
)

from app.config import (
    OPENAI_MODEL_TRANSCRIBE,
    OPENAI_MODEL_CLASSIFY,
    MIN_SIMILARITY_SCORE,
    REQUIRE_CITATIONS,
)

from app.pipeline.clinical import generate_clinical_support


from app.llm.client import client
from app.llm.prompts import checklist_prompt
from app.llm.schemas import CHECKLIST_SCHEMA

from app.pipeline.macro import classify_macro
from app.pipeline.retrieve import retrieve_only_micro_first
from app.pipeline.rag import answer_with_citations


app = FastAPI(title="Hipocrates IA Agent", version="0.3.0")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    _: None = Depends(verify_internal_token),
):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Arquivo de áudio vazio.")

    r = client.audio.transcriptions.create(
        model=OPENAI_MODEL_TRANSCRIBE,
        file=(file.filename, audio_bytes),
    )
    return {"text": r.text}


@app.post("/classify_macro", response_model=ClassifyMacroResp)
def api_classify_macro(req: ClassifyMacroReq, _: None = Depends(verify_internal_token)):
    final, status, top3, reason = classify_macro(req.text, model=OPENAI_MODEL_CLASSIFY)
    return {
        "final": final,
        "status": status,
        "top3": top3,
        "reason": reason,
    }


@app.post("/checklist_question", response_model=ChecklistQuestionResp)
def api_checklist(req: ChecklistQuestionReq, _: None = Depends(verify_internal_token)):
    resp = client.responses.create(
        model=OPENAI_MODEL_CLASSIFY,
        input=checklist_prompt(req.text, req.top3),
        text={
            "format": {
                "type": "json_schema",
                "name": "checklist_question",
                "schema": CHECKLIST_SCHEMA,
            }
        },
    )
    return json.loads(resp.output_text)


@app.post("/retrieve", response_model=RetrieveResp)
def api_retrieve(req: RetrieveReq, _: None = Depends(verify_internal_token)):
    out = retrieve_only_micro_first(req.text)
    if out.get("status") != "DECIDED":
        raise HTTPException(status_code=409, detail=out)

    return {
        "macro": out["macro"],
        "micro_candidates": out["micro_candidates"],
        "micro_selected": out["micro_selected"],
        "chunks": out["chunks"],
    }


@app.post("/answer_rag", response_model=AnswerRagResp)
def api_answer_rag(req: AnswerRagReq, _: None = Depends(verify_internal_token)):
    out = retrieve_only_micro_first(req.text)
    if out.get("status") != "DECIDED":
        raise HTTPException(status_code=409, detail=out)

    chunks = out.get("chunks") or []
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="Nenhum chunk encontrado. Verifique embeddings e RPCs.",
        )

    # ✅ trava por score (anti-alucinação)
    top_score = max([float(c.get("score") or 0.0) for c in chunks], default=0.0)
    if top_score < MIN_SIMILARITY_SCORE:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INSUFFICIENT_EVIDENCE",
                "top_score": round(top_score, 3),
                "min_required": MIN_SIMILARITY_SCORE,
                "message": "Evidência insuficiente nos trechos recuperados para responder com segurança.",
                "hint": "Indexe mais embeddings (principalmente nesta macro) ou refine a pergunta.",
            },
        )

    answer = answer_with_citations(req.text, chunks)

    # ✅ trava por citações reais (anti-resposta genérica)
    if REQUIRE_CITATIONS:
        has_real_citation = any(
            (c.get("source_indexes") and len(c.get("source_indexes")) > 0)
            for c in (answer.get("citations") or [])
        )
        if not has_real_citation:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "NO_CITATIONS",
                    "message": "A resposta não conseguiu citar a literatura fornecida. Não vou retornar hipótese sem referência.",
                },
            )

    # monta citações ricas com metadados
    citations = []
    for c in (answer.get("citations") or []):
        srcs = []
        for idx in (c.get("source_indexes") or []):
            if isinstance(idx, int) and 0 <= idx < len(chunks):
                src = chunks[idx]
                srcs.append(
                    {
                        "source_index": idx,
                        "id": src.get("id"),
                        "book_id": src.get("book_id"),
                        "page_number": src.get("page_number"),
                        "secao_macro": src.get("secao_macro"),
                        "secao_micro": src.get("secao_micro"),
                    }
                )
        citations.append({"claim": c.get("claim"), "sources": srcs})

    return {
        "macro": out["macro"],
        "micro_selected": out["micro_selected"],
        "answer": answer,
        "citations": citations,
        "chunks": chunks,
    }

@app.post("/clinical_support", response_model=ClinicalSupportResp)
def api_clinical_support(req: ClinicalSupportReq, _: None = Depends(verify_internal_token)):
    out = retrieve_only_micro_first(req.text)
    if out.get("status") != "DECIDED":
        raise HTTPException(status_code=409, detail=out)

    chunks = out.get("chunks") or []
    if not chunks:
        raise HTTPException(status_code=404, detail="Nenhum chunk encontrado. Verifique embeddings e RPCs.")

    data = generate_clinical_support(
        user_text=req.text,
        macro=out["macro"],
        micro_selected=out.get("micro_selected") or [],
        micros=out.get("micro_candidates") or [],
        chunks=chunks,
    )

    # força coerência com seu roteamento
    data["macro"] = out["macro"]
    data["micro"] = (out.get("micro_selected") or [""])[0]

    return data
