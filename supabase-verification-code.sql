-- =============================================
-- Kon-Privacidad — Email verification codes
-- =============================================
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================

CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);