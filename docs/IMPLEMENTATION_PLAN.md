# BookMyTurn implementation plan

Plan prepared: 29 October 2026 (Asia/Colombo).

Current stage: design-first charcoal/champagne dark-theme review. The user supplied
a neon dark reference and requested a non-neon alternative with smooth transitions.
[Interactive design preview and approval checklist](../design/charcoal-champagne/README.md).
Ten sample views and an eight-screen board are prepared; application implementation
awaits the user's review. Figma editing is blocked by the account's Starter tool limit.

Previous stage: salon map pins and customer directions. Managers select and confirm
the salon entrance on a map, optionally using their current location. Customers open
the saved coordinates in Google Maps or Apple Maps. See [the location plan](SALON_LOCATION_PLAN.md).
Local database, browser, unit and native/web export validation passed in
[PR #25](https://github.com/nadhirhasan/BookMyTurn/pull/25). Hosted migration,
permissions and rolled-back fixture cleanup are verified. Phone map/GPS acceptance pending.

Previous stage: owner barber performance analytics, with daily/weekly haircut counts,
generated revenue, charts, calendar filters and individual barber results. See
[the research, implementation and validation checklist](OWNER_PERFORMANCE_ANALYTICS.md).
Local database, mobile browser, lint/types and native-export validation passed in
[PR #24](https://github.com/nadhirhasan/BookMyTurn/pull/24). Hosted analytics migration
applied and SQL/permission/fixture-cleanup checks passed. Phone acceptance pending.

Previous stage: calendar and database-backed time selection for barber appointment alternatives.
See [the picker plan and validation](BARBER_APPOINTMENT_PICKER.md).
Implemented and locally validated in [PR #23](https://github.com/nadhirhasan/BookMyTurn/pull/23); phone review pending.

Previous stage: single-step customer queue with staff-led service progression. See
[the implementation, migration and validation checklist](SINGLE_STEP_QUEUE.md).
Implemented and locally validated in [PR #22](https://github.com/nadhirhasan/BookMyTurn/pull/22);
hosted migration applied and definitions/permissions verified. Phone acceptance pending.

Previous stage: guided customer, manager and barber workflows. See
[the audit and delivery checklist](GUIDED_WORKFLOWS.md) and
[mobile screen review](../design/reviews/guided-workflows/README.md).
Implementation and local validation complete in
[PR #21](https://github.com/nadhirhasan/BookMyTurn/pull/21); phone review pending.

Previous stage: replace the coral brand accent with eucalyptus and sage across all
apps. See [the colour research, contrast checks and previews](COLOR_DIRECTION.md).
Implemented in [PR #20](https://github.com/nadhirhasan/BookMyTurn/pull/20); phone review pending.

Previous stage: Manager and Barber mobile UI/UX redesign, implemented in
[PR #19](https://github.com/nadhirhasan/BookMyTurn/pull/19); phone review pending. See
[the staff delivery checklist](STAFF_UX_REDESIGN.md) and
[the screen review](../design/reviews/staff-redesign/README.md).

Previous stage: customer-first end-to-end UI/UX redesign, implemented in
[PR #18](https://github.com/nadhirhasan/BookMyTurn/pull/18); phone review pending. See
[the research and delivery checklist](CUSTOMER_UX_REDESIGN.md) and
[the screenshot review](../design/reviews/customer-redesign/README.md).
The user confirmed Customer first and subsequently authorized Owner/Barber redesign.
Calendar selection, explicit appointment review and completion-only pricing remain.

Previous stage: owner sales, expenses, estimated profit and reports. See
[OWNER_ACCOUNTING_PLAN.md](OWNER_ACCOUNTING_PLAN.md) and
[the accounting workflow](OWNER_ACCOUNTING_WORKFLOW.md). Pricing remains
completion-only; services and displayed ranges remain deferred. This feature
is deployed in [PR #17](https://github.com/nadhirhasan/BookMyTurn/pull/17).
Local and hosted verification pass; business records are preserved. User phone
acceptance remains pending.

Previous stage: invited barber accounts and restricted operational access. See
[BARBER_INVITATIONS_PLAN.md](BARBER_INVITATIONS_PLAN.md). Implement invitation
creation, acceptance and revocation, financial privacy and stale-data safeguards
in [PR #16](https://github.com/nadhirhasan/BookMyTurn/pull/16). Local and hosted
checks pass; the approved migrations are deployed and current records are
preserved. User phone acceptance remains pending. Owner accounting and public QR
hosting follow as separate validated features.

Previous stage: haircut collections and full-screen previews. See
[HAIRCUT_COLLECTIONS_PLAN.md](HAIRCUT_COLLECTIONS_PLAN.md) and
[the collection workflow](HAIRCUT_COLLECTIONS_WORKFLOW.md). Local and hosted
checks pass; the approved migration is deployed and current data
is preserved. User phone acceptance remains pending.

Previous stage: simple haircut visits and private customer photo references. See
[SIMPLE_HAIRCUT_PLAN.md](SIMPLE_HAIRCUT_PLAN.md) and
[the new workflow](SIMPLE_HAIRCUT_WORKFLOW.md). Service catalogues and upfront
prices are superseded. Hosted deployment and the explicitly requested clean
reset are verified. User phone acceptance remains pending.

Previous stage: Manager salon, barber and service CRUD. See
[MANAGER_CRUD_PLAN.md](MANAGER_CRUD_PLAN.md) and
[the management guide](MANAGER_CRUD_WORKFLOW.md). Removal preserves history and
blocks active visits. User device acceptance and PR review remain pending.

Previous stage: phone-test feedback — live salon operations, staff Activity and
Manager UI redesign. See [LIVE_OPERATIONS_PLAN.md](LIVE_OPERATIONS_PLAN.md).
Remote Any Barber joins must be visible as incoming without inflating physical
waiting; user phone revalidation and PR acceptance remain pending.

Previous stage: Manager accounts, multiple salons and barber teams; see
[the manager delivery plan](MANAGER_IMPLEMENTATION_PLAN.md). One account manages
several salons and creates their barber profiles; the previous one-salon account
restriction is superseded. Existing salons, staff, accounts and visits are retained.

Previous stage: Barber workflow, authorised after the user accepted the customer
experience on 30 October 2026. See [the barber delivery plan](BARBER_IMPLEMENTATION_PLAN.md).
Barber implementation and hosted migrations are validated; user phone testing
and PR review remain pending. The authorised demo reset removed the original
salons and linked visits while preserving accounts and hairstyle references.
New salons are created through the Barber app's setup flow.
Customer implementation record: complete database-backed customer pipeline, authorised on 30 October
2026. The user explicitly replaced sequential feature gates with one integrated
customer delivery. Keep validation boxes and PR review; do not auto-merge.

### Integrated customer delivery checklist (30 October 2026)

- [x] Development Auth permits immediate email/password signup without emails.
- [x] Seed the 13 approved salons, staff, services, hours and hairstyle catalogue
  into Postgres. Never seed queue entries, bookings, ratings or customer records.
- [x] Replace frontend demo arrays and fixed counts/times with database queries,
  loading/error/empty states and refresh on focus / foreground / polling.
- [x] Implement server-calculated physical queues, earliest suitable barber,
  join / duplicate prevention / check-in / cancel / confirmation / My Queue.
- [x] Implement salon -> service/barber -> month calendar -> time -> request.
  Pending requests hold capacity until cancelled/declined; acceptance confirms.
  Server locks and overlap constraints arbitrate concurrent customers.
- [x] Implement My Appointments, cancellation, alternative acceptance and private
  in-app notifications. No automatic penalties or email/SMS integration.
- [x] Implement hairstyles/details/reference sharing and barber profiles/reviews.
- [x] Add explicit development-only simulation controls for the customer's own
  demo records so acceptance/service completion/reviews can be tested before the
  Manager app exists. Enforce both ownership and a private database setting.
- [x] Account-free physical QR arrivals: no Auth user, immediate arrived status,
  private device receipts, duplicate prevention and optional explicit app linking.
  Anonymous Supabase Auth remains disabled, as the user explicitly requested.
- [x] Hosted migration/role suites, real two-customer concurrency and isolation,
  20 browser journeys, lint/types, 22 unit tests and iOS/Android/web exports pass.
- [x] Open customer pipeline [PR #8](https://github.com/nadhirhasan/BookMyTurn/pull/8),
  document manual testing and deployment limits. Automated hosted fixtures cleaned.
- [ ] User iPhone/Android acceptance and review/merge. Implementing the flows
  does not mark user verification done. Final automated CI status is on PR #8.

Earlier stage record: customer sign-in/sign-up implementation (milestone 03), authorised
after the full database review. Verification/email flows are deferred by user
instruction. The user approved reusing the existing light style directly while
Figma's Starter-plan tool limit prevents account-screen edits.
The user approved the runnable customer UI and requested database integration.
Client/session handling and private profiles are implemented. The migration is
applied to the configured BookMyTurn project; hosted permission tests, cleanup,
public-key connectivity and anonymous-access denial passed on 30 October 2026.
Planning PR #1 is merged. Design PR #2 and discovery PR #3 remain open; this
feature is stacked on the discovery branch in a separate PR by user instruction
to continue. Completion boxes remain unchecked until acceptance and merge.

## 1. Agreed direction

- React Native with Expo and TypeScript for the mobile applications.
- Supabase Postgres and Auth for real persistence and account/session handling.
- The Customer app is the primary product; Salon Manager operations support the
  availability, queues and appointment responses that customers rely on.
- A Customer app and a Salon Manager app, sharing domain types and behavior.
- The Manager has Owner, Barber and Queue Coordinator experiences.
- Start with the Customer app foundation, database and optional customer sign-up /
  sign-in. Customers keep account-free salon discovery and the QR queue journey.
  Reuse authentication in the Manager app when its supporting workflows are added.
- Akurana, Sri Lanka only; exactly the 13 salon names in the customer specification.
- Royal Saloon is the primary salon for end-to-end development and verification.
- Updated visual direction: light backgrounds, charcoal text, neutral surfaces,
  salon photography and restrained controls informed by real booking apps. The
  user explicitly replaced the original dark/navy/cyan theme; do not reuse it.
- Clearly labelled fictional salon, service and financial demonstration data.
- Real payments, real SMS, external accounting and inventory remain out of scope.
- Build and verify one milestone at a time. Use a PR for each feature; never push
  feature work directly to `main` or merge it without the user's review.
- Design the customer journey in Figma before further screen development. Study
  real app references, create editable screens/components, validate the prototype
  and obtain user verification before translating it into React Native.

Source requirements: [Customer](../idea/customer.md) and
[Salon Manager](../idea/manager.md). `manager.md` replaces the earlier `owner.md`.
The newer decisions above supersede the original specifications' local-only
storage and simulated-authentication instructions. The other product requirements
still apply except the earlier theme instructions, which the user superseded
with the light, real-app-inspired direction above.

### Primary customer outcome

Help a customer answer: "Which salon can serve me soon, when is it likely to be
quiet, and can I request a slot instead of waiting?"

The main journey is compare salons and waiting times -> inspect estimated
availability for a service/barber -> choose when to visit or request an appointment
-> join/check in when appropriate -> track service status. Keep the QR shortcut.

Show current physical queue, estimated wait, earliest estimated service time,
opening status and data freshness together. As scheduling becomes functional,
show estimated visit windows around current work, confirmed appointments, hours
and breaks. Label forecasts as estimates; an empty queue now does not guarantee
zero waiting when the customer arrives. Do not fabricate historical quiet-time
trends or present a requested slot as confirmed.

Prioritise discovery, availability and appointment usability when making design
or scope decisions. Staff controls keep this information accurate; full financial
reporting remains a later milestone. Customer browsing must not be blocked by an
account screen.

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
   from up-to-date `main`, such as `feat/03-customer-auth`.
2. Implement only that milestone. Updated on 30 October 2026: create and verify
   the complete shared database first, as requested by the user; then integrate
   each app feature against it. See [DATABASE_PLAN.md](DATABASE_PLAN.md). Add
   later migrations when verified integration requirements change the model.
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
  customer/                Primary Expo app: created in milestone 01
  manager/                 Supporting Expo app: added in milestone 05
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
- [x] Validated: review the planning diff, confirm `.env` is ignored and absent
  from tracked files, and open the planning PR.
- [x] Complete: user accepted the plan and the planning PR is merged.

Acceptance: the build order, verification gates, customer guest journey and
feature-PR workflow are clear. No app or database implementation belongs in this PR.

### 00A. Customer design in Figma before UI implementation

- [x] Reference research: inspect official Fresha, Booksy and Treatwell screenshots.
- [x] Direction: record the customer tasks, screen inventory and review criteria
  in [the design brief](DESIGN_DIRECTION.md).
- [x] Figma foundation: connect access, create the editable file, token/type
  foundations, reusable components and the first three discovery screens.
- [ ] Figma journey: compose queue, arrival, appointment and account states and
  link the clickable prototype. Pending the Figma tool-call allowance.
- [ ] Validate: inspect actual Figma exports for layout, typography, density,
  contrast, images, state clarity and prototype navigation at iPhone dimensions.
- [x] User approved the three discovery screens and authorised their implementation.
- [ ] Complete: remaining journey/prototype validated and design PR merged.

Acceptance: the design shows how a customer compares salon waits, chooses when
to go, joins/checks in or requests a future time. Follow the real-app reference
patterns for useful information and navigation in a light, neutral visual system.
Marketing-style hero copy and generic benefit cards must not
displace the customer's primary tasks. Implement approved screens incrementally
under the remaining engineering milestones; a Figma design does not imply that
the corresponding backend feature has been implemented.

### 01. Bootstrap the Customer app and development checks

- [x] Implemented
- [x] Validated: automated checks and user acceptance of the runnable UI; Android
  physical-device coverage remains pending.
- [ ] Complete

Scope: npm workspace, Expo Customer app, TypeScript, navigation shell, brand theme,
safe-area/keyboard handling, environment example/loading, and basic CI for lint,
type checks and applicable tests. Choose a stable Expo SDK compatible with the
actual test device at implementation time. The user subsequently authorised the
approved discovery screens in this first feature; use local fictional data.
Persistence, QR entry and full discovery scope remain in milestone 04.

Acceptance: clean install and documented commands work; the branded shell runs
on the agreed phone/emulator and web preview. Discovery remains usable without configuration; document the connection setup
for milestone 02. CI passes. Do not expose secret values in logs.

### 02. Connect Supabase and establish the account database

- [x] Client/session source, profile migration and tests prepared.
- [x] Hosted migration applied.
- [x] Implemented
- [x] Validated
- [ ] Complete

Scope: Supabase client/session lifecycle; minimal account profile linked to
`auth.users`; server-controlled profile creation; required timestamps, constraints
and row-level security. No custom password table or business-role fields that a
user can edit to promote themselves. Keep migrations reproducible.

Acceptance: connectivity works with the publishable key. Two test users can read
and update permitted fields on their own profiles; neither can access or alter
the other's private record. An unauthenticated caller cannot access private
profiles. Record migration execution and cleanup evidence, not just SQL review.

### 02B. Complete shared database before further app integration

Added by user instruction on 30 October 2026. This supersedes incremental table
creation in later milestones; their UI/command validation gates still apply.

- [x] Complete domain and access plan: [DATABASE_PLAN.md](DATABASE_PLAN.md).
- [x] Additive schema and constraint/permission test suite prepared.
- [x] Fresh PostgreSQL validation passed.
- [x] Hosted schema applied and real-role verification passed.
- [ ] Complete: user acceptance and feature PR merge.

Scope: catalog, staff membership/permissions, schedules, queues, appointments,
hairstyle requests, actual services, sales, commission accrual/settlement,
operating/capital expenses, reviews, private notifications and audit history.
Schema creation does not complete later app features or open raw business writes.
Evidence: [SCHEMA_VALIDATION.md](../supabase/SCHEMA_VALIDATION.md).

### 03. Optional customer sign-up, sign-in and account lifecycle

- [x] Implemented: scoped pages and auth actions; see [CUSTOMER_AUTH.md](CUSTOMER_AUTH.md).
- [ ] Validated
- [ ] Complete

PR: [#6](https://github.com/nadhirhasan/BookMyTurn/pull/6), stacked on #5.
Runtime/source commit e998fae passed [CI](https://github.com/nadhirhasan/BookMyTurn/actions/runs/41001570662),
22 unit tests, 17 browser journeys and web/iOS/Android exports. Visual review
passed at iPhone dimensions. Validation stays unchecked pending the hosted signup
setting, signed-token verification/cleanup and phone review. The user approved
the two disposable-account tests and immediate cleanup; the public Auth API still
reports confirmation enabled, so the conditional test has not created accounts.

Scope revised 30 October 2026: email/password sign-up and sign-in; password
visibility, input validation, clear loading/error states, restored sessions,
signed-in account view and sign-out. Email verification, callbacks, password
recovery/update and social login are deferred by the user's instruction to keep
this step simple. Immediate signup requires the development Confirm email setting
off; the app checks it before signup and never treats a missing session as success.
Customer authentication is optional: preserve a clear Continue as Guest path for
discovery and the future QR flow. Newly registered users have no salon-management
privileges. Keep account/session behavior reusable for staff authentication later.

Acceptance: valid/invalid registration and login, restart/session restore and
logout work on the target device. No verification email flow is introduced.
If confirmation is enabled, signup is blocked before creating an account.
Protected navigation
does not flash private content. Repeated taps do not create duplicate submissions.
User verifies the working authentication flow before we start salon features.
Guest entry remains reachable without registration or sign-in.

### 04. Customer salon discovery, comparison and QR entry

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: Home, Salons, My Queue and My Appointments navigation in the Customer app;
public salon/service/barber schema and deterministic fictional seed data for the
specified 13 salons; search, sorts and open-only filter; salon detail and barber
profile screens; current queue/wait/earliest-time comparisons with explicit demo
and freshness labels; Royal Saloon QR route and scan simulation. Add only shared
UI/domain modules needed here. Computed live estimates arrive in milestone 08.

Acceptance: all names match the specification. A guest can compare where to go
using the demo queue, wait, price and opening information. Search and all sorting/
filter controls work. Seed values are labelled demo estimates, never claimed as
live measurements. QR entry prominently offers Join Queue without requiring an
account or hairstyle. Future actions are clearly labelled until functional.

### 05. Supporting Manager app, membership and staff onboarding

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: minimal Expo Manager shell using shared theme/authentication; salon
memberships and permission checks; Royal Saloon development setup;
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

### 06. Salon settings, services and public barber profiles

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
Manager profile, service, hours and availability edits appear in customer views.

### 07. Appointment requests and confirmed schedule reservations

- [ ] Implemented
- [ ] Validated
- [ ] Complete

Scope: optional-customer-identity strategy using a silent Supabase anonymous
session for private guest records, subject to confirming project support; no
customer sign-up screen required. Customer requests, manager responses, alternate
time acceptance, cancellation and appointment arrival; in-app notifications.
Customers can inspect date/service/barber availability before requesting a time.
An estimated free window is distinct from a confirmed appointment slot.
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
Replace seeded customer estimates with calculations from shared records; show
earliest estimated service time and estimated visit windows so customers can
compare going now with visiting later. Define the forecast horizon explicitly.

Acceptance: scenario checks cover a shorter queue with longer work, breaks,
appointment conflicts, unspecified duration and a specific-barber preference.
Remote entries do not consume a physical position. Check-in order is stable.
Closed salons reject new immediate-service entries on the server. Concurrent
joins cannot create duplicate active entries for the same customer and salon.
A customer can compare an empty queue with a busy barber and see the difference;
future windows respect confirmed work and are labelled estimates. Starting or
finishing work and changing availability updates the customer-facing estimates.

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

1. Customer compares salon waits and estimated visit windows -> chooses to go now
   or requests a later appointment. Fresh/stale and estimated/confirmed states
   remain clear, including when a salon currently has no physical queue.
2. QR/customer joins -> receives code -> checks in -> shares styles -> barber
   starts and completes service -> one sale/commission -> eligible customer review.
3. Customer requests appointment -> salon accepts, suggests or declines -> customer
   accepts an alternative when needed -> arrival -> service -> sale -> review.
4. Owner opens/closes -> monitors staff/queues -> records expenses -> reconciles
   sales, commission, estimated profit and performance.
5. Concurrent/repeated actions, restricted-role access, restart/session restoration
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
- Milestone 03: user requested signup without verification for now; confirm the
  development Confirm email setting is off. Verification/recovery/redirect setup
  is deferred to a later agreed authentication enhancement.
- Milestone 05: trusted first-owner bootstrap, staff invitation method and minimum
  permission defaults. No open self-selection of an owner role.
- Milestone 07: anonymous guest support, identity recovery limitations, appointment
  grace period, cancellation/no-show policy and who may accept each request.
- Milestone 08: scheduling estimate policy, refresh interval, handling of unknown
  break end times, forecast horizon and priority when appointment arrivals are late.
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
- Customer-priority refinement: Customer app bootstraps first; customer auth is
  optional; discovery precedes Manager setup; estimated visit windows and comparing
  when to go are explicit acceptance criteria. No feature code was added.
- Validation: staged diff passes `git diff --cached --check`; all 17 milestone
  sections are present; `.env` is ignored/untracked and its values are absent
  from staged files; remote `main` matches the local starting commit. Planning
  PR is merged into `main`. No app/database tests apply to this documentation change.
- PR: [#1](https://github.com/nadhirhasan/BookMyTurn/pull/1), branch
  `docs/implementation-plan`.
- User verification: plan accepted and implementation start authorised in conversation.
- Merge: confirmed through GitHub; planning PR #1 is merged.

### Gate 00A — customer design review

- User steering: the first coded UI looked generic; research actual apps and
  design in Figma before developing further UI.
- References inspected: official Fresha venue/app-store images, Booksy customer
  app/booking images, and Treatwell Play Store images. See DESIGN_DIRECTION.md.
- Figma status: connection and OAuth are verified. Created
  [BookMyTurn — Customer Experience](https://www.figma.com/design/wugLxCXK2CM44607SvxZwF?node-id=9-140).
- Implemented in Figma: Home, salon comparison, Royal Saloon availability; local
  component families; 26 foundation variables and 8 DM Sans text styles. Neutral
  library controls and licensed photography are used in the composed views.
- Validation: the discovery board contains 335 editable descendants including
  text, vector geometry, instances and discrete photo layers. The first render
  revealed filled SVG wrapper boxes; those were corrected and the new render
  was inspected. See `design/reviews/customer-discovery.png`.
- Remaining: queue/check-in, appointment/account states and prototype navigation.
  The user approved the three composed screens and requested implementation. Figma returned a Starter-plan
  tool-call-limit error before the queue composition ran. The remaining scripts
  are prepared locally but are not claimed as completed Figma screens.
- Visual direction: user explicitly rejected dark/blue themes. Use the light,
  neutral direction in DESIGN_DIRECTION.md; the source idea files are historical
  requirements and their old colour rules no longer apply.
- UI development: resumed for the three approved discovery screens by explicit
  user instruction. Native device verification and PR merge remain required.
- Design PR: [#2](https://github.com/nadhirhasan/BookMyTurn/pull/2), draft against
  `main` from `design/customer-experience`. Whitespace, source-syntax and design-only
  staging checks passed. Local `.env` values and private upload/session artifacts
  were excluded. The first three screens are user-approved; design PR merge remains pending.

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

### Milestone 01 and discovery preview ? implementation

- Implemented: approved Home, salon comparison and salon availability in Expo;
  exact DM Sans/photography/Lucide assets, guest search, sorting, filtering,
  selectable estimated windows and honest pending-feature notices.
- Scope adjustment: user explicitly approved implementing these three screens.
  Milestone 04 is only partially demonstrated; no persistence, QR entry, barber
  profile or live forecast is claimed. Milestones 02/03 remain next.
- Validation: lint/types and Expo Doctor (21/21) passed; nine browser journeys
  passed including four viewport widths. Web, iOS and Android bundle export
  passed. See CUSTOMER_FOUNDATION.md and docs/reviews for evidence/limits.
- Database: no migration or mutation. Supabase connectivity is not yet tested.
- PR: [#3](https://github.com/nadhirhasan/BookMyTurn/pull/3), stacked on design PR #2.
- Clean installation: npm ci passed.
- CI: see the checks on feature PR #3 for the current result.
- Outstanding: physical iPhone/Android runtime verification and user review.
  Network audit reports 11 Expo dependency findings; no forced incompatible
  downgrade applied. Full Figma journey remains limited by its tool allowance.
- User verification: Figma discovery approved; runnable app pending.
- Merge: pending; do not tick the full validation/completion gates yet.

Cold browser loading: initial CI exposed controls before client handlers were
attached. The app now shows its loading state through hydration; a regression
check holds JavaScript requests, verifies controls stay hidden, then verifies
search after scripts load. Native font-loading behavior is preserved.

### Milestone 02 - Supabase account foundation (validated; review pending)

- PR: [#4](https://github.com/nadhirhasan/BookMyTurn/pull/4), stacked on #3.
- User acceptance: runnable discovery UI accepted; database integration requested.
  User chose to add/authorise Supabase for migration application and validation.
- Implemented locally: lazy typed client using public configuration, persistent
  session wiring, native refresh lifecycle, stale-result/error/cleanup handling,
  and self-profile read/display-name helpers. No auth screens or automatic signups.
- Migration prepared: Auth-linked private customer profiles, server provisioning,
  own-row read/update policies, display-name-only update grants, immutable identity
  and timestamps, and no anonymous access or editable role fields.
- Tests prepared: configuration/session unit suite, two-identity SQL permission
  suite with rollback, PostgreSQL 17 CI service and repeatable public-key probe.
- Validation: 11 unit checks plus lint/types passed. Expo Doctor previously passed
  21/21. Both iOS and Android bundle exports passed after resuming. Browser and
  PostgreSQL CI results are recorded in the feature PR when completed.
- Hosted deployment (30 October 2026): authorised connection matched BookMyTurn
  to the configured project; inspection found no application tables or accounts.
  Applied `customer_profiles` through the migration tool, recorded as version
  `20261030015043`. The unchanged local SQL file was renamed to this version so
  later CLI deployment does not try to apply the same migration twice.
- Hosted permission suite: passed against real Auth schema/roles, covering two
  customer subjects, own updates, cross-user denial, grants, metadata isolation,
  constraints and deletion cascade. All fixtures rolled back; a separate query
  confirmed zero Auth users and zero profiles remained. No emails or API sessions
  were created by these SQL tests.
- Public-key probe: Auth reachable, email confirmation remains enabled, and
  anonymous profile access denied. Security and performance advisors: no findings.
  Generated hosted types match the row/insert contract; the client Update type
  intentionally narrows to the display-name column permitted by grants.
- CI on `ab09324`: [both jobs passed](https://github.com/nadhirhasan/BookMyTurn/actions/runs/40987413750),
  including clean install, lint/types, 11 unit tests, web export, nine browser
  journeys and the PostgreSQL 17 suite. Migration filename/evidence changes will
  run CI again before handoff.
- Outstanding: user review and PR merge. Signed-token authentication and native
  signed-in session restoration remain milestone 03 checks.
- Previous attempt: approval review hit a usage limit before browser/native checks
  could start. On resume both native exports, source checks, 11 unit tests and all
  nine browser journeys passed; the isolated test server was closed.
- CI note: the migration applied in PostgreSQL 17. The first permission run
  failed because GRANT requires the temporary schema namespace rather than the
  pg_temp alias; the test helper was corrected. Latest CI results are on PR #4.
- Scope/deployment guide: [supabase/README.md](../supabase/README.md).
- Merge and milestone completion: pending; do not advance to sign-in/sign-up yet.

### Milestone 02B - complete shared database (validated; review pending)

- User superseded incremental table creation: plan and create the full shared
  database, then connect app features one by one.
- PR: [#5](https://github.com/nadhirhasan/BookMyTurn/pull/5), stacked on #4.
- Plan: [DATABASE_PLAN.md](DATABASE_PLAN.md), written before migration work.
- Implemented: 34 additional tables (35 including profiles), catalog, staff,
  operational and financial relationships, constrained reservations/completion,
  secure reads, closed business writes, sanitized public reviews and audit history.
- Hosted migration `20261030023943` applied after the clean PostgreSQL 17 suites
  passed. Both real Supabase role suites passed; independent counts confirmed
  fixture cleanup and RLS on all 35 tables. No Auth settings or app UI changed.
- Seeded: exactly 13 approved closed-by-default salons, 23 hairstyle categories
  and expense categories; no fictional operational workload or financial totals.
- Security advisors: no findings. Performance: 32 informational unused-index
  notices retained for future workload review. Public schema types exported.
- Evidence and limits: [SCHEMA_VALIDATION.md](../supabase/SCHEMA_VALIDATION.md).
- Pending: user acceptance/PR merge, then per-feature API/UI integration. Creating
  tables does not tick later feature milestones or claim forecasting is implemented.
