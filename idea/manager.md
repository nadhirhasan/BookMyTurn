
---

# PROJECT: BOOKMYTURN — SALON MANAGER APP

## 1. YOUR ROLE AND OBJECTIVE

Act as a senior **mobile product designer, UI/UX specialist and full-stack developer**.

Your task is to inspect the existing project and build a polished, clickable **BookMyTurn Salon Manager mobile application prototype**, including separate experiences for:

1. Salon Owner
2. Individual Barbers
3. Optional Receptionist / Queue Coordinator

The ultimate goal is to create a **mobile application**, not a website.

The application should be designed primarily for mobile phones, with touch-friendly controls, simple navigation and workflows that can be used quickly while a salon is operating.

If the environment supports a browser-based preview, use it to make the app accessible for visual inspection and testing. The browser is only the **preview/testing environment**; the product itself should be treated as a mobile app.

Inspect the existing project before making changes.

**Implement the prototype directly. Do not merely provide code or instructions.**

Run the application and make it available through a browser preview if the environment supports one.

This is a demo, not a production system.

Do not build:

- Real authentication
- Real payments
- Real accounting integrations
- Real SMS integrations
- Production backend infrastructure

Use fictional demo data and local/browser state to demonstrate the intended workflows.

---

# 2. BRAND AND DESIGN

Product:

**BookMyTurn — Salon Manager**

Theme:

- Deep black/navy background
- Primary cyan `#14A3C7`
- White and light grey text
- Dark grey cards
- Cyan buttons, icons and active states

Do not introduce additional accent colours.

Design the app as:

- Modern
- Premium
- Minimal
- Mobile-first
- Touch-friendly
- Easy to operate
- Clear
- Fast to understand

Barbers often need to update the system while actively serving customers, so their interface must be particularly simple.

Avoid complicated forms and excessive navigation.

Use:

- Large touch targets
- Clear status indicators
- Simple cards
- Bottom navigation where appropriate
- Short labels
- Strong primary actions
- Minimal typing

Clearly label the application as a **Demo**.

---

# 3. DEMO LOCATION AND SALON

Location:

**Akurana, Sri Lanka**

Use:

**Royal Saloon**

as the primary demonstration salon.

The prototype may provide a salon selector for the other 12 approved demo salons if practical, but do not invent additional salon names.

Use fictional demo data for:

- Barbers
- Customers
- Prices
- Services
- Queues
- Appointments
- Sales
- Expenses
- Reviews
- Financial reports

Do not introduce other locations.

---

# 4. ROLE SELECTION

Create a demo role-selection screen when the app starts.

Show three options:

### Owner

**Enter as Owner**

### Barber

**Enter as Barber**

### Queue Coordinator

**Enter as Queue Coordinator**

Do not build real authentication.

The selected role should determine which screens and information the user can access.

---

# 5. APP NAVIGATION

Use role-specific mobile navigation.

### Owner

Primary navigation can include:

- Dashboard
- Queue
- Appointments
- Sales
- Reports
- More / Settings

### Barber

Primary navigation can include:

- My Queue
- Appointments
- Profile
- More

### Queue Coordinator

Primary navigation can include:

- Queue
- Check-In
- Appointments
- More

Keep navigation minimal.

Do not expose owner-only financial sections to barbers.

---

# 6. OWNER EXPERIENCE

The Owner can:

- View the entire salon
- View all barbers and queues
- Manage appointments
- Review sales and expenses
- View dashboard and reports
- Manage services and prices
- Manage barber accounts and permissions
- Review barber performance
- View customer ratings and reviews
- Edit salon information
- Edit opening hours
- Manage BookMyTurn commission records in the demo

The owner should have access to the complete salon overview.

---

# 7. BARBER EXPERIENCE

Every barber must have an individual demo account.

A barber can:

- View their own profile
- Edit their own bio
- Edit profile information
- Manage profile photo/avatar
- View their services
- View their price ranges
- View their queue
- View upcoming appointments
- Start their own services
- Finish their own services
- Record final prices
- Review customer hairstyle preferences
- Update availability
- Update breaks
- View their ratings
- View their reviews
- View their service performance

Barbers must **not automatically have access** to:

- Salon-wide profit
- Salon-wide expenses
- Owner-only reports
- Other barbers' private settings
- Permission management

The owner can grant additional permissions in the demo.

---

# 8. QUEUE COORDINATOR EXPERIENCE

The Queue Coordinator can:

- View all queues if authorised
- Check in arriving customers
- Add walk-in customers
- Find existing queue entries
- Update queue status where permitted
- Manage appointment arrivals
- Correct queue mistakes where permitted

They should not automatically have access to salon-wide financial information.

The interface should prioritise speed because this role may be handling customers continuously.

---

# 9. OWNER DASHBOARD

