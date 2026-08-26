/**
 * Entrance reveals. Any element with [data-reveal] is primed (hidden and
 * offset) and, when it enters the viewport, released onto a spring.
 *
 *   data-reveal            up, 34px      gentle
 *   data-reveal="weight"   up, 60px      heavy   — images, big blocks
 *   data-reveal="fade"     no offset     gentle
 *   data-reveal="scale"    scale .94     gentle
 *   data-reveal="left"     x −40px       gentle
 *   data-reveal="right"    x  40px       gentle
 *   data-delay="120"       ms before release
 *   data-stagger="80"      on a PARENT: children reveal 80ms apart
 */
import { reducedMotion } from './prefs';
import { Spring, presets, clamp01, type SpringConfig } from './spring';

type Kind = 'up' | 'weight' | 'fade' | 'scale' | 'left' | 'right';

interface Recipe {
  x: number;
  y: number;
  scale: number;
  config: SpringConfig;
}

const recipes: Record<Kind, Recipe> = {
  up: { x: 0, y: 34, scale: 1, config: presets.gentle },
  weight: { x: 0, y: 60, scale: 1, config: presets.heavy },
  fade: { x: 0, y: 0, scale: 1, config: presets.gentle },
  scale: { x: 0, y: 12, scale: 0.94, config: presets.gentle },
  left: { x: -40, y: 0, scale: 1, config: presets.gentle },
  right: { x: 40, y: 0, scale: 1, config: presets.gentle },
};

function kindOf(el: HTMLElement): Kind {
  const k = el.dataset.reveal as Kind | '' | undefined;
  return k && k in recipes ? k : 'up';
}

function apply(el: HTMLElement, r: Recipe, v: number): void {
  const inv = 1 - v;
  el.style.opacity = String(clamp01(v));
  const x = r.x * inv;
  const y = r.y * inv;
  const s = 1 - (1 - r.scale) * inv;
  el.style.transform =
    s === 1 ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)` : `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
}

function prime(el: HTMLElement): void {
  apply(el, recipes[kindOf(el)], 0);
  el.style.willChange = 'transform, opacity';
}

function delayFor(el: HTMLElement): number {
  const own = parseFloat(el.dataset.delay ?? '');
  if (Number.isFinite(own)) return own;
  const parent = el.parentElement;
  const stagger = parent ? parseFloat(parent.dataset.stagger ?? '') : NaN;
  if (parent && Number.isFinite(stagger)) {
    const siblings = Array.from(parent.children).filter((c) => (c as HTMLElement).dataset?.reveal !== undefined);
    return siblings.indexOf(el) * stagger;
  }
  return 0;
}

export function release(el: HTMLElement): void {
  const r = recipes[kindOf(el)];
  const spring = new Spring(0, { ...r.config, restDelta: 0.002, restSpeed: 0.002 }, (v) => apply(el, r, v));
  spring.onRest(() => {
    el.style.willChange = '';
    el.style.transform = '';
    el.style.opacity = '';
    el.classList.add('is-revealed');
  });
  const delay = delayFor(el);
  if (delay > 0) window.setTimeout(() => spring.set(1), delay);
  else spring.set(1);
}

export function initReveals(root: ParentNode = document): void {
  // Skip anything inside a hidden panel — it is revealed explicitly when shown.
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
    (el) => !el.classList.contains('is-revealed') && !el.dataset.revealPrimed && !el.closest('[hidden]'),
  );
  if (reducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          io.unobserve(e.target);
          release(e.target as HTMLElement);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
  );
  els.forEach((el) => {
    el.dataset.revealPrimed = '1';
    prime(el);
    io.observe(el);
  });
}

/** Reveal a freshly rendered subtree immediately (used by tab panels). */
export function revealNow(root: ParentNode): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (reducedMotion) {
    els.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  els.forEach((el) => {
    el.classList.remove('is-revealed');
    prime(el);
    release(el);
  });
}
