# Manager catalogue CRUD

Complete salon, barber and service management in the approved light interface. Each operation must persist in Supabase, refresh the account view and enforce ownership on the server.

- [x] Audit existing forms, permissions, foreign keys and history dependencies.
- [x] Add owner-only removal: permanent deletion for unused records; explicit archive/restore for records with history. Block removal while visits are active. Preserve audit records.
- [x] Preserve names on the customer's own historical visit cards after archiving.
- [x] Hide archives from customer discovery, booking, QR arrivals and staff operations, while keeping historical visits readable.
- [x] Finish editing: weekly salon/team hours, service create retry protection, archived records and photo removal.
- [x] Add clear confirmations, progress, safe actionable errors, archive views and restore actions to Manager screens.
- [x] Verify database ownership, invalid input, repeated actions, active-visit protection, history preservation and customer visibility using rollback-only fixtures.
- [x] Verify complete browser CRUD journeys and small-screen layout, run lint/types, native exports and regression checks.
- [x] Apply the additive migrations, update generated types and workflow docs.
- [x] Open separate [PR #13](https://github.com/nadhirhasan/BookMyTurn/pull/13).
- [x] Add full app and PostgreSQL regression coverage to PR CI.
- [ ] User acceptance on iPhone and Android.

The latest CI result is recorded on [PR #13](https://github.com/nadhirhasan/BookMyTurn/pull/13); the PR stays draft until the final commit passes.

Removal never automatically cancels visits. Archive hides a record without deleting history. Restore returns a salon closed so its manager can check it before reopening; restored barbers/services return to their normal published/active state. Deleting an unused salon also removes its unused team, services and configuration. Uploaded storage objects are retained; removing a photo detaches it from the profile, and public URLs already shared can remain accessible.
