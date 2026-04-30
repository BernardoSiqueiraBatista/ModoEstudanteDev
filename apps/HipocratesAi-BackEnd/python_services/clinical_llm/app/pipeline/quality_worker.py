import os, json, time, traceback
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import psycopg
from psycopg.rows import dict_row

# Se você já usa OpenAI SDK no projeto, mantenha.
# Aqui deixo genérico; implemente call_llm_json/call_llm_text conforme seu stack.
from openai import OpenAI

EVALUATOR_VERSION = os.getenv("COG_SCORE_VERSION", "cq_v1.0")
DB_DSN = os.getenv("DATABASE_URL")  # ex: postgres://user:pass@host:5432/db
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

client = OpenAI(api_key=OPENAI_API_KEY)


@dataclass
class Library:
    macro: str
    micro: str
    red_flags: List[Dict[str, Any]]
    required_hypotheses: List[str]
    required_questions: List[str]
    required_data: List[str]
    severity_weights: Dict[str, float]


def get_conn():
    if not DB_DSN:
        raise RuntimeError("DATABASE_URL não definido")
    return psycopg.connect(DB_DSN, row_factory=dict_row)


def fetch_library(conn, macro: str, micro: str) -> Library:
    row = conn.execute(
        """
        select macro, micro, red_flags, required_hypotheses, required_questions, required_data, severity_weights
        from public.quality_checks_library
        where macro = %s and micro = %s and is_active = true
        """,
        (macro, micro)
    ).fetchone()

    if not row:
        # fallback: tenta micro='Geral' ou macro='Geral'
        row = conn.execute(
            """
            select macro, micro, red_flags, required_hypotheses, required_questions, required_data, severity_weights
            from public.quality_checks_library
            where macro = %s and micro = 'Geral' and is_active = true
            """,
            (macro,)
        ).fetchone()

    if not row:
        # último fallback: geral geral
        row = conn.execute(
            """
            select macro, micro, red_flags, required_hypotheses, required_questions, required_data, severity_weights
            from public.quality_checks_library
            where macro = 'Geral' and micro = 'Geral' and is_active = true
            """
        ).fetchone()

    if not row:
        raise RuntimeError(f"Sem biblioteca de critérios para macro={macro} micro={micro} (nem fallback).")

    return Library(
        macro=row["macro"],
        micro=row["micro"],
        red_flags=row["red_flags"] or [],
        required_hypotheses=row["required_hypotheses"] or [],
        required_questions=row["required_questions"] or [],
        required_data=row["required_data"] or [],
        severity_weights=row["severity_weights"] or {},
    )


def claim_one_job(conn) -> Optional[Dict[str, Any]]:
    # Claim simples (evita dupla execução)
    job = conn.execute(
        """
        update public.quality_job_queue
        set status = 'running',
            attempts = attempts + 1,
            locked_at = now()
        where id = (
          select id from public.quality_job_queue
          where status = 'pending'
          order by updated_at asc
          for update skip locked
          limit 1
        )
        returning *
        """
    ).fetchone()
    return job


def mark_job_done(conn, job_id: str):
    conn.execute("update public.quality_job_queue set status='done', last_error=null where id=%s", (job_id,))


def mark_job_failed(conn, job_id: str, err: str):
    conn.execute("update public.quality_job_queue set status='failed', last_error=%s where id=%s", (err[:4000], job_id))


def fetch_consultation_payload(conn, consultation_id: str) -> Dict[str, Any]:
    """
    Ajuste para seu schema real.
    Precisa retornar: doctor_id, patient_id, macro, micro, transcript_text (ou summary).
    """
    row = conn.execute(
        """
        select
          c.id as consultation_id,
          c.doctor_id,
          c.patient_id,
          c.macro as macro,
          c.micro as micro,
          t.transcript_text as transcript_text
        from public.consultations c
        left join public.consultation_transcripts t on t.consultation_id = c.id
        where c.id = %s
        """,
        (consultation_id,)
    ).fetchone()

    if not row:
        raise RuntimeError(f"Consulta {consultation_id} não encontrada.")

    if not row["macro"] or not row["micro"]:
        # se macro/micro ainda não existe no schema, substitua com sua fonte real
        raise RuntimeError("Consulta sem macro/micro. Necessário para score.")

    text = row.get("transcript_text") or ""
    if len(text.strip()) < 50:
        # Se você não tem transcrição completa, pode usar um resumo do caso.
        # Mas não deixa vazio.
        raise RuntimeError("Transcript muito curto/ausente para extrator. Forneça transcript ou summary clínico.")

    return dict(row)


# ---------------- LLM CALLS ----------------

def call_llm_json(system: str, user: str, schema_hint: str) -> Dict[str, Any]:
    """
    Retorna dict JSON. Use response_format json_schema se quiser,
    mas aqui deixo simples e robusto via 'JSON only' + validação.
    """
    resp = client.chat.completions.create(
        model=os.getenv("COG_SCORE_LLM", "gpt-4.1-mini"),
        temperature=0.2,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user + "\n\n" + schema_hint}
        ],
    )
    content = resp.choices[0].message.content or ""
    try:
        return json.loads(content)
    except Exception:
        # fallback: tenta extrair JSON entre chaves
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(content[start:end+1])
        raise RuntimeError(f"LLM não retornou JSON válido. Conteúdo: {content[:400]}")


