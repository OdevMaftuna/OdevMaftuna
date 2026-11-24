-- =====================================================================
-- TEK PARCA KURULUM: 0001 + 0002 + 0003 + 0004 + 0005 birlesik hali (YANGI loyiha uchun).
-- Mavjud loyihada 0001-0004 allaqachon bo'lsa, faqat migrations/0005_courses.sql ni ishga tushiring.
-- Supabase -> SQL Editor -> New query -> hepsini yapistir -> Run.
-- SADECE BIR KEZ calistir. (Ikinci kez calistirirsan "already exists" hatasi verir.)
-- Ilk ogretmen hesabi icin first_teacher.sql AYRI calistirilir.
-- =====================================================================

-- >>>>> 0001_schema.sql <<<<<
-- =====================================================================
-- 0001: Jadvallar, yordamchi funksiyalar, triggerlar, RPC va view
-- Supabase SQL Editor'da 0001 → 0002 → 0003 tartibida ishga tushiring.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Jadvallar
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('teacher', 'student')),
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  instructions text not null default '',
  submission_type text not null default 'text'
    check (submission_type in ('text', 'image', 'both')),
  rubric text not null default '',
  max_score integer not null default 100 check (max_score between 1 and 1000),
  publish_at timestamptz not null,
  due_at timestamptz not null,
  late_allowed boolean not null default false,
  late_penalty_percent integer not null default 0
    check (late_penalty_percent between 0 and 100),
  created_at timestamptz not null default now(),
  check (due_at > publish_at)
);

create index assignments_publish_at_idx on public.assignments (publish_at);
create index assignments_due_at_idx on public.assignments (due_at);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  text_content text,
  image_paths text[] not null default '{}',
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  ai_status text not null default 'pending'
    check (ai_status in ('pending', 'done', 'error')),
  ai_feedback jsonb,
  ai_score numeric(6, 2) check (ai_score >= 0),
  teacher_score numeric(6, 2) check (teacher_score >= 0),
  teacher_comment text,
  reviewed_at timestamptz,
  unique (assignment_id, student_id),
  check (cardinality(image_paths) <= 5)
);

create index submissions_student_id_idx on public.submissions (student_id);

-- Yagona qatorli sozlamalar jadvali (7-bosqichdagi "Sozlamalar" ekrani uchun).
create table public.app_settings (
  id boolean primary key default true check (id),
  feedback_language text not null default 'uz' check (feedback_language in ('uz', 'en')),
  show_ai_score_immediately boolean not null default true
);

insert into public.app_settings (id) values (true);

-- ---------------------------------------------------------------------
-- Yordamchi funksiyalar (RLS siyosatlarida ishlatiladi)
-- security definer: profiles jadvalini RLS'ga takroran tushmasdan o'qiydi.
-- ---------------------------------------------------------------------

create function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'teacher' and is_active
  );
$$;

create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

-- ---------------------------------------------------------------------
-- auth.users'ga yangi foydalanuvchi qo'shilganda profil yaratish.
-- Rol har doim 'student'; o'qituvchi roli faqat SQL orqali qo'lda beriladi.
-- ---------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- O'quvchi birinchi kirishda parolini o'zgartirgach chaqiriladi.
-- (O'quvchi profiles jadvalini to'g'ridan-to'g'ri o'zgartira olmaydi.)
-- ---------------------------------------------------------------------

create function public.mark_password_changed()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set must_change_password = false
  where id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------
-- TOPSHIRIQ MUDDATI TRIGGERI
-- O'quvchi nomidan yozilgan har bir topshiriq shu yerdan o'tadi:
--   * vazifa e'lon qilinmagan bo'lsa        → rad etiladi
--   * muddat o'tgan va late_allowed = false → rad etiladi
--   * submitted_at / is_late serverning soati bilan belgilanadi
--   * AI va o'qituvchi maydonlari tozalanadi (AI qayta ishlaydi)
-- O'qituvchi va service role (auth.uid() yo'q) bu tekshiruvdan o'tmaydi.
-- ---------------------------------------------------------------------

