// Run inside the official Figma Plugin API after discovery.
// Collection/token helpers are adapted from figma-generate-library's supplied scripts.
const createdNodeIds = [];
const importedVariables = {};
for (const [name, key] of Object.entries({
  background: 'a4865545b526a5b3399a512667f40c9efe0c2fc4',
  text: 'cf92d4e8c6a5a5ed82f024d47d11c21d5162ac3c',
  border: '395870afebb3397e858358930ffdd69a5ec0f73d',
  action: '69276caf7d902cb108d2f8f6463078190f11e0ac',
})) importedVariables[name] = await figma.variables.importVariableByKeyAsync(key);

async function createVariableCollection(name, modeNames) {
  const collection = figma.variables.createVariableCollection(name);
  const modeIds = {};
  collection.renameMode(collection.modes[0].modeId, modeNames[0]);
  modeIds[modeNames[0]] = collection.modes[0].modeId;
  return { collection, modeIds };
}
function hexColor(hex) {
  return { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 };
}
async function createSemanticTokens(collection, modeId, tokens) {
  const map = {};
  for (const token of tokens) {
    const v = figma.variables.createVariable(token.name, collection, token.type);
    v.setValueForMode(modeId, token.value);
    v.scopes = token.scopes;
    v.setVariableCodeSyntax('WEB', `var(--bmt-${token.name.replaceAll('/', '-')})`);
    v.setVariableCodeSyntax('ANDROID', `BookMyTurn.${token.name.replaceAll('/', '.')}`);
    v.setVariableCodeSyntax('iOS', `BookMyTurn.${token.name.replaceAll('/', '.')}`);
    map[token.name] = v.id;
  }
  return map;
}
if ((await figma.variables.getLocalVariableCollectionsAsync()).some(c => c.name === 'BMT / Foundations')) {
  throw new Error('Foundations already exist; use the ledger rather than creating duplicates.');
}
const { collection, modeIds } = await createVariableCollection('BMT / Foundations', ['Light']);
const primitives = [
  ['white', '#FFFFFF'], ['ink', '#242422'], ['muted', '#716F6B'],
  ['soft', '#F6F5F2'], ['line', '#E7E5E0'], ['canvas', '#EDECE8'],
];
const primitiveIds = await createSemanticTokens(collection, modeIds.Light, primitives.map(([name, value]) => ({ name: `primitive/${name}`, type: 'COLOR', value: hexColor(value), scopes: [] })));
const alias = id => ({ type: 'VARIABLE_ALIAS', id });
const tokens = [
  ['color/background', importedVariables.background.id, ['FRAME_FILL', 'SHAPE_FILL']],
  ['color/text', importedVariables.text.id, ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR']],
  ['color/action', importedVariables.action.id, ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']],
  ['color/muted', primitiveIds['primitive/muted'], ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR']],
  ['color/surface', primitiveIds['primitive/soft'], ['FRAME_FILL', 'SHAPE_FILL']],
  ['color/border', importedVariables.border.id, ['STROKE_COLOR']],
  ['color/divider', primitiveIds['primitive/line'], ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']],
  ['color/canvas', primitiveIds['primitive/canvas'], ['FRAME_FILL', 'SHAPE_FILL']],
  ['color/on-action', primitiveIds['primitive/white'], ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR']],
].map(([name, id, scopes]) => ({ name, type: 'COLOR', value: alias(id), scopes }));
for (const value of [4, 8, 12, 16, 20, 24, 32]) tokens.push({ name: `space/${value}`, type: 'FLOAT', value, scopes: ['GAP'] });
for (const value of [8, 12, 16, 24]) tokens.push({ name: `radius/${value}`, type: 'FLOAT', value, scopes: ['CORNER_RADIUS'] });
const variables = { ...primitiveIds, ...await createSemanticTokens(collection, modeIds.Light, tokens) };
await Promise.all(['Regular', 'Medium', 'SemiBold', 'Bold'].map(style => figma.loadFontAsync({ family: 'DM Sans', style })));
const styles = {};
for (const [name, size, line, weight] of [
  ['Display', 30, 36, 'Bold'], ['Title', 25, 32, 'Bold'],
  ['Section', 19, 26, 'Bold'], ['Body', 15, 23, 'Regular'],
  ['Label', 14, 20, 'SemiBold'], ['Caption', 12, 18, 'Regular'],
  ['Micro', 10, 14, 'Medium'], ['Metric', 36, 42, 'Bold'],
]) {
  const s = figma.createTextStyle();
  s.name = `BMT / ${name}`;
  s.fontName = { family: 'DM Sans', style: weight };
  s.fontSize = size;
  s.lineHeight = { unit: 'PIXELS', value: line };
  styles[name] = s.id;
}
const page = figma.currentPage;
page.name = '01 · Customer journey';
const componentsPage = figma.createPage();
componentsPage.name = '02 · Components';
createdNodeIds.push(componentsPage.id);
return { createdNodeIds, mutatedNodeIds: [page.id], collectionId: collection.id, modeId: modeIds.Light, variables, styles, pages: { journey: page.id, components: componentsPage.id }, importedButtonSetId: '2:314', counts: { variables: Object.keys(variables).length, textStyles: Object.keys(styles).length } };
