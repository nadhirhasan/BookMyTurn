begin;

create table bookmyturn_private.manager_profiles (
 user_id uuid primary key references auth.users on delete cascade,
 display_name text not null default '' check(char_length(display_name)<=80),
 avatar_path text check(char_length(avatar_path)<=500),
 updated_at timestamptz not null default now()
);
alter table bookmyturn_private.manager_profiles enable row level security;
revoke all on bookmyturn_private.manager_profiles from public,anon,authenticated;
create index if not exists memberships_active_user on bookmyturn_private.salon_memberships(user_id,salon_id) where is_active;

create function bookmyturn_private.owns_salon(p_salon uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from bookmyturn_private.salon_memberships
 where user_id=auth.uid() and salon_id=p_salon and role='owner' and is_active);
$$;

-- Owners can operate every chair in their own salons. Employees stay assigned.
create or replace function bookmyturn_private.is_my_barber(p_barber uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.barbers b
 join bookmyturn_private.salon_memberships m on m.salon_id=b.salon_id
 where b.id=p_barber and b.is_active and m.user_id=auth.uid() and m.is_active
 and (m.role='owner' or (m.role='barber' and m.barber_id=b.id)));
$$;
create or replace function bookmyturn_private.barber_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to use the barber app' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('barber_id',b.id,'salon_id',s.id,
 'barber_name',b.display_name,'salon_name',s.name,'role',m.role) order by s.created_at,b.created_at)
 from bookmyturn_private.salon_memberships m join public.salons s on s.id=m.salon_id
 join public.barbers b on b.salon_id=s.id and (m.role='owner' or m.barber_id=b.id)
 where m.user_id=auth.uid() and m.is_active and m.role in ('barber','owner') and b.is_active),'[]');
end;$$;

-- Patch the existing guarded command, preserving all service/appointment logic.
do $$declare definition text; old_guard text := 'where barber_id=p_barber and user_id=u and salon_id=salon and is_active and role in (''barber'',''owner'') for share';
begin
 definition:=pg_get_functiondef('bookmyturn_private.barber_command(uuid,text,jsonb)'::regprocedure);
 if position(old_guard in definition)=0 then raise exception 'Expected barber authorization guard not found';end if;
 execute replace(definition,old_guard,'where user_id=u and salon_id=salon and is_active and (role=''owner'' or (role=''barber'' and barber_id=p_barber)) for share');
 -- Legacy mobile builds can still use setup, including for another salon.
 definition:=pg_get_functiondef('bookmyturn_private.setup_salon(jsonb)'::regprocedure);
 execute replace(definition,'if exists(select 1 from bookmyturn_private.salon_memberships where user_id=u and role=''owner'') then raise exception ''This account already owns a salon'';end if;','');
end;$$;

create function bookmyturn_private.manager_state() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to manage your salons' using errcode='42501';end if;
 return jsonb_build_object(
 'profile',coalesce((select jsonb_build_object('display_name',display_name,'avatar_path',avatar_path)
 from bookmyturn_private.manager_profiles where user_id=auth.uid()),jsonb_build_object('display_name','','avatar_path',null)),
 'salons',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object(
 'hours',(select coalesce(jsonb_agg(to_jsonb(h) order by weekday),'[]') from public.salon_hours h where h.salon_id=s.id),
 'services',(select coalesce(jsonb_agg(to_jsonb(v) order by name),'[]') from public.services v where v.salon_id=s.id and v.is_active),
 'barbers',(select coalesce(jsonb_agg(to_jsonb(b)||jsonb_build_object('availability',st.availability,
   'service_ids',(select coalesce(jsonb_agg(bs.service_id),'[]') from public.barber_services bs where bs.barber_id=b.id)) order by b.created_at),'[]')
   from public.barbers b left join public.barber_status st on st.barber_id=b.id where b.salon_id=s.id),
 'waiting',(select count(*) from public.queue_entries q where q.salon_id=s.id and q.status='arrived'),
 'pending',(select count(*) from public.appointments a where a.salon_id=s.id and a.status='pending')) order by s.created_at)
 from public.salons s where bookmyturn_private.owns_salon(s.id)),'[]'));
