# Haircut collections and image previews

The Haircuts tab now opens **My collections**. Create a named collection, open it and add several photos from the phone's picker at once. A collection can hold 20 pictures, up to 2 MB each. Collections and photos can be renamed or removed, and missing names are highlighted red after Submit. Existing individual pictures become separate one-photo collections during migration.

Tap any photo inside a collection to open the full image. The same viewer is used in optional booking/queue collection previews, public style details and the barber's reference panel. It fits the entire frame, has next/previous and close controls, supports native iOS pinch zoom and refreshes private signed URLs on opening/retry. Web supports Escape and left/right arrows; Android Back closes the viewer. Loading and failed-image states remain actionable. Fresh uploads skip the crop editor; pictures already cropped by the old uploader need the original image re-uploaded to recover the full frame.

Booking or joining remains possible without a collection. Choose a collection using its title/check control; tap its cover to preview every reference before selecting it. Empty collections cannot be selected. The server validates ownership and snapshots all selected photos with the visit in one transaction. The barber sees the collection name and all its pictures, even after the customer later renames or removes the collection. Changes in the library do not rewrite an earlier visit's reference.

Private Storage access is still scoped to the customer and authorized salon/chair. The Storage policies now recognize every snapshotted image, including the second and subsequent pictures. No public bucket, anonymous Auth account, price prompt or reset is introduced. Older single-photo clients remain compatible.

## Validation

Fresh PostgreSQL 17 CI passes all existing suites plus `supabase/tests/haircut_collections.sql`: own-only collection CRUD, idempotent creates/photo batches, whole-batch rollback, empty/foreign collection rejection before visit creation, queue/appointment snapshots, retention after library edits and access to secondary images only by authorized staff.

Local checks passed: 26 Customer + 31 Manager browser journeys, 22 Auth/session unit checks, both workspace lint/types and exports for iOS/Android/web in both apps. Browser tests cover two-photo uploads, full-frame rendering, expired URL retry, collection/photo CRUD, optional sharing, required-field errors, small/large viewports and the barber's full-screen viewer. Synthetic image fixtures make full-frame layout verifiable; browser APIs are mocked.

**Deployed on 31 October 2026 after explicit approval:** `20261031133407_haircut_collections.sql`. Local history matches the hosted migration and the public schema snapshot is regenerated. Hosted collection and single-photo compatibility suites passed with rollback. A real API test passed two-image upload/download, collection CRUD/retries, photo removal and cross-account/anonymous access denial. Both disposable accounts were globally signed out and deleted; their two uploaded files were removed.

Preservation checks matched the entire existing photo record before/after migration (excluding the new collection link). Its contents are unchanged, both existing accounts remain, and the photo belongs to a one-photo collection. The two pre-existing uploaded files remain. No reset was performed. Security advisors report no new schema/RLS findings; the existing [leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains disabled and was not changed by this feature.

[PR #15](https://github.com/nadhirhasan/BookMyTurn/pull/15) holds final CI and review status. User iPhone/Android acceptance remains pending.

Implementation references: [Expo 57 image selection](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [React Native 0.86 Modal](https://reactnative.dev/docs/0.86/modal), [ScrollView zoom](https://reactnative.dev/docs/0.86/scrollview#maximumzoomscale) and [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).
