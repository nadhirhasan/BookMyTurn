import { test, expect, type Page } from '@playwright/test';
import { mockDatabase } from './fixtures';
const email = 'customer@example.invalid';
const password = 'Fixture password 123';
const userId = 'b04f0000-0000-4000-8000-000000000001';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email,
  email_confirmed_at: '2026-10-30T00:00:00Z', created_at: '2026-10-30T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], is_anonymous: false };
const jwt = () => `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
async function authApi(page: Page, options: {
  confirmation?: boolean;
  failLogin?: boolean;
  profileError?: boolean;
} = {}) {
  await mockDatabase(page);
  const calls = { signups: 0, signins: 0, signouts: 0, profiles: 0, settings: 0 };
  await page.route('**/auth/v1/**', async (route) => {
    // Intercept any host, then assert the isolated test configuration. A local
    // .env can never cause these fictional credentials to reach real Auth.
    expect(new URL(route.request().url()).host).toBe('example.supabase.co');
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204 });
    if (path.endsWith('/settings')) {
      calls.settings++;
      return route.fulfill({ json: { external: { email: true }, mailer_autoconfirm: !options.confirmation } });
    }
    if (path.endsWith('/user'))
      return route.fulfill({ json: user });
    if (path.endsWith('/logout')) {
      calls.signouts++;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/token') || path.endsWith('/signup')) {
      const signup = path.endsWith('/signup');
      if (signup)
        calls.signups++;
      else
        calls.signins++;
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject({ email, password });
      if (!signup && options.failLogin)
        return route.fulfill({ status: 400,
          headers: { 'x-supabase-api-version': '2024-01-01', 'access-control-expose-headers': 'X-Supabase-Api-Version' },
          json: { code: 'invalid_credentials', msg: 'Raw private server message' } });
      return route.fulfill({ json: { user, access_token: jwt(), refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600 } });
    }
    throw new Error(`Unexpected Auth request: ${path}`);
  });
  await page.route('**/rest/v1/customer_profiles?**', async (route) => {
    expect(new URL(route.request().url()).host).toBe('example.supabase.co');
    expect(new URL(route.request().url()).searchParams.get('id')).toBe(`eq.${userId}`);
    calls.profiles++;
    return options.profileError
      ? route.fulfill({ status: 403, json: { code: '42501', message: 'private database error' } })
      : route.fulfill({ json: { id: userId, display_name: null, created_at: user.created_at, updated_at: user.created_at } });
  });
  return calls;
}
async function fillCredentials(page: Page) {
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
}
test('account entry offers simple forms, validation, password visibility and guest browsing', async ({ page },info) => {
  const calls = await authApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.screenshot({path:info.outputPath('customer-sign-in.png')});
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Enter your password.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Create an account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.screenshot({path:info.outputPath('customer-sign-up.png')});
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveJSProperty('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  expect(calls.signups + calls.signins).toBe(0);
  await page.getByRole('button', { name: 'Continue without an account', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Hi there/ })).toBeVisible();
});
test('signup signs in immediately, restores after reload and signs out on this device', async ({ page }, testInfo) => {
  const calls = await authApi(page);
  await page.goto('/sign-up');
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await expect.poll(() => calls.profiles).toBeGreaterThan(0);
  expect(calls.signups).toBe(1);
  expect(calls.settings).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('account.png') });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(calls.signouts).toBe(1);
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(calls.signups).toBe(1);
});
test('password login failures are safe and can be retried', async ({ page }) => {
  const options = { failLogin: true };
  const calls = await authApi(page, options);
  await page.goto('/sign-in');
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('We could not sign you in. Check your email and password.')).toBeVisible();
  await expect(page.getByText('Raw private server message')).toHaveCount(0);
  options.failLogin = false;
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  expect(calls.signins).toBe(2);
});
test('signup uses the immediate session without an extra settings gate or email UI', async ({ page }) => {
  const calls = await authApi(page, { confirmation: true });
  await page.goto('/sign-up');
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  expect(calls.signups).toBe(1);
  expect(calls.settings).toBe(0);
  await expect(page.getByText(/check your inbox|resend|verify your email/i)).toHaveCount(0);
});
test('network errors release the form and profile failures keep browsing/signout available', async ({ page }) => {
  await authApi(page, { profileError: true });
  await page.route('**/auth/v1/token?**', route => route.abort('failed'));
  await page.goto('/sign-in');
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/could not|check your/i);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
  await page.unroute('**/auth/v1/token?**');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry profile', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explore salons', exact: true }).click();
  await expect(page.getByRole('heading', { name: '13 salons to explore' })).toBeVisible();
});
for (const width of [320, 393, 430]) {
  test(`account forms fit ${width}px and remain usable with short screens`, async ({ page }, testInfo) => {
    await authApi(page);
    await page.setViewportSize({ width, height: 680 });
    for (const [name, path] of [['sign-in', '/sign-in'], ['sign-up', '/sign-up']]) {
      await page.goto(path!);
      await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Continue without an account', exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: 'Continue without an account', exact: true })).toBeInViewport();
      if (width === 393) {
        await page.setViewportSize({ width, height: 852 });
        await page.getByText('YOUR ACCOUNT', { exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
        await page.setViewportSize({ width, height: 680 });
      }
    }
  });
}
