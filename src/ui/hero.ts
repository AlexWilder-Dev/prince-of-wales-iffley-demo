/**
 * The hero: arriving at the door after dark.
 *
 * The page opens unlit. The left lantern comes up, then the right, each
 * throwing a pool of warm light onto the paint; the sign settles between them
 * and starts to swing; then the words arrive in sequence. After that the
 * flames never stop wandering, so the light on the wall is never quite still.
 */
import { reducedMotion, onMotionPrefChange } from '../motion/prefs';
import { onScroll, viewport } from '../motion/scroll';
import { Spring, SpringVector, clamp01 } from '../motion/spring';

const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

/** ms after load that each stage of the arrival begins */
const STAGE = { lampL: 260, lampR: 620, sign: 900, words: 1080, wordGap: 130 };

interface Lamp {
  /** 0 = out, 1 = lit */
  light(v: number): void;
}

function wireLamp(lamp: HTMLElement, hero: HTMLElement): Lamp {
  const pool = lamp.querySelector<HTMLElement>('[data-pool]');
  const flame = lamp.querySelector<SVGElement>('[data-flame]');
  const core = lamp.querySelector<SVGElement>('[data-core]');

  let lit = 0;
  let flick = 1;

  const paint = (): void => {
    const f = lit * flick;
    if (pool) {
      pool.style.opacity = clamp01(lit * (0.55 + 0.45 * flick)).toFixed(3);
      pool.style.transform = `scale(${(0.9 + 0.14 * flick).toFixed(3)})`;
    }
    if (flame) flame.style.transform = `scale(${(0.75 + 0.3 * flick).toFixed(3)}, ${f.toFixed(3)})`;
    if (core) core.style.transform = `scale(${(0.8 + 0.2 * flick).toFixed(3)}, ${f.toFixed(3)})`;
  };

  [flame, core].forEach((el) => {
    if (!el) return;
    el.style.transformOrigin = '26px 69px';
    el.style.transformBox = 'view-box';
  });

  // the flame's own wander — a gas jet never sits still
  if (!reducedMotion) {
    const sv = new SpringVector([1], { stiffness: 62, damping: 9, mass: 1, restDelta: 0.0005, restSpeed: 0.0005 }, ([v = 1]) => {
      flick = v;
      paint();
    });
    let timer = 0;
    let running = false;
    const step = (): void => {
      if (!running) return;
      sv.set([rand(0.76, 1.2)]);
      timer = window.setTimeout(step, rand(130, 380));
    };
    const start = (): void => {
      if (running || document.hidden) return;
      running = true;
      step();
    };
    const stop = (): void => {
      running = false;
      window.clearTimeout(timer);
    };
    new IntersectionObserver((es) => (es[0]?.isIntersecting ? start() : stop()), { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  paint();
  return {
    light(v) {
      lit = v;
      paint();
    },
  };
}

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;

  const lamps = Array.from(hero.querySelectorAll<HTMLElement>('.lamp')).map((l) => wireLamp(l, hero));
  const words = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero]'));
  const copy = hero.querySelector<HTMLElement>('.hero__copy');

  /* ---- the arrival ---- */
  if (reducedMotion) {
    lamps.forEach((l) => l.light(1));
    words.forEach((w) => {
      w.style.opacity = '';
      w.style.transform = '';
    });
  } else {
    words.forEach((w) => {
      w.style.opacity = '0';
      w.style.transform = 'translate3d(0, 16px, 0)';
      w.style.willChange = 'transform, opacity';
    });

    lamps.forEach((lamp, i) => {
      const s = new Spring(0, { stiffness: 46, damping: 8.5, mass: 1, restDelta: 0.002, restSpeed: 0.002 }, (v) =>
        lamp.light(clamp01(v)),
      );
      window.setTimeout(() => s.set(1), i === 0 ? STAGE.lampL : STAGE.lampR);
    });

    words.forEach((w, i) => {
      const s = new Spring(0, { stiffness: 120, damping: 20, mass: 1, restDelta: 0.002, restSpeed: 0.002 }, (v) => {
        w.style.opacity = clamp01(v).toFixed(3);
        w.style.transform = `translate3d(0, ${((1 - v) * 16).toFixed(2)}px, 0)`;
      });
      s.onRest(() => {
        w.style.willChange = '';
        w.style.opacity = '';
        w.style.transform = '';
      });
      window.setTimeout(() => s.set(1), STAGE.words + i * STAGE.wordGap);
    });
  }

  onMotionPrefChange((reduced) => {
    if (!reduced) return;
    lamps.forEach((l) => l.light(1));
    words.forEach((w) => {
      w.style.opacity = '';
      w.style.transform = '';
    });
  });

  /* ---- the copy drifts and fades as you leave ---- */
  if (copy) {
    onScroll((s) => {
      if (reducedMotion) {
        copy.style.transform = '';
        copy.style.opacity = '';
        return;
      }
      const vh = viewport.h;
      if (s > vh * 1.3) return;
      const t = clamp01(s / (vh * 0.8));
      copy.style.transform = `translate3d(0, ${(s * 0.16).toFixed(1)}px, 0)`;
      copy.style.opacity = (1 - t * t).toFixed(3);
    });
  }
}

/** When the arrival begins, the sign should not swing until the lamps are up. */
export const SIGN_DELAY = STAGE.sign;
