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
