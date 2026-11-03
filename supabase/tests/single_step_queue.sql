-- Administrator regression; all fixture identities, visits and sales roll back.
begin;
create temp table one_join_ids(key text primary key,id uuid);
insert into one_join_ids values
 ('owner','b79f0000-0000-4000-8000-000000000001'),
 ('first','b79f0000-0000-4000-8000-000000000002'),
 ('second','b79f0000-0000-4000-8000-000000000003'),
 ('third','b79f0000-0000-4000-8000-000000000004');
insert into auth.users(id,email) select id,key||'-one-join@example.invalid' from one_join_ids;
create function pg_temp.jid(k text) returns uuid language sql stable as $$select id from pg_temp.one_join_ids where key=k$$;
create function pg_temp.ok(v boolean,label text) returns void language plpgsql as $$begin if v is distinct from true then raise exception 'FAIL: %',label;end if;end;$$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$begin begin execute statement;exception when insufficient_privilege then return;end;raise exception 'Unauthorized operation succeeded';end;$$;
do $$begin execute format('grant usage on schema %I to authenticated,anon',pg_my_temp_schema()::regnamespace::text);end;$$;
grant all on one_join_ids to authenticated;
grant execute on function pg_temp.jid(text),pg_temp.ok(boolean,text),pg_temp.denied(text) to authenticated,anon;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.jid('owner'))::text,true);
set local role authenticated;
insert into one_join_ids select 'salon',(public.manager_command('create_salon',jsonb_build_object('name','Single join fixture','address','Akurana','opens_at','00:00','closes_at','23:59','weekdays',jsonb_build_array(0,1,2,3,4,5,6)))->>'id')::uuid;
insert into one_join_ids select 'barber',(public.manager_command('create_barber',jsonb_build_object('salon_id',pg_temp.jid('salon'),'display_name','Single chair'))->>'id')::uuid;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.jid('first'))::text,true);
insert into one_join_ids select 'q1',(public.customer_command('join_queue',jsonb_build_object('salon_id',pg_temp.jid('salon'),'request_key',gen_random_uuid(),'present',false))->>'id')::uuid;
select pg_temp.ok((select status='arrived' and arrival_sequence is not null from public.queue_entries where id=pg_temp.jid('q1')),'Old clients sending false still join waiting immediately');
select pg_temp.ok(public.customer_command('join_queue',jsonb_build_object('salon_id',pg_temp.jid('salon'),'request_key',gen_random_uuid(),'present',false))->>'id'=pg_temp.jid('q1')::text,'Retry returns the original code and entry');
select pg_temp.denied($q$select public.customer_command('check_in',jsonb_build_object('id',pg_temp.jid('q1')))$q$);
select pg_temp.denied($q$select bookmyturn_private.customer_photo_command_v1('join_queue','{}')$q$);
select pg_temp.denied($q$select public.barber_command(pg_temp.jid('barber'),'start_haircut',jsonb_build_object('id',pg_temp.jid('q1')))$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.jid('second'))::text,true);
insert into one_join_ids select 'q2',(public.customer_command('join_queue',jsonb_build_object('salon_id',pg_temp.jid('salon'),'request_key',gen_random_uuid()))->>'id')::uuid;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.jid('third'))::text,true);
insert into one_join_ids select 'q3',(public.customer_command('join_queue',jsonb_build_object('salon_id',pg_temp.jid('salon'),'request_key',gen_random_uuid(),'present',false))->>'id')::uuid;
select pg_temp.ok((select (s->>'waiting')::int=3 from jsonb_array_elements(public.customer_catalog()->'salons')s where s->>'id'=pg_temp.jid('salon')::text),'Three distinct joins count as three waiting without arrival taps');
reset role;
select pg_temp.ok((select count(distinct visit_code)=3 from public.queue_entries where salon_id=pg_temp.jid('salon')),'Three unique short codes; retries do not duplicate');
select pg_temp.ok((select a.arrival_sequence<b.arrival_sequence and b.arrival_sequence<c.arrival_sequence from public.queue_entries a,public.queue_entries b,public.queue_entries c where a.id=pg_temp.jid('q1') and b.id=pg_temp.jid('q2') and c.id=pg_temp.jid('q3')),'Joining establishes queue order');
select pg_temp.ok((select b.starts_at>a.starts_at and c.starts_at>b.starts_at from bookmyturn_private.queue_forecast(pg_temp.jid('salon'))a,bookmyturn_private.queue_forecast(pg_temp.jid('salon'))b,bookmyturn_private.queue_forecast(pg_temp.jid('salon'))c where a.queue_id=pg_temp.jid('q1') and b.queue_id=pg_temp.jid('q2') and c.queue_id=pg_temp.jid('q3')),'All three joins affect the waiting forecast immediately');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.jid('owner'))::text,true);
set local role authenticated;
select pg_temp.ok(public.barber_command(pg_temp.jid('barber'),'check_in',jsonb_build_object('reference',(select q->>'reference' from jsonb_array_elements(public.barber_state(pg_temp.jid('barber'))->'queues')q where q->>'id'=pg_temp.jid('q1')::text)))->>'id'=pg_temp.jid('q1')::text,'Staff code lookup returns the existing waiting visit');
select pg_temp.ok((public.manager_state()->'salons'->0->>'waiting')::int=3,'Verification does not increment the queue');
insert into one_join_ids select 'session',(public.barber_command(pg_temp.jid('barber'),'start_haircut',jsonb_build_object('id',pg_temp.jid('q1')))->>'id')::uuid;
select pg_temp.ok((public.manager_state()->'salons'->0->>'waiting')::int=2,'Starting moves one customer out of waiting');
reset role;
select pg_temp.ok(not exists(select 1 from bookmyturn_private.sales where service_session_id=pg_temp.jid('session')),'Starting creates no sale');
set local role authenticated;
select public.barber_command(pg_temp.jid('barber'),'finish_haircut',jsonb_build_object('id',pg_temp.jid('session'),'final_amount_minor',125000));
select public.barber_command(pg_temp.jid('barber'),'finish_haircut',jsonb_build_object('id',pg_temp.jid('session'),'final_amount_minor',125000));
reset role;
select pg_temp.ok((select count(*)=1 and min(amount_minor)=125000 from bookmyturn_private.sales where service_session_id=pg_temp.jid('session')),'Finish retry records one final-price sale');
set local role authenticated;
insert into one_join_ids select 'barber2',(public.manager_command('create_barber',jsonb_build_object('salon_id',pg_temp.jid('salon'),'display_name','Second chair'))->>'id')::uuid;
reset role;
insert into one_join_ids select 'forecast',barber_id from bookmyturn_private.queue_forecast(pg_temp.jid('salon')) where queue_id=pg_temp.jid('q2');
insert into one_join_ids select 'other',id from public.barbers where salon_id=pg_temp.jid('salon') and id<>pg_temp.jid('forecast');
set local role authenticated;
do $$declare code text;begin
 select q->>'reference' into code from jsonb_array_elements(public.barber_state(pg_temp.jid('forecast'))->'queues')q where q->>'id'=pg_temp.jid('q2')::text;
 perform pg_temp.ok(code is not null,'Forecast chair can see the Any Barber visit');
 begin
  perform public.barber_command(pg_temp.jid('other'),'check_in',jsonb_build_object('reference',code));
  raise exception 'Wrong chair lookup unexpectedly succeeded';
 exception when raise_exception then
  if sqlerrm<>'Active customer code not found' then raise;end if;
 end;
 perform pg_temp.ok(public.barber_command(pg_temp.jid('forecast'),'check_in',jsonb_build_object('reference',code))->>'id'=pg_temp.jid('q2')::text,'Any Barber lookup opens the forecast chair visit');
end;$$;
select 'PASS: one customer join, immediate counts/forecast, private code lookup and staff-only completion' as result;
rollback;
