/**
 * The story scroll. Four chapters; as the reader moves through them the
 * page's ground crossfades through each era, a single light source travels
 * from the oven to the gas lamp to the hearth to daylight, a gold thread
 * fills down the margin — and each chapter's mechanism runs on a spring
 * that follows the reader's progress.
 */
import { reducedMotion } from '../motion/prefs';
import { onScroll, progress, track, viewport } from '../motion/scroll';
import { Spring, presets, clamp01, lerp } from '../motion/spring';
import { mechanisms } from './mech';

/** [x, y, scale, opacity] of the light for each era, as viewport fractions. */
const LIGHT: [number, number, number, number][] = [
  [0.1, 0.95, 1.05, 0.85], // the oven, low left
  [0.92, 0.06, 0.62, 0.55], // the gas lamp, high right
  [0.14, 0.78, 0.95, 0.9], // the hearth
  [0.5, -0.08, 1.55, 0.5], // daylight
];

function mountMechanisms(story: HTMLElement): void {
  story.querySelectorAll<HTMLElement>('[data-mech]').forEach((host) => {
    const mech = mechanisms[host.dataset.mech ?? ''];
    const chapter = host.closest<HTMLElement>('[data-chapter]');
    if (!mech || !chapter) return;
    host.innerHTML = mech.svg;
    const svg = host.querySelector('svg');
    if (!svg) return;
    const update = mech.mount(svg, chapter);

    if (reducedMotion) {
      update(1);
      return;
    }
    // A heavy-ish follower: the mechanism lags the scroll and settles.
    const m = new Spring(0, { stiffness: 60, damping: 16, mass: 1.2, restDelta: 0.001, restSpeed: 0.001 }, update);
    update(0);
    progress(chapter, (p) => {
      const target = clamp01((p - 0.22) / 0.3);
      if (Math.abs(target - m.target) > 0.0005) m.set(target);
    });
  });
}

export function initStory(): void {
  const story = document.getElementById('story');
  if (!story) return;

  mountMechanisms(story);

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
        d.style.transform = `scale(${(0.5 + 0.5 * v).toFixed(3)})`;
        d.style.opacity = (0.45 + 0.55 * clamp01(v)).toFixed(3);
      }),
  );
  const lit = dots.map(() => false);

  if (light && reducedMotion) light.style.display = 'none';

  onScroll((s) => {
    const vh = viewport.h;
    const vw = viewport.w;
    if (storyT.top > s + vh * 2 || storyT.top + storyT.height < s - vh) return;

    const c = s + vh * 0.5;
    let f = 0;
    const first = chapterT[0]!;
    const final = chapterT[last]!;
    const firstCentre = first.top + first.height / 2;
    const lastCentre = final.top + final.height / 2;
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

    layers.forEach((el, idx) => {
      const local = f - idx;
      el.style.opacity = clamp01((local - 0.5) * 2.4 + 0.5).toFixed(3);
    });

    if (light && !reducedMotion) {
      const i0 = Math.min(last, Math.max(0, Math.floor(f)));
      const i1 = Math.min(last, i0 + 1);
      const t = f - i0;
      const A = LIGHT[i0] ?? LIGHT[0]!;
      const B = LIGHT[i1] ?? A;
      light.style.transform = `translate3d(${(lerp(A[0], B[0], t) * vw).toFixed(1)}px, ${(lerp(A[1], B[1], t) * vh).toFixed(1)}px, 0) scale(${lerp(A[2], B[2], t).toFixed(3)})`;
      light.style.opacity = lerp(A[3], B[3], t).toFixed(3);
    }

    if (fill) {
      fill.style.transform = `scaleY(${clamp01((c - storyT.top) / Math.max(1, storyT.height)).toFixed(4)})`;
    }

    for (let i = 0; i < dots.length; i++) {
      const on = f >= i - 0.35;
      if (on !== lit[i]) {
        lit[i] = on;
        dotSprings[i]?.set(on ? 1 : 0);
      }
    }
  });
}
