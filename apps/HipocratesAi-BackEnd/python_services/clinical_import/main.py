from fastapi import FastAPI, UploadFile, File, HTTPException
from extractors.pdf_text import extract_pdf_text
from extractors.ocr import extract_text_with_ocr
from extractors.structured_parser import parse_patient_data

app = FastAPI()

@app.post("/import-clinical-file")
async def import_clinical_file(file: UploadFile = File(...)):
    try:
        content = await file.read()

        text = ""
        if file.filename.lower().endswith(".pdf"):
            text = extract_pdf_text(content)

        if not text or len(text.strip()) < 30:
            text = extract_text_with_ocr(content, file.filename)

        result = parse_patient_data(text)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
