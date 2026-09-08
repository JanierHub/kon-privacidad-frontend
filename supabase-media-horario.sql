
-- =============================================
-- Kon-Privacidad — Media en publicaciones + imagen de horario
-- =============================================
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================

-- =============================================
-- 1. Posts: columns para foto/video
-- =============================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video') OR media_type IS NULL);

-- =============================================
-- 2. Bucket público para fotos/videos de posts
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-media', 'posts-media', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública
CREATE POLICY "Posts-media: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts-media');

-- Subida: cualquier usuario autenticado en su propia carpeta (<uid>/<file>)
CREATE POLICY "Posts-media: authenticated upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Posts-media: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'posts-media' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Posts-media: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'posts-media' AND (storage.foldername(name))[2] = auth.uid()::text);

-- =============================================
-- 3. Bucket público para la imagen del horario
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-images', 'schedule-images', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública
CREATE POLICY "Schedule-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedule-images');

-- Subida: solo administradores
CREATE POLICY "Schedule-images: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'schedule-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Schedule-images: admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'schedule-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Schedule-images: admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'schedule-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- 4. Tabla app_settings: guarda la imagen del horario
-- =============================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  schedule_image_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Todos leen
CREATE POLICY "Settings: everyone can read" ON app_settings FOR SELECT USING (true);

-- Solo admin escribe
CREATE POLICY "Settings: admin insert" ON app_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Settings: admin update" ON app_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Valor inicial vacío
INSERT INTO app_settings (key, schedule_image_url)
VALUES ('schedule_image', '')
ON CONFLICT (key) DO NOTHING;
