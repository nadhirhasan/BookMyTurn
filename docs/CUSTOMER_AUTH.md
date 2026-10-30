# Customer authentication

Email/password sign-in and signup are connected to Supabase. Signup returns an
immediate session: email verification, callback, password reset, social login,
resend and OTP flows are deferred by explicit user instruction.

## Configuration and behavior

On 30 October 2026, Supabase CLI applied only
`auth.email.enable_confirmations=false` to BookMyTurn. The public Auth API was
then verified to return `mailer_autoconfirm=true`. The previous public-settings
gate and its misleading “temporarily unavailable” error were removed.
`supabase/config.toml` records the setting; CLI 2.122+ leaves undeclared remote
properties unchanged. No anonymous Auth sign-in setting was enabled.

Use a syntactically valid dummy address such as `customer1@example.com` and a
password of at least eight characters. There is no inbox step. Passwords retain
their original whitespace; email is trimmed and normalised. No email address
grants staff/admin privileges. An existing duplicate address must sign in.

Account routes reuse the approved white/charcoal design and DM Sans. The user
authorised the existing style after Figma's Starter allowance blocked new frames;
their Figma counterparts remain pending. Forms include visibility toggles,
validation, loading and safe errors. Successful sessions are required to count
as signed in. Return navigation resumes the customer flow after authentication.

Only the publishable key is used in the app. No passwords/tokens are logged.
The SDK persists and restores the session, refreshes in the native foreground,
uses `flowType=implicit` and disables URL-session detection. Profile identity is
derived from `auth.getUser`; RLS and column grants restrict own profile edits.
Business table writes use controlled RPCs that derive identity server-side.

## Physical QR visitors

Salon QR arrivals do not require authentication. They create an arrived queue
row and a private device receipt, with no Auth user or account. See
[the QR journey and customer walkthrough](CUSTOMER_PIPELINE.md).

## Verification

22 unit tests and 20 isolated browser journeys passed, including signup,
login/logout/restore, safe failures and mobile layouts. A separately authorised
hosted test created two disposable accounts, verified immediate sessions,
automatic profiles, private name edits, cross-user denial, restoration, wrong
password rejection, valid login and duplicate signup rejection. Both accounts
were signed out and deleted with their profiles/visits; follow-up count was zero.

Read-only connectivity probe: `npm run check:supabase`. It reports confirmation
mode without printing credentials. Physical iPhone acceptance and PR review/
merge remain user checks; they are not replaced by bundle/browser validation.
