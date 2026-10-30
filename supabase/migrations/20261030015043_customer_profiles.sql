-- Milestone 02: private account profiles. Does not create salon/queue records.
begin;

create schema if not exists bookmyturn_private;
revoke all on schema bookmyturn_private from public, anon, authenticated;

create table public.customer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_profiles_display_name_check check (
    display_name is null or (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 80
    )
  )
);

comment on table public.customer_profiles is
  'Private customer account data. No public directory or editable business roles.';

alter table public.customer_profiles enable row level security;

-- Clear Supabase default grants before granting only what the app needs.
revoke all on public.customer_profiles from public, anon, authenticated;
grant select on public.customer_profiles to authenticated;
grant update (display_name) on public.customer_profiles to authenticated;
grant all on public.customer_profiles to service_role;

create policy customer_profiles_select_own
  on public.customer_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy customer_profiles_update_own
  on public.customer_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function bookmyturn_private.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Do not trust signup metadata as names, roles or permissions.
  insert into public.customer_profiles (id) values (new.id);
  return new;
end;
$$;

revoke all on function bookmyturn_private.create_customer_profile()
  from public, anon, authenticated;

create trigger bookmyturn_create_customer_profile
  after insert on auth.users
  for each row execute function bookmyturn_private.create_customer_profile();

create function bookmyturn_private.touch_customer_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function bookmyturn_private.touch_customer_profile()
  from public, anon, authenticated;

create trigger bookmyturn_touch_customer_profile
  before update on public.customer_profiles
  for each row execute function bookmyturn_private.touch_customer_profile();

-- Preserve existing Auth users; add only their minimal, initially unnamed profile.
insert into public.customer_profiles (id)
  select id from auth.users
  on conflict (id) do nothing;

commit;
