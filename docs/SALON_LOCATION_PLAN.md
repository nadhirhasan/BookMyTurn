# Salon location pins and directions

Prepared 5 November 2026. Feature PR required; phone acceptance follows validation.

- [x] Inspect salon creation/editing, public catalog and Expo 57 map/location APIs.
- [x] Add paired, range-checked latitude/longitude fields and atomic owner-only saves. Preserve existing salons with no pin and compatibility with earlier clients.
- [x] Require a pin in the updated salon form. Open a full-screen map to tap/drag the salon pin, optionally show/use the manager's current position, confirm or cancel without losing the form.
- [x] Display saved location in salon management and customer details. Open the exact coordinates in Google Maps, with Apple Maps available on iPhone. Explain missing legacy pins without inventing coordinates.
- [x] Verify permissions, invalid coordinates, create retries, persistence, customer catalog, browser interactions, denied GPS, narrow screens and native/web exports.
- [x] Open the PR; deploy and verify the tested migration. Preserve business records.

## Implementation choices

Native manager map: Expo Go's bundled react-native-maps (Google Maps on Android, Apple Maps on iPhone). Browser map: locally bundled Leaflet 1.9.4 and standard OpenStreetMap tiles with visible attribution, ordinary browser caching, no offline prefetch. Current location: expo-location, requested only after tapping Use my location; no background tracking and no automatic save of the manager's position.

The map initially shows the existing salon pin, or an Akurana-area viewport. A default viewport is never saved as a real salon position. The manager must select a pin and confirm. The original address remains visible. Pan/zoom, map tap and draggable pin work independently of location permission. A pending GPS result must not overwrite a newer manual selection or a closed picker.

Coordinates are public business-location data stored on the salon, returned by existing catalog/state JSON. Only an owner can change them. Existing clients remain compatible when omitting the new fields; if supplied, the pair must be finite JSON numbers in valid latitude/longitude ranges. Create retries preserve an already-created salon's pin. Updated manager UI requires a pin for create/save.

Google Maps universal directions URLs use the exact coordinates and need no API key. Do not capture customer live location; the external maps app handles navigation. Apple Maps is an alternative on iOS. Existing salons without pins display a request for the manager to add one.

## Configuration and references

- [Expo 57 react-native-maps](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/): no extra setup for Expo Go. Store builds using Google Maps require a restricted Maps SDK key; configure the manager Android key before app-store release.
- [Expo 57 foreground location](https://docs.expo.dev/versions/v57.0.0/sdk/location/).
- [Google Maps universal URLs](https://developers.google.com/maps/documentation/urls/get-started).
- [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html) and [OSM tile usage](https://operations.osmfoundation.org/policies/tiles/). Public tile availability is best-effort; use an appropriate hosted tile provider before substantial production traffic.

No Google Places search or paid cloud project is needed for this pin-selection flow. UI redesign remains deferred per the user's instruction.

## Validation

All 31 migrations replayed in isolated PostgreSQL 15; all 16 SQL suites passed, including owner/foreign-owner/barber/customer/anonymous access, malformed or missing coordinate pairs, ranges, zero coordinates, atomic create failures, retry preservation, archived salons, public catalog and legacy client updates. CI runs these suites on PostgreSQL 17.

Twenty-two manager browser journeys passed across the new location picker and existing manager/catalog CRUD. Eight customer journeys passed across Maps handoff and existing appointment/queue flows. The six picker journeys were rerun after the final stylesheet/resize adjustment. Tests use local tile fixtures; a separate live OSM viewport check confirmed real tiles load. Browser confirmation, cancel, marker drag, permission denial, GPS accuracy, stale GPS responses and 320px layout are covered.

Both apps pass lint and TypeScript. iPhone, Android and web production exports passed for both apps with placeholder API configuration. Pure location/URL tests cover zero/invalid coordinates, exact signed coordinates and encoded salon names. Leaflet CSS is bundled locally with its license; unused upstream marker/layer image URLs are removed to avoid Metro's unsupported CSS image imports.

The local Edge policy blocks opening Google Maps externally; the browser test verifies the exact URL sent to the platform's open-URL function without changing that policy. Native map rendering, phone GPS permission/accuracy and the Google/Apple Maps app handoff require device acceptance. Google Maps Android store builds need a restricted `GOOGLE_MAPS_ANDROID_API_KEY`, supported by manager app.config.ts; Expo Go needs no extra key.

Hosted security advisor matches the existing leaked-password-protection warning, with no new findings.

## Hosted rollout

[PR #25](https://github.com/nadhirhasan/BookMyTurn/pull/25) is stacked on #24; no automatic merge. Migration `20261105071423_salon_location_pins` is applied. The unchanged local migration was renamed from its CLI preparation timestamp (`20261105064909`) to match hosted history and prevent duplicate future application.

The complete salon-location SQL suite passed on hosted Supabase, with every fixture change rolled back. Independent checks confirm zero fixture accounts/salons remain, no anonymous write-RPC access, no client execution of the private legacy command, and zero invalid coordinate pairs. Existing business records are preserved.

Phone acceptance: in Manager, create/edit a salon → Choose on map → Use my location or tap/drag → Use this pin → Save. In Customer, open that salon → Get directions in Google Maps (or Apple Maps on iPhone). Verify both the pin and arrival route on the device.
