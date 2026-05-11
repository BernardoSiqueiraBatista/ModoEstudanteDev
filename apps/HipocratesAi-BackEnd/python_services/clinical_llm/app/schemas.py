from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from typing import Literal

class MacroScore(BaseModel):
    macro: str
    score: float

class ClassifyMacroReq(BaseModel):
    text: str
    allowed_macro: List[str] = Field(default_factory=list)

class ClassifyMacroResp(BaseModel):
    final: Optional[str]
    status: str  # DECIDED | PENDING
    top3: List[MacroScore]
    reason: str

class ChecklistQuestionReq(BaseModel):
    text: str
    top3: List[Dict[str, Any]]

class ChecklistQuestionResp(BaseModel):
    question: str
    options: List[str]
    why_it_matters: str

class RetrieveReq(BaseModel):
    text: str

class SourceChunk(BaseModel):
    id: str
    book_id: Optional[str] = None
    page_number: Optional[int] = None
    chunk_index: Optional[int] = None
    secao_macro: Optional[str] = None
    secao_micro: Optional[str] = None
    conteudo: str
    created_at: Optional[str] = None
    score: float

class RetrieveResp(BaseModel):
    macro: str
    micro_candidates: List[Dict[str, Any]]
    micro_selected: List[str]
    chunks: List[SourceChunk]

class AnswerRagReq(BaseModel):
    text: str

class AnswerRagResp(BaseModel):
    macro: str
    micro_selected: List[str]
    answer: Dict[str, Any]
    citations: List[Dict[str, Any]]
    chunks: List[SourceChunk]


class ClinicalSupportReq(BaseModel):
    text: str


class DifferentialItem(BaseModel):
    dx: str
    priority: Literal["alta", "media", "baixa"]
    rationale: str
    evidence_chunk_ids: List[str] = Field(default_factory=list)
    support_level: Literal["evidencia", "geral"]


class ClinicalChecklistItem(BaseModel):
    question: str
    why: str
    priority: Literal["alta", "media", "baixa"]
    evidence_chunk_ids: List[str] = Field(default_factory=list)
    support_level: Literal["evidencia", "geral"]


class RedFlagItem(BaseModel):
    flag: str
    why: str
    action: str
    priority: Literal["alta", "media", "baixa"]
    evidence_chunk_ids: List[str] = Field(default_factory=list)
    support_level: Literal["evidencia", "geral"]


class NextStepItem(BaseModel):
    step: str
    why: str
    evidence_chunk_ids: List[str] = Field(default_factory=list)
    support_level: Literal["evidencia", "geral"]


class ClinicalSupportResp(BaseModel):
    macro: str
    micro: str
    differential: List[DifferentialItem]
    checklist_questions: List[ClinicalChecklistItem]
    red_flags: List[RedFlagItem]
    next_steps_suggested: List[NextStepItem]
    confidence: float = Field(ge=0.0, le=1.0)
    limits: str
