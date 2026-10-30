-- Administrator-only, all fixtures rolled back. No changes to real appointments.
begin;
create temp table overlap_ids(key text primary key,id uuid);
insert into overlap_ids values('a','b10f0000-0000-4000-8000-000000000001'),('b','b10f0000-0000-4000-8000-000000000002');
insert into auth.users(id,email) select id,key||'-overlap-fixture@example.invalid' from overlap_ids;
insert into overlap_ids select 'salon',id from public.salons where slug='royal-saloon';
insert into overlap_ids select 'service',id from public.services where salon_id=(select id from overlap_ids where key='salon') and name='Haircut';
insert into overlap_ids select 'barber1',id from public.barbers where salon_id=(select id from overlap_ids where key='salon') order by id limit 1;
insert into overlap_ids select 'barber2',id from public.barbers where salon_id=(select id from overlap_ids where key='salon') order by id offset 1 limit 1;
insert into overlap_ids select 'other_salon',id from public.salons where slug='noire';
insert into overlap_ids select 'other_service',id from public.services where salon_id=(select id from overlap_ids where key='other_salon') and name='Haircut';
insert into overlap_ids select 'other_barber',id from public.barbers where salon_id=(select id from overlap_ids where key='other_salon') order by id limit 1;
create function pg_temp.oid(k text) returns uuid language sql stable as $$select id from pg_temp.overlap_ids where key=k$$;
create function pg_temp.check_overlap(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'PASS: %',label;end;$$;
create function pg_temp.overlap_rejected(statement text) returns void language plpgsql as $$begin
 begin execute statement;exception when exclusion_violation then return;end;raise exception 'Expected overlap rejection';end;$$;
do $$begin execute format('grant usage on schema %I to authenticated',pg_my_temp_schema()::regnamespace::text);end;$$;
grant all on overlap_ids to authenticated;
grant execute on function pg_temp.oid(text),pg_temp.check_overlap(boolean,text),pg_temp.overlap_rejected(text) to authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.oid('a'))::text,true);
set local role authenticated;
insert into overlap_ids select 'appointment',(public.customer_command('request_appointment',jsonb_build_object(
 'salon_id',pg_temp.oid('salon'),'service_id',pg_temp.oid('service'),'barber_id',pg_temp.oid('barber1'),
 'starts_at',((now() at time zone 'Asia/Colombo')::date+1+'14:00'::time) at time zone 'Asia/Colombo','request_key',gen_random_uuid()))->>'id')::uuid;
select pg_temp.check_overlap(not exists(select 1 from public.customer_slots(pg_temp.oid('salon'),pg_temp.oid('service'),(now() at time zone 'Asia/Colombo')::date+1,null)
 where available and (starts_at at time zone 'Asia/Colombo')::time between '14:00'::time and '14:15'::time),'Any Barber hides all own overlapping times');
select pg_temp.check_overlap(not exists(select 1 from public.customer_slots(pg_temp.oid('salon'),pg_temp.oid('service'),(now() at time zone 'Asia/Colombo')::date+1,pg_temp.oid('barber2'))
 where available and (starts_at at time zone 'Asia/Colombo')::time='14:00'::time),'Changing barber cannot re-offer own 2pm time');
select pg_temp.check_overlap(exists(select 1 from public.customer_slots(pg_temp.oid('salon'),pg_temp.oid('service'),(now() at time zone 'Asia/Colombo')::date+1,null)
 where available and (starts_at at time zone 'Asia/Colombo')::time='14:30'::time),'An adjacent non-overlapping visit remains possible');
select pg_temp.overlap_rejected($q$select public.customer_command('request_appointment',jsonb_build_object('salon_id',pg_temp.oid('salon'),'service_id',pg_temp.oid('service'),'barber_id',pg_temp.oid('barber2'),
 'starts_at',((now() at time zone 'Asia/Colombo')::date+1+'14:00'::time) at time zone 'Asia/Colombo','request_key',gen_random_uuid()))$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.oid('b'))::text,true);
select pg_temp.check_overlap(exists(select 1 from public.customer_slots(pg_temp.oid('salon'),pg_temp.oid('service'),(now() at time zone 'Asia/Colombo')::date+1,pg_temp.oid('barber2'))
 where available and (starts_at at time zone 'Asia/Colombo')::time='14:00'::time),'Another customer can still use the second barber');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.oid('a'))::text,true);
select public.customer_command('cancel_appointment',jsonb_build_object('id',pg_temp.oid('appointment')));
select pg_temp.check_overlap(exists(select 1 from public.customer_slots(pg_temp.oid('salon'),pg_temp.oid('service'),(now() at time zone 'Asia/Colombo')::date+1,pg_temp.oid('barber2'))
 where available and (starts_at at time zone 'Asia/Colombo')::time='14:00'::time),'Cancellation releases the customer personal time');
reset role;
-- Exercise the constraint independently of the availability function, including
-- a different salon: protects concurrent requests/alternative acceptance too.
insert into public.appointments(salon_id,customer_id,service_id,requested_start,requested_duration_minutes)
 values(pg_temp.oid('salon'),pg_temp.oid('a'),pg_temp.oid('service'),now()+interval '2 days',30) returning id;
insert into overlap_ids select 'direct1',id from public.appointments where customer_id=pg_temp.oid('a') and status='pending' order by created_at desc,id desc limit 1;
insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)
 values(pg_temp.oid('salon'),pg_temp.oid('barber1'),'appointment',pg_temp.oid('direct1'),now()+interval '2 days',now()+interval '2 days 30 minutes');
insert into public.appointments(salon_id,customer_id,service_id,requested_start,requested_duration_minutes)
 values(pg_temp.oid('other_salon'),pg_temp.oid('a'),pg_temp.oid('other_service'),now()+interval '2 days 15 minutes',30);
insert into overlap_ids select 'direct2',id from public.appointments where customer_id=pg_temp.oid('a') and requested_start=now()+interval '2 days 15 minutes';
select pg_temp.overlap_rejected($q$insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)
 values(pg_temp.oid('other_salon'),pg_temp.oid('other_barber'),'appointment',pg_temp.oid('direct2'),now()+interval '2 days 15 minutes',now()+interval '2 days 45 minutes')$q$);
select set_config('request.jwt.claims','{}',true);
delete from auth.users where id=pg_temp.oid('a');
select pg_temp.check_overlap(not exists(select 1 from bookmyturn_private.barber_schedule_blocks where customer_id=pg_temp.oid('a')),'Account deletion clears derived customer identity');
select 'PASS: customer overlap, alternate barber capacity and cancellation' as result;
rollback;
