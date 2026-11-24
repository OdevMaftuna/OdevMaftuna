-- =====================================================================
-- 0008: MUDDATSIZ MASHQLAR (grammatika mavzulari, keyinroq lug'at)
--   * courses: CEFR va IELTS bo'limlari qo'shiladi (bosh sahifada 5 ta bo'lim)
--   * practice_topics   — mavzu: tushuntirish + 100 tarjima + 30 test. JAVOBLARSIZ.
--   * practice_keys     — javoblar va izohlar. Faqat o'qituvchi / server.
--   * practice_attempts — o'quvchining javoblari (qoralama ham) va natijasi.
--                         Yozish faqat server orqali (natijani soxtalashtirib bo'lmaydi).
-- 0001–0007 dan keyin ishga tushiring.
-- =====================================================================

insert into public.courses (name, sort_order) values
  ('CEFR', 4),
  ('IELTS', 5)
on conflict (name) do nothing;

create table public.practice_topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  kind text not null default 'grammar' check (kind in ('grammar', 'vocab')),
  unit integer not null,
  code text not null,               -- masalan "8.1"
  title text not null,
  title_uz text not null default '',
  sort_order integer not null default 0,
  content jsonb not null,           -- { intro, translations[], test[] } — javoblarsiz
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, kind, code)
);

create index practice_topics_course_idx on public.practice_topics (course_id, kind, sort_order);

create table public.practice_keys (
  topic_id uuid primary key references public.practice_topics (id) on delete cascade,
  key jsonb not null                -- { translations[{answers[]}], test[{answer, explain}] }
);

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.practice_topics (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  section text not null check (section in ('translate', 'test')),
  answers jsonb not null default '[]'::jsonb,  -- joriy javoblar (avtomatik saqlanadi)
  result jsonb,                                 -- oxirgi tekshiruv natijasi
  score integer,                                -- oxirgi tekshiruvdagi to'g'ri javoblar
  total integer,
  best_score integer,
  checked_count integer not null default 0,
  checked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (topic_id, student_id, section)
);

create index practice_attempts_student_idx on public.practice_attempts (student_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.practice_topics enable row level security;
alter table public.practice_keys enable row level security;
alter table public.practice_attempts enable row level security;

revoke all on public.practice_topics, public.practice_keys, public.practice_attempts from anon, public;
grant select on public.practice_topics, public.practice_attempts to authenticated;
grant select, insert, update, delete on public.practice_topics, public.practice_keys to authenticated;
grant all on public.practice_topics, public.practice_keys, public.practice_attempts to service_role;

-- Mavzular: faol foydalanuvchi e'lon qilinganlarini ko'radi (hamma bo'limlar); o'qituvchi hammasini boshqaradi.
create policy "practice_topics_select"
  on public.practice_topics for select to authenticated
  using ((select public.is_teacher()) or (published and (select public.is_active_user())));

create policy "practice_topics_write_teacher"
  on public.practice_topics for all to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

-- Kalit: faqat o'qituvchi.
create policy "practice_keys_all_teacher"
  on public.practice_keys for all to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

-- Javoblar: o'quvchi o'zinikini, o'qituvchi hammasini o'qiydi. Yozish — faqat server (service role).
create policy "practice_attempts_select_own_or_teacher"
  on public.practice_attempts for select to authenticated
  using ((select public.is_teacher()) or (student_id = (select auth.uid()) and (select public.is_active_user())));
