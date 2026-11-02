begin;
-- Invitation reads/writes go through guarded RPCs only. Keep deny-all behavior
-- explicit even if a future migration accidentally grants table privileges.
create policy invitations_rpc_only on bookmyturn_private.barber_invitations
 for all to authenticated using(false)with check(false);
commit;
