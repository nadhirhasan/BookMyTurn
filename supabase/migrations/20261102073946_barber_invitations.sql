begin;

create table bookmyturn_private.barber_invitations (
 id uuid primary key,
 salon_id uuid not null references public.salons on delete cascade,
 barber_id uuid not null,
 token_hash bytea not null unique check(octet_length(token_hash)=32),
 created_by uuid references auth.users on delete set null,
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default clock_timestamp()+interval '7 days',
 accepted_at timestamptz,
 accepted_by uuid references auth.users on delete set null,
 revoked_at timestamptz,
 foreign key(salon_id,barber_id) references public.barbers(salon_id,id) on delete cascade,
 check(expires_at>created_at)
);
alter table bookmyturn_private.barber_invitations enable row level security;
revoke all on bookmyturn_private.barber_invitations from public,anon,authenticated;
create index barber_invitations_salon on bookmyturn_private.barber_invitations(salon_id,created_at desc);
create index barber_invitations_chair on bookmyturn_private.barber_invitations(salon_id,barber_id);
create index barber_invitations_creator on bookmyturn_private.barber_invitations(created_by);
create index barber_invitations_recipient on bookmyturn_private.barber_invitations(accepted_by);
create unique index barber_invitation_pending on bookmyturn_private.barber_invitations(barber_id)
 where accepted_at is null and revoked_at is null;

