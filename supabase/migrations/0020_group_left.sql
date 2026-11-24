-- 0020: GURUHDAN KETGANLAR TARIXI.
--   group_members.status = 'left' — o'quvchi guruhdan ketgan (o'chirilmaydi, tarixda qoladi; qaytarish mumkin).
--   left_at / left_by — qachon va kim chiqargan.

alter table public.group_members drop constraint if exists group_members_status_check;
alter table public.group_members add constraint group_members_status_check check (status in ('pending', 'approved', 'left'));
alter table public.group_members add column if not exists left_at timestamptz;
alter table public.group_members add column if not exists left_by uuid references public.profiles (id) on delete set null;
