-- =====================================================================
-- SIFIRLAMA: Bu projenin kurdugu her seyi siler (tablolar, icindeki TUM veri,
-- fonksiyonlar, kurallar). Supabase'deki kullanici hesaplari (Authentication)
-- ve depodaki dosyalar SILINMEZ.
--
-- SADECE kurulum yarim kaldiysa ve icinde gercek veri yoksa calistir.
-- Sonra HEPSI_BIR_ARADA.sql'i bastan calistir.
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop policy if exists "submissions_storage_insert_own" on storage.objects;
drop policy if exists "submissions_storage_select_own_or_teacher" on storage.objects;
drop policy if exists "submissions_storage_delete_teacher" on storage.objects;

drop view if exists public.student_submissions;
drop table if exists public.submissions cascade;
drop table if exists public.assignments cascade;
drop table if exists public.app_settings cascade;
drop table if exists public.profiles cascade;

drop function if exists public.claim_next_ai_job();
drop function if exists public.submit_assignment(uuid, text, text[]);
drop function if exists public.submissions_guard();
drop function if exists public.mark_password_changed();
drop function if exists public.handle_new_user();
drop function if exists public.is_active_user();
drop function if exists public.is_teacher();
