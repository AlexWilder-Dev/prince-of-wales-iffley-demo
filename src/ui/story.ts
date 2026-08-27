/**
 * The story scroll. Four chapters; as the reader moves through them the page's
 * ground crossfades through each era, a single light source travels from the
 * oven to the gas lamp to the hearth to daylight, a gold thread fills down the
 * margin, and each chapter's mechanism runs on a spring.
 *
 * Everything is keyed to one number: `f`, the reader's position expressed as a
 * fractional chapter index. At f === i chapter i is centred in the viewport —
 * which is exactly where chapter paging comes to rest, so a settled chapter is
 * always a fully played mechanism.
 */
import { reducedMotion } from '../motion/prefs';
import { onScroll, track, viewport } from '../motion/scroll';
import { initChapterMarks, initSnap } from '../motion/snap';
import { Spring, presets, clamp01, lerp } from '../motion/spring';
import { mechanisms } from './mech';

/** [x, y, scale, opacity] of the light for each era, as viewport fractions. */
const LIGHT: [number, number, number, number][] = [
  [0.1, 0.95, 1.05, 0.85], // the oven, low left
  [0.92, 0.06, 0.62, 0.55], // the gas lamp, high right
  [0.14, 0.78, 0.95, 0.9], // the hearth
  [0.5, -0.08, 1.55, 0.5], // daylight
];

/** How far off-centre a chapter can be before its mechanism is fully at rest. */
const MECH_REACH = 0.8;

type MechSetter = (v: number) => void;

function mountMechanisms(chapters: HTMLElement[]): MechSetter[] {
  return chapters.map((chapter) => {
    const host = chapter.querySelector<HTMLElement>('[data-mech]');
    const mech = host ? mechanisms[host.dataset.mech ?? ''] : undefined;
    if (!host || !mech) return () => {};

    host.innerHTML = mech.svg;
    const svg = host.querySelector('svg');
    if (!svg) return () => {};
    const update = mech.mount(svg, chapter);

    if (reducedMotion) {
      update(1);
      return () => {};
    }

    // A heavy-ish follower, so the mechanism lags the reader and settles.
    const spring = new Spring(
      0,
      { stiffness: 60, damping: 16, mass: 1.2, restDelta: 0.001, restSpeed: 0.001 },
      update,
    );
    update(0);
    return (v: number) => {
      if (Math.abs(v - spring.target) > 0.0005) spring.set(v);
    };
  });
}

export function initStory(): void {
  const story = document.getElementById('story');
  if (!story) return;

  const chapters = Array.from(story.querySelectorAll<HTMLElement>('[data-chapter]'));
  if (chapters.length < 2) return;

  const setMech = mountMechanisms(chapters);

  const layers = [1, 2, 3]
    .map((i) => story.querySelector<HTMLElement>(`[data-era-layer="${i}"]`))
    .filter((el): el is HTMLElement => el !== null);
  const light = story.querySelector<HTMLElement>('[data-story-light]');
  const fill = story.querySelector<HTMLElement>('[data-thread-fill]');
  const dots = Array.from(story.querySelectorAll<HTMLElement>('[data-thread-dot]'));

  const storyT = track(story);
  const chapterT = chapters.map((c) => track(c));
  const last = chapterT.length - 1;

  /* ---- chapter paging ---- */
  let marks: ReturnType<typeof initChapterMarks> | null = null;
  const goTo = initSnap({
    section: story,
    items: chapters,
    onIndex: (i) => {
      marks?.setActive(i);
      paintMarks(i);
    },
    onEngage: (on) => marks?.setVisible(on),
  });
  marks = initChapterMarks(chapters.length, goTo);
  marks.setActive(0);

  // chapters one and four are on paper, two and three on paint
  const nav = document.querySelector<HTMLElement>('[data-chapters]');
  const onPaper = chapters.map(
    (c) => c.classList.contains('chapter--bakery') || c.classList.contains('chapter--today'),
  );
  const paintMarks = (i: number): void => {
    nav?.classList.toggle('on-paper', onPaper[i] === true);
  };
  paintMarks(0);

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

    // Where is the viewport's middle, as a fractional chapter index?
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

    // Each mechanism is fully played when its chapter is centred.
    for (let i = 0; i < setMech.length; i++) {
      setMech[i]!(1 - clamp01(Math.abs(f - i) / MECH_REACH));
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
