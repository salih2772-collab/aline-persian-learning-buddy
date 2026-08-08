CREATE TABLE public.book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter text NOT NULL,
  page text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book, chapter, page)
);
GRANT SELECT ON public.book_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_pages TO authenticated;
GRANT ALL ON public.book_pages TO service_role;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read book pages" ON public.book_pages FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT '',
  content_type text NOT NULL DEFAULT 'story',
  book text,
  chapter text,
  page text,
  moral_topic text,
  mood_sticker text,
  mood_reason text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sessions" ON public.sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create sessions" ON public.sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender text NOT NULL,
  phase text NOT NULL DEFAULT 'greeting',
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_session_id_created_at_idx ON public.messages (session_id, created_at);
GRANT SELECT, INSERT ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create messages" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);