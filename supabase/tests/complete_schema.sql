-- Run as the development database administrator AFTER all migrations.
-- No bootstrap on hosted Supabase. Every fixture/change is rolled back.
begin;
create temp table bmt_ids (key text primary key, id uuid not null);
insert into bmt_ids values
 ('royal',(select id from public.salons where slug='royal-saloon')),
 ('other',(select id from public.salons where slug='noire')),
 ('a','b03f0000-0000-4000-8000-000000000001'),('b','b03f0000-0000-4000-8000-000000000002'),
 ('owner','b03f0000-0000-4000-8000-000000000003'),('barber','b03f0000-0000-4000-8000-000000000004'),
 ('coordinator','b03f0000-0000-4000-8000-000000000005'),('outsider','b03f0000-0000-4000-8000-000000000006');
insert into bmt_ids select key,gen_random_uuid() from unnest(array[
 'barber1','barber2','foreignbarber','service','foreignservice','q1','q2','walkin',
 'appointment','conflict','alternative','proposal','session','rule','payment','review']) key;
create function pg_temp.id(k text) returns uuid language sql stable as $$ select id from pg_temp.bmt_ids where key=k $$;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end; $$;
create function pg_temp.expect_state(statement text,expected text,label text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate=expected then raise notice 'PASS: %',label; return; end if;
    raise exception 'FAIL: %: expected %, got % (%)',label,expected,sqlstate,sqlerrm;
  end;
  raise exception 'FAIL: %: operation unexpectedly succeeded',label;
end; $$;
do $$ begin execute format('grant usage on schema %I to authenticated,anon',pg_my_temp_schema()::regnamespace::text); end; $$;
grant select on bmt_ids to authenticated,anon;
grant execute on function pg_temp.id(text),pg_temp.assert_true(boolean,text),pg_temp.expect_state(text,text,text) to authenticated,anon;

select pg_temp.assert_true((select count(*)=13 from public.salons),'Exactly 13 approved salon records');
select pg_temp.assert_true((select count(*)=23 from public.hairstyle_categories),'All specified hairstyle categories');
select pg_temp.assert_true(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','bookmyturn_private') and c.relkind='r' and not c.relrowsecurity),'RLS on every application table');
select pg_temp.assert_true(not exists(select 1 from bookmyturn_private.salon_policies where arrival_grace_minutes is not null
  or no_show_after_minutes is not null or cancellation_notice_minutes is not null),'Undecided timing policies stay unset');
select pg_temp.assert_true(not has_function_privilege('anon','bookmyturn_private.finish_session()','EXECUTE'),'Private completion trigger is not an anonymous RPC');
select pg_temp.assert_true(not exists(select 1 from information_schema.columns where table_schema='public'
  and table_name='published_reviews' and column_name in ('customer_id','service_session_id','mobile')),'Public review projection has no private identifiers');

insert into auth.users(id,email,raw_user_meta_data) select id,key||'-schema-test@example.invalid','{"role":"owner"}'::jsonb
  from bmt_ids where key in ('a','b','owner','barber','coordinator','outsider');
update public.salons set is_open=true where id=pg_temp.id('royal');
insert into public.barbers(id,salon_id,display_name,is_published) values
 (pg_temp.id('barber1'),pg_temp.id('royal'),'Schema fixture 1',true),
 (pg_temp.id('barber2'),pg_temp.id('royal'),'Schema fixture 2',true),
 (pg_temp.id('foreignbarber'),pg_temp.id('other'),'Schema foreign fixture',true);
insert into public.services(id,salon_id,name,price_min_minor,price_max_minor,duration_minutes) values
 (pg_temp.id('service'),pg_temp.id('royal'),'Schema fixture haircut',100000,140000,30),
 (pg_temp.id('foreignservice'),pg_temp.id('other'),'Schema foreign haircut',100000,140000,30);
insert into bookmyturn_private.salon_memberships(salon_id,user_id,role,barber_id) values
 (pg_temp.id('royal'),pg_temp.id('owner'),'owner',null),
 (pg_temp.id('royal'),pg_temp.id('barber'),'barber',pg_temp.id('barber1')),
 (pg_temp.id('royal'),pg_temp.id('coordinator'),'coordinator',null),
 (pg_temp.id('other'),pg_temp.id('outsider'),'owner',null);

select pg_temp.expect_state($q$insert into public.queue_entries(salon_id,customer_id,source) values(pg_temp.id('other'),pg_temp.id('a'),'remote')$q$,'23514','Closed salon rejects immediate queue joins');
insert into public.queue_entries(id,salon_id,reference,customer_id,source,service_id,preferred_barber_id,assigned_barber_id,customer_name,mobile,note) values
 (pg_temp.id('q1'),pg_temp.id('royal'),'DB-SCHEMA-TEST-A',pg_temp.id('a'),'remote',pg_temp.id('service'),pg_temp.id('barber1'),pg_temp.id('barber1'),'private fixture','private mobile','private note'),
 (pg_temp.id('q2'),pg_temp.id('royal'),'DB-SCHEMA-TEST-B',pg_temp.id('b'),'qr',pg_temp.id('service'),pg_temp.id('barber2'),pg_temp.id('barber2'),null,null,null);
select pg_temp.assert_true((select count(*)=0 from public.queue_entries where salon_id=pg_temp.id('royal') and status='arrived'),'Remote/QR intent alone creates zero physical waiting');
select pg_temp.expect_state($q$insert into public.queue_entries(salon_id,customer_id,source) values(pg_temp.id('royal'),pg_temp.id('a'),'remote')$q$,'23505','Concurrent active-queue uniqueness is database-enforced');
select pg_temp.expect_state($q$insert into public.queue_entries(salon_id,source,service_id) values(pg_temp.id('royal'),'remote',pg_temp.id('foreignservice'))$q$,'23503','Cross-salon service reference denied');
update public.queue_entries set status='arrived' where id=pg_temp.id('q2');
update public.queue_entries set status='arrived' where id=pg_temp.id('q1');
select pg_temp.assert_true((select arrival_sequence from public.queue_entries where id=pg_temp.id('q2')) <
 (select arrival_sequence from public.queue_entries where id=pg_temp.id('q1')),'Physical queue order follows check-in, not remote join');
update public.queue_entries set status='arrived' where id=pg_temp.id('q1');
select pg_temp.expect_state($q$update public.queue_entries set assigned_barber_id=pg_temp.id('barber2') where id=pg_temp.id('q1')$q$,'23514','Specific barber preference is preserved');
select pg_temp.expect_state($q$update public.queue_entries set status='completed',completed_at=now() where id=pg_temp.id('q1')$q$,'23514','Queue cannot skip actual service completion');
insert into public.queue_entries(id,salon_id,source,status,assigned_barber_id) values
 (pg_temp.id('walkin'),pg_temp.id('royal'),'walk_in','arrived',pg_temp.id('barber1'));
select pg_temp.assert_true((select arrived_at is not null and arrival_sequence is not null from public.queue_entries where id=pg_temp.id('walkin')),'Walk-in begins physically arrived');

insert into public.appointments(id,salon_id,customer_id,service_id,preferred_barber_id,requested_start,requested_duration_minutes) values
 (pg_temp.id('appointment'),pg_temp.id('royal'),pg_temp.id('a'),pg_temp.id('service'),pg_temp.id('barber1'),'2035-01-01 09:00Z',30),
 (pg_temp.id('conflict'),pg_temp.id('royal'),pg_temp.id('b'),pg_temp.id('service'),pg_temp.id('barber1'),'2035-01-01 09:15Z',30),
 (pg_temp.id('alternative'),pg_temp.id('royal'),pg_temp.id('a'),pg_temp.id('service'),pg_temp.id('barber2'),'2035-01-01 10:00Z',30);
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.barber_schedule_blocks),'Pending requests do not reserve barber time');
select pg_temp.expect_state($q$update public.appointments set requested_start='2035-01-01 10:30Z' where id=pg_temp.id('alternative')$q$,'23514','Original request cannot be overwritten to bypass alternative consent');
update public.appointments set status='confirmed',confirmed_barber_id=preferred_barber_id,
 confirmed_start=requested_start,confirmed_end=requested_start+interval '30 minutes' where id=pg_temp.id('appointment');
