# Supabase account foundation

The complete shared database is now created and verified as milestone 02B:
[full plan](../docs/DATABASE_PLAN.md), [deployment/evidence](SCHEMA_VALIDATION.md)
and [generated public types](types/database.generated.ts). It adds 34 tables to
the profile foundation below. Application features still integrate one at a time;
business writes remain closed to clients until their controlled commands exist.

Milestone 02 adds private account profiles and the Customer app's client/session
plumbing. It does not persist salons, create bookings or add sign-in screens.

## Migration

[20261030015043_customer_profiles.sql](migrations/20261030015043_customer_profiles.sql)
is one atomic, additive migration. Apply once to the BookMyTurn development
project after checking its identity against the configured project URL.

- `public.customer_profiles`: Auth user ID, optional display name and server
  timestamps. The Auth foreign key cascades on account deletion.
- RLS: authenticated customers can read their own row and update only their own
  display name. IDs and timestamps cannot be changed through client grants.
- Anonymous clients have no table privileges. Client inserts, deletes, truncate
  and provisioning-function calls are denied.
- A trigger creates the minimal profile on Auth user creation. Existing users
  receive a minimal profile during migration without altering their Auth records.
- Provisioning/timestamp functions live in `bookmyturn_private` with fixed search
  paths and no customer execution privileges. Provisioning is a definer trigger;
  timestamp maintenance is an invoker trigger.
- Signup metadata never grants roles and is not copied into the profile. Passwords
  and email stay in Supabase Auth. No editable owner/admin field exists.

The migration fails atomically if its table/function names already exist; do not
drop existing objects to force it through. Inspect the conflict first. The client
uses a publishable key; that key cannot deploy this schema. Use the authorised
Supabase management connection or SQL Editor as the project administrator. Do not
add a service-role key, database password or access token to the mobile app.

Prefer the management connection's migration operation, which records migration
history. If applying manually through SQL Editor, record the file/version/date and
reconcile its applied status before a later CLI `db push` so it is not applied twice.
This migration was applied to the configured BookMyTurn project on 30 October
2026. The management tool recorded version `20261030015043`; the original local
filename `20261029000100_customer_profiles.sql` was renamed to match, with its SQL
unchanged. Do not reapply it to this project.
No destructive down migration is supplied; a production rollback needs a separate
data-preserving plan. The existing discovery UI remains compatible before and
after deployment because this step makes no profile request as a guest.

## Permission validation

After applying the migration, run
[customer_profiles.sql](tests/customer_profiles.sql) as the development project's
database administrator. It creates two transaction-local Auth identities with
reserved fixture UUIDs and `.invalid` emails, switches into the real `authenticated`
and `anon` roles, and tests grants/RLS against separate JWT subjects.

It covers provisioning/backfill, metadata isolation, self read/update, cross-user
denial in both directions, absent subjects, anonymous denial, identity/timestamp
protection, name constraints, forbidden insert/delete/truncate/function calls and
account deletion cascade. All test data/helpers are rolled back; a final check
verifies cleanup. Fixture-ID collisions fail before modifying existing users.
The test sends no email and does not create Auth API sessions. Signed-token and
real sign-in/session persistence checks follow with milestone 03.

Run the read-only project probe from the repository root:

```sh
npm run check:supabase
```

It checks Auth API access with the configured public key, reports email-confirmation
configuration, verifies anonymous profile/queue denial and the 13 approved salon
slugs, and confirms the private schema is not exposed in the Data API. It requests
zero private records and prints no project URL, key or user records.
This probe alone is not proof that two customers are isolated: also run the SQL
permission suite. Milestone 03 now explicitly requests immediate development
signup without confirmation; see [CUSTOMER_AUTH.md](../docs/CUSTOMER_AUTH.md) for
the setting, read-only verification status and remaining live test gate.

## Isolated CI database

The database CI job uses disposable PostgreSQL 17 and
[bootstrap-ci.sql](tests/bootstrap-ci.sql) to stand in for the managed Auth schema
and roles, then applies the real migration and permission suite. The fixture also
models permissive default grants and an existing Auth account so revocation and
backfill are exercised. It is not a full Supabase Auth server.

**Never run bootstrap-ci.sql on a hosted Supabase project.** Its database-name
guard and transaction reject use outside the disposable `bookmyturn_test` database.
Hosted validation uses Supabase's existing Auth schema with the permission test
only. CI is independent of hosted credentials; a green CI job does not claim the
migration is deployed to the configured project.

## App lifecycle

`src/lib/supabase/client.ts` lazily constructs one typed client after mount; static
exports instantiate no client. Only `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are used. Invalid/missing configuration is
available as a safe session state and does not prevent guest discovery.

The session provider restores existing sessions, follows Auth events synchronously,
ignores stale restore results after newer events/unmount, cleans up subscriptions,
and starts/stops native refresh with foreground/background changes. Native session
storage uses the official AsyncStorage pattern (OS app storage, not encrypted);
web uses the SDK's browser storage. The storage key is scoped to this Customer app
and project. Tokens and raw SDK errors are never logged by the integration.

Profile helpers derive the ID from `auth.getUser()`, expose self read/display-name
update only and rely on database enforcement. The schema contract is handwritten
and explicitly tied to the migration. Hosted generated types were compared on
30 October 2026: row/insert shapes match; Update intentionally permits only the
display-name field allowed by grants (generated types do not model column grants).
Regenerate/diff after future schema changes. There are no automatic signups, anonymous Auth accounts,
profile edits or salon data requests merely from opening the app.

## Current validation status

- Project URL/publishable key: Auth settings endpoint verified, email provider and
  email confirmation enabled.
- Migration deployed through the authorised connection, version `20261030015043`.
- Hosted permission suite passed against real Auth roles and separate subjects;
  rollback and an independent count check confirmed no test accounts/profiles remain.
- Public-key probe passed: Auth reachable and anonymous profile access denied.
- Supabase security and performance advisors: no findings on 30 October 2026.
- Local unit tests: 11 passed; lint/types, web export and Expo Doctor 21/21 passed.
- Both iOS and Android bundle exports passed.
- All nine guest-discovery browser journeys passed with the provider mounted.
- CI SQL permission results: see [PR #4](https://github.com/nadhirhasan/BookMyTurn/pull/4).
  The migration applied in PostgreSQL 17; a temporary-schema grant in the initial
  test run was corrected before the rerun.
- UI acceptance: the user approved the runnable discovery UI and requested this
  next step. Native signed-in session restoration remains a milestone 03 check.

## Customer pipeline integration

Apply all migrations in timestamp order, including the customer pipeline,
refinements, estimates and QR receipt APIs. The app now reads the hosted catalogue
and writes controlled customer commands. `supabase/config.toml` declares only the
authorised development email-confirmation setting. Anonymous Auth stays disabled.
Use Supabase CLI 2.122+ for config push; older CLI versions may reset undeclared
settings. QR arrivals are public, scoped commands with private device receipts.
See [full customer workflow](../docs/CUSTOMER_PIPELINE.md).
