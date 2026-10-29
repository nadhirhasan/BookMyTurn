import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('../assets/brand-mark.svg', import.meta.url), 'utf8');

for (const [name, width] of [['icon.png', 1024], ['favicon.png', 64]]) {
  const image = new Resvg(source, { fitTo: { mode: 'width', value: width } });
  writeFileSync(new URL(`../assets/${name}`, import.meta.url), image.render().asPng());
}

console.log('Generated app icon and favicon from assets/brand-mark.svg.');
