CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  page_offset integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.books TO anon, authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read books" ON public.books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add books" ON public.books FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update books" ON public.books FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.books (name, page_offset) VALUES ('ریاضی دوم دبستان', 6), ('قرآن دوم دبستان', 10);