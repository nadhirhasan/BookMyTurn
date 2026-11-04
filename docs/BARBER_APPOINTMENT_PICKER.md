# Barber appointment time selection

4 November 2026. Replace the typed `HH:MM` alternative-time field with the same calendar → time selection pattern used by customers.

Implemented in [PR #23](https://github.com/nadhirhasan/BookMyTurn/pull/23), stacked on #22. Local checks passed; GitHub CI and phone acceptance can be tracked separately. No hosted migration is required.

- [x] Show the appointment/customer context, calendar and database-backed times for the selected chair.
- [x] Group times into Morning, Afternoon and Evening; disable unavailable times and highlight a missing selection inline.
- [x] Clear selection when the day changes; ignore late responses and handle loading, empty days, errors and refreshed availability safely.
- [x] Keep salon return navigation and customer acceptance of the proposed time.
- [x] Verify booking/availability/error flows and narrow mobile layouts, lint/types and native exports; open a separate PR.

Reuse the existing calendar, design tokens and `customer_slots` RPC. Send the selected timestamp unchanged to the existing staff `suggest` command, which rechecks availability transactionally. No schema or Auth changes are needed. Retain the current 30-day suggestion calendar limit.


## Validation

- Eight picker journeys and ten existing barber journeys passed. Final picker checks also passed after the empty-day submission adjustment.
- Both apps passed lint and TypeScript. The manager/barber app exported successfully for web, iOS and Android.
- Covered the exact salon/chair query, sending the selected server timestamp, manager agenda return, missing selection, unavailable times, date changes, failed/empty loading, stale responses, competing reservations and 320/430-pixel layouts.
- Local Chromium processes crashed during verification. Successful runs used an isolated headless Edge profile with GPU disabled; no system or CI browser settings were changed.
- [Reviewed calendar and time-selection captures](../design/reviews/appointment-picker/README.md) use fixtures, not live customer records. Physical phone verification is pending.

Phone test: Appointments → Suggest Another Time → select a date → tap an available time → Send Alternative Time. The customer still accepts the proposal before confirmation. The same picker opens from the manager's salon Agenda → Suggest time.
