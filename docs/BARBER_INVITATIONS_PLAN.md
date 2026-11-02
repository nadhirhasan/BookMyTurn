# Barber invitations and restricted access

Prepared 2 November 2026. Feature branch: `feat/barber-invitations`.

Owners create salons and barber profiles, then invite an individual account to
one existing chair. Barbers use Queue, Appointments, Profile and My Work; they
cannot manage another salon or view owner accounting. Current accounts, uploads,
visits and financial history are preserved. No email delivery or Auth setting
change is needed: the owner shares a private, expiring invitation.

- [x] Inspect existing membership, chair, finance and client navigation behavior.
- [x] Add owner-controlled invitation create/list/cancel, signed-in acceptance,
  account assignment and access revocation. Store only a hash of the secret;
  bind invitations to a salon/chair, expire them and prevent reuse by another
  account. Reissuing invalidates the previous invitation.
- [x] Restrict barber state and direct database reads to operational data. Keep
  final-price entry for the current haircut; remove historical financial totals
  and commission internals from unprivileged barber responses.
- [x] Build Team access controls and invitation acceptance using the approved
  light style. Support sharing a link and entering its private invitation token
  in Expo Go; require no new dependencies or email verification.
- [x] Add clear barber access states, nonfinancial My Work, last-updated/stale
  indicators, and protection against stale operational actions.
- [x] Verify invitation retries/expiry/reissue/revocation, cross-salon isolation,
  account switching and finance restrictions in SQL and browser journeys. Run
  existing regressions, lint/types and native/web exports.

Validation: all 12 PostgreSQL suites pass from a fresh disposable PostgreSQL 17
database. Manager's 31 existing browser journeys plus six invitation/stale-state
journeys pass, and all 26 Customer journeys pass (63 distinct journeys total).
Both workspace lint/type checks, 22 shared Auth/session tests and Manager final
iOS/Android/web exports pass. Invitation, acceptance and My Work screenshots
were visually inspected. The local Customer run used an ignored alternate-port
configuration because another local service occupied its usual port 8082.
- [ ] Open a feature PR with migration and validation evidence; do not merge.
- [ ] Apply the tested migration and verify hosted behavior within authorized
  scope. If deployment approval is required, finish the reviewable PR first.
- [ ] User acceptance on phones with separate owner, barber and customer accounts.

The invitation secret is a bearer credential; distribute it only to the intended
barber. Account email is not proof of identity while confirmation is disabled.
Acceptance requires a signed-in account plus the secret, never just an email
match. The app does not send messages or invitations to other people.

Later feature PRs: Owner sales/expenses/profit/reports and commission; deployed
public salon QR links; final cross-device workflow validation. Services and price
ranges remain a separate product decision and are not restored in this feature.
