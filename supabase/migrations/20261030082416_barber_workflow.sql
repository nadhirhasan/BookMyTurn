begin;
create function bookmyturn_private.is_my_barber(p_barber uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from bookmyturn_private.salon_memberships m
 join public.barbers b on b.id=m.barber_id and b.salon_id=m.salon_id
 where m.user_id=auth.uid() and m.is_active and m.role in ('barber','owner') and m.barber_id=p_barber and b.is_active);
$$;
create function bookmyturn_private.barber_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to use the barber app' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('barber_id',b.id,'salon_id',s.id,'barber_name',b.display_name,'salon_name',s.name,'role',m.role))
 from bookmyturn_private.salon_memberships m join public.barbers b on b.id=m.barber_id join public.salons s on s.id=m.salon_id
 where m.user_id=auth.uid() and m.is_active and m.role in ('barber','owner') and b.is_active),'[]');
end;$$;
create function public.barber_context() returns jsonb language sql stable security invoker set search_path='' as $$select bookmyturn_private.barber_context();$$;

create function bookmyturn_private.setup_salon(p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); salon uuid; barber uuid; service uuid; opens time; closes time; d integer;
begin
 if u is null then raise exception 'Sign in to create your salon' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,1));
 if exists(select 1 from bookmyturn_private.salon_memberships where user_id=u and role='owner') then raise exception 'This account already owns a salon';end if;
 if char_length(btrim(p_data->>'salon_name')) not between 1 and 100 or char_length(btrim(p_data->>'barber_name')) not between 1 and 80 then raise exception 'Enter a salon and barber name';end if;
 if jsonb_typeof(p_data->'weekdays') is distinct from 'array' or jsonb_array_length(p_data->'weekdays') not between 1 and 7 then raise exception 'Choose working days';end if;
 opens:=(p_data->>'opens_at')::time;closes:=(p_data->>'closes_at')::time;
 if opens is null or closes is null or closes<=opens then raise exception 'Closing time must be after opening time';end if;
 if (p_data->>'duration_minutes')::integer not between 1 and 480 or (p_data->>'price_min_minor')::bigint<0 or (p_data->>'price_max_minor')::bigint<(p_data->>'price_min_minor')::bigint then raise exception 'Check service duration and price range';end if;
 insert into public.salons(slug,name,address,is_published,is_open) values('salon-'||gen_random_uuid(),btrim(p_data->>'salon_name'),left(p_data->>'address',500),true,true) returning id into salon;
 insert into public.barbers(salon_id,display_name,is_published) values(salon,btrim(p_data->>'barber_name'),true) returning id into barber;
 insert into bookmyturn_private.salon_memberships(salon_id,user_id,role,barber_id) values(salon,u,'owner',barber);
 insert into bookmyturn_private.salon_policies(salon_id,default_service_minutes,forecast_horizon_days) values(salon,(p_data->>'duration_minutes')::integer,30);
 insert into bookmyturn_private.customer_demo_settings values(salon,false);
 for d in select distinct value::integer from jsonb_array_elements_text(p_data->'weekdays') loop
  insert into public.salon_hours values(salon,d,opens,closes);
  insert into public.barber_hours values(salon,barber,d,opens,closes);
 end loop;
 insert into public.barber_status(salon_id,barber_id,availability) values(salon,barber,'available');
 insert into public.services(salon_id,name,price_min_minor,price_max_minor,duration_minutes)
 values(salon,btrim(p_data->>'service_name'),(p_data->>'price_min_minor')::bigint,(p_data->>'price_max_minor')::bigint,(p_data->>'duration_minutes')::integer) returning id into service;
 insert into public.barber_services(salon_id,barber_id,service_id) values(salon,barber,service);
 return jsonb_build_object('barber_id',barber,'salon_id',salon);
