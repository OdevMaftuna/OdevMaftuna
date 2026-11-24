-- =====================================================================
-- 0009: BOSHQA KURSLARGA QATNASHISH (ruxsat so'rash)
--   * course_requests    — o'quvchining so'rovi (kutilmoqda / tasdiqlandi / rad etildi)
--   * course_enrollments — o'qituvchi ruxsat bergan qo'shimcha kurslar
--   * my_course_ids()    — o'quvchining asosiy + qo'shimcha kurslari
--   * vazifalarni ko'rish va topshirish endi shu kurslarning hammasida mumkin
-- 0001–0008 dan keyin ishga tushiring.
-- =====================================================================

create table public.course_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null
);

-- Bitta kursga bir vaqtda faqat bitta kutilayotgan so'rov.
create unique index course_requests_one_pending
  on public.course_requests (student_id, course_id) where status = 'pending';
create index course_requests_status_idx on public.course_requests (status, created_at desc);

create table public.course_enrollments (
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, course_id)
);

-- O'quvchining barcha kurslari (faol bo'lmasa — bo'sh).
create function public.my_course_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.course_id from public.profiles p
  where p.id = (select auth.uid()) and p.is_active and p.course_id is not null
  union
  select e.course_id from public.course_enrollments e
  join public.profiles p on p.id = e.student_id
  where e.student_id = (select auth.uid()) and p.is_active;
$$;

revoke execute on function public.my_course_ids() from public, anon, authenticated;
grant execute on function public.my_course_ids() to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.course_requests enable row level security;
alter table public.course_enrollments enable row level security;

revoke all on public.course_requests, public.course_enrollments from anon, public;
grant select, insert, update, delete on public.course_requests, public.course_enrollments to authenticated;
grant all on public.course_requests, public.course_enrollments to service_role;

create policy "course_requests_select_own_or_teacher"
  on public.course_requests for select to authenticated
  using ((select public.is_teacher()) or (student_id = (select auth.uid()) and (select public.is_active_user())));

-- O'quvchi faqat o'zi uchun, "kutilmoqda" holatida so'rov yaratadi.
create policy "course_requests_insert_own"
  on public.course_requests for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and status = 'pending'
    and decided_at is null
    and decided_by is null
    and (select public.is_active_user())
  );

create policy "course_requests_update_teacher"
  on public.course_requests for update to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

create policy "course_requests_delete_teacher"
  on public.course_requests for delete to authenticated
  using ((select public.is_teacher()));

create policy "course_enrollments_select_own_or_teacher"
  on public.course_enrollments for select to authenticated
  using ((select public.is_teacher()) or student_id = (select auth.uid()));

create policy "course_enrollments_write_teacher"
  on public.course_enrollments for all to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

-- Vazifalar: o'quvchi asosiy va ruxsat berilgan kurslarining e'lon qilingan vazifalarini ko'radi.
drop policy "assignments_select_published_own_course_or_teacher" on public.assignments;

create policy "assignments_select_published_my_courses_or_teacher"
  on public.assignments for select to authenticated
  using (
    (select public.is_teacher())
    or (publish_at <= now() and course_id in (select public.my_course_ids()))
  );

-- ---------------------------------------------------------------------
-- submit_assignment: vazifa o'quvchining kurslaridan biriga tegishli bo'lishi shart
-- (o'zgargan joy: "and course_id in (select public.my_course_ids())")
-- ---------------------------------------------------------------------
create or replace function public.submit_assignment(
  p_assignment_id uuid,
  p_text text,
  p_image_paths text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_assignment public.assignments%rowtype;
  v_text text := nullif(btrim(coalesce(p_text, '')), '');
  v_paths text[] := coalesce(p_image_paths, '{}');
  v_path text;
  v_id uuid;
begin
  if v_uid is null or not exists (
    select 1 from public.profiles where id = v_uid and role = 'student' and is_active
  ) then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_assignment
  from public.assignments
  where id = p_assignment_id
    and publish_at <= now()
    and course_id in (select public.my_course_ids());

  if not found then
    raise exception 'ASSIGNMENT_NOT_AVAILABLE';
  end if;

  if v_assignment.submission_type = 'text' then
    v_paths := '{}';
  elsif v_assignment.submission_type = 'image' then
    v_text := null;
  end if;

  if v_text is null and cardinality(v_paths) = 0 then
    raise exception 'EMPTY_SUBMISSION';
  end if;

  if char_length(v_text) > 20000 then
    raise exception 'TEXT_TOO_LONG';
  end if;

  if cardinality(v_paths) > 5 then
    raise exception 'TOO_MANY_IMAGES';
  end if;

  foreach v_path in array v_paths loop
    if v_path is null
       or v_path not like v_uid::text || '/%'
       or v_path like '%..%'
       or not exists (
         select 1 from storage.objects
         where bucket_id = 'submissions' and name = v_path
       )
    then
      raise exception 'INVALID_IMAGE_PATH';
    end if;
  end loop;

  insert into public.submissions (assignment_id, student_id, text_content, image_paths)
  values (p_assignment_id, v_uid, v_text, v_paths)
  on conflict (assignment_id, student_id) do update
    set text_content = excluded.text_content,
        image_paths = excluded.image_paths
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.submit_assignment(uuid, text, text[]) from public, anon;
grant execute on function public.submit_assignment(uuid, text, text[]) to authenticated;
