# BookMyTurn implementation plan

Plan prepared: 29 October 2026 (Asia/Colombo).

Current stage: planning PR. No application implementation or Supabase database
changes have been made. Milestone 00 is awaiting user review.

## 1. Agreed direction

- React Native with Expo and TypeScript for the mobile applications.
- Supabase Postgres and Auth for real persistence and account/session handling.
- A Customer app and a Salon Manager app, sharing domain types and behavior.
- The Manager has Owner, Barber and Queue Coordinator experiences.
- Start authentication in the Salon Manager. Customers keep account-free salon
  discovery and the QR queue journey. This starting scope follows the preceding
  recommendation accepted in conversation; revisit it before coding if needed.
- Akurana, Sri Lanka only; exactly the 13 salon names in the customer specification.
- Royal Saloon is the primary salon for end-to-end development and verification.
- Black/navy backgrounds, cyan `#14A3C7`, white/light-grey text and dark cards.
- Clearly labelled fictional salon, service and financial demonstration data.
- Real payments, real SMS, external accounting and inventory remain out of scope.
- Build and verify one milestone at a time. Use a PR for each feature; never push
  feature work directly to `main` or merge it without the user's review.

Source requirements: [Customer](../idea/customer.md) and
[Salon Manager](../idea/manager.md). `manager.md` replaces the earlier `owner.md`.
The newer decisions above supersede the original specifications' local-only
storage and simulated-authentication instructions. The other product requirements
still apply.

### Queue and appointment rules accepted in conversation

- Remote queue joining registers intent; physical check-in establishes physical
  queue order. Remote registration does not reserve a physical position.
- Only physically arrived customers waiting for service count as waiting.
- Starting service removes a customer from the waiting count immediately.
- Confirmed appointment time is reserved when estimating walk-in availability.
- When service is unspecified, use a configurable default haircut duration;
  recalculate when the service is selected or changed.
- Preserve a specific-barber preference unless an authorised, agreed change occurs.
- Any Available Barber uses earliest suitable service availability, including
  durations, existing work, confirmed appointments, hours and breaks.
- Late-arrival grace periods and no-show thresholds still need an explicit policy
  before the appointment milestone. No automatic penalties will be invented.

## 2. Delivery and validation workflow

For each milestone:

1. Confirm the previous milestone is validated and user-reviewed. Create a branch
   from up-to-date `main`, such as `feat/03-manager-auth`.
2. Implement only that milestone. Add database migrations alongside the feature
   that requires them; do not build the entire schema upfront.
3. Run relevant checks. For database changes, exercise real development-project
   behavior and row-level security with separate test identities. For UI changes,
   verify the runnable screen on the agreed phone/emulator and browser preview.
4. Open a PR with the change, validation evidence, migration instructions, manual
   test steps and any remaining limitations. Never include local secrets.
5. The user verifies the result. Fix findings on that same branch and repeat the
   affected checks. Do not call a milestone complete while a required check fails.
6. After acceptance and merge, tick the milestone's completion box and record its
   PR and evidence. If merge happens after the checklist commit, reconcile that
   status before starting feature work on the next milestone.

A milestone may need separate database and UI PRs when that makes review safer.
Each must state its deployment order and remain compatible with the current app.
Passing one sub-PR does not mark the entire milestone complete. Do not merge PRs
automatically. A request to stop at a verification gate takes precedence over
continuing through this plan.

Use these three progress markers consistently:

- Implemented: the intended change exists.
- Validated: relevant checks passed and evidence is recorded.
- Complete: the user verified the result and the PR was merged.

Only mark a box when the condition has actually been met. Failed, pending or
unavailable checks stay visible. Update the current-stage line with each gate.

## 3. Intended project structure

Create an npm workspace during milestone 01:

```text
apps/
  manager/                 Expo app: Owner, Barber, Queue Coordinator
  customer/                Expo app: added in milestone 06
packages/
  domain/                  Shared types, state rules and scheduling logic
  ui/                      Shared theme/components as they become reusable
supabase/
  migrations/              Versioned schema, policies and database functions
  tests/                   Database invariants and access-control checks
  seed.sql                 Deterministic fictional development data when needed
docs/
  IMPLEMENTATION_PLAN.md   This plan, checklist and validation evidence
```

Keep shared packages small; extract shared behavior when it is needed. Each Expo
app will have its own runtime configuration; document environment loading without
assuming Expo automatically reads the root `.env` from a workspace child.