Create a visually clear mobile dashboard showing:

- Today's completed service revenue
- Today's completed services
- Customers currently waiting
- Customers currently in service
- Upcoming appointments
- Number of barbers available
- Recorded expenses
- Estimated profit for selected period
- BookMyTurn commission accrued and paid

Include simple charts or summaries for:

- Daily sales
- Weekly sales
- Monthly revenue
- Expenses
- Barber performance

Provide period selectors:

- Today
- This Week
- This Month
- Custom Demo Period

All figures must update when demo transactions are created.

Do not hardcode dashboard totals that contradict the underlying demo records.

Make it clear that profit is an **estimate based on recorded transactions**.

---

# 10. OPEN / CLOSE SALON

At the top of the Owner Dashboard show:

**OPEN**

or

**CLOSED**

Allow the owner or designated main barber to:

- Open Salon
- Close Salon

When the salon opens, update the shared demo salon state.

When the salon closes:

- Prevent new immediate-service queue entries
- Preserve existing queue records
- Preserve appointment records

Each barber can independently set:

- Available
- Busy
- On Break
- Off Duty

The owner must be able to see the current availability of all barbers.

---

# 11. BARBER PROFILE

Every barber has a separate profile.

Show:

- Profile photograph/avatar
- Full name
- Display name
- Short bio
- Years of experience
- Specialities
- Services offered
- Service price ranges
- Working hours
- Current availability
- Average rating
- Number of reviews
- Recent reviews

Allow the barber to edit:

- Bio
- Profile photo/avatar
- Specialities
- Experience information
- Public profile description

Changes should update the customer-facing **BookMyTurn Customer App** when both prototypes share demo state.

If the prototypes run independently, simulate this through consistent demo data.

Service prices and working hours should only be editable according to owner-defined permissions.

Barbers cannot edit historic sales or delete customer reviews.

---

# 12. LIVE QUEUE MANAGEMENT

This is a core feature of the app.

All barbers in the same salon must use one shared queue data source.

Each barber sees their own relevant queue.

The Owner and authorised Queue Coordinator can see all queues.

Queue statuses:

- Joined — Not Yet Arrived
- Arrived — Waiting
- In Service
- Completed
- Cancelled
- No-show

Only customers who are physically present should count toward the physical waiting count.

A customer joining from home must **not** increase the physical waiting count until they check in.

---

# 13. CHECK-IN CUSTOMER

When an online customer arrives:

1. Staff asks for the queue code.
2. Staff searches for or enters the code.
3. Existing queue entry is found.
4. Staff taps **Mark Arrived**.
5. Status changes to **Arrived — Waiting**.

Do not create a second queue entry.

Make this flow extremely fast.

---

# 14. ADD WALK-IN

Provide a large primary button:

**+ ADD WALK-IN**

Open a fast form:

- Customer name — optional
- Mobile number — optional
- Service — optional
- Preferred barber or Any Available Barber
- Optional note

Create one queue entry and display it immediately.

---

# 15. START SERVICE

When the customer sits in the chair, the barber taps:

**START SERVICE**

The app should:

- Change status from Arrived — Waiting to In Service
- Record start time
- Decrease waiting count by one
- Display the current customer prominently

The waiting count decreases **when service starts**, not when service finishes.

---

# 16. FINISH SERVICE

When the haircut is finished, the barber taps:

**FINISH SERVICE**

Show:

- Selected service
- Original estimated price range
- Agreed price before service
- Optional extra services
- Final amount charged
- Confirmation that customer agreed to final amount

The barber confirms the amount and taps:

**Complete Service**

The app then:

- Marks service Completed
- Records finish time
- Creates exactly one sales record
- Calculates applicable BookMyTurn commission
- Updates dashboard
- Makes customer eligible for review

Prevent duplicate sales if the barber double-clicks or reloads.

After completion, show:

- Start Next Customer
- Take a Break
- Return to Available

---

# 17. BARBER BREAKS

A barber can tap:

**Take a Break**

While on break:

- They should not receive new automatic assignments.
- Existing waiting customers remain in the shared queue.
- Owner or authorised coordinator can reassign customers where appropriate.

When returning:

**Available**

---

# 18. CUSTOMER ASSIGNMENT

Support:

1. Specific Barber
2. Any Available Barber

If a customer chooses a specific barber, preserve that preference unless the customer or authorised staff agrees to change it.

For **Any Available Barber**, select the barber expected to serve the customer earliest.

Consider:

- Current service
- Waiting customers
- Service duration
- Confirmed appointments
- Breaks
- Availability

Do **not** simply choose the barber with the shortest queue.

Show the assignment clearly in:

- Owner app
- Barber app
- Relevant queue views

---

# 19. CUSTOMER HAIRSTYLE REQUESTS

