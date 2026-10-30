# Complete database plan

Agreed direction: 30 October 2026. Design and create the full shared Supabase
database before connecting more app features. This replaces the earlier approach
of adding each domain's tables during its UI milestone. Customer and Manager UI
work still proceeds one verified feature at a time, through separate PRs.

## Product model

The primary question is when a customer can be served. Store the facts needed to
answer it: salon hours and exceptions, barber skills and working hours, breaks,
confirmed reservations, arrived customers and actual service start/end times.
Do not store a fictional waiting count as a live fact. Forecast calculations and
their customer API will be integrated and tested in the availability milestone.

Supabase Auth owns identities and credentials. Existing customer_profiles remain
compatible. Anonymous Auth identities can later support account-free private
records; public browsing does not create an account. Enabling guest Auth and
recovery rules are separate integration decisions. Staff-created walk-ins may
have no Auth identity and cannot claim a customer review without a trusted link.

## Schema and relationships

All IDs are UUIDs unless stated otherwise. Money is integer LKR minor units
(100 minor units = Rs. 1); no floating point prices. Instants are timestamptz,
weekly opening/working hours are local time in Asia/Colombo. Composite foreign
keys ensure references stay within one salon. Historical operational and
financial records survive account deactivation/deletion; customer IDs become
null on account deletion. No public contact directory is created.

Discovery and staff:

- salons: public identity, existing app slug, Akurana address, open/closed state,
  demo flag, currency/timezone and freshness timestamp. Seed exactly the 13
  approved names, with no fabricated live queues or ratings.
- salon_hours and salon_date_exceptions: weekly hours and date-specific closures
  or replacement hours; one interval per day initially.
- salon_policies: default service duration and nullable grace, cancellation,
  no-show and forecast settings. Null means undecided, not zero or a penalty.
- salon_memberships: trusted staff identity, salon, Owner/Barber/Coordinator,
  active state and explicit additional permissions. Never derived from signup
  metadata. First Owner provisioning remains an administrative operation.
- barbers, barber_hours and barber_status: public biography/skills, working hours
  and declared availability/freshness. Active work is derived from sessions;
  membership links are private and never included in public barber rows.
- services and barber_services: salon-specific price ranges/durations, optional
  barber-specific overrides, active state. Historical snapshots are separate.
- barber_schedule_blocks: private break/unavailable/confirmed-appointment
  reservations. A GiST exclusion constraint prevents overlapping active planned
  blocks for one barber, including concurrent confirmations. Actual overruns
  remain factual service records and are not silently truncated to a booking.

Customer operations:

- queue_entries: unique reference, customer or staff walk-in, source, optional
  service, preferred/assigned barber, status and arrival/service timestamps.
  One active entry per customer per salon. Arrival sequence is assigned at
  check-in, never at remote join. Only arrived status counts as physical waiting.
- appointments: requested service/barber/time, optional contact, pending/alternative/
  confirmed/arrived/in-service/terminal status and confirmed interval/barber.
  Declined is distinct from cancelled. An appointment never creates a queue row.
- appointment_proposals: salon alternatives and explicit customer acceptance.
  Confirmation of an alternative requires the corresponding accepted proposal.
- hairstyle_categories and hairstyles: the specified gallery taxonomy, licensed
  image URL/attribution and optional category-level reference information. A
  gallery category does not promise salon skill, price or availability.
- style_requests and style_request_items: one versioned preference submission per
  queue entry or appointment, customer note, selected references and viewed time.
- service_sessions and service_items: actual work, one queue/appointment source,
  assigned barber, immutable quoted price/duration/name snapshots, pre-service
  agreement, final amount, consent/reason and extra line items. At most one active
  session per barber and one session per source record. Source/customer/salon
  consistency is checked in the database.

Finance and feedback:

- commission_rules: effective-dated fixed surcharge split, eligible sources and
  disclosure text; disabled by default until a commercial agreement is selected.
- sales: exactly one immutable original sale per completed session, derived
  transactionally at completion. Requests and arrivals create no sale.
- sale_adjustments: authorised, reasoned append-only corrections; original sales
  are retained. Reports must include adjustments rather than overwriting history.
