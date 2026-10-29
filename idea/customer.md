
---

# PROJECT: BOOKMYTURN — CUSTOMER DEMO APP (AKURANA ONLY)

## 1. YOUR ROLE AND OBJECTIVE

Act as a senior **mobile product designer, UI/UX specialist and full-stack developer**.

Your task is to inspect the existing project and redesign or implement the **BookMyTurn customer-facing mobile application** as a polished, responsive and clickable prototype.

The ultimate goal is to create a **mobile app**, not a website.

I want to be able to open and test the app, explore the customer journey and demonstrate the product to salon owners and developers.

If the development environment supports a browser-based preview, use it to make the app accessible for visual inspection and testing. The UI should still be designed and structured as a **mobile-first application experience**, not as a traditional website.

Do not just provide code or instructions. **Implement the app, run it and make it accessible through a live preview if the environment supports one.**

This is a visual and functional demo, not a production release.

Do not waste time building real authentication, payments, SMS integrations or a production backend.

Prioritise:

- Beautiful mobile UI
- Realistic interactions
- Complete customer journey
- Clear navigation
- Realistic demo data
- Smooth app-like experience

---

# 2. BRAND IDENTITY

Product name: **BookMyTurn**

Tagline:

**More Customers. Less Waiting. Easier Management.**

Customer-facing message:

**“Find your salon. Check the queue. Get your turn.”**

Brand colours:

- Background: deep black/navy
- Primary accent: cyan blue `#14A3C7`
- Text: white and light grey
- Cards: dark grey shades
- Borders, buttons, selected states and icons: cyan

Do not introduce gold, purple, green, orange, burgundy or other accent colours.

Design style:

- Premium
- Modern
- Minimal
- Mobile-first
- Clear visual hierarchy
- Rounded cards and buttons
- Attractive salon and hairstyle photography
- Simple icons
- Short text
- Smooth app navigation
- Comfortable touch targets
- Bottom navigation where appropriate

Use the BookMyTurn rounded-arrow logo mark if the existing project contains it.

Otherwise, create a simple placeholder mark based on a rounded arrow.

Do not invent a different brand identity.

---

# 3. LOCATION AND DEMO SALONS

The app serves **Akurana, Sri Lanka, only**.

Create exactly these 13 fictional demo salon listings:

1. Royal Saloon
2. MrG Akurana 6
3. MrG Akurana 7
4. MrG Akurana 8
5. Neel1
6. Neel2
7. Neel3
8. Saloon Chami
9. Mr Handsome
10. Saloon Kumar
11. Mr.perfect
12. Noire
13. Saloon Bhai

Use the names exactly as written.

Do not invent additional salon names or display Kandy or other locations as available service areas.

All salon details, prices, queues, barbers, ratings, reviews and waiting times are fictional demonstration data.

Clearly label the application as a **Demo**.

---

# 4. APP HOME SCREEN

Create a premium mobile app home screen with:

- BookMyTurn logo and name
- Demo indicator
- Location: **Akurana, Sri Lanka**

Headline:

**“Your haircut. Your barber. Your time.”**

Supporting text:

**“Discover salons in Akurana, check queues, explore hairstyles and get your turn without unnecessary waiting.”**

Search field:

**“Search salons or barbers…”**

Primary CTA:

**Find a Salon**

Show three short benefits:

- Check Live Queues
- Explore Hairstyles
- Compare Prices

Below, show selected salon cards and a section titled:

**“Find a Barber Near You”**

Use a clean mobile layout and avoid overcrowding the home screen.

---

# 5. APP NAVIGATION

Use app-style navigation.

Primary navigation:

- Home
- Salons
- My Queue
- My Appointments

Use a **bottom navigation bar** where appropriate.

Navigation must work correctly between screens.

The customer should always be able to return to the main app screens without relying on browser navigation.

---

# 6. SALON DISCOVERY SCREEN

Create a dedicated **Salons** screen displaying all 13 salons.

Show:

**“13 salons in Akurana”**

Allow customers to:

- Search by salon name
- Sort by shortest queue
- Sort by lowest starting price
- Sort by earliest estimated availability
- Sort alphabetically
- Filter open salons

All controls must work with the demo data.

Each salon card must show:

- Salon name
- Open/closed status
- Starting price
- Available barbers
- Number waiting
- Estimated wait
- Rating
- Review count
- View Salon button

Make the cards easy to compare without opening every salon.

---

# 7. SALON DETAILS SCREEN

When a customer opens a salon, show:

- Salon name
- Salon photos
- Opening hours
- Address placeholder within Akurana
- Current open/closed status
- Number of customers waiting
- Estimated waiting time
- Available barbers
- Services and prices
- Salon rating
- Customer reviews

Use a clear queue summary.

Important:

Queue figures represent **customers physically waiting**, not customers who have merely joined digitally from home.

Keep:

**Digital Queue Entries**

and

**Physically Arrived Customers**

as separate concepts.

Display:

- Fictional last-updated timestamp
- Demo-data indicator

If information is stale, show a warning instead of presenting it as definitely live.

---

# 8. PRIMARY CUSTOMER ACTIONS