create function public.submissions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_assignment public.assignments%rowtype;
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.assignment_id := old.assignment_id;
    new.student_id := old.student_id;
  end if;

  if v_uid is null or public.is_teacher() then
    return new;
  end if;

  if new.student_id <> v_uid then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_assignment
  from public.assignments
  where id = new.assignment_id;

  if not found or v_assignment.publish_at > now() then
    raise exception 'ASSIGNMENT_NOT_AVAILABLE';
  end if;

  if now() > v_assignment.due_at and not v_assignment.late_allowed then
    raise exception 'DEADLINE_PASSED';
  end if;

  new.submitted_at := now();
  new.is_late := now() > v_assignment.due_at;
  new.ai_status := 'pending';
  new.ai_feedback := null;
  new.ai_score := null;
  new.teacher_score := null;
  new.teacher_comment := null;
  new.reviewed_at := null;

  return new;
end;
$$;

create trigger submissions_guard
  before insert or update on public.submissions
  for each row execute function public.submissions_guard();

-- ---------------------------------------------------------------------
-- O'quvchi uchun YAGONA yozish yo'li: submit_assignment RPC.
-- O'quvchining submissions jadvaliga to'g'ridan-to'g'ri yozish huquqi yo'q.
-- Muddat tekshiruvi yuqoridagi triggerda bajariladi.
-- ---------------------------------------------------------------------

create function public.submit_assignment(
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
    select 1 from public.profiles
    where id = v_uid and role = 'student' and is_active
  ) then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_assignment
  from public.assignments
  where id = p_assignment_id and publish_at <= now();

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

