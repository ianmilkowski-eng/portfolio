import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = file => readFile(path.join(root, file), 'utf8');
const json = async file => JSON.parse(await read(file));
const walk = async dir => {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'dist') continue;
    const name = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await walk(name));
    else results.push(name);
  }
  return results;
};
const files = await walk('');
const pages = files.filter(file => file.endsWith('.html') && !file.startsWith('src/'));
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
let references = 0;
for (const file of pages) {
  const html = await read(file);
  const isPlayer = file.startsWith('assets/');
  assert(html.includes('lang="en"'), `${file}: document language missing`);
  assert(/<meta name="viewport"/.test(html), `${file}: viewport missing`);
  assert(/<title>[^<]+<\/title>/.test(html), `${file}: page title missing`);
  if (!isPlayer) {
    assert((html.match(/<h1[ >]/g) || []).length === 1, `${file}: expected one primary heading`);
    assert(html.includes('<main id="main">'), `${file}: main landmark missing`);
    assert(html.includes('rel="canonical"'), `${file}: canonical URL missing`);
    assert(!html.includes('data:image/jpeg;base64'), `${file}: image still embedded in document`);
  }
  const rendered = html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/g, '');
  const ids = [...rendered.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert(new Set(ids).size === ids.length, `${file}: duplicate IDs`);
  for (const tag of html.matchAll(/<img\b[^>]*>/g)) {
    assert(/\balt="/.test(tag[0]), `${file}: image lacks alternative text`);
    if (!tag[0].includes('data-viewer-image')) {
      assert(/\bwidth="\d+"/.test(tag[0]) && /\bheight="\d+"/.test(tag[0]), `${file}: image lacks reserved dimensions`);
    }
  }
  for (const match of html.matchAll(/\b(?:href|src|poster|data-image|data-original)="([^"]+)"/g)) {
    const ref = decode(match[1]);
    if (/^(?:https?:|mailto:|tel:|data:)/.test(ref)) continue;
    const url = new URL(ref, `https://example.invalid/${file}`);
    let target = decodeURIComponent(url.pathname).replace(/^\//, '');
    if (!target || target.endsWith('/')) target += 'index.html';
    assert(files.includes(target), `${file}: broken local reference ${ref}`);
    if (url.hash && files.includes(target) && target.endsWith('.html')) {
      const targetHtml = target === file ? html : await read(target);
      assert(targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file}: missing anchor ${ref}`);
    }
    references += 1;
  }
}

const projects = await json('content/projects.json');
const originals = await json('content/original-assets.json');
const cialo = await json('content/cialo-assets.json');
const retreat = await json('content/retreat-2027.json');
const milkplexity = await json('content/milkplexity-assets.json');
const netlifyAssets = await json('content/netlify-assets.json');
assert(projects.length >= 13, 'Expected all 13 Netlify projects');
assert(new Set(projects.map(p => p.slug)).size === projects.length, 'Duplicate project slugs');
assert(cialo.length === 11, 'Expected 11 unique Ciało still images');

// Verify imported artwork against the recorded hashes, never against a recompressed copy.
const originalRecords = Array.isArray(originals) ? originals : originals.assets;
for (const item of [...originalRecords, ...cialo, retreat, ...milkplexity, ...netlifyAssets]) {
  const src = item.src || item.path || item.image?.src;
  const bytes = await readFile(path.join(root, src));
  assert(createHash('sha256').update(bytes).digest('hex') === item.sha256, `${src}: original asset changed`);
  for (const variant of item.variants || []) {
    assert((await stat(path.join(root, variant.src))).size < bytes.length, `${variant.src}: display copy should be smaller than original`);
  }
}
for (const original of originalRecords) assert(projects.some(p => p.slug === original.slug), `Original project missing: ${original.slug}`);
const home = await read('index.html');
for (const p of projects) {
  assert(home.includes(`projects/${p.slug}/`), `Missing home link for ${p.title}`);

}
assert(home.includes('class="static"'), 'No-script home must use the static layout');
const featuredSlugs = ['training-room-fitness-retreat','cialo','milkplexity','row-for-hope-2026','american-250-team-challenge'];
const featured = [...home.matchAll(/data-featured-project="([^"]+)"/g)].map(m=>m[1]);
const flight = [...home.matchAll(/data-flight="([^"]+)"/g)].map(m=>m[1]);
const archived = [...home.matchAll(/data-archive-project="([^"]+)"/g)].map(m=>m[1]);
assert(JSON.stringify(featured) === JSON.stringify(featuredSlugs), 'Featured projects must appear once, in the curated order');
assert(JSON.stringify(flight) === JSON.stringify(featuredSlugs), 'Only the five featured covers should move');
assert(archived.length === 10 && new Set(archived).size === 10 && archived.every(slug=>!featured.includes(slug)), 'Archive must preserve ten other projects without repeating featured work');
assert(home.includes('<details class="archive-disclosure">'), 'Archive should begin collapsed');
assert(home.includes('id="contactName"') && home.includes('for="contactName"'), 'Contact form needs visible labels');
assert((home.match(/<details class="acc-item">/g)||[]).length === 10, 'Craft and FAQ disclosures missing');
assert(home.includes('Event Graphics') && home.includes('The last five percent is always by hand.'), 'Original personal writing missing');
assert((await read('projects/row-for-hope-2026/index.html')).includes('Event postponed to 2027'), 'Postponed event year missing');
const cialoPage = await read('projects/cialo/index.html');
for (const asset of cialo) assert(cialoPage.includes(asset.src), `Ciało image omitted: ${asset.slug}`);
const milkPage = await read('projects/milkplexity/index.html');
for (const asset of milkplexity) assert(milkPage.includes(asset.src), `Milkplexity image omitted: ${asset.slug}`);
assert(home.includes('projects/milkplexity/'), 'Milkplexity home link missing');
assert(home.includes('data-motion-toggle'), 'Decorative movement needs a pause control');
assert(!/<(?:video|audio)[^>]*\bautoplay/i.test(cialoPage), 'Motion must be user initiated');
assert(!/https?:\/\//.test(await read('assets/site.js')), 'Unexpected external dependency in site script');
assert(!/\b(?:eval|fetch)\(/.test(await read('assets/site.js')), 'Unexpected executable input or network call');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} HTML pages, ${references} local references, 13 Netlify projects, ${24 + milkplexity.length + netlifyAssets.length} unchanged source images, Ciało and Milkplexity coverage, and motion defaults.`);
}