select pg_temp.expect_state($q$update public.appointments set status='confirmed',confirmed_barber_id=preferred_barber_id,confirmed_start=requested_start,confirmed_end=requested_start+interval '30 minutes' where id=pg_temp.id('conflict')$q$,'23P01','Overlapping confirmations cannot both reserve the barber');
select pg_temp.expect_state($q$insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,starts_at,ends_at) values(pg_temp.id('royal'),pg_temp.id('barber1'),'break','2035-01-01 09:10Z','2035-01-01 09:20Z')$q$,'23P01','Breaks cannot overlap confirmed reservations');
insert into public.appointment_proposals(id,salon_id,appointment_id,barber_id,starts_at,ends_at) values
 (pg_temp.id('proposal'),pg_temp.id('royal'),pg_temp.id('alternative'),pg_temp.id('barber2'),'2035-01-01 10:30Z','2035-01-01 11:00Z');
select pg_temp.expect_state($q$update public.appointments set status='confirmed',accepted_proposal_id=pg_temp.id('proposal'),confirmed_barber_id=pg_temp.id('barber2'),confirmed_start='2035-01-01 10:30Z',confirmed_end='2035-01-01 11:00Z' where id=pg_temp.id('alternative')$q$,'23514','An offered alternative needs customer acceptance');
update public.appointment_proposals set accepted_by=pg_temp.id('a'),accepted_at=now() where id=pg_temp.id('proposal');
update public.appointments set status='confirmed',accepted_proposal_id=pg_temp.id('proposal'),confirmed_barber_id=pg_temp.id('barber2'),
 confirmed_start='2035-01-01 10:30Z',confirmed_end='2035-01-01 11:00Z' where id=pg_temp.id('alternative');
