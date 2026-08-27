/**
 * Post-build sanity check on the rendered page.
 *
 * A bad edit once left the whole story section in the document twice, and
 * nothing caught it: the browser rendered it, the build was clean, and the
 * screenshot harness scrolls by selector, which always resolves to the first
 * match. Duplicate ids are the cheap, general tell — so we look for them here,
 * along with the handful of things there should be exactly one of.
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('dist/index.html');
const html = fs.readFileSync(file, 'utf8');
const problems = [];

/* ---------- duplicate ids ---------- */
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const seen = new Map();
for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
for (const [id, n] of seen) {
  if (n > 1) problems.push(`id="${id}" appears ${n} times — ids must be unique`);
}

/* ---------- things there should be exactly one of ---------- */
const singletons = {
  '<main': 1,
  '<section class="story"': 1,
  '<section class="hero': 1,
  'class="story__intro': 1,
  'data-chapters': 1,
  'class="bar-note"': 1,
  'data-booking-form': 1,
  'data-map': 1,
  'data-events': 1,
  'data-hours': 1,
};
for (const [needle, want] of Object.entries(singletons)) {
  const n = html.split(needle).length - 1;
  if (n !== want) problems.push(`expected ${want} × \`${needle}\`, found ${n}`);
}

/* ---------- the story is four chapters, each with one mechanism ---------- */
// `data-chapter="` does not match `data-chapter-go="`, so this counts articles only
const chapters = html.split('data-chapter="').length - 1;
const marks = html.split('data-chapter-go="').length - 1;
if (marks !== 4) problems.push(`expected 4 chapter marks, found ${marks}`);
const mechs = html.split('data-mech="').length - 1;
if (chapters !== 4) problems.push(`expected 4 chapters, found ${chapters}`);
if (mechs !== 4) problems.push(`expected 4 mechanisms, found ${mechs}`);

/* ---------- every local image reference resolves ---------- */
const imgs = new Set([...html.matchAll(/\/images\/([a-z0-9-]+\.webp)/g)].map((m) => m[1]));
for (const name of imgs) {
  if (!fs.existsSync(path.resolve('dist/images', name))) problems.push(`missing image: ${name}`);
}

if (problems.length) {
  console.error('\nBuild check failed:');
  for (const p of problems) console.error('  ✗ ' + p);
  console.error('');
  process.exit(1);
}
console.log(`page check ok — ${seen.size} unique ids, ${chapters} chapters, ${imgs.size} images resolve`);
