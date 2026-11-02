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
insert into finance_ids select 'session',pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(0,'00:00'),200000);
select pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(-1,'23:59'),10000);
select pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(0,'18:00'),100000);
select pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(1,'00:00'),90000);
select pg_temp.sale(pg_temp.i('salon2'),pg_temp.i('chair2'),pg_temp.at(0),50000);
select pg_temp.sale(pg_temp.i('foreign'),pg_temp.i('foreignchair'),pg_temp.at(0),999999);
insert into bookmyturn_private.sale_adjustments(salon_id,sale_id,delta_minor,reason,actor_id,created_at)select pg_temp.i('salon'),id,-10000,'Fixture correction',pg_temp.i('owner'),pg_temp.at(0)from bookmyturn_private.sales where service_session_id=pg_temp.i('session');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('owner'))::text,true);
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=340000,'All own salons include posted corrections, exclude foreign and adjacent days');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters(pg_temp.i('salon')))->'summary'->>'completed_count')::int=2,'Midnight in Colombo starts the correct business day');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'daily'->0->>'revenue_minor')::bigint=340000,'Daily report reconciles');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'monthly'->0->>'revenue_minor')::bigint=340000,'Monthly report reconciles');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters(pg_temp.i('salon')))->'barbers'->0->>'average_minutes')::numeric=45,'Performance uses actual completed duration');
select pg_temp.ok((public.owner_finance('sales',pg_temp.filters(pg_temp.i('salon')))->>'total')::int=3,'Corrections are separate sales ledger entries');
select pg_temp.ok((public.owner_finance('sales',pg_temp.filters()||jsonb_build_object('source','qr'))->>'total')::int=0,'Source filters apply only to sales ledger');
select pg_temp.denied($q$select public.owner_finance('sales',pg_temp.filters()||jsonb_build_object('barber_id',pg_temp.i('foreignchair')))$q$,'P0001');
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request1',0,40000));
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request1',0,40000));
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'operating_minor')::bigint=0,'Unpaid expenses are not paid operating costs');
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request2',1,20000,'paid'));
select public.owner_finance('save_expense',pg_temp.expense_data('unpaid','request3',0,40000));
select public.owner_finance('save_expense',pg_temp.expense_data('capital','request4',0,300000,'paid','capital'));
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'profit_minor')::bigint=320000,'Profit subtracts paid operating costs only');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'capital_minor')::bigint=300000,'Capital purchases are separate');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'expected_minor')::bigint=40000,'Expected expenses remain visible');
select pg_temp.denied($q$select public.owner_finance('save_expense',pg_temp.expense_data('expense','request5',2,25000,'paid'))$q$,'P0001');
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request5',2,25000,'paid','operating','Corrected receipt amount'));
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request5',2,25000,'paid','operating','Corrected receipt amount'));
select pg_temp.denied($q$select public.owner_finance('save_expense',pg_temp.expense_data('expense','request5',2,26000,'paid','operating','Corrected receipt amount'))$q$,'P0001');
select pg_temp.denied($q$select public.owner_finance('save_expense',pg_temp.expense_data('expense','request6',2,20000,'paid','operating','Stale edit'))$q$,'P0001');
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request6',3,20000,'paid','operating','Receipt corrected again'));
select pg_temp.ok((public.owner_finance('expense',jsonb_build_object('id',pg_temp.i('expense')))->>'version')::int=4,'Retries do not increase expense versions twice');
select public.owner_finance('cancel_expense',jsonb_build_object('id',pg_temp.i('expense'),'salon_id',pg_temp.i('salon'),'version',4,'request_id',pg_temp.i('request7'),'change_reason','Expense refunded'));
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'profit_minor')::bigint=340000,'Cancellation reverses recorded cost without deleting history');
select public.owner_finance('save_expense',pg_temp.expense_data('expense','request8',5,20000,'paid','operating','Restore the paid receipt'));
select pg_temp.ok((public.owner_finance('expenses',pg_temp.filters()||jsonb_build_object('status','paid'))->>'total')::int=2,'Expense status filter separates unpaid records');
select pg_temp.denied($q$select public.owner_finance('report',pg_temp.filters(pg_temp.i('foreign')))$q$);
select pg_temp.denied('select * from bookmyturn_private.owner_finance_requests');
select pg_temp.denied($q$select bookmyturn_private.owner_sale_events(null,pg_temp.at(0),pg_temp.at(1))$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('staff'))::text,true);
select pg_temp.denied($q$select public.owner_finance('report',pg_temp.filters())$q$);
select pg_temp.denied($q$select public.owner_finance('expense',jsonb_build_object('id',pg_temp.i('expense')))$q$);
select pg_temp.denied($q$select public.owner_finance('save_expense',pg_temp.expense_data('expense','request1',0,1))$q$);
select pg_temp.ok((select count(*)=0 from bookmyturn_private.expenses),'Barber direct reads cannot access expenses');
select pg_temp.ok(not(public.barber_state(pg_temp.i('chair'))->'performance'?'today_revenue_minor'),'Barber work remains nonfinancial');
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('customer'))::text,true);
select pg_temp.denied($q$select public.owner_finance('sales',pg_temp.filters())$q$);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('other'))::text,true);
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=999999,'Another owner sees only their own salon');
reset role;
select pg_temp.ok((select count(*)=3 from bookmyturn_private.expenses where salon_id=pg_temp.i('salon')),'No duplicate expenses from retries');
select pg_temp.ok(exists(select 1 from bookmyturn_private.audit_events where entity_id=pg_temp.i('expense')::text and changes::text like '%Receipt corrected again%'),'Paid expense correction is audited');
-- More than one page, including zero-priced completed cuts; totals do not truncate.
do $$begin for n in 1..27 loop perform pg_temp.sale(pg_temp.i('salon'),pg_temp.i('chair'),pg_temp.at(0)+n*interval'1 second',100);end loop;end;$$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.i('owner'))::text,true);
select pg_temp.ok(jsonb_array_length(public.owner_finance('sales',pg_temp.filters(pg_temp.i('salon')))->'rows')=25,'Sales are paginated');
select pg_temp.ok((public.owner_finance('sales',pg_temp.filters(pg_temp.i('salon')))->>'next_offset')::int=25,'Sales expose next page');
select pg_temp.ok(jsonb_array_length(public.owner_finance('sales',pg_temp.filters(pg_temp.i('salon'))||jsonb_build_object('offset',25))->'rows')=5,'Last sales page has remaining ledger rows');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=342700,'Report uses all sales, not just the current page');
reset role;
-- Historical commission snapshots remain reportable; current haircut pricing
-- stays completion-only and never invents a commission agreement.
insert into finance_ids select k,gen_random_uuid()from unnest(array['rule','legacy_service','legacy_queue','legacy_session','payment'])k;
insert into public.services(id,salon_id,name,duration_minutes,price_min_minor,price_max_minor)values(pg_temp.i('legacy_service'),pg_temp.i('salon2'),'Legacy fixture service',45,100000,110000);
insert into bookmyturn_private.commission_rules(id,salon_id,valid_from,eligible_sources,surcharge_minor,salon_share_minor,platform_share_minor,disclosure,is_enabled)
 values(pg_temp.i('rule'),pg_temp.i('salon2'),pg_temp.at(-3),array['walk_in'],5000,2000,3000,'Historical fixture agreement',true);
