// One-time import of the original portfolio's embedded JPEGs and public copy.
// Run before replacing index.html: node scripts/import-original.mjs
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = await readFile(path.join(root, 'index.html'), 'utf8');
const cards = source.split('<div class="card" data-category="').slice(1);
if (cards.length !== 12) throw new Error('Import requires the unchanged original index.html with 12 cards.');

const slugs = ['fuming-takes', 'behind-the-venue', 'row-for-hope-2026', 'row-for-hope-2025', 'training-room-fitness-retreat', 'shore-revival', 'finnegan-hauling-v2', 'finnegan-hauling-original', 'carton-cares-dog-sitting', 'the-k-league', 'id-hit-that', 'block-oclock'];
const categories = {
  'Podcast & Media': 'podcast-media',
  'Charity & Events': 'charity-events',
  'Business Branding': 'business-branding',
  'Passion Project': 'passion-project',
};

function capture(card, pattern) {
  const match = card.match(pattern);
  if (!match) throw new Error(`Missing original metadata: ${pattern}`);
  return match[1];
}

function jpegDimensions(bytes) {
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('Invalid JPEG header.');
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) throw new Error('Invalid JPEG marker.');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    const length = bytes.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  throw new Error('JPEG dimensions not found.');
}

const projects = [];
const originalAssets = [];
const images = [];
for (const [index, card] of cards.entries()) {
  const categoryLabel = capture(card, /^([^"]+)"/);
  const bytes = Buffer.from(capture(card, /src="data:image\/jpeg;base64,([^"]+)"/), 'base64');
  const slug = slugs[index];
  const src = `assets/projects/${slug}.jpg`;
  const toolsLabel = capture(card, /<span class="tools-tag">(.*?)<\/span>/);
  projects.push({
    slug,
    title: capture(card, /<div class="project-title">(.*?)<\/div>/),
    description: capture(card, /<p class="desc">(.*?)<\/p>/),
    category: { id: categories[categoryLabel], label: categoryLabel },
    tags: toolsLabel.split(' + '),
    toolsLabel,
    year: capture(card, /<span class="year">(.*?)<\/span>/),
    image: { src, ...jpegDimensions(bytes), alt: capture(card, /alt="([^"]*)"/) },
  });
  originalAssets.push({ slug, src, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  images.push({ src, bytes });
}

// Refuse to overwrite later content edits or an existing import.
for (const file of [...images.map(image => image.src), 'content/projects.json', 'content/original-assets.json']) {
  try {
    await access(path.join(root, file));
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  throw new Error(`Refusing to overwrite ${file}.`);
}

await mkdir(path.join(root, 'assets/projects'), { recursive: true });
await mkdir(path.join(root, 'content'), { recursive: true });
for (const image of images) await writeFile(path.join(root, image.src), image.bytes);
await writeFile(path.join(root, 'content/projects.json'), `${JSON.stringify(projects, null, 2)}\n`);
await writeFile(path.join(root, 'content/original-assets.json'), `${JSON.stringify(originalAssets, null, 2)}\n`);
console.log(`Imported ${projects.length} projects and ${originalAssets.reduce((sum, asset) => sum + asset.bytes, 0)} original image bytes.`);
