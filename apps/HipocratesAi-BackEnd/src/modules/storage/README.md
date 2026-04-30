# Storage Module

This module handles file uploads to Supabase Storage.

## Required Bucket Setup (Manual)

A bucket named **`patient-documents`** must be created manually in the Supabase dashboard with the following configuration:

- **Public:** false
- **File size limit:** 10MB
- **Allowed MIME types:**
  - `application/pdf`
  - `image/jpeg`
  - `image/png`

## Endpoints

- `POST /storage/patient-documents` — uploads a file (multipart `file`) and returns `{ path, signedUrl }` (signed URL valid 1h).
- `POST /storage/extract-pdf` — accepts a PDF (multipart `file`) and returns extracted patient data via heuristic regex.