insert into public.queue_entries(id,salon_id,source,status,arrived_at,assigned_barber_id,service_id)
 values(pg_temp.i('legacy_queue'),pg_temp.i('salon2'),'walk_in','arrived',pg_temp.at(0)-interval'46 minutes',pg_temp.i('chair2'),pg_temp.i('legacy_service'));
insert into public.service_sessions(id,salon_id,barber_id,queue_entry_id,service_id,source,service_name_snapshot,duration_minutes_snapshot,price_min_minor_snapshot,price_max_minor_snapshot,agreed_price_minor,price_agreed_at,started_at,
 commission_rule_id,commission_surcharge_minor,commission_salon_minor,commission_platform_minor,commission_disclosure_snapshot,commission_agreed_at)
 values(pg_temp.i('legacy_session'),pg_temp.i('salon2'),pg_temp.i('chair2'),pg_temp.i('legacy_queue'),pg_temp.i('legacy_service'),'walk_in','Legacy fixture service',45,100000,110000,105000,pg_temp.at(0)-interval'45 minutes',pg_temp.at(0)-interval'45 minutes',
 pg_temp.i('rule'),5000,2000,3000,'Historical fixture agreement',pg_temp.at(0)-interval'45 minutes');
insert into public.service_items(salon_id,service_session_id,kind,description,amount_minor)values(pg_temp.i('salon2'),pg_temp.i('legacy_session'),'base','Historical fixture',105000);
update public.service_sessions set status='completed',completed_at=pg_temp.at(0),final_amount_minor=105000,final_amount_agreed_at=pg_temp.at(0)where id=pg_temp.i('legacy_session');
insert into bookmyturn_private.commission_payments(id,salon_id,amount_minor,paid_at)values(pg_temp.i('payment'),pg_temp.i('salon2'),1000,pg_temp.at(0));
insert into bookmyturn_private.commission_payment_allocations(salon_id,payment_id,accrual_id,amount_minor)
 select pg_temp.i('salon2'),pg_temp.i('payment'),a.id,1000 from bookmyturn_private.commission_accruals a join bookmyturn_private.sales s on s.id=a.sale_id where s.service_session_id=pg_temp.i('legacy_session');
set local role authenticated;
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'commission_minor')::bigint=3000,'Only real accruals are reported as commission');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'commission_paid_minor')::bigint=1000,'Recorded settlement payments are reported');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'commission_outstanding_minor')::bigint=2000,'Allocation reduces outstanding commission');
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'profit_minor')::bigint=424700,'Commission payment is not deducted twice from profit');
select pg_temp.denied($q$select public.owner_finance('save_expense',pg_temp.expense_data('expense','request1',6,20000,'paid')||jsonb_build_object('request_id',gen_random_uuid(),'paid_on',pg_temp.today()+1,'change_reason','Invalid future payment'))$q$,'P0001');
select public.manager_command('archive_salon',jsonb_build_object('id',pg_temp.i('salon'),'salon_id',pg_temp.i('salon')));
select pg_temp.ok((public.owner_finance('report',pg_temp.filters())->'summary'->>'revenue_minor')::bigint=447700,'Archived salon financial history stays reportable');
reset role;
select 'PASS: owner finance isolation, posting dates, totals, expense lifecycle, retries, corrections and pagination' as result;
rollback;
