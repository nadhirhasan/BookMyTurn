begin;
alter table public.salons add column archived_at timestamptz;
alter table public.barbers add column archived_at timestamptz;
alter table public.services add column archived_at timestamptz;

-- Audit snapshots survive deletion of an unused catalogue entry.
alter table bookmyturn_private.audit_events drop constraint audit_events_salon_id_fkey;
alter table bookmyturn_private.audit_events add constraint audit_events_salon_id_fkey
 foreign key(salon_id) references public.salons on delete set null;
create or replace function bookmyturn_private.audit_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare n jsonb; o jsonb; target uuid; keys text[]:=array['customer_name','mobile','note','body','bio','photo_url','photo_attribution','actor_id'];
begin
 if tg_op<>'DELETE' then n:=to_jsonb(new);end if;
 if tg_op<>'INSERT' then o:=to_jsonb(old);end if;
 target:=case when tg_table_name='salons' then coalesce((n->>'id')::uuid,(o->>'id')::uuid) else coalesce((n->>'salon_id')::uuid,(o->>'salon_id')::uuid) end;
 insert into bookmyturn_private.audit_events(salon_id,actor_id,entity_type,entity_id,operation,changes)
 values(case when exists(select 1 from public.salons where id=target) then target end,auth.uid(),tg_table_name,
 coalesce(n->>'id',o->>'id',n->>'barber_id',o->>'barber_id',n->>'salon_id',o->>'salon_id'),tg_op,
 jsonb_build_object('before',o-keys,'after',n-keys,'salon_id',target));
 if tg_op='DELETE' then return old;end if;return new;
end;$$;

-- Archives remain available only through the owner's guarded catalogue RPC.
create policy salon_not_archived on public.salons as restrictive for select to anon,authenticated using(archived_at is null);
create policy barber_not_archived on public.barbers as restrictive for select to anon,authenticated
 using(archived_at is null and exists(select 1 from public.salons s where s.id=salon_id and s.is_published));
create policy service_not_archived on public.services as restrictive for select to anon,authenticated using(archived_at is null);
create or replace function bookmyturn_private.is_my_barber(p_barber uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.barbers b join public.salons s on s.id=b.salon_id
 join bookmyturn_private.salon_memberships m on m.salon_id=b.salon_id
 where b.id=p_barber and b.is_active and b.archived_at is null and s.archived_at is null
 and m.user_id=auth.uid() and m.is_active and (m.role='owner' or (m.role='barber' and m.barber_id=b.id)));
$$;
do $$declare definition text;begin
 definition:=pg_get_functiondef('bookmyturn_private.barber_context()'::regprocedure);
 if position('and b.is_active)' in definition)=0 then raise exception 'Expected barber context filter';end if;
 execute replace(definition,'and b.is_active)', 'and b.is_active and b.archived_at is null and s.archived_at is null)');
 definition:=pg_get_functiondef('bookmyturn_private.manager_catalog_state()'::regprocedure);
 if position('and v.is_active' in definition)=0 then raise exception 'Expected catalogue service filter';end if;
 execute replace(definition,'and v.is_active','');
 -- Recheck after waiting for the same salon lock as customer bookings/removal.
 definition:=pg_get_functiondef('bookmyturn_private.barber_command(uuid,text,jsonb)'::regprocedure);
 execute replace(definition,'perform pg_advisory_xact_lock(hashtextextended(salon::text,0));',
 'perform pg_advisory_xact_lock(hashtextextended(salon::text,0)); if not bookmyturn_private.is_my_barber(p_barber) then raise exception ''Barber access unavailable'' using errcode=''42501'';end if;');
 definition:=pg_get_functiondef('bookmyturn_private.manager_visit_command(uuid,text,uuid)'::regprocedure);
 execute replace(definition,'if member is null then','if exists(select 1 from public.salons where id=p_salon and archived_at is not null) then raise exception ''Restore this salon before making changes'';end if; if member is null then');
end;$$;

