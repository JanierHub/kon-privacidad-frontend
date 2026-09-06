-- =============================================
-- Kon-Privacidad — Avatar storage + column
-- =============================================
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================

-- 1. avatar_url column on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- 2. Public avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies
-- NOTE: storage.foldername includes the bucket as first element,
-- so the user folder is element [2] for paths like avatars/<uid>/<file>.
CREATE POLICY "Avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: authenticated upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Avatars: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Avatars: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);