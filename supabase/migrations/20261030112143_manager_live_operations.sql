begin;
create table bookmyturn_private.staff_alerts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 salon_id uuid not null references public.salons, barber_id uuid,
 entity_kind text not null check(entity_kind in ('queue','appointment')),
 entity_id uuid not null, event_key text not null, title text not null, body text not null,
 created_at timestamptz not null default clock_timestamp(), read_at timestamptz,
 unique(user_id,event_key), foreign key(salon_id,barber_id) references public.barbers(salon_id,id)
);
alter table bookmyturn_private.staff_alerts enable row level security;
revoke all on bookmyturn_private.staff_alerts from public,anon,authenticated;
create index staff_alerts_user_time on bookmyturn_private.staff_alerts(user_id,created_at desc);
create function bookmyturn_private.can_read_staff_alert(p_salon uuid,p_barber uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from bookmyturn_private.salon_memberships m
 where m.user_id=auth.uid() and m.salon_id=p_salon and m.is_active and
 (m.role='owner' or (m.role='barber' and (p_barber is null or p_barber=m.barber_id)
 and exists(select 1 from public.barbers b where b.id=m.barber_id and b.is_active))));
$$;
create policy staff_alert_self on bookmyturn_private.staff_alerts for select to authenticated
 using(user_id=(select auth.uid()) and bookmyturn_private.can_read_staff_alert(salon_id,barber_id));

