# Simple haircut visits

This direction supersedes the service catalogue and upfront-price screens in the earlier Customer/Manager plans. The primary customer decisions are a salon, an optional barber, a date/time for appointments, and an optional haircut photo.

## Customer experience

The **Haircuts** tab holds **My photos** and **Explore styles**. Signed-in customers can upload a JPEG/PNG/WebP image up to 2 MB, save public inspiration, rename saved pictures and remove them from their library. Their uploads use a private Storage bucket. Public inspiration remains publicly sourced; the saved-favourites list is private.

Queue joining and appointment booking show a small optional photo selector. **No photo** is the default. Uploading from this selector saves the picture to the customer's gallery and selects it. The selected photo is attached in the same database transaction as the visit, so invalid ownership cannot leave a partially created booking. No service name, price range or price agreement is submitted.

Appointment times still come from Supabase. The salon's stored average haircut duration drives new bookings; existing held appointments keep their original durations. Physical waiting, barber availability, opening hours, breaks, existing reservations and the customer's own booked time continue to constrain capacity. Guest QR arrivals remain account-free; they do not create anonymous Auth accounts. A guest without an account does not have a private gallery to select from.

The six-digit number on a visit is its **customer code**. Codes are unique across active queue entries and appointments within a salon. A completed code may eventually be reused. These numbers are lookup aids, never authentication or guest receipt credentials: UUID identities and private QR device tokens remain unchanged.

## Manager and barber experience

Creating a salon asks for its name, address, optional cover and opening hours. Creating a barber asks for their profile, with no offered-service requirement. No hidden service or dummy price is inserted. Existing catalogue data stays in the database for legacy history and older clients, but the current apps do not list or edit it.

The salon board filters by numeric customer code and can switch to the matching appointment's date. An assigned barber can check in a remote customer by entering their six-digit code. Lookup stays within the authenticated salon/chair permissions.

The barber sees a selected haircut reference on the relevant visit and on the start screen. Private image access is limited to the customer, the owning manager and authorized staff for that visit. Unassigned incoming customers can be prepared by that salon's eligible staff; physical queue allocation narrows the relevant chair after arrival. Unrelated chairs/accounts cannot read the private photo.

**Start haircut** has no amount, service selection or agreement checkboxes. **Complete haircut** has one required final-price field. The server records the final amount, completion and exactly one sale atomically; retries cannot record a second sale. New sessions have no invented upfront price or customer-agreement timestamp. Already-started legacy sessions retain their original snapshots and finish through the compatibility handler.

Removing a gallery item hides it from the saved library. An already shared reference retains its photo and title for the visit. Signed photo URLs expire after 60 seconds; already downloaded content and already issued URLs cannot be withdrawn instantly. The apps discard photo state across account changes.

## Validation and prompts

Empty required fields are checked on Submit, outlined in red and paired with a concise message. This applies to salon/barber/account names, address, hours, sign-in/sign-up, photo names, appointment time, final price, review rating, break duration and suggested time. Empty required values do not silently call the API. Optional photos/contact fields remain optional.

Service/price menus, pre-service price/surcharge prompts, public demo controls, repeated add/share explanations and the simulated-QR shortcut are removed. Destructive-record confirmations and necessary OS photo selection permissions remain.

## Verification and deployment

`supabase/tests/simple_haircut_workflow.sql` creates isolated fixtures in a transaction and rolls them back. It covers service-free salon/team setup, gallery ownership/retries/removal, atomic reference attachment, booking overlap, numeric codes/check-in, correct-chair image access, queue and appointment completion and one-sale accounting. The existing multi-salon test also finishes an already-started legacy session through the new completion action.

Fresh PostgreSQL CI includes a metadata-only Storage stand-in so the actual bucket-policy DDL and RLS execute, including anonymous/unrelated-chair denial and retention of shared objects. CI-only metadata operations are guarded in a procedural branch and are never issued against hosted Storage. Browser tests cover uploads, signed-photo requests and complete user journeys against mocked APIs. Physical-device acceptance remains separate.

The apps' lint/types, shared Auth/session tests, browser regressions and iOS/Android/web exports are checked before handoff. Full CI status is recorded on [PR #14](https://github.com/nadhirhasan/BookMyTurn/pull/14), stacked on #13. No PR is automatically merged.

**Deployed on 31 October 2026:** migration `20261031101745_simple_haircut_workflow.sql`, aligned local migration history and regenerated public types. The new haircut suite, multi-salon/legacy-completion suite and live-operations suite pass on hosted Supabase with rollback. The older seeded overlap suite runs in fresh CI; the new self-contained hosted suite verifies held-time and personal overlap without relying on seeded salons.

A real API test passed immediate signup with verification disabled, private photo upload/download, gallery save/list/rename/remove, unrelated-account signing denial and anonymous download denial. Both disposable accounts were globally signed out and deleted, and their upload was removed. Security advisors report no schema/RLS findings; the pre-existing [leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains disabled and was not changed by this feature.

The user explicitly requested a clean start. All application tables were cleared, the three previous Auth accounts and their sessions were deleted through the admin API, and two existing uploads were removed through the Storage API. Final checks show every app table, Auth users/sessions and Storage objects empty. Schema, policies, private/public bucket definitions, migration history and project settings remain. No automatic data reseeding was added. Sign out of old app sessions and create fresh accounts.

For device acceptance after deployment, run `npm run start:tunnel` for Customer and `npm run manager:tunnel` in a second terminal for Manager. Save a picture, attach it to a queue/booking, find the customer by code, check them in, view the photo, start without a price and complete with the actual amount.
