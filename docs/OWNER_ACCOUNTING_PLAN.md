# Owner sales, expenses and reports

Prepared 2 November 2026. Branch: `feat/owner-accounting`, stacked on barber invitations.

Pricing stays completion-only. There are no services, displayed price ranges,
new surcharges or advance price questions. Existing salons, accounts, visits,
photos and financial history must be preserved.

- [x] Inspect the sale/completion ledger, expense schema, permissions and Manager UI.
- [x] Add guarded owner report and paginated sales/expense APIs. Use Asia/Colombo
  dates, salon/date filters, daily/monthly totals and barber performance. Include
  recorded sale corrections and existing commission without inventing charges.
- [x] Add expense creation/edit/payment/cancellation with integer money, required
  field validation, audited corrections, optimistic concurrency and retry-safe
  writes. Preserve financial history rather than hard-deleting paid records.
- [x] Build a mobile owner Finance workspace in the approved light style: Overview,
  Sales, Expenses and Reports. Include Today/Week/Month/custom dates, salon filters,
  actionable empty/error states, pagination and stale-data feedback.
- [x] Keep barber/customer access denied in database APIs and direct routes, clear
  account-specific data on account changes, and preserve completion-only pricing.
- [x] Verify totals, period boundaries, paid/unpaid/capital distinctions, corrections,
  duplicate retries and cross-salon/privacy checks in isolated PostgreSQL tests.
  Verify mobile flows in browser tests and native/web exports; run required checks.
- [x] Open the feature PR with validation evidence; do not merge automatically.
- [x] Apply and verify the hosted migration within authorized scope. If explicit
  deployment approval is required, finish the reviewable feature first.
- [ ] User acceptance on separate owner/barber/customer phones.

Estimated profit is completed haircut revenue including recorded sale corrections,
less paid operating expenses and accrued BookMyTurn commission for the selected
period. Unpaid expected expenses and capital purchases are shown separately.
Commission settlement payments must not be deducted again. This is an estimate
from recorded transactions, not a complete accounting statement.

Owner sales/expense/report features are this PR. Commission rule/payment management,
staff permission administration and public website/QR hosting remain later PRs.

Local validation: all 13 SQL suites pass from a fresh PostgreSQL 17 database. The 37 existing Manager browser journeys and nine finance journeys pass; all 26 Customer journeys pass (72 distinct journeys total). Both workspace lint/type checks and 22 Auth/session unit tests pass. Manager iOS/Android/web exports pass; financial screens were visually inspected. Customer local tests use the previously verified ignored alternate-port configuration because another service occupies 8082.

Deployed after explicit approval on 2 November 2026. PR [#17](https://github.com/nadhirhasan/BookMyTurn/pull/17) is stacked on #16. Hosted versions: `20261102090845_owner_accounting` and `20261102091048_owner_expense_categories`. The second migration restores ten expense reference categories removed during the earlier full reset and keeps the category API response an array. It does not overwrite existing/custom categories.

Hosted accounting and barber invitation suites pass with rollback. A real existing-owner report returns correct zero balances and ten category choices. Verification preserved two accounts, one salon, two barbers, one photo/collection and the existing empty visit/financial ledgers; no test identities, expenses or retry records remain. Public types are regenerated from the hosted schema. Security advisors show no schema/storage findings; the existing development Auth password-protection warning is unchanged. CI is tracked on the PR; physical-phone acceptance remains pending.
