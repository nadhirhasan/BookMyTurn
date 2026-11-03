begin;

-- A join is admission to the waiting queue. Keep the existing transactional
-- command, duplicate guard and collection snapshot, but ignore old presence UI.
create or replace function bookmyturn_private.customer_command(p_action text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare collection uuid; snapshot jsonb; result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in to manage your visits' using errcode='42501'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid request'; end if;
 if p_action='check_in' then raise exception 'Your queue entry is already registered. Show your code to staff.' using errcode='42501'; end if;
 if p_action='join_queue' then p_data:=p_data||jsonb_build_object('present',true); end if;
 collection:=(p_data->>'collection_id')::uuid;
 if collection is null or p_action not in('join_queue','request_appointment') then
  return bookmyturn_private.customer_photo_command_v1(p_action,p_data);
 end if;
 if p_data->>'haircut_id' is not null then raise exception 'Choose a photo or a collection'; end if;
 snapshot:=bookmyturn_private.collection_snapshot(collection);
 result:=bookmyturn_private.customer_photo_command_v1(p_action,p_data);
 if not coalesce((result->>'existing')::boolean,false) then
  perform bookmyturn_private.attach_collection((result->>'id')::uuid,case when p_action='join_queue' then 'queue' else 'appointment' end,collection,snapshot);
 end if;
 return result;
end;$$;

-- Any Barber codes must open a visit present in this chair's forecast, rather
-- than landing on an empty detail screen for another chair's customer.
do $$declare definition text; before_text text; after_text text; begin
 definition:=pg_get_functiondef('bookmyturn_private.barber_command(uuid,text,jsonb)'::regprocedure);
 before_text:='and coalesce(assigned_barber_id,preferred_barber_id,p_barber)=p_barber for update;';
 after_text:='and coalesce(assigned_barber_id,preferred_barber_id,p_barber)=p_barber
   and (assigned_barber_id is not null or preferred_barber_id is not null or exists(
    select 1 from bookmyturn_private.queue_forecast(salon)f where f.queue_id=queue_entries.id and f.barber_id=p_barber)) for update;';
 if position(before_text in definition)=0 then raise exception 'Expected staff code lookup missing'; end if;
 execute replace(definition,before_text,after_text);
end;$$;

-- Preserve recipient scoping, idempotent event keys, six-digit codes and the
-- actor/read-state rule. Notifications describe queue admission, not a second
-- customer arrival confirmation.
do $$declare definition text; begin
 definition:=pg_get_functiondef('bookmyturn_private.staff_event(uuid,uuid,text,uuid,text,text,timestamp with time zone)'::regprocedure);
 if position('Customer arrived' in definition)=0 or position('A customer is physically waiting at your salon.' in definition)=0 then
  raise exception 'Expected staff event wording missing';
 end if;
 definition:=replace(definition,'Customer arrived','New queue join');
 definition:=replace(definition,'A customer is on the way. Check them in when they arrive.','A customer has joined your waiting queue. Verify their code before starting.');
 definition:=replace(definition,'A customer is physically waiting at your salon.','A customer has joined your waiting queue. Verify their code before starting.');
 execute definition;
end;$$;

-- Keep codes, identities and existing waiting order. Legacy unstarted joins
-- enter after the current waiting queue, in creation order within each salon.
do $$declare entry record; begin
 for entry in select id,salon_id from public.queue_entries where status='joined' order by salon_id,created_at,id loop
  perform pg_advisory_xact_lock(hashtextextended(entry.salon_id::text,0));
  update public.queue_entries set status='arrived' where id=entry.id and status='joined';
 end loop;
end;$$;

-- CREATE OR REPLACE retains the existing grants; make the public boundary explicit.
revoke all on function bookmyturn_private.customer_command(text,jsonb) from public,anon;
grant execute on function bookmyturn_private.customer_command(text,jsonb) to authenticated;
comment on function bookmyturn_private.customer_command(text,jsonb) is 'Customer joins count as waiting immediately; service progression belongs to staff.';
commit;
