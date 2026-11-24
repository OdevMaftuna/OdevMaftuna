-- 0023: SUPPORT JAMOASI.
--   class_groups.support_id — guruhga mas'ul support o'qituvchi (kim bajardi/bajarmadi va natijalar uchun javobgar).
--   support_actions — support o'qituvchining o'quvchi bilan qilgan ishi (eslatma, qo'ng'iroq, mavzu tushuntirish,
--   qayta ishlab 100/100 oldi, izoh). Asosiy o'qituvchi shu jurnal bo'yicha har bir support qanday ishlayotganini ko'radi.
-- Yozish faqat server orqali (service role); o'qituvchilar o'qiydi.

alter table public.class_groups add column support_id uuid references public.profiles (id) on delete set null;

create table public.support_actions (
  id uuid primary key default gen_random_uuid(),
  support_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.class_groups (id) on delete set null,
  student_id uuid references public.profiles (id) on delete cascade,
  member_id uuid references public.group_members (id) on delete set null,
  kind text not null check (kind in ('remind', 'call', 'explain', 'retake', 'note')),
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index support_actions_support_idx on public.support_actions (support_id, created_at desc);
create index support_actions_student_idx on public.support_actions (student_id, created_at desc);

alter table public.support_actions enable row level security;
revoke all on public.support_actions from anon, public;
grant select on public.support_actions to authenticated;
grant all on public.support_actions to service_role;
create policy "support_actions_select_teacher" on public.support_actions for select to authenticated using ((select public.is_teacher()));
