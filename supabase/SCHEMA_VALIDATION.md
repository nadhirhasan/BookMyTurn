# Complete schema validation

Feature branch: feat/full-database-schema, based on the validated profile
foundation in PR #4. Full domain/access plan: [DATABASE_PLAN.md](../docs/DATABASE_PLAN.md).

## Deployment order

1. Preserve/apply the existing customer_profiles migration first.
2. Apply complete_domain_schema once through the authorised migration tool.
3. Reconcile the local migration timestamp with the tool's recorded version.
4. Run tests/customer_profiles.sql, then tests/complete_schema.sql as the
   development administrator. Never run bootstrap-ci.sql on hosted Supabase.
5. Run security/performance advisors and the existing public-key probe.

The full-schema migration adds tables, constraints, triggers, views and approved
catalog data. It does not drop or rewrite customer profiles, create Auth users,
change Auth settings or expose client business writes. No destructive rollback is
provided: preserve data and write a separate corrective migration if needed.

Applied on 30 October 2026 as version `20261030023943`. The CLI-created file was
renamed to [20261030023943_complete_domain_schema.sql](migrations/20261030023943_complete_domain_schema.sql)
to match hosted migration history; its tested SQL is unchanged. Do not reapply it
to the configured BookMyTurn project.

## Automated coverage

CI creates a disposable PostgreSQL 17 database with a guarded Auth stand-in,
applies every migration in timestamp order, then runs both SQL suites. This checks
fresh installation as well as compatibility with the profile migration. Hosted
tests use real Supabase Auth roles/schema, temporary identities and rollback.

The full-schema suite checks catalog/category counts, RLS coverage, unset policy
thresholds, private helper privileges, closed salons, active queue uniqueness,
cross-salon foreign keys, check-in ordering, barber preference, appointment
reservation conflicts/breaks and accepted alternatives. Service checks cover
one active barber session, immutable snapshots/items, verified reviews, line-item
totals, one sale/commission at completion/retry and settlement allocation bounds.
Access checks exercise two customers, Owner, Barber, Coordinator, an unrelated
salon's Owner, deactivation and anonymous browsing. It also verifies redacted
audit fields, private notifications, account deletion/history and fixture cleanup.

Uniqueness/exclusion constraints provide database concurrency protection. These
transactional suites test their rejection behavior; they are not a multi-device
load test or proof that future UI/API commands are implemented.

## Evidence

- [x] Requirements and current hosted schema inspected; only customer_profiles existed.
- [x] Full schema/access plan recorded before implementation.
- [x] Fresh PostgreSQL migration and both SQL suites pass, including final request
  immutability/view grants on ae238dd: [database CI](https://github.com/nadhirhasan/BookMyTurn/actions/runs/40992791409).
- [x] Hosted migration and both real-role suites pass; all fixtures rolled back.
  A separate query verified 35 application tables, all with RLS, 13 approved
  salons, 23 gallery categories and zero Auth users, memberships, barbers, queues,
  appointments, service sessions, sales, commission accruals, reviews or messages.
- [x] Security/performance advisors reviewed: no security findings. Performance
  reported 32 informational unused-index notices on newly created tables.
  Retained required FK/calendar/audit indexes pending real query workloads;
  [unused-index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- [x] Public-key probe passed: Auth reachable, confirmation enabled, anonymous
  profile/queue access denied and exactly the 13 approved catalog slugs readable.
  The private schema request returned PGRST106, confirming it is outside the Data
  API. [Hosted public schema types](types/database.generated.ts) exported and
  independently TypeScript-checked. Local lint/app types passed after extending
  the read-only probe.
- [x] [Feature PR #5](https://github.com/nadhirhasan/BookMyTurn/pull/5) contains the plan,
  migration, tests, types and deployment evidence. Final filename/evidence CI runs
  before handoff; user acceptance and merge remain pending.

The current database uses PostgreSQL 17.11. The reviewed btree_gist changelog
concerns float/NaN indexes; this schema uses UUID and timestamp range exclusions,
not float indexes. The extension uses the server default version as required by
current Supabase extension policy.

## Integration boundaries

Customer UI still uses the clearly labelled fictional discovery snapshot. Catalog
rows are seeded closed by default because live operational state is not known.
No fake queues, forecasts, ratings, financial balances, barbers or customer
accounts are inserted. Gallery categories exist without unlicensed image assets.
Salon slugs are stable integration keys shared with the current routes; internal
UUIDs are generated per database and resolved by slug, rather than hardcoded.

Account-free browsing works; guest Auth enablement/recovery, controlled business
commands, scheduling forecasts, realtime subscriptions and per-feature UI are
integrated and validated next. No additional Supabase project, paid branch,
Storage bucket or external delivery/payment integration is created.

## Customer integration update ? 30 October 2026

The initial empty-catalogue counts above are historical. The customer pipeline
now seeds 26 demo barbers, 65 services, hours and 23 hairstyle references into the
13 salons. Customer operations use controlled RPCs; public QR arrivals require
no Auth account. New tables keep RLS and closed client grants. Hosted customer
and QR regression suites pass with rollback; real signed-token/concurrent-slot
tests pass with two disposable accounts and complete cleanup. Confirmation is
now disabled by user instruction. Security advisors have no findings. See
[customer pipeline evidence and remaining deployment/device checks](../docs/CUSTOMER_PIPELINE.md).