def call_llm_text(system: str, user: str) -> str:
    resp = client.chat.completions.create(
        model=os.getenv("COG_SCORE_LLM", "gpt-4.1-mini"),
        temperature=0.3,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


# ---------------- SCORING ----------------

def compute_redflag_coverage(library: Library, extracted: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]]]:
    addressed = set((extracted.get("red_flags_addressed") or []))
    gaps = extracted.get("gaps") or []

    # pesos: se não houver, 1.0 default
    total_w = 0.0
    covered_w = 0.0

    missing_flags: List[Dict[str, Any]] = []

    for rf in library.red_flags:
        name = (rf.get("name") or rf.get("label") or "").strip()
        if not name:
            continue
        w = float(rf.get("weight") or library.severity_weights.get(name, 1.0))
        total_w += w
        if name in addressed:
            covered_w += w
        else:
            missing_flags.append({"name": name, "weight": w, "why": rf.get("why_it_matters", "")})

    coverage = (covered_w / total_w) if total_w > 0 else 1.0

    # Também incorpora gaps high ligados a red_flag
    high_gaps = [g for g in gaps if g.get("severity") == "high" and g.get("type") == "red_flag"]
    if high_gaps:
        # penaliza um pouco
        coverage = max(0.0, coverage - 0.15)

    return coverage, missing_flags


def compute_hypothesis_exploration(library: Library, extracted: Dict[str, Any]) -> Tuple[float, List[str]]:
    considered = extracted.get("considered_hypotheses") or []
    labels = set([(h.get("label") or "").strip() for h in considered if (h.get("label") or "").strip()])
    required = [h for h in library.required_hypotheses if isinstance(h, str) and h.strip()]

    if not required:
        # Se não há lista mínima, usa heurística: diversidade
        return min(1.0, len(labels) / 5.0), []

    hit = sum(1 for h in required if h in labels)
    ratio = hit / max(1, len(required))
    missing = [h for h in required if h not in labels]
    return ratio, missing


def gaps_summary(extracted: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]]]:
    gaps = extracted.get("gaps") or []
    highs = [g for g in gaps if g.get("severity") == "high"]
    meds = [g for g in gaps if g.get("severity") == "medium"]
    lows = [g for g in gaps if g.get("severity") == "low"]

    if highs:
        return "críticas", highs
    if meds or lows:
        return "leves", meds + lows
    return "nenhuma", []


def reasoning_consistency(extracted: Dict[str, Any]) -> Tuple[str, List[str]]:
    notes = extracted.get("consistency_notes") or []
    # Regra simples: se notas mencionam contradição/salto sem evidência → piora.
    text = " ".join([str(n).lower() for n in notes])
    flags = []
    if "contradi" in text or "incoer" in text or "sem evid" in text or "salto" in text:
        flags = notes

    if not notes:
        return "consistente", []
    if flags and len(flags) >= 2:
        return "incoerente", notes
    return "pontos_a_revisar", notes


def map_redflag_status(coverage: float, high_risk_gaps: List[Dict[str, Any]]) -> str:
    if high_risk_gaps:
        # mesmo que cobertura seja alta, gap high puxa para baixo
        if coverage >= 0.85:
            return "parcial"
        return "revisar"
    if coverage >= 0.85:
        return "adequada"
    if coverage >= 0.65:
        return "parcial"
    return "revisar"


def map_hypothesis_status(ratio: float, total_hypotheses: int) -> str:
    # ratio é cobertura do essencial; total dá noção de diversidade
    if ratio >= 0.80 and total_hypotheses >= 3:
        return "ampla"
    if ratio >= 0.50:
        return "moderada"
    return "limitada"


# ---------------- PIPELINE ----------------

EXTRACTOR_SYSTEM = """Você é um assistente clínico que extrai estrutura cognitiva PÓS-CONSULTA.
Regras:
- Retorne APENAS JSON válido.
- Não invente dados que não estejam no texto.
- Seja objetivo e estruturado.
"""

EXTRACTOR_SCHEMA_HINT = """Formato exato (JSON):
{
  "considered_hypotheses": [
    { "label": "string", "status": "considered|prioritized|discarded|confirmed", "confidence": 0.0, "evidence": ["string"], "missing_info": ["string"] }
  ],
  "red_flags_addressed": ["string"],
  "questions_asked": ["string"],
  "data_observed": ["string"],
  "gaps": [
    { "type": "red_flag|data|question|hypothesis", "item": "string", "severity": "low|medium|high", "why_it_matters": "string" }
  ],
  "consistency_notes": ["string"]
}
"""

NARRATOR_SYSTEM = """Você gera feedback educativo PÓS-CONSULTA para uso privado do médico.
Regras:
- Não dê nota numérica.
- Não use tom julgador.
- Seja curto, prático e específico.
- Estrutura: Pontos fortes / Oportunidades / Sugestões objetivas.
"""

