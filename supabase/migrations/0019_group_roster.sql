-- 0019: GURUH RO'YXATI (roster) — ism + telefon; saytdagi hisob ixtiyoriy (keyin bog'lanadi).
--   group_members: endi har bir qator — guruhdagi o'quvchi (full_name, phone). student_id — saytdagi hisob (bo'lsa).
--     O'quvchi ro'yxatdan o'tganda yoki kabinetda telefonini kiritganda — telefon bo'yicha o'zi bog'lanadi.
--   group_checks: belgilar a'zo qatoriga (member_id) bog'lanadi — saytga hali kirmagan o'quvchini ham belgilash mumkin.
--   profiles.phone: o'quvchining telefoni (faqat raqamlar, masalan 998901234567).
-- 0018 dagi jadvallar hali bo'sh edi, shuning uchun qayta quriladi.

drop table if exists public.group_checks;
drop table if exists public.group_members;

alter table public.profiles add column if not exists phone text check (phone is null or phone ~ '^[0-9]{9,15}$');
create index if not exists profiles_phone_idx on public.profiles (phone) where phone is not null;

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete set null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (phone is null or phone ~ '^[0-9]{9,15}$'),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  added_by uuid references public.profiles (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index group_members_group_student_uq on public.group_members (group_id, student_id) where student_id is not null;
create unique index group_members_group_phone_uq on public.group_members (group_id, phone) where phone is not null;
create index group_members_student_idx on public.group_members (student_id) where student_id is not null;
create index group_members_phone_idx on public.group_members (phone) where phone is not null;

create table public.group_checks (
  member_id uuid not null references public.group_members (id) on delete cascade,
  kind text not null check (kind in ('topic', 'vocab')),
  unit text not null check (char_length(unit) between 1 and 8),
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (member_id, kind, unit)
);

alter table public.group_members enable row level security;
alter table public.group_checks enable row level security;
revoke all on public.group_members, public.group_checks from anon, public;
grant select on public.group_members, public.group_checks to authenticated;
grant all on public.group_members, public.group_checks to service_role;

-- O'qituvchilar hammasini ko'radi; o'quvchi — faqat o'ziga bog'langan qatorni (o'z guruhini bilishi uchun).
create policy "group_members_select" on public.group_members for select to authenticated
  using ((select public.is_teacher()) or (student_id = (select auth.uid()) and status = 'approved'));
create policy "group_checks_select_teacher" on public.group_checks for select to authenticated using ((select public.is_teacher()));

-- O'quvchi o'z guruhining nomini va jadvalini ko'ra olsin.
drop policy if exists "class_groups_select_teacher" on public.class_groups;
create policy "class_groups_select" on public.class_groups for select to authenticated
  using (
    (select public.is_teacher())
    or exists (select 1 from public.group_members m where m.group_id = class_groups.id and m.student_id = (select auth.uid()) and m.status = 'approved')
  );
