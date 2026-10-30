begin;
alter function bookmyturn_private.customer_state() rename to customer_state_catalog_v1;
create function bookmyturn_private.customer_state() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in to view your visits' using errcode='42501';end if;
 result:=bookmyturn_private.customer_state_catalog_v1();
 -- Enrich only the authenticated customer's already-scoped records. Archived
 -- names do not re-enter public discovery or expose another customer's visits.
 return result||jsonb_build_object(
  'queues',(select coalesce(jsonb_agg(q||jsonb_build_object('salon_name',s.name,'service_name',v.name,'barber_name',b.display_name) order by q->>'created_at' desc),'[]')
   from jsonb_array_elements(result->'queues')q
   left join public.salons s on s.id=(q->>'salon_id')::uuid
   left join public.services v on v.id=(q->>'service_id')::uuid
   left join public.barbers b on b.id=coalesce((q->>'assigned_barber_id')::uuid,(q->>'preferred_barber_id')::uuid)),
  'appointments',(select coalesce(jsonb_agg(a||jsonb_build_object('salon_name',s.name,'service_name',v.name,'barber_name',b.display_name) order by a->>'created_at' desc),'[]')
   from jsonb_array_elements(result->'appointments')a
   left join public.salons s on s.id=(a->>'salon_id')::uuid
   left join public.services v on v.id=(a->>'service_id')::uuid
   left join public.barbers b on b.id=coalesce((a->>'confirmed_barber_id')::uuid,(a->>'preferred_barber_id')::uuid)));
end;$$;
create or replace function public.customer_state() returns jsonb language sql stable security invoker set search_path='' as $$select bookmyturn_private.customer_state();$$;
revoke all on function bookmyturn_private.customer_state_catalog_v1(),bookmyturn_private.customer_state() from public,anon,authenticated;
grant execute on function bookmyturn_private.customer_state() to authenticated;
notify pgrst,'reload schema';
commit;
