# Approved Charcoal & Champagne implementation

5 November 2026. User approved the interactive design in PR #26 and requested that the real apps match it. The design files in `design/charcoal-champagne/` and their final screenshots are the visual authority.

## Plan and validation gates

- [x] Port the shared palette, DM Sans type, spacing, borders, controls and dark system appearance to both existing Expo themes. Remove conflicting light-only surfaces.
- [x] Add consistent page/stack movement, press feedback and rising sheets with reduced-motion support and native-safe areas.
- [x] Match customer discovery, salon detail/fixed actions, calendar/fixed request action, queue ticket, visits, collections and account. Keep every displayed business value from the existing database APIs.
- [x] Match manager dashboard/analytics, salon/team/invitation screens and barber chair/service/profile screens. Keep owner finances restricted and preserve CRUD, maps, notifications and all existing routes.
- [x] Compare running web screens to the approved preview, fix visual differences, and verify narrow screens, enlarged text, fixed actions and API interactions through fixtures. Native keyboard/sheet acceptance remains below.
- [x] Run lint/types, full customer and staff browser suites, existing unit tests and iPhone/Android/web exports. Record native-device limits honestly.
- [x] Open [implementation PR #27](https://github.com/nadhirhasan/BookMyTurn/pull/27); preserve all hosted data and schema.
- [ ] User phone acceptance of the implemented UI, camera, keyboard and native sheets.

## Implementation constraints

No prototype records, fake queues, fixed visit codes, sample financial figures or pretend invitations go into the app. Real content varies with the account and salon; layout and styling match the approved design. Keep completion-only pricing, separate appointment confirmation, staff-led progression, six-digit visit codes, private collections and owner-only finances. Existing marketing imagery remains explicitly illustrative; salon uploads take priority.

Use the existing theme entry points and shared UI components. Native system controls may differ only where required by the platform (status bars, keyboard, permission prompts, maps and native sheets). Expo Go remains the target for phone testing.

Figma editing remains blocked by the account's Starter quota, so implement from the user-approved browser design; no additional Figma authorization is required.

## Delivered application changes

Customer navigation is Explore / My visits / My photos / Account. Existing salon,
queue and appointment routes remain available through these screens. Venue photos,
statuses, barbers, held appointment slots and private collections use existing APIs.
The queue ticket uses ivory paper with dark text and the real six-digit code.
Staff continue to verify, start and finish each visit; no customer arrival buttons
or advance pricing are introduced. Appointment requests keep their review/contact
step and salon confirmation requirement.

Owner navigation is Overview / Team / Finance / Account. Activity stays in the bell;
full analytics stays in the overview shortcut. The overview reads the owner-only
performance API. The team screen exposes profile editing and invitation access.
Barbers have My chair / Requests / Profile, with personal work/reviews reached from
Profile. The next-customer card holds code verification and a compact private-photo
preview. Code lookup, walk-ins and availability remain available above the queue.

Queue joining and finishing a haircut use native form sheets. Page movement is
280 ms, with native stack gestures and a short web glide. OS reduced motion disables
movement; photo preview/save dialogs also respect it. Both apps share one token source.

The customer Scan QR action uses SDK-compatible `expo-camera` and accepts only
salon/QR route shapes, navigating internally to the existing account-free QR flow.
An explicit camera-permission action and pasted-link fallback are provided. Native
config introspection confirmed iOS camera purpose text, Android CAMERA permission
and no microphone permission. The image-picker plugin no longer blocks the camera.

## Verification and remaining acceptance

- Lint and TypeScript passed for both workspaces; 24 existing customer unit checks passed.
- All 40 customer browser tests passed, including the new design/scan checks.
- All 81 staff browser tests passed in the final full run (3.8 minutes), including
  salon/barber CRUD, invitations, code verification, references, completion pricing,
  financial isolation, stale data, real-time cross-app updates, calendars and maps.
- Both apps exported successfully for iOS, Android and web with placeholder credentials.
- [Ten real-app screenshots](../design/reviews/charcoal-implementation/README.md) use
  isolated fixtures; no hosted records or schema were changed.
- Physical iPhone/Android acceptance is pending: transitions, native sheets, keyboard,
  camera permission/QR detection and Maps handoff. Exports verify compilation, not
  hardware behavior or pixel identity across different safe areas and font settings.

Implementation commit: `6725f9b`. PR #27 is stacked on #26's design branch because
the approved design PR remains open. CI runs the full browser suites on Linux and
the existing isolated PostgreSQL migration/permission suites. No feature PRs were merged.
