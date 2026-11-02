# Owner accounting workspace

The Manager mobile app now has an owner-only **Finance** tab, with **Overview**,
**Sales**, **Expenses** and **Reports**. A salon's Details panel also opens its
sales and expenses. Existing customers and barbers keep the current haircut flow:
there is no service catalogue or advance price question. The barber enters the
actual amount after completion; the database records the sale once.

## Reports and sales

Choose all owned salons or one location, including archived locations. Periods
are Today, This week (Monday–Sunday), This month and custom dates up to 366 days.
All report boundaries use Asia/Colombo business days, regardless of phone zone.
Revenue includes completed-service sales and already-recorded sale adjustments.
An adjustment appears on its posting date and does not create another completed
haircut. Pending bookings, queues and unfinished haircuts do not create revenue.

Sales can be filtered by barber and customer source, with 25 records per page.
Those list filters do not change the business-wide profit estimate. Reports use
the complete selected period, not just the currently displayed page. Sale
originals remain immutable; this feature reads existing corrections but does not
add a sale-correction editor.

Daily and monthly rows reconcile revenue, paid operating costs, accrued platform
commission and estimated profit. Barber performance includes completed counts,
recorded revenue, actual start-to-finish duration and reviews posted in the
selected period. Archived barber history remains visible. These are business
performance figures, not wages or take-home pay.

## Expenses and estimated profit

Add an expense with a salon, description, database category, amount, operating
or capital type, expense date and payment status. Expected/unpaid is the default.
Paid expenses also record their payment date and optional method. Paid dates
cannot be in the future. Optional notes stay optional; missing required fields
are red after Submit and do not call the API.

The calculation is:

`estimated profit = completed-sale revenue + posted sale corrections − paid operating expenses − accrued BookMyTurn commission`

Paid costs use their payment dates; expected costs use their due/expense dates.
Capital purchases and unpaid expected expenses are displayed separately and are
not deducted from this operating estimate. Commission settlement payments are
shown separately and are not deducted a second time. Unsettled commission is the
accrual balance through the selected end date, less allocations paid by that date.
No commission rule, extra customer fee or payment is created by opening Finance.

The UI labels profit as an estimate from recorded transactions. Missing expenses,
taxes, unpaid obligations and other unrecorded transactions can change actual
business results; this is not a double-entry accounting system.

Expense edits use a version check. If another device has changed the entry,
refresh its saved data before applying an edit. Corrections to any previously
paid expense require a reason. Cancellation excludes the cost but preserves the
entry and its audit history; a cancelled entry can be restored through Save.
Financial originals are not hard-deleted. A request ID and payload hash make
creation, edit and cancellation retries safe if a response is lost.

## Privacy and refresh

The API checks current owner membership for every read and write. Changing a
salon, expense or barber ID cannot grant another salon's access. Customers,
ordinary barbers and coordinators cannot call the owner finance API. Existing
financial table RLS remains in place, and the private request ledger denies raw
client access. No service-role key is placed in either app.

Finance data is scoped to the account and exact filters. Failed refreshes retain
the last verified same-account report with a stale warning; authorization errors
clear it. Late requests are ignored after account/filter changes or navigation.
Expense changes are blocked while saved data is stale. The Finance refresh button,
foreground/focus reload, private live invalidation and a 30-second foreground
refresh keep the workspace current.

## Validation and deployment

Migration: `20261102090845_owner_accounting.sql`. It extends expense metadata,
adds an internal retry ledger and guarded reporting/expense RPCs, and adds period
indexes. It does not reset business data or change Auth settings, completion
pricing, commission agreements or payment processing.

The self-contained SQL suite covers owner isolation, ordinary barber/customer
denial, Colombo midnight, posting-date corrections, paid/unpaid/capital costs,
audited paid corrections, cancellation/restoration, stale versions, duplicate
retries, pagination, archived history and real nonzero commission snapshots.
All historical SQL suites also run. Browser tests cover the full expense flow,
filters, pagination, report reconciliation, retry/conflict handling, mobile widths,
stale data and sign-out privacy. Native iOS/Android and web exports are checked.

Deployed after explicit approval on 2 November 2026. The hosted accounting and
barber invitation suites pass with rollback. An existing owner report was checked
under the authenticated role. Current business records are preserved and no test
identities or financial transactions remain. Public types were regenerated.

`20261102091048_owner_expense_categories.sql` restores ten reference categories
removed by the earlier clean reset, preserves existing/custom category names,
and guarantees an array response even if the catalogue is later emptied. There
is no client-side category fallback.

Security advisors show no schema/storage findings. The pre-existing disabled
[leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
is unchanged. PR/CI evidence and phone acceptance are tracked in
[OWNER_ACCOUNTING_PLAN.md](OWNER_ACCOUNTING_PLAN.md).
Commission configuration/payment administration, staff permission management
and public website/QR hosting remain separate features.
