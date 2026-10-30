# Barber app and shared customer workflow

Implemented 30 October 2026. This release covers the individual Barber workflow
and the minimum salon creation needed for user testing. The separate Owner
finance/accounting and coordinator interfaces remain later releases.

## Start and create a salon

From the repository root:

```powershell
cd C:\Users\pc\Mobile-Apps\BookMyTurn
npm run barber:tunnel
```

Open the terminal QR with Expo Go on iPhone or Android. Customer startup remains
`npm run start:tunnel` in a second terminal. Barber uses 8084, Customer 8081.
The existing Windows global-ngrok lookup is reused; no global installation or
system environment changes are needed. Both apps use root `.env` public values
and separate persisted Auth storage keys. SDK 57-compatible Expo Go is required.

1. Choose **New salon? Create an account**, using a separate email per salon.
   Use a syntactically valid email, such as `salon-one@example.com`, and a password
   of at least eight characters. Hosted email confirmation remains disabled.
2. Set the salon name, Akurana address, barber display name, first service,
   minimum/maximum price, duration, working days and opening/closing times.
3. **Create & open my salon** creates and publishes only this new salon and its
   primary barber. Its queue, appointments, reviews and revenue start empty.
4. Refresh the Customer app to discover it. Configure additional services or
   close/reopen the salon from the primary barber's Profile tab.

An existing authenticated account can also create a salon if it owns none.
Existing employees should obtain a membership from their owner instead of
creating a duplicate salon. Additional staff invitations and editing established
working hours are deferred to salon administration. There is no client role
selector or email-based staff privilege.

## Test the complete workflow

Use a different customer account for the other side. The same Supabase project
backs both apps; customer polling is 15 seconds, Barber polling is 10 seconds,
with additional foreground/focus refresh and a manual refresh action.

1. Customer: open your salon, choose service/barber, join the queue. Remote joins
   are not physical arrivals. Barber: enter the full queue reference in
   **Arriving customer queue code**, then **Mark Arrived**.
2. Alternatively, Barber: **+ Add Walk-In**, optionally enter name/mobile/service,
   then **Add arrived customer**. Account-free QR arrivals use the Customer
   project's existing `/qr/<salon-slug>` web route and arrive physically without
   an Auth account. Public web hosting is still pending; the Expo Go QR opens
   the development app and is not the salon arrival QR.
3. **Start Service** shows shared hairstyle references/notes, the offered range
   and required agreed price. Confirm the customer agreement; explain any price
   outside the range. A configured commercial surcharge requires its own explicit
   disclosure agreement. Starting decreases physical waiting immediately.
4. **Finish Service** records the base amount, optional named extras, final total,
   optional payment method and final customer agreement. Explain an amount outside
   the snapshotted range. Completion creates exactly one sale and any configured
   commission. Retry does not charge or accrue twice. No real payment is collected.
5. Customer: review the completed service. Barber: find the actual review and
   completed-service totals under **My Work**. These are service revenue, not
   take-home pay or salon profit; recent history is limited to 100 sessions.
6. Customer: select a calendar date and available time, then request an appointment.
   A pending request holds its slot. Barber sees the request banner and can accept,
   decline or suggest an alternative date/time. The customer must accept an
   alternative before confirmation. Another customer cannot select held capacity.
7. On arrival, mark the existing appointment arrived and start/finish it directly.
   It stays an appointment and is not duplicated as an ordinary queue entry.
8. After service, take a timed break or go off duty. Customer forecasts account for
   the timed break and reserve capacity after it. **Available** ends the break
   early; an expired break is cleared when the Barber app refreshes. Overlapping
   reservations prevent a conflicting break or service start.
9. Edit your public profile, experience, specialities and photo. A selected photo
   uploads on **Save Profile**. Photos are public, JPEG/PNG/WebP, at most 2 MB;
   only the assigned active barber may upload/delete within their own path.

Any Barber assignments use the existing earliest suitable-chair forecast and
physical arrival ordering. Each barber receives only the visits relevant to
their chair. They cannot read salon expenses, another barber's private work,
change historic sales or delete customer reviews.

## Hosted deployment and reset

Applied to BookMyTurn (`zgdirvhgrzsdrrcgugff`):

- `20261030082416_barber_workflow.sql`: protected context/state/command RPCs and
  new salon setup, live memberships, physical service lifecycle and appointments.
- `20261030083639_barber_profile_and_schedule_refinements.sql`: approved public
  `barber-avatars` bucket, per-barber upload rules and service/break validation.
- `20261030083905_barber_break_forecast.sql`: forecast/slot planning after a
  bounded break, preserving personal appointment conflict protection.

Public RPCs are invokers calling private privileged implementations with fixed
search paths, explicit grants and live membership checks. Business table writes
remain closed to apps. Mutation locks serialize salon activity; existing database
constraints and immutable service snapshots enforce completion accounting.

At the user's request, the guarded one-time
`supabase/admin/reset_seeded_salon_demo.sql` removed the original 13 demo salons
and dependent test visits. It preserved Auth accounts, private customer profiles,
shared hairstyle references and expense categories. Verified afterward: zero
salons/barbers/queue entries/appointments, one existing login account and 23
hairstyle references. It is not a migration or app startup behavior and must not
be used to erase future user-created salons. Historical seed migrations remain
immutable and fresh CI databases still contain their original test catalogue.

## Validation and remaining gates

- Both workspaces: lint and TypeScript checks pass; shared Auth/config/session
  suite passes all 22 tests. Public-key hosted probe passes with confirmation off
  and a legitimately empty catalogue.
- Barber: eight browser journeys pass, covering signup/setup, walk-in to
  completion, appointment handling, access revocation, photo upload and responsive
  navigation at 320/393/430 px. Queue/profile screenshots were visually inspected.
- iOS and Android Hermes bundle exports pass; web export is checked in CI.
- Hosted `supabase/tests/barber_workflow.sql` passes under actual anon/authenticated
  roles, including cross-account isolation, deactivation, break conflict, customer
  alternatives/acceptance, completion/review and one-sale/commission behavior.
  All SQL fixtures roll back; no persistent test logins or salons were created.
- CI runs the full historical Customer database suites plus this Barber suite
  against PostgreSQL 17, both web exports and both browser suites.
- Security advisors report no database/storage findings. The pre-existing Auth
  warning is disabled [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection);
  this feature does not change that setting.

User verification on physical iPhone/Android, native photo picker/upload, session
restoration and PR acceptance remain unchecked. Browser uploads are mocked; SQL
tests exercise hosted authorization, not a real native image picker. Figma's
Starter-plan tool limit still blocks new Barber frames; the implementation uses
the already approved Customer light/charcoal DM Sans design. No new Figma screens,
push/SMS delivery, public QR hosting or Owner accounting are claimed.
