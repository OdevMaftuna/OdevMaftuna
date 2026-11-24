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
