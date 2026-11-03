# Guided customer and staff workflows

## Plan and acceptance checklist

- [x] Audit entry, next action, success, empty, failure and recovery states across customer and staff routes.
- [x] Salon creation opens Team with a first-barber next step. Existing salon edits return to Details.
- [x] Barber creation immediately opens an invitation prompt. Sharing is explicit; no automatic email or invitation on render.
- [x] Show account/invitation status in Team, with a direct invitation action and retry on access-load failure.
- [x] Make sharing the primary action once a link exists; explain replacement and returning later.
- [x] Deep-linked invitations preview automatically after login, but acceptance remains explicit. New unassigned staff can find Join a salon immediately.
- [x] Put arrival check-in and walk-in entry before a long barber queue; provide a direct arrival action for an existing visit.
- [x] Keep arrived customer appointments in upcoming visits and explain pending, confirmed, arrived and cancelled next steps.
- [x] Verify customer navigation, collections, queue/QR, booking, review, manager CRUD, operations, invitations, barber service/break/profile and finance permissions with regression tests.
- [x] Review mobile-width screenshots; run lint/types and platform exports.
- [ ] Open a feature PR.

## Boundaries

Use the existing shared database and permission APIs. No hosted migration, new services or upfront prices. Do not claim that opening a share sheet delivers an invitation. Retain duplicate guards, safe archive/delete confirmation and stale-data protection. A contextual invitation prompt is requested; routine actions should not acquire extra confirmation dialogs.

## Audit findings

| Journey | Finding / action |
| --- | --- |
| Manager creates salon | Returned to an empty queue. Open Team and make the first-barber step explicit. |
| Manager adds barber | Returned to Queue with invitation hidden. Present the invitation route immediately as a native modal. |
| Manager revisits Team | Login state invisible. Display connected, pending, expired or not invited, with an appropriate action. |
| Invitation sharing | Replace was more prominent than Share. Promote Share and explain that replacement invalidates the old link. |
| Barber opens invitation | Link already provided but user must check it manually. Preview automatically, retain explicit accept and wrong-account recovery. |
| New staff account | Join a salon buried beneath empty owner workspace. Put the choice before owner setup. |
| Barber arrival | Check-in and walk-in hidden below all waiting customers. Move before the list and add Mark arrived on an existing remote visit. |
| Customer appointments | Arrived incorrectly classified as history. Keep it active and explain what happens next by status. |
| Customer queue | Guest receipt could coexist with a contradictory empty state. Count active guest receipts too. |
| Manager code search | Empty results did not explain a mistyped code. Add specific guidance and Clear customer code. |
| Customer style browsing | An empty category produced a blank gallery. Explain it and offer Show all styles / Open my collections. |

## Other journeys checked

| Journey group | Existing behavior verified |
| --- | --- |
| Customer account and discovery | Guest browsing, field errors, immediate signup, password login/retry, session restore, signout, search/reset, open/wait filtering, missing photos and catalogue retry. |
| Salon / barber / appointment calendar | Salon and barber detail entry points, date/time selection, unavailable slots, review/edit step, sign-in draft preservation, conflict recovery and cancellation releasing a hold. |
| Customer queue and QR | Duplicate-visit link, remote versus physical arrival, account-free QR receipt, tracking, cancellation and completion review. |
| Collections and references | Collection/photo CRUD, full-screen preview, upload failure/retry, optional attachment to queue/appointment, staff reference viewing. |
| Manager setup and operations | Multiple salons and chairs, required fields, photos, weekly hours, scoped editing, archive/restore/delete confirmation, active-visit errors, live arrival and appointment confirmation, Activity links. |
| Barber work | Invitation acceptance/revocation, chair scope, arrivals, walk-ins, haircut start/finish, one final-price completion, break selection, profile editing and personal reviews. |
| Owner accounting | Owner-only access, sales/report filters, expense create/edit/pay/correct/cancel, retry safety and stale/offline recovery. |

## Validation

- Full staff browser regression: **54 passed**. Full customer browser regression: **35 passed**.
- **10 staff + 3 customer focused tests passed** after the final invitation wording, code-search recovery and empty-gallery recovery changes (including two additional scenarios).
- `npm run check`: lint and TypeScript pass in both workspaces.
- Expo exports for **iOS, Android and web** pass for both apps with placeholder API configuration.
- Reviewed the [mobile screenshots](../design/reviews/guided-workflows/README.md). Existing regression coverage includes 320/393/430 px screens, landscape, enlarged browser text and reduced motion.
- No hosted SQL, account, financial or storage changes. No new package dependency.

## Phone acceptance still required

- [ ] On iPhone and Android, create a salon and barber; verify the invitation modal and Back to team navigation.
- [ ] Open the native share sheet, send the invitation to the intended barber, and accept with a different account on the second phone.
- [ ] Check native keyboard, VoiceOver/TalkBack and OS font scaling. Browser enlarged-text checks are not a substitute for native accessibility testing.

Reference: modal routing uses the installed SDK's [Expo Router 57 API](https://docs.expo.dev/versions/v57.0.0/sdk/router/). Shared existing controls and the approved theme are retained.
