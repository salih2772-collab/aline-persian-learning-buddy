-- 1. children
CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  name text NOT NULL,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents manage their own children" ON public.children
  FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX children_parent_id_idx ON public.children(parent_id);

-- 2. ownership columns
ALTER TABLE public.sessions ADD COLUMN parent_id uuid;
ALTER TABLE public.sessions ADD COLUMN child_id uuid REFERENCES public.children(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN parent_id uuid;
ALTER TABLE public.spelling_errors ADD COLUMN parent_id uuid;
CREATE INDEX sessions_parent_id_idx ON public.sessions(parent_id);
CREATE INDEX sessions_child_id_idx ON public.sessions(child_id);
CREATE INDEX messages_parent_id_idx ON public.messages(parent_id);
CREATE INDEX spelling_errors_parent_id_idx ON public.spelling_errors(parent_id);

-- 3. per-parent access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spelling_errors TO authenticated;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.spelling_errors TO service_role;

CREATE POLICY "Parents manage their own sessions" ON public.sessions
  FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents manage their own messages" ON public.messages
  FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents manage their own spelling records" ON public.spelling_errors
  FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- 4. shared national textbooks: readable by any signed-in parent, writable only server-side
GRANT SELECT ON public.book_pages TO authenticated;
GRANT SELECT ON public.books TO authenticated;
GRANT ALL ON public.book_pages TO service_role;
GRANT ALL ON public.books TO service_role;
CREATE POLICY "Signed-in parents can read shared textbook pages" ON public.book_pages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in parents can read shared books" ON public.books
  FOR SELECT TO authenticated USING (true);