select pg_temp.assert_true((select count(*)=2 from bookmyturn_private.barber_schedule_blocks where is_active),'Accepted alternatives become confirmed reservations');
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.sales),'Joining and booking create no revenue');

insert into bookmyturn_private.commission_rules(id,salon_id,valid_from,eligible_sources,surcharge_minor,salon_share_minor,platform_share_minor,disclosure,is_enabled)
 values(pg_temp.id('rule'),pg_temp.id('royal'),now()-interval '1 day',array['remote'],5000,2000,3000,'Fictional agreed surcharge',true);
insert into public.service_sessions(id,salon_id,barber_id,customer_id,queue_entry_id,service_id,source,service_name_snapshot,duration_minutes_snapshot,
 price_min_minor_snapshot,price_max_minor_snapshot,agreed_price_minor,price_agreed_at,commission_rule_id,commission_surcharge_minor,commission_salon_minor,
 commission_platform_minor,commission_disclosure_snapshot,commission_agreed_at)
 values(pg_temp.id('session'),pg_temp.id('royal'),pg_temp.id('barber1'),pg_temp.id('a'),pg_temp.id('q1'),pg_temp.id('service'),'remote','Schema haircut',30,
 100000,140000,105000,now(),pg_temp.id('rule'),5000,2000,3000,'Fictional agreed surcharge',now());
select pg_temp.assert_true((select status='in_service' from public.queue_entries where id=pg_temp.id('q1')),'Starting service removes customer from waiting');
select pg_temp.expect_state($q$insert into public.service_sessions(salon_id,barber_id,queue_entry_id,service_id,source,service_name_snapshot,duration_minutes_snapshot,price_min_minor_snapshot,price_max_minor_snapshot,agreed_price_minor,price_agreed_at) values(pg_temp.id('royal'),pg_temp.id('barber1'),pg_temp.id('walkin'),pg_temp.id('service'),'walk_in','Schema haircut',30,100000,140000,100000,now())$q$,'23505','One barber cannot have two active services');
select pg_temp.expect_state($q$insert into public.reviews(salon_id,barber_id,service_session_id,customer_id,rating,publish_consent) values(pg_temp.id('royal'),pg_temp.id('barber1'),pg_temp.id('session'),pg_temp.id('a'),5,true)$q$,'23514','Unfinished service cannot receive a review');
select pg_temp.expect_state($q$insert into bookmyturn_private.sales(salon_id,service_session_id,amount_minor,recorded_at) values(pg_temp.id('royal'),pg_temp.id('session'),105000,now())$q$,'23514','Unfinished service cannot create a sale');
insert into public.service_items(salon_id,service_session_id,description,kind,amount_minor) values
 (pg_temp.id('royal'),pg_temp.id('session'),'Agreed haircut including surcharge','base',105000);
