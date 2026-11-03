# One-action customer queue

The user changed the queue rule on 3 November 2026. Joining means the customer intends to come immediately and is counted as waiting right away. It is not a separate arrival task for the customer. This supersedes the earlier remote/on-the-way versus physical waiting workflow.

## Plan

- [x] Enforce immediate waiting in the database, including old clients sending `present: false`; keep duplicate joins idempotent and photo collections intact.
- [x] Move existing unstarted `joined` records into waiting without creating entries, changing codes or affecting completed visits. Existing waiting order is retained; legacy joins are appended in creation order within each salon.
- [x] Remove customer presence switches, arrival buttons and check-in progress. Show code, estimated start and automatic waiting → in service → completed status. Cancellation and optional review remain.
- [x] Make staff code lookup open the matching visit for review/start; completion records the final price. No second queue entry or customer price confirmation.
- [x] Remove obsolete On the way and physical-count wording from active screens. Keep appointments separate and salon-confirmed.
- [x] Run isolated database security/workflow tests, cross-app browser tests, lint/types and platform exports; open a feature PR.
- [x] Apply and verify the hosted migration when authorized; record its exact result.

## Implementation contract

The existing `arrived` storage status now means admitted to the waiting queue for queue visits. It does not attest that staff physically verified the person. No additional persisted confirmation flag is necessary: staff compare the code and customer details on the Start haircut screen, then start the existing visit. Appointment arrival retains its existing meaning.

Customer joins still serialize by salon and use the existing request key and active-visit uniqueness. Only staff can start/finish services; only completion creates sales. Customer APIs no longer expose an arrival mutation. QR still needs one explicit Join Queue tap (scanning alone must not create accidental visits).

Supabase's existing function permissions and finance/privacy restrictions are preserved. No accounts or records are deleted.

## Validation (3 November 2026)

- All 29 migrations replayed from scratch in disposable PostgreSQL 15; all 14 SQL suites passed. CI also tests PostgreSQL 17. The bootstrap is only for isolated databases, never Supabase.
- Exact backfill block tested with two legacy joins and an existing waiting visit: codes and existing order retained; legacy joins appended in deterministic creation order.
- Three independent customer joins immediately produce three waiting entries and increasing forecasts. Retry returns the original entry. Staff lookup does not increment counts; starting reduces waiting by one. Finishing twice creates one sale.
- Customer check-in and staff impersonation denied. Any Barber lookup is restricted to the forecast chair. Collection snapshots and existing financial/invitation privacy suites pass.
- All 36 customer and 56 staff browser journeys passed, including customer-to-manager Realtime refresh, QR joining, code lookup, availability recovery, completion, invitations, accounting and mobile layouts.
- Lint and TypeScript passed for both apps; all 22 authentication unit tests passed. Customer and staff web, iOS and Android exports passed with placeholder configuration.
- Fixed an empty-string React Native render in the salon's empty queue view found during the staff suite. The fresh database replay passed after an earlier run encountered a timestamp constraint failure in the legacy demo completion test; no constraints were weakened.
- [Reviewed browser screenshots](../design/reviews/single-step-queue/README.md) use isolated fixtures. Native phone testing remains for the user; exports are not device testing.

## Phone walkthrough

1. Create a customer queue visit with optional haircut references. The receipt shows the six-digit code and Waiting, without any arrival action.
2. On the salon board, check that waiting increased immediately. Reload the receipt or retry joining: there is still one entry/code.
3. On the assigned barber's phone, use Verify customer code → Find customer. Compare the code with the customer and review references, then Start haircut. If off duty, return to the chair and set Available first.
4. Waiting decreases; the customer sees In the chair automatically. Finish Service, enter the agreed final price, then complete. Verify one sale and optional customer review.
5. Appointment requests still require salon confirmation and retain their separate schedule/arrival workflow.

## Deployment

Implemented in [PR #22](https://github.com/nadhirhasan/BookMyTurn/pull/22), stacked on #21. Not merged.

Applied to hosted BookMyTurn as `20261103062111_single_step_queue` on 3 November 2026. The unchanged local migration was renamed to match the hosted version and prevent duplicate CLI application. All three changed function definitions match the fresh local database exactly (MD5 comparison). Authenticated API execution is retained; anonymous access and direct access to the legacy helper remain denied. Before and after, the hosted queue contained one completed visit and no legacy joins to backfill. No accounts or records were deleted.

Security advisors report no new findings. The pre-existing [disabled leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is unchanged. No Auth settings were modified. No hosted test accounts or synthetic visits were created for this deployment; the full functional/security regression tests ran in the disposable local database.
