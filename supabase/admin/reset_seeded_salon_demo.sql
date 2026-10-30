-- ONE-TIME administrator operation requested by the user on 30 October 2026.
-- Not a migration or startup hook. Only the original 13-demo catalogue qualifies.
-- Auth users, sessions, customer profiles and the hairstyle gallery are preserved.
begin;
do $$begin
 if (select count(*) from public.salons)<>13 or exists(select 1 from public.salons where not is_demo or slug not in
 ('royal-saloon','mrg-akurana-6','mrg-akurana-7','mrg-akurana-8','neel1','neel2','neel3','saloon-chami','mr-handsome','saloon-kumar','mr-perfect','noire','saloon-bhai')) then
  raise exception 'Reset refuses to erase user-created or changed salon catalogues';
 end if;
 if exists(select 1 from bookmyturn_private.sales) or exists(select 1 from public.service_sessions) then
  raise exception 'Reset refuses to erase completed/in-progress service or financial records';
 end if;
end;$$;
create temp table preserved_auth_counts as select (select count(*) from auth.users) users,(select count(*) from public.customer_profiles) profiles;
delete from public.notifications where split_part(event_key,':',1) in(select id::text from public.appointments);
-- Explicit FK closure; no CASCADE. An unexpected new dependency aborts the reset.
truncate table
 public.salons,public.salon_hours,public.salon_date_exceptions,public.barbers,
 public.barber_hours,public.barber_status,public.services,public.barber_services,
 public.queue_entries,public.appointments,public.appointment_proposals,
 public.style_requests,public.style_request_items,public.service_sessions,public.service_items,
 public.reviews,public.published_reviews,public.review_reports,
 bookmyturn_private.salon_policies,bookmyturn_private.salon_memberships,
 bookmyturn_private.barber_schedule_blocks,bookmyturn_private.customer_demo_settings,
 bookmyturn_private.qr_receipts,bookmyturn_private.commission_rules,
 bookmyturn_private.sales,bookmyturn_private.sale_adjustments,
 bookmyturn_private.commission_accruals,bookmyturn_private.commission_payments,
 bookmyturn_private.commission_payment_allocations,bookmyturn_private.recurring_expenses,
 bookmyturn_private.expenses,bookmyturn_private.audit_events;
do $$begin
 if (select count(*) from auth.users)<>(select users from preserved_auth_counts) or
 (select count(*) from public.customer_profiles)<>(select profiles from preserved_auth_counts) then raise exception 'Login/profile preservation check failed';end if;
end;$$;
select (select count(*) from public.salons) salons,(select count(*) from public.barbers) barbers,
 (select count(*) from public.queue_entries) queue_entries,(select count(*) from public.appointments) appointments,
 (select count(*) from auth.users) preserved_login_accounts,(select count(*) from public.hairstyles) preserved_hairstyles;
commit;
