-- Isolated owner accounting fixtures; safe to run on hosted Supabase with rollback.
begin;
create temp table finance_ids(key text primary key,id uuid);
insert into finance_ids values('owner','b81f0000-0000-4000-8000-000000000001'),('other','b81f0000-0000-4000-8000-000000000002'),('staff','b81f0000-0000-4000-8000-000000000003'),('customer','b81f0000-0000-4000-8000-000000000004');
insert into auth.users(id,email)select id,key||'-finance-fixture@example.invalid'from finance_ids;
insert into finance_ids select k,gen_random_uuid()from unnest(array['salon','salon2','foreign','chair','chair2','foreignchair','expense','unpaid','capital','request1','request2','request3','request4','request5','request6','request7','request8'])k;
create function pg_temp.i(k text)returns uuid language sql stable as $$select id from pg_temp.finance_ids where key=k$$;
create function pg_temp.today()returns date language sql stable as $$select(now()at time zone'Asia/Colombo')::date$$;
create function pg_temp.at(day_offset int,tm time default'12:00')returns timestamptz language sql stable as $$select(pg_temp.today()+day_offset+tm)at time zone'Asia/Colombo'$$;
create function pg_temp.ok(v boolean,label text)returns void language plpgsql as $$begin if v is distinct from true then raise exception 'FAIL: %',label;end if;end;$$;
create function pg_temp.denied(statement text,expected text default'42501')returns void language plpgsql as $$begin begin execute statement;exception when others then if sqlstate=expected then return;end if;raise exception 'Expected %, got %: %',expected,sqlstate,sqlerrm;end;raise exception 'Unauthorized operation succeeded: %',statement;end;$$;
create function pg_temp.filters(s uuid default null)returns jsonb language sql stable as $$select jsonb_build_object('salon_id',s,'from',pg_temp.today(),'to',pg_temp.today())$$;
create function pg_temp.expense_data(k text,request text,ver int,amount int,status text default'expected',kind text default'operating',reason text default'')returns jsonb language sql stable as $$select jsonb_build_object('id',pg_temp.i(k),'request_id',pg_temp.i(request),'salon_id',pg_temp.i('salon'),'version',ver,'description','Fixture cost','category_code','rent','amount_minor',amount,'kind',kind,'status',status,'due_on',pg_temp.today(),'paid_on',pg_temp.today(),'change_reason',reason)$$;
do $$begin execute format('grant usage on schema %I to authenticated,anon',pg_my_temp_schema()::regnamespace);end;$$;
grant all on finance_ids to authenticated;
set local role anon;
select pg_temp.denied($q$select public.owner_finance('report','{}')$q$);
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('owner'))::text,true);
set local role authenticated;
select public.manager_command('create_salon',jsonb_build_object('id',pg_temp.i('salon'),'name','Finance fixture one','address','Akurana','opens_at','00:00','closes_at','23:59','weekdays','[0,1,2,3,4,5,6]'::jsonb));
select public.manager_command('create_salon',jsonb_build_object('id',pg_temp.i('salon2'),'name','Finance fixture two','address','Akurana','opens_at','00:00','closes_at','23:59','weekdays','[0,1,2,3,4,5,6]'::jsonb));
select public.manager_command('create_barber',jsonb_build_object('id',pg_temp.i('chair'),'salon_id',pg_temp.i('salon'),'display_name','Finance chair'));
select public.manager_command('create_barber',jsonb_build_object('id',pg_temp.i('chair2'),'salon_id',pg_temp.i('salon2'),'display_name','Second chair'));
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=0,'Empty business has real zero revenue');
select pg_temp.ok(exists(select 1 from jsonb_array_elements(public.owner_finance('report',pg_temp.filters())->'categories')c where c->>'code'='rent'),'Database expense categories are available after a clean development reset');
select pg_temp.denied($q$select public.owner_finance('report',jsonb_build_object('from',pg_temp.today()-400,'to',pg_temp.today()))$q$,'P0001');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('other'))::text,true);
select public.manager_command('create_salon',jsonb_build_object('id',pg_temp.i('foreign'),'name','Foreign finance fixture','address','Akurana','opens_at','00:00','closes_at','23:59','weekdays','[0,1,2,3,4,5,6]'::jsonb));
select public.manager_command('create_barber',jsonb_build_object('id',pg_temp.i('foreignchair'),'salon_id',pg_temp.i('foreign'),'display_name','Foreign chair'));
reset role;
insert into bookmyturn_private.salon_memberships(salon_id,user_id,barber_id,role)values(pg_temp.i('salon'),pg_temp.i('staff'),pg_temp.i('chair'),'barber');
create function pg_temp.sale(salon uuid,chair uuid,at_time timestamptz,amount bigint)returns uuid language plpgsql as $$
declare q uuid;ss uuid;begin
 insert into public.queue_entries(salon_id,source,status,arrived_at,assigned_barber_id)values(salon,'walk_in','arrived',at_time-interval'46 minutes',chair)returning id into q;
 insert into public.service_sessions(salon_id,barber_id,queue_entry_id,source,service_name_snapshot,duration_minutes_snapshot,pricing_mode,started_at)
 values(salon,chair,q,'walk_in','Haircut',45,'completion',at_time-interval'45 minutes')returning id into ss;
 insert into public.service_items(salon_id,service_session_id,kind,description,amount_minor)values(salon,ss,'base','Haircut',amount);
 update public.service_sessions set status='completed',completed_at=at_time,final_amount_minor=amount where id=ss;
 return ss;
