begin;
-- A free second barber does not make a customer free for a second haircut.
-- Keep real salon capacity per barber, but protect the customer's own time too.
alter table bookmyturn_private.barber_schedule_blocks add column customer_id uuid;
update bookmyturn_private.barber_schedule_blocks b set customer_id=a.customer_id
 from public.appointments a where a.id=b.appointment_id;
create function bookmyturn_private.sync_block_customer() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.kind='appointment' then
  select a.customer_id into new.customer_id from public.appointments a where a.id=new.appointment_id;
 else new.customer_id:=null;
 end if;
 return new;
end; $$;
revoke all on function bookmyturn_private.sync_block_customer() from public,anon,authenticated;
create trigger sync_block_customer before insert or update on bookmyturn_private.barber_schedule_blocks
 for each row execute function bookmyturn_private.sync_block_customer();
alter table bookmyturn_private.barber_schedule_blocks add constraint customer_appointment_no_overlap
 exclude using gist (customer_id extensions.gist_uuid_ops with =,tstzrange(starts_at,ends_at,'[)') with &&)
 where (is_active and customer_id is not null);

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
    and (p_day<>(now() at time zone 'Asia/Colombo')::date or exists(select 1 from public.barber_status st where st.barber_id=b.id and st.availability='available'))
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
