-- Colloquial spoken forms are never errors
UPDATE public.spelling_errors SET error_type = 'گفتاری'
WHERE written_form IN ('خونه','نون','اره','آره','میخام','میخوام','آخه','اخه','چیکار','دیگه','میگم','میگه','بریم','اینجوری','اونجا','اونا');

-- ص/س، ث/س، ز/ذ/ض/ظ، ت/ط، ح/ه، ق/غ confusions are شبیه‌نویسی
UPDATE public.spelling_errors SET error_type = 'شبیه‌نویسی'
WHERE length(written_form) = length(correct_form)
  AND error_type IN ('املایی','شبیه‌نویسی')
  AND translate(written_form, 'صثزذضظتطحهقغ', 'سسززززتتههقق')
      = translate(correct_form, 'صثزذضظتطحهقغ', 'سسززززتتههقق')
  AND written_form <> correct_form;

-- Different length (missing/extra letter) is املایی, not شبیه‌نویسی
UPDATE public.spelling_errors SET error_type = 'املایی'
WHERE error_type = 'شبیه‌نویسی' AND length(written_form) <> length(correct_form);

-- Same letters, different spacing → فاصله‌گذاری
UPDATE public.spelling_errors SET error_type = 'فاصله‌گذاری'
WHERE replace(replace(written_form, ' ', ''), chr(8204), '')
    = replace(replace(correct_form, ' ', ''), chr(8204), '')
  AND written_form <> correct_form
  AND written_form LIKE '% %';

-- Drop the mis-segmented «تدارم → دارم» style rows and exact duplicates
DELETE FROM public.spelling_errors WHERE written_form = 'تدارم';
DELETE FROM public.spelling_errors a USING public.spelling_errors b
WHERE a.ctid > b.ctid
  AND a.session_id IS NOT DISTINCT FROM b.session_id
  AND replace(a.written_form, ' ', '') = replace(b.written_form, ' ', '');