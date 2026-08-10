-- Lock all app tables down to server-side (service_role) access only.
DROP POLICY IF EXISTS "Anyone can add book pages" ON public.book_pages;
DROP POLICY IF EXISTS "Anyone can read book pages" ON public.book_pages;
DROP POLICY IF EXISTS "Anyone can update book pages" ON public.book_pages;
DROP POLICY IF EXISTS "Anyone can add books" ON public.books;
DROP POLICY IF EXISTS "Anyone can read books" ON public.books;
DROP POLICY IF EXISTS "Anyone can update books" ON public.books;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can add spelling errors" ON public.spelling_errors;
DROP POLICY IF EXISTS "Anyone can read spelling errors" ON public.spelling_errors;

ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spelling_errors ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.book_pages FROM anon, authenticated;
REVOKE ALL ON public.books FROM anon, authenticated;
REVOKE ALL ON public.messages FROM anon, authenticated;
REVOKE ALL ON public.sessions FROM anon, authenticated;
REVOKE ALL ON public.spelling_errors FROM anon, authenticated;

GRANT ALL ON public.book_pages TO service_role;
GRANT ALL ON public.books TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.spelling_errors TO service_role;

-- Textbook storage: no direct client access; server code uses the service role.
DROP POLICY IF EXISTS "Anyone can read textbooks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload textbooks" ON storage.objects;