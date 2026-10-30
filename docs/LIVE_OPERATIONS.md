# Live salon operations and staff Activity

Implemented after phone-test feedback on 30 October 2026. Existing user accounts,
salons, queues, appointments and photos are preserved.

## What was wrong

The reported Neel visit existed in Supabase as `joined`, `remote`, with no preferred
or assigned barber. The old Manager salon page displayed physical `arrived` counts
and team setup, but no incoming visit list. The barber API also omitted remote
Any Barber visits until physical forecasting could allocate them. There were no
staff events for a customer joining a queue.

Remote intent and physical waiting remain different states. The fix exposes both
clearly instead of changing remote intent into an arrival. Inspection of the real
account after migration confirmed the existing join in the salon's queue with
incoming=1 and physical waiting=0; no customer entry was recreated or moved.

## Interface research and resulting design

Primary references were [Fresha's scheduling product](https://www.fresha.com/for-business/features/scheduling)
and its official mobile calendar image, and [Booksy's calendar/scheduling product](https://biz.booksy.com/features/calendar-scheduling)
and mobile screenshots. Fresha's staff columns and date-focused calendar informed
the staff/date controls. Booksy's short appointment summaries and contextual
actions informed the visit rows. These are design interpretations, not a claim
that our UI duplicates those products.

The implementation replaces large decorative location covers and setup-first
pages with compact location cards, real activity counts, a warm light canvas,
charcoal controls, restrained sage/amber status tags, persistent Activity access
and Queue / Agenda / Team / Details navigation. Appointment requests remain visible
across dates, so tomorrow's request is not hidden by a Today filter. Confirming a
request selects its date in the agenda immediately. Imported competitor screenshots
are research artifacts only and are not shipped in the app. No copied branding,
new Figma frames or generic image-generated mockups are claimed. The Figma Starter
tool limit was checked again and still blocked design-system access.

## Test it

```powershell
cd C:\Users\pc\Mobile-Apps\BookMyTurn
npm run manager:tunnel
```

Reload the app after updating. Sign in with the existing account; open the salon
whose card shows an incoming visit. Multiple locations may share a brand name,
so check each card's address and activity count.

1. In Customer, join with **Any Barber** without marking arrival. Manager shows
   **On the way**, the reference, service and a **Mark arrived** action. The physical
   waiting count remains zero. Eligible employee chairs also see this shared intent.
2. Manager receives an Activity event/unread badge and an in-app banner when new
   updates arrive after initial loading. The initial load displays unread history
   without playing old alerts again. The same Auth account may test both apps:
   customer-side joins/bookings still generate an unread staff event.
3. **Mark arrived** moves that same visit into **Waiting**, preserves arrival
   ordering and can be retried without adding another arrival or event. QR arrivals
   appear in Waiting immediately without an Auth account. Cancelling from Customer
   removes the visit from the active board and adds a cancellation event.
4. **Open chair** enters the allocated barber's operational flow for price
   agreement, service start/finish and review eligibility. Incoming intent is not
   automatically assigned as a physical customer. Unavailable staff/capacity stays
   explicit instead of inventing a service time.
5. In Customer, request a future appointment. Manager's Queue highlights the
   request; Agenda lists requests across dates. Confirm, decline or suggest another
   time. Confirmation preserves the held capacity and selects the booked date.
   Customer sees the server result after its normal focus/foreground/poll refresh.
6. Activity links to the corresponding queue/agenda, supports All/Unread and
   persists read state. **Mark all read** affects only the signed-in account.
7. Account offers optional **Phone alerts**. On a phone, grant the OS permission
   using its explicit button. New updates can produce a sound/banner while the app
   runs; tapping one opens Activity for that signed-in account. Disable the option
   to stop future phone alerts. The in-app inbox remains available either way.

Closed-app remote push is not configured. Local notifications do not provide an
always-running background connection. Android remote push is unavailable in
Expo Go from SDK 53; a development/release build and platform push configuration
are required for that delivery path. See [Expo SDK 57 Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

## Synchronization and privacy

Private `staff_alerts` rows contain a recipient, salon, optional assigned barber,
visit link, event key, generic text and read timestamp. Database triggers capture
queue joins/arrivals/cancellations and appointment requests/customer acceptance.
A held appointment alerts its actual held barber; other employee chairs do not
receive that appointment. Owners receive all of their salon's relevant events.
Only explicit staff actions auto-read their own event; using Customer with the
manager's email does not suppress its alert.

Each recipient gets an empty private Realtime `changed` broadcast on their own
`staff:<user-id>` topic. No name, phone, visit record or receipt token is broadcast.
The app refetches authorized RPCs, debounces invalidations, coalesces overlapping
refreshes and ignores old-account responses. A five-second foreground poll and
foreground/focus refresh cover disconnections. The UI reports the actual channel
state; a disconnected channel is not labelled Live. Temporary network errors keep
the last verified view with an error message; authoritative access errors clear it.

Read and mutation APIs recheck active memberships. Owners operate their own salon;
employees retain assigned-chair access and eligible shared incoming intent.
Private-channel authorization and inbox filters prevent cross-account access.
Phone alerts intentionally omit customer names and phone numbers.

Applied migrations: `20261030112143_manager_live_operations`,
`20261030112906_staff_shared_incoming`, and
`20261030114533_staff_alert_actor_context`. Generated public types are updated.
The Supabase logs connector returned an internal error; diagnosis used the actual
stored visit, guarded API output, role regression tests and security advisors.
Advisors show no database/storage findings; the existing development Auth
[leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
is unchanged. Email confirmation remains disabled.

## Validation and limits

- Hosted live regression passes remote Any Barber visibility, no false physical
  count, idempotent check-in, cancellation, durable/read alerts, same-account
  customer joins, assigned appointment targeting, employee isolation, private
  Realtime topic filtering and deactivation. All fixtures roll back.
- Existing hosted Barber and multi-salon suites also pass after the new triggers.
- Twenty Manager/Barber browser journeys pass. The new cross-app test runs Customer
  and Manager on separate test servers/contexts and exercises an actual Customer
  join, private-channel invalidation, live Manager update, check-in reflected in
  Customer, future booking/confirmation and persisted inbox read state. A second
  journey verifies account-free QR arrival; responsive boards cover 320/393/430 px.
- Browser backend/Socket responses are mocked shared fixtures. Hosted SQL tests
  verify actual authorization and business rules; a real hosted Socket/device
  notification delivery is still a phone verification gate. Screenshots were
  inspected for the location list, live queue and agenda.
- Both app lint/types and 22 shared Auth/config/session tests pass; Manager native
  iOS/Android bundle exports and Expo Doctor 21/21 pass. CI runs both web exports,
  all 21 Customer browser journeys and all PostgreSQL 17 migration/role suites.

Manager browser tests now use ports 8085 and 8086; keep both free. They open no
visible browser window. Physical native notification permission/sound/tap checks,
phone acceptance and PR review/merge remain pending.
