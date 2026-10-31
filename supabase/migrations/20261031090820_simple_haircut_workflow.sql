begin;

-- Keep original catalogue/history records; new bookings do not require them.
alter table public.appointments alter column service_id drop not null;
alter table public.service_sessions add column pricing_mode text not null default 'legacy' check(pricing_mode in ('legacy','completion'));
alter table public.service_sessions alter column service_id drop not null;
alter table public.service_sessions alter column price_min_minor_snapshot drop not null;
alter table public.service_sessions alter column price_max_minor_snapshot drop not null;
alter table public.service_sessions alter column agreed_price_minor drop not null;
alter table public.service_sessions alter column price_agreed_at drop not null;
alter table public.service_sessions add constraint completion_has_no_upfront_price check(pricing_mode<>'completion' or
 (price_min_minor_snapshot is null and price_max_minor_snapshot is null and agreed_price_minor is null and price_agreed_at is null and commission_rule_id is null));
alter table public.service_sessions add constraint legacy_retains_upfront_price check(pricing_mode<>'legacy' or
 (service_id is not null and price_min_minor_snapshot is not null and price_max_minor_snapshot is not null and agreed_price_minor is not null and price_agreed_at is not null));
do $$declare c record;begin
 for c in select conname from pg_constraint where conrelid='public.service_sessions'::regclass and contype='c' and pg_get_constraintdef(oid) like '%final_amount_agreed_at%' loop
  execute format('alter table public.service_sessions drop constraint %I',c.conname);
 end loop;
 for c in select conname from pg_constraint where conrelid='public.service_sessions'::regclass and contype='c' and pg_get_constraintdef(oid) like '%final_amount_minor%price_min_minor_snapshot%' loop
  execute format('alter table public.service_sessions drop constraint %I',c.conname);
 end loop;
end;$$;
alter table public.service_sessions add constraint completion_recorded_amount check(status<>'completed' or
 (completed_at is not null and completed_at>=started_at and final_amount_minor is not null and
 (pricing_mode='completion' or (final_amount_agreed_at is not null and final_amount_agreed_at<=completed_at))));
alter table public.service_sessions add constraint legacy_final_price_range check(pricing_mode='completion' or final_amount_minor is null or
 final_amount_minor between price_min_minor_snapshot and price_max_minor_snapshot or nullif(btrim(final_price_reason),'') is not null);
do $$declare definition text;begin
 definition:=pg_get_functiondef('bookmyturn_private.guard_session()'::regprocedure);
 definition:=replace(definition,'a.service_id <> new.service_id','a.service_id is distinct from new.service_id');
 definition:=replace(definition,'q.service_id <> new.service_id','q.service_id is distinct from new.service_id');
 execute definition;
end;$$;

-- Short codes are display/lookup aids within a salon, never receipt credentials.
alter table public.queue_entries add column visit_code text check(visit_code ~ '^[0-9]{6}$');
alter table public.appointments add column visit_code text check(visit_code ~ '^[0-9]{6}$');
create function bookmyturn_private.new_visit_code(p_salon uuid) returns text
language plpgsql volatile security definer set search_path='' as $$
declare code text;attempt integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_salon::text,0));
 for attempt in 1..100 loop
  code:=(100000+floor(random()*900000)::int)::text;
  if not exists(select 1 from public.queue_entries where salon_id=p_salon and visit_code=code and status in ('joined','arrived','in_service'))
   and not exists(select 1 from public.appointments where salon_id=p_salon and visit_code=code and status in ('pending','alternative_suggested','confirmed','arrived','in_service')) then return code;end if;
 end loop;
 raise exception 'Could not allocate a visit code. Please retry';
end;$$;
create function bookmyturn_private.set_visit_code() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='INSERT' or old.visit_code is null then new.visit_code:=bookmyturn_private.new_visit_code(new.salon_id);
 elsif new.visit_code is distinct from old.visit_code then raise exception 'Visit code is immutable';end if;return new;
end;$$;
create trigger a_visit_code before insert or update of visit_code on public.queue_entries for each row execute function bookmyturn_private.set_visit_code();
create trigger a_visit_code before insert or update of visit_code on public.appointments for each row execute function bookmyturn_private.set_visit_code();
update public.queue_entries set visit_code=null where visit_code is null;
update public.appointments set visit_code=null where visit_code is null;
alter table public.queue_entries alter column visit_code set not null;
alter table public.appointments alter column visit_code set not null;
create unique index queue_active_visit_code on public.queue_entries(salon_id,visit_code) where status in ('joined','arrived','in_service');
create unique index appointment_active_visit_code on public.appointments(salon_id,visit_code) where status in ('pending','alternative_suggested','confirmed','arrived','in_service');