On the salon screen, show two clear actions.

### Primary

**JOIN QUEUE**

This must be the first and most prominent action, especially when the customer reaches the salon through its QR code.

### Secondary

**REQUEST APPOINTMENT**

This is a separate feature for customers who want to request a future time.

Never use **“Booking”** as a generic label for both actions.

A queue entry is not an appointment.

An appointment request is not confirmed until the salon accepts it.

---

# 9. QR CODE CUSTOMER JOURNEY

Create a demo QR landing screen for:

**Royal Saloon**

In production, the salon QR code should open something such as:

`/salon/royal-saloon/join`

For this prototype, implement a direct route or a visible:

**Simulate QR Scan**

button that opens the same customer flow.

The screen should immediately show:

**ROYAL SALOON**

**“Join the queue in seconds.”**

Primary button:

**Join Queue**

Secondary actions:

- Explore Hairstyles
- View Barbers
- Request Appointment

Do not force customers to download the app or create an account.

The QR flow should feel like a natural in-app customer journey.

---

# 10. JOIN QUEUE WORKFLOW

When the customer clicks **Join Queue**:

## Step 1 — Select Barber

Options:

- Choose a specific barber
- Any Available Barber

If the customer chooses a specific barber, preserve that preference.

If the customer chooses **Any Available Barber**, recommend the suitable barber expected to serve them earliest.

Consider:

- Current service duration
- Waiting customers
- Barber availability
- Breaks
- Confirmed appointments
- Requested service duration

Do not simply select the barber with the fewest waiting customers.

---

## Step 2 — Optional Customer Details

Fields:

- Name — optional
- Mobile number — optional

---

## Step 3 — Confirm

Create one unique demo queue reference such as:

**BMT-482**

Show:

- Queue reference
- Selected salon
- Selected barber or Any Available Barber
- Service, if selected
- Estimated waiting time
- Status: **Joined — Not Yet Arrived**

For a remote customer, joining the digital queue must **not** automatically increase the physical waiting count.

Show:

**“I’ve Arrived — Check In”**

When clicked:

Change status to:

**Arrived — Waiting**

and increase the physical waiting count.

For customers scanning the QR code inside the salon, provide a simple confirmation that they are physically present.

For this prototype, allow the customer to simulate arrival without real GPS verification.

Prevent accidental duplicate queue entries.

If the customer already has an active queue entry for that salon, show the existing entry instead of creating another one.

Allow the customer to view their queue status through **My Queue**.

---

# 11. SERVICE SELECTION AND HAIRSTYLE GALLERY

Customers should be able to explore hairstyle images before or after joining the queue.

### Important workflow requirement

**Joining the queue must be the first action on the QR landing screen.**

Customers must not be forced to choose a hairstyle before joining.

After joining the queue, show:

**“While you wait, explore hairstyles and show your barber what you want.”**

Build an attractive hairstyle gallery.

Categories:

- Low Fade
- Mid Fade
- High Fade
- Skin Fade
- Taper Fade
- Classic Side Part
- Textured Crop
- Crew Cut
- Buzz Cut
- Pompadour
- Quiff
- Slick Back
- Curly Top
- Undercut
- Comb Over
- Fringe
- Mullet
- Afro Styles
- Kids’ Haircuts
- Beard Trim
- Full Beard
- Beard Fade
- Haircut + Beard

These are demo gallery categories and do not imply that every salon offers every style.

Allow customers to:

- Browse hairstyle photos
- Filter by category
- Tap a style to view it larger
- Select one or more reference styles
- Add an optional note
- Submit selected styles to the barber

After submission show:

**“Your hairstyle preferences have been shared with your barber.”**

The selected styles must be visible in the barber's demo workflow in the separate Salon Manager prototype.

Do not promise that every hairstyle has a fixed price.

---

# 12. SERVICES AND FLEXIBLE PRICE RANGES

Each salon should have its own service list and price ranges.

Example demo services:

- Haircut
- Haircut + Beard
- Beard Trim
- Kids’ Haircut
- Hair Styling

Display estimated price ranges such as:

**Rs. 1,200–1,400**

Prices and durations must vary by salon, service and, where appropriate, barber.

Explain:

**“Final price depends on the selected style and hair requirements. Your barber will confirm the price before starting.”**

The final amount is confirmed after the barber and customer discuss the requested service, but before the service begins.

Do not present estimated price ranges as guaranteed final prices.

---

# 13. REQUEST APPOINTMENT FLOW

This is completely separate from joining the queue.

The customer selects:

- Salon
- Service
- Preferred barber
- Preferred date
- Requested time or time options
- Optional name
- Optional mobile number

CTA:

**Request Appointment**

Create a demo appointment request with:

**Pending Salon Confirmation**

The request must **not** automatically become a confirmed appointment.

The Salon Manager prototype should be able to see this request.

The salon can:

- Accept requested time
- Suggest another time
- Decline request

If an alternative time is suggested, the customer must accept it before the appointment becomes confirmed.

Show the final status inside **My Appointments**.

Simulate notifications inside the prototype.

Do not build real SMS integration.

---

# 14. CUSTOMER PROFILE AND QUEUE HISTORY