Supabase is the source of truth. Local storage is for session persistence and
appropriate UI state, not a second authoritative queue or financial database.
Commit schema changes as migrations; provide SQL Editor instructions while no
authenticated migration tool is configured. URL and publishable key permit app
access but do not grant permission to deploy schema migrations.

Use database constraints and transactions for operations that must happen once.
Enforce permissions in the database, as well as presenting role-appropriate UI.
Keep private account/contact information separate from public salon/barber data.
Store timestamps consistently and display salon schedules in Asia/Colombo.

## 4. Milestones

### 00. Agree the plan and PR workflow

- [x] Implemented: write this plan, protect `.env`, document configuration names,
  preserve the original specifications and add a PR checklist.
- [ ] Validated: review the planning diff, confirm `.env` is ignored and absent
  from tracked files, and open the planning PR.
- [ ] Complete: user accepts the plan and the planning PR is merged.

Acceptance: the build order, verification gates, customer guest journey and
feature-PR workflow are clear. No app or database implementation belongs in this PR.

### 01. Bootstrap the Manager app and development checks

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: npm workspace, Expo Manager app, TypeScript, navigation shell, brand theme,
safe-area/keyboard handling, environment example/loading, and basic CI for lint,
type checks and applicable tests. Choose a stable Expo SDK compatible with the
actual test device at implementation time. No salon features yet.

Acceptance: clean install and documented commands work; the branded shell runs
on the agreed phone/emulator and web preview. Missing configuration gives an
actionable message. CI passes. Do not expose secret values in logs.

### 02. Connect Supabase and establish the account database

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: Supabase client/session lifecycle; minimal account profile linked to
`auth.users`; server-controlled profile creation; required timestamps, constraints
and row-level security. No custom password table or business-role fields that a
user can edit to promote themselves. Keep migrations reproducible.

Acceptance: connectivity works with the publishable key. Two test users can read
and update permitted fields on their own profiles; neither can access or alter
the other's private record. An unauthenticated caller cannot access private
profiles. Record migration execution and cleanup evidence, not just SQL review.

### 03. Manager sign-up, sign-in and account lifecycle

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: email/password sign-up and sign-in; password visibility and confirmation;
input validation; clear loading/error states; email-verification state and callback
handling; restored sessions; sign-out; password reset and update flow. Configure
development redirect URLs and agree the email-delivery setup before email tests.
Newly registered users initially have no salon-management privileges.

Acceptance: valid/invalid registration and login, email confirmation, reset,
restart/session restore and logout work on the target device. Unconfirmed users
are not treated as signed in when confirmation is required. Protected navigation
does not flash private content. Repeated taps do not create duplicate submissions.
User verifies the working authentication flow before we start salon features.

### 04. Salon membership, roles and authorised staff onboarding

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: salon memberships and permission checks; Royal Saloon development setup;
Owner, individual Barber and Coordinator identities; membership-aware entry and
navigation; owner-managed staff onboarding/deactivation. Bootstrap the first
development owner through a trusted administrative action, never a public role
selector or editable user metadata. Use a server-side administrative function if
staff invitations require privileged Auth operations; no privileged key in Expo.

Acceptance: test each role's allowed and denied operations against the database.
Public sign-up cannot claim an existing salon or assign Owner privileges.
Unaffiliated accounts see a clear access-pending state. Deactivated memberships
lose salon access without deleting historical records. Owner finance access is
restricted from the start, before reports exist.

### 05. Salon settings, services and public barber profiles

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: approved salon identities; hours, open/closed status, per-salon services,
price ranges and durations; configurable default duration; public barber bios,
photos, experience and specialities; working hours, availability and breaks.
Owner controls price/hours permissions. Seed fictional data with stable IDs.

Acceptance: permitted edits persist and public profile data excludes private
account/contact fields. Validate price/duration/hours inputs. Barbers can edit
their own permitted profile fields; cannot edit another barber's settings.
Owner sees staff availability. Closing does not delete any records.

### 06. Customer app, salon discovery and QR entry

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: second Expo app; Home, Salons, My Queue and My Appointments navigation;
exactly the specified 13 salons; search, sorts and open-only filter; salon detail
and barber profile screens; demo timestamps/stale-state messaging; Royal Saloon QR
route and scan simulation. Add only real shared UI/domain modules needed here.

Acceptance: all names match the specification. Search and all sorting/filter
controls work. QR entry prominently offers Join Queue without requiring account
creation or a hairstyle. Manager profile/settings edits appear in customer views.
Unavailable future actions are clearly labelled until their milestone lands.

