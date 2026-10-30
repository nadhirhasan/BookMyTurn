# Customer workflow — database integration

Implemented on 30 October 2026 on `feat/customer-workflow`, stacked on the Expo
tunnel fix. User requested the whole customer pipeline together, replacing the
earlier one-feature-at-a-time implementation gates. PR review and physical-device
verification remain required. Manager onboarding and staff applications remain later work.

## What is in the database

The existing 13 approved salons now have 26 fictional barbers, 65 services, weekly
opening/staff hours and 23 illustrative hairstyle references. Prices are integer
LKR minor units. Ratings are calculated from submitted reviews; none are invented.
The application has no local salon array, fixed queue counts or fake visit times.

No customer, queue, appointment, service session, review or finance record is
seeded. Automated hosted tests created two explicitly approved disposable email
accounts and only their queue/booking fixtures, then signed out and deleted them.
Separate transactional SQL suites exercised completed services and finance
invariants, with every change rolled back. A follow-up query verified zero test
accounts, zero queues and zero appointments. Later user testing is never reset.

## Customer journeys

- Home / Salons: search names, compare waits and prices, filter open salons, sort.
- Salon Details: real physical waiting count, freshness, services, staff, hours,
  reviews and separate Join Queue / Request Appointment actions.
- Remote queue: email account -> optional service and specific/any barber -> join
  -> receipt -> check in at the salon -> My Queue. Remote joining alone does not
  increase physical waiting or establish physical order. Arrival sequence does.
- Appointment: service / barber -> month calendar -> time -> request -> My
  Appointments. Requests remain **pending salon confirmation**. Their capacity is
  held immediately, including overlapping durations, so another customer cannot
  reserve the same barber/time. Cancellation or decline releases the hold.
- Alternative appointment: salon suggests another time -> customer explicitly
  accepts -> confirmed. Notification records stay private to that customer.
- Hairstyles / Details: filter references, select up to eight, add a note, share
  against an active owned visit. Data persists in style_requests/items and is
  readable through the existing staff permission policies.
- Barber Profile: catalogue bio, services, status and actual submitted reviews.
- Review: only an owned completed service session is eligible, once per service.
  The public projection includes rating/body/salon/barber, not account details.

The database calculates physical FCFS estimates using service/barber durations,
hours/date exceptions, current service, breaks/unavailable blocks, reserved
appointments and barber preferences. Any Available Barber chooses the earliest
suitable capacity. An estimate is not a promise of a future empty salon.

## Physical QR journey — no app or Auth account

Put `https://<customer-web-host>/qr/royal-saloon` on the salon's QR. The route
opens the same light mobile web interface in a phone browser, with Join Queue
first. Tapping **Join Queue — I am at the salon** records one **arrived** customer.
Service, preferred barber, name and mobile are optional. There is no password,
email, OTP, anonymous Auth user or account creation in this path.

The browser keeps a random device receipt. Only a SHA-256 digest is stored in a
private table. This is how the browser can track/cancel its own entry without
exposing everyone's queue records. A receipt is sent in the API body, never in
the URL or logs. Repeat submissions on one device return its existing active
entry. Separate customers on separate phones create separate arrived entries.
Clearing browser data loses the receipt; the physical queue entry remains for
the salon to manage. QR presence is self-reported, not GPS verified.

If already signed in **in the client opening the QR**, the entry is immediately
associated with that customer and appears in My Queue. A visitor who signs in
after joining can explicitly link their device receipt to their account. A
browser cannot silently discover an unrelated app login. Universal/app links
and the public web hostname remain deployment tasks; they are not claimed here.
For now, Home's **Simulate QR Scan** exercises this route in Expo Go or the web.

Because the QR records physical waiting, a public scan marks arrival directly;
it does not offer the remote “joined, not arrived” state. A web QR cannot prove
someone's location, and arrival is explicitly confirmed by the visitor's button.

Verified example: three QR visitors, one available barber, default duration
45 minutes -> three physically waiting and 135 forecast minutes. Starting at
2:00 pm gives 4:15 pm, provided no break/appointment interrupts the work.

## Demo controls before the Manager app

For an account-owned demo visit, expand **Demo controls** to simulate the salon
accepting/declining/suggesting another appointment time, or completing a haircut.
These actions change database records; they are never silently auto-accepted.
The server requires ownership, a demo salon and a private simulation flag.
Unowned public QR visitors cannot use these account controls. Simulation records
an actual demo service and consistent price/sale data through existing guards.
It does not charge money or send messages. Turn simulation off per salon in
`bookmyturn_private.customer_demo_settings` when staff workflows replace it.

## Validation

- Lint and TypeScript passed; 22 unit checks passed.
- 20 isolated browser journeys passed, including complete queue -> styles ->
  completion -> review, calendar request/accept/cancel, slot conflict, layouts
  at 320/393/430/1440px, error/empty states and QR without any Auth API call.
- Real hosted email signup/login/session restoration and signed-token isolation
  passed with two disposable accounts. Concurrent real requests produced one
  winner and one conflict; another customer saw the time unavailable; cancelling
  released it. Physical check-in and style persistence passed.
- Existing full-schema SQL suite and new customer/QR suites passed on hosted
  Postgres, with rollback. QR tests prove no Auth accounts are created, receipt
  privacy, duplicate prevention, the 45-minute example and app-account linking.
- Supabase security advisor reports no findings after the final migrations.
- Web export and both native Hermes bundle exports passed. Final CI and user
  iPhone acceptance are recorded on the PR; bundles do not replace phone QA.

## Test on your iPhone

From the repository root, run `npm run start:tunnel` and open the terminal QR in
Expo Go. Use valid dummy email syntax such as `customer1@example.com` and a
password of at least eight characters. Verification is disabled server-side.

1. Create two accounts. Browse Royal Saloon and verify zero initial waiting.
2. Account A joins remotely: the physical count stays zero. Check in: it becomes
   one. Account B can see the count but cannot read A's private visit details.
3. Pick the same service/date/**specific barber** on two devices. Submit A's
   request. Refresh B's times: that barber's occupied time is disabled. Any Barber
   can still offer that time if another suitable barber has capacity.
4. Cancel A's appointment and refresh B: the time becomes available again.
5. Use demo acceptance or alternative suggestion, then completion and review.
6. Open Simulate QR Scan without signing in. Join and verify **Arrived — waiting**
   immediately. Reload to confirm device tracking; cancel your own entry.
7. For physical-browser QR testing across phones, deploy the exported web app to
   a public SPA host first. This PR does not publish a production web deployment.

After manual tests, cancel unwanted active visits through the app. Never delete
all queue/history records as a startup/reset behavior.
