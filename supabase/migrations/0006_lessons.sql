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
