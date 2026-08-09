CREATE TABLE public.spelling_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  child_name text NOT NULL DEFAULT '',
  written_form text NOT NULL,
  correct_form text NOT NULL,
  error_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.spelling_errors TO anon, authenticated;
GRANT ALL ON public.spelling_errors TO service_role;

ALTER TABLE public.spelling_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read spelling errors" ON public.spelling_errors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add spelling errors" ON public.spelling_errors FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_spelling_errors_created_at ON public.spelling_errors (created_at DESC);
CREATE INDEX idx_spelling_errors_session ON public.spelling_errors (session_id);