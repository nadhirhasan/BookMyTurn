begin;

-- Read-only analytics over the existing posting-date ledger. No new financial writes.
create function bookmyturn_private.owner_performance(p_data jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 salon uuid:=nullif(p_data->>'salon_id','')::uuid;
 chair uuid:=nullif(p_data->>'barber_id','')::uuid;
 today date:=(now() at time zone 'Asia/Colombo')::date;
 first_day date:=coalesce(nullif(p_data->>'from','')::date,today);
 last_day date:=coalesce(nullif(p_data->>'to','')::date,today);
 previous_day date; first_at timestamptz; until_at timestamptz; previous_at timestamptz;
 result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.salons s where bookmyturn_private.owns_salon(s.id))
 then raise exception 'Owner access required' using errcode='42501'; end if;
 if salon is not null and not bookmyturn_private.owns_salon(salon)
 then raise exception 'Owner access required' using errcode='42501'; end if;
 if chair is not null and not exists(select 1 from public.barbers b where b.id=chair
  and (salon is null or b.salon_id=salon) and bookmyturn_private.owns_salon(b.salon_id))
 then raise exception 'Owner access required' using errcode='42501'; end if;
 if first_day<'1900-01-01'::date or last_day>today or last_day<first_day or last_day-first_day>365
 then raise exception 'Choose up to 366 days ending today or earlier'; end if;
 previous_day:=first_day-(last_day-first_day+1);
 first_at:=first_day::timestamp at time zone 'Asia/Colombo';
 until_at:=(last_day+1)::timestamp at time zone 'Asia/Colombo';
 previous_at:=previous_day::timestamp at time zone 'Asia/Colombo';

 with allowed as materialized (
  select s.id,s.name,s.archived_at from public.salons s where bookmyturn_private.owns_salon(s.id)
 ),
 events as materialized (
  select e.*,(e.recorded_at at time zone 'Asia/Colombo')::date as day,
   e.recorded_at>=first_at as current_period
  from bookmyturn_private.owner_sale_events(salon,previous_at,until_at)e
 ),
 scoped as materialized(select * from events e where chair is null or e.barber_id=chair),
 totals as (
  select p.current_period,coalesce(sum(e.amount_minor),0) as revenue_minor,
   count(e.id)filter(where e.event_kind='sale') as completed_count,
   coalesce(sum(e.amount_minor)filter(where e.event_kind='adjustment'),0) as adjustments_minor,
   round(avg(e.amount_minor)filter(where e.event_kind='sale')) as average_sale_minor,
   round(avg(e.duration_minutes)filter(where e.event_kind='sale'),1) as average_minutes
  from (values(true),(false))p(current_period) left join scoped e using(current_period) group by 1
 ),
 day_totals as (
  select day,sum(amount_minor)as revenue_minor,count(*)filter(where event_kind='sale')as completed_count
  from scoped where current_period group by day
 ),
 daily as (
  select first_day+n as day,coalesce(d.revenue_minor,0)as revenue_minor,coalesce(d.completed_count,0)as completed_count
  from generate_series(0,last_day-first_day)n left join day_totals d on d.day=first_day+n
 ),
 team_totals as (
  select barber_id,coalesce(sum(amount_minor)filter(where current_period),0)as revenue_minor,
   count(*)filter(where current_period and event_kind='sale')as completed_count,
   coalesce(sum(amount_minor)filter(where not current_period),0)as previous_revenue_minor,
   count(*)filter(where not current_period and event_kind='sale')as previous_completed_count,
   round(avg(amount_minor)filter(where current_period and event_kind='sale'))as average_sale_minor,
   round(avg(duration_minutes)filter(where current_period and event_kind='sale'),1)as average_minutes
  from events group by barber_id
 ),
 reviews as (
  select r.barber_id,round(avg(r.rating),2)as rating,count(*)as review_count
  from public.published_reviews r join allowed a on a.id=r.salon_id
  where (salon is null or a.id=salon)and r.created_at>=first_at and r.created_at<until_at group by r.barber_id
 ),
 team as (
  select b.id,b.display_name,b.photo_url,b.salon_id,a.name as salon_name,b.archived_at,
   coalesce(t.revenue_minor,0)as revenue_minor,coalesce(t.completed_count,0)as completed_count,
   coalesce(t.previous_revenue_minor,0)as previous_revenue_minor,coalesce(t.previous_completed_count,0)as previous_completed_count,
   t.average_sale_minor,t.average_minutes,r.rating,coalesce(r.review_count,0)as review_count
  from public.barbers b join allowed a on a.id=b.salon_id left join team_totals t on t.barber_id=b.id
  left join reviews r on r.barber_id=b.id where salon is null or a.id=salon
 )
 select jsonb_build_object(
  'observed_at',now(),'today',today,'from',first_day,'to',last_day,
  'comparison_from',previous_day,'comparison_to',first_day-1,
  'summary',(select to_jsonb(t)-'current_period' from totals t where current_period),
  'previous',(select to_jsonb(t)-'current_period' from totals t where not current_period),
  'salons',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'archived',archived_at is not null)order by name)from allowed),'[]'),
  'daily',(select jsonb_agg(to_jsonb(d)order by day)from daily d),
  'weekly',(select jsonb_agg(to_jsonb(w)order by w.day)from (
   select min(day)as day,max(day)as until,sum(revenue_minor)as revenue_minor,sum(completed_count)as completed_count
   from daily group by date_trunc('week',day::timestamp))w),
  'team',coalesce((select jsonb_agg(to_jsonb(t)order by revenue_minor desc,display_name,id)from team t),'[]')
 )into result;
 return result;
end;$$;

create or replace function public.owner_finance(p_action text,p_data jsonb default '{}')returns jsonb
language sql security invoker set search_path=''as $$
 select case when p_action='performance' then bookmyturn_private.owner_performance(p_data)
 else bookmyturn_private.owner_finance(p_action,p_data)end;
$$;
revoke all on function bookmyturn_private.owner_performance(jsonb)from public,anon,authenticated;
grant execute on function bookmyturn_private.owner_performance(jsonb)to authenticated;
revoke all on function public.owner_finance(text,jsonb)from public,anon;
grant execute on function public.owner_finance(text,jsonb)to authenticated;
commit;
