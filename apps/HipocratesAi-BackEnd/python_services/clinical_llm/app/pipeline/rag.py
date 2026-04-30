import json
from app.config import OPENAI_MODEL_ANSWER
from app.llm.client import llm_answer
from app.llm.prompts import rag_prompt
from app.llm.schemas import RAG_ANSWER_SCHEMA
from app.utils.text import truncate

def build_sources_block(chunks: list[dict]) -> str:
    blocks = []
    for i, c in enumerate(chunks):
        blocks.append(
            f"""[SOURCE {i}]
id: {c.get('id')}
book_id: {c.get('book_id')}
page_number: {c.get('page_number')}
chunk_index: {c.get('chunk_index')}
secao_macro: {c.get('secao_macro')}
secao_micro: {c.get('secao_micro')}
created_at: {c.get('created_at')}

conteudo:
{truncate(c.get('conteudo', ''), 2200)}
"""
        )
    return "\n".join(blocks)

def answer_with_citations(user_text: str, chunks: list[dict]) -> dict:
    sources_block = build_sources_block(chunks)

    out = llm_answer(
        model=OPENAI_MODEL_ANSWER,
        input_text=rag_prompt(user_text, sources_block),
        json_schema_format={
            "type": "json_schema",
            "name": "rag_clinical_answer",
            "schema": RAG_ANSWER_SCHEMA,
        },
    )
    return json.loads(out)
