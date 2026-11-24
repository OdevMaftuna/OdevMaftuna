-- 0015: pullik testlarda Listening.
--   test-audio (storage) — yopiq; fayllar faqat server (service role) yaratgan vaqtinchalik havola orqali beriladi:
--   sahifa avval o'quvchi testni sotib olganini tekshiradi, keyin 3 soatlik havola beradi.
--   paid_test_keys.scripts — listening matnlari (faqat o'qituvchi ko'radi; o'quvchiga yuborilmaydi).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('test-audio', 'test-audio', false, 10485760, array['audio/mpeg'])
on conflict (id) do nothing;

alter table public.paid_test_keys add column scripts jsonb not null default '[]'::jsonb;
