UPDATE public.spelling_errors SET correct_form = 'اذیت' WHERE written_form IN ('آزیت','ازیت','اذیت') AND correct_form <> 'اذیت';
DELETE FROM public.spelling_errors WHERE written_form = correct_form;