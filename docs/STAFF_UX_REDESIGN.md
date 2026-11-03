# Manager and Barber mobile redesign

Status: implemented and locally validated on 2 November 2026; published in
[PR #19](https://github.com/nadhirhasan/BookMyTurn/pull/19) on 3 November 2026.
Customer redesign is PR #18; this is a separate feature branch.

## Plan and review gates

- [x] Audit owner and barber screens, permissions and current tests.
- [x] Review mobile staff patterns and installed Expo / UI-UX guidance.
- [x] Establish warm shared styling, readable status, accessible actions and navigation.
- [x] Manager: location overview, live queue, agenda, team, invitations, editors, activity and account.
- [x] Barber: availability, active haircut, waiting queue, arrivals, appointments, references, completion, breaks, profile and personal work.
- [x] Finance: clearer owner-only hierarchy, filters and reports; preserve accounting behaviour.
- [x] Validate permissions, stale states, CRUD and cross-app workflows; inspect phone-size screenshots.
- [x] Run lint/types and iOS/Android/web exports.
- [x] Open a separate PR.
- [ ] Physical iPhone/Android acceptance with native keyboard and large text.

## Direction

Carry through warm white, coral actions, mint availability and amber requests.
Staff screens put work first: the current haircut and next action for a barber;
location workload and requests for a manager. Salon photos come from database
records; missing images use honest placeholders. Queue and appointments stay
separate. Six-digit arrival codes remain easy to enter.

References: [Booksy business features](https://biz.booksy.com/features),
[business app](https://biz.booksy.com/) for staff-specific calendars and individual
permissions, and [Fresha team scheduling](https://www.fresha.com/help-center/knowledge-base/calendar/252-schedule-and-update-team-shifts)
for location and team context. These are published product references, not
installed competitor-app testing. Pinned skill sources and customer research:
[CUSTOMER_UX_REDESIGN.md](CUSTOMER_UX_REDESIGN.md).

Expo SDK 57 and React Native 0.86 docs were checked. Existing cross-platform
controls and routing are retained; native UI alternatives were evaluated without
a framework migration or new dependency. Figma's known Starter quota remains
blocked; the user's direct-code fallback authorization continues.

## Boundaries

Keep existing APIs and permissions. Barber accounts see their operational work
and reviews, with no new financial access. Final price only at completion.
No service catalogue, upfront pricing, invented analytics, data reset or hosted
schema change. Verification fixtures stay local. Browser previews and native
bundle exports do not replace device acceptance.

## Delivered behaviour

- Location overview combines real salon covers, workload and request counts.
- Queue/Agenda/Team/Details remain separate within a salon. Customer code lookup
  stays available for queue and appointments; team actions wrap on small phones.
- Current haircut and next start action precede secondary chair tools. When
  waiting customers exist, the availability icon beside the barber opens the
  controls. Break/off-duty states keep those controls visible for recovery.
- Start, final-price completion and break forms use reachable action footers.
  Break presets fill the editable duration; opening hours use hour/minute/AM-PM
  choices. Invalid schedules retain the draft and highlight the affected day.
- Shared tokens update auth, profile, account, invitations, editors, activity,
  finance and reports. Owner finance access and personal barber work stay separate.
- Missing/failed salon photos use a placeholder; failed portraits use initials.
  The sign-in banner reuses licensed customer editorial photography.

## Validation

- Both workspace lint and TypeScript checks pass.
- All **51 staff browser tests** pass in the final full run. These cover salon
  and barber CRUD, invitations/revocation, non-owner finance denial, private
  photo handling, stale-data recovery, appointments, references, check-in,
  customer-to-manager updates and one-sale completion.
- Five new cases cover the redesigned journey, 320/430px and landscape layouts
  with enlarged browser text, and opening-hour validation without typing.
- Screen review caught a narrow-header overflow; it was fixed and retested.
- Final Manager **iOS, Android and web exports** succeed. Customer source and
  database schema are unchanged; cross-app tests use mocked endpoints.
- [Fourteen screenshots](../design/reviews/staff-redesign/README.md) document
  working screens. These contain only isolated fixture data.

Physical iPhone/Android, native keyboard, Dynamic Type/font scaling and
VoiceOver/TalkBack acceptance remain pending. Browser text enlargement is only a
layout check. The intentional light palette follows the user's preference; this
does not add dark mode. Figma synchronization remains blocked by the known tool
quota. Existing scroll-based lists remain; no large-dataset performance claim is
made by this visual redesign.
