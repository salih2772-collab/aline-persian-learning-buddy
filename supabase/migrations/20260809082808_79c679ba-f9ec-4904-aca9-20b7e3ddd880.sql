UPDATE public.book_pages 
SET content = REPLACE(REPLACE(content, 'جلسهی', 'جلسه ی'), 'جملههای', 'جمله های') 
WHERE book = 'قرآن دوم دبستان';