-- Owner-only state never returns invitation secrets or hashes.
create function bookmyturn_private.barber_team(p_salon uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not bookmyturn_private.owns_salon(p_salon) then raise exception 'Owner access required' using errcode='42501';end if;
 return jsonb_build_object('observed_at',clock_timestamp(),'members',coalesce((
 select jsonb_agg(jsonb_build_object('barber_id',b.id,'connected',coalesce(m.is_active and m.user_id is not null,false),
 'account_email',case when m.is_active then u.email end,
 'invitation',case when i.id is not null then jsonb_build_object('id',i.id,'expires_at',i.expires_at,
 'status',case when i.revoked_at is not null then 'cancelled' when i.accepted_at is not null then 'accepted'
 when i.expires_at<=clock_timestamp() then 'expired' else 'pending' end) end)order by b.created_at)
 from public.barbers b left join bookmyturn_private.salon_memberships m on m.barber_id=b.id and m.role='barber'
 left join auth.users u on u.id=m.user_id
 left join lateral(select * from bookmyturn_private.barber_invitations x where x.barber_id=b.id order by x.created_at desc,x.id limit 1)i on true
 where b.salon_id=p_salon),'[]'));
end;$$;
create function public.barber_team(p_salon uuid) returns jsonb
language sql stable security invoker set search_path='' as $$select bookmyturn_private.barber_team(p_salon);$$;

create function bookmyturn_private.barber_invitation(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();salon uuid;chair uuid;entry uuid;secret text:=p_data->>'token';
 invite bookmyturn_private.barber_invitations;member bookmyturn_private.salon_memberships;
begin
 if u is null then raise exception 'Sign in to use an invitation' using errcode='42501';end if;
 if p_action in('preview','accept')then
  if secret is null or secret!~'^[a-f0-9]{64}$'then raise exception 'Invitation unavailable or expired';end if;
  select * into invite from bookmyturn_private.barber_invitations where token_hash=sha256(convert_to(secret,'UTF8'));
  if invite.id is null then raise exception 'Invitation unavailable or expired';end if;
  salon:=invite.salon_id;chair:=invite.barber_id;
 else
  salon:=(p_data->>'salon_id')::uuid;chair:=(p_data->>'barber_id')::uuid;
 end if;
 -- Match operational write lock order; recheck membership after serializing.
 perform pg_advisory_xact_lock(hashtextextended(salon::text,0));
 if p_action in('preview','accept')then
  select * into invite from bookmyturn_private.barber_invitations where id=invite.id for update;
  perform 1 from bookmyturn_private.salon_memberships where salon_id=salon and user_id=invite.created_by and role='owner'and is_active for share;
  if not found then raise exception 'Invitation unavailable or expired';end if;
  if invite.revoked_at is not null or not exists(select 1 from public.barbers b join public.salons s on s.id=b.salon_id
   where b.id=chair and b.salon_id=salon and b.is_active and b.archived_at is null and s.archived_at is null)
   or not exists(select 1 from bookmyturn_private.salon_memberships where salon_id=salon and user_id=invite.created_by and role='owner' and is_active)
   then raise exception 'Invitation unavailable or expired';end if;
  if invite.accepted_at is not null then
   if invite.accepted_by is distinct from u or not exists(select 1 from bookmyturn_private.salon_memberships where salon_id=salon and barber_id=chair and user_id=u and role='barber'and is_active)
    then raise exception 'Invitation unavailable or expired';end if;
  elsif invite.expires_at<=clock_timestamp()then raise exception 'Invitation unavailable or expired';end if;
  if p_action='accept'and invite.accepted_at is null then
   if exists(select 1 from bookmyturn_private.salon_memberships where salon_id=salon and user_id=u and(role<>'barber'or is_active and barber_id is distinct from chair))
    then raise exception 'This account already belongs to this salon';end if;
   select * into member from bookmyturn_private.salon_memberships where salon_id=salon and barber_id=chair for update;
   if member.is_active and member.user_id is not null and member.user_id<>u then raise exception 'This barber already has an account';end if;
   -- A previously revoked barber may accept a different chair in this salon.
   update bookmyturn_private.salon_memberships set user_id=null where salon_id=salon and user_id=u and role='barber'and not is_active and barber_id is distinct from chair;
   if member.id is null then
    insert into bookmyturn_private.salon_memberships(salon_id,user_id,role,barber_id,permissions)values(salon,u,'barber',chair,'{}');
   else
    update bookmyturn_private.salon_memberships set user_id=u,is_active=true,permissions='{}'where id=member.id;
   end if;
   update bookmyturn_private.barber_invitations set accepted_at=clock_timestamp(),accepted_by=u where id=invite.id;
  end if;
  return jsonb_build_object('id',invite.id,'salon_id',salon,'barber_id',chair,'salon_name',(select name from public.salons where id=salon),
   'barber_name',(select display_name from public.barbers where id=chair),'accepted',invite.accepted_at is not null or p_action='accept','expires_at',invite.expires_at);
 end if;
 if not bookmyturn_private.owns_salon(salon)then raise exception 'Owner access required'using errcode='42501';end if;
 perform 1 from bookmyturn_private.salon_memberships where salon_id=salon and user_id=u and role='owner'and is_active for share;
 if not found then raise exception 'Owner access required'using errcode='42501';end if;
 if not exists(select 1 from public.barbers b join public.salons s on s.id=b.salon_id where b.id=chair and b.salon_id=salon and b.archived_at is null and s.archived_at is null)then raise exception 'Barber unavailable';end if;
 if p_action='create'then
  entry:=(p_data->>'id')::uuid;
  if entry is null or secret is null or secret!~'^[a-f0-9]{64}$'then raise exception 'Check invitation details';end if;
  select * into invite from bookmyturn_private.barber_invitations where id=entry;
  if invite.id is not null then
   if invite.salon_id<>salon or invite.barber_id<>chair or invite.created_by is distinct from u or invite.token_hash<>sha256(convert_to(secret,'UTF8'))then raise exception 'Check invitation details';end if;
   if invite.revoked_at is not null or invite.accepted_at is not null or invite.expires_at<=clock_timestamp()then raise exception 'Invitation unavailable or expired';end if;
   return jsonb_build_object('id',invite.id,'expires_at',invite.expires_at);
  end if;
  if not exists(select 1 from public.barbers where id=chair and is_active)then raise exception 'Activate this barber before inviting';end if;
  if exists(select 1 from bookmyturn_private.salon_memberships where salon_id=salon and barber_id=chair and user_id is not null and is_active)then raise exception 'This barber already has an account';end if;
  update bookmyturn_private.barber_invitations set revoked_at=clock_timestamp()where barber_id=chair and accepted_at is null and revoked_at is null;
  insert into bookmyturn_private.barber_invitations(id,salon_id,barber_id,token_hash,created_by)values(entry,salon,chair,sha256(convert_to(secret,'UTF8')),u)returning * into invite;
  return jsonb_build_object('id',entry,'expires_at',invite.expires_at);
 elsif p_action='cancel'then
  update bookmyturn_private.barber_invitations set revoked_at=coalesce(revoked_at,clock_timestamp())where id=(p_data->>'id')::uuid and salon_id=salon and barber_id=chair and accepted_at is null;
 elsif p_action='revoke'then
  update bookmyturn_private.salon_memberships set is_active=false,permissions='{}'where salon_id=salon and barber_id=chair and role='barber';
  update bookmyturn_private.barber_invitations set revoked_at=coalesce(revoked_at,clock_timestamp())where barber_id=chair and revoked_at is null;
 else raise exception 'Unknown invitation action';end if;
 return jsonb_build_object('id',chair);
end;$$;
create function public.barber_invitation(p_action text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select bookmyturn_private.barber_invitation(p_action,p_data);$$;

-- Financial history is separate from chair operations, even through direct SQL.
drop policy sale_read on bookmyturn_private.sales;
create policy sale_read on bookmyturn_private.sales for select to authenticated using(bookmyturn_private.has_permission(salon_id,'read_finance'));
drop policy session_read on public.service_sessions;
create policy session_read on public.service_sessions for select to authenticated using
 (customer_id=(select auth.uid())or bookmyturn_private.has_permission(salon_id,'read_finance'));
-- Existing service_items policy inherits the restricted session visibility.

alter function bookmyturn_private.barber_state(uuid)rename to barber_state_with_finance;
create function bookmyturn_private.barber_state(p_barber uuid)returns jsonb
language plpgsql security definer set search_path=''as $$
declare state jsonb;salon uuid;sessions jsonb;
begin
 state:=bookmyturn_private.barber_state_with_finance(p_barber);
 salon:=(state->'salon'->>'id')::uuid;
 if bookmyturn_private.has_permission(salon,'read_finance')then return state||jsonb_build_object('can_read_finance',true);end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s->'id','queue_entry_id',s->'queue_entry_id','appointment_id',s->'appointment_id',
 'service_id',s->'service_id','status',s->'status','started_at',s->'started_at','completed_at',s->'completed_at',
 'service_name_snapshot',s->'service_name_snapshot','duration_minutes_snapshot',s->'duration_minutes_snapshot')order by s->>'started_at' desc),'[]')into sessions
 from jsonb_array_elements(state->'sessions')s;
 return state||jsonb_build_object('can_read_finance',false,'sessions',sessions,'commission_rules','[]'::jsonb,
 'performance',jsonb_build_object('today_count',state->'performance'->'today_count','total_count',state->'performance'->'total_count'),
 'services',(select coalesce(jsonb_agg(s-'price_min_minor'-'price_max_minor'),'[]')from jsonb_array_elements(state->'services')s));
