-- KURULUM KONTROLU: hicbir seyi degistirmez, sadece okur.
-- Tam kurulumda beklenen sonuc:
--   tablo_sayisi = 4, fonksiyon_sayisi = 7, public_policy = 9,
--   storage_policy = 3, bucket_ozel = true, ai_kuyrugu = true
select
  (select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in ('profiles', 'assignments', 'submissions', 'app_settings')) as tablo_sayisi,
  (select string_agg(table_name, ', ' order by table_name) from information_schema.tables
    where table_schema = 'public') as public_tablolar,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('is_teacher', 'is_active_user', 'handle_new_user', 'mark_password_changed',
                        'submissions_guard', 'submit_assignment', 'claim_next_ai_job')) as fonksiyon_sayisi,
  (select count(*) from pg_policies where schemaname = 'public'
      and tablename in ('profiles', 'assignments', 'submissions', 'app_settings')) as public_policy,
  (select count(*) from pg_policies where schemaname = 'storage'
      and policyname like 'submissions_storage%') as storage_policy,
  (select not public from storage.buckets where id = 'submissions') as bucket_ozel,
  exists (select 1 from information_schema.columns where table_schema = 'public'
      and table_name = 'submissions' and column_name = 'ai_locked_at') as ai_kuyrugu,
  (select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles') as profiles_sutunlari,
  (select count(*) from public.profiles) as profil_sayisi;
