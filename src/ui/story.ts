/**
 * The story scroll. As the reader moves through the four chapters, the
 * page's ground crossfades through each era's palette, a single light
 * source travels from the bakery oven to the gas lamp to the hearth to the
 * daylight over the river, and a brass thread fills down the margin.
 *
 * Everything here reads the spring-smoothed scroll position, so it lags
 * and settles like the rest of the page.
 */
import { reducedMotion } from '../motion/prefs';
import { onScroll, track, viewport } from '../motion/scroll';
import { Spring, presets, clamp01, lerp } from '../motion/spring';

/** [x, y, scale, opacity] of the light for each era, as viewport fractions. */
const LIGHT: [number, number, number, number][] = [
  [0.1, 0.95, 1.05, 0.85], // bakery — the oven, low and to the left
  [0.92, 0.06, 0.62, 0.55], // 1880s — a gas lamp, high right, small
  [0.14, 0.78, 0.95, 0.9], // restored — the hearth
  [0.5, -0.08, 1.55, 0.5], // today — daylight from above
];

export function initStory(): void {
  const story = document.getElementById('story');
  if (!story) return;

  const layers = [1, 2, 3]
    .map((i) => story.querySelector<HTMLElement>(`[data-era-layer="${i}"]`))
    .filter((el): el is HTMLElement => el !== null);
  const light = story.querySelector<HTMLElement>('[data-story-light]');
  const fill = story.querySelector<HTMLElement>('[data-thread-fill]');
  const chapters = Array.from(story.querySelectorAll<HTMLElement>('[data-chapter]'));
  const dots = Array.from(story.querySelectorAll<HTMLElement>('[data-thread-dot]'));
  if (chapters.length < 2) return;

  const storyT = track(story);
  const chapterT = chapters.map((c) => track(c));
  const last = chapterT.length - 1;

  const dotSprings = dots.map(
    (d) =>
      new Spring(0, presets.snappy, (v) => {
        d.style.transform = `scale(${(0.45 + 0.55 * v).toFixed(3)})`;
        d.style.opacity = (0.45 + 0.55 * clamp01(v)).toFixed(3);
      }),
  );
  const lit = dots.map(() => false);

  if (light && reducedMotion) light.style.display = 'none';

  onScroll((s) => {
    const vh = viewport.h;
    const vw = viewport.w;
    // Skip the work entirely when the story is far off-screen.
    if (storyT.top > s + vh * 2 || storyT.top + storyT.height < s - vh) return;

    // Where is the viewport's centre, expressed as a fractional chapter index?
    const c = s + vh * 0.5;
    let f = 0;
    const firstCentre = chapterT[0]!.top + chapterT[0]!.height / 2;
    const lastCentre = chapterT[last]!.top + chapterT[last]!.height / 2;
    if (c <= firstCentre) f = 0;
    else if (c >= lastCentre) f = last;
    else {
      for (let i = 0; i < last; i++) {
        const a = chapterT[i]!;
        const b = chapterT[i + 1]!;
        const ca = a.top + a.height / 2;
        const cb = b.top + b.height / 2;
        if (c >= ca && c < cb) {
          f = i + (c - ca) / Math.max(1, cb - ca);
          break;
        }
      }
    }

    // Era crossfade — steeper around the midpoint between chapters so each
    // chapter's text sits on a settled ground.
    layers.forEach((el, idx) => {
      const local = f - idx; // 0 at previous chapter centre, 1 at this one
      const o = clamp01((local - 0.5) * 2.4 + 0.5);
      el.style.opacity = o.toFixed(3);
    });

    // The travelling light.
    if (light && !reducedMotion) {
      const i0 = Math.min(last, Math.max(0, Math.floor(f)));
      const i1 = Math.min(last, i0 + 1);
      const t = f - i0;
      const A = LIGHT[i0] ?? LIGHT[0]!;
      const B = LIGHT[i1] ?? A;
      const x = lerp(A[0], B[0], t) * vw;
      const y = lerp(A[1], B[1], t) * vh;
      const sc = lerp(A[2], B[2], t);
      const op = lerp(A[3], B[3], t);
      light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
      light.style.opacity = op.toFixed(3);
    }

    // Thread fill — how far down the section the viewport centre has come.
    if (fill) {
      const p = clamp01((c - storyT.top) / Math.max(1, storyT.height));
      fill.style.transform = `scaleY(${p.toFixed(4)})`;
    }

    // Chapter dots light up as the thread reaches them.
    for (let i = 0; i < dots.length; i++) {
      const on = f >= i - 0.35;
      if (on !== lit[i]) {
        lit[i] = on;
        dotSprings[i]?.set(on ? 1 : 0);
      }
    }
  });
}
