begin;
create function bookmyturn_private.can_plan_barber(p_barber uuid) returns boolean
language sql stable set search_path='' as $$
 select exists(select 1 from public.barber_status st where st.barber_id=p_barber and
  (st.availability='available' or (st.availability='on_break' and exists(select 1 from bookmyturn_private.barber_schedule_blocks bl
   where bl.barber_id=p_barber and bl.kind='break' and bl.is_active and bl.ends_at>now()))));
$$;
revoke all on function bookmyturn_private.can_plan_barber(uuid) from public,anon,authenticated;

create or replace function bookmyturn_private.queue_forecast(p_salon uuid)
returns table(queue_id uuid,barber_id uuid,starts_at timestamptz,ends_at timestamptz)
language plpgsql stable set search_path='' as $$
declare q record; candidate record; chosen uuid; at_time timestamptz; best timestamptz;
 duration integer; busy jsonb:='{}'; base timestamptz:=now();
begin
 for q in select qe.* from public.queue_entries qe where qe.salon_id=p_salon and qe.status='arrived'
 order by qe.arrival_sequence loop
   chosen:=null; best:=null;
   for candidate in select b.id,coalesce(bs.duration_minutes,s.duration_minutes,sp.default_service_minutes) as minutes
    from public.barbers b join public.barber_status st on st.barber_id=b.id and bookmyturn_private.can_plan_barber(st.barber_id)
    join bookmyturn_private.salon_policies sp on sp.salon_id=b.salon_id
    left join public.services s on s.id=q.service_id and s.is_active
    left join public.barber_services bs on bs.barber_id=b.id and bs.service_id=s.id
    where b.salon_id=p_salon and b.is_published and b.is_active
      and (q.preferred_barber_id is null or q.preferred_barber_id=b.id)
      and (q.service_id is null or bs.service_id is not null)
   loop
    at_time:=bookmyturn_private.free_start(p_salon,candidate.id,
      greatest(base,coalesce((busy->>candidate.id::text)::timestamptz,base)),candidate.minutes);
    if at_time is not null and (best is null or at_time<best) then
      best:=at_time; chosen:=candidate.id; duration:=candidate.minutes;
    end if;
   end loop;
   queue_id:=q.id; barber_id:=chosen; starts_at:=best; ends_at:=best+make_interval(mins=>duration);
   if chosen is not null then busy:=jsonb_set(busy,array[chosen::text],to_jsonb(ends_at)); end if;
   return next;
 end loop;
 for candidate in select b.id,sp.default_service_minutes as minutes from public.barbers b
   join public.barber_status st on st.barber_id=b.id and bookmyturn_private.can_plan_barber(st.barber_id)
   join bookmyturn_private.salon_policies sp on sp.salon_id=b.salon_id
   where b.salon_id=p_salon and b.is_published and b.is_active loop
   queue_id:=null; barber_id:=candidate.id;
   starts_at:=bookmyturn_private.free_start(p_salon,candidate.id,
    greatest(base,coalesce((busy->>candidate.id::text)::timestamptz,base)),candidate.minutes);
   ends_at:=starts_at+make_interval(mins=>candidate.minutes); return next;
 end loop;
end; $$;
create or replace function bookmyturn_private.queue_estimate(p_salon uuid,p_service uuid,p_barber uuid)
returns table(barber_id uuid,starts_at timestamptz) language sql stable set search_path='' as $$
 with forecast as materialized(select * from bookmyturn_private.queue_forecast(p_salon)),
 candidates as (
  select b.id,bookmyturn_private.free_start(p_salon,b.id,
    greatest(now(),(select max(f.ends_at) from forecast f where f.queue_id is not null and f.barber_id=b.id)),
    coalesce(bs.duration_minutes,s.duration_minutes,sp.default_service_minutes)) as at_time
  from public.barbers b join public.salons salon on salon.id=b.salon_id and salon.is_published and salon.is_open
  join public.barber_status st on st.barber_id=b.id and bookmyturn_private.can_plan_barber(st.barber_id)
  join bookmyturn_private.salon_policies sp on sp.salon_id=b.salon_id
  left join public.services s on s.id=p_service and s.salon_id=p_salon and s.is_active
  left join public.barber_services bs on bs.barber_id=b.id and bs.service_id=s.id
  where b.salon_id=p_salon and b.is_active and b.is_published and (p_barber is null or p_barber=b.id)
   and (p_service is null or bs.service_id is not null)
 ) select id,at_time from candidates where at_time is not null order by at_time,id limit 1;
$$;
create or replace function bookmyturn_private.customer_slots(p_salon uuid,p_service uuid,p_day date,p_barber uuid default null)
returns table(starts_at timestamptz,ends_at timestamptz,barber_id uuid,available boolean)
language sql stable security definer set search_path='' as $$
 with forecast as materialized (select * from bookmyturn_private.queue_forecast(p_salon)),
 candidates as (
 select t as starts_at,t+make_interval(mins=>coalesce(bs.duration_minutes,s.duration_minutes)) as ends_at,b.id as barber_id,
  (t>now() and bookmyturn_private.free_start(p_salon,b.id,t,coalesce(bs.duration_minutes,s.duration_minutes))=t
    and not exists(select 1 from forecast f where f.queue_id is not null and f.barber_id=b.id
      and tstzrange(t,t+make_interval(mins=>coalesce(bs.duration_minutes,s.duration_minutes)),'[)') && tstzrange(f.starts_at,f.ends_at,'[)'))
    and not exists(select 1 from bookmyturn_private.barber_schedule_blocks personal
      where personal.customer_id=(select auth.uid()) and personal.is_active
      and tstzrange(t,t+make_interval(mins=>coalesce(bs.duration_minutes,s.duration_minutes)),'[)') && tstzrange(personal.starts_at,personal.ends_at,'[)'))
    and (p_day<>(now() at time zone 'Asia/Colombo')::date or exists(select 1 from public.barber_status st where st.barber_id=b.id and bookmyturn_private.can_plan_barber(st.barber_id)))
  ) as available
 from public.services s join public.barber_services bs on bs.service_id=s.id
 join public.barbers b on b.id=bs.barber_id and b.is_active and b.is_published
 join bookmyturn_private.salon_policies sp on sp.salon_id=s.salon_id
 cross join lateral bookmyturn_private.work_window(p_salon,b.id,p_day) w
 cross join lateral generate_series(w.opens,w.closes-make_interval(mins=>coalesce(bs.duration_minutes,s.duration_minutes)),interval '15 minutes') t
 where s.id=p_service and s.salon_id=p_salon and s.is_active and (p_barber is null or p_barber=b.id)
 and p_day between (now() at time zone 'Asia/Colombo')::date and (now() at time zone 'Asia/Colombo')::date+sp.forecast_horizon_days
 ) select * from candidates;
$$;
notify pgrst,'reload schema';
commit;
