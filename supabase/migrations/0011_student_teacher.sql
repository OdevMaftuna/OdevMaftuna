-- =====================================================================
-- 0011: O'QUVCHINING O'QITUVCHISI (guruhi)
--   profiles.teacher_id — o'quvchi qaysi o'qituvchining guruhida.
--   O'qituvchi o'chirilsa, o'quvchi "guruhsiz" qoladi (null).
-- =====================================================================

alter table public.profiles
  add column teacher_id uuid references public.profiles (id) on delete set null;

create index profiles_teacher_idx on public.profiles (teacher_id) where teacher_id is not null;
