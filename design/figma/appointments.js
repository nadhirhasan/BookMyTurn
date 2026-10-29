if (page.children.some(n => n.name === '03 / Plan a visit')) throw new Error('Appointments board already exists.');
const group = board('03 / Plan a visit', 2180, 4);
const request = phone(group, 'request', '07 Request Appointment', 0, 3, true);
txt(request.content, 'Choose a time\nthat works for you.', 'Title');
const service = auto(request.content, 'Selected appointment service', 'HORIZONTAL', 353, null, 12, 12, 'surface'); radius(service, 12);
photo(service, STATE.imageHashes.salon, 64, 70);
const sc = auto(service, 'Service details', 'VERTICAL', 253, null, 4); txt(sc, 'Royal Saloon', 'Label', 253); txt(sc, 'Haircut · Sameer · 30 min', 'Caption', 253, 'muted'); txt(sc, 'Rs. 1,200–1,400 estimated', 'Caption', 253, 'muted');
section(request.content, 'October 2026');
const dates = auto(request.content, 'Choose date', 'HORIZONTAL', 353, null, 8);
for (const [day, date, selected] of [['Thu', '29', false], ['Fri', '30', true], ['Sat', '31', false], ['Sun', '01', false], ['Mon', '02', false]]) {
  const d = auto(dates, `${day} ${date}`, 'VERTICAL', 64.2, 74, 4, 8, selected ? 'action' : 'background'); radius(d); if (!selected) border(d); d.counterAxisAlignItems = 'CENTER'; d.primaryAxisAlignItems = 'CENTER';
  txt(d, day, 'Caption', 48.2, selected ? 'on-action' : 'muted', 'CENTER'); txt(d, date, 'Section', 48.2, selected ? 'on-action' : 'text', 'CENTER');
}
txt(request.content, 'Friday, 30 October', 'Body');
section(request.content, 'Request a time');
txt(request.content, 'Times shown are estimated availability.', 'Caption', 353, 'muted');
for (const values of [['2:30 pm', '3:00 pm', '3:30 pm'], ['4:00 pm', '4:30 pm', '5:00 pm']]) {
  const row = auto(request.content, 'Time choices', 'HORIZONTAL', 353, null, 12);
  for (const value of values) time(row, value, value === '3:30 pm');
}
note(request.content, 'This sends a request to the salon. Your appointment is confirmed only when the required acceptance is complete.');
field(request.content, 'Name (optional)', 'Your name'); field(request.content, 'Mobile (optional)', '07X XXX XXXX');
tap(button(request.footer, 'Request Appointment'), 'pending');

const pending = phone(group, 'pending', '08 My Appointments · Pending', 1, 3);
label(pending.content, 'Pending salon confirmation');
txt(pending.content, 'Request sent.', 'Title');
txt(pending.content, 'The salon will review your preferred time. Your appointment is not confirmed yet.', 'Body', 353, 'muted');
summary(pending.content, 'Haircut · 30 min', 'Fri 30 Oct · 3:30 pm');
const steps = auto(pending.content, 'Request progress', 'VERTICAL', 353, null, 12, 16); border(steps); radius(steps);
txt(steps, '1  Request received', 'Label', 321); txt(steps, '2  Waiting for the salon’s response', 'Caption', 321, 'muted'); txt(steps, '3  Confirmation appears here', 'Caption', 321, 'muted');
note(pending.content, 'You can continue browsing. Any suggested time will need your acceptance.');
tap(button(pending.content, 'Preview salon’s response', true), 'alternative');
txt(pending.content, 'Prototype action · Simulated salon response', 'Micro', 353, 'muted', 'CENTER');
tap(button(pending.content, 'Browse Salons', true), 'salons');

const alternative = phone(group, 'alternative', '09 Suggested time', 2, 3);
label(alternative.content, 'Alternative time suggested');
txt(alternative.content, 'Would 4:00 pm\nwork for you?', 'Title');
txt(alternative.content, 'Royal Saloon suggested a different time for your haircut with Sameer.', 'Body', 353, 'muted');
const proposal = auto(alternative.content, 'Proposed appointment', 'VERTICAL', 353, null, 16, 20, 'surface'); radius(proposal, 16);
txt(proposal, 'Friday, 30 October', 'Section', 313); detailRow(proposal, 'You requested', '3:30 pm', 313); divider(proposal, 313); detailRow(proposal, 'Salon suggested', '4:00 pm', 313); detailRow(proposal, 'Duration', '30 minutes', 313);
txt(alternative.content, 'This time stays unconfirmed until you accept.', 'Body', 353, 'muted');
tap(button(alternative.content, 'Accept 4:00 pm'), 'confirmed');
tap(button(alternative.content, 'Choose another time', true), 'request');
txt(alternative.content, 'Decline suggestion', 'Caption', 353, 'muted', 'CENTER');

const confirmed = phone(group, 'confirmed', '10 My Appointments · Confirmed', 3, 3);
label(confirmed.content, 'Appointment confirmed');
txt(confirmed.content, 'See you Friday.', 'Title');
txt(confirmed.content, 'Your time with Sameer at Royal Saloon is confirmed.', 'Body', 353, 'muted');
const confirm = auto(confirmed.content, 'Confirmed appointment', 'VERTICAL', 353, null, 14, 20, 'surface'); radius(confirm, 16);
txt(confirm, '30', 'Metric', 313); txt(confirm, 'OCTOBER · FRIDAY', 'Caption', 313, 'muted'); txt(confirm, '4:00–4:30 pm', 'Title', 313); divider(confirm, 313);
detailRow(confirm, 'Salon', 'Royal Saloon', 313); detailRow(confirm, 'Barber', 'Sameer · Demo', 313); detailRow(confirm, 'Service', 'Haircut', 313); detailRow(confirm, 'Estimated price', 'Rs. 1,200–1,400', 313);
note(confirmed.content, 'Show this appointment when you arrive. Staff will check in the existing appointment; you won’t need to join a walk-in queue.');
tap(button(confirmed.content, 'Back to Home', true), 'home');
return result({ boardId: group.id });
