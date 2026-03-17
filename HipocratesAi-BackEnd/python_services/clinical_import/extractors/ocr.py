import io
import os
import fitz
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"


def extract_text_with_ocr(file_bytes: bytes, filename: str) -> str:
    text_parts = []

    if filename.lower().endswith(".pdf"):
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                page_text = pytesseract.image_to_string(img, lang="eng")
                text_parts.append(page_text)
    else:
        img = Image.open(io.BytesIO(file_bytes))
        text_parts.append(pytesseract.image_to_string(img, lang="eng"))

    return "\n".join(text_parts).strip()