end;$$;
create function public.manager_state() returns jsonb language sql stable security invoker set search_path='' as $$select bookmyturn_private.manager_state();$$;

create function bookmyturn_private.manager_command(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); salon uuid:=(p_data->>'salon_id')::uuid; entry uuid:=(p_data->>'id')::uuid;
 service uuid; d integer; opens time; closes time; n integer; member uuid;
begin
 if u is null then raise exception 'Sign in to manage your salons' using errcode='42501';end if;
 if p_action='profile' then
  if char_length(btrim(p_data->>'display_name')) not between 1 and 80 then raise exception 'Enter your name';end if;
  if nullif(p_data->>'avatar_path','') is not null and (split_part(p_data->>'avatar_path','/',1)<>u::text or char_length(p_data->>'avatar_path')>500) then raise exception 'Photo does not belong to this account' using errcode='42501';end if;
  insert into bookmyturn_private.manager_profiles(user_id,display_name,avatar_path)
  values(u,btrim(p_data->>'display_name'),nullif(p_data->>'avatar_path',''))
  on conflict(user_id) do update set display_name=excluded.display_name,avatar_path=excluded.avatar_path,updated_at=now();
  return jsonb_build_object('id',u);
 elsif p_action='create_salon' then
  perform pg_advisory_xact_lock(hashtextextended(u::text,1));
  entry:=coalesce(entry,gen_random_uuid());
  if exists(select 1 from public.salons where id=entry) then
   if not bookmyturn_private.owns_salon(entry) then raise exception 'Salon access unavailable' using errcode='42501';end if;
   return jsonb_build_object('id',entry);
  end if;
  if coalesce(char_length(btrim(p_data->>'name')),0) not between 1 and 100 or coalesce(char_length(btrim(p_data->>'service_name')),0) not between 1 and 100 then raise exception 'Enter a salon and service name';end if;
  if jsonb_typeof(p_data->'weekdays') is distinct from 'array' or jsonb_array_length(p_data->'weekdays') not between 1 and 7 then raise exception 'Choose working days';end if;
  opens:=(p_data->>'opens_at')::time;closes:=(p_data->>'closes_at')::time;
  if opens is null or closes is null or closes<=opens then raise exception 'Closing time must be after opening time';end if;
  if coalesce((p_data->>'duration_minutes')::integer,0) not between 1 and 480 or (p_data->>'price_min_minor')::bigint<0 or (p_data->>'price_max_minor')::bigint<(p_data->>'price_min_minor')::bigint then raise exception 'Check service duration and price range';end if;
  insert into public.salons(id,slug,name,address,is_published,is_open) values(entry,'salon-'||entry,btrim(p_data->>'name'),left(p_data->>'address',500),true,true);
  insert into bookmyturn_private.salon_memberships(salon_id,user_id,role) values(entry,u,'owner');
  insert into bookmyturn_private.salon_policies(salon_id,default_service_minutes,forecast_horizon_days) values(entry,(p_data->>'duration_minutes')::integer,30);
  insert into bookmyturn_private.customer_demo_settings values(entry,false);
  for d in select distinct value::integer from jsonb_array_elements_text(p_data->'weekdays') loop insert into public.salon_hours values(entry,d,opens,closes);end loop;
  insert into public.services(salon_id,name,duration_minutes,price_min_minor,price_max_minor) values(entry,btrim(p_data->>'service_name'),(p_data->>'duration_minutes')::integer,(p_data->>'price_min_minor')::bigint,(p_data->>'price_max_minor')::bigint);
  return jsonb_build_object('id',entry);
 end if;
 if salon is null or not bookmyturn_private.owns_salon(salon) then raise exception 'Salon access unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
 select id into member from bookmyturn_private.salon_memberships where salon_id=salon and user_id=u and role='owner' and is_active for share;
 if member is null then raise exception 'Salon access unavailable' using errcode='42501';end if;
 if p_action='salon' then
  if coalesce(char_length(btrim(p_data->>'name')),0) not between 1 and 100 or char_length(p_data->>'photo_url')>2000 then raise exception 'Check salon information';end if;
  update public.salons set name=btrim(p_data->>'name'),address=left(p_data->>'address',500),photo_url=nullif(p_data->>'photo_url',''),is_open=coalesce((p_data->>'is_open')::boolean,is_open),updated_at=now() where id=salon;
  return jsonb_build_object('id',salon);
 elsif p_action in ('create_barber','barber') then
  entry:=coalesce(entry,gen_random_uuid());
  if p_action='create_barber' and exists(select 1 from public.barbers where id=entry) then
   if not exists(select 1 from public.barbers where id=entry and salon_id=salon) then raise exception 'Barber access unavailable' using errcode='42501';end if;
   return jsonb_build_object('id',entry);
  end if;
  if coalesce(char_length(btrim(p_data->>'display_name')),0) not between 1 and 80 or char_length(p_data->>'bio')>2000 or char_length(p_data->>'photo_url')>2000 or coalesce((p_data->>'experience_years')::integer,0) not between 0 and 80 or jsonb_typeof(p_data->'specialities') is distinct from 'array' or jsonb_array_length(p_data->'specialities')>30 then raise exception 'Check barber profile';end if;
  if jsonb_typeof(p_data->'service_ids') is distinct from 'array' or jsonb_array_length(p_data->'service_ids')<1 then raise exception 'Choose at least one service';end if;
  select count(distinct v.id) into n from public.services v join jsonb_array_elements_text(p_data->'service_ids') j on v.id=j.value::uuid where v.salon_id=salon and v.is_active;
  if n<>(select count(distinct value) from jsonb_array_elements_text(p_data->'service_ids')) then raise exception 'Choose services from this salon';end if;
  if p_action='create_barber' then
   insert into public.barbers(id,salon_id,display_name,bio,experience_years,specialities,photo_url,is_published)
   values(entry,salon,btrim(p_data->>'display_name'),p_data->>'bio',(p_data->>'experience_years')::smallint,array(select jsonb_array_elements_text(p_data->'specialities')),nullif(p_data->>'photo_url',''),true);
   insert into public.barber_hours select salon,entry,weekday,opens_at,closes_at from public.salon_hours where salon_id=salon;
   insert into public.barber_status(salon_id,barber_id,availability) values(salon,entry,'available');
  else
   if not exists(select 1 from public.barbers where id=entry and salon_id=salon) then raise exception 'Barber access unavailable' using errcode='42501';end if;
   if coalesce((p_data->>'is_active')::boolean,true)=false and (
    exists(select 1 from public.queue_entries where salon_id=salon and coalesce(assigned_barber_id,preferred_barber_id)=entry and status in ('joined','arrived','in_service')) or
    exists(select 1 from public.appointments a left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id where a.salon_id=salon and coalesce(a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id)=entry and a.status in ('pending','alternative_suggested','confirmed','arrived','in_service')) or
    exists(select 1 from public.service_sessions where barber_id=entry and status='in_service')) then raise exception 'Finish or reassign active visits before deactivating this barber';end if;
   if exists(select 1 from public.appointments a left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id where a.salon_id=salon and coalesce(a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id)=entry and a.status in ('pending','alternative_suggested','confirmed','arrived','in_service') and not (p_data->'service_ids' @> jsonb_build_array(a.service_id::text))) or
    exists(select 1 from public.queue_entries where salon_id=salon and coalesce(assigned_barber_id,preferred_barber_id)=entry and status in ('joined','arrived','in_service') and service_id is not null and not(p_data->'service_ids' @> jsonb_build_array(service_id::text))) then raise exception 'Keep services needed by active visits';end if;
   update public.barbers set display_name=btrim(p_data->>'display_name'),bio=p_data->>'bio',experience_years=(p_data->>'experience_years')::smallint,specialities=array(select jsonb_array_elements_text(p_data->'specialities')),photo_url=nullif(p_data->>'photo_url',''),is_active=coalesce((p_data->>'is_active')::boolean,is_active),updated_at=now() where id=entry;
  end if;
  delete from public.barber_services where barber_id=entry and not(p_data->'service_ids' @> jsonb_build_array(service_id::text));
  insert into public.barber_services(salon_id,barber_id,service_id) select salon,entry,value::uuid from jsonb_array_elements_text(p_data->'service_ids') on conflict(barber_id,service_id) do nothing;
  return jsonb_build_object('id',entry);
 elsif p_action='service' then
  if coalesce(char_length(btrim(p_data->>'name')),0) not between 1 and 100 then raise exception 'Enter a service name';end if;
  if entry is null then
   insert into public.services(salon_id,name,duration_minutes,price_min_minor,price_max_minor) values(salon,btrim(p_data->>'name'),(p_data->>'duration_minutes')::integer,(p_data->>'price_min_minor')::bigint,(p_data->>'price_max_minor')::bigint) returning id into entry;
  else
   update public.services set name=btrim(p_data->>'name'),duration_minutes=(p_data->>'duration_minutes')::integer,price_min_minor=(p_data->>'price_min_minor')::bigint,price_max_minor=(p_data->>'price_max_minor')::bigint where id=entry and salon_id=salon;
   if not found then raise exception 'Service unavailable';end if;
  end if;
  return jsonb_build_object('id',entry);
 end if;
 raise exception 'Unknown manager action';