select pg_temp.expect_state($q$update public.service_sessions set status='completed',completed_at=clock_timestamp(),final_amount_minor=100000,final_amount_agreed_at=now() where id=pg_temp.id('session')$q$,'23514','Completion rejects inconsistent item totals');
update public.service_sessions set status='completed',completed_at=clock_timestamp(),final_amount_minor=105000,final_amount_agreed_at=now() where id=pg_temp.id('session');
update public.service_sessions set status='completed' where id=pg_temp.id('session');
select pg_temp.assert_true((select count(*)=1 from bookmyturn_private.sales where service_session_id=pg_temp.id('session')),'Completion retry creates exactly one sale');
select pg_temp.assert_true((select count(*)=1 from bookmyturn_private.commission_accruals where salon_id=pg_temp.id('royal')),'Exactly one agreed commission accrual');
select pg_temp.expect_state($q$update public.service_items set amount_minor=100000 where service_session_id=pg_temp.id('session')$q$,'23514','Historical service amounts cannot be overwritten');
select pg_temp.expect_state($q$update bookmyturn_private.sales set amount_minor=1 where service_session_id=pg_temp.id('session')$q$,'23514','Historical sales require an append-only correction');
insert into bookmyturn_private.commission_payments(id,salon_id,amount_minor,paid_at) values(pg_temp.id('payment'),pg_temp.id('royal'),4000,now());
select pg_temp.expect_state($q$insert into bookmyturn_private.commission_payment_allocations(salon_id,payment_id,accrual_id,amount_minor) select pg_temp.id('royal'),pg_temp.id('payment'),id,4000 from bookmyturn_private.commission_accruals where salon_id=pg_temp.id('royal')$q$,'23514','Commission cannot be overpaid beyond accrual');
insert into bookmyturn_private.commission_payment_allocations(salon_id,payment_id,accrual_id,amount_minor)
 select pg_temp.id('royal'),pg_temp.id('payment'),id,3000 from bookmyturn_private.commission_accruals where salon_id=pg_temp.id('royal');
insert into public.reviews(id,salon_id,barber_id,service_session_id,customer_id,rating,body,publish_consent)
 values(pg_temp.id('review'),pg_temp.id('royal'),pg_temp.id('barber1'),pg_temp.id('session'),pg_temp.id('a'),5,'Fictional schema review',true);
