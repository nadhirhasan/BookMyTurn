# Live queue, staff alerts and Manager redesign

Requested after phone testing on 30 October 2026. Preserve all existing accounts,
salons, queues and bookings. Deliver through a separate PR stacked on Manager #11.

Confirmed cause: Neel has a remote `joined` entry with Any Barber. The salon
screen shows only `arrived` counts, no incoming-join list; unassigned remote
entries also have no physical forecast allocation yet. Joining remotely must
stay visible without being counted as physically waiting.

- [x] Add salon-wide live operations: incoming joins, physical waiting, active
  service and date-based appointments, with staff/status filters and direct actions.
- [x] Add durable staff alerts for joins, arrivals, appointment requests and
  customer cancellations/acceptance, with own-user read state and live membership
  checks. Backfill only existing active visits; do not fabricate workload.
- [x] Send private, empty Realtime invalidations; refresh guarded APIs, with
  polling/foreground fallback. Show inbox badges and in-app new-event banners.
- [x] Offer optional local phone alerts while the app runs. Closed-app remote
  push requires a development/release build; do not claim Expo Go delivers it.
- [x] Redesign around daily operations using primary references from Fresha and
  Booksy: compact location cards, prominent live statuses, staff filtering,
  chronological agenda, action-led visit rows and persistent Activity navigation.
  Use warm light surfaces, charcoal controls and restrained status colors; no blue
  or dark theme. Keep photographs smaller so customer work appears first.
- [x] Reproduce remote Any Barber join and physical QR arrival in SQL and a
  cross-app browser journey. Verify owner/employee isolation, notifications,
  read state, refresh, cancellation and duplicate prevention.
- [x] Validate responsive UI, lint/types, native/web exports and CI; open PR.
- [ ] User phone acceptance and PR review/merge.

Research: [Fresha scheduling](https://www.fresha.com/for-business/features/scheduling),
[Booksy calendar](https://biz.booksy.com/features/calendar-scheduling),
[Fresha iPhone app](https://apps.apple.com/us/app/fresha-for-business/id1455346253).
These are references for hierarchy and interactions, not copied branding/assets.

Implementation, sources, walkthrough and precise notification limits:
[LIVE_OPERATIONS.md](LIVE_OPERATIONS.md). Final CI is recorded in the feature PR.
