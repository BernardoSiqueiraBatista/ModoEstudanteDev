import re

def search(pattern: str, text: str):
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else None

def normalize_sex(value: str | None):
    if not value:
        return None

    v = value.strip().lower()

    if v in ["masculino", "m", "male"]:
        return "male"
    if v in ["feminino", "f", "female"]:
        return "female"

    return "other"

def parse_patient_data(text: str):
    full_name = search(r"nome(?:\s+completo)?[:\s]+([^\n]+)", text)
    document = search(r"(?:cpf|rg|documento)[:\s]+([^\n]+)", text)
    birth_date = search(r"data\s+de\s+nascimento[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})", text)
    sex = normalize_sex(search(r"sexo[:\s]+([^\n]+)", text))
    phone_number = search(r"(?:telefone|celular)[:\s]+([^\n]+)", text)
    insurance_provider = search(r"(?:conv[eê]nio|plano)[:\s]+([^\n]+)", text)
    insurance_number = search(r"(?:carteirinha|n[uú]mero\s+da\s+carteirinha)[:\s]+([^\n]+)", text)
    chief_complaint = search(r"(?:queixa\s+principal|diagn[oó]stico(?:\s+principal)?)[:\s]+([^\n]+)", text)
    allergies = search(r"alergias?[:\s]+([^\n]+)", text)
    current_medications = search(r"(?:medica[cç][oõ]es?\s+em\s+uso|medicamentos?\s+em\s+uso)[:\s]+([^\n]+)", text)

    return {
        "fullName": full_name or "",
        "document": document,
        "birthDate": birth_date,
        "sex": sex,
        "phoneNumber": phone_number,
        "insuranceProvider": insurance_provider,
        "insuranceNumber": insurance_number,
        "chiefComplaint": chief_complaint,
        "allergies": allergies,
        "currentMedications": current_medications,
        "notes": text[:3000] if text else None,
        "rawText": text,
    }
