-- Full shared schema. See docs/DATABASE_PLAN.md. No client business-write APIs yet.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  address text, locality text not null default 'Akurana' check (locality = 'Akurana'),
  country_code text not null default 'LK' check (country_code = 'LK'),
  timezone text not null default 'Asia/Colombo' check (timezone = 'Asia/Colombo'),
  currency text not null default 'LKR' check (currency = 'LKR'),
  is_demo boolean not null default true check (is_demo),
  is_published boolean not null default false,
  is_open boolean not null default false,
  photo_url text, photo_attribution text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.salon_hours (
  salon_id uuid not null references public.salons on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null, closes_at time not null check (closes_at > opens_at),
  primary key (salon_id, weekday)
);
create table public.salon_date_exceptions (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons on delete cascade,
  local_date date not null, is_closed boolean not null, opens_at time, closes_at time,
  unique (salon_id, local_date),
  check ((is_closed and opens_at is null and closes_at is null) or
    (not is_closed and opens_at is not null and closes_at is not null and closes_at > opens_at))
);
create table bookmyturn_private.salon_policies (
  salon_id uuid primary key references public.salons on delete cascade,
  default_service_minutes integer not null default 30 check (default_service_minutes between 1 and 480),
  arrival_grace_minutes integer check (arrival_grace_minutes >= 0),
  no_show_after_minutes integer check (no_show_after_minutes >= 0),
  cancellation_notice_minutes integer check (cancellation_notice_minutes >= 0),
  forecast_horizon_days integer check (forecast_horizon_days between 1 and 90)
);
create table public.barbers (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  bio text check (char_length(bio) <= 2000), experience_years smallint check (experience_years between 0 and 80),
  specialities text[] not null default '{}', photo_url text, photo_attribution text,
  is_active boolean not null default true, is_published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (salon_id, id)
);
create table bookmyturn_private.salon_memberships (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  user_id uuid references auth.users on delete set null,
  role text not null check (role in ('owner','barber','coordinator')),
  barber_id uuid, is_active boolean not null default true,
  permissions text[] not null default '{}' check (permissions <@ array[
    'read_operations','manage_appointments','manage_catalog','read_finance','manage_finance','read_audit']::text[]),
  created_at timestamptz not null default now(), unique (salon_id, user_id), unique (salon_id, barber_id),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id),
  check (role <> 'barber' or barber_id is not null)
);
create table public.barber_hours (
  salon_id uuid not null, barber_id uuid not null, weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null, ends_at time not null check (ends_at > starts_at),
  primary key (barber_id, weekday), foreign key (salon_id, barber_id) references public.barbers (salon_id, id)
);
create table public.barber_status (
  salon_id uuid not null, barber_id uuid primary key,
  availability text not null default 'off_duty' check (availability in ('available','on_break','off_duty')),
  observed_at timestamptz not null default now(),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id)
);
create table public.services (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  price_min_minor bigint not null check (price_min_minor >= 0),
  price_max_minor bigint not null check (price_max_minor >= price_min_minor),
  duration_minutes integer not null check (duration_minutes between 1 and 480),
  is_active boolean not null default true, unique (salon_id, id), unique (salon_id, name)
);
create table public.barber_services (
  salon_id uuid not null, barber_id uuid not null, service_id uuid not null,
  price_min_minor bigint check (price_min_minor >= 0), price_max_minor bigint,
  duration_minutes integer check (duration_minutes between 1 and 480),
  primary key (barber_id, service_id),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id),
  foreign key (salon_id, service_id) references public.services (salon_id, id),
  check ((price_min_minor is null and price_max_minor is null) or
    (price_min_minor is not null and price_max_minor is not null and price_max_minor >= price_min_minor))
);
create sequence bookmyturn_private.arrival_sequence;
create table public.queue_entries (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  reference text not null unique default ('BMT-' || gen_random_uuid()::text),
  request_key uuid not null default gen_random_uuid(), unique (salon_id,request_key),
  customer_id uuid references auth.users on delete set null,
  source text not null check (source in ('remote','qr','walk_in')),
  service_id uuid, preferred_barber_id uuid, assigned_barber_id uuid,
  customer_name text check (char_length(customer_name) <= 80), mobile text check (char_length(mobile) <= 32),
  note text check (char_length(note) <= 2000), preference_change_reason text,
  status text not null default 'joined' check (status in ('joined','arrived','in_service','completed','cancelled','no_show')),
  created_at timestamptz not null default now(), arrived_at timestamptz, arrival_sequence bigint unique,
  started_at timestamptz, completed_at timestamptz,
  unique (salon_id, id),
  foreign key (salon_id, service_id) references public.services (salon_id, id),
  foreign key (salon_id, preferred_barber_id) references public.barbers (salon_id, id),
  foreign key (salon_id, assigned_barber_id) references public.barbers (salon_id, id),
  check (preferred_barber_id is null or assigned_barber_id is null or preferred_barber_id = assigned_barber_id),
  check ((arrived_at is null) = (arrival_sequence is null)),
  check (status <> 'joined' or (arrived_at is null and started_at is null)),
  check (status not in ('arrived','in_service','completed') or arrived_at is not null),
  check (status not in ('in_service','completed') or (started_at is not null and assigned_barber_id is not null)),
  check (status <> 'completed' or completed_at is not null),
  check (started_at is null or started_at >= arrived_at),
  check (completed_at is null or completed_at >= started_at)
);
create unique index queue_one_active_customer on public.queue_entries (salon_id, customer_id)
  where customer_id is not null and status in ('joined','arrived','in_service');
create index queue_waiting_order on public.queue_entries (salon_id, assigned_barber_id, arrival_sequence) where status = 'arrived';

