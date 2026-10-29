const page = await figma.getNodeByIdAsync(STATE.pages.components);
await figma.setCurrentPageAsync(page);
if (page.children.some(n => n.name === 'BMT / Bottom navigation')) throw new Error('Components already exist; resume using the ledger.');
const components = {};
const properties = {};
const COMPONENTS = {};
const navVariants = [];
for (let active = 0; active < 4; active++) {
  const n = component(page, `Active=${['Home', 'Salons', 'Queue', 'Appointments'][active]}`, 393, 84, 'VERTICAL', 0, 0);
  const row = auto(n, 'Destinations', 'HORIZONTAL', 393, 58, 0, 12);
  const names = ['Home', 'Salons', 'My Queue', 'My Appointments'];
  const icons = ['house', 'store', 'clock-3', 'calendar-days'];
  for (let j = 0; j < 4; j++) {
    const tab = auto(row, `Tab / ${names[j]}`, 'VERTICAL', 92.25, 46, 4);
    tab.counterAxisAlignItems = 'CENTER';
    icon(tab, icons[j], 22, active === j ? 'text' : 'muted');
    const label = txt(tab, names[j], 'Micro', 92.25, active === j ? 'text' : 'muted', 'CENTER');
    label.fontSize = 10.5;
    if (active === j) label.fontName = { family: 'DM Sans', style: 'Bold' };
  }
  const foot = auto(n, 'Home indicator safe area', 'HORIZONTAL', 393, 26, 0);
  foot.primaryAxisAlignItems = 'CENTER'; foot.counterAxisAlignItems = 'CENTER';
  const bar = record(figma.createRectangle()); bar.resize(134, 5); bar.cornerRadius = 3; fill(bar, 'text'); foot.appendChild(bar);
  n.strokes = [paint('divider')]; n.strokeTopWeight = 1; n.strokeBottomWeight = n.strokeLeftWeight = n.strokeRightWeight = 0;
  navVariants.push(n);
}
const navSet = record(figma.combineAsVariants(navVariants, page)); navSet.name = 'BMT / Bottom navigation'; navSet.x = 100; navSet.y = 100;
navVariants.forEach((n, i) => { n.x = 20; n.y = 20 + i * 108; components[`nav${i}`] = n.id; }); navSet.resize(433, 452);

const field = component(page, 'BMT / Input field', 353, null, 'VERTICAL', 8);
field.x = 600; field.y = 100;
const fieldLabel = txt(field, 'Email address', 'Label');
const control = auto(field, 'Control', 'HORIZONTAL', 353, 52, 8, 16, 'background'); radius(control); border(control, 'border'); control.counterAxisAlignItems = 'CENTER';
const fieldValue = txt(control, 'you@example.com', 'Body', 321, 'muted');
properties.field = { label: textProperty(field, fieldLabel, 'Label', 'Email address'), value: textProperty(field, fieldValue, 'Value', 'you@example.com') };
components.field = field.id;

const large = component(page, 'BMT / Salon card / Photo', 353, null, 'VERTICAL', 0);
large.x = 600; large.y = 300; radius(large, 16); border(large); large.clipsContent = true;
photo(large, STATE.imageHashes.salon, 353, 142);
const info = auto(large, 'Salon information', 'VERTICAL', 353, null, 10, 16);
const title = auto(info, 'Identity and rating', 'HORIZONTAL', 321, null, 8); title.counterAxisAlignItems = 'CENTER';
const name = txt(title, 'Royal Saloon', 'Section', 245); icon(title, 'star', 14); const rating = txt(title, '4.8', 'Caption', 34);
const meta = txt(info, 'Akurana · Haircut from Rs. 1,200', 'Caption', 321, 'muted');
const row = auto(info, 'Waiting and availability', 'HORIZONTAL', 321, null, 8); icon(row, 'clock-3', 17);
const wait = txt(row, '0–5 min estimated wait', 'Label', 255);
const count = txt(info, 'No one physically waiting · 1 barber available', 'Caption', 321, 'muted');
divider(info, 321);
const next = auto(info, 'Next estimated service', 'HORIZONTAL', 321, null, 8);
txt(next, 'Earliest service', 'Caption', 180, 'muted'); const time = txt(next, 'Now', 'Label', 133, 'text', 'RIGHT');
properties.salonPhoto = { name: textProperty(large, name, 'Salon', 'Royal Saloon'), rating: textProperty(large, rating, 'Rating', '4.8'), meta: textProperty(large, meta, 'Details', 'Akurana · Haircut from Rs. 1,200'), wait: textProperty(large, wait, 'Wait', '0–5 min estimated wait'), count: textProperty(large, count, 'Queue', 'No one physically waiting · 1 barber available'), time: textProperty(large, time, 'Next', 'Now') };
components.salonPhoto = large.id;

