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
- [ ] Fresh PostgreSQL migration and permission/constraint suites pass.
- [ ] Hosted migration and real-role suites pass; fixtures cleaned up.
- [ ] Security/performance advisors reviewed.
- [ ] Public-key probe and generated schema types verified.
- [ ] Feature PR ready for review; user acceptance/merge pending.

## Integration boundaries

Customer UI still uses the clearly labelled fictional discovery snapshot. Catalog
rows are seeded closed by default because live operational state is not known.
No fake queues, forecasts, ratings, financial balances, barbers or customer
accounts are inserted. Gallery categories exist without unlicensed image assets.

Account-free browsing works; guest Auth enablement/recovery, controlled business
commands, scheduling forecasts, realtime subscriptions and per-feature UI are
integrated and validated next. No additional Supabase project, paid branch,
Storage bucket or external delivery/payment integration is created.