- commission_accruals: at most one per sale, with agreed rule/split snapshots.
  Snapshot amounts must balance and no commission is created for incomplete work.
- commission_payments and commission_payment_allocations: recorded settlement
  evidence and allocation, separate from revenue, no payment gateway. Allocations
  cannot exceed either payment or accrual under concurrent writes.
- expense_categories, recurring_expenses and expenses: operating/capital,
  paid/expected/cancelled, optional recurring reminders and payment evidence.
  No automatic payment or double-entry accounting is introduced. Wage and barber
  commission categories live here; platform settlement is recorded separately.
- reviews: one verified review per completed session by its owning customer;
  1-5 stars, optional body and publication consent.
- published_reviews: sanitized public projection without Auth/customer/session
  IDs or contact fields. Ratings/counts are computed from published rows.
- review_reports: staff moderation reports and resolution history; barbers cannot
  edit or delete customer reviews.
- notifications: private in-app messages, recipient, event key and read time.
  No real email/SMS delivery infrastructure is created.
- audit_events: actor, salon, entity, operation/time and redacted changes;
  append-only and restricted to authorised staff. Important business changes are
  logged from the database; contact details/free-text customer notes are redacted.

## Access and mutation boundary

Anonymous visitors and signed-in users may read published catalog/profile/gallery
data and sanitized reviews. They cannot read queue identities, appointment
requests, contact details, internal reservations, staff Auth links or finances.

Customers may read only their own operational/history/review/notification rows.
An active Owner can read their salon operations and finances. A Barber can read
their own assigned work and service performance; a Coordinator can read salon
queue/appointment operations, without automatic financial access. Explicit named
permissions may add access; deactivation takes effect from membership data on the
next database request, without waiting for a JWT refresh.

RLS is enabled on every application table, including private schema tables.
Business writes are initially closed to anon/authenticated. Tested transactional
commands will be added with each feature integration, rather than granting broad
table writes or exposing unrestricted status changes. Existing profile name
editing stays compatible. Trusted administrative/service-role access is for
backend use only. Private permission helpers check the current Auth user, use a
fixed search_path and expose no caller-selectable user ID.

Database triggers/constraints already protect tenant references, active queue
duplicates, appointment reservations, service-source identity, completion/sale
uniqueness, final item totals, review eligibility and financial allocation limits.
The schema is not a claim that join/booking/completion APIs or UI already exist.

## Deliberately undecided behavior

Grace/cancellation/no-show thresholds, forecast horizon/priority, guest recovery,
commission eligibility/split and profit presentation need product decisions at
their integration gates. The schema supports them without silently enabling a
policy. Paid expenses, expected expenses, capital purchases and commission
settlement remain distinguishable so reports can state their calculation.

Real payments, real SMS, inventory, external accounting, additional locations and
additional salon names remain excluded. Image storage buckets/policies will be
added when upload requirements and licensing are verified; URL/attribution fields
support the initial gallery without opening an upload bucket now.

## Implementation and validation checklist

- [x] Re-read customer and manager requirements and existing schema.
- [x] Record complete domain model, relationships and access boundaries.
- [x] Create an additive migration and deterministic approved-salon seed.
- [x] Validate from a fresh PostgreSQL database and the existing profile baseline.
- [x] Test customer/staff/anonymous isolation and business invariants.
- [x] Apply to the configured hosted development project; inspect advisors.
- [x] Verify hosted permission/constraint tests and fixture cleanup.
- [x] Record generated types, evidence and deployment order in [PR #5](https://github.com/nadhirhasan/BookMyTurn/pull/5).
- [ ] User reviews and merges; then resume app integration one feature at a time.

Do not mark UI milestones complete merely because their supporting tables exist.
This feature is stacked on the reviewed Supabase foundation PR #4, without merging
or modifying its already-applied profile migration.

The hosted migration version is `20261030023943`; there are 35 application tables
including customer_profiles, with RLS enabled on all 35. See
[SCHEMA_VALIDATION.md](../supabase/SCHEMA_VALIDATION.md) for checks and limits.
