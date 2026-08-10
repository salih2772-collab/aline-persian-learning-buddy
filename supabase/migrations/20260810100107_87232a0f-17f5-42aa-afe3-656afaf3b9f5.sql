ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS character_choice text,
  ADD COLUMN IF NOT EXISTS colour_choice text;