create table public.appointments (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  reference text not null unique default ('BMA-' || gen_random_uuid()::text),
  request_key uuid not null default gen_random_uuid(), unique (salon_id,request_key),
  customer_id uuid references auth.users on delete set null,
  service_id uuid not null, preferred_barber_id uuid,
  requested_start timestamptz not null, requested_duration_minutes integer not null check (requested_duration_minutes between 1 and 480),
  customer_name text check (char_length(customer_name) <= 80), mobile text check (char_length(mobile) <= 32),
  status text not null default 'pending' check (status in ('pending','alternative_suggested','confirmed','arrived','in_service','completed','declined','cancelled','no_show')),
  confirmed_barber_id uuid, confirmed_start timestamptz, confirmed_end timestamptz, accepted_proposal_id uuid,
  created_at timestamptz not null default now(), arrived_at timestamptz, completed_at timestamptz,
  unique (salon_id, id),
  foreign key (salon_id, service_id) references public.services (salon_id, id),
  foreign key (salon_id, preferred_barber_id) references public.barbers (salon_id, id),
  foreign key (salon_id, confirmed_barber_id) references public.barbers (salon_id, id),
  check (confirmed_end is null or confirmed_end > confirmed_start),
  check (status not in ('confirmed','arrived','in_service','completed') or
    (confirmed_barber_id is not null and confirmed_start is not null and confirmed_end is not null)),
  check (status not in ('arrived','in_service','completed') or arrived_at is not null),
  check (status <> 'completed' or completed_at is not null)
);
create index appointments_calendar on public.appointments (salon_id, confirmed_barber_id, confirmed_start);
create table public.appointment_proposals (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, appointment_id uuid not null,
  barber_id uuid not null, starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  suggested_at timestamptz not null default now(), accepted_at timestamptz,
  accepted_by uuid references auth.users on delete set null,
  foreign key (salon_id, appointment_id) references public.appointments (salon_id, id),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id), unique (salon_id, appointment_id, id)
);
alter table public.appointments add foreign key (salon_id, id, accepted_proposal_id)
  references public.appointment_proposals (salon_id, appointment_id, id);
create table bookmyturn_private.barber_schedule_blocks (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, barber_id uuid not null,
  kind text not null check (kind in ('appointment','break','unavailable')),
  appointment_id uuid unique, starts_at timestamptz not null, ends_at timestamptz not null,
  is_active boolean not null default true, check (ends_at > starts_at),
  check ((kind = 'appointment') = (appointment_id is not null)),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id),
  foreign key (salon_id, appointment_id) references public.appointments (salon_id, id),
  exclude using gist (barber_id extensions.gist_uuid_ops with =, tstzrange(starts_at, ends_at, '[)') with &&) where (is_active)
);

