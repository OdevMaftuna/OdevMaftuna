-- =====================================================================
-- 0005: KURSLAR (Beginner, Elementary, Pre-Intermediate)
--   * har bir vazifa bitta kursga tegishli (assignments.course_id, majburiy)
--   * har bir o'quvchi bitta kursga biriktiriladi (profiles.course_id)
--   * o'quvchi faqat O'Z KURSINING e'lon qilingan vazifalarini ko'radi va topshiradi
-- 0001–0004 dan keyin ishga tushiring.
-- =====================================================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.courses (name, sort_order) values
  ('Beginner', 1),
  ('Elementary', 2),
  ('Pre-Intermediate', 3);

alter table public.profiles
  add column course_id uuid references public.courses (id) on delete set null;

alter table public.assignments
  add column course_id uuid references public.courses (id) on delete restrict;

-- Avvaldan bor vazifalar (bo'lsa) birinchi kursga o'tkaziladi, keyin ustun majburiy bo'ladi.
update public.assignments
set course_id = (select id from public.courses order by sort_order limit 1)
where course_id is null;

alter table public.assignments alter column course_id set not null;

create index assignments_course_id_idx on public.assignments (course_id);
create index profiles_course_id_idx on public.profiles (course_id);

-- Joriy foydalanuvchining kursi (faol bo'lmasa — null).
create function public.my_course_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select course_id
  from public.profiles
  where id = (select auth.uid()) and is_active;
$$;

revoke execute on function public.my_course_id() from public, anon, authenticated;
grant execute on function public.my_course_id() to authenticated;

-- ---------------------------------------------------------------------
-- courses: hamma kirgan foydalanuvchi o'qiydi, faqat o'qituvchi o'zgartiradi
-- ---------------------------------------------------------------------
alter table public.courses enable row level security;

revoke all on public.courses from anon, public;
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;

create policy "courses_select_authenticated"
  on public.courses for select to authenticated
  using (true);

create policy "courses_insert_teacher"
  on public.courses for insert to authenticated
  with check ((select public.is_teacher()));

create policy "courses_update_teacher"
  on public.courses for update to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

create policy "courses_delete_teacher"
  on public.courses for delete to authenticated
  using ((select public.is_teacher()));

-- ---------------------------------------------------------------------
-- assignments: o'quvchi faqat o'z kursining e'lon qilingan vazifalarini ko'radi
-- ---------------------------------------------------------------------
drop policy "assignments_select_published_or_teacher" on public.assignments;

create policy "assignments_select_published_own_course_or_teacher"
  on public.assignments for select to authenticated
  using (
    (select public.is_teacher())
    or (publish_at <= now() and course_id = (select public.my_course_id()))
  );

-- ---------------------------------------------------------------------
-- submit_assignment: vazifa o'quvchining kursiga tegishli bo'lishi shart
-- (o'zgargan joy: "and course_id = v_course")
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
  v_course uuid;
  v_assignment public.assignments%rowtype;
  v_text text := nullif(btrim(coalesce(p_text, '')), '');
  v_paths text[] := coalesce(p_image_paths, '{}');
  v_path text;
  v_id uuid;
begin
  select course_id into v_course
  from public.profiles
  where id = v_uid and role = 'student' and is_active;

  if v_uid is null or not found then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_assignment
  from public.assignments
  where id = p_assignment_id
    and publish_at <= now()
    and course_id = v_course;

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
