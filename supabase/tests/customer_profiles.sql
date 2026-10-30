-- Run AFTER the migration, as postgres, in a development/test project.
-- Tests use two transaction-local Auth identities, no emails/passwords/API tokens.
-- Every test row and helper is rolled back, including on a failed connection.
begin;

-- Fail if these deliberately distinctive fixture UUIDs already belong to users.
insert into auth.users (id, email, raw_user_meta_data) values
  ('b02f0000-0000-4000-8000-000000000001', 'profile-a-db-test@example.invalid', '{"role":"owner","display_name":"untrusted"}'),
  ('b02f0000-0000-4000-8000-000000000002', 'profile-b-db-test@example.invalid', '{}');

create function pg_temp.assert_true(condition boolean, label text)
returns void language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end;
$$;

-- Use invoker permissions so denied statements are actually executed as the
-- current test role; never grant helpers definer access.
create function pg_temp.expect_denied(statement text, label text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then
    raise notice 'PASS: %', label;
    return;
  end;
  raise exception 'FAIL: % (operation was allowed)', label;
end;
$$;

grant usage on schema pg_temp to authenticated, anon;
grant execute on function pg_temp.assert_true(boolean, text), pg_temp.expect_denied(text, text)
  to authenticated, anon;

select pg_temp.assert_true(
  not exists (select 1 from auth.users u left join public.customer_profiles p on p.id = u.id where p.id is null),
  'Existing Auth users are backfilled without changing their Auth records'
);
select pg_temp.assert_true(
  (select relrowsecurity from pg_class where oid = 'public.customer_profiles'::regclass),
  'RLS enabled'
);
select pg_temp.assert_true(
  (select count(*) = 2 and bool_and(display_name is null)
   from public.customer_profiles
   where id in ('b02f0000-0000-4000-8000-000000000001', 'b02f0000-0000-4000-8000-000000000002')),
  'Auth insertion automatically creates minimal profiles and ignores role metadata'
);
select pg_temp.assert_true(
  not exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'customer_profiles' and column_name in ('role', 'is_admin', 'email', 'password')),
  'Profile contains no editable role, password or duplicated Auth email'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b02f0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', 'b02f0000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  (select count(*) = 1 and bool_and(id = 'b02f0000-0000-4000-8000-000000000001') from public.customer_profiles),
  'Customer A can read only their own profile'
);
update public.customer_profiles set display_name = 'Customer A'
  where id = 'b02f0000-0000-4000-8000-000000000001';
select pg_temp.assert_true(
  (select display_name = 'Customer A' and updated_at >= created_at from public.customer_profiles),
  'Customer A can update their own name; timestamps are server maintained'
);
with changed as (
  update public.customer_profiles set display_name = 'Not yours'
  where id = 'b02f0000-0000-4000-8000-000000000002' returning id
)
select pg_temp.assert_true((select count(*) = 0 from changed), 'A cannot update B');
select pg_temp.expect_denied($q$update public.customer_profiles set id = 'b02f0000-0000-4000-8000-000000000002'$q$, 'Cannot reassign profile identity');
select pg_temp.expect_denied($q$update public.customer_profiles set created_at = now()$q$, 'Cannot overwrite created timestamp');
select pg_temp.expect_denied($q$update public.customer_profiles set updated_at = now()$q$, 'Cannot overwrite updated timestamp');
select pg_temp.expect_denied($q$insert into public.customer_profiles (id) values (gen_random_uuid())$q$, 'Cannot self-insert a profile');
select pg_temp.expect_denied($q$delete from public.customer_profiles$q$, 'Cannot delete profiles through the app');
select pg_temp.expect_denied($q$truncate public.customer_profiles$q$, 'Cannot bypass RLS with truncate');
select pg_temp.expect_denied($q$select bookmyturn_private.create_customer_profile()$q$, 'Cannot call private provisioning function');
do $$
begin
  begin
    update public.customer_profiles set display_name = repeat('x', 81);
  exception when check_violation then
    raise notice 'PASS: Name length constraint enforced';
    return;
  end;
  raise exception 'FAIL: Invalid name was accepted';
end;
$$;

select set_config('request.jwt.claims', '{"sub":"b02f0000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', 'b02f0000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  (select count(*) = 1 and bool_and(id = 'b02f0000-0000-4000-8000-000000000002') from public.customer_profiles),
  'Customer B can read only their own profile'
);
update public.customer_profiles set display_name = 'Customer B';
with changed as (
  update public.customer_profiles set display_name = 'Not yours'
  where id = 'b02f0000-0000-4000-8000-000000000001' returning id
)
select pg_temp.assert_true((select count(*) = 0 from changed), 'B cannot update A');

-- An authenticated role with no subject also cannot see any profile.
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_true((select count(*) = 0 from public.customer_profiles), 'Missing subject cannot read profiles');

set local role anon;
select set_config('request.jwt.claims', '{}', true);
select pg_temp.expect_denied('select * from public.customer_profiles', 'Unauthenticated caller cannot read profiles');
select pg_temp.expect_denied($q$update public.customer_profiles set display_name = 'Anonymous'$q$, 'Unauthenticated caller cannot update profiles');

reset role;
select pg_temp.assert_true(
  (select display_name = 'Customer A' from public.customer_profiles where id = 'b02f0000-0000-4000-8000-000000000001'),
  'A was not changed by another customer'
);
select pg_temp.assert_true(
  (select display_name = 'Customer B' from public.customer_profiles where id = 'b02f0000-0000-4000-8000-000000000002'),
  'B can update their name and was not changed by A'
);
delete from auth.users where id = 'b02f0000-0000-4000-8000-000000000001';
select pg_temp.assert_true(
  not exists (select 1 from public.customer_profiles where id = 'b02f0000-0000-4000-8000-000000000001'),
  'Auth account deletion cascades to its private profile'
);

rollback;

do $$
begin
  if exists (select 1 from auth.users where id in (
    'b02f0000-0000-4000-8000-000000000001', 'b02f0000-0000-4000-8000-000000000002'
  )) then
    raise exception 'FAIL: Test identities remain after rollback';
  end if;
  raise notice 'PASS: All test identities and profile changes rolled back';
end;
$$;

select 'PASS: customer profile permission and cleanup checks completed' as result;
