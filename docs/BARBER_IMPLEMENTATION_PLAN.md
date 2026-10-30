# Barber workflow delivery

Authorised 30 October 2026. Customer experience accepted in chat; existing PRs
remain unmerged until user review. Build the individual Barber experience first,
in a separate Expo app at apps/manager, with the approved light/charcoal DM Sans
style. The earlier dark theme, fake role picker and local data requirements in
idea/manager.md are superseded by the accepted shared Supabase architecture.

- [x] Reuse the current design system. Attempt Figma access; record any existing
  Starter-plan block without claiming uncreated screens.
- [x] Add the Manager Expo workspace and mobile navigation: My Queue,
  Appointments, Profile, Performance. Keep the Customer app working separately.
- [x] Reuse email/password Auth without verification. Authorise every operation
  through an active salon_memberships barber/primary-owner record and barber_id. No role
  self-selection, email-based privilege or customer metadata grants.
- [x] Return only the barber's relevant queue, current service, appointments,
  hairstyle preferences, catalogue and own performance/reviews from the database.
- [x] Handle check-in, walk-ins, physical FCFS/Any Barber allocation and preserve
  specific preferences. Starting service immediately decreases physical waiting.
- [x] Agree service/price before starting; finish with final customer agreement,
  optional extras and an explicit out-of-range reason. Use existing immutable
  service snapshots, sales and commission guards; retries create one sale only.
- [x] Accept, decline or propose another appointment time; check in the existing
  appointment and complete it without creating an ordinary queue entry.
- [x] Update availability/breaks and own public profile; show own reviews and
  completed-service totals. Never expose salon expenses/profit/other staff settings.
- [x] Verify two-barber/customer isolation, deactivation, reservation conflicts,
  commission disclosure, duplicate completion and customer review eligibility.
- [x] Run lint/types, app/browser and DB tests, web and iOS/Android exports;
  open a separate PR with manual cross-app testing and membership setup steps.
- [ ] User physical-device verification and PR acceptance/merge.

All operational data comes from the existing database. Do not seed workload or
invent financial totals. Additional Owner administration, salon-wide accounting and coordinator
screens remain separate releases. Existing commissioned work must continue to
require a configured rule and explicit customer agreement.

Updated instruction: remove the seeded demo salons and their linked test activity;
preserve Auth accounts, private customer profiles and shared hairstyle references.
The user will register a separate email for each salon. Add authenticated salon
setup that creates a new salon and its primary barber, with owner membership
limited to that newly created salon. Signing up never grants access to an existing
salon. Additional barber invitations/Owner finance screens remain later work.
The reset is a documented one-time administrative action, never app startup code
or a repeatable migration that could erase later user-created salons.

Validation details and known limits: [BARBER_WORKFLOW.md](BARBER_WORKFLOW.md).
Figma Starter tool limit prevented new frames; the approved Customer style is used.
Hosted migrations and the authorised one-time reset are applied. All generated
SQL test fixtures roll back; no test accounts or salon workload remain.
