-- Administrator-only regression suite. All users, services and finances ROLLBACK.
begin;
create temp table pipeline_ids(key text primary key,id uuid not null);
insert into pipeline_ids values('a','b08f0000-0000-4000-8000-000000000001'),('b','b08f0000-0000-4000-8000-000000000002');
insert into pipeline_ids select 'salon',id from public.salons where slug='royal-saloon';
insert into pipeline_ids select 'service',id from public.services where salon_id=(select id from pipeline_ids where key='salon') and name='Haircut';
insert into pipeline_ids select 'barber',barber_id from public.barber_services where service_id=(select id from pipeline_ids where key='service') order by barber_id limit 1;
insert into auth.users(id,email) select id,key||'-pipeline-fixture@example.invalid' from pipeline_ids where key in ('a','b');
update public.salon_hours set opens_at='00:00',closes_at='23:59';
update public.barber_hours set starts_at='00:00',ends_at='23:59';
create function pg_temp.pid(k text) returns uuid language sql stable as $$select id from pg_temp.pipeline_ids where key=k$$;
create function pg_temp.assert_ok(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'PASS: %',label;end;$$;
create function pg_temp.expect_error(statement text,expected text,label text) returns void language plpgsql as $$begin
 begin execute statement;exception when others then if sqlstate=expected then raise notice 'PASS: %',label;return;end if;raise exception 'FAIL: % expected % got % (%)',label,expected,sqlstate,sqlerrm;end;
 raise exception 'FAIL: % unexpectedly succeeded',label;end;$$;
do $$begin execute format('grant usage on schema %I to anon,authenticated',pg_my_temp_schema()::regnamespace::text);end;$$;
grant all on pipeline_ids to authenticated;
grant execute on function pg_temp.pid(text),pg_temp.assert_ok(boolean,text),pg_temp.expect_error(text,text,text) to anon,authenticated;

set local role anon;
select pg_temp.assert_ok(jsonb_array_length(public.customer_catalog()->'salons')=13,'Public catalogue is database-backed');
select pg_temp.expect_error('select public.customer_state()','42501','Unauthenticated visits denied');
select pg_temp.expect_error($q$select public.customer_command('join_queue','{}')$q$,'42501','Unauthenticated writes denied');
select pg_temp.expect_error('select * from public.queue_entries','42501','Public workload never leaks customer rows');
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.pid('a'))::text,true);
set local role authenticated;
insert into pipeline_ids select 'q',(public.customer_command('join_queue',jsonb_build_object('salon_id',pg_temp.pid('salon'),'service_id',pg_temp.pid('service'),'barber_id',pg_temp.pid('barber'),'request_key',gen_random_uuid()))->>'id')::uuid;
select pg_temp.assert_ok((select status='joined' from public.queue_entries where id=pg_temp.pid('q')),'Remote queue starts not arrived');
select pg_temp.assert_ok((select (s->>'waiting')::int=0 from jsonb_array_elements(public.customer_catalog()->'salons')s where s->>'id'=pg_temp.pid('salon')::text),'Remote join does not increase physical count');
select pg_temp.assert_ok(public.customer_command('join_queue',jsonb_build_object('salon_id',pg_temp.pid('salon'),'request_key',gen_random_uuid()))->>'id'=pg_temp.pid('q')::text,'Duplicate active queue returns original');
select public.customer_command('check_in',jsonb_build_object('id',pg_temp.pid('q')));
select pg_temp.assert_ok((select status='arrived' from public.queue_entries where id=pg_temp.pid('q')),'Physical check-in persisted');
select pg_temp.assert_ok((select (s->>'waiting')::int=1 from jsonb_array_elements(public.customer_catalog()->'salons')s where s->>'id'=pg_temp.pid('salon')::text),'Physical waiting count increases only at arrival');
select public.customer_command('share_styles',jsonb_build_object('id',pg_temp.pid('q'),'kind','queue','hairstyle_ids',(select jsonb_build_array(id) from public.hairstyles limit 1),'note','Test reference note'));
select pg_temp.assert_ok(jsonb_array_length(public.customer_state()->'style_requests')=1,'Reference images and note persist');
select pg_temp.expect_error($q$insert into public.queue_entries(salon_id,source) values(pg_temp.pid('salon'),'remote')$q$,'42501','Customers cannot bypass command guards');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.pid('b'))::text,true);
select pg_temp.assert_ok(jsonb_array_length(public.customer_state()->'queues')=0,'Second customer cannot read first customer visits');
select pg_temp.expect_error($q$select public.customer_command('cancel_queue',jsonb_build_object('id',pg_temp.pid('q')))$q$,'42501','Second customer cannot cancel first customer queue');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.pid('a'))::text,true);
select public.customer_command('demo_finish_queue',jsonb_build_object('id',pg_temp.pid('q')));
insert into pipeline_ids select 'session',(s->>'id')::uuid from jsonb_array_elements(public.customer_state()->'sessions')s where s->>'queue_entry_id'=pg_temp.pid('q')::text;
select pg_temp.assert_ok((select status='completed' from public.service_sessions where id=pg_temp.pid('session')),'Demo completes a real service session');
select public.customer_command('review',jsonb_build_object('id',pg_temp.pid('session'),'rating',5,'body','Pipeline fixture review'));
select pg_temp.assert_ok((select count(*)=1 from public.published_reviews where body='Pipeline fixture review'),'Eligible review published without account details');
select pg_temp.expect_error($q$select public.customer_command('review',jsonb_build_object('id',pg_temp.pid('session'),'rating',5))$q$,'23505','Repeated review denied');

