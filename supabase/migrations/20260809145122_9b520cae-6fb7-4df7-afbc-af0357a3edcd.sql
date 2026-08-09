ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS quiz_correct integer,
  ADD COLUMN IF NOT EXISTS quiz_total integer,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;