Do not require account creation.

Use local browser/app state to demonstrate:

- Active queue entry
- Queue reference
- Check-in status
- Appointment requests
- Appointment confirmation
- Hairstyle preferences

### My Queue

Display:

- Current queue status
- Estimated wait
- Selected barber
- Queue reference
- Check-in action where appropriate
- Cancel queue entry, if permitted by demo rules

### My Appointments

Display:

- Pending requests
- Confirmed appointments
- Suggested alternative times
- Completed appointments
- Cancelled appointments

Clearly label all records as **Demo Data**.

---

# 15. RATINGS AND REVIEWS

Customers must be able to rate and review a barber after a completed haircut.

After a demo service is marked completed, show:

**“How was your experience with [Barber Name]?”**

Allow:

- 1–5 star rating
- Optional written review
- Submit Review

The review must be associated with the specific barber and salon.

After submission:

- Update displayed average rating
- Update review count
- Display review on barber profile
- Display recent review on salon screen where appropriate

Prevent repeated reviews for the same completed demo service.

Do not allow reviews for:

- Uncompleted queue entries
- Pending appointments
- Uncompleted appointments

In a real production system, review eligibility must be verified by the backend.

For this prototype, use local demo state.

Include realistic but clearly fictional existing reviews.

---

# 16. BARBER PROFILE SCREEN

Each barber profile should show:

- Profile photo/avatar
- Name
- Short bio
- Years of experience
- Hairstyles/services offered
- Price ranges
- Current availability
- Number waiting
- Estimated waiting time
- Average rating
- Number of reviews
- Recent customer reviews

Add a prominent:

**Choose Barber**

button.

The barber should be able to maintain their own bio and profile through the separate Salon Manager prototype.

The customer app only displays that profile information.

---

# 17. FINAL CONFIRMATION SCREENS

After joining the queue:

# “You’re in the queue!”

Show:

- Royal Saloon
- Barber name or Any Available Barber
- Queue reference
- Estimated wait
- Status:
  - Joined — Not Yet Arrived
  - Arrived — Waiting

After an appointment request:

# “Appointment request sent.”

Show:

**“Your appointment is not confirmed until the salon responds.”**

After a completed queue service or appointment, allow the customer to submit a review.

Provide:

**Back to Home**

button.

---

# 18. TECHNICAL REQUIREMENTS

- Inspect the existing project before modifying it.
- Reuse the existing framework and packages wherever practical.
- Do not unnecessarily rewrite working code.
- Build the experience as a **mobile application**.
- If the current project is web-based, use the existing framework to create a mobile-first app experience rather than rebuilding the entire stack unnecessarily.
- Use local demo data and browser/app state.
- Make navigation, search, sorting, selection, joining, check-in, appointment requests, hairstyle sharing and reviews clickable and functional.
- Make the UI responsive for mobile and desktop preview.
- Prioritise mobile dimensions and touch interactions.
- Do not build production authentication.
- Do not build payments.
- Do not build real SMS.
- Do not build a production backend.
- Structure demo data and components so a developer can later connect them to a shared backend.
- Use consistent salon, barber, queue and appointment IDs.
- Clearly separate digital queue entries from physically arrived customers.
- Do not generate duplicate queue entries.
- Do not generate duplicate reviews through repeated clicks.
- Fix errors that prevent the app from running.

---

# 19. APP ARCHITECTURE

Structure the customer app around these primary screens/flows:

**Home**

→ **Salons**

→ **Salon Details**

→ **Join Queue**

→ **Queue Confirmation**

→ **My Queue**

→ **Hairstyles**

→ **Hairstyle Details**

→ **Barber Profile**

→ **Request Appointment**

→ **My Appointments**

→ **Review**

The QR journey should provide a shortcut:

**QR Scan**

→ **Royal Saloon**

→ **Join Queue**

→ **Queue Confirmation**

---

# 20. EXCLUSIONS

Do not build:

- Owner dashboard
- Salon management interface
- Barber management dashboard
- Accounting reports
- Real payments
- Real SMS
- Production login/authentication
- Kandy or other locations
- Extra salon listings

The **Salon Manager** mentioned in the customer workflows is a separate future/prototype application and should not be implemented here.

---

# 21. FINAL DELIVERABLE

Implement and run the **BookMyTurn Customer App**.

Make the working app accessible for visual inspection and testing.

The ultimate goal is a **mobile customer application**, not a website.

Demonstrate this complete customer journey:

**Home → Browse Akurana Salons → Select Salon → Join Queue → Receive Queue Code → Check In → Explore Hairstyles → Submit Hairstyle Preferences → Service Completion → Rate and Review Barber**

Also demonstrate:

**Salon → Request Appointment → Pending Request → Salon Response → Confirmed Appointment**

Do not stop after writing code.

**Actually implement the app, run it, fix errors and provide the working preview.**

This is the **customer-facing mobile demo app for BOOKMYTURN**, serving **Akurana, Sri Lanka only**.

---

This version keeps your original requirements but makes the product direction much clearer: **BookMyTurn is an app first; the browser preview is only the development/demo mechanism.**