-- Reserve a specific barber tomorrow. Pending requests hold capacity immediately.
insert into pipeline_ids select 'appointment',(public.customer_command('request_appointment',jsonb_build_object('salon_id',pg_temp.pid('salon'),'service_id',pg_temp.pid('service'),'barber_id',pg_temp.pid('barber'),'starts_at',s.starts_at,'request_key',gen_random_uuid()))->>'id')::uuid
 from public.customer_slots(pg_temp.pid('salon'),pg_temp.pid('service'),(now() at time zone 'Asia/Colombo')::date+1,pg_temp.pid('barber'))s where available order by starts_at limit 1;
select pg_temp.assert_ok((select status='pending' from public.appointments where id=pg_temp.pid('appointment')),'Customer request stays pending, never auto-confirmed');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.pid('b'))::text,true);
select pg_temp.expect_error($q$select public.customer_command('demo_accept',jsonb_build_object('id',pg_temp.pid('appointment')))$q$,'42501','Demo controls cannot impersonate another customer');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.pid('a'))::text,true);
select pg_temp.assert_ok(not (select available from public.customer_slots(pg_temp.pid('salon'),pg_temp.pid('service'),(now() at time zone 'Asia/Colombo')::date+1,pg_temp.pid('barber')) where starts_at=(select requested_start from public.appointments where id=pg_temp.pid('appointment'))),'Calendar capacity reflects pending hold');
select pg_temp.expect_error($q$select public.customer_command('request_appointment',jsonb_build_object('salon_id',pg_temp.pid('salon'),'service_id',pg_temp.pid('service'),'barber_id',pg_temp.pid('barber'),'starts_at',(select requested_start from public.appointments where id=pg_temp.pid('appointment')),'request_key',gen_random_uuid()))$q$,'23P01','Competing reservation rejected by server');
select public.customer_command('demo_alternative',jsonb_build_object('id',pg_temp.pid('appointment')));
select pg_temp.assert_ok((select status='alternative_suggested' from public.appointments where id=pg_temp.pid('appointment')),'Alternative remains unconfirmed');
select public.customer_command('accept_alternative',jsonb_build_object('id',pg_temp.pid('appointment'),'proposal_id',(select id from public.appointment_proposals where appointment_id=pg_temp.pid('appointment') order by suggested_at desc limit 1)));
select pg_temp.assert_ok((select status='confirmed' from public.appointments where id=pg_temp.pid('appointment')),'Explicit customer acceptance confirms alternative');
select public.customer_command('demo_finish_appointment',jsonb_build_object('id',pg_temp.pid('appointment')));
select pg_temp.assert_ok((select status='completed' from public.appointments where id=pg_temp.pid('appointment')),'Confirmed demo appointment reaches completed service');
select pg_temp.assert_ok(jsonb_array_length(public.customer_state()->'notifications')>=3,'In-app updates persisted privately');
reset role;
rollback;
