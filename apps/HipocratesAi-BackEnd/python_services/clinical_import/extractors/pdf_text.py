import fitz

def extract_pdf_text(file_bytes: bytes) -> str:
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text("text"))

    return "\n".join(text_parts).strip()