create table public.hairstyle_categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null unique
);
create table public.hairstyles (
  id uuid primary key default gen_random_uuid(), category_id uuid not null references public.hairstyle_categories,
  title text not null, image_url text not null, attribution text not null, is_published boolean not null default false
);
create table public.style_requests (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, customer_id uuid references auth.users on delete set null,
  queue_entry_id uuid unique, appointment_id uuid unique,
  note text check (char_length(note) <= 2000), revision integer not null default 1 check (revision > 0),
  submitted_at timestamptz not null default now(), viewed_at timestamptz,
  unique (salon_id, id), check (num_nonnulls(queue_entry_id, appointment_id) = 1),
  foreign key (salon_id, queue_entry_id) references public.queue_entries (salon_id, id),
  foreign key (salon_id, appointment_id) references public.appointments (salon_id, id)
);
create table public.style_request_items (
  salon_id uuid not null, style_request_id uuid not null, hairstyle_id uuid not null references public.hairstyles,
  primary key (style_request_id, hairstyle_id),
  foreign key (salon_id, style_request_id) references public.style_requests (salon_id, id)
);
create table bookmyturn_private.commission_rules (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  valid_from timestamptz not null, valid_until timestamptz,
  eligible_sources text[] not null default '{}' check (eligible_sources <@ array['remote','qr','walk_in','appointment']::text[]),
  surcharge_minor bigint not null check (surcharge_minor >= 0),
  salon_share_minor bigint not null check (salon_share_minor >= 0),
  platform_share_minor bigint not null check (platform_share_minor >= 0),
  disclosure text not null check (char_length(btrim(disclosure)) > 0), is_enabled boolean not null default false,
  check (surcharge_minor = salon_share_minor + platform_share_minor),
  check (valid_until is null or valid_until > valid_from), unique (salon_id, id),
  exclude using gist (salon_id extensions.gist_uuid_ops with =,
    tstzrange(valid_from, valid_until, '[)') with &&) where (is_enabled)
);
create table public.service_sessions (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, barber_id uuid not null,
  customer_id uuid references auth.users on delete set null,
  queue_entry_id uuid unique, appointment_id uuid unique, service_id uuid not null,
  source text not null check (source in ('remote','qr','walk_in','appointment')),
  service_name_snapshot text not null, duration_minutes_snapshot integer not null check (duration_minutes_snapshot between 1 and 480),
  price_min_minor_snapshot bigint not null check (price_min_minor_snapshot >= 0),
  price_max_minor_snapshot bigint not null check (price_max_minor_snapshot >= price_min_minor_snapshot),
  agreed_price_minor bigint not null check (agreed_price_minor >= 0), price_agreed_at timestamptz not null,
  price_exception_reason text,
  commission_rule_id uuid, commission_surcharge_minor bigint not null default 0 check (commission_surcharge_minor >= 0),
  commission_salon_minor bigint not null default 0 check (commission_salon_minor >= 0),
  commission_platform_minor bigint not null default 0 check (commission_platform_minor >= 0),
  commission_disclosure_snapshot text, commission_agreed_at timestamptz,
  status text not null default 'in_service' check (status in ('in_service','completed','cancelled')),
  started_at timestamptz not null default clock_timestamp(), completed_at timestamptz,
  final_amount_minor bigint check (final_amount_minor >= 0), final_amount_agreed_at timestamptz,
  final_price_reason text, payment_method text,
  unique (salon_id, id), check (num_nonnulls(queue_entry_id, appointment_id) = 1),
  check ((source = 'appointment') = (appointment_id is not null)),
  check (price_agreed_at <= started_at),
  check (agreed_price_minor between price_min_minor_snapshot and price_max_minor_snapshot or nullif(btrim(price_exception_reason),'') is not null),
  check (commission_surcharge_minor = commission_salon_minor + commission_platform_minor),
  check ((commission_rule_id is null and commission_surcharge_minor = 0) or
    (commission_rule_id is not null and commission_agreed_at is not null and commission_agreed_at <= started_at
      and nullif(btrim(commission_disclosure_snapshot),'') is not null)),
  check (status <> 'completed' or (completed_at is not null and completed_at >= started_at and final_amount_minor is not null
    and final_amount_agreed_at is not null)),
  check (final_amount_minor is null or final_amount_minor between price_min_minor_snapshot and price_max_minor_snapshot
    or nullif(btrim(final_price_reason),'') is not null),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id),
  foreign key (salon_id, service_id) references public.services (salon_id, id),
  foreign key (salon_id, queue_entry_id) references public.queue_entries (salon_id, id),
  foreign key (salon_id, appointment_id) references public.appointments (salon_id, id),
  foreign key (salon_id, commission_rule_id) references bookmyturn_private.commission_rules (salon_id, id)
);
create unique index service_one_active_barber on public.service_sessions (barber_id) where status = 'in_service';
create table public.service_items (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, service_session_id uuid not null,
  description text not null, kind text not null check (kind in ('base','extra')), amount_minor bigint not null check (amount_minor >= 0),
  foreign key (salon_id, service_session_id) references public.service_sessions (salon_id, id)
);
create unique index service_one_base_item on public.service_items (service_session_id) where kind = 'base';
create table bookmyturn_private.sales (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, service_session_id uuid not null unique,
  amount_minor bigint not null check (amount_minor >= 0), recorded_at timestamptz not null,
  payment_method text, unique (salon_id, id),
  foreign key (salon_id, service_session_id) references public.service_sessions (salon_id, id)
);
create table bookmyturn_private.sale_adjustments (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, sale_id uuid not null,
  delta_minor bigint not null check (delta_minor <> 0), reason text not null check (char_length(btrim(reason)) > 0),
  actor_id uuid references auth.users on delete set null, created_at timestamptz not null default now(),
  foreign key (salon_id, sale_id) references bookmyturn_private.sales (salon_id, id)
);
create table bookmyturn_private.commission_accruals (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, sale_id uuid not null unique,
  rule_id uuid not null, surcharge_minor bigint not null check (surcharge_minor >= 0),
  salon_share_minor bigint not null check (salon_share_minor >= 0),
  platform_share_minor bigint not null check (platform_share_minor >= 0),
  accrued_at timestamptz not null, unique (salon_id, id),
  check (surcharge_minor = salon_share_minor + platform_share_minor),
  foreign key (salon_id, sale_id) references bookmyturn_private.sales (salon_id, id),
  foreign key (salon_id, rule_id) references bookmyturn_private.commission_rules (salon_id, id)
);
create table bookmyturn_private.commission_payments (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  amount_minor bigint not null check (amount_minor > 0), paid_at timestamptz not null,
  method text, external_reference text, unique (salon_id, id)
);
create table bookmyturn_private.commission_payment_allocations (
  salon_id uuid not null, payment_id uuid not null, accrual_id uuid not null,
  amount_minor bigint not null check (amount_minor > 0), primary key (payment_id, accrual_id),
  foreign key (salon_id, payment_id) references bookmyturn_private.commission_payments (salon_id, id),
  foreign key (salon_id, accrual_id) references bookmyturn_private.commission_accruals (salon_id, id)
);
create table bookmyturn_private.expense_categories (
  code text primary key, name text not null unique
);
create table bookmyturn_private.recurring_expenses (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  category_code text not null references bookmyturn_private.expense_categories,
  description text not null, amount_minor bigint not null check (amount_minor > 0),
  day_of_month smallint not null check (day_of_month between 1 and 31), is_active boolean not null default true,
  unique (salon_id, id)
);
create table bookmyturn_private.expenses (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons,
  category_code text not null references bookmyturn_private.expense_categories,
  recurring_expense_id uuid, due_on date not null,
  kind text not null default 'operating' check (kind in ('operating','capital')),
  description text not null, amount_minor bigint not null check (amount_minor > 0),
  status text not null default 'expected' check (status in ('expected','paid','cancelled')),
  paid_at timestamptz, payment_method text, note text,
  check ((status = 'paid') = (paid_at is not null)),
  foreign key (salon_id, recurring_expense_id) references bookmyturn_private.recurring_expenses (salon_id, id),
  unique (recurring_expense_id, due_on)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, barber_id uuid not null,
  service_session_id uuid not null unique, customer_id uuid references auth.users on delete set null,
  rating smallint not null check (rating between 1 and 5), body text check (char_length(body) <= 2000),
  publish_consent boolean not null check (publish_consent),
  publication_status text not null default 'published' check (publication_status in ('published','hidden')),
  created_at timestamptz not null default now(), unique (salon_id, id),
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id),
  foreign key (salon_id, service_session_id) references public.service_sessions (salon_id, id)
);
create table public.published_reviews (
  id uuid primary key references public.reviews on delete cascade,
  salon_id uuid not null, barber_id uuid not null, rating smallint not null check (rating between 1 and 5),
  body text, created_at timestamptz not null,
  foreign key (salon_id, barber_id) references public.barbers (salon_id, id)
);
create table public.review_reports (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null, review_id uuid not null,
  reported_by uuid references auth.users on delete set null,
  reason text not null, status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(), resolved_at timestamptz,
  foreign key (salon_id, review_id) references public.reviews (salon_id, id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  event_key text not null, title text not null, body text not null,
  created_at timestamptz not null default now(), read_at timestamptz, unique (user_id, event_key)
);
create table bookmyturn_private.audit_events (
  id bigint generated always as identity primary key, salon_id uuid references public.salons,
  actor_id uuid references auth.users on delete set null,
  entity_type text not null, entity_id text not null,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  occurred_at timestamptz not null default clock_timestamp(), changes jsonb not null
);
create index audit_salon_time on bookmyturn_private.audit_events (salon_id, occurred_at desc);

-- Permission helpers cannot impersonate another user. Business clients get no write grants.
create function bookmyturn_private.has_permission(p_salon uuid, p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from bookmyturn_private.salon_memberships m
    where m.salon_id = p_salon and m.user_id = (select auth.uid()) and m.is_active
      and (m.role = 'owner' or p_permission = any(m.permissions))
  );
$$;
create function bookmyturn_private.can_read_work(p_salon uuid, p_barber uuid, p_customer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (p_customer = (select auth.uid()) or exists (
    select 1 from bookmyturn_private.salon_memberships m
    where m.salon_id = p_salon and m.user_id = (select auth.uid()) and m.is_active
      and (m.role in ('owner','coordinator') or 'read_operations' = any(m.permissions)
        or (p_barber is not null and m.barber_id = p_barber))
  ));
$$;
create function bookmyturn_private.can_read_source(p_salon uuid, p_queue uuid, p_appointment uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.queue_entries q where q.salon_id = p_salon and q.id = p_queue
      and bookmyturn_private.can_read_work(q.salon_id, coalesce(q.assigned_barber_id,q.preferred_barber_id),q.customer_id))
    or exists (select 1 from public.appointments a where a.salon_id = p_salon and a.id = p_appointment
      and bookmyturn_private.can_read_work(a.salon_id,coalesce(a.confirmed_barber_id,a.preferred_barber_id),a.customer_id))
  );
$$;

create function bookmyturn_private.guard_queue() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not (select is_open from public.salons where id = new.salon_id) then raise exception 'Salon is closed' using errcode='23514'; end if;
    if new.status not in ('joined','arrived') or (new.source = 'walk_in' and new.status <> 'arrived') then
      raise exception 'Queue entries must begin joined, or arrived for walk-ins' using errcode='23514'; end if;
  else
    if (new.salon_id,new.source,new.created_at) is distinct from (old.salon_id,old.source,old.created_at) then
      raise exception 'Queue origin is immutable' using errcode='23514'; end if;
    if new.preferred_barber_id is distinct from old.preferred_barber_id and nullif(btrim(new.preference_change_reason),'') is null then
      raise exception 'Changing barber preference requires an explicit reason' using errcode='23514'; end if;
    if new.status <> old.status and not (
      (old.status='joined' and new.status in ('arrived','cancelled','no_show')) or
      (old.status='arrived' and new.status in ('in_service','cancelled','no_show')) or
      (old.status='in_service' and new.status in ('completed','cancelled'))
    ) then raise exception 'Invalid queue transition' using errcode='23514'; end if;
    if old.arrived_at is not null then new.arrived_at:=old.arrived_at; new.arrival_sequence:=old.arrival_sequence; end if;
  end if;
  if new.status='arrived' and new.arrived_at is null then new.arrived_at:=clock_timestamp(); end if;
  if new.arrived_at is not null and new.arrival_sequence is null then new.arrival_sequence:=nextval('bookmyturn_private.arrival_sequence'); end if;
  if new.status in ('in_service','completed') and not exists(select 1 from public.service_sessions s
    where s.queue_entry_id=new.id and s.status=new.status) then
    raise exception 'Queue service state requires its service session' using errcode='23514'; end if;
  return new;
end; $$;
create trigger guard_queue before insert or update on public.queue_entries for each row execute function bookmyturn_private.guard_queue();

create function bookmyturn_private.guard_appointment() returns trigger
language plpgsql set search_path = '' as $$
declare p public.appointment_proposals;
begin
  if tg_op='INSERT' and new.status <> 'pending' then raise exception 'Requests start pending' using errcode='23514'; end if;
  if tg_op='UPDATE' and new.status <> old.status and not (
    (old.status in ('pending','alternative_suggested') and new.status in ('alternative_suggested','confirmed','declined','cancelled')) or
    (old.status='confirmed' and new.status in ('arrived','cancelled','no_show')) or
    (old.status='arrived' and new.status in ('in_service','cancelled')) or
    (old.status='in_service' and new.status in ('completed','cancelled'))
  ) then raise exception 'Invalid appointment transition' using errcode='23514'; end if;
  if new.status='confirmed' and (tg_op='INSERT' or new.status is distinct from old.status or
    (new.confirmed_barber_id,new.confirmed_start,new.confirmed_end,new.accepted_proposal_id)
      is distinct from (old.confirmed_barber_id,old.confirmed_start,old.confirmed_end,old.accepted_proposal_id)) then
    if new.confirmed_start is distinct from new.requested_start
      or (new.preferred_barber_id is not null and new.confirmed_barber_id is distinct from new.preferred_barber_id)
      or new.confirmed_end is distinct from new.requested_start + make_interval(mins=>new.requested_duration_minutes) then
      select * into p from public.appointment_proposals where id=new.accepted_proposal_id
        and appointment_id=new.id and salon_id=new.salon_id;
      if p.id is null or p.accepted_at is null or p.accepted_by is null or p.accepted_by is distinct from new.customer_id
        or p.starts_at is distinct from new.confirmed_start or p.ends_at is distinct from new.confirmed_end
        or p.barber_id is distinct from new.confirmed_barber_id then
        raise exception 'Alternative requires customer acceptance' using errcode='23514'; end if;
    end if;
  end if;
  if new.status in ('in_service','completed') and not exists(select 1 from public.service_sessions s
    where s.appointment_id=new.id and s.status=new.status) then
    raise exception 'Appointment service state requires its service session' using errcode='23514'; end if;
  return new;
end; $$;
create trigger guard_appointment before insert or update on public.appointments for each row execute function bookmyturn_private.guard_appointment();
create function bookmyturn_private.sync_appointment_block() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('confirmed','arrived','in_service') then
    insert into bookmyturn_private.barber_schedule_blocks(salon_id,barber_id,kind,appointment_id,starts_at,ends_at)
      values(new.salon_id,new.confirmed_barber_id,'appointment',new.id,new.confirmed_start,new.confirmed_end)
      on conflict (appointment_id) do update set barber_id=excluded.barber_id, starts_at=excluded.starts_at, ends_at=excluded.ends_at,is_active=true;
  else
    update bookmyturn_private.barber_schedule_blocks set is_active=false where appointment_id=new.id;
  end if;
  return new;
end; $$;
create trigger sync_appointment_block after insert or update on public.appointments for each row execute function bookmyturn_private.sync_appointment_block();

create function bookmyturn_private.guard_style_request() returns trigger
language plpgsql set search_path = '' as $$
declare owner_id uuid;
begin
  if new.queue_entry_id is not null then select customer_id into owner_id from public.queue_entries where id=new.queue_entry_id and salon_id=new.salon_id;
  else select customer_id into owner_id from public.appointments where id=new.appointment_id and salon_id=new.salon_id; end if;
  if new.customer_id is distinct from owner_id then raise exception 'Style request owner mismatch' using errcode='23514'; end if;
  return new;
end; $$;
create trigger guard_style_request before insert or update on public.style_requests for each row execute function bookmyturn_private.guard_style_request();

create function bookmyturn_private.guard_session() returns trigger
language plpgsql set search_path = '' as $$
declare q public.queue_entries; a public.appointments; r bookmyturn_private.commission_rules;
begin
  if tg_op='INSERT' then
    if new.status <> 'in_service' then raise exception 'Start service before completing it' using errcode='23514'; end if;
    if new.queue_entry_id is not null then
      select * into q from public.queue_entries where id=new.queue_entry_id for update;
      if q.salon_id is distinct from new.salon_id or q.customer_id is distinct from new.customer_id
        or q.status <> 'arrived' or q.source <> new.source
        or (q.assigned_barber_id is not null and q.assigned_barber_id <> new.barber_id)
        or (q.preferred_barber_id is not null and q.preferred_barber_id <> new.barber_id)
        or (q.service_id is not null and q.service_id <> new.service_id) then
        raise exception 'Queue service source mismatch' using errcode='23514'; end if;
    else
      select * into a from public.appointments where id=new.appointment_id for update;
      if a.salon_id is distinct from new.salon_id or a.customer_id is distinct from new.customer_id
        or a.status <> 'arrived' or a.confirmed_barber_id <> new.barber_id or a.service_id <> new.service_id then
        raise exception 'Appointment service source mismatch' using errcode='23514'; end if;
    end if;
    if new.commission_rule_id is not null then
      select * into r from bookmyturn_private.commission_rules where id=new.commission_rule_id;
      if r.id is null or not r.is_enabled or r.salon_id <> new.salon_id or not (new.source=any(r.eligible_sources))
        or new.started_at < r.valid_from or (r.valid_until is not null and new.started_at >= r.valid_until)
        or (new.commission_surcharge_minor,new.commission_salon_minor,new.commission_platform_minor,new.commission_disclosure_snapshot)
          is distinct from (r.surcharge_minor,r.salon_share_minor,r.platform_share_minor,r.disclosure) then
        raise exception 'Commission agreement mismatch' using errcode='23514'; end if;
    end if;
  else
    if (to_jsonb(new) - array['customer_id','status','completed_at','final_amount_minor','final_amount_agreed_at','final_price_reason','payment_method'])
      is distinct from (to_jsonb(old) - array['customer_id','status','completed_at','final_amount_minor','final_amount_agreed_at','final_price_reason','payment_method']) then
      raise exception 'Service origin and price snapshots are immutable' using errcode='23514'; end if;
    if old.status <> 'in_service' and (to_jsonb(new)-'customer_id') is distinct from (to_jsonb(old)-'customer_id') then
      raise exception 'Terminal service is immutable' using errcode='23514'; end if;
  end if;
  return new;
end; $$;
create trigger guard_session before insert or update on public.service_sessions for each row execute function bookmyturn_private.guard_session();
create function bookmyturn_private.finish_session() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sale_id uuid; item_total bigint; base_count integer;
begin
  if tg_op='INSERT' then
    if new.queue_entry_id is not null then update public.queue_entries set status='in_service',assigned_barber_id=new.barber_id,started_at=new.started_at where id=new.queue_entry_id;
    else update public.appointments set status='in_service' where id=new.appointment_id; end if;
  elsif new.status <> old.status then
    if new.status='completed' then
      select coalesce(sum(amount_minor),0),count(*) filter(where kind='base') into item_total,base_count
        from public.service_items where service_session_id=new.id;
      if base_count <> 1 or item_total <> new.final_amount_minor then raise exception 'Final amount must match service line items' using errcode='23514'; end if;
      if new.commission_surcharge_minor > new.final_amount_minor then raise exception 'Commission exceeds service amount' using errcode='23514'; end if;
      insert into bookmyturn_private.sales(salon_id,service_session_id,amount_minor,recorded_at,payment_method)
        values(new.salon_id,new.id,new.final_amount_minor,new.completed_at,new.payment_method) returning id into sale_id;
      if new.commission_rule_id is not null and new.commission_platform_minor > 0 then
        insert into bookmyturn_private.commission_accruals(salon_id,sale_id,rule_id,surcharge_minor,salon_share_minor,platform_share_minor,accrued_at)
          values(new.salon_id,sale_id,new.commission_rule_id,new.commission_surcharge_minor,new.commission_salon_minor,new.commission_platform_minor,new.completed_at);
      end if;
    end if;
    if new.queue_entry_id is not null then update public.queue_entries set status=new.status,completed_at=new.completed_at where id=new.queue_entry_id;
    else update public.appointments set status=new.status,completed_at=new.completed_at where id=new.appointment_id; end if;
  end if;
  return new;
end; $$;
create trigger finish_session after insert or update on public.service_sessions for each row execute function bookmyturn_private.finish_session();
create function bookmyturn_private.guard_service_item() returns trigger
language plpgsql set search_path = '' as $$
declare session_state text;
begin
  if tg_op='UPDATE' and (new.salon_id,new.service_session_id) is distinct from (old.salon_id,old.service_session_id) then
    raise exception 'Cannot move service items' using errcode='23514'; end if;
  select status into session_state from public.service_sessions where id=case when tg_op='DELETE' then old.service_session_id else new.service_session_id end for update;
  if session_state <> 'in_service' then raise exception 'Completed service items are immutable' using errcode='23514'; end if;
  if tg_op='DELETE' then return old; end if; return new;
end; $$;
create trigger guard_service_item before insert or update or delete on public.service_items for each row execute function bookmyturn_private.guard_service_item();

create function bookmyturn_private.guard_review() returns trigger
language plpgsql set search_path = '' as $$
declare s public.service_sessions;
begin
  select * into s from public.service_sessions where id=new.service_session_id;
  if s.status is distinct from 'completed' or s.salon_id is distinct from new.salon_id or s.barber_id is distinct from new.barber_id
    or (tg_op='INSERT' and (new.customer_id is null or s.customer_id is distinct from new.customer_id)) then
    raise exception 'Review requires the customer''s completed service' using errcode='23514'; end if;
  if tg_op='UPDATE' and (new.salon_id,new.barber_id,new.service_session_id) is distinct from (old.salon_id,old.barber_id,old.service_session_id) then
    raise exception 'Review source is immutable' using errcode='23514'; end if;
  return new;
end; $$;
create trigger guard_review before insert or update on public.reviews for each row execute function bookmyturn_private.guard_review();
create function bookmyturn_private.publish_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.publication_status='published' then
    insert into public.published_reviews(id,salon_id,barber_id,rating,body,created_at)
      values(new.id,new.salon_id,new.barber_id,new.rating,new.body,new.created_at)
      on conflict(id) do update set rating=excluded.rating,body=excluded.body;
  else delete from public.published_reviews where id=new.id; end if;
  return new;
end; $$;
create trigger publish_review after insert or update on public.reviews for each row execute function bookmyturn_private.publish_review();
create function bookmyturn_private.guard_allocation() returns trigger
language plpgsql set search_path = '' as $$
declare payment_total bigint; accrual_total bigint;
begin
  if tg_op <> 'INSERT' then raise exception 'Allocations are append-only' using errcode='23514'; end if;
  select amount_minor into payment_total from bookmyturn_private.commission_payments where id=new.payment_id for update;
  select platform_share_minor into accrual_total from bookmyturn_private.commission_accruals where id=new.accrual_id for update;
  if new.amount_minor + coalesce((select sum(amount_minor) from bookmyturn_private.commission_payment_allocations where payment_id=new.payment_id),0) > payment_total
    or new.amount_minor + coalesce((select sum(amount_minor) from bookmyturn_private.commission_payment_allocations where accrual_id=new.accrual_id),0) > accrual_total then
    raise exception 'Commission allocation exceeds payment or accrual' using errcode='23514'; end if;
  return new;
end; $$;
create trigger guard_allocation before insert or update or delete on bookmyturn_private.commission_payment_allocations for each row execute function bookmyturn_private.guard_allocation();
create function bookmyturn_private.immutable_finance() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Auth deletion may clear an actor link without changing the financial original.
  if tg_op='UPDATE' and tg_table_name='sale_adjustments' and (to_jsonb(new)->>'actor_id') is null
    and (to_jsonb(new)-'actor_id')=(to_jsonb(old)-'actor_id') then return new; end if;
  raise exception 'Financial originals are append-only; record a correction' using errcode='23514';
end; $$;
create function bookmyturn_private.guard_financial_insert() returns trigger
language plpgsql set search_path = '' as $$
declare s public.service_sessions; total bigint;
begin
  if tg_table_name='sales' then
    select * into s from public.service_sessions where id=new.service_session_id;
    if s.status is distinct from 'completed' or s.salon_id is distinct from new.salon_id
      or s.final_amount_minor is distinct from new.amount_minor or s.completed_at is distinct from new.recorded_at then
      raise exception 'Sale must match a completed service' using errcode='23514'; end if;
  elsif tg_table_name='commission_accruals' then
    select ss.* into s from bookmyturn_private.sales sale join public.service_sessions ss on ss.id=sale.service_session_id where sale.id=new.sale_id;
    if s.status is distinct from 'completed' or (s.salon_id,s.commission_rule_id,s.commission_surcharge_minor,s.commission_salon_minor,s.commission_platform_minor)
      is distinct from (new.salon_id,new.rule_id,new.surcharge_minor,new.salon_share_minor,new.platform_share_minor) then
      raise exception 'Commission must match the completed service agreement' using errcode='23514'; end if;
  else
    select amount_minor into total from bookmyturn_private.sales where id=new.sale_id for update;
    if total + new.delta_minor + coalesce((select sum(delta_minor) from bookmyturn_private.sale_adjustments where sale_id=new.sale_id),0) < 0 then
      raise exception 'Sale corrections cannot create negative revenue' using errcode='23514'; end if;
  end if;
  return new;
end; $$;
do $$ declare t text; begin
  foreach t in array array['sales','commission_accruals','sale_adjustments'] loop
    execute format('create trigger guard_financial_insert before insert on bookmyturn_private.%I for each row execute function bookmyturn_private.guard_financial_insert()',t);
  end loop;
end; $$;
do $$ declare t text; begin
  foreach t in array array['sales','sale_adjustments','commission_accruals','commission_payments'] loop
    execute format('create trigger immutable_finance before update or delete on bookmyturn_private.%I for each row execute function bookmyturn_private.immutable_finance()',t);
  end loop;
end; $$;

create function bookmyturn_private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n jsonb; o jsonb; keys text[]:=array['customer_name','mobile','note','body','bio','photo_url','photo_attribution','actor_id'];
begin
  if tg_op <> 'DELETE' then n:=to_jsonb(new); end if;
  if tg_op <> 'INSERT' then o:=to_jsonb(old); end if;
  insert into bookmyturn_private.audit_events(salon_id,actor_id,entity_type,entity_id,operation,changes)
    values(case when tg_table_name='salons' then coalesce((n->>'id')::uuid,(o->>'id')::uuid)
      else coalesce((n->>'salon_id')::uuid,(o->>'salon_id')::uuid) end,auth.uid(),tg_table_name,
      coalesce(n->>'id',o->>'id',n->>'barber_id',o->>'barber_id',n->>'salon_id',o->>'salon_id'),tg_op,
      jsonb_build_object('before',o-keys,'after',n-keys));
  if tg_op='DELETE' then return old; end if; return new;
end; $$;

-- RLS/grants on every application table; preserve existing profile policies/grants.
do $$ declare r record; begin
  for r in select schemaname,tablename from pg_tables
    where schemaname in ('public','bookmyturn_private') and tablename <> 'customer_profiles' loop
    execute format('alter table %I.%I enable row level security',r.schemaname,r.tablename);
    execute format('revoke all on %I.%I from public,anon,authenticated',r.schemaname,r.tablename);
    execute format('grant all on %I.%I to service_role',r.schemaname,r.tablename);
  end loop;
end; $$;
grant usage on schema bookmyturn_private to authenticated,service_role;
grant usage,select on all sequences in schema bookmyturn_private to service_role;
-- Revoke only functions created by this migration (existing profile triggers remain unchanged).
do $$ declare r record; begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='bookmyturn_private' and p.proname not in ('create_customer_profile','touch_customer_profile') loop
    execute format('revoke all on function %s from public,anon,authenticated',r.sig);
  end loop;
end; $$;
grant execute on function bookmyturn_private.has_permission(uuid,text),bookmyturn_private.can_read_work(uuid,uuid,uuid),
  bookmyturn_private.can_read_source(uuid,uuid,uuid) to authenticated;

grant select on public.salons,public.salon_hours,public.salon_date_exceptions,public.barbers,public.barber_hours,
  public.barber_status,public.services,public.barber_services,public.hairstyle_categories,public.hairstyles,public.published_reviews to anon,authenticated;
create policy catalog_read on public.salons for select to anon,authenticated using (is_published);
do $$ declare t text; begin
  foreach t in array array['salon_hours','salon_date_exceptions','barbers','barber_hours','barber_status','services','barber_services','published_reviews'] loop
    execute format('create policy published_salon_read on public.%I for select to anon,authenticated using (exists(select 1 from public.salons s where s.id=salon_id and s.is_published))',t);
  end loop;
end; $$;
-- Unpublished/inactive staff and services are not customer listings.
create policy barber_visibility on public.barbers as restrictive for select to anon,authenticated using (is_active and is_published);
create policy service_visibility on public.services as restrictive for select to anon,authenticated using (is_active);
do $$ declare t text; begin
  foreach t in array array['barber_hours','barber_status','barber_services'] loop
    execute format('create policy barber_visibility on public.%I as restrictive for select to anon,authenticated using (exists(select 1 from public.barbers b where b.id=barber_id and b.salon_id=%I.salon_id))',t,t);
  end loop;
end; $$;
create policy gallery_categories_read on public.hairstyle_categories for select to anon,authenticated using (true);
create policy gallery_read on public.hairstyles for select to anon,authenticated using (is_published);

grant select on public.queue_entries,public.appointments,public.appointment_proposals,public.style_requests,
  public.style_request_items,public.service_sessions,public.service_items,public.reviews,public.review_reports,public.notifications to authenticated;
create policy queue_read on public.queue_entries for select to authenticated using
  (bookmyturn_private.can_read_work(salon_id,coalesce(assigned_barber_id,preferred_barber_id),customer_id));
create policy appointment_read on public.appointments for select to authenticated using
  (bookmyturn_private.can_read_work(salon_id,coalesce(confirmed_barber_id,preferred_barber_id),customer_id));
create policy proposal_read on public.appointment_proposals for select to authenticated using
  (bookmyturn_private.can_read_source(salon_id,null,appointment_id));
create policy style_read on public.style_requests for select to authenticated using
  (bookmyturn_private.can_read_source(salon_id,queue_entry_id,appointment_id));
create policy style_items_read on public.style_request_items for select to authenticated using
  (exists(select 1 from public.style_requests r where r.id=style_request_id and r.salon_id=style_request_items.salon_id));
create policy session_read on public.service_sessions for select to authenticated using
  (bookmyturn_private.can_read_work(salon_id,barber_id,customer_id));
create policy service_items_read on public.service_items for select to authenticated using
  (exists(select 1 from public.service_sessions s where s.id=service_session_id and s.salon_id=service_items.salon_id));
create policy review_read on public.reviews for select to authenticated using
  (bookmyturn_private.can_read_work(salon_id,barber_id,customer_id));
create policy report_read on public.review_reports for select to authenticated using
  (bookmyturn_private.has_permission(salon_id,'read_audit') or reported_by=(select auth.uid()));
create policy notification_read on public.notifications for select to authenticated using (user_id=(select auth.uid()));

grant select on bookmyturn_private.salon_memberships,bookmyturn_private.salon_policies,bookmyturn_private.barber_schedule_blocks,
  bookmyturn_private.commission_rules,bookmyturn_private.sales,bookmyturn_private.sale_adjustments,
  bookmyturn_private.commission_accruals,bookmyturn_private.commission_payments,bookmyturn_private.commission_payment_allocations,
  bookmyturn_private.expense_categories,bookmyturn_private.recurring_expenses,bookmyturn_private.expenses,bookmyturn_private.audit_events to authenticated;
create policy membership_read on bookmyturn_private.salon_memberships for select to authenticated using
  (user_id=(select auth.uid()) or bookmyturn_private.has_permission(salon_id,'read_audit'));
create policy policy_read on bookmyturn_private.salon_policies for select to authenticated using
  (bookmyturn_private.has_permission(salon_id,'manage_catalog'));
create policy block_read on bookmyturn_private.barber_schedule_blocks for select to authenticated using
  (bookmyturn_private.can_read_work(salon_id,barber_id,null));
do $$ declare t text; begin
  foreach t in array array['commission_rules','sale_adjustments','commission_accruals','commission_payments','commission_payment_allocations','recurring_expenses','expenses'] loop
    execute format('create policy finance_read on bookmyturn_private.%I for select to authenticated using (bookmyturn_private.has_permission(salon_id,''read_finance''))',t);
  end loop;
end; $$;
create policy sale_read on bookmyturn_private.sales for select to authenticated using (
  bookmyturn_private.has_permission(salon_id,'read_finance') or exists(
    select 1 from public.service_sessions s join bookmyturn_private.salon_memberships m on m.salon_id=s.salon_id and m.barber_id=s.barber_id
      where s.id=service_session_id and m.user_id=(select auth.uid()) and m.is_active));
create policy expense_category_read on bookmyturn_private.expense_categories for select to authenticated using (true);
create policy audit_read on bookmyturn_private.audit_events for select to authenticated using (bookmyturn_private.has_permission(salon_id,'read_audit'));

-- Cover foreign keys for tenant/RLS lookup and retention operations.
do $$ declare c record; cols text; begin
  for c in select x.*,n.nspname,t.relname from pg_constraint x join pg_class t on t.oid=x.conrelid
    join pg_namespace n on n.oid=t.relnamespace where x.contype='f' and n.nspname in ('public','bookmyturn_private') loop
    if not exists(select 1 from pg_index i where i.indrelid=c.conrelid and i.indpred is null
      and (' '||i.indkey::text||' ') like (' '||array_to_string(c.conkey,' ')||' %')) then
      select string_agg(quote_ident(a.attname),',' order by k.ord) into cols
        from unnest(c.conkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum;
      execute format('create index %I on %I.%I (%s)','fk_'||md5(c.nspname||c.relname||c.conname),c.nspname,c.relname,cols);
    end if;
  end loop;
end; $$;

do $$ declare r record; begin
  for r in select table_schema,table_name from information_schema.columns where column_name='salon_id'
    and table_schema in ('public','bookmyturn_private') and table_name <> 'audit_events' loop
    execute format('create trigger audit_change after insert or update or delete on %I.%I for each row execute function bookmyturn_private.audit_change()',r.table_schema,r.table_name);
  end loop;
end; $$;
create trigger audit_change after insert or update or delete on public.salons for each row execute function bookmyturn_private.audit_change();
-- Even the administrative application role must append rather than rewrite audit history.
revoke update,delete,truncate on bookmyturn_private.audit_events from service_role;
create view public.barber_review_stats with (security_invoker=true) as
  select salon_id,barber_id,count(*) as review_count,round(avg(rating),2) as average_rating
    from public.published_reviews group by salon_id,barber_id;
create view public.salon_review_stats with (security_invoker=true) as
  select salon_id,count(*) as review_count,round(avg(rating),2) as average_rating
    from public.published_reviews group by salon_id;
grant select on public.barber_review_stats,public.salon_review_stats to anon,authenticated;

-- Exactly the approved catalog; no invented people, live workloads, ratings or finances.
insert into public.salons(slug,name,is_published) values
 ('royal-saloon','Royal Saloon',true),('mrg-akurana-6','MrG Akurana 6',true),
 ('mrg-akurana-7','MrG Akurana 7',true),('mrg-akurana-8','MrG Akurana 8',true),
 ('neel1','Neel1',true),('neel2','Neel2',true),('neel3','Neel3',true),('saloon-chami','Saloon Chami',true),
 ('mr-handsome','Mr Handsome',true),('saloon-kumar','Saloon Kumar',true),('mr-perfect','Mr.perfect',true),
 ('noire','Noire',true),('saloon-bhai','Saloon Bhai',true);
insert into bookmyturn_private.salon_policies(salon_id) select id from public.salons;
insert into public.hairstyle_categories(slug,name) values
 ('low-fade','Low Fade'),('mid-fade','Mid Fade'),('high-fade','High Fade'),('skin-fade','Skin Fade'),
 ('taper-fade','Taper Fade'),('classic-side-part','Classic Side Part'),('textured-crop','Textured Crop'),
 ('crew-cut','Crew Cut'),('buzz-cut','Buzz Cut'),('pompadour','Pompadour'),('quiff','Quiff'),
 ('slick-back','Slick Back'),('curly-top','Curly Top'),('undercut','Undercut'),('comb-over','Comb Over'),
 ('fringe','Fringe'),('mullet','Mullet'),('afro-styles','Afro Styles'),('kids-haircuts','Kids'' Haircuts'),
 ('beard-trim','Beard Trim'),('full-beard','Full Beard'),('beard-fade','Beard Fade'),('haircut-beard','Haircut + Beard');
insert into bookmyturn_private.expense_categories(code,name) values
 ('rent','Rent'),('electricity','Electricity'),('water','Water'),('internet-phone','Internet and telephone'),
 ('wages','Wages'),('barber-commissions','Barber commissions'),('supplies','Hair products and supplies'),
 ('repairs','Repairs and maintenance'),('transport','Transport'),('other','Other');
commit;
