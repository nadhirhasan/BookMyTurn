begin;
-- Pending holds also need their customer cleared when Auth deletion sets the
-- appointment owner to null. The existing block sync only handles active dates.
create function bookmyturn_private.sync_appointment_customer_identity() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update bookmyturn_private.barber_schedule_blocks set customer_id=new.customer_id where appointment_id=new.id;
 return new;
end; $$;
revoke all on function bookmyturn_private.sync_appointment_customer_identity() from public,anon,authenticated;
create trigger sync_appointment_customer_identity after update of customer_id on public.appointments
 for each row when (old.customer_id is distinct from new.customer_id)
 execute function bookmyturn_private.sync_appointment_customer_identity();
commit;
