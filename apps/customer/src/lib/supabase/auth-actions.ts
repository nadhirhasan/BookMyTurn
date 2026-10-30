import type { SupabaseClient } from '@supabase/supabase-js';

type Auth = Pick<SupabaseClient['auth'], 'signInWithPassword' | 'signUp' | 'signOut'>;
export type Credentials = { email: string; password: string };
export type AuthResult = { ok: true } | { ok: false; error: string };
export type CredentialErrors = { email?: string; password?: string };
export type AuthMode = 'sign-in' | 'sign-up';

export function validateCredentials(mode: AuthMode, { email, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) errors.password = 'Enter your password.';
  else if (mode === 'sign-up' && [...password].length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}

function messageFor(error: { code?: string; status?: number }, mode: AuthMode) {
  if (error.status === 429 || error.code === 'over_request_rate_limit') return 'Too many attempts. Please wait a moment and try again.';
  if (error.code === 'invalid_credentials' || error.code === 'email_not_confirmed') return 'We could not sign you in. Check your email and password.';
  if (error.code === 'user_already_exists' || error.code === 'email_exists') return 'An account may already exist for this email. Try signing in.';
  if (error.code === 'weak_password') return 'Choose a stronger password and try again.';
  return mode === 'sign-in' ? 'We could not sign you in. Please try again.' : 'We could not create your account. Please try again.';
}

export function createAuthActions({ getClient, canSignUpImmediately }: {
  getClient: () => { client: { auth: Auth } | null; error?: string | null };
  canSignUpImmediately: () => Promise<boolean>;
}) {
  // Shared across account routes: navigating away/back cannot start a duplicate
  // request while the SDK is still finishing the original explicit submission.
  let pending = false;
  const run = async (operation: () => Promise<AuthResult>): Promise<AuthResult> => {
    if (pending) return { ok: false, error: 'Please wait for the current request to finish.' };
    pending = true;
    try { return await operation(); }
    catch { return { ok: false, error: 'Could not connect. Check your connection and try again.' }; }
    finally { pending = false; }
  };
  return {
    submit(mode: AuthMode, credentials: Credentials) {
      return run(async () => {
        const errors = validateCredentials(mode, credentials);
        if (errors.email || errors.password) return { ok: false, error: errors.email ?? errors.password! };
        const { client } = getClient();
        if (!client) return { ok: false, error: 'Account access is unavailable right now. You can still browse salons.' };
        // Verification is explicitly deferred. Check BEFORE signup so a changed
        // project setting cannot quietly start sending confirmation emails.
        if (mode === 'sign-up' && !await canSignUpImmediately()) {
          return { ok: false, error: 'Account creation is temporarily unavailable. Please try again later.' };
        }
        const input = { email: credentials.email.trim().toLowerCase(), password: credentials.password };
        const { data, error } = mode === 'sign-in'
          ? await client.auth.signInWithPassword(input)
          : await client.auth.signUp(input);
        if (error) return { ok: false, error: messageFor(error, mode) };
        if (!data.session) return { ok: false, error: 'Your account could not be signed in. Try signing in with your email and password.' };
        return { ok: true };
      });
    },
    signOut() {
      return run(async () => {
        const { client } = getClient();
        if (!client) return { ok: false, error: 'Account access is unavailable right now. Please try again.' };
        const { error } = await client.auth.signOut({ scope: 'local' });
        return error ? { ok: false, error: 'Could not sign out. Please try again.' } : { ok: true };
      });
    },
  };
}
