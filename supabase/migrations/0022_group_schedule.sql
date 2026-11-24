-- 0022: GURUH BO'YICHA MUDDATLAR.
-- Vazifalar kursga tegishli va bir marta yaratiladi. Ularning sanalari (publish_at, due_at) kursning
-- "asosiy jadvali" bo'yicha yoziladi: courses.schedule_start — shu jadvalning 1-kuni.
-- Har bir guruhning o'z boshlanish sanasi bor (class_groups.start_date). Guruhdagi o'quvchi uchun
-- vazifa sanalari (start_date − schedule_start) kunga suriladi. Shuning uchun keyinroq ochilgan guruh
-- xuddi shu vazifalarni o'z muddatlari bilan oladi — vazifalarni qayta yaratish shart emas.
-- Siljish faqat oldinga (≥ 0): guruh asosiy jadvaldan oldin boshlana olmaydi.

alter table public.courses add column schedule_start date;
alter table public.class_groups add column start_date date;

-- Asosiy jadval: kursdagi eng birinchi vazifa e'lon qilingan kun (Toshkent vaqti).
update public.courses c
set schedule_start = (
  select min((a.publish_at at time zone 'Asia/Tashkent')::date)
  from public.assignments a where a.course_id = c.id
);

-- Hozirgi guruhlar asosiy jadval bo'yicha ketyapti (siljish 0).
update public.class_groups g
set start_date = c.schedule_start
from public.courses c
where c.id = g.course_id and c.schedule_start is not null;

-- O'quvchi uchun shu kursdagi siljish. Bir nechta guruhda bo'lsa — eng kech boshlangani (o'quvchiga qulayi).
create function public.assignment_shift(p_student uuid, p_course uuid)
returns interval
language sql
stable
security definer
set search_path = ''
as $$
  select make_interval(days => greatest(0, coalesce(max(g.start_date - c.schedule_start), 0)))
  from public.group_members m
  join public.class_groups g on g.id = m.group_id
  join public.courses c on c.id = g.course_id
  where m.student_id = p_student
    and m.status = 'approved'
    and g.course_id = p_course
    and g.start_date is not null
    and c.schedule_start is not null;
$$;

revoke execute on function public.assignment_shift(uuid, uuid) from public, anon;
grant execute on function public.assignment_shift(uuid, uuid) to authenticated, service_role;

-- Muddat triggeri: endi o'quvchining guruh siljishi hisobga olinadi.
create or replace function public.submissions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_assignment public.assignments%rowtype;
  v_shift interval;
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

  if not found then
    raise exception 'ASSIGNMENT_NOT_AVAILABLE';
  end if;

  v_shift := public.assignment_shift(v_uid, v_assignment.course_id);

  if v_assignment.publish_at + v_shift > now() then
    raise exception 'ASSIGNMENT_NOT_AVAILABLE';
  end if;

  if now() > v_assignment.due_at + v_shift and not v_assignment.late_allowed then
    raise exception 'DEADLINE_PASSED';
  end if;

  new.submitted_at := now();
  new.is_late := now() > v_assignment.due_at + v_shift;
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