### 07. Appointment requests and confirmed schedule reservations

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: optional-customer-identity strategy using a silent Supabase anonymous
session for private guest records, subject to confirming project support; no
customer sign-up screen required. Customer requests, manager responses, alternate
time acceptance, cancellation and appointment arrival; in-app notifications.
Agree grace period/no-show and cancellation rules before implementation.

Acceptance: requests begin pending. Salon acceptance confirms the requested time;
an alternate time confirms only after customer acceptance. Confirmed barber time
cannot overlap under concurrent requests. Check-in updates the existing appointment
without creating a walk-in. Customers access only their own private records and
staff only authorised salon records. Cross-device recovery for anonymous guests
needs an explicit later recovery mechanism; do not imply it already exists.

### 08. Queue database, transitions and availability estimates

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: queue references, source, customer identity, barber preference/assignment,
arrival/service timestamps and constrained transitions; shared scheduling logic
using current work, arrived customers, service duration, reserved appointments,
hours and breaks. Define estimate refresh/freshness and tie-breaking behavior.

Acceptance: scenario checks cover a shorter queue with longer work, breaks,
appointment conflicts, unspecified duration and a specific-barber preference.
Remote entries do not consume a physical position. Check-in order is stable.
Closed salons reject new immediate-service entries on the server. Concurrent
joins cannot create duplicate active entries for the same customer and salon.

### 09. Customer join, confirmation, check-in and My Queue

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: choose specific/any barber; optional service and contact details; join
confirmation, unique reference, physical-presence confirmation for QR customers,
arrival simulation, My Queue and permitted cancellation. Preserve guest identity
across restarts. Contact details are not a mandatory account requirement.

Acceptance: one active entry survives repeated taps/restart. Remote joining leaves
physical counts unchanged; check-in increments once; cancellation adjusts the
correct count. Existing entry is shown on rejoin. Closed/stale/unavailable states
are explicit. My Queue reflects staff updates without exposing other customers.

### 10. Staff queues, fast check-in and walk-ins

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: Owner/Coordinator salon queue, Barber's own queue, code lookup, Mark Arrived,
fast Add Walk-in, permitted corrections/reassignment, cancellations and no-shows.
Record who changed operational state and when. Respect appointment arrival as a
separate workflow and preserve explicit barber preferences.

Acceptance: code lookup checks in the existing record without duplication.
Walk-ins start physically arrived. Authorised users see consistent shared counts;
barbers cannot change another barber's work without permission. Reassignment is
explicit and audited. Repeated check-in and simultaneous staff actions are safe.

### 11. Hairstyle gallery and shared customer preferences

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: the specified hairstyle categories, image enlargement, multi-selection,
optional notes and submission linked to the relevant customer service request;
barber view and Viewed state. Choose appropriately licensed image assets/storage.

Acceptance: customer-selected images/notes appear for the correct barber/customer
reference, persist and can be acknowledged. Another customer cannot read them.
Joining remains possible without selecting a hairstyle. Gallery categories do not
promise salon availability or fixed prices.

### 12. Start/finish service, sales and commission integrity

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: a service record linked to its queue entry or appointment; pre-service
agreed price and customer agreement; Start Service; Finish Service with extras,
final amount and required reasons/consent outside the range. Preserve price and
commission-rule snapshots. Add configurable transparent commission eligibility
and split; no actual payment processing. Keep commission accrual/payment tracking
separate from service revenue.

Completion is one database transaction: finish the service, create exactly one
sale, create any eligible commission record and establish review eligibility.
Do not ship a completion action that can bypass sale creation. Implement minimum
sales/commission records here; detailed owner reporting follows later.

Acceptance: starting decreases waiting once and prevents overlapping active work
for a barber. Duplicate completion/retry/reload creates one sale and one applicable
commission. Queue joins and appointment requests create no revenue. No-shows,
cancelled/incomplete services and excluded walk-ins create no commission.
Both queue and appointment services can finish; the customer sees completion.

### 13. Verified reviews and barber ratings

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: 1–5 stars and optional written review for completed services; own-service
eligibility; one review per completed service; public profile/salon summaries;
barber read-only feedback; owner moderation flagging without silent deletion.

Acceptance: incomplete, cancelled and no-show work cannot be reviewed. Repeated
submissions do not duplicate ratings. Review belongs to the correct salon/barber,
and averages/counts update consistently across apps. Review eligibility is
enforced in Supabase, not just by hiding a button.

