-- Migration: Add type, description and notes columns to appointments table
-- Run this in Supabase SQL Editor against the 'app' schema

ALTER TABLE app.appointments
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'consulta'
    CHECK (type IN ('consulta', 'urgencia', 'video', 'compromisso')),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS notes text;