-- ---------------------------------------------------------------------
-- O'quvchi uchun YAGONA o'qish yo'li: student_submissions view.
-- Faqat o'zining topshiriqlarini ko'rsatadi. "AI balini darhol ko'rsatish"
-- o'chirilgan bo'lsa, o'qituvchi tekshirmaguncha AI bali yashiriladi
-- (brauzerdan API'ga to'g'ridan-to'g'ri so'rov yuborilsa ham ko'rinmaydi).
-- ---------------------------------------------------------------------

create view public.student_submissions
with (security_invoker = false)
as
select
  s.id,
  s.assignment_id,
  s.student_id,
  s.text_content,
  s.image_paths,
  s.submitted_at,
  s.is_late,
  s.ai_status,
  case when v.score_visible then s.ai_feedback else s.ai_feedback - 'score' end as ai_feedback,
  case when v.score_visible then s.ai_score end as ai_score,
  s.teacher_score,
  s.teacher_comment,
  s.reviewed_at,
  case
    when s.teacher_score is not null then s.teacher_score
    when v.score_visible then s.ai_score
  end as final_score,
  v.score_visible
from public.submissions s
cross join lateral (
  select
    s.teacher_score is not null
    or s.reviewed_at is not null
    or coalesce((select show_ai_score_immediately from public.app_settings limit 1), true)
    as score_visible
) v
where s.student_id = (select auth.uid())
  and (select public.is_active_user());


-- >>>>> 0002_rls.sql <<<<<
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


-- >>>>> 0003_storage.sql <<<<<
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


-- >>>>> 0004_ai_queue.sql <<<<<
-- =====================================================================
-- 0004: Sun'iy intellekt (Gemini) navbati
-- ai_status = 'pending' bo'lgan javoblar navbat hisoblanadi. Server ularni
-- BITTALAB, eng eskisidan boshlab oladi (bepul kvotaga urilmaslik uchun).
-- 0001–0003 dan keyin ishga tushiring.
-- =====================================================================

alter table public.submissions
  add column ai_locked_at timestamptz,          -- hozir kim ishlayotgani belgisi
  add column ai_attempts integer not null default 0,
  add column ai_error text;                     -- oxirgi xato sababi (o'qituvchi uchun)

-- Muddat triggeri: o'quvchi javobni yangilaganda navbat maydonlari ham tozalanadi.
create or replace function public.submissions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_assignment public.assignments%rowtype;
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.assignment_id := old.assignment_id;
    new.student_id := old.student_id;
  end if;

  if v_uid is null or public.is_teacher() then
    return new;
  end if;

  if new.student_id <> v_uid then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_assignment
  from public.assignments
  where id = new.assignment_id;

  if not found or v_assignment.publish_at > now() then
    raise exception 'ASSIGNMENT_NOT_AVAILABLE';
  end if;

  if now() > v_assignment.due_at and not v_assignment.late_allowed then
    raise exception 'DEADLINE_PASSED';
  end if;

  new.submitted_at := now();
  new.is_late := now() > v_assignment.due_at;
  new.ai_status := 'pending';
  new.ai_feedback := null;
  new.ai_score := null;
  new.ai_locked_at := null;
  new.ai_attempts := 0;
  new.ai_error := null;
  new.teacher_score := null;
  new.teacher_comment := null;
  new.reviewed_at := null;

  return new;
end;
$$;

-- Navbatdan keyingi ishni oladi. Bir vaqtda faqat BITTA ish bajariladi:
-- boshqa ish band bo'lsa (3 daqiqadan yangi belgi) hech narsa qaytarmaydi.
-- 3 daqiqadan eski belgi "qotib qolgan" hisoblanadi va qayta olinadi.
create function public.claim_next_ai_job()
returns setof public.submissions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(727274);

  if exists (
    select 1 from public.submissions
    where ai_status = 'pending' and ai_locked_at > now() - interval '3 minutes'
  ) then
    return;
  end if;

  select id into v_id
  from public.submissions
  where ai_status = 'pending'
  order by submitted_at
  limit 1;

  if v_id is null then
    return;
  end if;

  return query
    update public.submissions
    set ai_locked_at = now(), ai_attempts = ai_attempts + 1
    where id = v_id
    returning *;
end;
$$;

-- Faqat server (service role) chaqira oladi.
revoke execute on function public.claim_next_ai_job() from public, anon, authenticated;
grant execute on function public.claim_next_ai_job() to service_role;

-- >>>>> 0005_courses.sql <<<<<
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


-- =====================================================================
-- 0006: INTERAKTIV DARSLAR
--   * assignments.lesson        — dars mazmuni (matn, lug'at, savollar). JAVOBLARSIZ.
--   * assignment_keys           — javoblar kaliti. O'quvchi umuman o'qiy olmaydi,
--                                 tekshirish faqat serverda (service role) bajariladi.
--   * submissions.answers       — o'quvchining tuzilgan javoblari
--   * submissions.lesson_result — avtomatik tekshiruv natijasi (to'g'ri/noto'g'ri, ball)
-- 0001–0005 dan keyin ishga tushiring.
-- =====================================================================

alter table public.assignments add column lesson jsonb;

alter table public.submissions
  add column answers jsonb,
  add column lesson_result jsonb;

create table public.assignment_keys (
  assignment_id uuid primary key references public.assignments (id) on delete cascade,
  key jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.assignment_keys enable row level security;

revoke all on public.assignment_keys from anon, authenticated, public;
grant select, insert, update, delete on public.assignment_keys to authenticated;
grant all on public.assignment_keys to service_role;

-- Faqat o'qituvchi (o'quvchi uchun hech qanday siyosat yo'q = hech narsa ko'rinmaydi).
create policy "assignment_keys_all_teacher"
  on public.assignment_keys for all to authenticated
  using ((select public.is_teacher()))
  with check ((select public.is_teacher()));

-- O'quvchi ko'radigan view'ga yangi ustunlar oxiridan qo'shiladi.
create or replace view public.student_submissions
with (security_invoker = false)
as
select
  s.id,
  s.assignment_id,
  s.student_id,
  s.text_content,
  s.image_paths,
  s.submitted_at,
  s.is_late,
  s.ai_status,
  case when v.score_visible then s.ai_feedback else s.ai_feedback - 'score' end as ai_feedback,
  case when v.score_visible then s.ai_score end as ai_score,
  s.teacher_score,
  s.teacher_comment,
  s.reviewed_at,
  case
    when s.teacher_score is not null then s.teacher_score
    when v.score_visible then s.ai_score
  end as final_score,
  v.score_visible,
  s.answers,
  s.lesson_result
from public.submissions s
cross join lateral (
  select
    s.teacher_score is not null
    or s.reviewed_at is not null
    or coalesce((select show_ai_score_immediately from public.app_settings limit 1), true)
    as score_visible
) v
where s.student_id = (select auth.uid())
  and (select public.is_active_user());

grant select on public.student_submissions to authenticated;


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
