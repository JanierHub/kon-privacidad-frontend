-- =============================================
-- Kon-Privacidad — Supabase Schema
-- =============================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  is_restricted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  professor TEXT DEFAULT '',
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  classroom TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles: users see all, only self can update
CREATE POLICY "Profiles: everyone can read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: self update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: everyone sees non-hidden; only author or admin can modify
CREATE POLICY "Posts: visible when not hidden" ON posts
  FOR SELECT USING (is_hidden = false OR auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Posts: author can insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts: author or admin can update" ON posts FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Posts: author or admin can delete" ON posts FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Events: everyone reads, admin creates/modifies
CREATE POLICY "Events: everyone can read" ON events FOR SELECT USING (true);
CREATE POLICY "Events: admin insert" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Events: admin update" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Events: admin delete" ON events FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Schedule: everyone reads, admin manages
CREATE POLICY "Schedule: everyone can read" ON schedule FOR SELECT USING (true);
CREATE POLICY "Schedule: admin insert" ON schedule FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Schedule: admin update" ON schedule FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Schedule: admin delete" ON schedule FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Alerts: everyone reads, admin manages
CREATE POLICY "Alerts: everyone can read" ON alerts FOR SELECT USING (true);
CREATE POLICY "Alerts: admin insert" ON alerts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Alerts: admin update" ON alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Alerts: admin delete" ON alerts FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Comments: everyone reads, author inserts/updates/deletes
CREATE POLICY "Comments: everyone can read" ON comments FOR SELECT USING (true);
CREATE POLICY "Comments: author can insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments: author can update" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Comments: author or admin can delete" ON comments FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- Sample data (optional — for demo/testing)
-- =============================================

-- Get admin user id (adjust if needed)
-- INSERT INTO posts (user_id, title, content) VALUES
--   ((SELECT id FROM profiles WHERE email = 'admin@konradlorenz.edu.co'), 'Bienvenidos a Kon-Privacidad', 'Esta es la primera publicación de nuestra red social privada universitaria. ¡Bienvenidos todos los konradistas!');

-- INSERT INTO events (title, description, event_date, event_time, location) VALUES
--   ('Feria de Empleo', 'Encuentra tu oportunidad profesional en la feria de empleo de la universidad.', '2026-09-15', '09:00 - 17:00', 'Auditorio Central'),
--   ('Charla de Ciberseguridad', 'Aprende a proteger tu información personal en el entorno digital.', '2026-09-20', '14:00 - 16:00', 'Salón 201'),
--   ('Congreso Konrad', 'Congreso anual de la fundación universitaria.', '2026-10-05', '08:00 - 18:00', 'Campus Principal');

-- INSERT INTO schedule (subject, professor, day_of_week, start_time, end_time, classroom) VALUES
--   ('Base de Datos', 'Dr. García', 'Lunes', '08:00', '10:00', 'Lab 301'),
--   ('Redes', 'Ing. López', 'Martes', '10:00', '12:00', 'Salón 102'),
--   ('Programación Web', 'Dra. Martínez', 'Miércoles', '14:00', '16:00', 'Lab 205');