begin;
do $$declare definition text;old_filter text:='(q.preferred_barber_id is null and q.assigned_barber_id is null and f.barber_id=p_barber)';begin
 definition:=pg_get_functiondef('bookmyturn_private.barber_state(uuid)'::regprocedure);
 if position(old_filter in definition)=0 then raise exception 'Expected unassigned queue filter not found';end if;
 execute replace(definition,old_filter,'(q.preferred_barber_id is null and q.assigned_barber_id is null and (f.barber_id=p_barber or (q.status=''joined'' and (q.service_id is null or exists(select 1 from public.barber_services bs where bs.barber_id=p_barber and bs.service_id=q.service_id)))))');
 definition:=pg_get_functiondef('bookmyturn_private.staff_event(uuid,uuid,text,uuid,text,text,timestamp with time zone)'::regprocedure);
 execute replace(definition,'(p_barber is null or p_barber=m.barber_id)','(p_barber=m.barber_id or (p_barber is null and p_kind=''queue'' and exists(select 1 from public.queue_entries q where q.id=p_id and (q.service_id is null or exists(select 1 from public.barber_services bs where bs.barber_id=m.barber_id and bs.service_id=q.service_id)))))');
end;$$;
create function bookmyturn_private.staff_hold_changed() returns trigger language plpgsql security definer set search_path='' as $$declare a public.appointments;begin
 if new.appointment_id is not null and new.is_active then
  select * into a from public.appointments where id=new.appointment_id and status='pending';
  if a.id is not null then perform bookmyturn_private.staff_event(a.salon_id,new.barber_id,'appointment',a.id,'pending',a.reference);end if;
 end if;return new;
end;$$;
create trigger zz_staff_hold_event after insert or update of barber_id on bookmyturn_private.barber_schedule_blocks for each row execute function bookmyturn_private.staff_hold_changed();
revoke all on function bookmyturn_private.staff_hold_changed() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
