begin;

alter table bookmyturn_private.expenses
 add column version integer not null default 1 check(version>0),
 add column created_at timestamptz not null default clock_timestamp(),
 add column updated_at timestamptz not null default clock_timestamp(),
 add column ever_paid boolean not null default false,
 add column last_change_reason text;
create index owner_sales_period on bookmyturn_private.sales(salon_id,recorded_at desc,id);
create index owner_adjustments_period on bookmyturn_private.sale_adjustments(salon_id,created_at desc);
create index owner_expenses_due on bookmyturn_private.expenses(salon_id,due_on desc,id);
create index owner_expenses_paid on bookmyturn_private.expenses(salon_id,paid_at desc,id)where status='paid';

create table bookmyturn_private.owner_finance_requests(
 id uuid primary key,salon_id uuid not null references public.salons,
 actor_id uuid references auth.users on delete set null,payload_hash bytea not null,
 result jsonb not null,created_at timestamptz not null default clock_timestamp()
);
alter table bookmyturn_private.owner_finance_requests enable row level security;
revoke all on bookmyturn_private.owner_finance_requests from public,anon,authenticated;
create policy finance_requests_rpc_only on bookmyturn_private.owner_finance_requests for all to authenticated using(false)with check(false);
create index finance_requests_salon on bookmyturn_private.owner_finance_requests(salon_id);
create index finance_requests_actor on bookmyturn_private.owner_finance_requests(actor_id);

-- Posting-date ledger: a later sale correction belongs to its own posting day.
create function bookmyturn_private.owner_sale_events(p_salon uuid,p_start timestamptz,p_end timestamptz)
returns table(id uuid,event_kind text,salon_id uuid,salon_name text,barber_id uuid,barber_name text,
 service_session_id uuid,source text,recorded_at timestamptz,amount_minor bigint,payment_method text,reason text,duration_minutes numeric)
language sql stable security definer set search_path=''as $$
 with allowed as materialized(select s.id,s.name from public.salons s where(p_salon is null or s.id=p_salon)and bookmyturn_private.owns_salon(s.id))
 select sale.id,'sale',s.id,s.name,ss.barber_id,b.display_name,ss.id,ss.source,sale.recorded_at,sale.amount_minor,sale.payment_method,null::text,
 greatest(0,extract(epoch from(ss.completed_at-ss.started_at))/60)
 from bookmyturn_private.sales sale join allowed s on s.id=sale.salon_id
 join public.service_sessions ss on ss.id=sale.service_session_id join public.barbers b on b.id=ss.barber_id
 where sale.recorded_at>=p_start and sale.recorded_at<p_end and ss.status='completed'
 union all
 select a.id,'adjustment',s.id,s.name,ss.barber_id,b.display_name,ss.id,ss.source,a.created_at,a.delta_minor,sale.payment_method,a.reason,null::numeric
 from bookmyturn_private.sale_adjustments a join allowed s on s.id=a.salon_id
 join bookmyturn_private.sales sale on sale.id=a.sale_id join public.service_sessions ss on ss.id=sale.service_session_id
 join public.barbers b on b.id=ss.barber_id where a.created_at>=p_start and a.created_at<p_end;
$$;
revoke all on function bookmyturn_private.owner_sale_events(uuid,timestamptz,timestamptz)from public,anon,authenticated;

create function bookmyturn_private.owner_finance(p_action text,p_data jsonb)returns jsonb
language plpgsql security definer set search_path=''as $$
declare u uuid:=auth.uid();today date:=(clock_timestamp()at time zone'Asia/Colombo')::date;
 salon uuid:=nullif(p_data->>'salon_id','')::uuid;chair uuid:=nullif(p_data->>'barber_id','')::uuid;
 first_day date:=coalesce(nullif(p_data->>'from','')::date,today);last_day date:=coalesce(nullif(p_data->>'to','')::date,today);
 first_at timestamptz;until_at timestamptz;rows jsonb;result jsonb;total bigint;start_row integer:=coalesce((p_data->>'offset')::integer,0);
 source_filter text:=nullif(p_data->>'source','');status_filter text:=nullif(p_data->>'status','');
 entry uuid;request_id uuid;fingerprint bytea;previous bookmyturn_private.owner_finance_requests;old bookmyturn_private.expenses;
 amount bigint;due date;paid date;category text;expense_description text;expense_kind text;new_status text;reason text;
