# One manager, multiple salons, individual barber teams

The [live operations update](LIVE_OPERATIONS.md) adds a salon-wide Queue board,
date-based Agenda and staff Activity inbox. A location now opens on operations;
choose **Team** to add/edit barbers and **Details** for services and opening hours.

Updated 30 October 2026. This replaces the original one-account-per-salon setup.
Existing accounts, salons, barbers, visits and profile pictures are preserved.

## Start and explore

```powershell
cd C:\Users\pc\Mobile-Apps\BookMyTurn
npm run manager:tunnel
```

Scan in Expo Go. Manager uses port 8084; Customer continues on 8081 with
`npm run start:tunnel`. The old `barber:tunnel` command also starts this app.
The display name is now BookMyTurn Manager; its app identifiers and persistent
Auth storage are unchanged, so existing logins remain usable. Development signup
still returns a session without verification emails.

1. Sign up or sign in once. **Your salons** lists only salons you own. Existing
   owners see their existing salon. A new manager sees a clear empty state.
2. **+ Add salon**: upload a cover, enter its name/address, first service with
   price range/duration, working days and opening/closing times. **Create salon**
   creates that salon without forcing you to become a barber.
3. Inside the salon, **+ Add barber** creates a named barber profile with portrait,
   bio, experience, specialities and selected services from this salon. Repeat
   to build the team. The barber inherits this salon's working hours.
4. Return to **Your salons** and create another salon under the same account.
   Each has its own services, staff, queue, appointments and activity. New salons
   start with zero workload, reviews and revenue.
5. **Edit salon** changes its photo/name/address/open status. Services can be
   added/edited without creating a primary barber. **Edit profile** changes a
   barber and their services. Existing reservations keep their stored times;
   completed service snapshots keep their original price records.
6. **Open chair** enters that barber's existing Queue / Appointments / Profile /
   My Work screens. Owners can operate any active barber in their own salons.
   **My salons** returns to management. Switching chairs waits for the selected
   chair's database state before navigating.
7. Use **My account** to set your manager display name and private profile photo.
   Salon covers and barber portraits are public in the Customer app. Manager
   avatars use private storage and signed URLs.

Creating a barber makes a managed profile, not an Auth account. No email/password
or invitation is needed for that profile; the manager can operate its chair.
Existing separately assigned employee logins still access only their own barber.
Employee invitations, working-hour edits after setup, Owner accounting and
coordinator screens remain separate features.

## Customer verification

Use another account in Customer and refresh discovery. Your new salon appears
after creation. It has no bookable capacity until an active barber offers a
service during working hours. Customers can choose among that salon's barbers,
join the queue or select date/time and request an appointment. The manager opens
the appropriate chair to check in, respond, start/finish and enable the review.

Try two salons and two barbers in one salon. Their visits and completed work
must remain separate. Requests reserve capacity and another customer cannot
select the same barber's held time. The existing account-free salon QR journey
still works without creating an Auth account; public web hosting remains pending.

## Storage and save behavior

Photos support JPEG/PNG/WebP up to 2 MB. Selection previews locally and uploads
only when you save. `salon-media` is public, writable only by the owning manager
under their own account/salon path. `barber-avatars` accepts owners of that barber's
salon and the assigned active employee under their own account/barber path.
`manager-avatars` is private and accessible only under the signed-in user's path.
No bucket allows object overwrite through upsert.

For a new salon/barber, the database creates the entity before uploading its
photo so storage authorization can verify ownership. A failed photo save leaves
the created entity available for retry, with an explicit message. Stable IDs
prevent another entity from being created by retry. Newly uploaded files are
removed when the subsequent save fails. Failed uploads never become profile URLs.

## Database and access control

Hosted migrations:

- `20261030095539_manager_multiple_salons.sql`: private manager profiles,
  manager state/commands, many salons per owner, managed barber creation,
  owner chair access and media policies. Legacy setup RPC remains compatible.
- `20261030095955_manager_profile_read_policy.sql`: explicit own-profile RLS
  as defense in depth; application roles still have no direct table grants.

All public RPC wrappers are invokers. Private implementations use fixed search
paths, explicit grants and current database membership checks. Creation serializes
per account; salon changes serialize with the existing operational salon lock
and recheck ownership under a membership row lock. Business writes remain RPC-only.
Another manager cannot change salon IDs to read/edit someone else's salon/barber,
mix services across salons or upload photos into their paths. Deactivated ownership
is immediately denied. Active visits prevent unsafe barber deactivation or removal
of services needed for the booking.

## Validation and remaining gates

- Hosted `manager_multiple_salons.sql` passes: multiple salons/barbers, create
  retry, private account profile, media scopes, owner-operated service completion,
  customer discovery/booking, employee isolation and ownership revocation.
- Existing hosted `barber_workflow.sql` still passes. All hosted fixtures roll
  back; no permanent test accounts, salons or visits were added.
- Fifteen Manager/Barber browser journeys pass, including photo upload and
  private avatar reload, two-salon creation and safe chair switching, access
  revocation and forms at 320/393/430 px. Screenshots were visually inspected.
- Both workspaces pass lint/types, the shared Auth/config/session suite passes
  22 tests, and Manager iOS/Android Hermes exports pass. CI also builds both web
  apps and runs all 21 Customer browser journeys plus all SQL suites.
- Security advisors: no database/storage findings after the profile RLS policy.
  The existing development Auth [leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
  is unchanged.

Physical iPhone/Android acceptance, real native photo uploads, signed-in native
restoration and PR review/merge remain manual gates. Browser storage uploads are
mocked; hosted SQL validates permissions and business behavior. The approved
light/charcoal DM Sans style is reused while the existing Figma Starter quota
blocks new frames; no new Figma screens are claimed. No real payment, staff email
invitation or push/SMS system is included.
