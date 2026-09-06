-- =============================================
-- Kon-Privacidad — Datos de Ejemplo
-- =============================================
-- Ejecuta esto DESPUÉS de haber corrido supabase-schema.sql
-- Reemplaza el user_id con el ID de tu usuario admin si es diferente.
-- =============================================

-- 1. Publicaciones de ejemplo
INSERT INTO posts (user_id, title, content, is_pinned) VALUES
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Bienvenidos a Kon-Privacidad', 'Esta es nuestra red social privada universitaria. Aquí podrás compartir publicaciones, eventos y noticias de la comunidad Konrad Lorenz. ¡Bienvenido Konradista! 🎉', true),
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Convocatoria Semilleros 2026', 'Se abren las inscripciones para los semilleros de investigación. No te pierdas esta oportunidad de crecimiento académico. Inscripciones abiertas hasta el 30 de septiembre.', false),
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Hackathon Konrad 2026', 'Participa en el hackathon universitario del 15 al 17 de octubre. Forma tu equipo de 4 personas y presenta tu propuesta de innovación tecnológica. 🏆', false),
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Biblioteca: Nuevos Horarios', 'La biblioteca central amplía sus horarios para el periodo de parciales. De lunes a viernes de 7:00 a.m. a 9:00 p.m. y sábados de 8:00 a.m. a 2:00 p.m.', false),
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Taller de Emprendimiento', 'El centro de emprendimiento ofrece un taller gratuito de modelado de negocios. Cupos limitados. Inscríbete en la oficina de bienestar universitario.', false);

-- 2. Noticias de ejemplo
INSERT INTO posts (user_id, title, content, is_pinned) VALUES
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'La Konrad obtaining ABAI Accreditation', 'La Fundación Universitaria Konrad Lorenz obtuvo la acreditación internacional ABAI, un hito que posiciona a la universidad a nivel mundial.', false),
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Nuevos Programas de Posgrado', 'Se anunciaron tres nuevos programas de posgrado: Maestría en Ciencia de Datos, Especialización en Ciberseguridad y Doctorado en Ingeniería.', false),
  ('d3855a13-f174-4e7d-983e-1df272373ad2', 'Campeonato Interfacultades', 'Las facultades de Ingeniería y Ciencias Sociales se enfrentan en el campeonato interfacultades de este semestre. ¡Apoya a tu facultad! ⚽', false);

-- 3. Eventos de ejemplo
INSERT INTO events (title, description, event_date, event_time, location, created_by) VALUES
  ('Feria de Empleo 2026', 'Encuentra tu oportunidad profesional en la feria de empleo con más de 30 empresas participantes.', '2026-09-15', '09:00 - 17:00', 'Auditorio Central', 'd3855a13-f174-4e7d-983e-1df272373ad2'),
  ('Charla de Ciberseguridad', 'Aprende a proteger tu información personal en el entorno digital. Certificado de asistencia.', '2026-09-20', '14:00 - 16:00', 'Salón 201', 'd3855a13-f174-4e7d-983e-1df272373ad2'),
  ('Congreso Konrad 2026', 'Congreso anual de la fundación universitaria. Investigadores nacionales e internacionales.', '2026-10-05', '08:00 - 18:00', 'Campus Principal', 'd3855a13-f174-4e7d-983e-1df272373ad2'),
  ('Taller de Oratoria', 'Desarrolla tus habilidades de comunicación y presentación pública. Taller práctico de 4 horas.', '2026-09-25', '10:00 - 14:00', 'Sala de Conferencias', 'd3855a13-f174-4e7d-983e-1df272373ad2'),
  ('Noche de Talento', 'Show artístico estudiantile: música, teatro, danza y poesía. ¡No te lo pierdas! 🎭🎵', '2026-10-12', '18:00 - 22:00', 'Auditorio Central', 'd3855a13-f174-4e7d-983e-1df272373ad2');

-- 4. Horario de ejemplo
INSERT INTO schedule (subject, professor, day_of_week, start_time, end_time, classroom) VALUES
  ('Base de Datos', 'Dr. García', 'Lunes', '08:00', '10:00', 'Lab 301'),
  ('Redes de Computadores', 'Ing. López', 'Martes', '10:00', '12:00', 'Salón 102'),
  ('Programación Web', 'Dra. Martínez', 'Miércoles', '14:00', '16:00', 'Lab 205'),
  ('Inteligencia Artificial', 'Dr. Rodríguez', 'Jueves', '08:00', '10:00', 'Lab 401'),
  ('Inglés Técnico', 'Prof. Smith', 'Viernes', '10:00', '12:00', 'Salón 305'),
  ('Ética Profesional', 'Dra. Herrera', 'Lunes', '14:00', '16:00', 'Salón 103'),
  ('Matemáticas Discretas', 'Dr. Ramírez', 'Miércoles', '08:00', '10:00', 'Salón 201'),
  ('Desarrollo Móvil', 'Ing. Torres', 'Viernes', '14:00', '16:00', 'Lab 301');

-- 5. Alertas de ejemplo
INSERT INTO alerts (title, body, priority) VALUES
  ('Corte de agua', 'Habrá corte de agua en el campus el miércoles 10 de septiembre de 8:00 a.m. a 2:00 p.m.', 'high'),
  ('Inscripciones abiertas', 'Las inscripciones para el segundo semestre 2026 están abiertas hasta el 20 de septiembre.', 'normal'),
  ('Mantenimiento plataforma', 'La plataforma académica estará en mantenimiento el sábado 13 de septiembre.', 'low');