end;$$;
create function public.manager_command(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.manager_command(p_action,p_data);$$;

create function bookmyturn_private.can_upload_salon_media(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select split_part(p_name,'/',1)=auth.uid()::text and case when split_part(p_name,'/',2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then bookmyturn_private.owns_salon(split_part(p_name,'/',2)::uuid) else false end;
$$;
create function bookmyturn_private.can_upload_barber_media(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select split_part(p_name,'/',1)=auth.uid()::text and case when split_part(p_name,'/',2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then exists(select 1 from public.barbers b where b.id=split_part(p_name,'/',2)::uuid
 and (bookmyturn_private.owns_salon(b.salon_id) or bookmyturn_private.is_my_barber(b.id))) else false end;
$$;
do $$begin
 if to_regclass('storage.buckets') is not null then
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
   ('salon-media','salon-media',true,2097152,array['image/jpeg','image/png','image/webp']),
   ('manager-avatars','manager-avatars',false,2097152,array['image/jpeg','image/png','image/webp']);
  execute $p$create policy salon_media_read on storage.objects for select to authenticated using(bucket_id='salon-media' and bookmyturn_private.can_upload_salon_media(name))$p$;
  execute $p$create policy salon_media_insert on storage.objects for insert to authenticated with check(bucket_id='salon-media' and bookmyturn_private.can_upload_salon_media(name))$p$;
  execute $p$create policy salon_media_delete on storage.objects for delete to authenticated using(bucket_id='salon-media' and bookmyturn_private.can_upload_salon_media(name))$p$;
  execute $p$create policy manager_avatar_read on storage.objects for select to authenticated using(bucket_id='manager-avatars' and split_part(name,'/',1)=(select auth.uid())::text)$p$;
  execute $p$create policy manager_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='manager-avatars' and split_part(name,'/',1)=(select auth.uid())::text)$p$;
  execute $p$create policy manager_avatar_delete on storage.objects for delete to authenticated using(bucket_id='manager-avatars' and split_part(name,'/',1)=(select auth.uid())::text)$p$;
  execute $p$alter policy barber_avatar_read on storage.objects using(bucket_id='barber-avatars' and bookmyturn_private.can_upload_barber_media(name))$p$;
  execute $p$alter policy barber_avatar_insert on storage.objects with check(bucket_id='barber-avatars' and bookmyturn_private.can_upload_barber_media(name))$p$;
  execute $p$alter policy barber_avatar_delete on storage.objects using(bucket_id='barber-avatars' and bookmyturn_private.can_upload_barber_media(name))$p$;
 end if;
end;$$;
revoke all on function bookmyturn_private.owns_salon(uuid),bookmyturn_private.manager_state(),bookmyturn_private.manager_command(text,jsonb),bookmyturn_private.can_upload_salon_media(text),bookmyturn_private.can_upload_barber_media(text),public.manager_state(),public.manager_command(text,jsonb) from public,anon,authenticated;
grant execute on function bookmyturn_private.owns_salon(uuid),bookmyturn_private.manager_state(),bookmyturn_private.manager_command(text,jsonb),bookmyturn_private.can_upload_salon_media(text),bookmyturn_private.can_upload_barber_media(text),public.manager_state(),public.manager_command(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
