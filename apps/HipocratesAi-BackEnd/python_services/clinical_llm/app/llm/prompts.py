from app.config import ALLOWED_MACRO
from app.utils.text import truncate, normalize_ws
import json

def macro_classify_prompt(text: str) -> str:
    text = normalize_ws(text)
    return f"""
Você é um classificador clínico.
Dado um texto (fala/transcrição), retorne as 3 melhores secao_macro.

Regras:
- As macros permitidas são exatamente: {ALLOWED_MACRO}
- Evite "Geral" a menos que não haja informação clínica suficiente.
- Score entre 0 e 1.
- Retorne top3 ordenado por score (maior primeiro).

Texto:
{text}
""".strip()

def clinical_prompt(user_text: str, macro: str, chosen_micro: str, micro_candidates, evidence: str) -> str:
    return f"""
            Você é um assistente clínico para apoio ao raciocínio diferencial e triagem.
            Regras:
            - Use APENAS as evidências fornecidas em EVIDÊNCIAS quando for possível.
            - Se algo não estiver sustentado nas evidências, marque como "geral".
            - Não prescreva tratamento. Foque em: hipóteses, perguntas, sinais de alerta e próximos passos de avaliação.
            - Responda em JSON estrito no schema solicitado. Não inclua texto fora do JSON.

            QUEIXA:
            {user_text}

            ROTEAMENTO:
            macro: {macro}
            micro_escolhido: {chosen_micro}

            MICRO_CANDIDATES (top):
            {json.dumps(micro_candidates, ensure_ascii=False)}

            EVIDÊNCIAS:
            {evidence}

            Tarefa:
            1) Gere 5–10 hipóteses diferenciais plausíveis, priorizando as mais prováveis.
            2) Gere 10–18 perguntas de checklist para diferenciar hipóteses.
            3) Liste 5–10 red flags com ação sugerida (ex.: procurar urgência).
            4) Sugira 3–6 próximos passos de avaliação (exames/avaliação clínica) sem prescrever tratamento.

            Cada item deve, quando possível, citar "evidence_chunk_ids" com chunk_id(s) do bloco de evidência.
            """.strip()


def checklist_prompt(text: str, top3) -> str:
    text = normalize_ws(text)
    return f"""
Gere UMA pergunta de checklist diferencial para reduzir ambiguidade entre as macros do top3.
A pergunta deve separar bem as 2 primeiras macros.

Retorne:
- question
- options (2 a 6)
- why_it_matters

Texto:
{text}

Top3 (macro/score):
{top3}
""".strip()

def rag_prompt(user_text: str, sources_block: str) -> str:
    user_text = normalize_ws(user_text)
    sources_block = truncate(sources_block, 12000)
    return f"""
Você é um assistente clínico.
Responda APENAS com base nas "FONTES" fornecidas.
Se algo não estiver explícito nas fontes, diga claramente em "limites_da_literatura".

Instruções:
- Não invente guidelines, doses, valores de referência ou condutas não presentes nas fontes.
- Gere uma resposta estruturada.
- Para cada afirmação importante, inclua uma citação apontando para os índices das fontes (source_indexes).
- Use source_indexes como números (0..N-1).

PERGUNTA / CONTEXTO:
{user_text}

FONTES:
{sources_block}
""".strip()