def upsert_quality(conn, payload: Dict[str, Any], quality_vector: Dict[str, Any], quality_summary: Dict[str, Any],
                   narrative: str, high_risk_gaps: List[Dict[str, Any]]):

    conn.execute(
        """
        insert into public.consultation_quality
          (consultation_id, doctor_id, patient_id, evaluator_version,
           quality_vector, quality_summary, narrative_feedback, high_risk_gaps)
        values
          (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, %s::jsonb)
        on conflict (consultation_id, evaluator_version)
        do update set
          quality_vector = excluded.quality_vector,
          quality_summary = excluded.quality_summary,
          narrative_feedback = excluded.narrative_feedback,
          high_risk_gaps = excluded.high_risk_gaps,
          updated_at = now()
        """,
        (
            payload["consultation_id"], payload["doctor_id"], payload["patient_id"], EVALUATOR_VERSION,
            json.dumps(quality_vector, ensure_ascii=False),
            json.dumps(quality_summary, ensure_ascii=False),
            narrative,
            json.dumps(high_risk_gaps, ensure_ascii=False),
        )
    )


def run_one(conn, job: Dict[str, Any]):
    consultation_id = job["consultation_id"]

    # Se já existe com mesma versão, finaliza job (idempotência)
    exists = conn.execute(
        """
        select 1 from public.consultation_quality
        where consultation_id = %s and evaluator_version = %s
        """,
        (consultation_id, EVALUATOR_VERSION)
    ).fetchone()
    if exists:
        mark_job_done(conn, job["id"])
        return

    payload = fetch_consultation_payload(conn, consultation_id)
    library = fetch_library(conn, payload["macro"], payload["micro"])

    # 1) Extrator
    extractor_user = f"""
Macro: {payload['macro']}
Micro: {payload['micro']}

Texto da consulta (transcrição ou resumo fiel):
{payload['transcript_text']}
""".strip()

    extracted = call_llm_json(EXTRACTOR_SYSTEM, extractor_user, EXTRACTOR_SCHEMA_HINT)

    # 2) Métricas internas
    red_cov, missing_flags = compute_redflag_coverage(library, extracted)
    hyp_ratio, missing_required_hyp = compute_hypothesis_exploration(library, extracted)

    lacunas_status, lacunas_list = gaps_summary(extracted)
    high_risk_gaps = [g for g in lacunas_list if g.get("severity") == "high"]

    coer_status, coher_notes = reasoning_consistency(extracted)

    hypotheses_total = len(extracted.get("considered_hypotheses") or [])
    red_status = map_redflag_status(red_cov, high_risk_gaps)
    hyp_status = map_hypothesis_status(hyp_ratio, hypotheses_total)

    quality_vector = {
        "red_flag_coverage": round(red_cov, 4),
        "required_hypotheses_coverage": round(hyp_ratio, 4),
        "hypotheses_total": hypotheses_total,
        "gaps_high": len([g for g in (extracted.get("gaps") or []) if g.get("severity") == "high"]),
        "gaps_medium": len([g for g in (extracted.get("gaps") or []) if g.get("severity") == "medium"]),
        "gaps_low": len([g for g in (extracted.get("gaps") or []) if g.get("severity") == "low"]),
    }

    quality_summary = {
        "macro": payload["macro"],
        "micro": payload["micro"],
        "dimensions": {
            "cobertura_de_seguranca": red_status,
            "exploracao_de_hipoteses": hyp_status,
            "lacunas_informacionais": lacunas_status,
            "coerencia_do_raciocinio": coer_status,
        },
        "missing_red_flags_top": missing_flags[:5],
        "missing_required_hypotheses": missing_required_hyp[:10],
        "gaps": (extracted.get("gaps") or [])[:20],
        "consistency_notes": coher_notes[:10],
    }

    # 3) Narrativa (relatório)
    narrator_user = f"""
Gere feedback educativo privado do médico com base no seguinte resumo estruturado:

{json.dumps(quality_summary, ensure_ascii=False, indent=2)}

Requisitos:
- Sem nota numérica.
- Seja específico (cite lacunas e sugestões objetivas).
- Estrutura:
  1) Pontos fortes (bullets)
  2) Oportunidades (bullets)
  3) Sugestões objetivas (bullets)
""".strip()

    narrative = call_llm_text(NARRATOR_SYSTEM, narrator_user)

    # 4) Persistência
    upsert_quality(conn, payload, quality_vector, quality_summary, narrative, high_risk_gaps)

    # 5) Finaliza job
    mark_job_done(conn, job["id"])


def main_loop():
    poll = float(os.getenv("COG_SCORE_POLL_SECONDS", "1.5"))
    while True:
        try:
            with get_conn() as conn:
                with conn.transaction():
                    job = claim_one_job(conn)
                    if not job:
                        time.sleep(poll)
                        continue
                    try:
                        run_one(conn, job)
                    except Exception as e:
                        err = f"{e}\n{traceback.format_exc()}"
                        mark_job_failed(conn, job["id"], err)
        except Exception:
            # falha de infra; espera e tenta de novo
            time.sleep(2.0)


if __name__ == "__main__":
    main_loop()