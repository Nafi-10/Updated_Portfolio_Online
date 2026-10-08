import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const assetDirectory = path.join(root, 'assets/img/gallery');
const photos = JSON.parse(readFileSync(path.join(assetDirectory, 'manifest.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const cards = photos.map((photo, index) => {
  if (!existsSync(path.join(assetDirectory, photo.file))) throw new Error(`Missing gallery photo: ${photo.file}`);
  return `      <button type="button" class="photo-tile" data-position="${index + 1}" data-title="${escape(photo.title)}" data-category="${escape(photo.category)}" data-caption="${escape(photo.caption)}" aria-label="Open image: ${escape(photo.title)}">
        <img src="../assets/img/gallery/${escape(photo.file)}" alt="${escape(photo.alt)}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">
        <span class="photo-tile-caption"><span><span class="photo-topic">${escape(photo.category)}</span><span class="photo-title">${escape(photo.title)}</span></span><span class="photo-open" aria-hidden="true">+</span></span>
      </button>`;
}).join('\n');
const page = path.join(root, 'gallery/index.html');
const html = readFileSync(page, 'utf8');
writeFileSync(page, html.replace(/<!-- gallery:cards:start -->[\s\S]*?<!-- gallery:cards:end -->/, `<!-- gallery:cards:start -->\n${cards}\n      <!-- gallery:cards:end -->`));

// Keep the homepage preview in sync with the same real photo collection.
const featured = ['portrait-in-white.jpg', 'campus-days.jpg', 'project-in-action.jpg', 'on-the-bridge.jpg', 'golden-hour.jpg'];
const previewCards = featured.map((file, index) => {
  const photo = photos.find(item => item.file === file);
  if (!photo) throw new Error(`Missing featured photo: ${file}`);
  return `        <button class="gallery-card${index === 2 ? ' is-active' : ''}" type="button" data-offset="${index - 2}" data-caption="${escape(photo.caption)}" aria-label="${index === 2 ? 'Open' : 'Show'} image: ${escape(photo.title)}">
          <img src="assets/img/gallery/${escape(photo.file)}" alt="${escape(photo.alt)}" loading="lazy" decoding="async">
          <span class="gallery-card-shade"></span>
          <span class="gallery-card-copy"><span class="gallery-card-category">${escape(photo.category)}</span><span class="gallery-card-title">${escape(photo.title)}</span><span class="gallery-card-action">View image <span aria-hidden="true">↗</span></span></span>
        </button>`;
}).join('\n');
const homePath = path.join(root, 'index.html');
const home = readFileSync(homePath, 'utf8');
writeFileSync(homePath, home.replace(/(<div class="gallery-stage" id="gallery-stage">)[\s\S]*?(\n      <\/div>\n      <div class="gallery-controls">)/, `$1\n${previewCards}$2`));
console.log(`Gallery prepared with ${photos.length} images.`);
