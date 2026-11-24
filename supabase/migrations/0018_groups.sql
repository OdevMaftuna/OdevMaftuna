-- 0018: GURUHLAR va OFFLINE CHECKLIST.
--   class_groups  — guruh (masalan "Pre-Intermediate 16:00 Juft kunlar"): kurs, vaqt, unitlar ro'yxati, joriy unit.
--   group_members — guruh a'zolari. O'qituvchi taklif qiladi (pending) → asosiy o'qituvchi tasdiqlaydi (approved).
--   group_checks  — offline topshirilgan ishlar belgisi: kind = topic (mavzu) | vocab (lug'at), unit = "I", "1"…
-- Test natijalari alohida saqlanmaydi — test_attempts dan avtomatik olinadi.
-- Yozish faqat server orqali (service role); o'qituvchilar o'qiydi; o'quvchilar ko'rmaydi.

create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  course_id uuid references public.courses (id) on delete set null,
  schedule text not null default '' check (char_length(schedule) <= 80),
  teacher_id uuid references public.profiles (id) on delete set null,
  units text[] not null default array['I','1','2','3','4','5','6','7','8','9'],
  current_unit text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.class_groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  added_by uuid references public.profiles (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (group_id, student_id)
);
create index group_members_student_idx on public.group_members (student_id);

create table public.group_checks (
  group_id uuid not null references public.class_groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('topic', 'vocab')),
  unit text not null check (char_length(unit) between 1 and 8),
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (group_id, student_id, kind, unit)
);

alter table public.class_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_checks enable row level security;

revoke all on public.class_groups, public.group_members, public.group_checks from anon, public;
grant select on public.class_groups, public.group_members, public.group_checks to authenticated;
grant all on public.class_groups, public.group_members, public.group_checks to service_role;

create policy "class_groups_select_teacher" on public.class_groups for select to authenticated using ((select public.is_teacher()));
create policy "group_members_select_teacher" on public.group_members for select to authenticated using ((select public.is_teacher()));
create policy "group_checks_select_teacher" on public.group_checks for select to authenticated using ((select public.is_teacher()));