Customers can browse hairstyle photos through the separate **BookMyTurn Customer App** and submit their preferred styles.

In the Salon Manager App, create:

## CUSTOMER STYLE REQUESTS

For each request show:

- Customer queue code
- Selected hairstyle images
- Optional customer note
- Selected service
- Request status

Allow the barber to mark preferences:

**Viewed**

The hairstyle selection is a reference, not a fixed-price guarantee.

The barber and customer must agree on the final price before service begins.

---

# 20. FLEXIBLE SERVICE PRICING

Each salon can configure its own services and price ranges.

Example demo services:

- Haircut: Rs. 1,000–1,400
- Haircut + Beard: Rs. 1,400–1,800
- Beard Trim: Rs. 500–800
- Kids' Haircut: Rs. 700–1,000

These are fictional demo figures.

Allow the Owner to configure service prices and ranges.

Where permission is granted, barbers can suggest changes or select an agreed final amount.

If the final price exceeds the displayed range:

- Require a reason
- Require explicit customer agreement

Maintain separate fields for:

- Displayed price range
- Agreed price before service
- Final actual price charged

Never silently change historical prices.

---

# 21. APPOINTMENT MANAGEMENT

Appointments are completely separate from queue joining.

Customers submit appointment requests through the **BookMyTurn Customer App** for a future date/time.

The Salon Manager App should show a prominent:

**Pending Appointment Request**

banner or notification.

The Owner, assigned Barber or authorised appointment manager can:

- Accept Requested Time
- Suggest Another Time
- Decline

If an alternative time is suggested, the customer must accept it before the appointment becomes confirmed.

Before accepting, check for conflicting confirmed appointments.

Appointment statuses:

- Pending
- Alternative Time Suggested
- Confirmed
- Arrived
- Completed
- Cancelled
- No-show

A confirmed appointment must not automatically become an ordinary walk-in queue entry.

When an appointment customer arrives, staff checks in the existing appointment.

Simulate SMS and in-app notifications.

Do not build real SMS.

---

# 22. SALES RECORDS

Every completed service creates **exactly one sales record**.

Record:

- Sale reference
- Date/time
- Salon
- Barber
- Service
- Customer reference
- Walk-in / Queue / Appointment source
- Final amount
- Payment method if supplied
- Applicable BookMyTurn commission
- Sale status

Show daily and historical sales.

Provide filters for:

- Date
- Barber
- Service
- Customer source

Do not create revenue when:

- Customer joins a queue
- Customer requests an appointment

Revenue is recorded only when the service is completed and the final amount is confirmed.

Barbers cannot silently edit historic sales.

Corrections require an authorised action and should create a demo audit record.

---

# 23. BOOKMYTURN COMMISSION

Demonstrate the proposed commercial model.

Example:

- Original haircut price: Rs. 1,000
- Proposed customer price: Rs. 1,050
- Additional amount: Rs. 50
- Salon keeps: Rs. 20 additional
- BookMyTurn receives: Rs. 30

The additional charge must be transparent to the customer and agreed with the salon.

Show how a completed qualifying service is split according to the configured arrangement.

Do not apply commission to:

- Cancelled services
- No-shows
- Incomplete services
- Ordinary walk-ins unless explicitly included in the commercial agreement

Keep commission records separate from haircut revenue.

Prevent duplicate commission calculations.

Make commission rules configurable.

---

# 24. EXPENSE MANAGEMENT

Create an **Owner-only Expenses** screen.

Allow authorised users to record:

- Expense category
- Description
- Amount
- Date
- Payment status
- Payment method
- Optional notes

Categories:

- Rent
- Electricity
- Water
- Internet and telephone
- Wages
- Barber commissions
- Hair products and supplies
- Repairs and maintenance
- Transport
- Other

Support:

- Paid expenses
- Expected/unpaid expenses
- Recurring monthly expense reminders in the demo

Do not count an unpaid expected expense as already paid.

Keep capital equipment purchases separate from normal operating expenses.

---

# 25. FINANCIAL DASHBOARD

Only the Owner and explicitly authorised users can access salon-wide financial information.

Show:

- Total completed service revenue
- Total operating expenses
- Barber wages and commissions
- BookMyTurn commission
- Estimated profit
- Sales by barber
- Sales by day/week/month
- Walk-in vs queue vs appointment sales

Dashboard calculations must update whenever sales or expenses are added or edited.

Clearly state:

**“Estimated profit based on recorded demo transactions.”**

Do not claim that the figure is accurate if transactions or expenses are missing.

This is a simplified salon-management dashboard, not a double-entry accounting system.

---

# 26. BARBER PERFORMANCE

Create an Owner-only **Barber Performance** screen.

For each barber show:

