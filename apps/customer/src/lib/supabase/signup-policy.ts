// Uses only the public settings endpoint. No admin key or privileged settings
// update belongs in the Customer app.
export async function checkImmediateSignup(url: string, publishableKey: string) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey }, signal: abort.signal,
    });
    if (!response.ok) return false;
    const settings = await response.json();
    return settings.external?.email === true && settings.mailer_autoconfirm === true && settings.disable_signup !== true;
  } finally { clearTimeout(timer); }
}
