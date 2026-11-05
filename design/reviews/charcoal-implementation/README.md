# Implemented Charcoal & Champagne screens

5 November 2026. These screenshots come from the running Expo applications at
393 × 852 CSS pixels, with the bundled DM Sans fonts and isolated API fixtures.
They are application screens, not the earlier HTML prototype or Figma renders.
All names, totals, visit codes and photo collections here are test fixtures;
production screens display the signed-in account's Supabase records.

Customer: [Explore](customer-home.png), [salon](salon-details.png),
[calendar](calendar.png), [queue ticket](queue-ticket.png),
[collections](collections.png), [account](account.png).

Staff: [owner overview](manager-dashboard.png), [team](manager-team.png),
[invitation access](manager-invitation.png), [barber chair](barber-chair.png).

The implementation uses the approved palette, DM Sans hierarchy, photo gradients,
compact salon rows, circular barber/date selections, fixed booking actions and
ivory ticket. Extra real workflows remain reachable: multi-salon CRUD, map pins,
reports and expenses, code lookup, walk-ins, breaks, invitations and private photos.
Appointment requests retain a review step for references/contact details and sign-in.
No inactive prototype controls or sample business records are added to the app.

Native stacks slide between pages; queue entry and finish-service use native sheets.
The web app uses a short directional fade. OS reduced motion disables page movement
and photo/save-sheet animations. iOS/Android status bars, permission prompts,
keyboard and sheet rendering require device acceptance; web screenshots do not
verify those native surfaces. Native salon images use uploads; missing venue photos
remain explicit placeholders. Existing marketing photography is illustrative.

Source checks and test results: [implementation checklist](../../../docs/CHARCOAL_IMPLEMENTATION.md).
