import re

def normalize_ws(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\u00a0", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def truncate(s: str, max_len: int = 1800) -> str:
    if not s:
        return ""
    if len(s) <= max_len:
        return s
    return s[:max_len] + "…"
