begin;
-- Public QR visitors are not Supabase Auth users. A private device receipt only
-- permits tracking/cancelling the entry created by that browser. Never expose
-- an anonymous customer list or trust a queue id as proof of ownership.
create table bookmyturn_private.qr_receipts (
 token_hash bytea primary key, salon_id uuid not null references public.salons,
 queue_entry_id uuid not null references public.queue_entries on delete cascade,
 request_key uuid not null, created_at timestamptz not null default now(),
 unique(salon_id,request_key)
);
alter table bookmyturn_private.qr_receipts enable row level security;
revoke all on bookmyturn_private.qr_receipts from public,anon,authenticated;
grant all on bookmyturn_private.qr_receipts to service_role;
create policy service_receipts on bookmyturn_private.qr_receipts for all to service_role using(true) with check(true);
create function bookmyturn_private.qr_visit(p_action text,p_slug text,p_token text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare salon uuid; q public.queue_entries; digest bytea; service uuid; barber uuid; request_id uuid; u uuid:=auth.uid(); at_time timestamptz;
begin
 if p_token is null or p_token !~ '^[0-9a-f-]{36}:[0-9a-f-]{36}$' then raise exception 'Invalid visit receipt' using errcode='42501'; end if;
 digest:=sha256(convert_to(p_token,'UTF8'));
 select id into salon from public.salons where slug=p_slug and is_published;
 if salon is null then raise exception 'Salon unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
 select qe.* into q from bookmyturn_private.qr_receipts r join public.queue_entries qe on qe.id=r.queue_entry_id
  where r.token_hash=digest and r.salon_id=salon;
 if p_action='join' and q.id is null then
  request_id:=(p_data->>'request_key')::uuid; service:=(p_data->>'service_id')::uuid;barber:=(p_data->>'barber_id')::uuid;
  if request_id is null then raise exception 'Request key required'; end if;
  if not exists(select 1 from public.salons s where s.id=salon and s.is_open and exists(select 1 from public.barbers b
    cross join lateral bookmyturn_private.work_window(salon,b.id,(now() at time zone s.timezone)::date) w where b.salon_id=salon and now()>=w.opens and now()<w.closes)) then raise exception 'Salon is closed'; end if;
  if service is not null and not exists(select 1 from public.services where id=service and salon_id=salon and is_active) then raise exception 'Service unavailable'; end if;
  if not exists(select 1 from bookmyturn_private.queue_estimate(salon,service,barber)) then raise exception 'No queue capacity today'; end if;
  if u is not null then select * into q from public.queue_entries where salon_id=salon and customer_id=u and status in ('joined','arrived','in_service'); end if;
  if q.id is null then
   insert into public.queue_entries(salon_id,customer_id,source,status,service_id,preferred_barber_id,customer_name,mobile,request_key)
    values(salon,u,'qr','arrived',service,barber,nullif(btrim(p_data->>'customer_name'),''),nullif(btrim(p_data->>'mobile'),''),request_id) returning * into q;
  elsif q.status='joined' then
   update public.queue_entries set status='arrived' where id=q.id returning * into q;
  end if;
  insert into bookmyturn_private.qr_receipts(token_hash,salon_id,queue_entry_id,request_key) values(digest,salon,q.id,request_id);
 elsif q.id is null then
  return null;
 elsif p_action='cancel' then
  if q.status not in ('joined','arrived','cancelled') then raise exception 'Service already started'; end if;
  update public.queue_entries set status='cancelled' where id=q.id and status<>'cancelled' returning * into q;
 elsif p_action='link' then
  if u is null or q.customer_id is not null and q.customer_id<>u then raise exception 'Cannot link this visit' using errcode='42501'; end if;
  if q.status not in ('joined','arrived') then raise exception 'This visit cannot be linked'; end if;
  update public.queue_entries set customer_id=u where id=q.id returning * into q;
 elsif p_action not in ('read','join') then raise exception 'Unknown QR action';
 end if;
 if q.status='arrived' then select starts_at into at_time from bookmyturn_private.queue_forecast(salon) f where f.queue_id=q.id; end if;
 return jsonb_build_object('id',q.id,'salon_id',q.salon_id,'reference',q.reference,'preferred_barber_id',q.preferred_barber_id,
  'assigned_barber_id',q.assigned_barber_id,'service_id',q.service_id,'source',q.source,'status',q.status,
  'created_at',q.created_at,'estimated_start',at_time,'linked_to_account',q.customer_id is not null);
end; $$;
create function public.qr_visit(p_action text,p_slug text,p_token text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select bookmyturn_private.qr_visit(p_action,p_slug,p_token,p_data);$$;
revoke all on function bookmyturn_private.qr_visit(text,text,text,jsonb),public.qr_visit(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function bookmyturn_private.qr_visit(text,text,text,jsonb),public.qr_visit(text,text,text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
commit;
