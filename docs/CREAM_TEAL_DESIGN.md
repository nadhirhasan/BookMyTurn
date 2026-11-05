# Cream & Teal — current app design

5 November 2026. The user supplied a cream and teal mobile reference and requested
that it replace the earlier dark direction. That image is the current visual
reference. The existing Customer, Manager and Barber apps implement it in
[PR #27](https://github.com/nadhirhasan/BookMyTurn/pull/27).

## Delivery checklist

- [x] Share warm cream surfaces, teal actions/headers, dark typography, beige accents, rounded controls and soft card shadows across both Expo workspaces.
- [x] Rebuild customer home/search and account entry around the teal branding; update calendar, review, queue, collection and staff screens.
- [x] Preserve two-column square salon photos in Customer and Manager, including at 320, 393 and 430 pixels.
- [x] Add smooth press/release feedback, tab fades, page transitions and reduced-motion support.
- [x] Show real initial loading, photo progress, busy submissions, refresh feedback and recoverable connection errors.
- [x] Verify complete browser suites, narrow screens, slow/error requests, native/web exports and actual application screenshots.
- [x] Publish the final changes and update PR #27's title and description.
- [ ] Phone acceptance: native transitions, sheets, keyboard, camera permission/QR detection, image uploads and Maps handoff.

## Design and workflow

The shared theme uses cream `#FCF6ED`, teal `#087F80`, dark text `#17201F`,
beige accents and bundled DM Sans. The home header, calendar-check brand mark,
wave treatment on account entry, pill buttons and restrained card shadows follow
the supplied reference. Both apps explicitly use the light appearance.

Customer Home keeps real salon search, open/no-queue filters, an active-visit
shortcut and square salon cards. The appointment screen has a compact salon
summary, barber selector, Monday-first calendar and database-backed time choices.
Selecting a date scrolls to the times; a fixed action preserves the selected date
and time. Review retains references/contact details and explicitly explains salon
confirmation. Submitted requests open My visits, and cancelled entries move to
Past visits with a confirmation notice.

Owners retain Overview, Team, Finance and Account, plus their multi-salon workspace.
Barbers retain My chair, Requests and Profile. Their operational controls and
financial restrictions remain intact. Empty workspaces no longer flash before
the first load finishes, and staff can retry refresh after access is revoked.

Common buttons animate over 120 ms on press and 180 ms on release. Tabs fade over
180 ms; native stack pages use 280 ms transitions and existing native sheets.
The web app uses a short glide. One shared OS preference disables motion when
Reduce Motion is enabled. Busy actions retain legible contrast, show a spinner,
announce their busy state and prevent repeat submissions.

The reference's healthcare names, categories, ratings and upfront prices are
examples, not production content. BookMyTurn continues to use live Supabase
records, optional private haircut collections, staff-led queue progression,
six-digit codes, salon confirmation of appointments and price entry only after
the haircut. No hosted migration, account reset or sample business data is added.

## Validation

- Both workspaces pass lint and TypeScript checks; all 24 customer unit tests pass.
- All 46 customer browser tests pass, including booking conflicts, cancellation,
  account-free QR, collections, slow/error/retry states, busy actions and motion preferences.
- All 85 staff browser tests pass, including CRUD, invitations, permissions,
  cross-app queue updates, completion pricing, reports, calendars and map pins.
- Both apps export successfully for iOS, Android and web using placeholder credentials.
- [Sixteen application screenshots](../design/reviews/cream-teal/README.md) use isolated
  fixtures at 393 × 852 CSS pixels. They are actual running app screens.

Browser checks and exports do not verify native hardware, keyboard or sheet behavior.
Physical iPhone/Android acceptance remains open above. The historical dark prototype
and screenshots remain in the repository for context and no longer define the app theme.