end;$$;
create function public.setup_salon(p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.setup_salon(p_data);$$;

create function bookmyturn_private.barber_state(p_barber uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare salon uuid; result jsonb;
begin
 if not bookmyturn_private.is_my_barber(p_barber) then raise exception 'Barber access is not assigned to this account' using errcode='42501';end if;
 select salon_id into salon from public.barbers where id=p_barber;
 -- A timed break ends when the barber app next refreshes; explicit resume also works.
 if exists(select 1 from public.barber_status st where st.barber_id=p_barber and st.availability='on_break') and
  exists(select 1 from bookmyturn_private.barber_schedule_blocks bl where bl.barber_id=p_barber and bl.kind='break' and bl.is_active) and
  not exists(select 1 from bookmyturn_private.barber_schedule_blocks bl where bl.barber_id=p_barber and bl.kind='break' and bl.is_active and bl.ends_at>now()) then
  update public.barber_status set availability='available',observed_at=now() where barber_id=p_barber;
 end if;
 with forecast as materialized(select * from bookmyturn_private.queue_forecast(salon)),
 own_queue as (select q.*,f.starts_at as estimated_start from public.queue_entries q left join forecast f on f.queue_id=q.id
  where q.salon_id=salon and q.status in ('joined','arrived','in_service') and
  (coalesce(q.assigned_barber_id,q.preferred_barber_id)=p_barber or (q.preferred_barber_id is null and q.assigned_barber_id is null and f.barber_id=p_barber))),
 own_appointments as (select a.* from public.appointments a left join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id
  where a.salon_id=salon and coalesce(a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id)=p_barber and a.status not in ('cancelled','declined','completed','no_show'))
 select jsonb_build_object('observed_at',now(),'today',(now() at time zone 'Asia/Colombo')::date,
  'salon',(select to_jsonb(s) from public.salons s where s.id=salon),
  'barber',(select to_jsonb(b)||jsonb_build_object('availability',st.availability) from public.barbers b join public.barber_status st on st.barber_id=b.id where b.id=p_barber),
  'can_manage_catalog',bookmyturn_private.has_permission(salon,'manage_catalog'),
  'queues',coalesce((select jsonb_agg(to_jsonb(q) order by q.arrival_sequence nulls last,q.created_at) from own_queue q),'[]'),
  'appointments',coalesce((select jsonb_agg(to_jsonb(a) order by a.requested_start) from own_appointments a),'[]'),
  'services',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('duration_minutes',coalesce(bs.duration_minutes,s.duration_minutes),'price_min_minor',coalesce(bs.price_min_minor,s.price_min_minor),'price_max_minor',coalesce(bs.price_max_minor,s.price_max_minor))) from public.services s join public.barber_services bs on bs.service_id=s.id where bs.barber_id=p_barber and s.is_active),'[]'),
  'hours',coalesce((select jsonb_agg(to_jsonb(h) order by weekday) from public.barber_hours h where h.barber_id=p_barber),'[]'),
  'sessions',coalesce((select jsonb_agg(to_jsonb(ss) order by ss.started_at desc) from (select * from public.service_sessions where barber_id=p_barber order by started_at desc limit 100)ss),'[]'),
  'performance',(select jsonb_build_object('today_count',count(*) filter(where (completed_at at time zone 'Asia/Colombo')::date=(now() at time zone 'Asia/Colombo')::date),'today_revenue_minor',coalesce(sum(final_amount_minor) filter(where (completed_at at time zone 'Asia/Colombo')::date=(now() at time zone 'Asia/Colombo')::date),0),'total_count',count(*),'total_revenue_minor',coalesce(sum(final_amount_minor),0)) from public.service_sessions where barber_id=p_barber and status='completed'),
  'styles',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('images',(select coalesce(jsonb_agg(to_jsonb(h)),'[]') from public.style_request_items i join public.hairstyles h on h.id=i.hairstyle_id where i.style_request_id=r.id))) from public.style_requests r where r.queue_entry_id in(select id from own_queue) or r.appointment_id in(select id from own_appointments)),'[]'),
  'reviews',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.published_reviews r where r.barber_id=p_barber),'[]'),
  'commission_rules',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'surcharge_minor',r.surcharge_minor,'disclosure',r.disclosure,'eligible_sources',r.eligible_sources)) from bookmyturn_private.commission_rules r where r.salon_id=salon and r.is_enabled and r.valid_from<=now() and (r.valid_until is null or r.valid_until>now())),'[]'),
  'breaks',coalesce((select jsonb_agg(jsonb_build_object('id',bl.id,'starts_at',bl.starts_at,'ends_at',bl.ends_at)) from bookmyturn_private.barber_schedule_blocks bl where bl.barber_id=p_barber and bl.kind='break' and bl.is_active and bl.ends_at>now()),'[]')) into result;
 return result;
