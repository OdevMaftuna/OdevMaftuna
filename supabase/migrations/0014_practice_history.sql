-- 0014: o'qituvchi uchun mashq tarixi.
--   last_checked — oxirgi tekshirilgan javoblar va natija ({answers, result}); "Try again" bosilganda o'chmaydi.
--   history      — har bir tekshiruv: [{at, score, total}], urinishlar bo'yicha o'sishni ko'rsatadi.
alter table public.practice_attempts add column last_checked jsonb;
alter table public.practice_attempts add column history jsonb not null default '[]'::jsonb;

-- Mavjud natijalarni ko'chirish.
update public.practice_attempts
set last_checked = jsonb_build_object('answers', answers, 'result', result)
where result is not null;
update public.practice_attempts
set history = jsonb_build_array(jsonb_build_object('at', checked_at, 'score', coalesce(score, best_score), 'total', total))
where checked_count > 0 and checked_at is not null;
