// Shared Figma construction helpers. STATE and ICONS are injected by the runner.
const createdNodeIds = [];
const vars = {};
for (const [name, id] of Object.entries(STATE.variables)) vars[name] = await figma.variables.getVariableByIdAsync(id);
await Promise.all(['Regular', 'Medium', 'SemiBold', 'Bold'].map(style => figma.loadFontAsync({ family: 'DM Sans', style })));
const [buttonSet, searchSet] = await Promise.all([
  figma.importComponentSetByKeyAsync('cc8b558dc7d9684011b6b99ce8e6509399bc836b'),
  figma.importComponentSetByKeyAsync('715a105916909fcad1d649ed31db27dc26375edd'),
]);
const libraryButton = buttonSet.defaultVariant;
const librarySearch = searchSet.children.find(n => n.name === 'State=Default, Value Type=Placeholder');
createdNodeIds.push(buttonSet.id, searchSet.id);
for (const main of [libraryButton, librarySearch]) {
  const fonts = main.findAllWithCriteria({ types: ['TEXT'] }).flatMap(t => t.getStyledTextSegments(['fontName']).map(s => s.fontName));
  await Promise.all(fonts.map(font => figma.loadFontAsync(font)));
}
const record = node => { createdNodeIds.push(node.id); return node; };
function paint(key) {
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', vars[`color/${key}`]);
}
function fill(node, key) { node.fills = [paint(key)]; }
function border(node, key = 'divider') { node.strokes = [paint(key)]; node.strokeWeight = 1; }
function radius(node, value = 12) { node.cornerRadius = value; if (vars[`radius/${value}`]) node.setBoundVariable('cornerRadius', vars[`radius/${value}`]); }
function padding(node, value) {
  node.paddingLeft = node.paddingRight = node.paddingTop = node.paddingBottom = value;
  if (vars[`space/${value}`]) for (const p of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']) node.setBoundVariable(p, vars[`space/${value}`]);
}
function auto(parent, name, direction, width, height = null, gap = 12, pad = 0, background = null) {
  const n = record(figma.createAutoLayout(direction));
  n.name = name; n.resize(width, height || 1);
  n.primaryAxisSizingMode = direction === 'VERTICAL' && height === null ? 'AUTO' : 'FIXED';
  n.counterAxisSizingMode = direction === 'HORIZONTAL' && height === null ? 'AUTO' : 'FIXED'; n.itemSpacing = gap;
  if (vars[`space/${gap}`]) n.setBoundVariable('itemSpacing', vars[`space/${gap}`]);
  n.fills = []; if (background) fill(n, background); padding(n, pad);
  parent.appendChild(n); return n;
}
function txt(parent, copy, style = 'Body', width = 353, color = 'text', align = 'LEFT') {
  const n = record(figma.createText()); n.name = copy.slice(0, 65);
  n.fontName = { family: 'DM Sans', style: 'Regular' };
  n.characters = copy; n.textStyleId = STATE.styles[style];
  n.resize(width, 20); n.textAutoResize = 'HEIGHT'; n.textAlignHorizontal = align;
  n.fills = [paint(color)]; parent.appendChild(n); return n;
}
function icon(parent, name, size = 20, color = 'text') {
  if (!ICONS[name]) throw new Error(`Missing source SVG for ${name}`);
  const n = figma.createNodeFromSvg(ICONS[name].replaceAll('currentColor', '#242422'));
  // Imported SVG frames have a default solid fill in this runtime. Keep the
  // wrapper transparent; only recolour actual vector geometry.
  n.fills = [];
  for (const child of n.findAll(() => true)) {
    if ('strokes' in child && Array.isArray(child.strokes) && child.strokes.length) child.strokes = child.strokes.map(p => p.type === 'SOLID' ? paint(color) : p);
    if ('fills' in child && Array.isArray(child.fills) && child.fills.some(p => p.type === 'SOLID')) child.fills = child.fills.map(p => p.type === 'SOLID' ? paint(color) : p);
  }
  n.name = `Icon / ${name}`; n.resize(size, size); parent.appendChild(n);
  createdNodeIds.push(n.id, ...n.findAll(() => true).map(c => c.id)); return n;
}
function divider(parent, width = 353) {
  const n = record(figma.createRectangle()); n.name = 'Divider'; n.resize(width, 1); fill(n, 'divider'); parent.appendChild(n); return n;
}
function photo(parent, hash, width, height, name = 'Salon photo') {
  const n = record(figma.createRectangle()); n.name = name; n.resize(width, height);
  n.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: 'FILL' }]; radius(n, 12); parent.appendChild(n); return n;
}
function button(parent, label, secondary = false, width = 353) {
  const n = record(libraryButton.createInstance()); n.name = `Action / ${label}`;
  n.setProperties({ 'Label#2:0': label, 'Has Icon Start#4:128': false, 'Has Icon End#4:64': false });
  n.resize(width, 52); radius(n, 12); fill(n, secondary ? 'background' : 'action');
  n.strokes = secondary ? [paint('border')] : []; n.strokeWeight = 1;
  for (const t of n.findAllWithCriteria({ types: ['TEXT'] })) { t.textStyleId = STATE.styles.Label; t.fills = [paint(secondary ? 'text' : 'on-action')]; }
  parent.appendChild(n); return n;
}
function chip(parent, label, selected = false, width = 104) {
  const n = auto(parent, `Filter / ${label}`, 'HORIZONTAL', width, 40, 8, 8, selected ? 'action' : 'background');
  radius(n, 24); if (!selected) border(n);
  n.primaryAxisAlignItems = 'CENTER'; n.counterAxisAlignItems = 'CENTER';
  txt(n, label, 'Caption', width - 16, selected ? 'on-action' : 'text', 'CENTER'); return n;
}
function section(parent, title, action = null) {
  const n = auto(parent, `Section / ${title}`, 'HORIZONTAL', 353, null, 8);
  n.counterAxisAlignItems = 'CENTER';
  txt(n, title, 'Section', action ? 270 : 353);
  if (action) txt(n, action, 'Caption', 75, 'muted', 'RIGHT'); return n;
}
function detailRow(parent, label, value, width = 321) {
  const n = auto(parent, label, 'HORIZONTAL', width, null, 8);
  txt(n, label, 'Caption', Math.floor(width * .44), 'muted');
  txt(n, value, 'Label', Math.floor(width * .56) - 8, 'text', 'RIGHT'); return n;
}
function note(parent, copy, width = 353) {
  const n = auto(parent, 'Information', 'HORIZONTAL', width, null, 8, 12, 'surface');
  radius(n, 12); icon(n, 'circle-help', 16, 'muted'); txt(n, copy, 'Caption', width - 48, 'muted'); return n;
}
function component(parent, name, width, height = null, direction = 'VERTICAL', gap = 12, pad = 0, background = 'background') {
  const n = record(figma.createComponent()); n.name = name; n.resize(width, height || 1);
  n.layoutMode = direction;
  n.primaryAxisSizingMode = direction === 'VERTICAL' && height === null ? 'AUTO' : 'FIXED';
  n.counterAxisSizingMode = direction === 'HORIZONTAL' && height === null ? 'AUTO' : 'FIXED';
  n.itemSpacing = gap; padding(n, pad); fill(n, background); parent.appendChild(n); return n;
}
function textProperty(comp, node, label, value) {
  const key = comp.addComponentProperty(label, 'TEXT', value);
  node.componentPropertyReferences = { characters: key }; return key;
}
function instance(parent, id, name, properties = null) {
  const main = COMPONENTS[id]; if (!main) throw new Error(`Unknown component ${id}`);
  const n = record(main.createInstance()); n.name = name;
  if (properties) n.setProperties(properties); parent.appendChild(n); return n;
}
function statusBar(parent) {
  const n = auto(parent, 'iPhone safe area / Status', 'HORIZONTAL', 393, 52, 0, 0, 'background');
  n.paddingLeft = 28; n.paddingRight = 24; n.counterAxisAlignItems = 'CENTER'; n.primaryAxisAlignItems = 'SPACE_BETWEEN';
  txt(n, '9:41', 'Label', 70);
  const right = auto(n, 'Device indicators', 'HORIZONTAL', 65, null, 5); right.counterAxisAlignItems = 'CENTER';
  icon(right, 'signal', 17); icon(right, 'wifi', 17); icon(right, 'battery-full', 23); return n;
}
