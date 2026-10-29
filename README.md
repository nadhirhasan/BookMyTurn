# BookMyTurn

A customer-first salon app for Akurana, Sri Lanka, built with React Native,
Expo, TypeScript and Supabase.

The first runnable feature follows the approved light Figma design: Home,
comparison of 13 fictional salons, and salon availability. Browse as a guest,
search salon/barber names, compare estimated waits and prices, and inspect visit
windows. Queue joining, appointments and accounts are clearly marked coming next.

- [Implementation checklist](docs/IMPLEMENTATION_PLAN.md)
- [Current feature, validation and phone walkthrough](docs/CUSTOMER_FOUNDATION.md)
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

All queue values, opening status, ratings, prices and windows are a fixed
fictional snapshot at 2:00 pm in Asia/Colombo, not live availability.
Images are licensed illustrative photos. No booking or database record is
created in this step.

## Configuration

Root `.env` is ignored. Copy `.env.example` if setting up another checkout.
The app config loads root values as fallback without replacing injected
environment variables. Only project URL and publishable key belong in app
configuration; never add database passwords or service-role/secret keys.
The discovery preview works without Supabase. Connectivity, migrations, RLS and
authentication are later verified steps; reading configuration is not a
successful database connection.

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
a milestone is marked complete. The implementation PR is stacked on design PR #2;
merge the design first and then retarget the feature PR to main.
