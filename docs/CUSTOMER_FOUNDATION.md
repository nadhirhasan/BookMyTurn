# Customer discovery implementation

The user approved the first three Figma screens and explicitly requested their
implementation on 29 October 2026. This delivers milestone 01's app foundation
plus a local demonstration of milestone 04's discovery UI. It does not complete
milestone 04's database, QR entry or barber profile scope.

## Implemented

- Expo SDK 57 / React Native / TypeScript npm workspace for iOS, Android and web.
- Approved white/neutral styling, DM Sans, matching Lucide icons and the original
  licensed photography from the reviewed Figma screens.
- Home, all 13 salon results and parameterised salon availability routes.
- Guest browsing, salon/barber-name search, empty/reset states, shortest estimated
  wait or lowest starting price sorting, open-only filter and filter dialog.
- Planned-visit entry, demo queue counts, busy-with-zero-waiting example, prices,
  service/barber context, selectable estimated windows and closed/not-found states.
- Four-tab navigation. My Queue, My Appointments, account and booking actions
  explain their pending implementation and never generate fake confirmations.
- Fixed demo timestamps and clear fictional-data/illustrative-photo labels.
- Safe-area layouts, scrollable details, persistent bottom actions, accessible
  labels/selection states, TypeScript checks and CI.

The source is the approved [Figma discovery board](https://www.figma.com/design/wugLxCXK2CM44607SvxZwF?node-id=9-140).
A fresh design-context request remained blocked by Figma's Starter-plan allowance.
Implementation used the saved reviewed render, original assets, design variables
and exact checked-in layout construction sources. The rest of the Figma journey
remains pending and is not claimed as approved or implemented.

## Rendered evidence

Browser renders at 393 × 852, inspected against the Figma composition:

- [Home](reviews/customer-home.png)
- [Salon comparison](reviews/customer-salons.png)
- [Availability](reviews/customer-availability.png)

The browser has no native status bar/home indicator. On a phone, the OS supplies
these areas and the app respects safe-area insets. No fake status chrome is drawn.
The web preview is centred and capped at 480 logical pixels on larger displays.

## Validation

- Lint and TypeScript: passed.
- Expo Doctor: all 21 checks passed.
- Eight Playwright journey/responsive checks passed: guest navigation, window
  selection and honest action notices; salon/barber search and no results;
  sorting/filtering; planned visit/closed/invalid links; layout at 320, 393, 430
  and 1440 pixels. Page errors are checked in the core guest journey.
- Web static export: passed.
- Android and iOS Hermes bundle export: passed. This proves compilation, not
  native runtime behavior, installation or signing.
- Clean installation and CI: final results recorded in the PR.
- Physical iPhone and Android runtime verification: pending.
- No Supabase migration, authentication, API call or database mutation performed.

The network-backed dependency audit reports 11 findings (5 low, 3 moderate,
3 high) in the Expo toolchain/router dependency graph, including zod and
decode-uri-component. No critical finding was reported. The suggested forced
fix changes Expo major versions; no incompatible forced downgrade was applied.
This development preview is not a production release. Reassess compatible
patched versions before release.

## iPhone verification

1. From the repository root run `npm ci`, then `npm start`.
2. Use Expo Go with SDK 57 support; connect the iPhone and computer to the same
   Wi-Fi and scan the QR code with Camera.
3. Verify Home's typography/photo/card and four-tab labels, including around the
   notch and home indicator. Scroll the featured and compact cards.
4. Search “Sameer”, open Royal Saloon, select 2:30 pm and scroll through services
   and barbers. Check the bottom actions stay reachable.
5. Tap Join Queue and Request Appointment: each explains that the feature is
   coming next and creates no record. Dismiss and return.
6. Compare Noire: zero physical waiting, barbers in service, earliest 2:15 pm.
   Try Price, Shortest wait, Open now, no-results/reset and Plan a visit.
7. Open Saloon Bhai: immediate queue joining is disabled while closed.
8. Check My Queue / My Appointments and Account show clear preview status.

Repeat on an Android phone/emulator when available. OS back behavior, keyboard,
touch/scroll feel, safe areas and accessibility need native validation; browser
viewport checks are not a substitute.

## Next gate

Review this feature PR and verify the iPhone build before advancing. Next:
Supabase connection and minimal private profile schema/RLS (milestone 02), then
optional sign-in/sign-up (milestone 03). Full salon persistence and QR entry remain
in milestone 04. Figma queue/appointment/account designs resume when available.