const compact = component(page, 'BMT / Salon card / Compare', 353, null, 'HORIZONTAL', 12, 0);
compact.x = 1000; compact.y = 100;
photo(compact, STATE.imageHashes.royal, 94, 110);
const cp = auto(compact, 'Compare information', 'VERTICAL', 247, null, 5);
const cn = txt(cp, 'MrG Akurana 6', 'Label', 247);
const cm = txt(cp, '4.7 (86) · From Rs. 1,100', 'Caption', 247, 'muted');
const cw = txt(cp, '20–30 min estimated wait', 'Label', 247);
const cq = txt(cp, '2 waiting · 2 barbers', 'Caption', 247, 'muted');
const ct = txt(cp, 'Earliest service 2:25 pm', 'Caption', 247, 'muted');
properties.salonCompare = { name: textProperty(compact, cn, 'Salon', 'MrG Akurana 6'), meta: textProperty(compact, cm, 'Details', '4.7 (86) · From Rs. 1,100'), wait: textProperty(compact, cw, 'Wait', '20–30 min estimated wait'), count: textProperty(compact, cq, 'Queue', '2 waiting · 2 barbers'), time: textProperty(compact, ct, 'Next', 'Earliest service 2:25 pm') };
components.salonCompare = compact.id;

const choice = component(page, 'BMT / Barber option', 353, null, 'HORIZONTAL', 12, 16);
choice.x = 1000; choice.y = 310; radius(choice); border(choice, 'border');
const avatar = auto(choice, 'Barber avatar', 'HORIZONTAL', 44, 44, 0, 0, 'surface'); radius(avatar, 24); avatar.primaryAxisAlignItems = 'CENTER'; avatar.counterAxisAlignItems = 'CENTER'; icon(avatar, 'user-round', 22);
const cc = auto(choice, 'Barber information', 'VERTICAL', 237, null, 4);
const bn = txt(cc, 'Any Available Barber', 'Label', 237); const bs = txt(cc, 'Earliest estimated service · 0–5 min', 'Caption', 237, 'muted');
properties.barber = { name: textProperty(choice, bn, 'Name', 'Any Available Barber'), summary: textProperty(choice, bs, 'Summary', 'Earliest estimated service · 0–5 min') };
components.barber = choice.id;

const status = component(page, 'BMT / Status label', 210, 32, 'HORIZONTAL', 8, 8, 'surface');
status.x = 1000; status.y = 500; radius(status, 8); status.counterAxisAlignItems = 'CENTER';
icon(status, 'clock-3', 15); const label = txt(status, 'Pending salon confirmation', 'Caption', 168);
properties.status = { text: textProperty(status, label, 'Status', 'Pending salon confirmation') }; components.status = status.id;

const gap = component(page, 'BMT / Time option', 109.6, 48, 'HORIZONTAL', 0, 8, 'background');
gap.x = 1000; gap.y = 600; radius(gap); border(gap, 'border'); gap.primaryAxisAlignItems = 'CENTER'; gap.counterAxisAlignItems = 'CENTER';
const gl = txt(gap, '3:30 pm', 'Label', 93.6, 'text', 'CENTER'); properties.time = { value: textProperty(gap, gl, 'Time', '3:30 pm') }; components.time = gap.id;

return { createdNodeIds, components, properties, navigationSetId: navSet.id, componentCount: Object.keys(components).length, photoLayers: ['4:2', '4:3', '4:4'], bounds: [large, compact, field, choice].map(n => ({id:n.id,name:n.name,width:n.width,height:n.height})) };
