# BookMyTurn

A customer-first salon app for Akurana, Sri Lanka, built with React Native,
Expo, TypeScript and Supabase.

The Customer, Manager and Barber apps use the approved Charcoal & Champagne
dark design, DM Sans, photo-led layouts and live Supabase data. The customer journey includes:
salon discovery, immediate waiting queues, calendar/time selection, appointment requests,
hairstyle sharing, barber profiles and reviews after completed services.
Email/password signup signs in immediately without verification emails.
The salon QR web route joins the waiting queue without an app or any Auth account.
See [the complete walkthrough and validation](docs/CUSTOMER_PIPELINE.md).

- [Implementation checklist](docs/IMPLEMENTATION_PLAN.md)
- [Approved dark design and implementation checks](docs/CHARCOAL_IMPLEMENTATION.md)
- [Implemented screen previews](design/reviews/charcoal-implementation/README.md)
- [Interactive design reference](design/charcoal-champagne/README.md)
- [Customer redesign: research, decisions and validation](docs/CUSTOMER_UX_REDESIGN.md)
- [Customer redesign screenshots](design/reviews/customer-redesign/README.md)
- [Manager and Barber redesign](docs/STAFF_UX_REDESIGN.md)
- [Staff screen previews](design/reviews/staff-redesign/README.md)
- [Customer UI, validation and phone walkthrough](docs/CUSTOMER_FOUNDATION.md)
- [Supabase foundation and hosted deployment status](supabase/README.md)
- [Customer specification](idea/customer.md)
- [Manager specification](idea/manager.md)
- [Barber app setup and cross-app testing](docs/BARBER_WORKFLOW.md)
- [Manager accounts, multiple salons and teams](docs/MANAGER_WORKFLOW.md)
- [Live queue, Activity and Manager UI redesign](docs/LIVE_OPERATIONS.md)
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

Development data and test accounts were reset at your request on 31 October 2026.
Create fresh accounts and your own salons; each starts with an empty queue.
Salons, staff, hours, queues and appointments live in Supabase.
Customer availability refreshes every 15 seconds, on focus and app foreground.
The haircut gallery starts empty; customers can upload their own favourite photos.

## Run the Manager app

From the repository root, in a separate terminal:

```powershell
cd C:\Users\pc\Mobile-Apps\BookMyTurn
npm run manager:tunnel
```

Scan its QR in Expo Go. The Manager app uses port 8084; the Customer app uses
8081, so both can run together. `npm run manager` uses LAN and
`npm run manager:web` opens a browser preview. The previous `barber` commands
remain aliases for the same app.

Create one manager account, then add as many salons as you manage. Inside each
salon, create its barber profiles. Upload salon covers,
barber portraits and your private account avatar. No verification email is
required. Existing salons/accounts are preserved. Each new salon appears in the
Customer app; bookable capacity appears after adding an active barber.
See the [manager walkthrough](docs/MANAGER_WORKFLOW.md).

The salon opens on a live Queue board with **Waiting** and **In service** views.
Every Join Queue counts immediately; customers receive a code with no arrival
confirmation. Staff verify the code, start the haircut and record the final price
on completion. See [the single-step queue workflow](docs/SINGLE_STEP_QUEUE.md). **Agenda** contains appointment requests across all
dates plus the selected day's schedule. **Activity** keeps joins, arrivals and
booking updates with unread badges. Private Realtime invalidations refresh the
database views, with a five-second foreground polling fallback.
Optional phone banners/sounds while the app runs can be enabled under Account.
Closed-app remote push is not configured in this Expo Go workflow.

The new workflow removes service/price catalogues from the apps. Customers save
private haircut photos in the Haircuts tab and optionally attach one when joining
or booking. Barbers use six-digit customer codes, view the reference, start the
haircut and enter only the final price at completion. See
[the simple haircut workflow](docs/SIMPLE_HAIRCUT_WORKFLOW.md).

This branch also adds named haircut collections and full-image previews in both
apps. Several photos can be uploaded together and optionally shared on a visit.
The [collection migration and device walkthrough](docs/HAIRCUT_COLLECTIONS_WORKFLOW.md)
are deployed and hosted checks pass; existing accounts/photos are preserved.

The haircut migrations are deployed and hosted checks pass. The earlier clean
reset was completed at your request. This collection update preserves current
accounts, uploads and visits. Reload both apps to test the new gallery.

## Configuration

Owner accounting is deployed with a **Finance** tab to the Manager app for
completed-sale history, expenses, estimated profit, daily/monthly reports and
barber performance. Ordinary barbers cannot open owner financial data. Pricing
still asks for the actual amount only after the haircut. See the
[accounting plan](docs/OWNER_ACCOUNTING_PLAN.md) and
[workflow/deployment notes](docs/OWNER_ACCOUNTING_WORKFLOW.md).

Individual barber logins are now deployed through owner-shared invitations.
Use **Salon → Team → Login access** to create a seven-day invitation. The barber
opens it or pastes it into **Join a salon**, signs in and accepts the existing
chair. Owners can replace/cancel links or remove login access without deleting
the barber's history. My Work shows counts and reviews; financial history is
restricted by the database. See [the feature plan](docs/BARBER_INVITATIONS_PLAN.md)
and [workflow](docs/BARBER_INVITATIONS_WORKFLOW.md) for deployment status.

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
