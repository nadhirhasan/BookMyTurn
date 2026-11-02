# Invited barber accounts

Owners keep one account for their salons. A barber profile is a chair, not an
Auth account. The owner opens **Salon → Team → Login access**, creates a private
invitation and shares its link with the intended barber. No email is sent by the
app. Email confirmation remains disabled as requested.

The invitation lasts seven days and is shown only when created. Its secret is
held in screen memory, not saved to app storage or returned by team-list APIs.
If lost, use **Replace invitation**; this invalidates the old link. The owner can
also cancel a pending invitation. The server stores only its SHA-256 hash.

The barber opens the link, signs in or creates a personal account, checks the
salon/chair details, then accepts. A link received outside Expo Go can instead be
pasted into **Join a salon** in the Manager app. Expo Go links depend on the
current development server; the pasted token works when the server URL changes.
There is no email-ownership authorization while email confirmation is off:
possession of the private link plus a signed-in account is required. Share it
only with the intended person. This release does not send invitation messages.

Acceptance attaches the account to the existing barber profile and its existing
work. Retrying does not create another profile or membership. Requests cannot
substitute a different salon, chair, role or permission. The same invitation
cannot be accepted by another account. Owners cannot accept their own salon's
barber invitation. An already connected chair must have its access removed
before another account can be invited.

The barber opens My Queue, Appointments, Profile and My Work. Availability,
arrivals, haircut references, start/finish, final-price entry and reviews keep
their existing behavior. My Work shows completed haircut counts, recent dates,
durations and personal reviews. It does not show revenue totals or historical
prices. After completion, Start next customer and Take a break are available.

Unprivileged barber state omits session price/commission fields and revenue
totals. Direct session/item/sales reads cannot bypass those restrictions.
Customers retain their own receipt history; owners and explicitly finance-
authorized members retain financial access. Internal state helpers are not
alternate finance endpoints. The server still records exactly one sale on
completion, with the actual final price; no accounting records are deleted.

**Remove barber access** deactivates login membership and revokes the chair's
invitations. It preserves the profile, visits, haircut history and sales. The
owner can operate an ongoing chair and later invite a replacement. API checks
use live memberships, so a revoked user's next request is denied; foreground
polling clears the old view within five seconds. Already downloaded images or
existing short-lived signed URLs cannot be instantly withdrawn.

Manager and Barber show the last successful refresh. Failed refreshes or a
45-second age mark data stale. Stale operational data cannot check in customers
or start/finish work until refreshed. Refresh remains available. Account-scoped
state prevents previous-user responses from appearing under a new account.

## Validation and deployment

The feature uses `20261102073946_barber_invitations.sql`. It adds a private RLS
table, owner/team and acceptance RPCs, audit entries without secrets, and stricter
financial read policies. Existing records and Auth settings are preserved.

All twelve SQL suites pass against disposable PostgreSQL 17. Invitation tests
cover retries, expiry, cancellation, replacement, client privilege tampering,
cross-salon denial, revoked access, existing-chair continuity and one-sale
completion. Browser tests cover the same user journeys with mocked APIs, red
required-field validation, narrow screens and stale check-in protection.

Deployed after explicit approval on 2 November 2026, with an explicit deny-all
policy refinement in `20261102074134_barber_invitation_private_policy.sql`. Hosted
invitation and collection suites pass with rollback. The two existing accounts,
one salon, two barbers, one photo and one collection remain; no test identities
are retained. The public database types were regenerated from hosted Supabase.
Security advisors show no schema/storage findings; the pre-existing disabled
[leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
is unchanged. Final CI and physical iPhone/Android acceptance are tracked in
[the plan](BARBER_INVITATIONS_PLAN.md).
Owner accounting screens, financial permission management, public QR hosting
and any return to service catalogues/price ranges remain separate features.
