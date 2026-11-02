# Customer experience redesign

Status: implemented; PR and phone acceptance pending, 2 November 2026.
Scope confirmed by the user: customer first; Owner/Barber follows separately.
Branch: `feat/customer-experience-redesign`, based on owner accounting.

## Customer task

Find a salon with an acceptable wait, choose a barber, join today's queue or
request a future appointment, and understand what happens next. The haircut
collection supports the visit; it is never required to book or join.

This is a desk review of published product flows, official screenshots, platform
guidance and the existing app. It is not a usability study with customers, and
browser screenshots do not establish native iPhone/Android usability.

## Research and decisions

| Reference | Observed pattern | Application in BookMyTurn |
| --- | --- | --- |
| [Fresha booking journey](https://www.fresha.com/help-center/knowledge-base/online-presence/102398-learn-how-clients-book-appointments-online) | Staff selection, availability, review, then confirmation. Its official staff/time screenshots were downloaded and visually inspected. | Portrait-based barber choices; date calendar and selectable times; a separate review step. Our appointment remains a salon-confirmed request. |
| [Fresha customer app](https://www.fresha.com/en-GB/download-app), [App Store listing](https://apps.apple.com/us/app/fresha-for-customers/id1297230801) | Photo-led venue discovery and a dedicated customer booking app. | Salon photography, concise identity/rating/status and practical wait information. |
| [Booksy customer app](https://biz.booksy.com/features/customer-app) | Customer access to upcoming/past appointments, staff availability and convenient booking. Its official marketing composition was visually inspected; it is not an installed-app walkthrough. | Active visits on Home, clear upcoming/history sections and account shortcuts. |
| [Apple pickers](https://developer.apple.com/design/human-interface-guidelines/pickers) | Date selection is a control rather than an open-ended text task. | No typed date/time strings. Keep the month calendar requested by the user and show actual database time choices. |
| [Material date pickers](https://m3.material.io/components/date-pickers/overview) | Dedicated calendar component. The page requires JavaScript; no detailed claims are derived from unreadable content. | Calendar anatomy checked against the reference concept, with implementation validated locally. |
| [NN/g mobile UX research](https://www.nngroup.com/articles/mobile-ux/) | Small screens, interrupted use and variable connectivity make prioritisation and context preservation important. | Shorter steps, a persistent next action, preserved booking selection across sign-in, visible failure/retry states. |
| [React Native 0.86 Pressable](https://reactnative.dev/docs/0.86/pressable), [ScrollView](https://reactnative.dev/docs/0.86/scrollview) | Explicit press semantics and keyboard/scroll behaviour. | Labelled controls, selected/disabled states, press feedback, reachable form actions. |

Competitor screenshots are research references only. They are kept in ignored
`.artifacts/ui-research`, not shipped inside the app. No competitor branding,
prices, ratings, discounts or salon listings are copied.

## Installed design skills

Installed using Codex's skill installer, from pinned GitHub revisions:

- [Expo skills](https://github.com/expo/skills), revision
  `a9e5bd3fa00b4e61f632e43f85da73aee1942582`: `expo-overview`,
  `expo-native-ui`, `expo-design-system`, `expo-ui`, `expo-router`.
- [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), revision
  `3a13158ff1f32156cbe144108de48eda2ecaed9a`: `ui-ux-pro-max`.

Guidance is reviewed, not blindly applied. The first generated palette suggested
blue, contrary to the user's preference, so it was rejected. A narrower salon
query returned soft pink/lavender and a marketing-page structure, which also was
not adopted as an app layout. Relevant interaction, contrast and React Native
accessibility guidance was retained. The existing Expo SDK 57, DM Sans, Lucide,
React Native primitives and Router remain the implementation foundation. Native
Expo UI controls were evaluated; this pass retains the working cross-platform
calendar and controls, with no new runtime dependency or framework migration.

## Audit findings

- Neutral styling gave important actions, statuses and optional content similar
  visual weight. Tiny secondary text carried too much of the decision.
- Salon cards repeated ratings and queue information, with no clear hierarchy.
- Hardcoded Akurana labels implied location awareness the app does not have.
- A missing venue photo silently substituted a stock salon, suggesting a false
  representation of the actual business.
- Appointment selection, optional references, contact fields and submission were
  one long scroll. There was no dedicated review step.
- Time choices used a nested scrolling container, making the booking page harder
  to navigate on a phone.
- Active visits were hidden behind tabs rather than surfaced on Home.
- Queue receipts needed clearer codes, states and the next action.
- The account screen still said queues/appointments were coming soon.
- Collection/photo actions and review controls needed consistent touch targets.

## Visual system

Extend `apps/customer/src/theme.ts`; do not add a competing token library.

- Warm white background, white content surfaces, warm charcoal typography.
- Burnt coral `#B83E28` for primary actions with white text; peach for selection
  and editorial panels; green/mint for availability and progress; amber/butter
  for pending states. Statuses always have text, not colour alone.
- DM Sans: 28/35 titles, 20/27 sections, 16/24 body, 15/22 labels, 13/19 captions.
  Respect system font scaling; key information is not confined to one-line text.
- Rounded photo-led cards, clear grouping, generous but purposeful spacing.
- Shared buttons, status pills, empty states, headers, image banners and rows.
- Static image banners have a useful destination or explanatory role. No
  autoplay carousel, fabricated offer or distracting motion.
- Existing licensed Unsplash photography is used only in editorial banners.
  Actual salons use their own database photo or an honest missing-photo state.
  See `apps/customer/assets/images/README.md` for licence/source records.

The light theme is intentional per user preference. This is not a dark-mode
implementation. Browser and device acceptance must check that large text,
keyboard, safe areas and disabled controls remain usable.

## End-to-end flow

1. **Home:** search; Go now / Plan a visit; active queue or upcoming appointment;
   photo-led salon discovery; useful haircut inspiration.
2. **Salons:** real catalogue, name/barber search, shortest wait / alphabetical /
   open filters. Empty and connection-failure states remain honest.
3. **Salon:** photo, address, opening state, current wait and physical count;
   barbers, hours and reviews. Join Queue and Request Appointment are separate.
4. **Barber:** personal portrait/profile, status, experience, actual ratings and
   reviews; select this barber for a queue or appointment.
5. **Queue join:** any/specific barber, optional collection and contact details,
   clear physical-arrival choice. No required photo, service or price.
6. **QR join:** same customer-facing visual language, account-free physical
   arrival, existing duplicate-entry protection and device receipt retained.
7. **Queue receipt:** large visit code, explicit status, estimated start, progress
   and arrival/cancel controls where valid. Completed visits expose review.
8. **Appointment selection:** barber, month calendar and morning/afternoon/evening
   time groups. Busy times are disabled and labelled. Selection is revalidated
   after refresh and conflicts remain server-enforced.
9. **Appointment review:** salon, date, time and barber; optional collection and
   contact details. Explain pending salon confirmation before submitting.
   Sign-in carries the selection back into this step.
10. **Bookings:** pending/confirmed/alternative states, response to alternatives,
    cancellation, past visits and review. Success is never implied before save.
11. **Haircut collections:** image-led collections, add/rename/remove photos,
    full-screen preview, optional sharing during visits. Private storage retained.
12. **Review:** clear rating controls and optional text after own completed visit.
13. **Account/auth:** concise forms, inline required-field errors, password
    visibility, guest browsing and working visit/gallery shortcuts.

## Implementation / review gates

- [x] Inspect existing flows and real product references.
- [x] Download and inspect suitable mobile design skills.
- [x] Confirm customer-first scope.
- [x] Create feature branch; preserve backend behaviour and real data.
- [x] Introduce shared visual foundation and restructure booking.
- [x] Complete visual pass across the customer journey.
- [x] Validate booking conflicts, selection after sign-in, QR and history.
- [x] Inspect screenshots at phone sizes, landscape and enlarged browser text.
- [x] Run lint/types, customer journeys and iOS/Android/web exports.
- [ ] Open a reviewable feature PR with screenshots and known limitations.
- [ ] User verifies on physical iPhone; Android acceptance also remains required.
- [ ] Sync redesigned frames into Figma when tool allowance permits.

## Figma limitation

The existing file is [BookMyTurn Customer Experience](https://www.figma.com/design/wugLxCXK2CM44607SvxZwF).
The first page inventory succeeded, then Figma rejected further discovery calls
with its Starter-plan tool-call limit. No new frames were created. Work continues
in code under the user's earlier direct-implementation approval. The prior
Figma screens are historical references, not evidence of this redesign.

## Product boundaries

One shared database, current RLS and mutation APIs, salon-confirmed appointments,
account-free QR joins, six-digit visit codes and completion-only pricing remain.
No service catalogue, displayed prices, fabricated live data, database reset,
new financial permissions or Owner/Barber redesign is included in this pass.

The staff app previously imported the customer typography and calendar. Its
existing versions are now local to Manager so this redesign does not silently
restyle staff operations or Finance.

## Validation evidence

- Both workspace lint/type checks pass; all 22 existing Auth/session unit tests pass.
- All 33 customer browser journeys pass, including seven new redesign checks.
- Manager regression: 45/46 passed initially; the remaining cross-app test
  expected the previous one-step booking flow. After updating it for review,
  all five live-operations tests passed, covering all 46 distinct staff tests
  across the two runs.
- Customer iOS, Android and web production bundles export successfully.
- Tests use isolated mocked APIs, including the cross-app flow. No live account,
  booking, storage object or financial record was created or changed.
- Browser dimensions include 320/393/430 pixels, desktop and 844×390 landscape;
  booking review is also checked with enlarged browser text and reduced motion.
- Screenshots caught and corrected an image intrinsic-height bug. Historical
  service labels and missing-photo honesty are regression-tested.
- Browser enlargement is a useful layout check, not a substitute for iOS Dynamic
  Type, Android font scaling, VoiceOver/TalkBack or native keyboard testing.
- Physical iPhone/Android acceptance and Figma synchronisation remain pending.
