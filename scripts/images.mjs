/**
 * Image pipeline — builds responsive WebP variants in public/images from the
 * master photographs committed in assets/source. Run with `npm run images`.
 *
 * The photographs are the pub's own, taken from princeofwalesiffley.co.uk and
 * committed here (not hotlinked) so this concept site serves them from its own
 * origin. They are used to illustrate a speculative design proposal.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.resolve('assets/source');
const OUT = path.resolve('public/images');

/**
 * name → source file, target aspect (w/h; null keeps the source aspect), and
 * the widths to emit. `focusY` (0–1) picks where the crop sits vertically in
 * the source — 0.5 is centred; higher keeps more of the bottom.
 */
const IMAGES = {
  // The illuminated name board on Church Way — the closing band.
  frontage: { file: 'frontage.jpg', aspect: 20 / 9, widths: [640, 1069] },
  // The pub under the chestnut, opening the garden & walks section. Cropped
  // low so the frontage and the entrance carry it, not the sky.
  pub: { file: 'pub.jpg', aspect: 16 / 7, focusY: 0.66, widths: [640, 1200, 1800] },
  // Wadworth handpumps, beside the bar note on the menu card. 5:4 keeps all
  // four pump clips in frame.
  pumps: { file: 'pumps.jpg', aspect: 5 / 4, widths: [320, 640] },
  // Gravy over the beef, at the head of the Sunday roast menu.
  roast: { file: 'roast.jpg', aspect: 4 / 3, widths: [480, 800, 1200] },
  // The upstairs room, in private hire.
  room: { file: 'room.jpg', aspect: 4 / 5, widths: [480, 800, 1200] },
};

async function build() {
  await fs.mkdir(OUT, { recursive: true });
  for (const [name, spec] of Object.entries(IMAGES)) {
    const src = path.join(SRC, spec.file);
    const meta = await sharp(src).metadata();
    const srcW = meta.width ?? 0;
    const srcH = meta.height ?? 0;

    // With focusY, take the crop out of the source ourselves so we control
    // where it sits vertically; otherwise let sharp cover-crop from the centre.
    let extract;
    if (spec.focusY !== undefined && spec.aspect) {
      const cropH = Math.min(srcH, Math.round(srcW / spec.aspect));
      const top = Math.max(0, Math.min(srcH - cropH, Math.round(spec.focusY * srcH - cropH / 2)));
      extract = { left: 0, top, width: srcW, height: cropH };
    }

    for (const w of spec.widths) {
      const width = Math.min(w, srcW || w);
      const height = spec.aspect ? Math.round(width / spec.aspect) : undefined;
      const out = path.join(OUT, `${name}-${w}.webp`);
      let img = sharp(src);
      if (extract) img = img.extract(extract).resize({ width });
      else if (height) img = img.resize(width, height, { fit: 'cover', position: 'centre' });
      else img = img.resize({ width });
      await img.webp({ quality: 72, effort: 5 }).toFile(out);
      const { size } = await fs.stat(out);
      console.log(`${name}-${w}.webp  ${(size / 1024).toFixed(0)} KB`);
    }
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
