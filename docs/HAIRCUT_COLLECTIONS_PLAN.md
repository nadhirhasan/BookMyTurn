# Haircut collections and full-image previews

Each customer keeps named private collections, such as a haircut with front, side and back references. Tapping a picture opens the uncropped image in a full-screen viewer. Booking/queue selection optionally shares a snapshot of the collection with the authorized barber.

- [x] Add collection ownership, collection/photo CRUD and multi-photo visit snapshots. Preserve existing photos, visits and permissions; no data reset.
- [x] Build collection cards/details, multiple-photo uploads and red required-name validation in the approved light style.
- [x] Add a shared full-screen viewer to customer photos, booking/queue previews and barber references, with next/previous controls, loading/retry and fresh private signed URLs.
- [x] Share all collection images atomically when booking/joining. Later gallery edits must not change the reference already sent to the barber.
- [x] Verify ownership/privacy, multi-image snapshots, legacy compatibility and retries in isolated database tests; verify collection CRUD and previews in both apps' browser tests.
- [x] Complete both workspace lint/types, 22 unit tests, 57 browser journeys and iOS/Android/web exports for both apps.
- [ ] Apply and verify the additive hosted migration after explicit approval, then regenerate the public database snapshot.
- [x] Open [PR #15](https://github.com/nadhirhasan/BookMyTurn/pull/15), stacked on #14. Final CI is tracked on the PR; no merge performed.
- [ ] User phone acceptance.

Collections hold up to 20 photos each, with the existing 2 MB per-image limit. Existing individual photos become one-photo collections. No seeded images, services, prices, new Auth settings or public photo access are introduced.

Hosted deployment is pending: automatic approval review requires explicit approval for this new hosted schema/RLS/function migration. It has not been applied. Existing accounts and photos are retained.
