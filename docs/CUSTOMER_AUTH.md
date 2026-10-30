# Customer sign-in and sign-up

Milestone 03 scope revised by the user on 30 October 2026: simple email/password
sign-in/sign-up now; no verification, callback, reset, social login or other email
flows. Account screens are optional and never block salon discovery.

## Design and app behavior

Figma returned its Starter-plan tool-call limit before account screens could be
created. The user explicitly chose **Use the approved style now**. These screens
reuse the existing white/charcoal theme, DM Sans typography and touch controls.
Their Figma counterparts remain pending; no new Figma frame is claimed.

- Home's Account button opens /account. Guests go to /sign-in.
- /sign-in and /sign-up have email/password fields, show/hide password, inline
  validation, loading/error states and Continue without an account.
- Sign-up requires at least eight characters; sign-in accepts existing shorter
  passwords. Password whitespace is preserved. Only email is trimmed/normalised.
- A real SDK session is required for success; user-only responses never count as
  signed in. Existing session wiring persists/restores sessions across launches.
- /account shows the signed-in email, the private display name if available,
  retryable profile loading and sign-out on this device. It makes no management
  role claims. Profile errors do not block browsing or logout.
- No plaintext credentials are persisted or logged. Repeated/in-flight requests
  are guarded across account routes. SDK errors are mapped to safe messages.
- Native keyboard avoidance and scrolling support short screens; native behavior
  still requires the user's iPhone verification.

No new package, schema migration, staff provisioning or business-table write is
introduced. The server Auth trigger creates the initial minimal customer profile.
Profile requests verify the Auth user and continue to rely on RLS.

## Supabase development setting

Immediate sign-up requires Confirm email off on BookMyTurn's Authentication →
Sign In / Providers page. The user requested this and reported saving the change,
but the last read-only API check still returned mailer_autoconfirm=false. Recheck
the configured project until the public setting reports true.

Before signup, the app reads the public Auth settings. If the email provider is
disabled, confirmation is enabled, signup is disabled or the check fails, it
does not send the signup request. This avoids starting a deferred email flow.
Sign-in and guest browsing remain available. A settings race between the check
and signup is still a server configuration concern; keep the project setting
consistent with this milestone.

The client uses direct password session responses, flowType=implicit and
detectSessionInUrl=false. No token-bearing URL flow is used. Supabase documents
that [PKCE email signup cannot be used with auto-confirm enabled](https://supabase.com/docs/reference/javascript/auth-signup).
Verified-link/OAuth support needs a separately agreed implementation later.

Read-only setup probe from the repository root: npm run check:supabase. It prints
the confirmation mode without printing URL/key/private records.

## Validation record

- [x] Lint and TypeScript passed again after final source refinements.
- [x] 22 unit tests passed: credentials, safe errors, concurrent requests, signup
  policy, configuration, session restoration/races and native refresh lifecycle.
- [x] All 17 browser checks passed, including sign-up/login/logout/restore and the
  existing guest journeys. Browser Auth is intercepted at an isolated fixture URL;
  no mocked credentials or accounts reach the hosted project.
- [x] Visual review at 393×852 and responsive checks at 320/393/430px completed.
  [Sign in](reviews/customer-sign-in.png), [sign up](reviews/customer-sign-up.png),
  [account](reviews/customer-account.png). Local Windows teardown needed the owned
  Expo test server to be closed explicitly after all browser assertions passed.
- [x] Web/iOS/Android bundle exports passed; web includes 27 static routes.
- [x] Feature CI passed on runtime/source commit e998fae: [run 41001570662](https://github.com/nadhirhasan/BookMyTurn/actions/runs/41001570662).
  Evidence commit 6ff3dbb also passed [run 41003044544](https://github.com/nadhirhasan/BookMyTurn/actions/runs/41003044544).
  Both app and database jobs passed, including clean install, 22 unit tests,
  17 browser journeys, web export and both database suites. Later evidence-only
  commits retain this source evidence; current checks are shown on the PR.
- [ ] Public Auth settings reflect immediate signup.
- [ ] Live password signup/login, signed-token RLS and cleanup passed.
- [ ] User iPhone verification and PR acceptance/merge.

Automatic approval review rejected the proposed live test because it would
create persistent hosted Auth accounts/sessions without explicit authorization
and deletion included in the planned action. The script did not run; no hosted
test accounts were created. The user subsequently approved two disposable
accounts, sign-out and immediate deletion. A read-only preflight verified that
the two generated fixture addresses do not already exist. Creation remains
unexecuted because the configured project's public settings still return
mailer_autoconfirm=false after the user reported saving Confirm email off again.
A dashboard URL and switch state after reloading were requested to reconcile
the discrepancy. No additional test approval is needed; wait for immediate
signup mode, then include sign-out/deletion in the test's cleanup orchestration.
Mock tests are not presented as proof of the hosted signup flow.

## Phone review steps

1. Start the app with the existing Expo Go setup. Open Account from Home.
2. Browse both forms and their password toggle; submit blank/invalid fields.
3. Once the development setting is verified, create a disposable account, check
   its signed-in view, close/reopen the app and confirm session restoration.
4. Sign out, sign back in, test an incorrect password and return to guest browsing.
5. Check that the keyboard does not cover inputs/actions on the iPhone. Android
   physical-device checks remain outstanding even when its bundle export passes.

Do not tick milestone completion until the agreed live/device checks and PR
acceptance/merge are complete. Email verification/recovery remain explicitly
deferred rather than silently marked complete.
