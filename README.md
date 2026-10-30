# BookMyTurn

A customer-first salon app for Akurana, Sri Lanka, built with React Native,
Expo, TypeScript and Supabase.

The customer workflow uses the approved light design and live Supabase data:
salon discovery, physical queues, calendar/time selection, appointment requests,
hairstyle sharing, barber profiles and reviews after completed services.
Email/password signup signs in immediately without verification emails.
The salon QR web route records arrival without an app or any Auth account.
See [the complete walkthrough and validation](docs/CUSTOMER_PIPELINE.md).

- [Implementation checklist](docs/IMPLEMENTATION_PLAN.md)
- [Customer UI, validation and phone walkthrough](docs/CUSTOMER_FOUNDATION.md)
- [Supabase foundation and hosted deployment status](supabase/README.md)
- [Customer specification](idea/customer.md)
- [Manager specification](idea/manager.md)
- [Approved Figma discovery screens](https://www.figma.com/design/wugLxCXK2CM44607SvxZwF?node-id=9-140)
- [Design sources, licences and remaining screens](design/README.md)

## Run the Customer app

Use Node 22.13+ and npm 10+ from the repository root:

```sh
npm ci
npm start
```

Open Expo Go on an iPhone or Android phone connected to the same Wi-Fi.
Scan the terminal QR code (iPhone: Camera). This project uses Expo SDK 57;
the installed Expo Go must support it. Windows cannot launch an iOS simulator.
For a browser preview, run `npm run web`.

For Expo Go through a tunnel (including when same-Wi-Fi access fails):

```powershell
cd C:\Users\pc\Mobile-Apps\BookMyTurn
npm run start:tunnel
```

The existing `npm start -- --tunnel --go` command also works. On Windows, the
project launcher exposes npm's existing global modules to Expo for that process,
preventing the repeated ngrok-install prompt. No additional installation or
system environment change is needed. See [tunnel startup notes](docs/TUNNEL_STARTUP.md).

Salons, staff, service prices, hours and hairstyle references are fictional
catalogue records seeded in Postgres. Queues, appointments and reviews are real
database records created by your testing. Availability refreshes every 15 seconds,
on screen focus and app foreground. Images are illustrative stock photographs.

## Configuration

Root `.env` is ignored. Copy `.env.example` if setting up another checkout.
The app config loads root values as fallback without replacing injected
environment variables. Only project URL and publishable key belong in app
configuration; never add database passwords or service-role/secret keys.
Supabase is required for catalogue and visit data. Connection failures show a
retry state; there is no hardcoded fallback dataset. Apply all migrations for a
new project, and push the declared development Auth configuration with Supabase
CLI 2.122+ to disable email confirmation. Anonymous Auth sign-ins stay disabled.
See [database deployment evidence](supabase/SCHEMA_VALIDATION.md).

Physical salon QR links use `/qr/<salon-slug>` on a hosted web version. The Expo
Go terminal QR opens the development app; it is a different QR. The web build is
an SPA: its host must send unknown paths to `index.html`. A public web hostname
and iOS/Android universal/app links have not been deployed by this PR.

## Checks

```sh
npm run check
npm run export:web
npx expo-doctor
```

Run Expo Doctor from `apps/customer`. Browser journey tests:

```sh
cd apps/customer
npx playwright install chromium
npm run test:e2e
```

The tests launch their own Expo server on port 8082. Keep that port free.
CI checks a clean install, lint, types, web export and browser journeys.
See the feature document for outstanding device checks and dependency advisories.

Each feature has a separate PR. User verification and merge are required before
a milestone is marked complete. The PR chain is design #2, discovery #3, then the Supabase foundation feature.
Merge/retarget in that order; later features do not merge their prerequisites
automatically.
