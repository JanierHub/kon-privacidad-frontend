-- =============================================
-- Agregar columna last_sign_in (opcional)
-- =============================================
-- Ejecuta esto en Supabase → SQL Editor
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_sign_in TEXT;