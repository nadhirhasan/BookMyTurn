-- QR customers never need Auth accounts. Everything here is rolled back.
begin;
create temp table qr_fixture(salon uuid,barber uuid,slug text,auth_count bigint);
insert into qr_fixture select s.id,b.id,s.slug,(select count(*) from auth.users) from public.salons s
 join public.barbers b on b.salon_id=s.id where s.slug='royal-saloon' order by b.id limit 1;
update bookmyturn_private.salon_policies set default_service_minutes=45 where salon_id=(select salon from qr_fixture);
update public.barber_status set availability='off_duty' where salon_id=(select salon from qr_fixture);
update public.barber_status set availability='available' where barber_id=(select barber from qr_fixture);
update public.salon_hours set opens_at='00:00',closes_at='23:59';
update public.barber_hours set starts_at='00:00',ends_at='23:59';
create temp table qr_results(n int,id uuid,token text);
do $$begin execute format('grant usage on schema %I to anon,authenticated',pg_my_temp_schema()::regnamespace::text);end;$$;
grant select on qr_fixture to anon,authenticated;grant all on qr_results to anon,authenticated;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $$declare token text;result jsonb;i int;expected int;minutes numeric;begin
 -- A 135-minute forecast must fit inside today's opening window.
 expected:=case when (now() at time zone 'Asia/Colombo')::time<'21:40'::time then 3 else 1 end;
 for i in 1..expected loop
  token:=gen_random_uuid()::text||':'||gen_random_uuid()::text;
  result:=public.qr_visit('join','royal-saloon',token,jsonb_build_object('request_key',gen_random_uuid()));
  if result->>'status'<>'arrived' then raise exception 'QR must record physical arrival';end if;
  insert into qr_results values(i,(result->>'id')::uuid,token);
  if public.qr_visit('join','royal-saloon',token,jsonb_build_object('request_key',gen_random_uuid()))->>'id'<>result->>'id' then raise exception 'Duplicate scan created another customer';end if;
 end loop;
 if (select (s->>'waiting')::int from jsonb_array_elements(public.customer_catalog()->'salons')s where s->>'slug'='royal-saloon')<>expected then raise exception 'Wrong physical waiting count';end if;
 if expected=3 then
  minutes:=extract(epoch from ((public.customer_quote((select salon from qr_fixture),null,null)->>'starts_at')::timestamptz-now()))/60;
  if minutes<>135 then raise exception 'Three people at 45 min must reserve 135 forecast minutes, got %',minutes;end if;
 end if;
 if public.qr_visit('read','royal-saloon',gen_random_uuid()::text||':'||gen_random_uuid()::text) is not null then raise exception 'A different device can read a receipt';end if;
 if public.qr_visit('read','royal-saloon',(select r.token from qr_results r limit 1))?'customer_name' then raise exception 'Public receipt leaks personal details';end if;
end;$$;
reset role;
do $$begin
 if exists(select 1 from public.queue_entries q join qr_results r on r.id=q.id where q.customer_id is not null or q.source<>'qr' or q.status<>'arrived') then raise exception 'QR visit created an Auth requirement';end if;
 if (select count(*) from auth.users)<>(select auth_count from qr_fixture) then raise exception 'QR unexpectedly created Auth accounts';end if;
end;$$;
insert into auth.users(id,email) values('b09f0000-0000-4000-8000-000000000001','qr-link-fixture@example.invalid');
select set_config('request.jwt.claims','{"sub":"b09f0000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select public.qr_visit('link','royal-saloon',(select token from qr_results where n=1));
do $$begin if jsonb_array_length(public.customer_state()->'queues')<>1 then raise exception 'Linked QR visit missing from app account';end if;end;$$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role anon;
select public.qr_visit('cancel','royal-saloon',(select token from qr_results where n=1));
do $$begin if public.qr_visit('cancel','royal-saloon',(select token from qr_results where n=1))->>'status' is distinct from 'cancelled' then raise exception 'Retry cancellation lost its receipt';end if;end;$$;
reset role;
select 'PASS: account-free QR arrivals, 45-minute forecast, private receipts and app linking' as result;
rollback;
