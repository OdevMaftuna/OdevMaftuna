-- =====================================================================
-- 0007: Audio — kurs audiolari va o'quvchilarning speaking ovozlari
--
--  lesson-audio  (yopiq): listening dialoglari, reading matnlari, speaking namunalari.
--                Doimiy. Faqat tizimga kirgan foydalanuvchi o'qiy oladi (signed URL orqali).
--                Yo'l: <kurs>/<listening|reading|speaking>/<fayl>.mp3
--  speaking      (yopiq): o'quvchi yozgan ovozlar. AI tekshirgandan keyin yoki ko'pi bilan
--                3 kundan keyin o'chiriladi (ball va izohlar qoladi).
--                Yo'l: <student_id>/<assignment_id>/<n>.mp3
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lesson-audio', 'lesson-audio', false, 15728640, array['audio/mpeg']),   -- 15 MB
  ('speaking', 'speaking', false, 2097152, array['audio/mpeg'])             -- 2 MB (~10 daqiqa)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Kurs audiolari: faol foydalanuvchi o'qiydi; yozishni faqat service role qiladi.
create policy "lesson_audio_select_active"
  on storage.objects for select to authenticated
  using (bucket_id = 'lesson-audio' and (select public.is_active_user()));

-- Speaking: o'quvchi faqat o'z papkasida yozadi, qayta yozadi, o'qiydi va o'chiradi.
create policy "speaking_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'speaking'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );

create policy "speaking_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'speaking' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'speaking' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "speaking_select_own_or_teacher"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'speaking'
    and (
      (select public.is_teacher())
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );

create policy "speaking_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'speaking' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Muddati o'tgan speaking ovozlari ro'yxati (faylning o'zini server Storage API orqali o'chiradi).
create or replace function public.speaking_expired_objects(p_older_than interval default interval '3 days')
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'speaking'
    and o.created_at < now() - p_older_than
  order by o.created_at
  limit 1000;
$$;

revoke all on function public.speaking_expired_objects(interval) from public, anon, authenticated;
grant execute on function public.speaking_expired_objects(interval) to service_role;