end;$$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('owner'))::text,true);
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=0,'Empty business reports zero revenue');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'average_minutes')is null,'No invented average for empty business');
select pg_temp.ok(jsonb_array_length(public.owner_finance('performance',jsonb_build_object('from','2025-12-29','to','2026-01-05'))->'weekly')=2,'Monday-based weeks across year boundary');
select pg_temp.ok(jsonb_array_length(public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-365,'to',pg_temp.today()))->'daily')=366,'Maximum date range includes all days');
reset role;
insert into finance_ids select 'session',pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(0,'00:00'),200000);
update public.service_sessions set customer_id=pg_temp.i('customer')where id=pg_temp.i('session');
insert into public.reviews(salon_id,barber_id,service_session_id,customer_id,rating,body,publish_consent,created_at)
values(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.i('session'),pg_temp.i('customer'),5,'Analytics fixture',true,pg_temp.at(0));
select pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(-1,'23:59'),10000);
select pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(-7),15000);
select pg_temp.sale(pg_temp.i('salon2'),pg_temp.i('chair2'),pg_temp.at(0),50000);
select pg_temp.sale(pg_temp.i('foreign'),pg_temp.i('foreignchair'),pg_temp.at(0),999999);
insert into bookmyturn_private.sale_adjustments(salon_id,sale_id,delta_minor,reason,actor_id,created_at)
select pg_temp.i('salon'),id,-10000,'Fixture correction',pg_temp.i('owner'),pg_temp.at(0)from bookmyturn_private.sales where service_session_id=pg_temp.i('session');
insert into public.queue_entries(id,salon_id,source,status,arrived_at,assigned_barber_id)
values(pg_temp.i('request1'),pg_temp.i('salon'),'walk_in','arrived',pg_temp.at(0),pg_temp.i('chair'));
insert into public.service_sessions(salon_id,barber_id,queue_entry_id,source,service_name_snapshot,duration_minutes_snapshot,pricing_mode,started_at)
values(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.i('request1'),'walk_in','Haircut',45,'completion',pg_temp.at(0));
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('owner'))::text,true);
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=240000,'Owned completed sales and corrections reconcile; foreign sales excluded');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'completed_count')::int=2,'Only completed original sales count');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'average_sale_minor')::bigint=125000,'Average sale excludes corrections');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'average_minutes')::numeric=45,'Duration uses actual time');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'team'->0->>'rating')::numeric=5,'Published period ratings are included');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'team'->0->>'review_count')::int=1,'Published review count');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'previous'->>'revenue_minor')::bigint=10000,'Colombo midnight separates preceding day');
select pg_temp.ok((public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-3,'to',pg_temp.today()-3))->'team'->0->>'rating')is null,'Ratings are date-scoped');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters(pg_temp.i('salon')))->'summary'->>'revenue_minor')::bigint=190000,'Salon scope applies');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters()||jsonb_build_object('barber_id',pg_temp.i('chair2')))->'summary'->>'revenue_minor')::bigint=50000,'Barber scope applies to summary');
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters()||jsonb_build_object('barber_id',pg_temp.i('chair2')))->'daily'->0->>'revenue_minor')::bigint=50000,'Barber scope applies to trend');
select pg_temp.ok(jsonb_array_length(public.owner_finance('performance',pg_temp.filters()||jsonb_build_object('barber_id',pg_temp.i('chair2')))->'team')=2,'Team remains selectable');
select pg_temp.denied($q$select public.owner_finance('performance',pg_temp.filters(pg_temp.i('foreign')))$q$);
select pg_temp.denied($q$select public.owner_finance('performance',pg_temp.filters()||jsonb_build_object('barber_id',pg_temp.i('foreignchair')))$q$);
select pg_temp.denied($q$select public.owner_finance('performance',pg_temp.filters(pg_temp.i('salon'))||jsonb_build_object('barber_id',pg_temp.i('chair2')))$q$);
select pg_temp.denied($q$select public.owner_finance('performance',jsonb_build_object('from',pg_temp.today(),'to',pg_temp.today()+1))$q$,'P0001');
select pg_temp.denied($q$select public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-366,'to',pg_temp.today()))$q$,'P0001');
select pg_temp.denied($q$select public.owner_finance('performance',jsonb_build_object('from',pg_temp.today(),'to',pg_temp.today()-1))$q$,'P0001');
select pg_temp.denied($q$select public.owner_finance('performance',jsonb_build_object('from','invalid'))$q$,'22007');
do $$declare r jsonb;begin
 r:=public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-6,'to',pg_temp.today()));
 perform pg_temp.ok(jsonb_array_length(r->'daily')=7,'Seven daily buckets including zero days');
 perform pg_temp.ok((r->>'comparison_from')::date=pg_temp.today()-13 and(r->>'comparison_to')::date=pg_temp.today()-7,'Previous period adjacent equal length');
 perform pg_temp.ok((r->'previous'->>'revenue_minor')::bigint=15000,'Previous summary');
 perform pg_temp.ok((select sum((v->>'revenue_minor')::bigint)from jsonb_array_elements(r->'daily')v)=(r->'summary'->>'revenue_minor')::bigint,'Daily reconciliation');
 perform pg_temp.ok((select sum((v->>'completed_count')::int)from jsonb_array_elements(r->'weekly')v)=(r->'summary'->>'completed_count')::int,'Weekly haircut reconciliation');
 perform pg_temp.ok((select sum((v->>'revenue_minor')::bigint)from jsonb_array_elements(r->'weekly')v)=(r->'summary'->>'revenue_minor')::bigint,'Weekly revenue reconciliation');
 perform pg_temp.ok((select sum((v->>'revenue_minor')::bigint)from jsonb_array_elements(r->'team')v)=(r->'summary'->>'revenue_minor')::bigint,'Team reconciliation');