end;$$;
create or replace function public.barber_state(p_barber uuid)returns jsonb
language sql security invoker set search_path=''as $$select bookmyturn_private.barber_state(p_barber);$$;

-- Earlier privileged state helpers are internal, not alternate finance APIs.
revoke execute on function bookmyturn_private.barber_state_with_finance(uuid),bookmyturn_private.barber_state_pre_haircuts(uuid) from public,anon,authenticated;
revoke all on function public.barber_team(uuid),public.barber_invitation(text,jsonb),bookmyturn_private.barber_team(uuid),bookmyturn_private.barber_invitation(text,jsonb),bookmyturn_private.barber_state(uuid) from public,anon,authenticated;
grant execute on function public.barber_team(uuid),public.barber_invitation(text,jsonb),bookmyturn_private.barber_team(uuid),bookmyturn_private.barber_invitation(text,jsonb),bookmyturn_private.barber_state(uuid) to authenticated;

-- Membership and invitation changes retain an audit trail without secret hashes.
create function bookmyturn_private.audit_barber_access() returns trigger
language plpgsql security definer set search_path=''as $$
begin
 insert into bookmyturn_private.audit_events(salon_id,actor_id,entity_type,entity_id,operation,changes)
 values(new.salon_id,auth.uid(),tg_table_name,new.id::text,tg_op,
 jsonb_build_object('barber_id',new.barber_id,'action',case when tg_table_name='barber_invitations'then 'invitation_changed'else 'membership_changed'end));
 return new;
end;$$;
revoke all on function bookmyturn_private.audit_barber_access()from public,anon,authenticated;
create trigger audit_barber_invitation after insert or update on bookmyturn_private.barber_invitations for each row execute function bookmyturn_private.audit_barber_access();
-- salon_memberships already has the domain audit trigger.
commit;