end;$$;
create function public.barber_state(p_barber uuid) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.barber_state(p_barber);$$;

create function bookmyturn_private.barber_command(p_barber uuid,p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare salon uuid; u uuid:=auth.uid(); q public.queue_entries; a public.appointments; ss public.service_sessions;
 sv public.services; bs public.barber_services; rule bookmyturn_private.commission_rules; bl bookmyturn_private.barber_schedule_blocks;
 entry uuid:=(p_data->>'id')::uuid; result_id uuid; amount bigint; lo bigint; hi bigint; duration integer;
 at_time timestamptz; end_time timestamptz; source text; customer uuid; extra jsonb; extras_total bigint:=0; member bookmyturn_private.salon_memberships;
begin
 if not bookmyturn_private.is_my_barber(p_barber) then raise exception 'Barber access is not assigned to this account' using errcode='42501';end if;
 select salon_id into salon from public.barbers where id=p_barber;
 perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
 select * into member from bookmyturn_private.salon_memberships where barber_id=p_barber and user_id=u and salon_id=salon and is_active and role in ('barber','owner') for share;
 if member.id is null then raise exception 'Barber access has been removed' using errcode='42501';end if;
 if p_action='availability' then
  if p_data->>'status' not in ('available','on_break','off_duty') then raise exception 'Choose a valid availability';end if;
  if exists(select 1 from public.service_sessions where barber_id=p_barber and status='in_service') then raise exception 'Finish your current service first';end if;
  update bookmyturn_private.barber_schedule_blocks set is_active=false where barber_id=p_barber and kind='break' and is_active;
  if p_data->>'status'='on_break' then
   if (p_data->>'minutes')::integer not between 1 and 240 then raise exception 'Choose a break between 1 and 240 minutes';end if;
   insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,starts_at,ends_at) values(salon,p_barber,'break',now(),now()+make_interval(mins=>(p_data->>'minutes')::integer));
  end if;
  update public.barber_status set availability=p_data->>'status',observed_at=now() where barber_id=p_barber;
 elsif p_action='profile' then
  update public.barbers set display_name=btrim(p_data->>'display_name'),bio=p_data->>'bio',experience_years=(p_data->>'experience_years')::smallint,
   specialities=array(select jsonb_array_elements_text(p_data->'specialities')),photo_url=nullif(p_data->>'photo_url',''),updated_at=now() where id=p_barber;
 elsif p_action='salon_open' then
  if not bookmyturn_private.has_permission(salon,'manage_catalog') then raise exception 'Salon permission required' using errcode='42501';end if;
  update public.salons set is_open=(p_data->>'is_open')::boolean,updated_at=now() where id=salon;
 elsif p_action='service' then
  if not bookmyturn_private.has_permission(salon,'manage_catalog') then raise exception 'Salon permission required' using errcode='42501';end if;
  if entry is null then
   insert into public.services(salon_id,name,price_min_minor,price_max_minor,duration_minutes) values(salon,btrim(p_data->>'name'),(p_data->>'price_min_minor')::bigint,(p_data->>'price_max_minor')::bigint,(p_data->>'duration_minutes')::integer) returning id into entry;
   insert into public.barber_services(salon_id,barber_id,service_id) values(salon,p_barber,entry);
  else
   if not exists(select 1 from public.barber_services where barber_id=p_barber and service_id=entry) then raise exception 'Service unavailable';end if;
   update public.services set name=btrim(p_data->>'name'),price_min_minor=(p_data->>'price_min_minor')::bigint,price_max_minor=(p_data->>'price_max_minor')::bigint,duration_minutes=(p_data->>'duration_minutes')::integer where id=entry and salon_id=salon;
  end if;
 elsif p_action='walk_in' then
  select id into result_id from public.queue_entries where salon_id=salon and request_key=(p_data->>'request_key')::uuid;
  if result_id is not null then return jsonb_build_object('id',result_id);end if;
  if p_data->>'request_key' is null then raise exception 'Request key required';end if;
  if p_data->>'service_id' is not null and not exists(select 1 from public.services s join public.barber_services b on b.service_id=s.id where b.barber_id=p_barber and s.id=(p_data->>'service_id')::uuid and s.is_active) then raise exception 'Service unavailable';end if;
  insert into public.queue_entries(salon_id,source,status,service_id,preferred_barber_id,customer_name,mobile,note,request_key)
   values(salon,'walk_in','arrived',(p_data->>'service_id')::uuid,p_barber,nullif(p_data->>'customer_name',''),nullif(p_data->>'mobile',''),nullif(p_data->>'note',''),(p_data->>'request_key')::uuid) returning id into result_id;
 elsif p_action='check_in' then
  select * into q from public.queue_entries where salon_id=salon and upper(reference)=upper(btrim(p_data->>'reference')) for update;
  if q.id is null or coalesce(q.assigned_barber_id,q.preferred_barber_id,p_barber)<>p_barber then raise exception 'Queue entry is not assigned to you' using errcode='42501';end if;
  if q.status='joined' then update public.queue_entries set status='arrived' where id=q.id;elsif q.status<>'arrived' then raise exception 'Queue entry cannot be checked in';end if;
  result_id:=q.id;
 elsif p_action in ('accept','decline','suggest','appointment_arrived') then
  select * into a from public.appointments where id=entry and salon_id=salon for update;
  select * into bl from bookmyturn_private.barber_schedule_blocks where appointment_id=a.id;
  if a.id is null or coalesce(a.confirmed_barber_id,a.preferred_barber_id,bl.barber_id) is distinct from p_barber then raise exception 'Appointment is not assigned to you' using errcode='42501';end if;
  if p_action='appointment_arrived' then
   if a.status='confirmed' then update public.appointments set status='arrived',arrived_at=now() where id=a.id;elsif a.status<>'arrived' then raise exception 'Appointment is not confirmed';end if;
  elsif p_action='accept' then
   if a.status='confirmed' then return jsonb_build_object('id',a.id);end if;
   if a.status<>'pending' or a.requested_start<=now() or not bl.is_active then raise exception 'Request cannot be accepted';end if;
   update public.appointments set status='confirmed',confirmed_barber_id=p_barber,confirmed_start=bl.starts_at,confirmed_end=bl.ends_at where id=a.id;
  elsif p_action='decline' then
   if a.status not in ('pending','alternative_suggested') then raise exception 'Request cannot be declined';end if;
   update public.appointments set status='declined' where id=a.id;
  else
   if a.status not in ('pending','alternative_suggested') then raise exception 'Request cannot be changed';end if;
   at_time:=(p_data->>'starts_at')::timestamptz;
   update bookmyturn_private.barber_schedule_blocks set is_active=false where appointment_id=a.id;
   select cs.ends_at into end_time from bookmyturn_private.customer_slots(salon,a.service_id,(at_time at time zone 'Asia/Colombo')::date,p_barber) cs where cs.starts_at=at_time and cs.available;
   if end_time is null then raise exception 'Proposed time is unavailable' using errcode='23P01';end if;
   update public.appointments set status='alternative_suggested' where id=a.id;
   insert into public.appointment_proposals(salon_id,appointment_id,barber_id,starts_at,ends_at) values(salon,a.id,p_barber,at_time,end_time) returning id into result_id;
   update bookmyturn_private.barber_schedule_blocks set starts_at=at_time,ends_at=end_time,is_active=true where appointment_id=a.id;
  end if;
  if a.customer_id is not null then insert into public.notifications(user_id,event_key,title,body) values(a.customer_id,a.id||':'||p_action||':'||coalesce(result_id::text,''),'Salon response',case p_action when 'accept' then 'Your appointment is confirmed.' when 'suggest' then 'The salon suggested another time. Please accept it to confirm.' when 'decline' then 'The salon declined your request.' else 'Your appointment arrival is recorded.' end) on conflict(user_id,event_key) do nothing;end if;
 elsif p_action='styles_viewed' then
  update public.style_requests r set viewed_at=now() where r.id=entry and r.salon_id=salon and
   (exists(select 1 from public.queue_entries q where q.id=r.queue_entry_id and coalesce(q.assigned_barber_id,q.preferred_barber_id)=p_barber)
    or exists(select 1 from bookmyturn_private.queue_forecast(salon) f where f.queue_id=r.queue_entry_id and f.barber_id=p_barber)
    or exists(select 1 from public.appointments a join bookmyturn_private.barber_schedule_blocks bl on bl.appointment_id=a.id where a.id=r.appointment_id and bl.barber_id=p_barber));
  if not found then raise exception 'Style request is not assigned to you' using errcode='42501';end if;
 elsif p_action='start' then
  select * into ss from public.service_sessions where salon_id=salon and barber_id=p_barber and (queue_entry_id=entry or appointment_id=entry);
  if ss.id is not null then return jsonb_build_object('id',ss.id);end if;
  if exists(select 1 from public.service_sessions where barber_id=p_barber and status='in_service') then raise exception 'Finish your current service first';end if;
  if not exists(select 1 from public.barber_status where barber_id=p_barber and availability='available') then raise exception 'Set yourself available first';end if;
  select * into q from public.queue_entries where id=entry and salon_id=salon for update;
  select * into a from public.appointments where id=entry and salon_id=salon for update;
  if q.id is not null then
   if q.status<>'arrived' or coalesce(q.preferred_barber_id,p_barber)<>p_barber then raise exception 'Customer must be arrived and assigned to you';end if;
   if not exists(select 1 from bookmyturn_private.queue_forecast(salon) f where f.queue_id=q.id and f.barber_id=p_barber and f.starts_at<=now()+interval '1 second') then raise exception 'This customer is not next for your chair';end if;
   source:=q.source;customer:=q.customer_id;
  elsif a.id is not null then
   if a.status<>'arrived' or a.confirmed_barber_id<>p_barber then raise exception 'Appointment must be arrived and assigned to you';end if;
   source:='appointment';customer:=a.customer_id;
  else raise exception 'Visit not found' using errcode='42501';end if;
  select * into sv from public.services where id=coalesce(q.service_id,a.service_id,(p_data->>'service_id')::uuid) and salon_id=salon and is_active;
  select * into bs from public.barber_services where barber_id=p_barber and service_id=sv.id;
  if bs.service_id is null then raise exception 'Choose a service you offer';end if;
  duration:=coalesce(bs.duration_minutes,sv.duration_minutes);at_time:=clock_timestamp();
  if exists(select 1 from bookmyturn_private.barber_schedule_blocks where barber_id=p_barber and is_active and appointment_id is distinct from a.id and tstzrange(starts_at,ends_at,'[)')&&tstzrange(at_time,at_time+make_interval(mins=>duration),'[)')) then raise exception 'This service would overlap a reserved appointment or break' using errcode='23P01';end if;
  select * into rule from bookmyturn_private.commission_rules where salon_id=salon and is_enabled and source=any(eligible_sources) and valid_from<=at_time and (valid_until is null or valid_until>at_time);
  lo:=coalesce(bs.price_min_minor,sv.price_min_minor)+coalesce(rule.surcharge_minor,0);hi:=coalesce(bs.price_max_minor,sv.price_max_minor)+coalesce(rule.surcharge_minor,0);amount:=(p_data->>'agreed_price_minor')::bigint;
  if amount is null or amount<0 or not coalesce((p_data->>'price_agreed')::boolean,false) then raise exception 'Confirm the customer agreed to the price';end if;
  if amount not between lo and hi and nullif(btrim(p_data->>'price_reason'),'') is null then raise exception 'Explain a price outside the estimated range';end if;
  if rule.id is not null and not coalesce((p_data->>'commission_agreed')::boolean,false) then raise exception 'Confirm the disclosed commission with the customer';end if;
  if q.id is not null then update public.queue_entries set service_id=sv.id where id=q.id;end if;
  insert into public.service_sessions(salon_id,barber_id,customer_id,queue_entry_id,appointment_id,service_id,source,service_name_snapshot,duration_minutes_snapshot,price_min_minor_snapshot,price_max_minor_snapshot,agreed_price_minor,price_agreed_at,price_exception_reason,commission_rule_id,commission_surcharge_minor,commission_salon_minor,commission_platform_minor,commission_disclosure_snapshot,commission_agreed_at)
   values(salon,p_barber,customer,q.id,a.id,sv.id,source,sv.name,duration,lo,hi,amount,at_time,nullif(p_data->>'price_reason',''),rule.id,coalesce(rule.surcharge_minor,0),coalesce(rule.salon_share_minor,0),coalesce(rule.platform_share_minor,0),rule.disclosure,case when rule.id is not null then at_time end) returning id into result_id;
  insert into public.service_items(salon_id,service_session_id,description,kind,amount_minor) values(salon,result_id,sv.name,'base',amount);
 elsif p_action='finish' then
  select * into ss from public.service_sessions where id=entry and barber_id=p_barber for update;
  if ss.id is null then raise exception 'Service is not assigned to you' using errcode='42501';end if;
  if ss.status='completed' then return jsonb_build_object('id',ss.id);end if;
  if ss.status<>'in_service' then raise exception 'Service is not in progress';end if;
  amount:=(p_data->>'final_amount_minor')::bigint;
  if amount is null or amount<0 or not coalesce((p_data->>'final_agreed')::boolean,false) then raise exception 'Confirm the customer agreed to the final amount';end if;
  if jsonb_typeof(coalesce(p_data->'extras','[]'))<>'array' or jsonb_array_length(coalesce(p_data->'extras','[]'))>10 then raise exception 'Check extra service items';end if;
  for extra in select * from jsonb_array_elements(coalesce(p_data->'extras','[]')) loop
   if char_length(btrim(extra->>'description')) not between 1 and 100 or (extra->>'amount_minor')::bigint<=0 then raise exception 'Check extra service items';end if;
   extras_total:=extras_total+(extra->>'amount_minor')::bigint;
  end loop;
  if extras_total>amount then raise exception 'Extras exceed the final amount';end if;
  delete from public.service_items where service_session_id=ss.id;
  insert into public.service_items(salon_id,service_session_id,description,kind,amount_minor) values(salon,ss.id,ss.service_name_snapshot,'base',amount-extras_total);
  for extra in select * from jsonb_array_elements(coalesce(p_data->'extras','[]')) loop
   insert into public.service_items(salon_id,service_session_id,description,kind,amount_minor) values(salon,ss.id,extra->>'description','extra',(extra->>'amount_minor')::bigint);
  end loop;
  at_time:=clock_timestamp();
  update public.service_sessions set status='completed',completed_at=at_time,final_amount_minor=amount,final_amount_agreed_at=at_time,final_price_reason=nullif(btrim(p_data->>'price_reason'),''),payment_method=nullif(p_data->>'payment_method','') where id=ss.id;
  result_id:=ss.id;
 else raise exception 'Unknown barber action';end if;
 return jsonb_build_object('id',coalesce(result_id,entry,p_barber));
end;$$;
create function public.barber_command(p_barber uuid,p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select bookmyturn_private.barber_command(p_barber,p_action,p_data);$$;
do $$declare r record;begin
 for r in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','bookmyturn_private') and p.proname in ('is_my_barber','barber_context','setup_salon','barber_state','barber_command') loop
 execute format('revoke all on function %s from public,anon,authenticated',r.sig);execute format('grant execute on function %s to authenticated',r.sig);end loop;
end;$$;
notify pgrst,'reload schema';
commit;
