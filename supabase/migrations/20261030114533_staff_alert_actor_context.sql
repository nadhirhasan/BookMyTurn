begin;
-- A manager may also use the Customer app. Their customer-side joins/bookings
-- must still alert their salon; only explicit staff actions are auto-read.
do $$declare definition text;guard text;begin
 definition:=pg_get_functiondef('bookmyturn_private.staff_event(uuid,uuid,text,uuid,text,text,timestamp with time zone)'::regprocedure);
 execute replace(definition,'case when m.user_id=auth.uid() then','case when m.user_id=auth.uid() and current_setting(''bookmyturn.staff_action'',true)=''1'' then');
 definition:=pg_get_functiondef('bookmyturn_private.barber_command(uuid,text,jsonb)'::regprocedure);
 guard:='if member.id is null then raise exception ''Barber access has been removed'' using errcode=''42501'';end if;';
 if position(guard in definition)=0 then raise exception 'Expected barber guard missing';end if;
 execute replace(definition,guard,guard||' perform set_config(''bookmyturn.staff_action'',''1'',true);');
 definition:=pg_get_functiondef('bookmyturn_private.manager_visit_command(uuid,text,uuid)'::regprocedure);
 guard:='if member is null then raise exception ''Salon access unavailable'' using errcode=''42501'';end if;';
 if position(guard in definition)=0 then raise exception 'Expected salon guard missing';end if;
 execute replace(definition,guard,guard||' perform set_config(''bookmyturn.staff_action'',''1'',true);');
end;$$;
commit;