- Completed services
- Revenue generated
- Average service duration
- Customer rating
- Review count
- Customer feedback
- Working availability

Provide date filters.

Barbers should only see their own detailed performance unless additional permissions are granted.

Use fictional but internally consistent data.

---

# 27. RATINGS AND REVIEWS

Customers can submit a review only after a completed service.

For each barber show:

- Average rating / 5
- Review count
- Recent reviews
- Review date
- Service reference

Barbers can read their reviews but cannot edit/delete them.

Owners can review reported/inappropriate content and flag it for moderation in the demo.

Do not allow reviews for:

- Queue entries that were never completed
- Pending appointments
- Cancelled services
- No-show appointments

A completed service creates review eligibility exactly once.

The customer's submitted rating should update the barber profile in the shared demo state.

---

# 28. SALON SETTINGS

Create an Owner-only settings screen.

Allow configuration of:

- Salon name
- Address within Akurana
- Opening hours
- Open/closed status
- Available services
- Price ranges
- Barber list
- Appointment rules
- Permissions
- BookMyTurn commission settings

Do not introduce other locations.

Do not create complicated configuration menus.

---

# 29. ROLE-BASED ACCESS AND AUDIT HISTORY

Use simulated role permissions.

Important actions should create an audit record containing:

- Who performed the action
- What changed
- Date/time

Examples:

- Customer checked in
- Barber assigned
- Service started
- Service completed
- Sale recorded
- Sale corrected
- Appointment accepted
- Price changed
- Expense added

A Barber account must not automatically have Owner privileges.

Deactivated demo accounts must not erase historical services or sales.

---

# 30. SHARED DATA WITH CUSTOMER APP

If the **BookMyTurn Customer App** and **BookMyTurn Salon Manager App** run in the same development environment, use a shared demo data module or another lightweight shared-state mechanism where practical.

Both apps should agree on:

- Salon information
- Barber profiles
- Services
- Prices
- Queue entries
- Check-in status
- Appointment requests
- Hairstyle preferences
- Completed services
- Sales
- Reviews

If the apps run separately, use consistent demo IDs and document the intended shared data structure.

Do not spend time building a production backend.

---

# 31. MOBILE APP UX REQUIREMENTS

The app must feel like a real mobile application.

Prioritise:

- Mobile screen dimensions
- Touch-friendly controls
- Bottom navigation
- Swipe-friendly cards where appropriate
- Large primary actions
- Simple status chips
- Minimal typing
- Clear confirmation states
- Quick workflows for barbers
- Responsive layouts for browser preview

The **Barber workflow should be the fastest and simplest part of the app**, because barbers will interact with it while actively serving customers.

---

# 32. TECHNICAL REQUIREMENTS

- Inspect the existing project first.
- Reuse the current framework and packages.
- Avoid unnecessary rewrites.
- Implement a working visual prototype.
- Treat the project as a mobile application.
- Use local/browser demo state.
- Make every primary action clickable and functional.
- Use responsive layouts.
- Keep the Barber workflow extremely simple.
- Prevent duplicate queue entries.
- Prevent duplicate completed services.
- Prevent duplicate sales.
- Prevent duplicate commissions.
- Prevent duplicate reviews.
- Ensure dashboard totals match underlying demo transactions.
- Use consistent IDs across salon, barber, queue, appointment, service, sale and review records.
- Fix errors that prevent the application from running.
- Do not stop after generating code.

---

# 33. EXCLUSIONS

Do not build:

- Real payment processing
- Real SMS integration
- Production authentication
- External accounting software
- Complex double-entry accounting
- Inventory management
- Additional locations
- Additional salon names
- Unnecessary features outside the described salon workflow

The separate **BookMyTurn Customer App** is outside this application's scope.

---

# 34. FINAL DEMONSTRATION

Make the **BookMyTurn Salon Manager App** accessible through a browser preview for testing.

Demonstrate the Owner workflow:

**Open Salon → View Dashboard → Monitor Queues → Check In Customer → Review Appointment Request → View Sales → Add Expense → Review Estimated Profit → View Barber Performance**

Demonstrate the Barber workflow:

**Open Barber Account → Edit Profile/Bio → Update Availability → View Queue → View Customer Hairstyle Request → Start Service → Confirm Final Price → Finish Service → Record Sale → View Rating and Reviews**

Demonstrate the customer feedback workflow:

**Complete Service → Customer Submits Rating and Review → Barber Profile Rating Updates → Owner Views Barber Performance**

The final product should feel like a **real, polished mobile salon-management application**, while remaining a lightweight and easy-to-demonstrate prototype.

**Implement it. Run it. Fix errors. Make the working prototype available for visual inspection.**

The ultimate product is the:

# **BOOKMYTURN SALON MANAGER APP**

for **Akurana, Sri Lanka**.
