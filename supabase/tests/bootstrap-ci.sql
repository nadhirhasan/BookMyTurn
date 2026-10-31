-- Only for the isolated vanilla PostgreSQL CI database. NEVER run on Supabase.
-- auth.users/auth.uid below stand in for Supabase's managed Auth objects.
begin;
do $$
begin
  if current_database() <> 'bookmyturn_test' then
    raise exception 'CI bootstrap requires the disposable bookmyturn_test database';
  end if;
end;
$$;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth, public to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid;
$$;

-- Exercise the migration against permissive Supabase-style default grants.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
insert into auth.users (id, email) values
  ('b02f0000-0000-4000-8000-000000000003', 'existing-profile-ci@example.invalid');

-- Minimal metadata-only Storage stand-in exercises real bucket-policy DDL/RLS.
-- File transfers are covered by browser/API tests; this is not a Storage server.
create schema storage;
create table storage.buckets(id text primary key,name text not null,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text not null references storage.buckets,name text not null,owner_id text,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated,service_role;
grant select,insert,update,delete on storage.objects to authenticated;
grant select on storage.objects to anon;
commit;
