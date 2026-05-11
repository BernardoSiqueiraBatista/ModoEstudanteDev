import unicodedata
import re

def fix_mojibake_if_needed(s: str) -> str:
    if not s:
        return s
    # sinais típicos de UTF-8 lido como Latin-1/Windows-1252
    if ("Ã" in s) or ("Â" in s) or ("�" in s):
        try:
            return s.encode("latin1").decode("utf-8")
        except Exception:
            # se não for mojibake reversível, não piora
            return s
    return s

def clean_text_light(s: str) -> str:
    if not s:
        return s
    s = unicodedata.normalize("NFC", s)
    s = s.replace("\u00ad", "")                 # soft hyphen
    s = re.sub(r"-\s*\n\s*", "", s)             # quebra com hífen
    s = re.sub(r"\s*\n\s*", " ", s)             # novas linhas -> espaço
    s = re.sub(r"[ \t]{2,}", " ", s)            # múltiplos espaços
    return s.strip()

def normalize_for_output(s: str) -> str:
    # ordem importa: primeiro conserta encoding, depois limpa
    return clean_text_light(fix_mojibake_if_needed(s))
