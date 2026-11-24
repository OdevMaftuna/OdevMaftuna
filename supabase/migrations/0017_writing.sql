-- 0017: WRITING (Pre-Intermediate) — letter / email cue card'lariga o'quvchi yozgan matnlar va AI tekshiruvi.
--   card_id   — "formal-1", "complaint-3" kabi (matnlar kodda: src/lib/writing/data.ts).
--   feedback  — oxirgi AI tekshiruvi (feedback.ts sxemasi), score — 0..10.
--   history   — har bir tekshiruv: [{at, score, words}] (o'sishni ko'rsatish uchun).
-- Yozish faqat server orqali (service role): o'quvchi bahoni o'zi o'zgartira olmaydi.

create table public.writing_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  card_id text not null check (char_length(card_id) between 1 and 40),
  text text not null default '' check (char_length(text) <= 6000),
  words integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'checking', 'checked', 'failed')),
  score numeric,
  feedback jsonb,
  history jsonb not null default '[]'::jsonb,
  checked_count integer not null default 0,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, card_id)
);

create index writing_attempts_student_idx on public.writing_attempts (student_id);
create index writing_attempts_checked_idx on public.writing_attempts (checked_at desc);

alter table public.writing_attempts enable row level security;

revoke all on public.writing_attempts from anon, public;
grant select on public.writing_attempts to authenticated;
grant all on public.writing_attempts to service_role;

create policy "writing_attempts_select_own_or_teacher"
  on public.writing_attempts for select to authenticated
  using ((select public.is_teacher()) or (student_id = (select auth.uid()) and (select public.is_active_user())));
