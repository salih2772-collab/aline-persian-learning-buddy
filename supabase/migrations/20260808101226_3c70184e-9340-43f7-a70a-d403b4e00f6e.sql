GRANT INSERT, UPDATE ON public.book_pages TO anon;
CREATE POLICY "Anyone can add book pages" ON public.book_pages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update book pages" ON public.book_pages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);