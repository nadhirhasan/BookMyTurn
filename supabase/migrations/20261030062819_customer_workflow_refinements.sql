begin;

create or replace function bookmyturn_private.customer_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('observed_at',now(),'today',(now() at time zone 'Asia/Colombo')::date,'salons',
 coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object(
  'open_now',s.is_open and exists(select 1 from public.barbers b cross join lateral bookmyturn_private.work_window(s.id,b.id,(now() at time zone s.timezone)::date) w where b.salon_id=s.id and now()>=w.opens and now()<w.closes),
  'waiting',(select count(*) from public.queue_entries q where q.salon_id=s.id and q.status='arrived'),
  'earliest',(select min(f.starts_at) from bookmyturn_private.queue_forecast(s.id) f where f.queue_id is null),
  'rating',(select average_rating from public.salon_review_stats r where r.salon_id=s.id),
  'review_count',(select count(*) from public.published_reviews r where r.salon_id=s.id),
  'booking_horizon_days',(select forecast_horizon_days from bookmyturn_private.salon_policies sp where sp.salon_id=s.id),
  'simulation_enabled',coalesce((select simulation_enabled from bookmyturn_private.customer_demo_settings ds where ds.salon_id=s.id),false)
 ) order by s.name) from public.salons s where s.is_published),'[]'::jsonb),
 'barbers',coalesce((select jsonb_agg(to_jsonb(b)||jsonb_build_object('availability',st.availability,
   'rating',(select average_rating from public.barber_review_stats r where r.barber_id=b.id),
   'earliest',(select min(f.starts_at) from bookmyturn_private.queue_forecast(b.salon_id) f where f.barber_id=b.id and f.queue_id is null),
   'waiting',(select count(*) from bookmyturn_private.queue_forecast(b.salon_id) f where f.barber_id=b.id and f.queue_id is not null),
   'review_count',(select count(*) from public.published_reviews r where r.barber_id=b.id)))
   from public.barbers b join public.salons s on s.id=b.salon_id and s.is_published
   left join public.barber_status st on st.barber_id=b.id where b.is_active and b.is_published),'[]'::jsonb),
 'services',coalesce((select jsonb_agg(to_jsonb(v)) from public.services v join public.salons s on s.id=v.salon_id where s.is_published and v.is_active),'[]'::jsonb),
 'barber_services',coalesce((select jsonb_agg(to_jsonb(bs)) from public.barber_services bs join public.barbers b on b.id=bs.barber_id join public.salons s on s.id=b.salon_id where s.is_published and b.is_active and b.is_published),'[]'::jsonb),
 'hours',coalesce((select jsonb_agg(to_jsonb(h)) from public.salon_hours h join public.salons s on s.id=h.salon_id where s.is_published),'[]'::jsonb),
 'categories',coalesce((select jsonb_agg(to_jsonb(c) order by c.name) from public.hairstyle_categories c),'[]'::jsonb),
 'hairstyles',coalesce((select jsonb_agg(to_jsonb(h) order by h.title) from public.hairstyles h where h.is_published),'[]'::jsonb),
 'reviews',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.published_reviews r join public.salons s on s.id=r.salon_id where s.is_published),'[]'::jsonb));
$$;

create or replace function bookmyturn_private.customer_command(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); salon uuid; service uuid; barber uuid; entry uuid; a public.appointments;
 q public.queue_entries; ss public.service_sessions; sv public.services; prop public.appointment_proposals;
 chosen record; result_id uuid; request_id uuid; at_time timestamptz; duration integer; style_id uuid;
