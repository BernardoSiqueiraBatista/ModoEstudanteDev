from __future__ import annotations
from typing import Optional, Dict, Any, List
from openai import OpenAI
from app.config import OPENAI_API_KEY, EMBED_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)

def embed_text(text: str) -> List[float]:
    r = client.embeddings.create(model=EMBED_MODEL, input=text)
    return r.data[0].embedding

def llm_answer(model: str, input_text: str, json_schema_format: Optional[Dict[str, Any]] = None) -> str:
    kwargs: Dict[str, Any] = dict(model=model, input=input_text)
    if json_schema_format is not None:
        kwargs["text"] = {"format": json_schema_format}
    resp = client.responses.create(**kwargs)
    return resp.output_text
