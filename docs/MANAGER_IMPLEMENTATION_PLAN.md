# Manager accounts, salons and teams

Requested 30 October 2026. One manager signs in once, owns multiple salons, and
creates multiple barber profiles within each salon. Existing salons, visits and
accounts must be preserved. This supersedes the one-salon/primary-barber setup.

- [x] Add protected manager profile, owned-salon list and create/edit commands.
  A salon can exist without a barber; each barber belongs to one salon and gets
  that salon's selected services and working hours. Retain legacy RPC compatibility.
- [x] Allow owners to operate any chair in their own salons; assigned employee
  access stays limited to their own chair. Test another manager and deactivation.
- [x] Build a welcoming account home with salon photo cards, clear empty states,
  add/edit salon forms, salon team overview and add/edit barber forms. Reuse the
  approved light/charcoal DM Sans design with generous spacing and large controls.
- [x] Upload salon covers, barber portraits and manager profile pictures. Public
  business photos and private manager-avatar storage have scoped write policies,
  image validation and 2 MB limits. Upload only on save; clean up failed saves.
- [x] Keep each salon's hours, services, queue and appointments separate. New
  salons start with no workload. Manager opens the chosen barber's existing
  operational screens; they can always return to salon management.
- [x] Validate multiple salons/barbers, persistence, customer discovery/slots,
  cross-account isolation, photo paths, responsive screens and old barber flows.
- [x] Run lint/types, browser/database suites and iOS/Android/web exports. Open a
  separate PR stacked on the barber feature; wait for CI and do not auto-merge.
- [ ] User iPhone/Android acceptance and PR review/merge.

Barbers are managed profiles; creating a profile does not create another Auth
account or send an invitation email. Existing separately assigned barber logins
continue to work. Staff login invitations, Owner accounting and coordinator
interfaces are separate features. Email verification remains disabled.

Implementation and hosted validation: [MANAGER_WORKFLOW.md](MANAGER_WORKFLOW.md).
Physical-device checks and PR acceptance remain pending; no prerequisite is merged.
