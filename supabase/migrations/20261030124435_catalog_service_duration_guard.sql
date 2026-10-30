begin;
-- Older chair screens use barber_command; protect reservations at the table too.
create function bookmyturn_private.guard_service_duration() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(old.salon_id::text,0));
 if new.duration_minutes<>old.duration_minutes and (
  exists(select 1 from public.queue_entries where salon_id=old.salon_id and service_id=old.id and status in ('joined','arrived','in_service')) or
  exists(select 1 from public.appointments where salon_id=old.salon_id and service_id=old.id and status in ('pending','alternative_suggested','confirmed','arrived','in_service')))
  then raise exception 'Handle active visits before changing service duration';end if;
 return new;
end;$$;
create trigger service_duration_guard before update of duration_minutes on public.services
 for each row execute function bookmyturn_private.guard_service_duration();
revoke all on function bookmyturn_private.guard_service_duration() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
