-- Run this in the SQL Editor of your own Supabase project.
-- No passwords or API keys belong in this file.
begin;

create table if not exists public.fanpage_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.site_settings (
  id text primary key check (id = 'site'),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.fanpage_admins enable row level security;
alter table public.site_settings enable row level security;
revoke all on public.fanpage_admins from anon, authenticated;
grant select on public.fanpage_admins to authenticated;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

drop policy if exists "Read own administrator membership" on public.fanpage_admins;
create policy "Read own administrator membership" on public.fanpage_admins
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Read published settings" on public.site_settings;
create policy "Read published settings" on public.site_settings
for select to anon, authenticated using (true);

drop policy if exists "Administrators insert settings" on public.site_settings;
create policy "Administrators insert settings" on public.site_settings
for insert to authenticated with check (
  exists (select 1 from public.fanpage_admins where user_id = (select auth.uid()))
);
drop policy if exists "Administrators update settings" on public.site_settings;
create policy "Administrators update settings" on public.site_settings
for update to authenticated using (
  exists (select 1 from public.fanpage_admins where user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.fanpage_admins where user_id = (select auth.uid()))
);

-- Compare the previous revision atomically to prevent overwriting another edit.
create or replace function public.save_site_config(next_value jsonb, expected_revision bigint)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare new_revision bigint;
begin
  if not exists (select 1 from public.fanpage_admins where user_id = auth.uid()) then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if expected_revision is null or expected_revision < 0 or next_value is null
     or jsonb_typeof(next_value) <> 'object' then
    raise exception 'invalid_settings' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.site_settings(id, value, revision)
    values ('site', next_value, 1)
    on conflict (id) do nothing
    returning revision into new_revision;
  else
    update public.site_settings
    set value = next_value, revision = revision + 1, updated_at = now()
    where id = 'site' and revision = expected_revision
    returning revision into new_revision;
  end if;
  if new_revision is null then
    raise exception 'revision_conflict' using errcode = '40001';
  end if;
  return new_revision;
end;
$$;
revoke all on function public.save_site_config(jsonb, bigint) from public, anon;
grant execute on function public.save_site_config(jsonb, bigint) to authenticated;

-- The images shown on the public fanpage are intentionally public.
-- Uploads remain restricted to registered administrators.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('fanpage-images', 'fanpage-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Administrators upload fanpage images" on storage.objects;
create policy "Administrators upload fanpage images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'fanpage-images'
  and name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
  and exists (select 1 from public.fanpage_admins where user_id = (select auth.uid()))
);

commit;