create function bookmyturn_private.staff_event(p_salon uuid,p_barber uuid,p_kind text,p_id uuid,p_status text,p_reference text,p_at timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare headline text; detail text;
begin
 headline:=case when p_kind='queue' then case p_status when 'joined' then 'New queue join' when 'arrived' then 'Customer arrived' when 'cancelled' then 'Queue visit cancelled' end
 else case p_status when 'pending' then 'New appointment request' when 'cancelled' then 'Appointment cancelled' when 'confirmed' then 'Customer accepted a time' end end;
 if headline is null then return;end if;
 detail:=case p_status when 'joined' then 'A customer is on the way. Check them in when they arrive.' when 'arrived' then 'A customer is physically waiting at your salon.' when 'pending' then 'Review the requested time in your salon agenda.' when 'confirmed' then 'The customer accepted your alternative appointment time.' else 'The customer cancelled their visit.' end;
 insert into bookmyturn_private.staff_alerts(user_id,salon_id,barber_id,entity_kind,entity_id,event_key,title,body,created_at,read_at)
 select m.user_id,p_salon,p_barber,p_kind,p_id,p_kind||':'||p_id||':'||p_status,headline,detail||' '||p_reference,p_at,
 case when m.user_id=auth.uid() then clock_timestamp() else null end
 from bookmyturn_private.salon_memberships m where m.salon_id=p_salon and m.is_active and m.user_id is not null
 and (m.role='owner' or (m.role='barber' and (p_barber is null or p_barber=m.barber_id)
 and exists(select 1 from public.barbers b where b.id=m.barber_id and b.is_active)))
 on conflict(user_id,event_key) do nothing;
end;$$;
create function bookmyturn_private.staff_visit_changed() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if tg_op='UPDATE' and old.status=new.status then return new;end if;
 if tg_table_name='queue_entries' then
  if new.status in ('joined','arrived','cancelled') then
   perform bookmyturn_private.staff_event(new.salon_id,coalesce(new.assigned_barber_id,new.preferred_barber_id),'queue',new.id,new.status,new.reference);
  end if;
 else
  if new.status in ('pending','cancelled') or (tg_op='UPDATE' and old.status='alternative_suggested' and new.status='confirmed') then
   select bl.barber_id into target from bookmyturn_private.barber_schedule_blocks bl where bl.appointment_id=new.id and bl.is_active;
   perform bookmyturn_private.staff_event(new.salon_id,coalesce(new.confirmed_barber_id,new.preferred_barber_id,target),'appointment',new.id,new.status,new.reference);
  end if;
 end if;
 return new;
end;$$;
create trigger zz_staff_queue_event after insert or update of status on public.queue_entries for each row execute function bookmyturn_private.staff_visit_changed();
create trigger zz_staff_appointment_event after insert or update of status on public.appointments for each row execute function bookmyturn_private.staff_visit_changed();

-- Only invalidate the recipient's data; no visit/customer payload is broadcast.
create function bookmyturn_private.staff_alert_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null then
  perform realtime.send('{}'::jsonb,'changed','staff:'||new.user_id,true);
 end if;
 return new;
end;$$;
create trigger staff_alert_broadcast after insert or update of read_at on bookmyturn_private.staff_alerts for each row execute function bookmyturn_private.staff_alert_changed();
do $$begin
 if to_regclass('realtime.messages') is not null then
  execute $p$create policy staff_invalidation_receive on realtime.messages for select to authenticated
   using(extension='broadcast' and topic='staff:'||(select auth.uid())::text)$p$;
 end if;
end;$$;

-- Preserve the existing manager profile/catalogue API and add operational data.
alter function bookmyturn_private.manager_state() rename to manager_catalog_state;
create function bookmyturn_private.manager_state() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare base jsonb; salons jsonb; alerts jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in to manage your salons' using errcode='42501';end if;
 base:=bookmyturn_private.manager_catalog_state();
 select coalesce(jsonb_agg(s||jsonb_build_object(
  'incoming',(select count(*) from public.queue_entries q where q.salon_id=(s->>'id')::uuid and q.status='joined'),
  'in_service',(select count(*) from public.service_sessions ss where ss.salon_id=(s->>'id')::uuid and ss.status='in_service'),
  'queues',(select coalesce(jsonb_agg(to_jsonb(q)||jsonb_build_object('barber_id',coalesce(q.assigned_barber_id,q.preferred_barber_id,f.barber_id),'estimated_start',f.starts_at) order by q.arrival_sequence nulls last,q.created_at),'[]')
    from public.queue_entries q left join bookmyturn_private.queue_forecast((s->>'id')::uuid) f on f.queue_id=q.id
    where q.salon_id=(s->>'id')::uuid and q.status in ('joined','arrived','in_service')),
  'appointments',(select coalesce(jsonb_agg(to_jsonb(a)||jsonb_build_object('barber_id',coalesce(a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id)) order by coalesce(a.confirmed_start,a.requested_start)),'[]')
    from public.appointments a left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id and bl.is_active
    where a.salon_id=(s->>'id')::uuid and a.status in ('pending','alternative_suggested','confirmed','arrived','in_service')))), '[]')
 into salons from jsonb_array_elements(base->'salons')s;
 select coalesce(jsonb_agg(to_jsonb(a)||jsonb_build_object('salon_name',s.name) order by a.created_at desc),'[]') into alerts
 from (select * from bookmyturn_private.staff_alerts where user_id=auth.uid() and bookmyturn_private.can_read_staff_alert(salon_id,barber_id) order by created_at desc limit 100)a
 join public.salons s on s.id=a.salon_id;
 return base||jsonb_build_object('salons',salons,'alerts',alerts,'observed_at',clock_timestamp(),
 'today',(now() at time zone 'Asia/Colombo')::date,
 'unread',(select count(*) from bookmyturn_private.staff_alerts where user_id=auth.uid() and read_at is null and bookmyturn_private.can_read_staff_alert(salon_id,barber_id)));
end;$$;
-- Recreate wrapper because the previous SQL body was bound to the renamed OID.
create or replace function public.manager_state() returns jsonb language sql stable security invoker set search_path='' as $$select bookmyturn_private.manager_state();$$;

create function bookmyturn_private.staff_alert_read(p_id uuid default null) returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Sign in to view activity' using errcode='42501';end if;
 update bookmyturn_private.staff_alerts set read_at=clock_timestamp() where user_id=auth.uid() and read_at is null
 and (p_id is null or id=p_id) and bookmyturn_private.can_read_staff_alert(salon_id,barber_id);
end;$$;
create function public.staff_alert_read(p_id uuid default null) returns void language sql security invoker set search_path='' as $$select bookmyturn_private.staff_alert_read(p_id);$$;
create function bookmyturn_private.manager_visit_command(p_salon uuid,p_action text,p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.queue_entries; a public.appointments; target uuid; member uuid;
begin
 if not bookmyturn_private.owns_salon(p_salon) then raise exception 'Salon access unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_salon::text,0));
 select id into member from bookmyturn_private.salon_memberships where salon_id=p_salon and user_id=auth.uid() and role='owner' and is_active for share;
 if member is null then raise exception 'Salon access unavailable' using errcode='42501';end if;
 if p_action='check_in' then
  select * into q from public.queue_entries where id=p_id and salon_id=p_salon for update;
  if q.id is null then raise exception 'Visit unavailable' using errcode='42501';end if;
  if q.status='joined' then update public.queue_entries set status='arrived' where id=q.id;
  elsif q.status<>'arrived' then raise exception 'Queue entry cannot be checked in';end if;
 else
  if p_action not in ('accept','decline','appointment_arrived') then raise exception 'Unknown visit action';end if;
  select * into a from public.appointments where id=p_id and salon_id=p_salon;
  select bl.barber_id into target from bookmyturn_private.barber_schedule_blocks bl where bl.appointment_id=a.id and bl.is_active;
  target:=coalesce(a.confirmed_barber_id,a.preferred_barber_id,target);
  if a.id is null or target is null then raise exception 'Visit unavailable' using errcode='42501';end if;
  return bookmyturn_private.barber_command(target,p_action,jsonb_build_object('id',a.id));
 end if;
 return jsonb_build_object('id',p_id);
end;$$;
create function public.manager_visit_command(p_salon uuid,p_action text,p_id uuid) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.manager_visit_command(p_salon,p_action,p_id);$$;

-- Existing active visits become visible/alerted without changing their status.
do $$declare q record;a record;begin
 for q in select * from public.queue_entries where status in ('joined','arrived') loop
  perform bookmyturn_private.staff_event(q.salon_id,coalesce(q.assigned_barber_id,q.preferred_barber_id),'queue',q.id,q.status,q.reference,q.created_at);
 end loop;
 for a in select * from public.appointments where status='pending' loop
  perform bookmyturn_private.staff_event(a.salon_id,coalesce(a.confirmed_barber_id,a.preferred_barber_id,(select barber_id from bookmyturn_private.barber_schedule_blocks where appointment_id=a.id and is_active)),'appointment',a.id,a.status,a.reference,a.created_at);
 end loop;
end;$$;

revoke all on function bookmyturn_private.staff_event(uuid,uuid,text,uuid,text,text,timestamptz),bookmyturn_private.staff_visit_changed(),bookmyturn_private.staff_alert_changed() from public,anon,authenticated;
revoke all on function bookmyturn_private.can_read_staff_alert(uuid,uuid),bookmyturn_private.manager_state(),bookmyturn_private.staff_alert_read(uuid),bookmyturn_private.manager_visit_command(uuid,text,uuid),public.staff_alert_read(uuid),public.manager_visit_command(uuid,text,uuid) from public,anon,authenticated;
grant execute on function bookmyturn_private.can_read_staff_alert(uuid,uuid),bookmyturn_private.manager_state(),bookmyturn_private.staff_alert_read(uuid),bookmyturn_private.manager_visit_command(uuid,text,uuid),public.staff_alert_read(uuid),public.manager_visit_command(uuid,text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
