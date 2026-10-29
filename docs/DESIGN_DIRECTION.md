# Customer design brief — Figma first

Status: the first three editable Figma screens are composed and visually reviewed.
The full customer journey and clickable prototype are incomplete; user design
verification is pending. See [the review summary](../design/README.md).

Figma: [BookMyTurn — Customer Experience](https://www.figma.com/design/wugLxCXK2CM44607SvxZwF?node-id=9-140).
Connection and OAuth are verified. Further Figma tool calls are blocked by the
Starter-plan MCP allowance; no more canvas writes were attempted after the limit.

The user has replaced the earlier dark/navy/cyan theme instructions with a light,
real-app-inspired direction. Those historical colour requirements no longer apply.

The initial coded shell did not meet the user's visual expectations. Stop further
screen implementation until the customer design is built and reviewed in Figma.
Retain useful engineering setup, but do not use the rejected UI as a reference.

## Customer task

"Where can I get a haircut with less waiting, when should I go, and can I request
a future time instead?"

Make that task visible immediately. The app opens into useful discovery; optional
authentication does not block browsing or the QR queue shortcut.

## Real-app references inspected

Official sources, reviewed 29 October 2026:

- [Fresha customer app](https://www.fresha.com/en-GB/download-app) and
  [iPhone screenshots](https://apps.apple.com/us/app/fresha-for-customers/id1297230801):
  discovery begins with search/location; venue imagery is paired with short,
  scannable ratings and practical business information.
- [Booksy customer app](https://biz.booksy.com/features/customer-app) and
  [iPhone screenshots](https://apps.apple.com/us/app/booksy-for-customers/id723961236):
  dark discovery with search, category navigation and photo-led venue cards;
  booking references separate staff/date selection and a concise service summary.
- [Treatwell official Play Store screenshots](https://play.google.com/store/apps/details?id=com.wahanda.marketplace):
  prominent search, familiar category controls and venue photography paired with
  name, area and rating. These are store marketing screenshots containing app UI,
  not a hands-on test of the installed applications.

Apply information hierarchy and interaction patterns, not competitors' branding,
copy, layouts pixel-for-pixel or proprietary images. Competitors' instant-booking
behavior does not replace BookMyTurn's salon-confirmed appointment requests.

## Visual direction

- Use white/off-white backgrounds, charcoal text and pale neutral surfaces,
  following the practical light-interface references from Fresha and Treatwell.
- No dark/navy surfaces or blue/cyan theme. Primary actions use charcoal with
  white text; selected controls use neutral contrast. Let salon photography add
  natural colour instead of decorative accent panels.
- Use a compact location/header, prominent search and intent controls, and salon
  information early in the screen. Avoid a large promotional hero above the task.
- Give salon photos and barber portraits a functional place in the design.
  Any assets used in the final app need a suitable licence and source record.
- Use consistent, readable typography: initial Figma targets are 28/22 for screen
  headings, 17/15 for key content and 13 for supporting text. Avoid tiny key labels.
- Use an 8-point spacing rhythm with 4-point adjustments; consistent 12–16-point
  card corners and at least 44-point touch targets. Validate against actual text.
- Use standard bottom navigation, back affordances, selection controls and sheets.
  Avoid decorative widgets, unnecessary gradients and repeated slogan cards.

These are starting constraints for the Figma work, not an already-verified final
design system. Test density and contrast in actual frame exports before approval.

## First Figma review: screens and states

Design at an iPhone reference size (393 × 852 logical points), retaining Android
safe-area/back behavior and smaller-screen adaptation in the implementation plan.

1. **Home / discovery:** Akurana location, search, Go now / Plan a visit intent,
   practical filters, and salon comparison. Show fictional data with a Demo label.
2. **Salon results:** compare physical queue, estimated wait, earliest estimated
   service, price range, open status, available barbers and rating. Preserve the
   specified four-tab navigation. Use only approved salon names.
3. **Salon detail / availability:** photography and identity, current queue and
   freshness, service/barber context and estimated visit windows. Join Queue is
   primary; Request Appointment remains a separate action.
4. **Join Queue sheet:** specific/any barber, optional service/contact details,
   clear confirmation. No mandatory hairstyle, account or download step.
5. **My Queue — remote:** queue reference, Joined — Not Yet Arrived, estimated wait
   and prominent check-in. Explain physical queue position without overloading UI.
6. **My Queue — arrived:** Arrived — Waiting and updated status; distinct from
   remote registration. Include the next useful action and hairstyle entry point.
7. **Request Appointment:** service/barber context, date and time choices, clear
   requested-time summary and Request Appointment action.
8. **My Appointments:** pending request, suggested alternative and confirmed
   variants. Customer acceptance is necessary for a proposed alternative time.
9. **Optional account entry:** sign-in and sign-up with an equally clear guest
   route, keyboard-aware layout, validation and email-confirmation states.

The first review may use multiple frames per state. Link the primary journey into
a clickable prototype. Build a small reusable component set for headers, inputs,
salon cards, availability controls, status labels, buttons, navigation and sheets.

## Availability and status semantics

- "No one waiting" refers to the physical waiting queue, not barber availability.
- A barber may be busy even when the queue is empty. Show the estimated service
  time next to the count instead of promising immediate service.
- Future visit windows are estimates based on schedule/work, not fabricated
  historical quiet-time statistics. Avoid an unsupported popular-times chart.
- An estimated open window is not a confirmed appointment or guaranteed no-wait
  visit. A future request stays pending until the required acceptance.
- Stale or unavailable data must have a visible state, not a false live indicator.
- Colour is not the only signal: use concise status text and appropriate icons.
- Use fictional prices/ratings and the approved salons, especially Royal Saloon,
  in review screens. Do not present competitor information as Akurana listings.

## Figma review gate

- [x] Editable Figma file exists and its URL is recorded here.
- [x] Typography, colour, spacing and reusable components are defined consistently.
- [x] Discovery and salon availability show useful information before marketing copy.
- [x] The composed discovery screens contain real stock photos, not blank placeholders.
- [x] The three composed screens were inspected in an exported render; the icon
  wrapper defect was fixed and the corrected composition was reviewed.
- [ ] Core navigation and the go-now / request-a-time journeys are clickable.
- [ ] Queue, arrival, estimated availability and appointment confirmation are clear.
- [ ] Small-screen/text-size behavior is specified for React Native adaptation.
- [ ] User verifies the direction before UI development resumes.

After approval, translate the Figma components and layout into React Native,
compare running screens with the approved frames, and continue the existing
milestones one PR and validation gate at a time. Do not build later backend
features simply because their states appear in the design prototype.
