/**
 * Image pipeline — pulls free Unsplash photos once, then writes responsive
 * WebP variants into public/images. Run with `npm run images`.
 *
 * Every photo here is licensed under the Unsplash License (free to use).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('public/images');
const CACHE = path.resolve('scripts/.cache');

/** name → { id, aspect (w/h) or null for source aspect, position for cover crops } */
const SOURCES = {
  hero: { id: '1514933651103-005eec06c04b', aspect: null, widths: [640, 1200, 1800] },
  bakery: { id: '1509440159596-0249088772ff', aspect: 4 / 5, position: 'centre' },
  victorian: { id: '1518176258769-f227c798150e', aspect: 4 / 5, position: 'attention' },
  restored: { id: '1544148103-0773bf10d330', aspect: 4 / 5, position: 'attention' },
  lock: { id: '1444492417251-9c84a5fa18e0', aspect: 4 / 5, position: 'centre' },
  seasonal: { id: '1432139555190-58524dae6a55', aspect: 4 / 3, position: 'attention' },
  roast: { id: '1574672280600-4accfa5b6f98', aspect: 4 / 3, position: 'attention' },
  ale: { id: '1535958636474-b021ee887b13', aspect: 1, position: 'attention' },
  garden: { id: '1585320806297-9794b3e4eeae', aspect: 4 / 5, position: 'centre' },
  meadow: { id: '1590586767908-20d6d1b6db58', aspect: null, widths: [640, 1200, 1800] },
  hire: { id: '1519225421980-715cb0215aed', aspect: 4 / 5, position: 'attention' },
  sharing: { id: '1466978913421-dad2ebd01d17', aspect: 1, position: 'centre' },
};

const DEFAULT_WIDTHS = [480, 800, 1200];

async function fetchSource(name, id) {
  await fs.mkdir(CACHE, { recursive: true });
  const file = path.join(CACHE, `${name}.jpg`);
  try {
    await fs.access(file);
    return file;
  } catch {
    /* not cached */
  }
  const url = `https://images.unsplash.com/photo-${id}?w=2200&q=85&fm=jpg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: ${res.status} for ${url}`);
  await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function build() {
  await fs.mkdir(OUT, { recursive: true });
  for (const [name, spec] of Object.entries(SOURCES)) {
    const src = await fetchSource(name, spec.id);
    const meta = await sharp(src).metadata();
    const widths = spec.widths ?? DEFAULT_WIDTHS;
    for (const w of widths) {
      const width = Math.min(w, meta.width ?? w);
      const height = spec.aspect ? Math.round(width / spec.aspect) : undefined;
      const out = path.join(OUT, `${name}-${w}.webp`);
      let img = sharp(src);
      img = height
        ? img.resize(width, height, { fit: 'cover', position: spec.position ?? 'centre' })
        : img.resize({ width });
      await img.webp({ quality: 70, effort: 5 }).toFile(out);
      const { size } = await fs.stat(out);
      console.log(`${name}-${w}.webp  ${(size / 1024).toFixed(0)} KB`);
    }
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