create table public.customer_haircuts(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users on delete cascade,
 title text not null default 'My haircut' check(char_length(btrim(title)) between 1 and 100),
 hairstyle_id uuid references public.hairstyles,storage_path text,created_at timestamptz not null default clock_timestamp(),deleted_at timestamptz,
 check(num_nonnulls(hairstyle_id,storage_path)=1),check(storage_path is null or char_length(storage_path)<=500)
);
create unique index haircut_saved_inspiration on public.customer_haircuts(customer_id,hairstyle_id) where hairstyle_id is not null and deleted_at is null;
create index haircut_customer_time on public.customer_haircuts(customer_id,created_at desc);
alter table public.customer_haircuts enable row level security;
revoke all on public.customer_haircuts from public,anon,authenticated;
grant select on public.customer_haircuts to authenticated;
create policy own_haircuts on public.customer_haircuts for select to authenticated using(customer_id=(select auth.uid()));
create table bookmyturn_private.haircut_references(
 id uuid primary key default gen_random_uuid(),salon_id uuid not null references public.salons,
 customer_id uuid references auth.users on delete set null,favorite_id uuid references public.customer_haircuts on delete set null,
 queue_entry_id uuid unique,appointment_id uuid unique,title text not null,storage_path text,image_url text,viewed_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),check(num_nonnulls(queue_entry_id,appointment_id)=1),
 foreign key(salon_id,queue_entry_id) references public.queue_entries(salon_id,id),
 foreign key(salon_id,appointment_id) references public.appointments(salon_id,id)
);
create index haircut_reference_media on bookmyturn_private.haircut_references(storage_path) where storage_path is not null;
alter table bookmyturn_private.haircut_references enable row level security;
revoke all on bookmyturn_private.haircut_references from public,anon,authenticated;
create function bookmyturn_private.can_read_haircut(p_reference uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from bookmyturn_private.haircut_references r
 left join public.queue_entries q on q.id=r.queue_entry_id left join public.appointments a on a.id=r.appointment_id
 left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id and bl.is_active
 where r.id=p_reference and (r.customer_id=auth.uid() or bookmyturn_private.owns_salon(r.salon_id) or
 bookmyturn_private.is_my_barber(coalesce(q.assigned_barber_id,q.preferred_barber_id,a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id)) or
 (q.status in ('joined','arrived') and q.preferred_barber_id is null and q.assigned_barber_id is null and exists(
 select 1 from public.barbers b where b.salon_id=r.salon_id and bookmyturn_private.is_my_barber(b.id) and
 (q.status='joined' or exists(select 1 from bookmyturn_private.queue_forecast(r.salon_id) f where f.queue_id=q.id and f.barber_id=b.id))))));
$$;
create policy scoped_haircut_reference on bookmyturn_private.haircut_references for select to authenticated using(bookmyturn_private.can_read_haircut(id));
create function bookmyturn_private.customer_gallery(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();entry uuid:=(p_data->>'id')::uuid;style uuid:=(p_data->>'hairstyle_id')::uuid;media text:=nullif(p_data->>'storage_path','');title text;h public.customer_haircuts;
begin
 if u is null then raise exception 'Sign in to save haircut photos' using errcode='42501';end if;
 if p_action='list' then return coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('image_url',s.image_url) order by c.created_at desc)
  from public.customer_haircuts c left join public.hairstyles s on s.id=c.hairstyle_id where c.customer_id=u and c.deleted_at is null),'[]');end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,2));
 if p_action='save' then
  if style is not null then
   if not exists(select 1 from public.hairstyles where id=style and is_published) then raise exception 'Photo unavailable';end if;
   select * into h from public.customer_haircuts where customer_id=u and hairstyle_id=style and deleted_at is null;
   if h.id is not null then return jsonb_build_object('id',h.id);end if;
  elsif media is null or split_part(media,'/',1)<>u::text or media !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' then raise exception 'Photo does not belong to this account' using errcode='42501';end if;
  entry:=coalesce(entry,gen_random_uuid());
  if exists(select 1 from public.customer_haircuts where id=entry and customer_id=u) then return jsonb_build_object('id',entry);end if;
  if style is not null and media is not null then raise exception 'Choose one photo';end if;
  title:=coalesce(nullif(btrim(p_data->>'title'),''),(select hs.title from public.hairstyles hs where hs.id=style),'My haircut');
  insert into public.customer_haircuts(id,customer_id,title,hairstyle_id,storage_path) values(entry,u,title,style,media);
 else
  select * into h from public.customer_haircuts where id=entry and customer_id=u for update;
  if h.id is null then raise exception 'Photo unavailable' using errcode='42501';end if;
  if p_action='remove' then update public.customer_haircuts set deleted_at=coalesce(deleted_at,clock_timestamp()) where id=entry;
  elsif p_action='rename' then
   if coalesce(char_length(btrim(p_data->>'title')),0) not between 1 and 100 then raise exception 'Enter a photo name';end if;
   update public.customer_haircuts set title=btrim(p_data->>'title') where id=entry;
  else raise exception 'Unknown photo action';end if;
 end if;
 return jsonb_build_object('id',entry);
