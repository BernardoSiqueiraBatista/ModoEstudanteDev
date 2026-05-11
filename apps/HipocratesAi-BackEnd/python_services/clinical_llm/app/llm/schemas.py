from app.config import ALLOWED_MACRO

MACRO_CLASSIFY_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "top3": {
            "type": "array",
            "minItems": 3,
            "maxItems": 3,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "macro": {"type": "string", "enum": ALLOWED_MACRO},
                    "score": {"type": "number", "minimum": 0, "maximum": 1},
                },
                "required": ["macro", "score"],
            },
        },
        "notes": {"type": "string"},
    },
    "required": ["top3", "notes"],
}

CHECKLIST_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "question": {"type": "string"},
        "options": {"type": "array", "minItems": 2, "maxItems": 6, "items": {"type": "string"}},
        "why_it_matters": {"type": "string"},
    },
    "required": ["question", "options", "why_it_matters"],
}


CLINICAL_SCHEMA = {
  "type": "object",
  "additionalProperties": False,
  "properties": {
    "macro": {"type": "string"},
    "micro": {"type": "string"},
    "differential": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "dx": {"type": "string"},
          "priority": {"type": "string", "enum": ["alta", "media", "baixa"]},
          "rationale": {"type": "string"},
          "evidence_chunk_ids": {"type": "array", "items": {"type": "string"}},
          "support_level": {"type": "string", "enum": ["evidencia", "geral"]}
        },
        "required": ["dx", "priority", "rationale", "evidence_chunk_ids", "support_level"]
      }
    },
    "checklist_questions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "question": {"type": "string"},
          "why": {"type": "string"},
          "priority": {"type": "string", "enum": ["alta", "media", "baixa"]},
          "evidence_chunk_ids": {"type": "array", "items": {"type": "string"}},
          "support_level": {"type": "string", "enum": ["evidencia", "geral"]}
        },
        "required": ["question", "why", "priority", "evidence_chunk_ids", "support_level"]
      }
    },
    "red_flags": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "flag": {"type": "string"},
          "why": {"type": "string"},
          "action": {"type": "string"},
          "priority": {"type": "string", "enum": ["alta", "media", "baixa"]},
          "evidence_chunk_ids": {"type": "array", "items": {"type": "string"}},
          "support_level": {"type": "string", "enum": ["evidencia", "geral"]}
        },
        "required": ["flag", "why", "action", "priority", "evidence_chunk_ids", "support_level"]
      }
    },
    "next_steps_suggested": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "step": {"type": "string"},
          "why": {"type": "string"},
          "evidence_chunk_ids": {"type": "array", "items": {"type": "string"}},
          "support_level": {"type": "string", "enum": ["evidencia", "geral"]}
        },
        "required": ["step", "why", "evidence_chunk_ids", "support_level"]
      }
    },
    "confidence": {"type": "number"},
    "limits": {"type": "string"}
  },
  "required": ["macro", "micro", "differential", "checklist_questions", "red_flags", "next_steps_suggested", "confidence", "limits"]
}


# RAG: resposta estruturada + citações por índice de fonte
RAG_ANSWER_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "hipotese_principal": {"type": "string"},
        "diferenciais": {"type": "array", "items": {"type": "string"}},
        "exames_sugeridos": {"type": "array", "items": {"type": "string"}},
        "red_flags": {"type": "array", "items": {"type": "string"}},
        "conduta_inicial": {"type": "array", "items": {"type": "string"}},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "claim": {"type": "string"},
                    "source_indexes": {"type": "array", "items": {"type": "integer", "minimum": 0}},
                },
                "required": ["claim", "source_indexes"],
            },
        },
        "limites_da_literatura": {"type": "string"},
    },
    "required": [
        "hipotese_principal",
        "diferenciais",
        "exames_sugeridos",
        "red_flags",
        "conduta_inicial",
        "citations",
        "limites_da_literatura",
    ],
}