end;$$;
reset role;
insert into bookmyturn_private.sale_adjustments(salon_id,sale_id,delta_minor,reason,actor_id,created_at)
select pg_temp.i('salon'),id,-2000,'Historical correction',pg_temp.i('owner'),pg_temp.at(-2)
from bookmyturn_private.sales where service_session_id=pg_temp.i('session');
do $$begin for n in 1..30 loop perform pg_temp.sale(pg_temp.i('salon2'),pg_temp.i('chair2'),pg_temp.at(0)+n*interval'1 second',case when n=1 then 0 else 100 end);end loop;end;$$;
update public.barbers set archived_at=now(),is_active=false where id=pg_temp.i('chair2');
set local role authenticated;
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'completed_count')::int=32,'More than one page and zero-priced cuts counted');
select pg_temp.ok(exists(select 1 from jsonb_array_elements(public.owner_finance('performance',pg_temp.filters())->'team')b where b->>'id'=pg_temp.i('chair2')::text and b->>'archived_at' is not null),'Archived barber history');
select pg_temp.ok((public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-2,'to',pg_temp.today()-2))->'daily'->0->>'revenue_minor')::bigint=-2000,'Correction-only negative day');
select pg_temp.ok((public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-2,'to',pg_temp.today()-2))->'summary'->>'completed_count')::int=0,'Corrections never invent cuts');
select pg_temp.ok((public.owner_finance('performance',jsonb_build_object('from',pg_temp.today()-2,'to',pg_temp.today()-2))->'summary'->>'average_sale_minor')is null,'Null average without cuts');
select pg_temp.denied($q$select bookmyturn_private.owner_sale_events(null,pg_temp.at(0),pg_temp.at(1))$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('staff'))::text,true);
select pg_temp.denied($q$select public.owner_finance('performance',pg_temp.filters())$q$);
select pg_temp.denied($q$select bookmyturn_private.owner_performance(pg_temp.filters())$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('customer'))::text,true);
select pg_temp.denied($q$select public.owner_finance('performance',pg_temp.filters())$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('other'))::text,true);
select pg_temp.ok((public.owner_finance('performance',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=999999,'Other owner scope');
reset role;
set local role anon;
select pg_temp.denied($q$select public.owner_finance('performance','{}')$q$);
select pg_temp.denied($q$select bookmyturn_private.owner_performance('{}')$q$);
reset role;
rollback;
