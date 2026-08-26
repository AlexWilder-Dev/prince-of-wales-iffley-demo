/**
 * Scroll follower, measurement registry, parallax and progress helpers.
 *
 * The raw scroll position is fed into a critically-damped spring; every
 * scroll-linked effect reads the *smoothed* value, so parallax layers, the
 * story backgrounds and the timeline thread all carry a little physical lag
 * and settle rather than stop dead.
 */
import { reducedMotion } from './prefs';
import { Spring, presets, clamp01 } from './spring';

export const viewport = { w: window.innerWidth, h: window.innerHeight };

type ScrollListener = (smooth: number, raw: number) => void;
const listeners = new Set<ScrollListener>();

let raw = window.scrollY;
let smooth = raw;

const follower = new Spring(raw, { ...presets.follow, restDelta: 0.05, restSpeed: 0.05 }, (v) => {
  smooth = v;
  emit();
});

function emit(): void {
  for (const l of listeners) l(smooth, raw);
}

window.addEventListener(
  'scroll',
  () => {
    raw = window.scrollY;
    follower.set(raw); // snaps under reduced motion
  },
  { passive: true },
);

export function onScroll(fn: ScrollListener): () => void {
  listeners.add(fn);
  fn(smooth, raw);
  return () => listeners.delete(fn);
}

export function getScroll(): { raw: number; smooth: number } {
  return { raw, smooth };
}

/* ---------- measurement registry ---------- */

export interface Tracked {
  el: HTMLElement;
  top: number;
  height: number;
}

const tracked = new Map<HTMLElement, Tracked>();

export function track(el: HTMLElement): Tracked {
  let t = tracked.get(el);
  if (!t) {
    const r = el.getBoundingClientRect();
    t = { el, top: r.top + window.scrollY, height: r.height };
    tracked.set(el, t);
  }
  return t;
}

/** Re-read every tracked element's document position. Reads only — no writes interleaved. */
export function measure(): void {
  const sy = window.scrollY;
  viewport.w = window.innerWidth;
  viewport.h = window.innerHeight;
  for (const t of tracked.values()) {
    const r = t.el.getBoundingClientRect();
    t.top = r.top + sy;
    t.height = r.height;
  }
  raw = sy;
  emit();
}

let measureRaf = 0;
function scheduleMeasure(): void {
  if (measureRaf) return;
  measureRaf = requestAnimationFrame(() => {
    measureRaf = 0;
    measure();
  });
}

let resizeTimer = 0;
window.addEventListener(
  'resize',
  () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measure, 120);
  },
  { passive: true },
);
window.addEventListener('load', scheduleMeasure);
if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);
if ('ResizeObserver' in window) {
  new ResizeObserver(scheduleMeasure).observe(document.body);
}

/* ---------- parallax ---------- */

/**
 * Move `layer` vertically as its parent travels through the viewport.
 * speed 0.1 → layer drifts 10% of the parent's travel, opposite to scroll.
 * The parent is what gets measured, so the layer's own transform never
 * pollutes the reading.
 */
export function parallax(layer: HTMLElement, speed: number): void {
  const container = layer.parentElement;
  if (!container) return;
  const t = track(container);
  layer.style.willChange = 'transform';
  onScroll((s) => {
    if (reducedMotion) {
      layer.style.transform = '';
      return;
    }
    const vh = viewport.h;
    // Nowhere near the viewport — skip the write.
    if (t.top + t.height < s - vh || t.top > s + vh * 2) return;
    const delta = t.top + t.height / 2 - (s + vh / 2);
    layer.style.transform = `translate3d(0, ${(-delta * speed).toFixed(1)}px, 0)`;
  });
}

/** Wire every [data-parallax="speed"] element in the document. */
export function initParallax(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax ?? '0.1');
    if (Number.isFinite(speed) && speed !== 0) parallax(el, speed);
  });
}

/* ---------- progress ---------- */

export type ProgressMode = 'travel' | 'pinned';

/**
 * Report an element's scroll progress 0…1.
 *   travel — 0 as its top enters at the bottom of the viewport, 1 as its bottom leaves the top.
 *   pinned — 0 when its top reaches the top of the viewport, 1 when its bottom reaches the bottom
 *            (the span during which a sticky child inside it stays pinned).
 */
export function progress(
  el: HTMLElement,
  fn: (p: number, smooth: number) => void,
  mode: ProgressMode = 'travel',
): () => void {
  const t = track(el);
  return onScroll((s) => {
    const vh = viewport.h;
    let p: number;
    if (mode === 'pinned') {
      const span = Math.max(1, t.height - vh);
      p = (s - t.top) / span;
    } else {
      p = (s + vh - t.top) / (t.height + vh);
    }
    fn(clamp01(p), s);
  });
}

/* ---------- spring-driven anchor scrolling ---------- */

let scroller: Spring | null = null;

function cancelScroller(): void {
  if (scroller) {
    scroller.snap(window.scrollY);
    scroller = null;
  }
}

['wheel', 'touchstart', 'keydown'].forEach((evt) =>
  window.addEventListener(evt, cancelScroller, { passive: true }),
);

export function scrollToY(target: number): void {
  cancelScroller();
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y = Math.max(0, Math.min(max, target));
  const s = new Spring(
    window.scrollY,
    { stiffness: 80, damping: 18, mass: 1, restDelta: 0.5, restSpeed: 0.5 },
    (v) => window.scrollTo(0, v),
  );
  s.onRest(() => {
    if (scroller === s) scroller = null;
  });
  scroller = s;
  s.set(y);
}

export function scrollToElement(el: HTMLElement, offset = 0): void {
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  scrollToY(top);
}
