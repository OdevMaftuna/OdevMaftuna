-- =====================================================================
-- 0003: Storage — "submissions" PRIVATE bucket va siyosatlari
-- Fayl yo'li: <student_id>/<assignment_id>/<fayl nomi>
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- O'quvchi faqat o'z papkasiga yuklaydi.
create policy "submissions_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );

-- O'quvchi faqat o'z papkasini o'qiydi; o'qituvchi hammasini o'qiydi.
create policy "submissions_storage_select_own_or_teacher"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and (
      (select public.is_teacher())
      or (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.is_active_user())
      )
    )
  );

-- O'chirish faqat o'qituvchiga (o'quvchi topshirgan rasmini o'chira olmaydi).
create policy "submissions_storage_delete_teacher"
  on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and (select public.is_teacher()));
