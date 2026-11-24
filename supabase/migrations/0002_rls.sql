-- =====================================================================
-- 0002: Row Level Security va huquqlar
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.app_settings enable row level security;

-- ---------------------------------------------------------------------
-- Huquqlar: kirmagan foydalanuvchi (anon) hech narsaga ega emas.
-- ---------------------------------------------------------------------

revoke all on public.profiles, public.assignments, public.submissions,
  public.app_settings, public.student_submissions from anon, public;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert, update, delete on public.submissions to authenticated;
grant select, update on public.app_settings to authenticated;
grant select on public.student_submissions to authenticated;

grant all on public.profiles, public.assignments, public.submissions,
  public.app_settings to service_role;

revoke execute on function
  public.is_teacher(),
  public.is_active_user(),
  public.mark_password_changed(),
  public.submit_assignment(uuid, text, text[]),
  public.handle_new_user(),
  public.submissions_guard()
from public, anon, authenticated;

grant execute on function
  public.is_teacher(),
  public.is_active_user(),
  public.mark_password_changed(),
  public.submit_assignment(uuid, text, text[])
to authenticated;

-- ---------------------------------------------------------------------
-- profiles
--   o'quvchi: faqat o'z profilini o'qiydi, o'zgartira olmaydi
--   o'qituvchi: hammasini o'qiydi va o'zgartiradi
--   qo'shish/o'chirish: faqat server (service role) orqali
-- ---------------------------------------------------------------------

create policy "profiles_select_own_or_teacher"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_teacher()));

create policy "profiles_update_teacher"
  on public.profiles for update to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

-- ---------------------------------------------------------------------
-- assignments
--   o'quvchi: faqat e'lon qilingan (publish_at <= now()) vazifalarni o'qiydi
--   o'qituvchi: hamma narsa
-- ---------------------------------------------------------------------

create policy "assignments_select_published_or_teacher"
  on public.assignments for select to authenticated
  using (
    (select public.is_teacher())
    or (publish_at <= now() and (select public.is_active_user()))
  );

create policy "assignments_insert_teacher"
  on public.assignments for insert to authenticated
  with check ((select public.is_teacher()));

create policy "assignments_update_teacher"
  on public.assignments for update to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

create policy "assignments_delete_teacher"
  on public.assignments for delete to authenticated
  using ((select public.is_teacher()));

-- ---------------------------------------------------------------------
-- submissions
--   o'qituvchi: hamma narsa
--   o'quvchi: jadvalga to'g'ridan-to'g'ri kira olmaydi —
--             o'qish: student_submissions view, yozish: submit_assignment()
-- ---------------------------------------------------------------------

create policy "submissions_all_teacher"
  on public.submissions for all to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

-- ---------------------------------------------------------------------
-- app_settings: faqat o'qituvchi
-- ---------------------------------------------------------------------

create policy "app_settings_select_teacher"
  on public.app_settings for select to authenticated
  using ((select public.is_teacher()));

create policy "app_settings_update_teacher"
  on public.app_settings for update to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));
