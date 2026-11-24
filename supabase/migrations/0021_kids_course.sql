-- 0021: KIDS (Prezident maktabi) kursi.
--   courses.is_hidden — o'quvchilar ro'yxatida ko'rinmaydi (faqat ruxsat berilganlarga ochiq). O'qituvchilar ko'radi.
--   practice_topics.kind — 'reading' qo'shildi (matn + savollar).
--   Kids kursi yaratiladi (yashirin).

alter table public.courses add column if not exists is_hidden boolean not null default false;

alter table public.practice_topics drop constraint if exists practice_topics_kind_check;
alter table public.practice_topics add constraint practice_topics_kind_check check (kind in ('grammar', 'vocab', 'phrasal', 'reading'));

insert into public.courses (name, sort_order, is_hidden)
values ('Kids (Prezident maktabi)', 90, true)
on conflict (name) do update set is_hidden = excluded.is_hidden;
