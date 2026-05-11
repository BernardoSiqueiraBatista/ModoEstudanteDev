import os
from dotenv import load_dotenv

load_dotenv()

ALLOWED_MACRO = [
    "Respiratório",
    "Cardiovascular",
    "Gastroenterologia",
    "Hepatologia",
    "Nefro/Urologia",
    "Endocrinologia",
    "Neurologia",
    "Infectologia",
    "Hematologia/Oncologia",
    "Reumatologia/Imunologia",
    "Dermatologia",
    "Otorrinolaringologia",
    "Ginecologia/Obstetrícia",
    "Pediatria",
    "Emergências/Trauma",
    "Preventiva/APS",
    "Psiquiatria",
    "Farmacologia/Terapêutica",
    "Diagnóstico/Exames",
    "Procedimentos",
    "Ética/Administração",
    "Geral",
]

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL_CLASSIFY = os.getenv("OPENAI_MODEL_CLASSIFY", "gpt-4o-mini")
OPENAI_MODEL_ANSWER = os.getenv("OPENAI_MODEL_ANSWER", "gpt-4o-mini")
OPENAI_MODEL_TRANSCRIBE = os.getenv("OPENAI_MODEL_TRANSCRIBE", "whisper-1")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Embeddings (HNSW <= 2000 dims, então 1536)
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")
EMBED_DIM = int(os.getenv("EMBED_DIM", "1536"))

# Macro decision thresholds
DECIDE_MIN_SCORE = float(os.getenv("DECIDE_MIN_SCORE", "0.60"))
DECIDE_MIN_GAP = float(os.getenv("DECIDE_MIN_GAP", "0.06"))
AVOID_GERAL_GAP = float(os.getenv("AVOID_GERAL_GAP", "0.03"))

# Retrieval tuning
RETRIEVE_K_STAGE1 = int(os.getenv("RETRIEVE_K_STAGE1", "30"))


RPC_NAME = os.getenv("RPC_NAME", "match_medical_chunks_filtered")


MIN_SIMILARITY_SCORE = float(os.getenv("MIN_SIMILARITY_SCORE", "0.55"))
REQUIRE_CITATIONS = os.getenv("REQUIRE_CITATIONS", "true").lower() == "true"


RETRIEVE_K_STAGE2 = int(os.getenv("RETRIEVE_K_STAGE2", "30"))
MICRO_CANDIDATES_TOPN = int(os.getenv("MICRO_CANDIDATES_TOPN", "6"))
MICRO_SELECT_TOPN = int(os.getenv("MICRO_SELECT_TOPN", "1"))
