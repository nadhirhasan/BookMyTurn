# Manager catalogue management

One Manager account owns multiple salon locations and manages each location's team and services. All catalogue writes use authenticated, owner-scoped Supabase commands. Customer and employee clients cannot perform owner actions.

## Available actions

- **Salons:** create, view live activity, edit name/address/cover/open status and weekly hours; archive, restore or permanently delete unused locations.
- **Barbers:** create, edit name/bio/experience/specialities/photo/offered services, activate/deactivate, archive, restore or delete unused profiles. Creating a profile does not create an Auth account.
- **Services:** create with a stable request ID, edit name/prices/duration, archive, restore or delete unused services. Service names are checked within the salon, including archived services, to avoid accidental duplicates.
- **Photos:** choose, preview, discard, replace or remove a saved salon/barber/account photo. Changes upload or detach only when Save succeeds. Account avatars remain private.
- **Hours:** configure each weekday independently, including closed days. Saving changed hours updates the salon and all existing barber working hours. New barbers inherit them. Existing held appointments must fit within the new hours; active queues must be completed first.

## Removal rules

Edit the record and scroll to **Manage this record**. Archive and Delete each show a separate confirmation. Delete requires typing the saved name exactly; Cancel makes no database change.

**Delete** permanently removes an unused record. Deleting an unused salon also removes its unused barber profiles, offered-service links, hours and settings. Any restrictive booking, service, financial or other history relationship rejects the entire transaction and tells the manager to archive instead. Partial deletion cannot leave a team without its settings. Sanitized audit snapshots survive salon deletion, with the removed salon UUID retained in their JSON history.

**Archive** hides the record from Customer discovery, booking and QR arrivals. An archived salon also prevents all of its chair operations. No visit is automatically cancelled. Active queue entries, appointments and in-progress services must be handled before removal. Barber removal conservatively waits for any active queue at that location because unassigned arrivals may depend on the chair. Completed records, financial snapshots and customer visit history remain intact. Each customer receives salon, service and barber names for their own historical visits through a private response, so those cards remain readable after the public catalogue hides an archive.

Use **Archived locations**, **Archived team** or **Archived services** to find and restore a record. A salon returns published but closed so its manager can review and reopen it. Child archive choices are preserved. Restored services become active; restored barbers become active/published and require an active offered service. Restore that service first if necessary. Returning from an operation resets the appropriate list to its current records.

Removing a photo detaches it from the record; it does not delete the stored object. Public URLs already shared may remain accessible. Full storage retention/deletion policies and Auth account deletion are separate work. No user salons or visits are reset by these migrations.

Changing a service duration is blocked while that service has active queue visits or appointments. This protects reservations through both the Manager API and older barber screens. Completed service price/name snapshots retain their original values.

## Validation

- Hosted `manager_catalog_crud.sql` creates isolated accounts, locations, staff, bookings and a completed service in a transaction, then rolls everything back. It covers deletion, nested cleanup, audit preservation, retries, duplicate names, invalid values, ownership, held bookings, weekly hours, shared duration protection, archive visibility and restore.
- Existing hosted barber, multi-salon and live-operation suites pass. Public-key checks still confirm signup without email verification and private data denial.
- Manager browser coverage includes nine new Manager CRUD journeys and a Customer archived-history journey, restored-list navigation, failure recovery, photo removal and 320/393/430 px layouts. Existing queue/appointment/QR and manager journeys remain covered. API responses are mocked for browsers; hosted SQL verifies real permissions and persistence separately.
- Lint/types, shared Auth/session unit tests and iOS/Android bundle exports are checked before handoff. Clean PostgreSQL 17 migration replay and both app browser suites run in PR CI.
- Existing security advisory: [leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No new database/storage security findings; Auth settings are unchanged.

## Device acceptance

From the repository root run `npm run manager:tunnel` and scan with Expo Go. Run `npm run start:tunnel` in another terminal for the Customer app.

1. Create a disposable salon, service and barber. Edit their details and weekly hours; reload and check persistence.
2. Remove and replace each photo; save and reopen the screen.
3. Book or join from Customer. Confirm the Manager cannot archive/delete the active record or shorten hours over the held booking.
4. Complete or decline the visit. Try Delete on the used record: it should direct you to Archive. Archive it and check Customer visibility, then restore it from the archive view.
5. Create an unused salon with a barber/service. Cancel the delete confirmation first, then type the salon name and confirm. Verify only that location is gone and the other salon still works.

iPhone/Android device acceptance and user PR review remain pending. Browser and bundle checks do not claim physical-device verification.
