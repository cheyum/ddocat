-- First create your administrator in Supabase > Authentication > Users.
-- Replace the UUID below with that user's ID, then run in SQL Editor.
insert into public.fanpage_admins(user_id)
values ('toocat030@naver.com')
on conflict (user_id) do nothing;