alter function bookmyturn_private.manager_command(text,jsonb) rename to manager_catalog_command_v1;
create function bookmyturn_private.manager_command(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare salon uuid; entry uuid; entity_kind text; operation text; member uuid; result jsonb; h jsonb;
 target_salon public.salons; target_barber public.barbers; target_service public.services; n integer;
begin
 if auth.uid() is null then raise exception 'Sign in to manage your salons' using errcode='42501';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid request';end if;
 if p_action in ('profile','create_salon') then
  if p_action='profile' and coalesce(char_length(btrim(p_data->>'display_name')),0) not between 1 and 80 then raise exception 'Enter your name';end if;
  if p_action='create_salon' and coalesce(char_length(btrim(p_data->>'address')),0) not between 1 and 500 then raise exception 'Enter a salon address';end if;
  return bookmyturn_private.manager_catalog_command_v1(p_action,p_data);
 end if;
 salon:=(p_data->>'salon_id')::uuid;entry:=(p_data->>'id')::uuid;
 if not bookmyturn_private.owns_salon(salon) then raise exception 'Salon access unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
 select id into member from bookmyturn_private.salon_memberships where salon_id=salon and user_id=auth.uid() and role='owner' and is_active for share;
 if member is null then raise exception 'Salon access unavailable' using errcode='42501';end if;
 select * into target_salon from public.salons where id=salon for update;
 entity_kind:=split_part(p_action,'_',2);operation:=split_part(p_action,'_',1);
 if operation in ('archive','restore','delete') and entity_kind in ('salon','barber','service') then
  if entity_kind='salon' then entry:=salon;
  elsif entity_kind='barber' then
   select * into target_barber from public.barbers where id=entry and salon_id=salon for update;
   if target_barber.id is null then raise exception 'Barber access unavailable' using errcode='42501';end if;
  else
   select * into target_service from public.services where id=entry and salon_id=salon for update;
   if target_service.id is null then raise exception 'Service unavailable';end if;
  end if;
  if target_salon.archived_at is not null and entity_kind<>'salon' then raise exception 'Restore this salon before making changes';end if;
  if operation='restore' then
   if entity_kind='salon' then update public.salons set archived_at=null,is_published=true,is_open=false,updated_at=now() where id=salon and archived_at is not null;
   elsif entity_kind='barber' then
    if not exists(select 1 from public.barber_services bs join public.services v on v.id=bs.service_id where bs.barber_id=entry and v.is_active and v.archived_at is null) then raise exception 'Restore or assign a service before restoring this barber';end if;
    update public.barbers set archived_at=null,is_active=true,is_published=true,updated_at=now() where id=entry and archived_at is not null;
   else update public.services set archived_at=null,is_active=true where id=entry and archived_at is not null;
   end if;
   return jsonb_build_object('id',entry);
  end if;
  -- An unassigned arrival may depend on any chair/service: protect its capacity too.
  if exists(select 1 from public.queue_entries q where q.salon_id=salon and q.status in ('joined','arrived','in_service')
    and (entity_kind in ('salon','barber') or q.service_id=entry or q.service_id is null))
   or exists(select 1 from public.appointments a left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id and bl.is_active
    where a.salon_id=salon and a.status in ('pending','alternative_suggested','confirmed','arrived','in_service')
    and (entity_kind='salon' or (entity_kind='barber' and (entry in (a.preferred_barber_id,a.confirmed_barber_id,bl.barber_id))) or (entity_kind='service' and a.service_id=entry)))
   or exists(select 1 from public.service_sessions ss where ss.salon_id=salon and ss.status='in_service' and (entity_kind='salon' or (entity_kind='barber' and ss.barber_id=entry) or (entity_kind='service' and ss.service_id=entry)))
   then raise exception 'Handle active queue visits and appointments before removing this record';end if;
  if operation='archive' then
   if entity_kind='salon' then update public.salons set archived_at=coalesce(archived_at,clock_timestamp()),is_published=false,is_open=false,updated_at=now() where id=salon;
   elsif entity_kind='barber' then update public.barbers set archived_at=coalesce(archived_at,clock_timestamp()),is_active=false,is_published=false,updated_at=now() where id=entry;
   else update public.services set archived_at=coalesce(archived_at,clock_timestamp()),is_active=false where id=entry;
   end if;
  else
   begin
    -- Only configuration is removed; restrictive history/finance FKs veto deletion.
    if entity_kind in ('salon','barber') then
     delete from public.barber_services where salon_id=salon and (entity_kind='salon' or barber_id=entry);
     delete from public.barber_hours where salon_id=salon and (entity_kind='salon' or barber_id=entry);
     delete from public.barber_status where salon_id=salon and (entity_kind='salon' or barber_id=entry);
     delete from bookmyturn_private.barber_schedule_blocks where salon_id=salon and kind='break' and (split_part(p_action,'_',2)='salon' or barber_id=entry);
     delete from bookmyturn_private.salon_memberships where salon_id=salon and (entity_kind='salon' or barber_id=entry);
     delete from public.barbers where salon_id=salon and (entity_kind='salon' or id=entry);
    end if;
    if entity_kind='service' then delete from public.barber_services where salon_id=salon and service_id=entry;end if;
    if entity_kind in ('salon','service') then delete from public.services where salon_id=salon and (entity_kind='salon' or id=entry);end if;
    if entity_kind='salon' then
     delete from bookmyturn_private.customer_demo_settings where salon_id=salon;
     delete from public.salons where id=salon;
    end if;
   exception when foreign_key_violation then raise exception 'This record has history. Archive it instead of deleting it';end;
  end if;
  return jsonb_build_object('id',entry);
 end if;
 if target_salon.archived_at is not null then raise exception 'Restore this salon before making changes';end if;
 if p_action in ('barber','create_barber') and exists(select 1 from public.barbers where id=entry and archived_at is not null) then raise exception 'Restore this barber before making changes';end if;
 if p_action in ('service','create_service') then
  if coalesce(char_length(btrim(p_data->>'name')),0) not between 1 and 100 then raise exception 'Enter a service name';end if;
  if coalesce((p_data->>'duration_minutes')::integer,0) not between 1 and 480 or (p_data->>'price_min_minor')::bigint is null or (p_data->>'price_max_minor')::bigint is null or (p_data->>'price_min_minor')::bigint<0 or (p_data->>'price_max_minor')::bigint<(p_data->>'price_min_minor')::bigint then raise exception 'Check service duration and price range';end if;
  if exists(select 1 from public.services where salon_id=salon and lower(btrim(name))=lower(btrim(p_data->>'name')) and id is distinct from entry) then raise exception 'A service with this name already exists in this salon';end if;
  if p_action='create_service' then
   if entry is null then raise exception 'Request key required';end if;
   if exists(select 1 from public.services where id=entry) then
    if not exists(select 1 from public.services where id=entry and salon_id=salon) then raise exception 'Service access unavailable' using errcode='42501';end if;
    return jsonb_build_object('id',entry);
   end if;
   insert into public.services(id,salon_id,name,duration_minutes,price_min_minor,price_max_minor) values(entry,salon,btrim(p_data->>'name'),(p_data->>'duration_minutes')::integer,(p_data->>'price_min_minor')::bigint,(p_data->>'price_max_minor')::bigint);
   return jsonb_build_object('id',entry);
  end if;
  if exists(select 1 from public.services where id=entry and archived_at is not null) then raise exception 'Restore this service before making changes';end if;
  if exists(select 1 from public.services where id=entry and salon_id=salon and duration_minutes<>(p_data->>'duration_minutes')::int) and (
   exists(select 1 from public.queue_entries where salon_id=salon and service_id=entry and status in ('joined','arrived','in_service')) or
   exists(select 1 from public.appointments where salon_id=salon and service_id=entry and status in ('pending','alternative_suggested','confirmed','arrived','in_service')))
   then raise exception 'Handle active visits before changing service duration';end if;
 end if;
 if p_action='salon' then
  if coalesce(char_length(btrim(p_data->>'address')),0) not between 1 and 500 then raise exception 'Enter a salon address';end if;
  if p_data ? 'hours' then
   if jsonb_typeof(p_data->'hours') is distinct from 'array' or jsonb_array_length(p_data->'hours') not between 1 and 7 then raise exception 'Choose working days';end if;
   select count(distinct (v->>'weekday')::int) into n from jsonb_array_elements(p_data->'hours')v;
   if n<>jsonb_array_length(p_data->'hours') then raise exception 'Check weekly opening hours';end if;
   for h in select value from jsonb_array_elements(p_data->'hours') loop
    if (h->>'weekday')::int is null or (h->>'weekday')::int not between 0 and 6 or coalesce(h->>'opens_at','')!~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(h->>'closes_at','')!~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (h->>'closes_at')::time<=(h->>'opens_at')::time then raise exception 'Check weekly opening hours';end if;
   end loop;
   -- Only update schedules when changed; regular profile edits stay available.
   if (select jsonb_agg(jsonb_build_object('weekday',weekday,'opens_at',left(opens_at::text,5),'closes_at',left(closes_at::text,5)) order by weekday) from public.salon_hours where salon_id=salon)
     is distinct from (select jsonb_agg(v order by (v->>'weekday')::int) from jsonb_array_elements(p_data->'hours')v) then
    if exists(select 1 from public.queue_entries where salon_id=salon and status in ('joined','arrived','in_service')) then raise exception 'Finish active queue visits before changing opening hours';end if;
    if exists(select 1 from bookmyturn_private.barber_schedule_blocks bl where bl.salon_id=salon and bl.is_active and bl.kind='appointment' and bl.ends_at>now() and not exists(
     select 1 from jsonb_array_elements(p_data->'hours')v where (v->>'weekday')::int=extract(dow from bl.starts_at at time zone 'Asia/Colombo')::int
      and (bl.starts_at at time zone 'Asia/Colombo')::date=(bl.ends_at at time zone 'Asia/Colombo')::date
      and (bl.starts_at at time zone 'Asia/Colombo')::time>=(v->>'opens_at')::time and (bl.ends_at at time zone 'Asia/Colombo')::time<=(v->>'closes_at')::time)) then raise exception 'Opening hours must include existing appointments';end if;
    delete from public.barber_hours where salon_id=salon;
    delete from public.salon_hours where salon_id=salon;
    for h in select value from jsonb_array_elements(p_data->'hours') loop
     insert into public.salon_hours values(salon,(h->>'weekday')::int,(h->>'opens_at')::time,(h->>'closes_at')::time);
     insert into public.barber_hours select salon,id,(h->>'weekday')::int,(h->>'opens_at')::time,(h->>'closes_at')::time from public.barbers where salon_id=salon;
    end loop;
   end if;
  end if;
 end if;
 result:=bookmyturn_private.manager_catalog_command_v1(p_action,p_data);
 return result;
end;$$;
create or replace function public.manager_command(p_action text,p_data jsonb) returns jsonb
 language sql security invoker set search_path='' as $$select bookmyturn_private.manager_command(p_action,p_data);$$;
revoke all on function bookmyturn_private.manager_catalog_command_v1(text,jsonb),bookmyturn_private.manager_command(text,jsonb) from public,anon,authenticated;
grant execute on function bookmyturn_private.manager_command(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
