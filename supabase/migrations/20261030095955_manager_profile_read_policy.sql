-- Defense in depth; application roles still have no direct table grants.
create policy manager_profile_self_read on bookmyturn_private.manager_profiles
for select to authenticated using(user_id=(select auth.uid()));