begin
 if u is null then raise exception 'Sign in to manage your visits' using errcode='42501'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid request'; end if;
 if p_action in ('join_queue','request_appointment') then
  salon:=(p_data->>'salon_id')::uuid; service:=(p_data->>'service_id')::uuid; barber:=(p_data->>'barber_id')::uuid;
  request_id:=(p_data->>'request_key')::uuid;
  if request_id is null then raise exception 'Request key required'; end if;
  -- Coarse per-salon transaction lock makes any-barber allocation and retries atomic.
  perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
  if not exists(select 1 from public.salons s where s.id=salon and s.is_published) then raise exception 'Salon unavailable'; end if;
  if p_action='join_queue' then
   select * into q from public.queue_entries where salon_id=salon and customer_id=u and (status in ('joined','arrived','in_service') or request_key=request_id) order by created_at desc limit 1;
   if q.id is not null then return jsonb_build_object('id',q.id,'existing',true); end if;
  else
   select * into a from public.appointments where salon_id=salon and request_key=request_id;
   if a.id is not null then
    if a.customer_id is distinct from u then raise exception 'Request key unavailable'; end if;
    return jsonb_build_object('id',a.id,'existing',true);
   end if;
  end if;
  select * into sv from public.services where id=service and salon_id=salon and is_active;
  if service is not null and sv.id is null then raise exception 'Service unavailable'; end if;
  if barber is not null and not exists(select 1 from public.barbers b where b.id=barber and b.salon_id=salon and b.is_active and b.is_published
    and (service is null or exists(select 1 from public.barber_services bs where bs.barber_id=b.id and bs.service_id=service))) then raise exception 'Barber does not offer this service'; end if;
  if char_length(p_data->>'customer_name')>80 or char_length(p_data->>'mobile')>32 then raise exception 'Customer details too long'; end if;
  if p_action='join_queue' then
   if not exists(select 1 from public.salons s where s.id=salon and s.is_open and exists(select 1 from public.barbers b
    cross join lateral bookmyturn_private.work_window(salon,b.id,(now() at time zone s.timezone)::date) w where b.salon_id=salon and now()>=w.opens and now()<w.closes)) then raise exception 'Salon is closed'; end if;
   if not exists(select 1 from bookmyturn_private.queue_forecast(salon) f where f.queue_id is null and f.starts_at is not null and (barber is null or barber=f.barber_id)) then raise exception 'No queue capacity today'; end if;
   insert into public.queue_entries(salon_id,customer_id,source,service_id,preferred_barber_id,customer_name,mobile,request_key,status)
    values(salon,u,case when p_data->>'source'='qr' then 'qr' else 'remote' end,service,barber,
     nullif(btrim(p_data->>'customer_name'),''),nullif(btrim(p_data->>'mobile'),''),request_id,
     case when coalesce((p_data->>'present')::boolean,false) then 'arrived' else 'joined' end) returning id into result_id;
  else
   if sv.id is null then raise exception 'Choose a service'; end if;
   at_time:=(p_data->>'starts_at')::timestamptz;
   select * into chosen from bookmyturn_private.customer_slots(salon,service,(at_time at time zone 'Asia/Colombo')::date,barber)
    where starts_at=at_time and available order by ends_at,barber_id limit 1;
   if chosen.barber_id is null then raise exception 'This time is no longer available. Choose another time.' using errcode='23P01'; end if;
   duration:=extract(epoch from chosen.ends_at-chosen.starts_at)::integer/60;
   insert into public.appointments(salon_id,customer_id,service_id,preferred_barber_id,requested_start,requested_duration_minutes,customer_name,mobile,request_key)
    values(salon,u,service,barber,at_time,duration,nullif(btrim(p_data->>'customer_name'),''),nullif(btrim(p_data->>'mobile'),''),request_id) returning id into result_id;
   insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)
    values(salon,chosen.barber_id,'appointment',result_id,chosen.starts_at,chosen.ends_at);
   insert into public.notifications(user_id,event_key,title,body) values(u,result_id::text||':pending','Request received','Your chosen time is held while the salon reviews your request.');
  end if;
  return jsonb_build_object('id',result_id);
 end if;

 entry:=(p_data->>'id')::uuid;
 -- Obtain the shared lock before row locks; same order for every mutation.
 if p_action in ('check_in','cancel_queue','demo_finish_queue') then
  select salon_id into salon from public.queue_entries where id=entry and customer_id=u;
 else
  select salon_id into salon from public.appointments where id=entry and customer_id=u;
 end if;
 if p_action not in ('share_styles','review','read_notifications') then
  if salon is null then raise exception 'Visit not found' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
  select * into q from public.queue_entries where id=entry and customer_id=u for update;
  select * into a from public.appointments where id=entry and customer_id=u for update;
 end if;
 if p_action='check_in' then
  if q.status='joined' then
   if not exists(select 1 from public.salons s where s.id=salon and s.is_open and exists(select 1 from public.barbers b
    cross join lateral bookmyturn_private.work_window(salon,b.id,(now() at time zone s.timezone)::date) w where b.salon_id=salon and now()>=w.opens and now()<w.closes)) then raise exception 'Salon is closed'; end if;
   update public.queue_entries set status='arrived' where id=q.id;
  elsif q.status<>'arrived' then raise exception 'This queue entry cannot be checked in'; end if;
 elsif p_action='cancel_queue' then
  if q.status not in ('joined','arrived','cancelled') then raise exception 'Service already started'; end if;
  update public.queue_entries set status='cancelled' where id=q.id and status<>'cancelled';
 elsif p_action='cancel_appointment' then
  if a.status not in ('pending','alternative_suggested','confirmed','cancelled') then raise exception 'Appointment cannot be cancelled'; end if;
  update public.appointments set status='cancelled' where id=a.id and status<>'cancelled';
 elsif p_action='accept_alternative' then
  if a.status<>'alternative_suggested' then raise exception 'No alternative to accept'; end if;
  select * into prop from public.appointment_proposals where id=(p_data->>'proposal_id')::uuid and appointment_id=a.id;
  if prop.id is null or prop.starts_at<=now() then raise exception 'Alternative unavailable'; end if;
  update public.appointment_proposals set accepted_at=now(),accepted_by=u where id=prop.id;
  update public.appointments set status='confirmed',confirmed_barber_id=prop.barber_id,confirmed_start=prop.starts_at,confirmed_end=prop.ends_at,accepted_proposal_id=prop.id where id=a.id;
 elsif p_action in ('demo_accept','demo_decline','demo_alternative','demo_finish_queue','demo_finish_appointment') then
  if not exists(select 1 from public.salons s join bookmyturn_private.customer_demo_settings d on d.salon_id=s.id where s.id=salon and s.is_demo and d.simulation_enabled) then raise exception 'Demo controls disabled' using errcode='42501'; end if;
  if p_action='demo_accept' then
   if a.status='confirmed' then return jsonb_build_object('id',a.id); end if;
   if a.status<>'pending' or a.requested_start<=now() then raise exception 'Request cannot be accepted'; end if;
   select * into chosen from bookmyturn_private.barber_schedule_blocks where appointment_id=a.id and is_active;
   update public.appointments set status='confirmed',confirmed_barber_id=chosen.barber_id,confirmed_start=chosen.starts_at,confirmed_end=chosen.ends_at where id=a.id;
  elsif p_action='demo_decline' then
   if a.status not in ('pending','alternative_suggested') then raise exception 'Request cannot be declined'; end if;
   update public.appointments set status='declined' where id=a.id;
  elsif p_action='demo_alternative' then
   if a.status not in ('pending','alternative_suggested') then raise exception 'Request cannot be changed'; end if;
   select * into chosen from bookmyturn_private.customer_slots(salon,a.service_id,
     (a.requested_start at time zone 'Asia/Colombo')::date,a.preferred_barber_id)
     where available and starts_at>a.requested_start order by starts_at,barber_id limit 1;
   if chosen.barber_id is null then raise exception 'No later alternative on this day'; end if;
   update public.appointments set status='alternative_suggested' where id=a.id;
   insert into public.appointment_proposals(salon_id,appointment_id,barber_id,starts_at,ends_at)
    values(salon,a.id,chosen.barber_id,chosen.starts_at,chosen.ends_at) returning id into result_id;
   insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)
    values(salon,chosen.barber_id,'appointment',a.id,chosen.starts_at,chosen.ends_at)
    on conflict(appointment_id) do update set barber_id=excluded.barber_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,is_active=true;
  else
   select * into ss from public.service_sessions where customer_id=u and (queue_entry_id=q.id or appointment_id=a.id);
   if ss.status='completed' then return jsonb_build_object('id',entry); end if;
   if p_action='demo_finish_queue' then
    if q.status<>'arrived' then raise exception 'Check in before completing a demo haircut'; end if;
    select * into chosen from bookmyturn_private.queue_forecast(salon) f where f.queue_id=q.id;
    if chosen.barber_id is null then raise exception 'No suitable barber'; end if;
    -- A later physical customer cannot jump the same barber in the simulation.
    if exists(select 1 from bookmyturn_private.queue_forecast(salon) f join public.queue_entries prior on prior.id=f.queue_id
      where f.barber_id=chosen.barber_id and prior.arrival_sequence<q.arrival_sequence) then raise exception 'An earlier customer is waiting for this barber'; end if;
    barber:=chosen.barber_id;
    select * into sv from public.services where id=q.service_id;
    if sv.id is null then select s.* into sv from public.services s join public.barber_services bs on bs.service_id=s.id where s.salon_id=salon and s.is_active and bs.barber_id=barber order by s.duration_minutes,s.name limit 1; end if;
   else
    if a.status<>'confirmed' then raise exception 'Confirm the appointment before completing it'; end if;
    update public.appointments set status='arrived',arrived_at=clock_timestamp() where id=a.id;
    barber:=a.confirmed_barber_id; select * into sv from public.services where id=a.service_id;
   end if;
   insert into public.service_sessions(salon_id,barber_id,customer_id,queue_entry_id,appointment_id,service_id,source,
    service_name_snapshot,duration_minutes_snapshot,price_min_minor_snapshot,price_max_minor_snapshot,agreed_price_minor,price_agreed_at)
   values(salon,barber,u,q.id,a.id,sv.id,case when q.id is null then 'appointment' else q.source end,
    sv.name,sv.duration_minutes,sv.price_min_minor,sv.price_max_minor,sv.price_min_minor,clock_timestamp()) returning * into ss;
   insert into public.service_items(salon_id,service_session_id,description,kind,amount_minor) values(salon,ss.id,sv.name,'base',ss.agreed_price_minor);
   at_time:=clock_timestamp();
   update public.service_sessions set status='completed',completed_at=at_time,final_amount_minor=ss.agreed_price_minor,final_amount_agreed_at=at_time where id=ss.id;
  end if;
 elsif p_action='share_styles' then
  if jsonb_typeof(p_data->'hairstyle_ids')<>'array' or jsonb_array_length(p_data->'hairstyle_ids') not between 1 and 8 then raise exception 'Choose one to eight reference styles'; end if;
  if p_data->>'kind'='queue' then select * into q from public.queue_entries where id=entry and customer_id=u and status in ('joined','arrived'); salon:=q.salon_id;
  elsif p_data->>'kind'='appointment' then select * into a from public.appointments where id=entry and customer_id=u and status in ('pending','alternative_suggested','confirmed','arrived'); salon:=a.salon_id; end if;
  if salon is null then raise exception 'Active visit not found' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
  if q.id is not null and not exists(select 1 from public.queue_entries where id=q.id and customer_id=u and status in ('joined','arrived')) then raise exception 'Active visit not found' using errcode='42501'; end if;
  if a.id is not null and not exists(select 1 from public.appointments where id=a.id and customer_id=u and status in ('pending','alternative_suggested','confirmed','arrived')) then raise exception 'Active visit not found' using errcode='42501'; end if;
  select id into result_id from public.style_requests where queue_entry_id=q.id or appointment_id=a.id;
  if result_id is null then
   insert into public.style_requests(salon_id,customer_id,queue_entry_id,appointment_id,note) values(salon,u,q.id,a.id,p_data->>'note') returning id into result_id;
  else update public.style_requests set note=p_data->>'note',revision=revision+1,submitted_at=now(),viewed_at=null where id=result_id;
   delete from public.style_request_items where style_request_id=result_id;
  end if;
  for style_id in select distinct value::text::uuid from jsonb_array_elements_text(p_data->'hairstyle_ids') loop
   if not exists(select 1 from public.hairstyles h where h.id=style_id and h.is_published) then raise exception 'Style unavailable'; end if;
   insert into public.style_request_items values(salon,result_id,style_id);
  end loop;
 elsif p_action='review' then
  select * into ss from public.service_sessions where id=entry and customer_id=u and status='completed';
  if ss.id is null then raise exception 'A completed haircut is required' using errcode='42501'; end if;
  insert into public.reviews(salon_id,barber_id,service_session_id,customer_id,rating,body,publish_consent)
   values(ss.salon_id,ss.barber_id,ss.id,u,(p_data->>'rating')::smallint,nullif(btrim(p_data->>'body'),''),true)
   returning id into result_id;
 elsif p_action='read_notifications' then update public.notifications set read_at=now() where user_id=u and read_at is null;
 else raise exception 'Unknown customer action';
 end if;
 if a.id is not null and p_action<>'share_styles' then
  insert into public.notifications(user_id,event_key,title,body) values(u,a.id::text||':'||p_action,'Appointment updated',
   case p_action when 'demo_alternative' then 'The demo salon suggested another time. Review it before accepting.'
    when 'demo_accept' then 'The demo salon accepted your appointment.' when 'accept_alternative' then 'You accepted the alternative time.'
    when 'cancel_appointment' then 'Your appointment was cancelled and its time released.' else 'Your appointment status has changed.' end)
   on conflict(user_id,event_key) do nothing;
 end if;
 return jsonb_build_object('id',coalesce(result_id,entry));
end; $$;

create or replace function bookmyturn_private.sync_appointment_block() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('confirmed','arrived','in_service') then
    insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)
      values(new.salon_id,new.confirmed_barber_id,'appointment',new.id,new.confirmed_start,new.confirmed_end)
      on conflict (appointment_id) do update set barber_id=excluded.barber_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,is_active=true;
  elsif new.status not in ('pending','alternative_suggested') then
    update bookmyturn_private.barber_schedule_blocks set is_active=false where appointment_id=new.id;
  end if;
  return new;
end; $$;
notify pgrst,'reload schema';
commit;
