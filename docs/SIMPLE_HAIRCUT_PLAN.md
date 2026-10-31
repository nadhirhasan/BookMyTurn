# Simple haircut workflow

The 31 October 2026 product direction replaces the service catalogue and upfront pricing in the current apps. A customer chooses a salon, barber/date/time when relevant, and optionally one of their saved haircut photos. The barber sees that reference, starts the haircut without price prompts, and enters the amount only when completing it.

- [x] Audit existing booking, queue, salon setup, photo sharing and financial constraints.
- [x] Add service-free salon/team setup and booking capacity based on the salon's stored average haircut duration. Keep legacy history intact; do not seed hidden priced services or reset user data.
- [x] Add a private customer haircut gallery with uploads, saved public inspiration, rename/remove and optional atomic photo attachment when joining or booking. Staff access is scoped to their salon/chair and the referenced visit.
- [x] Start haircuts without service/price/agreement prompts; record a validated final amount and exactly one sale at completion.
- [x] Generate six-digit numeric visit codes, unique among active visits within a salon; preserve UUIDs/private QR tokens for identity and receipt access. Support staff lookup by code.
- [x] Simplify Customer and Manager screens, remove service/price listings and repeated add/explanation prompts, and highlight invalid required fields in red with an adjacent message after submit.
- [x] Verify real database permissions, photo privacy, booking overlap, retries, queue order, numeric-code uniqueness and completion accounting with rollback-only fixtures in isolated PostgreSQL 17 CI.
- [x] Verify browser journeys and responsive/error states, lint/types and both native platform exports.
- [ ] Apply the hosted migration and regenerate the public database snapshot after explicit approval.
- [x] Open a separate feature PR and record local validation results: [PR #14](https://github.com/nadhirhasan/BookMyTurn/pull/14). Its checks track final CI; deployment and device acceptance remain pending.
- [ ] User iPhone/Android acceptance.

Use the approved light design. The customer gallery is private; selected references are shared only with authorized staff on that visit. Removing a saved image hides it from the gallery while retaining an already shared reference. Display codes are lookup aids, never authentication or guest receipt secrets. Existing named-service visits and financial snapshots remain readable and can still finish safely through their legacy rules.

Hosted deployment is pending explicit approval: automatic approval review rejected the broad hosted schema/security update while active visits exist. Validate the full change in fresh-database CI first. No hosted migration has been applied.