select pg_temp.expect_state($q$insert into public.reviews(salon_id,barber_id,service_session_id,customer_id,rating,publish_consent) values(pg_temp.id('royal'),pg_temp.id('barber1'),pg_temp.id('session'),pg_temp.id('b'),5,true)$q$,'23514','Another customer cannot review the completed service');
select pg_temp.expect_state($q$insert into public.reviews(salon_id,barber_id,service_session_id,customer_id,rating,publish_consent) values(pg_temp.id('royal'),pg_temp.id('barber1'),pg_temp.id('session'),pg_temp.id('a'),5,true)$q$,'23505','A completed service can be reviewed only once');
select pg_temp.assert_true((select review_count=1 and average_rating=5 from public.barber_review_stats where barber_id=pg_temp.id('barber1')),'Public ratings derive from verified publications');
insert into bookmyturn_private.expenses(salon_id,category_code,due_on,description,amount_minor) values(pg_temp.id('royal'),'rent',current_date,'Schema expected expense',100000);
select pg_temp.assert_true((select status='expected' and paid_at is null from bookmyturn_private.expenses where salon_id=pg_temp.id('royal')),'Expected expense is distinct from paid expense');
select pg_temp.assert_true(not exists(select 1 from bookmyturn_private.audit_events where changes::text like '%private mobile%' or changes::text like '%private note%'),'Audit redacts contact details and customer notes');
insert into public.notifications(user_id,event_key,title,body) values(pg_temp.id('a'),'schema-a','Schema A','Private notification'),(pg_temp.id('b'),'schema-b','Schema B','Private notification');

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('a'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('a')::text,true);
select pg_temp.assert_true((select count(*)=1 from public.queue_entries),'Customer reads only own queue');
select pg_temp.assert_true((select count(*)=2 from public.appointments),'Customer reads only own appointments');
select pg_temp.assert_true((select count(*)=1 from public.notifications),'Customer reads only own notifications');
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.expenses),'Customer cannot read salon expenses');
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.salon_memberships),'Signup metadata does not grant staff membership');
select pg_temp.expect_state($q$insert into public.queue_entries(salon_id,source) values(pg_temp.id('royal'),'remote')$q$,'42501','Business table writes require a future controlled command');
select pg_temp.expect_state($q$insert into bookmyturn_private.salon_memberships(salon_id,user_id,role) values(pg_temp.id('royal'),pg_temp.id('a'),'owner')$q$,'42501','Customer cannot assign an Owner role');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('b'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('b')::text,true);
select pg_temp.assert_true((select count(*)=1 from public.queue_entries),'Customer B is isolated from A');
select pg_temp.assert_true((select count(*)=0 from public.service_sessions),'B cannot read A service history');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('barber'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('barber')::text,true);
select pg_temp.assert_true((select count(*)=2 from public.queue_entries),'Barber reads assigned queue, not another barber queue');
select pg_temp.assert_true((select count(*)=1 from bookmyturn_private.sales),'Barber can read own completed-service performance');
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.expenses),'Barber has no default expense access');
select pg_temp.expect_state($q$update public.reviews set rating=1$q$,'42501','Barber cannot rewrite customer reviews');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('coordinator'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('coordinator')::text,true);
select pg_temp.assert_true((select count(*)=3 from public.queue_entries),'Coordinator reads salon queue');
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.sales),'Coordinator has no financial access');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('owner'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('owner')::text,true);
select pg_temp.assert_true((select count(*)=1 from bookmyturn_private.expenses),'Owner reads own salon expenses');
select pg_temp.assert_true((select count(*)>0 from bookmyturn_private.audit_events),'Owner can review salon audit');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('outsider'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('outsider')::text,true);
select pg_temp.assert_true((select count(*)=0 from public.queue_entries),'Owner of another salon cannot read these customers');
select pg_temp.assert_true((select count(*)=0 from bookmyturn_private.sales),'Owner of another salon cannot read these sales');
reset role;
update bookmyturn_private.salon_memberships set is_active=false where user_id=pg_temp.id('barber');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id('barber'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',pg_temp.id('barber')::text,true);
select pg_temp.assert_true((select count(*)=0 from public.queue_entries),'Deactivation revokes work access without JWT refresh');
set local role anon;
select set_config('request.jwt.claims','{}',true);
select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_true((select count(*)=13 from public.salons),'Anonymous salon discovery remains available');
select pg_temp.assert_true((select count(*)=1 from public.published_reviews),'Anonymous caller sees sanitized review publication');
select pg_temp.expect_state('select * from public.queue_entries','42501','Anonymous caller cannot read queue identities');
select pg_temp.expect_state('select * from public.reviews','42501','Anonymous caller cannot read private review links');
reset role;
delete from auth.users where id=pg_temp.id('a');
select pg_temp.assert_true((select customer_id is null and status='completed' from public.service_sessions where id=pg_temp.id('session')),'Account deletion preserves historical service with detached identity');
select pg_temp.assert_true((select count(*)=1 from bookmyturn_private.sales where service_session_id=pg_temp.id('session')),'Account deletion preserves revenue');
rollback;
do $$ begin
 if exists(select 1 from auth.users where id in (
  'b03f0000-0000-4000-8000-000000000001','b03f0000-0000-4000-8000-000000000002',
  'b03f0000-0000-4000-8000-000000000003','b03f0000-0000-4000-8000-000000000004',
  'b03f0000-0000-4000-8000-000000000005','b03f0000-0000-4000-8000-000000000006'))
  or exists(select 1 from public.queue_entries where reference in ('DB-SCHEMA-TEST-A','DB-SCHEMA-TEST-B')) then
  raise exception 'FAIL: Schema fixture cleanup'; end if;
end; $$;
select 'PASS: complete schema constraints, permissions and rollback checks completed' as result;