end;$$;
create function public.customer_gallery(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.customer_gallery(p_action,p_data);$$;
create function bookmyturn_private.attach_haircut(p_visit uuid,p_kind text,p_favorite uuid) returns void
language plpgsql security definer set search_path='' as $$
declare photo public.customer_haircuts;salon uuid;
begin
 if p_favorite is null then return;end if;
 select * into photo from public.customer_haircuts where id=p_favorite and customer_id=auth.uid() and deleted_at is null;
 if photo.id is null then raise exception 'Photo unavailable' using errcode='42501';end if;
 if p_kind='queue' then select salon_id into salon from public.queue_entries where id=p_visit and customer_id=auth.uid() and status in ('joined','arrived');
 else select salon_id into salon from public.appointments where id=p_visit and customer_id=auth.uid() and status in ('pending','alternative_suggested','confirmed','arrived');end if;
 if salon is null then raise exception 'Active visit not found';end if;
 insert into bookmyturn_private.haircut_references(salon_id,customer_id,favorite_id,queue_entry_id,appointment_id,title,storage_path,image_url)
 values(salon,auth.uid(),photo.id,case when p_kind='queue' then p_visit end,case when p_kind='appointment' then p_visit end,photo.title,photo.storage_path,(select image_url from public.hairstyles where id=photo.hairstyle_id))
 on conflict do nothing;
end;$$;

alter function bookmyturn_private.customer_slots(uuid,uuid,date,uuid) rename to customer_service_slots_v1;
create function bookmyturn_private.customer_slots(p_salon uuid,p_service uuid,p_day date,p_barber uuid default null)
returns table(starts_at timestamptz,ends_at timestamptz,barber_id uuid,available boolean)
language plpgsql stable security definer set search_path='' as $$begin
 if p_service is not null then return query select * from bookmyturn_private.customer_service_slots_v1(p_salon,p_service,p_day,p_barber);return;end if;
 return query with forecast as materialized(select * from bookmyturn_private.queue_forecast(p_salon))
 select t,t+make_interval(mins=>sp.default_service_minutes),b.id,
 (t>now() and bookmyturn_private.free_start(p_salon,b.id,t,sp.default_service_minutes)=t
 and not exists(select 1 from forecast f where f.queue_id is not null and f.barber_id=b.id and tstzrange(t,t+make_interval(mins=>sp.default_service_minutes),'[)')&&tstzrange(f.starts_at,f.ends_at,'[)'))
 and not exists(select 1 from bookmyturn_private.barber_schedule_blocks personal where personal.customer_id=auth.uid() and personal.is_active and tstzrange(t,t+make_interval(mins=>sp.default_service_minutes),'[)')&&tstzrange(personal.starts_at,personal.ends_at,'[)'))
 and (p_day<>(now() at time zone 'Asia/Colombo')::date or exists(select 1 from public.barber_status st where st.barber_id=b.id and st.availability='available')))
 from public.salons s join bookmyturn_private.salon_policies sp on sp.salon_id=s.id
 join public.barbers b on b.salon_id=s.id and b.is_active and b.is_published and b.archived_at is null
 cross join lateral bookmyturn_private.work_window(s.id,b.id,p_day)w
 cross join lateral generate_series(w.opens,w.closes-make_interval(mins=>sp.default_service_minutes),interval '15 minutes')t
 where s.id=p_salon and s.is_published and s.archived_at is null and (p_barber is null or b.id=p_barber)
 and p_day between (now() at time zone 'Asia/Colombo')::date and (now() at time zone 'Asia/Colombo')::date+sp.forecast_horizon_days;
end;$$;
create or replace function public.customer_slots(p_salon uuid,p_service uuid,p_day date,p_barber uuid default null)
returns table(starts_at timestamptz,ends_at timestamptz,barber_id uuid,available boolean)
language sql stable security invoker set search_path='' as $$select * from bookmyturn_private.customer_slots(p_salon,p_service,p_day,p_barber);$$;

alter function bookmyturn_private.customer_command(text,jsonb) rename to customer_service_command_v1;
create function bookmyturn_private.customer_command(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare salon uuid;barber uuid;request uuid;result jsonb;entry uuid;chosen record;at_time timestamptz;photo uuid:=(p_data->>'haircut_id')::uuid;
begin
 if auth.uid() is null then raise exception 'Sign in to manage your visits' using errcode='42501';end if;
 if p_action in ('join_queue','request_appointment') then
  if photo is not null and not exists(select 1 from public.customer_haircuts where id=photo and customer_id=auth.uid() and deleted_at is null) then raise exception 'Photo unavailable' using errcode='42501';end if;
  if p_action='request_appointment' and nullif(p_data->>'service_id','') is null then
   salon:=(p_data->>'salon_id')::uuid;barber:=(p_data->>'barber_id')::uuid;request:=(p_data->>'request_key')::uuid;
   if request is null then raise exception 'Request key required';end if;
   perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
   if not exists(select 1 from public.salons where id=salon and is_published and archived_at is null) then raise exception 'Salon unavailable';end if;
   select id into entry from public.appointments where salon_id=salon and request_key=request and customer_id=auth.uid();
   if entry is not null then return jsonb_build_object('id',entry,'existing',true);end if;
   at_time:=(p_data->>'starts_at')::timestamptz;
   if at_time is null then raise exception 'Choose an appointment time';end if;
   select * into chosen from bookmyturn_private.customer_slots(salon,null,(at_time at time zone 'Asia/Colombo')::date,barber)where starts_at=at_time and available order by ends_at,barber_id limit 1;
   if chosen.barber_id is null then raise exception 'This time is no longer available. Choose another time.' using errcode='23P01';end if;
   insert into public.appointments(salon_id,customer_id,preferred_barber_id,requested_start,requested_duration_minutes,customer_name,mobile,request_key)
   values(salon,auth.uid(),barber,at_time,extract(epoch from chosen.ends_at-chosen.starts_at)::int/60,nullif(btrim(p_data->>'customer_name'),''),nullif(btrim(p_data->>'mobile'),''),request) returning id into entry;
   insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)values(salon,chosen.barber_id,'appointment',entry,chosen.starts_at,chosen.ends_at);
   insert into public.notifications(user_id,event_key,title,body)values(auth.uid(),entry||':pending','Appointment requested','Your time is held while the salon reviews your request.');
   result:=jsonb_build_object('id',entry);
  else result:=bookmyturn_private.customer_service_command_v1(p_action,p_data);entry:=(result->>'id')::uuid;end if;
  if not coalesce((result->>'existing')::boolean,false) then perform bookmyturn_private.attach_haircut(entry,case when p_action='join_queue' then 'queue' else 'appointment' end,photo);end if;
  return result;
 end if;
 return bookmyturn_private.customer_service_command_v1(p_action,p_data);
end;$$;
create or replace function public.customer_command(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.customer_command(p_action,p_data);$$;

alter function bookmyturn_private.manager_command(text,jsonb) rename to manager_service_command_v1;
create function bookmyturn_private.manager_command(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare salon uuid:=(p_data->>'salon_id')::uuid;entry uuid:=(p_data->>'id')::uuid;d integer;member uuid;
begin
 if auth.uid() is null then raise exception 'Sign in to manage your salons' using errcode='42501';end if;
 if p_action='create_salon' and not(p_data?'service_name') then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));entry:=coalesce(entry,gen_random_uuid());
  if exists(select 1 from public.salons where id=entry) then
   if not bookmyturn_private.owns_salon(entry) then raise exception 'Salon access unavailable' using errcode='42501';end if;return jsonb_build_object('id',entry);
  end if;
  if coalesce(char_length(btrim(p_data->>'name')),0) not between 1 and 100 then raise exception 'Enter a salon name';end if;
  if coalesce(char_length(btrim(p_data->>'address')),0) not between 1 and 500 then raise exception 'Enter a salon address';end if;
  if jsonb_typeof(p_data->'weekdays') is distinct from 'array' or jsonb_array_length(p_data->'weekdays') not between 1 and 7 then raise exception 'Choose working days';end if;
  if (p_data->>'opens_at')::time is null or (p_data->>'closes_at')::time is null or (p_data->>'closes_at')::time<=(p_data->>'opens_at')::time then raise exception 'Closing time must be after opening time';end if;
  insert into public.salons(id,slug,name,address,is_published,is_open)values(entry,'salon-'||entry,btrim(p_data->>'name'),btrim(p_data->>'address'),true,true);
  insert into bookmyturn_private.salon_memberships(salon_id,user_id,role)values(entry,auth.uid(),'owner');
  insert into bookmyturn_private.salon_policies(salon_id,forecast_horizon_days)values(entry,30);
  insert into bookmyturn_private.customer_demo_settings values(entry,false);
  for d in select distinct value::int from jsonb_array_elements_text(p_data->'weekdays') loop insert into public.salon_hours values(entry,d,(p_data->>'opens_at')::time,(p_data->>'closes_at')::time);end loop;
  return jsonb_build_object('id',entry);
 elsif p_action in ('create_barber','barber') and not(p_data?'service_ids') then
  if not bookmyturn_private.owns_salon(salon) then raise exception 'Salon access unavailable' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
  select id into member from bookmyturn_private.salon_memberships where salon_id=salon and user_id=auth.uid() and role='owner' and is_active for share;
  if member is null then raise exception 'Salon access unavailable' using errcode='42501';end if;
  if exists(select 1 from public.salons where id=salon and archived_at is not null) then raise exception 'Restore this salon before making changes';end if;
  entry:=coalesce(entry,gen_random_uuid());
  if p_action='create_barber' and exists(select 1 from public.barbers where id=entry and salon_id=salon) then return jsonb_build_object('id',entry);end if;
  if coalesce(char_length(btrim(p_data->>'display_name')),0) not between 1 and 80 or coalesce((p_data->>'experience_years')::int,0) not between 0 and 80 or char_length(p_data->>'bio')>2000 or char_length(p_data->>'photo_url')>2000 then raise exception 'Check barber profile';end if;
  if jsonb_typeof(coalesce(p_data->'specialities','[]'))<>'array' or jsonb_array_length(coalesce(p_data->'specialities','[]'))>30 then raise exception 'Check barber profile';end if;
  if p_action='create_barber' then
   insert into public.barbers(id,salon_id,display_name,bio,experience_years,specialities,photo_url,is_published)
   values(entry,salon,btrim(p_data->>'display_name'),p_data->>'bio',(p_data->>'experience_years')::smallint,array(select jsonb_array_elements_text(coalesce(p_data->'specialities','[]'))),nullif(p_data->>'photo_url',''),true);
   insert into public.barber_hours select salon,entry,weekday,opens_at,closes_at from public.salon_hours where salon_id=salon;
   insert into public.barber_status(salon_id,barber_id,availability)values(salon,entry,'available');
  else
   if not exists(select 1 from public.barbers where id=entry and salon_id=salon and archived_at is null) then raise exception 'Barber access unavailable' using errcode='42501';end if;
   if coalesce((p_data->>'is_active')::boolean,true)=false and (exists(select 1 from public.queue_entries where salon_id=salon and status in ('joined','arrived','in_service')) or exists(select 1 from public.appointments a left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id and bl.is_active where a.salon_id=salon and entry in(a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id) and a.status in('pending','alternative_suggested','confirmed','arrived','in_service'))) then raise exception 'Finish or reassign active visits before deactivating this barber';end if;
   update public.barbers set display_name=btrim(p_data->>'display_name'),bio=p_data->>'bio',experience_years=(p_data->>'experience_years')::smallint,specialities=array(select jsonb_array_elements_text(coalesce(p_data->'specialities','[]'))),photo_url=nullif(p_data->>'photo_url',''),is_active=coalesce((p_data->>'is_active')::boolean,is_active),updated_at=now()where id=entry;
  end if;
  return jsonb_build_object('id',entry);
 end if;
 return bookmyturn_private.manager_service_command_v1(p_action,p_data);
end;$$;
create or replace function public.manager_command(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.manager_command(p_action,p_data);$$;

alter function bookmyturn_private.barber_command(uuid,text,jsonb) rename to barber_service_command_v1;
create function bookmyturn_private.barber_command(p_barber uuid,p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare salon uuid;entry uuid:=(p_data->>'id')::uuid;member uuid;q public.queue_entries;a public.appointments;ss public.service_sessions;duration int;at_time timestamptz;amount bigint;result uuid;
begin
 if p_action not in ('start_haircut','finish_haircut','styles_viewed') and not(p_action='check_in'and coalesce(p_data->>'reference','')~'^[0-9]{6}$') then return bookmyturn_private.barber_service_command_v1(p_barber,p_action,p_data);end if;
 if not bookmyturn_private.is_my_barber(p_barber) then raise exception 'Barber access unavailable' using errcode='42501';end if;
 select salon_id into salon from public.barbers where id=p_barber;
 perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
 select id into member from bookmyturn_private.salon_memberships where salon_id=salon and user_id=auth.uid() and is_active and (role='owner' or(role='barber' and barber_id=p_barber))for share;
 if member is null or not bookmyturn_private.is_my_barber(p_barber) then raise exception 'Barber access unavailable' using errcode='42501';end if;
 perform set_config('bookmyturn.staff_action','1',true);
 if p_action='check_in' then
  select id into entry from public.queue_entries where salon_id=salon and visit_code=p_data->>'reference'and status in('joined','arrived')and coalesce(assigned_barber_id,preferred_barber_id,p_barber)=p_barber;
  if entry is null then raise exception 'Active customer code not found';end if;
  return bookmyturn_private.barber_service_command_v1(p_barber,'check_in',(p_data-'reference')||jsonb_build_object('id',entry));
 elsif p_action='styles_viewed' then
  update bookmyturn_private.haircut_references set viewed_at=coalesce(viewed_at,clock_timestamp())where id=entry and salon_id=salon and bookmyturn_private.can_read_haircut(id);
  if found then return jsonb_build_object('id',entry);end if;
  return bookmyturn_private.barber_service_command_v1(p_barber,p_action,p_data);
 elsif p_action='start_haircut' then
  select * into ss from public.service_sessions where barber_id=p_barber and (queue_entry_id=entry or appointment_id=entry);
  if ss.id is not null then return jsonb_build_object('id',ss.id);end if;
  if exists(select 1 from public.service_sessions where barber_id=p_barber and status='in_service')then raise exception 'Finish your current service first';end if;
  if not exists(select 1 from public.barber_status where barber_id=p_barber and availability='available')then raise exception 'Set yourself available first';end if;
  select * into q from public.queue_entries where id=entry and salon_id=salon for update;
  select * into a from public.appointments where id=entry and salon_id=salon for update;
  if q.id is not null then
   if q.status<>'arrived' or coalesce(q.assigned_barber_id,q.preferred_barber_id,p_barber)<>p_barber then raise exception 'Customer must be arrived and assigned to you';end if;
   if not exists(select 1 from bookmyturn_private.queue_forecast(salon)f where f.queue_id=q.id and f.barber_id=p_barber and f.starts_at<=now()+interval '1 second')then raise exception 'This customer is not next for your chair';end if;
  elsif a.id is null or a.status<>'arrived' or a.confirmed_barber_id<>p_barber then raise exception 'Appointment must be arrived and assigned to you';end if;
  select coalesce(a.requested_duration_minutes,sp.default_service_minutes)into duration from bookmyturn_private.salon_policies sp where sp.salon_id=salon;
  at_time:=clock_timestamp();
  if exists(select 1 from bookmyturn_private.barber_schedule_blocks where barber_id=p_barber and is_active and appointment_id is distinct from a.id and tstzrange(starts_at,ends_at,'[)')&&tstzrange(at_time,at_time+make_interval(mins=>duration),'[)'))then raise exception 'This service would overlap a reserved appointment or break' using errcode='23P01';end if;
  insert into public.service_sessions(salon_id,barber_id,customer_id,queue_entry_id,appointment_id,service_id,source,service_name_snapshot,duration_minutes_snapshot,pricing_mode)
  values(salon,p_barber,coalesce(q.customer_id,a.customer_id),q.id,a.id,coalesce(q.service_id,a.service_id),case when q.id is not null then q.source else 'appointment' end,'Haircut',duration,'completion')returning id into result;
 else
  select * into ss from public.service_sessions where id=entry and barber_id=p_barber and salon_id=salon for update;
  if ss.id is null then raise exception 'Service is not assigned to you'using errcode='42501';end if;
  if ss.status='completed'then return jsonb_build_object('id',ss.id);end if;
  if ss.pricing_mode='legacy'then
   return bookmyturn_private.barber_service_command_v1(p_barber,'finish',p_data||jsonb_build_object('final_agreed',true,'price_reason','Final price recorded by the barber after the haircut.'));
  end if;
  if ss.status<>'in_service'then raise exception 'Service is not in progress';end if;
  amount:=(p_data->>'final_amount_minor')::bigint;
  if amount is null or amount<0 or amount>9999999999 then raise exception 'Enter a valid final price';end if;
  insert into public.service_items(salon_id,service_session_id,description,kind,amount_minor)values(salon,ss.id,'Haircut','base',amount);
  update public.service_sessions set status='completed',completed_at=clock_timestamp(),final_amount_minor=amount where id=ss.id;
  result:=ss.id;
 end if;
 return jsonb_build_object('id',result);
end;$$;
create or replace function public.barber_command(p_barber uuid,p_action text,p_data jsonb)returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.barber_command(p_barber,p_action,p_data);$$;

-- Return six-digit references without changing original immutable UUID references.
create function bookmyturn_private.display_visit_codes(p_state jsonb)returns jsonb language sql immutable set search_path=''as $$
 select p_state||jsonb_build_object('queues',(select coalesce(jsonb_agg(q||jsonb_build_object('reference',coalesce(q->>'visit_code',q->>'reference'))),'[]')from jsonb_array_elements(coalesce(p_state->'queues','[]'))q),
 'appointments',(select coalesce(jsonb_agg(a||jsonb_build_object('reference',coalesce(a->>'visit_code',a->>'reference'))),'[]')from jsonb_array_elements(coalesce(p_state->'appointments','[]'))a));
$$;
alter function bookmyturn_private.customer_state()rename to customer_state_pre_haircuts;
create function bookmyturn_private.customer_state()returns jsonb language sql stable security definer set search_path=''as $$select bookmyturn_private.display_visit_codes(bookmyturn_private.customer_state_pre_haircuts());$$;
create or replace function public.customer_state()returns jsonb language sql stable security invoker set search_path=''as $$select bookmyturn_private.customer_state();$$;
alter function bookmyturn_private.manager_state()rename to manager_state_pre_haircuts;
create function bookmyturn_private.manager_state()returns jsonb language plpgsql stable security definer set search_path=''as $$declare state jsonb;begin
 state:=bookmyturn_private.manager_state_pre_haircuts();return state||jsonb_build_object('salons',(select coalesce(jsonb_agg(bookmyturn_private.display_visit_codes(s)),'[]')from jsonb_array_elements(state->'salons')s));end;$$;
create or replace function public.manager_state()returns jsonb language sql stable security invoker set search_path=''as $$select bookmyturn_private.manager_state();$$;
alter function bookmyturn_private.barber_state(uuid)rename to barber_state_pre_haircuts;
create function bookmyturn_private.barber_state(p_barber uuid)returns jsonb language plpgsql security definer set search_path=''as $$declare state jsonb;photos jsonb;begin
 state:=bookmyturn_private.display_visit_codes(bookmyturn_private.barber_state_pre_haircuts(p_barber));
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'queue_entry_id',r.queue_entry_id,'appointment_id',r.appointment_id,'note',null,'viewed_at',r.viewed_at,'images',jsonb_build_array(jsonb_build_object('id',r.id,'title',r.title,'image_url',r.image_url,'storage_path',r.storage_path)))),'[]')into photos
 from bookmyturn_private.haircut_references r where bookmyturn_private.can_read_haircut(r.id)and(r.queue_entry_id in(select(q->>'id')::uuid from jsonb_array_elements(state->'queues')q)or r.appointment_id in(select(a->>'id')::uuid from jsonb_array_elements(state->'appointments')a));
 return state||jsonb_build_object('styles',coalesce(state->'styles','[]')||photos);end;$$;