begin
 if u is null then raise exception 'Owner access required'using errcode='42501';end if;
 if salon is not null and not bookmyturn_private.owns_salon(salon)or not exists(select 1 from public.salons s where bookmyturn_private.owns_salon(s.id))
 then raise exception 'Owner access required'using errcode='42501';end if;
 if p_action in('save_expense','cancel_expense')then
  if salon is null then raise exception 'Choose a salon';end if;
  perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
  perform 1 from bookmyturn_private.salon_memberships where salon_id=salon and user_id=u and role='owner'and is_active for share;
  if not found then raise exception 'Owner access required'using errcode='42501';end if;
  request_id:=(p_data->>'request_id')::uuid;entry:=(p_data->>'id')::uuid;
  if request_id is null or entry is null then raise exception 'Check expense details';end if;
  fingerprint:=sha256(convert_to(p_action||(p_data-'request_id')::text,'UTF8'));
  select * into previous from bookmyturn_private.owner_finance_requests where id=request_id;
  if previous.id is not null then
   if previous.actor_id is distinct from u or previous.salon_id<>salon or previous.payload_hash<>fingerprint then raise exception 'This request has already been used';end if;
   return previous.result;
  end if;
  select * into old from bookmyturn_private.expenses where id=entry and salon_id=salon for update;
  if old.id is null and(p_action='cancel_expense'or coalesce((p_data->>'version')::integer,-1)<>0)then raise exception 'Expense unavailable';end if;
  if old.id is not null and old.version is distinct from(p_data->>'version')::integer then raise exception 'This expense changed. Refresh before saving';end if;
  reason:=nullif(btrim(p_data->>'change_reason'),'');
  if(old.status='paid'or old.ever_paid)and(reason is null or char_length(reason)>500)then raise exception 'Explain the correction to this paid expense';end if;
  if p_action='cancel_expense'then
   update bookmyturn_private.expenses set status='cancelled',paid_at=null,ever_paid=ever_paid or old.status='paid',version=version+1,updated_at=clock_timestamp(),last_change_reason=reason where id=entry;
  else
   amount:=(p_data->>'amount_minor')::bigint;due:=(p_data->>'due_on')::date;paid:=nullif(p_data->>'paid_on','')::date;
   category:=p_data->>'category_code';expense_description:=btrim(p_data->>'description');expense_kind:=p_data->>'kind';new_status:=p_data->>'status';
   if amount is null or amount<=0 or amount>9999999999 then raise exception 'Enter a valid expense amount';end if;
   if due is null or due<'1900-01-01'or due>'2100-12-31'then raise exception 'Choose a valid expense date';end if;
   if expense_description is null or char_length(expense_description)not between 1 and 200 then raise exception 'Enter an expense description';end if;
   if not exists(select 1 from bookmyturn_private.expense_categories where code=category)then raise exception 'Choose an expense category';end if;
   if expense_kind is null or expense_kind not in('operating','capital')or new_status is null or new_status not in('expected','paid')or char_length(coalesce(p_data->>'note',''))>2000 or char_length(coalesce(p_data->>'payment_method',''))>80 then raise exception 'Check expense details';end if;
   if new_status='paid'and(paid is null or paid>today or paid<'1900-01-01')then raise exception 'Choose a payment date up to today';end if;
   if old.id is null then
    insert into bookmyturn_private.expenses(id,salon_id,category_code,due_on,kind,description,amount_minor,status,paid_at,payment_method,note,ever_paid,last_change_reason)
    values(entry,salon,category,due,expense_kind,expense_description,amount,new_status,case when new_status='paid'then(paid+'12:00'::time)at time zone'Asia/Colombo'end,
    nullif(btrim(p_data->>'payment_method'),''),nullif(btrim(p_data->>'note'),''),new_status='paid',reason);
   else
    update bookmyturn_private.expenses set category_code=category,due_on=due,kind=expense_kind,description=expense_description,amount_minor=amount,status=new_status,
    paid_at=case when new_status='paid'then(paid+'12:00'::time)at time zone'Asia/Colombo'end,payment_method=nullif(btrim(p_data->>'payment_method'),''),note=nullif(btrim(p_data->>'note'),''),
    ever_paid=ever_paid or old.status='paid'or new_status='paid',last_change_reason=reason,version=version+1,updated_at=clock_timestamp()where id=entry;
   end if;
  end if;
  select jsonb_build_object('id',id,'version',version)into result from bookmyturn_private.expenses where id=entry;
  insert into bookmyturn_private.owner_finance_requests(id,salon_id,actor_id,payload_hash,result)values(request_id,salon,u,fingerprint,result);
  return result;
 end if;
 if first_day is null or last_day is null or last_day<first_day or last_day-first_day>365 or first_day<'1900-01-01'or last_day>'2100-12-31'then raise exception 'Choose a date range up to 366 days';end if;
 first_at:=first_day::timestamp at time zone'Asia/Colombo';until_at:=(last_day+1)::timestamp at time zone'Asia/Colombo';
 if start_row<0 or start_row>100000 then raise exception 'Check report filters';end if;
 if chair is not null and not exists(select 1 from public.barbers b where b.id=chair and(salon is null or b.salon_id=salon)and bookmyturn_private.owns_salon(b.salon_id))then raise exception 'Choose a barber from this salon';end if;
 if source_filter is not null and source_filter not in('remote','qr','walk_in','appointment')then raise exception 'Check report filters';end if;
 if p_action='expense'then
  select to_jsonb(e)||jsonb_build_object('salon_name',s.name,'category_name',c.name,'paid_on',(e.paid_at at time zone'Asia/Colombo')::date)into result
  from bookmyturn_private.expenses e join public.salons s on s.id=e.salon_id join bookmyturn_private.expense_categories c on c.code=e.category_code
  where e.id=(p_data->>'id')::uuid and(salon is null or e.salon_id=salon)and bookmyturn_private.owns_salon(e.salon_id);
  if result is null then raise exception 'Expense unavailable';end if;return result;
 elsif p_action='sales'then
  with entries as materialized(select * from bookmyturn_private.owner_sale_events(salon,first_at,until_at)e where(chair is null or e.barber_id=chair)and(source_filter is null or e.source=source_filter))
  select(select count(*)from entries),coalesce((select jsonb_agg(to_jsonb(e)order by e.recorded_at desc,e.id desc)from(select * from entries order by recorded_at desc,id desc limit 25 offset start_row)e),'[]')into total,rows;
  return jsonb_build_object('rows',rows,'total',total,'next_offset',case when total>start_row+25 then start_row+25 end,'observed_at',clock_timestamp());
 elsif p_action='expenses'then
  if status_filter is not null and status_filter not in('paid','expected','cancelled')then raise exception 'Check report filters';end if;
  with entries as materialized(select e.*,s.name as salon_name,c.name as category_name,(e.paid_at at time zone'Asia/Colombo')::date as paid_on
  from bookmyturn_private.expenses e join public.salons s on s.id=e.salon_id join bookmyturn_private.expense_categories c on c.code=e.category_code
  where(salon is null or e.salon_id=salon)and bookmyturn_private.owns_salon(e.salon_id)and(status_filter is null or e.status=status_filter)
  and(case when e.status='paid'then(e.paid_at at time zone'Asia/Colombo')::date else e.due_on end between first_day and last_day))
  select(select count(*)from entries),coalesce((select jsonb_agg(to_jsonb(e)order by coalesce(e.paid_on,e.due_on)desc,e.id desc)from(select * from entries order by coalesce(paid_on,due_on)desc,id desc limit 25 offset start_row)e),'[]')into total,rows;
  return jsonb_build_object('rows',rows,'total',total,'next_offset',case when total>start_row+25 then start_row+25 end,'observed_at',clock_timestamp());
 elsif p_action<>'report'then raise exception 'Unknown finance action';end if;
 with allowed as materialized(select s.*from public.salons s where(salon is null or s.id=salon)and bookmyturn_private.owns_salon(s.id)),
 events as materialized(select * from bookmyturn_private.owner_sale_events(salon,first_at,until_at)),
 costs as materialized(select e.*from bookmyturn_private.expenses e join allowed s on s.id=e.salon_id where(e.status='paid'and e.paid_at>=first_at and e.paid_at<until_at)or(e.status='expected'and e.due_on between first_day and last_day)),
 commissions as materialized(select a.*from bookmyturn_private.commission_accruals a join allowed s on s.id=a.salon_id where a.accrued_at>=first_at and a.accrued_at<until_at),
 totals as(select coalesce((select sum(amount_minor)from events),0)as revenue_minor,(select count(*)from events where event_kind='sale')as completed_count,
 coalesce((select sum(amount_minor)from events where event_kind='adjustment'),0)as adjustments_minor,
 coalesce((select sum(amount_minor)from costs where status='paid'and kind='operating'and paid_at>=first_at and paid_at<until_at),0)as operating_minor,
 coalesce((select sum(amount_minor)from costs where status='paid'and kind='capital'and paid_at>=first_at and paid_at<until_at),0)as capital_minor,
 coalesce((select sum(amount_minor)from costs where status='expected'and due_on between first_day and last_day),0)as expected_minor,
 coalesce((select sum(platform_share_minor)from commissions),0)as commission_minor),
 day_sales as(select(recorded_at at time zone'Asia/Colombo')::date as day,sum(amount_minor)as revenue_minor,count(*)filter(where event_kind='sale')as completed_count from events group by 1),
 day_costs as(select(paid_at at time zone'Asia/Colombo')::date as day,sum(amount_minor)as operating_minor from costs where status='paid'and kind='operating'and paid_at>=first_at and paid_at<until_at group by 1),
 day_commission as(select(accrued_at at time zone'Asia/Colombo')::date as day,sum(platform_share_minor)as commission_minor from commissions group by 1),
 days as(select d::date as day from generate_series(first_day::timestamp,last_day::timestamp,interval'1 day')d),
 daily as(select d.day,coalesce(s.revenue_minor,0)as revenue_minor,coalesce(s.completed_count,0)as completed_count,coalesce(e.operating_minor,0)as operating_minor,coalesce(c.commission_minor,0)as commission_minor
 from days d left join day_sales s on s.day=d.day left join day_costs e on e.day=d.day left join day_commission c on c.day=d.day),
 performance as(select b.id,b.display_name,b.salon_id,s.name as salon_name,b.archived_at,
 (select count(*)from events e where e.barber_id=b.id and e.event_kind='sale')as completed_count,
 coalesce((select sum(amount_minor)from events e where e.barber_id=b.id),0)as revenue_minor,
 (select round(avg(duration_minutes),1)from events e where e.barber_id=b.id and e.event_kind='sale')as average_minutes,
 (select round(avg(r.rating),2)from public.published_reviews r where r.barber_id=b.id and r.created_at>=first_at and r.created_at<until_at)as rating,
 (select count(*)from public.published_reviews r where r.barber_id=b.id and r.created_at>=first_at and r.created_at<until_at)as review_count
 from public.barbers b join allowed s on s.id=b.salon_id)
 select jsonb_build_object('observed_at',clock_timestamp(),'today',today,'from',first_day,'to',last_day,
 'salons',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'archived',s.archived_at is not null)order by s.name)from public.salons s where bookmyturn_private.owns_salon(s.id)),'[]'),
 'categories',(select jsonb_agg(to_jsonb(c)order by c.name)from bookmyturn_private.expense_categories c),
 'summary',(select to_jsonb(t)||jsonb_build_object('profit_minor',t.revenue_minor-t.operating_minor-t.commission_minor,
 'commission_paid_minor',coalesce((select sum(p.amount_minor)from bookmyturn_private.commission_payments p join allowed s on s.id=p.salon_id where p.paid_at>=first_at and p.paid_at<until_at),0),
 'commission_outstanding_minor',coalesce((select sum(a.platform_share_minor)from bookmyturn_private.commission_accruals a join allowed s on s.id=a.salon_id where a.accrued_at<until_at),0)-
 coalesce((select sum(a.amount_minor)from bookmyturn_private.commission_payment_allocations a join bookmyturn_private.commission_payments p on p.id=a.payment_id join bookmyturn_private.commission_accruals c on c.id=a.accrual_id join allowed s on s.id=a.salon_id where p.paid_at<until_at and c.accrued_at<until_at),0))from totals t),
 'daily',(select jsonb_agg(to_jsonb(d)||jsonb_build_object('profit_minor',d.revenue_minor-d.operating_minor-d.commission_minor)order by d.day)from daily d),
 'monthly',(select jsonb_agg(to_jsonb(m)order by m.month)from(select to_char(day,'YYYY-MM')as month,sum(revenue_minor)as revenue_minor,sum(completed_count)as completed_count,sum(operating_minor)as operating_minor,sum(commission_minor)as commission_minor,sum(revenue_minor-operating_minor-commission_minor)as profit_minor from daily group by 1)m),
 'barbers',coalesce((select jsonb_agg(to_jsonb(b)order by b.revenue_minor desc,b.display_name)from performance b),'[]'))into result;
 return result;
end;$$;
create function public.owner_finance(p_action text,p_data jsonb default'{}')returns jsonb
language sql security invoker set search_path=''as $$select bookmyturn_private.owner_finance(p_action,p_data);$$;
revoke all on function public.owner_finance(text,jsonb),bookmyturn_private.owner_finance(text,jsonb)from public,anon,authenticated;
grant execute on function public.owner_finance(text,jsonb),bookmyturn_private.owner_finance(text,jsonb)to authenticated;
commit;
