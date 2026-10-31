# Haircut collections and full-image previews

Each customer keeps named private collections, such as a haircut with front, side and back references. Tapping a picture opens the uncropped image in a full-screen viewer. Booking/queue selection optionally shares a snapshot of the collection with the authorized barber.

- [ ] Add collection ownership, collection/photo CRUD and multi-photo visit snapshots. Preserve existing photos, visits and permissions; no data reset.
- [ ] Build collection cards/details, multiple-photo uploads and red required-name validation in the approved light style.
- [ ] Add a shared full-screen viewer to customer photos, booking/queue previews and barber references, with next/previous controls, loading/retry and fresh private signed URLs.
- [ ] Share all collection images atomically when booking/joining. Later gallery edits must not change the reference already sent to the barber.
- [ ] Verify ownership/privacy, multi-image snapshots, legacy compatibility and retries in database tests; verify collection CRUD and previews in both apps' browser tests.
- [ ] Apply and verify the additive hosted migration, regenerate database types and complete lint/types/native exports.
- [ ] Open a separate feature PR with final CI and validation evidence. User phone acceptance remains a separate check.

Collections hold up to 20 photos each, with the existing 2 MB per-image limit. Existing individual photos become one-photo collections. No seeded images, services, prices, new Auth settings or public photo access are introduced.