create or replace function public.barber_state(p_barber uuid)returns jsonb language sql security invoker set search_path=''as $$select bookmyturn_private.barber_state(p_barber);$$;
alter function bookmyturn_private.qr_visit(text,text,text,jsonb)rename to qr_visit_pre_codes;
create function bookmyturn_private.qr_visit(p_action text,p_slug text,p_token text,p_data jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$declare state jsonb;begin
 if p_action='join' and p_data->>'haircut_id' is not null and not exists(select 1 from public.customer_haircuts where id=(p_data->>'haircut_id')::uuid and customer_id=auth.uid() and deleted_at is null)then raise exception 'Photo unavailable'using errcode='42501';end if;
 state:=bookmyturn_private.qr_visit_pre_codes(p_action,p_slug,p_token,p_data);if p_action='join' and p_data->>'haircut_id' is not null then perform bookmyturn_private.attach_haircut((state->>'id')::uuid,'queue',(p_data->>'haircut_id')::uuid);end if;if state is null then return null;end if;
 return state||jsonb_build_object('reference',(select visit_code from public.queue_entries where id=(state->>'id')::uuid));end;$$;
create or replace function public.qr_visit(p_action text,p_slug text,p_token text,p_data jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select bookmyturn_private.qr_visit(p_action,p_slug,p_token,p_data);$$;

create function bookmyturn_private.haircut_media_read(p_path text)returns boolean language sql stable security definer set search_path=''as $$
 select auth.uid() is not null and(split_part(p_path,'/',1)=auth.uid()::text or exists(select 1 from bookmyturn_private.haircut_references r where r.storage_path=p_path and bookmyturn_private.can_read_haircut(r.id)));
$$;
create function bookmyturn_private.haircut_media_delete(p_path text)returns boolean language sql stable security definer set search_path=''as $$
 select auth.uid() is not null and split_part(p_path,'/',1)=auth.uid()::text
 and not exists(select 1 from public.customer_haircuts where storage_path=p_path and deleted_at is null)
 and not exists(select 1 from bookmyturn_private.haircut_references where storage_path=p_path);
$$;
do $$begin
 if to_regclass('storage.buckets')is not null then
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('customer-haircuts','customer-haircuts',false,2097152,array['image/jpeg','image/png','image/webp']);
  execute $p$create policy haircut_photo_read on storage.objects for select to authenticated using(bucket_id='customer-haircuts'and bookmyturn_private.haircut_media_read(name))$p$;
  execute $p$create policy haircut_photo_insert on storage.objects for insert to authenticated with check(bucket_id='customer-haircuts'and split_part(name,'/',1)=(select auth.uid())::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$')$p$;
  execute $p$create policy haircut_photo_delete on storage.objects for delete to authenticated using(bucket_id='customer-haircuts'and bookmyturn_private.haircut_media_delete(name))$p$;
 end if;
end;$$;

-- Removed barbers no longer need a legacy offered-service link to be restored.
do $$declare definition text;begin
 definition:=pg_get_functiondef('bookmyturn_private.manager_service_command_v1(text,jsonb)'::regprocedure);
 definition:=replace(definition,'if not exists(select 1 from public.barber_services bs join public.services v on v.id=bs.service_id where bs.barber_id=entry and v.is_active and v.archived_at is null) then raise exception ''Restore or assign a service before restoring this barber'';end if;','');
 execute definition;
end;$$;
do $$declare f record;begin
 for f in select p.oid::regprocedure sig,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='bookmyturn_private' and p.proname in('new_visit_code','set_visit_code','can_read_haircut','customer_gallery','attach_haircut','customer_service_slots_v1','customer_slots','customer_service_command_v1','customer_command','manager_service_command_v1','manager_command','barber_service_command_v1','barber_command','display_visit_codes','customer_state_pre_haircuts','customer_state','manager_state_pre_haircuts','manager_state','barber_state_pre_haircuts','barber_state','qr_visit_pre_codes','qr_visit','haircut_media_read')loop
  execute format('revoke all on function %s from public,anon,authenticated',f.sig);
  if f.proname in('can_read_haircut','customer_gallery','customer_slots','customer_command','manager_command','barber_command','customer_state','manager_state','barber_state','qr_visit','haircut_media_read')then execute format('grant execute on function %s to authenticated',f.sig);end if;
  if f.proname in('customer_slots','qr_visit')then execute format('grant execute on function %s to anon',f.sig);end if;
 end loop;
end;$$;
revoke all on function bookmyturn_private.haircut_media_delete(text)from public,anon,authenticated;
grant execute on function bookmyturn_private.haircut_media_delete(text)to authenticated;
revoke all on function public.customer_gallery(text,jsonb)from public,anon,authenticated;
grant execute on function public.customer_gallery(text,jsonb)to authenticated;
notify pgrst,'reload schema';
commit;
