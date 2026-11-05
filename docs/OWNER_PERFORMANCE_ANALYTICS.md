# Owner performance analytics

## Plan and acceptance checks

- [x] Review the existing ledger, reports and owner/barber permissions.
- [x] Research a real mobile reporting interface before designing the screen.
- [x] Add an owner-only database aggregate for counts, revenue, averages, ratings, daily/weekly trends and the preceding equal-length period.
- [x] Build Analytics with date presets, calendar ranges, salon filters, tappable barber rankings and accessible interactive charts.
- [x] Expose Analytics from manager navigation and Finance. Keep payroll and barber financial access out of this change.
- [x] Validate database reconciliation/permissions, browser interactions, narrow layouts, lint/types and native exports.
- [x] Open a feature PR and apply/verify the tested hosted migration.

## Research and design decisions

Reviewed Fresha's actual mobile Performance insights screenshot: a segmented date selector, one dominant sales number, a simple labelled bar chart and secondary metric cards. Adopt the hierarchy and interaction patterns using BookMyTurn's approved eucalyptus, cream and DM Sans theme. Do not copy branding or populate production screens with example figures.

- [Fresha mobile Performance insights and filtering](https://www.fresha.com/help-center/knowledge-base/reports/100652-access-your-performance-insights)
- [Official mobile screenshot](https://images.fresha.com/fresha-cms/filter_By_Location_mobile_1_2e43b1de02.jpg?f_quality=75&f_width=1920)
- [Fresha reporting overview](https://www.fresha.com/help-center/knowledge-base/reports/614-reporting-and-analytics-overview)
- [SQUIRE reporting questions](https://www.getsquire.com/business-edge/barbershop-software/barbershop-reporting-software)

Use the installed UI/UX and Expo skills. Their generic blue, dense desktop dashboard recommendation is unsuitable for this approved mobile product. Use generous touch targets, visible labels and exact chart values, with no animation or dependency required.

## Data semantics

Revenue means completed haircut sales plus corrections posted during the selected dates, in LKR. It is not wages or take-home pay. Haircut counts include only original completed sales, including zero-priced haircuts. Average haircut value excludes correction entries; duration uses actual completed session time. Ratings count published reviews posted during the selected dates. Archived salons and barbers remain available for historical reports.

Dates use Asia/Colombo. Today/week/month stop at today. Comparison is the immediately preceding equal number of calendar days, with its actual dates displayed; the current day is still in progress. Daily and Monday-based weekly buckets reconcile with the same summary, including negative correction days and zero days. No estimated utilization, payroll, targets or allocated barber profit.

Read through the existing owner_finance RPC with a new performance action. Check ownership in the database, including explicit salon/barber scopes. Refresh on focus, foreground, realtime changes and every 30 seconds; retain only same-account/same-filter data on failure and show staleness. No data reset, Auth changes or financial write paths.

## Validation — 5 November 2026

- All 30 migrations replayed into disposable PostgreSQL 15; all 15 SQL suites passed. CI also runs PostgreSQL 17.
- SQL coverage includes owner/foreign owner/barber/customer/anonymous access, explicit foreign scopes, negative corrections, zero-priced cuts, >25 completions, unfinished sessions, published ratings, zero days, archived barber history, equal-length comparisons, year boundaries and the 366-day limit. Daily, weekly and team totals reconcile with the ledger.
- Nine analytics and nine Finance browser journeys passed in isolated Edge at mobile sizes, including 320, 393 and 430 px. Two targeted checks also passed after adding the chart capture and an in-flight response during sign-out.
- Both apps pass lint and TypeScript. Manager iOS, Android and web production exports passed with placeholder API configuration. Physical device acceptance remains for the owner.
- Visual review: [overview](../design/reviews/owner-analytics/overview.png), [interactive chart](../design/reviews/owner-analytics/daily-chart.png), [barber detail](../design/reviews/owner-analytics/barber.png). Screenshots contain test fixtures only.
- Hosted preflight security advisory: existing leaked-password-protection warning. Performance baseline: eight pre-existing unindexed foreign keys and 27 informational unused indexes; these belong to existing tables and are outside this read-only API change.
- [PR #24](https://github.com/nadhirhasan/BookMyTurn/pull/24) is stacked on #23. No automatic merge.
- Hosted migration `20261105062209_owner_performance_analytics` applied successfully. The unchanged SQL file was renamed from the CLI's preparation timestamp (`20261104113504`) to the hosted history version so future CLI pushes do not apply it twice.
- The complete owner-performance SQL suite passed against hosted Supabase roles, Auth and ledger tables, with all fixture work rolled back. Independent cleanup/grant checks confirmed zero fixture accounts/salons, no anonymous Finance RPC access and a security-invoker public wrapper. Existing financial write paths remain unchanged.
- Hosted postflight security advisor matches the preflight baseline; no new findings.
