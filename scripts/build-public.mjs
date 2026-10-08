import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './build-articles.mjs';
import './build-gallery.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'build');
mkdirSync(output, { recursive: true });
for (const entry of ['index.html', '_headers', 'css', 'js', 'assets', 'data', 'content', 'articles', 'gallery']) {
  cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
console.log('Public portfolio prepared in build/');
