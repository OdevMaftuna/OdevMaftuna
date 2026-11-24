-- =====================================================================
-- BIRINCHI O'QITUVCHI HISOBI
--
-- 1) Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"
--    E-pochta va parolni kiriting, "Auto Confirm User" belgilangan bo'lsin.
-- 2) Quyidagi so'rovda e-pochta va ism-familiyani o'zgartiring,
--    so'ng SQL Editor'da ishga tushiring.
-- 3) Natijada bitta qator qaytishi kerak (role = teacher).
-- =====================================================================

update public.profiles
set role = 'teacher',
    must_change_password = false,
    full_name = 'Ism Familiya'
where id = (select id from auth.users where email = 'teacher@example.com')
returning id, full_name, role;