### 14. Owner sales, expenses and estimated profit

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: sales/history filters; authorised sale corrections with audit trail;
expense categories, paid/unpaid status, recurring reminder records and separate
capital purchases; commission accrued/paid tracking; summary dashboard with
period selectors. Choose and document the simplified profit calculation so wages,
barber commissions and BookMyTurn commission are not counted twice.

Acceptance: dashboard totals reconcile to underlying records. Adding/correcting
transactions updates the right periods and totals. Expected unpaid expenses are
not shown as paid; capital purchases are distinguished from operating expenses.
No Barber/Coordinator financial access unless explicitly granted. Profit is
labelled an estimate based on recorded demo transactions.

### 15. Performance, permissions and audit review

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: daily/weekly/monthly summaries; barber service counts, revenue, duration,
ratings and availability; date filters; owner permission management UI and audit
history viewer. Audit important actions as their earlier features are introduced;
this milestone brings those records together rather than adding logging late.

Acceptance: summaries reconcile to services/sales/reviews. Barbers see only their
own detailed performance unless authorised. Role grants/revocations take effect
in database operations as well as navigation. Financial corrections and operational
changes retain actor, timestamp and change details.

### 16. End-to-end verification and demo readiness

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: resolve integration findings; loading/empty/error/offline states; keyboard,
touch-target and accessibility review; stale-data/reconnection handling; safe
fictional demo reset/seed procedure; phone/emulator and browser walkthroughs.
No new product scope in this milestone.

Acceptance: demonstrate all of these against the same Supabase development data:

1. QR/customer joins -> receives code -> checks in -> shares styles -> barber
   starts and completes service -> one sale/commission -> eligible customer review.
2. Customer requests appointment -> salon accepts, suggests or declines -> customer
   accepts an alternative when needed -> arrival -> service -> sale -> review.
3. Owner opens/closes -> monitors staff/queues -> records expenses -> reconciles
   sales, commission, estimated profit and performance.
4. Concurrent/repeated actions, restricted-role access, restart/session restoration
   and reconnect do not produce duplicate or contradictory business records.

Document the commands, migrations, environment setup, test identities, limitations
and test evidence needed for another developer to reproduce the demo. Verify no
private credentials/contact data appear in repository history or public screens.
Native store submission/production release requires a separately agreed milestone.

## 5. Decisions to resolve at the appropriate gate

- Milestone 01: Android/iOS target device, Expo Go versus development build and
  stable SDK compatibility; package/workspace environment loading.
- Milestone 02: development Supabase project identity, schema migration execution
  method and whether any existing database records must be preserved.
- Milestone 03: email confirmation/SMTP behavior, redirect URLs and callback test
  environment. Keep confirmation enabled unless a development-only change is agreed.
- Milestone 04: trusted first-owner bootstrap, staff invitation method and minimum
  permission defaults. No open self-selection of an owner role.
- Milestone 07: anonymous guest support, identity recovery limitations, appointment
  grace period, cancellation/no-show policy and who may accept each request.
- Milestone 08: scheduling estimate policy, refresh interval, handling of unknown
  break end times and priority when appointment arrivals are late.
- Milestone 12: qualifying queue/appointment sources, exact commission allocation,
  price-consent behavior and how actual commission payments are recorded.
- Milestone 14: explicit treatment of unpaid expenses and commissions in the
  simplified profit calculation and period/date boundaries.

Resolve these before implementing their dependent behavior; do not block earlier
independent milestones on later business decisions.

## 6. Validation evidence and PR log

Append one entry per milestone, including failed or outstanding checks. Never put
credentials, access tokens, real customer data or account passwords in this log.

### Milestone 00 — planning

- Implemented: implementation plan, repository entry point, PR template and local
  environment-file protection. Original product specifications remain unchanged.
- Validation: staged diff passes `git diff --cached --check`; all 17 milestone
  sections are present; `.env` is ignored/untracked and its values are absent
  from staged files; remote `main` matches the local starting commit. Planning
  PR creation is pending. No app/database tests apply to this documentation change.
- PR: pending.
- User verification: pending.
- Merge: pending.

### Entry format for subsequent milestones

```text
Milestone:
PR:
Implemented:
Automated checks and results:
Database checks and results:
Manual device/browser checks and results:
Outstanding checks or limitations:
User verification:
Merge:
```
