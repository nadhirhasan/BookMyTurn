const page = await figma.getNodeByIdAsync(STATE.pages.journey);
await figma.setCurrentPageAsync(page);
const COMPONENTS = {};
for (const [name, id] of Object.entries(STATE.components)) COMPONENTS[name] = await figma.getNodeByIdAsync(id);
const screens = {};
const links = [];
const tap = (node, target) => { links.push({ sourceId: node.id, target }); return node; };
function board(name, y, columns = 3) {
  const n = record(figma.createSection()); n.name = name; n.resizeWithoutConstraints(columns * 393 + (columns - 1) * 40 + 64, 960); n.x = 100; n.y = y;
  n.fills = [paint('canvas')]; page.appendChild(n); return n;
}
function phone(section, key, name, index, active = 0, actions = false) {
  const root = auto(section, name, 'VERTICAL', 393, 852, 0, 0, 'background'); root.x = 32 + index * 433; root.y = 68; root.clipsContent = true;
  statusBar(root);
  const header = auto(root, 'App header', 'HORIZONTAL', 393, 56, 8, 0, 'background');
  header.paddingLeft = header.paddingRight = 20; header.paddingTop = header.paddingBottom = 6; header.counterAxisAlignItems = 'CENTER';
  if (key === 'home') {
    icon(header, 'corner-up-right', 25); txt(header, 'BookMyTurn', 'Section', 208);
    const badge = auto(header, 'Demo label', 'HORIZONTAL', 44, 26, 0, 4, 'surface'); radius(badge, 8); badge.counterAxisAlignItems = 'CENTER'; txt(badge, 'DEMO', 'Micro', 36, 'muted', 'CENTER');
    const profile = auto(header, 'Account', 'HORIZONTAL', 44, 44, 0); profile.counterAxisAlignItems = 'CENTER'; profile.primaryAxisAlignItems = 'CENTER'; icon(profile, 'user-round', 22); tap(profile, 'signin');
  } else {
    const back = auto(header, 'Back', 'HORIZONTAL', 28, 44, 0); back.counterAxisAlignItems = 'CENTER'; icon(back, 'chevron-left', 22); tap(back, key === 'salon' ? 'salons' : 'home');
    txt(header, name.replace(/^\d+\s+/, '').split(' · ')[0], 'Section', 267);
    txt(header, 'DEMO', 'Micro', 42, 'muted', 'RIGHT');
  }
  const viewport = auto(root, 'Scrollable content', 'VERTICAL', 393, 1, 0);
  viewport.layoutSizingVertical = 'FILL'; viewport.clipsContent = true; viewport.overflowDirection = 'VERTICAL';
  const content = auto(viewport, 'Content', 'VERTICAL', 393, null, 16, 20, 'background'); content.paddingTop = 12; content.paddingBottom = 24;
  let footer;
  if (!actions) {
    const nav = instance(root, `nav${active}`, 'Bottom navigation');
    for (const child of nav.findAllWithCriteria({ types: ['FRAME'] })) {
      const index = ['Tab / Home', 'Tab / Salons', 'Tab / My Queue', 'Tab / My Appointments'].indexOf(child.name);
      if (index >= 0) tap(child, ['home', 'salons', 'remote', 'pending'][index]);
    }
  } else {
    footer = auto(root, 'Action area', 'VERTICAL', 393, null, 8, 20, 'background'); footer.paddingTop = 12; footer.paddingBottom = 24;
    footer.strokes = [paint('divider')]; footer.strokeTopWeight = 1; footer.strokeLeftWeight = footer.strokeRightWeight = footer.strokeBottomWeight = 0;
  }
  screens[key] = root.id; return { root, content, footer };
}
function search(parent, copy = 'Search salons or barbers') {
  const n = record(librarySearch.createInstance()); n.name = 'Search salons';
  n.setProperties({ 'Value#29:2': copy }); n.resize(353, 52); radius(n, 12); fill(n, 'surface'); n.strokes = [];
  for (const t of n.findAllWithCriteria({ types: ['TEXT'] })) { t.textStyleId = STATE.styles.Body; t.fills = [paint('muted')]; }
  parent.appendChild(n); tap(n, 'salons'); return n;
}
function field(parent, label, value) {
  return instance(parent, 'field', `Field / ${label}`, { [STATE.properties.field.label]: label, [STATE.properties.field.value]: value });
}
function time(parent, value, selected = false) {
  const n = instance(parent, 'time', `Time / ${value}`, { [STATE.properties.time.value]: value });
  if (selected) { fill(n, 'action'); for (const t of n.findAllWithCriteria({ types: ['TEXT'] })) t.fills = [paint('on-action')]; }
  return n;
}
function label(parent, value) {
  return instance(parent, 'status', `Status / ${value}`, { [STATE.properties.status.text]: value });
}
function salonCard(parent, compact = false, overrides = {}, imageHash = null) {
  const kind = compact ? 'salonCompare' : 'salonPhoto';
  const props = {}; for (const [key, value] of Object.entries(overrides)) props[STATE.properties[kind][key]] = value;
  const n = instance(parent, kind, 'Salon / ' + (overrides.name || 'Royal Saloon'), props);
  if (imageHash) { const image = n.findAllWithCriteria({ types: ['RECTANGLE'] }).find(c => c.fills.some(p => p.type === 'IMAGE')); if (image) image.fills = [{ type: 'IMAGE', imageHash, scaleMode: 'FILL' }]; }
  return tap(n, 'salon');
}
function barber(parent, name, summary, selected = false) {
  const n = instance(parent, 'barber', name, { [STATE.properties.barber.name]: name, [STATE.properties.barber.summary]: summary });
  if (selected) { border(n, 'action'); n.strokeWeight = 1.5; fill(n, 'surface'); }
  return n;
}
function summary(parent, caption = 'Haircut', date = null) {
  const n = auto(parent, 'Service summary', 'VERTICAL', 353, null, 12, 16, 'surface'); radius(n, 12);
  txt(n, 'Royal Saloon', 'Section', 321); detailRow(n, 'Service', caption);
  detailRow(n, 'Barber', 'Sameer · Demo'); detailRow(n, 'Estimated price', 'Rs. 1,200–1,400');
  if (date) detailRow(n, 'Requested time', date); return n;
}
function result(extra = {}) {
  return { createdNodeIds, screens, links, ...extra, screenBounds: Object.entries(screens).map(([key, id]) => ({ key, id, width: 393, height: 852 })) };
}
