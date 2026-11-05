begin;
alter table public.salons add column latitude double precision,add column longitude double precision;
alter table public.salons add constraint salon_location_pair check((latitude is null)=(longitude is null)),
 add constraint salon_latitude_range check(latitude between -90 and 90),
 add constraint salon_longitude_range check(longitude between -180 and 180);

-- Preserve the existing owner checks, scheduling, media and catalog operations.
alter function bookmyturn_private.manager_command(text,jsonb) rename to manager_location_command_v1;
create function bookmyturn_private.manager_command(p_action text,p_data jsonb)returns jsonb
language plpgsql security definer set search_path='' as $$
declare lat double precision;lng double precision;result jsonb;existed boolean:=false;
begin
 if auth.uid() is null then raise exception 'Sign in to manage your salons' using errcode='42501';end if;
 if p_action in('create_salon','salon')and(p_data?'latitude'or p_data?'longitude')then
  if jsonb_typeof(p_data->'latitude')is distinct from'number'or jsonb_typeof(p_data->'longitude')is distinct from'number'
  then raise exception 'Choose the salon location on the map';end if;
  lat:=(p_data->>'latitude')::double precision;lng:=(p_data->>'longitude')::double precision;
  if not(lat between -90 and 90 and lng between -180 and 180)then raise exception 'Choose a valid salon location';end if;
  if p_action='create_salon'then
   perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
   existed:=exists(select 1 from public.salons where id=(p_data->>'id')::uuid);
  end if;
  result:=bookmyturn_private.manager_location_command_v1(p_action,p_data);
  -- The delegated create/edit has verified ownership and taken the salon lock.
  if p_action='salon'or not existed then
   update public.salons set latitude=lat,longitude=lng,updated_at=now()where id=(result->>'id')::uuid;
  end if;
  return result;
 end if;
 return bookmyturn_private.manager_location_command_v1(p_action,p_data);
end;$$;
revoke all on function bookmyturn_private.manager_location_command_v1(text,jsonb)from public,anon,authenticated;
revoke all on function bookmyturn_private.manager_command(text,jsonb)from public,anon,authenticated;
grant execute on function bookmyturn_private.manager_command(text,jsonb)to authenticated;
-- Existing state/catalog functions serialize salon rows and include the new fields.
commit;
