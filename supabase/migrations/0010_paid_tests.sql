-- =====================================================================
-- 0010: PULLIK TESTLAR (14 ta unit testi + level test)
--   * paid_tests         — test haqida (nomi, narxi); hamma faol foydalanuvchi ko'radi
--   * paid_test_content  — savollar (javobsiz); faqat sotib olgan o'quvchi yoki o'qituvchi
--   * paid_test_keys     — javob kalitlari; faqat server (service role)
--   * test_purchases     — to'lov so'rovi: chek rasmi, o'qituvchi tasdiqlaydi
--   * test_attempts      — o'quvchining javoblari va natijasi (bitta xarid = bitta urinish)
--   * payment_settings   — karta raqami va narx (o'qituvchi sozlaydi)
--   * receipts (storage) — to'lov cheklari
-- =====================================================================

create table public.paid_tests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('unit', 'level')),
  unit int,
  title text not null,
  subtitle text not null default '',
  price int not null default 20000 check (price >= 0),
  sort int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.paid_test_content (
  test_id uuid primary key references public.paid_tests (id) on delete cascade,
  content jsonb not null
);

create table public.paid_test_keys (
  test_id uuid primary key references public.paid_tests (id) on delete cascade,
  answers jsonb not null
);

create table public.test_purchases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  test_id uuid not null references public.paid_tests (id) on delete cascade,
  amount int not null,
  receipt_path text not null check (char_length(receipt_path) between 1 and 300),
  note text not null default '' check (char_length(note) <= 300),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null
);
create unique index test_purchases_one_open
  on public.test_purchases (student_id, test_id) where status in ('pending', 'approved');
create index test_purchases_status_idx on public.test_purchases (status, created_at desc);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references public.test_purchases (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  test_id uuid not null references public.paid_tests (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  result jsonb,
  score numeric,
  max_score int not null default 100,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index test_attempts_student_idx on public.test_attempts (student_id, test_id);

create table public.payment_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.payment_settings (key, value)
values ('payment', jsonb_build_object('card', '', 'holder', ''));

-- O'quvchi shu testni ochganmi (tasdiqlangan xarid)?
create function public.has_test_access(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.test_purchases p
    join public.profiles pr on pr.id = p.student_id
    where p.test_id = t and p.student_id = (select auth.uid()) and p.status = 'approved' and pr.is_active
  );
$$;
revoke execute on function public.has_test_access(uuid) from public, anon, authenticated;
grant execute on function public.has_test_access(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.paid_tests enable row level security;
alter table public.paid_test_content enable row level security;
alter table public.paid_test_keys enable row level security;
alter table public.test_purchases enable row level security;
alter table public.test_attempts enable row level security;
alter table public.payment_settings enable row level security;

revoke all on public.paid_tests, public.paid_test_content, public.paid_test_keys,
  public.test_purchases, public.test_attempts, public.payment_settings from anon, public;
grant select on public.paid_tests, public.paid_test_content, public.test_attempts, public.payment_settings to authenticated;
grant select, insert on public.test_purchases to authenticated;
grant update on public.test_purchases, public.payment_settings, public.paid_tests to authenticated;
grant all on public.paid_tests, public.paid_test_content, public.paid_test_keys,
  public.test_purchases, public.test_attempts, public.payment_settings to service_role;

create policy "paid_tests_select"
  on public.paid_tests for select to authenticated
  using ((select public.is_teacher()) or (is_published and (select public.is_active_user())));
create policy "paid_tests_update_teacher"
  on public.paid_tests for update to authenticated
  using ((select public.is_teacher())) with check ((select public.is_teacher()));

create policy "paid_test_content_select_buyer_or_teacher"
  on public.paid_test_content for select to authenticated
  using ((select public.is_teacher()) or (select public.has_test_access(test_id)));

-- paid_test_keys: siyosat yo'q => faqat service role o'qiydi.

create policy "test_purchases_select_own_or_teacher"
  on public.test_purchases for select to authenticated
  using ((select public.is_teacher()) or (student_id = (select auth.uid()) and (select public.is_active_user())));
create policy "test_purchases_insert_own_pending"
  on public.test_purchases for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and status = 'pending'
    and decided_at is null
    and decided_by is null
    and split_part(receipt_path, '/', 1) = (select auth.uid())::text
    and (select public.is_active_user())
  );
create policy "test_purchases_update_teacher"
  on public.test_purchases for update to authenticated
  using ((select public.is_teacher())) with check ((select public.is_teacher()));

create policy "test_attempts_select_own_or_teacher"
  on public.test_attempts for select to authenticated
  using ((select public.is_teacher()) or (student_id = (select auth.uid()) and (select public.is_active_user())));

create policy "payment_settings_select_active"
  on public.payment_settings for select to authenticated
  using ((select public.is_active_user()));
create policy "payment_settings_update_teacher"
  on public.payment_settings for update to authenticated
  using ((select public.is_teacher())) with check ((select public.is_teacher()));

-- ---------------------------------------------------------------------
-- Cheklar (storage): o'quvchi faqat o'z papkasiga yuklaydi, o'qituvchi hammasini ko'radi
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "receipts_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );
create policy "receipts_select_own_or_teacher"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and ((select public.is_teacher()) or (storage.foldername(name))[1] = (select auth.uid())::text)
  );
