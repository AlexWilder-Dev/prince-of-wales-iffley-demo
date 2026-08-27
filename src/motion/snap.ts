/**
 * Chapter paging for the story.
 *
 * The story is four scenes, each with a mechanism that has to play through to
 * mean anything. Left to free scroll they smear past. So while the story holds
 * the viewport, one gesture moves one chapter and a spring carries you there —
 * the mechanism plays out over the travel and settles at the far end.
 *
 * It drives the real scroll position rather than pinning and faking it, so the
 * scrollbar stays honest, anchors keep working, and every scroll-linked effect
 * on the page carries on reading window.scrollY as before.
 *
 * Ways out, deliberately: at the first chapter scrolling up releases, at the
 * last scrolling down releases, the numerals jump straight to a chapter, the
 * keyboard works, and reduced motion turns the whole thing off.
 */
import { reducedMotion, onMotionPrefChange } from './prefs';
import { Spring, clamp } from './spring';

/** How far a wheel must travel before it counts as "next chapter". */
const WHEEL_INTENT = 26;
/** How far a finger must travel before it counts. */
const TOUCH_INTENT = 44;
/** …and how far before we can tell which way it is going. */
const TOUCH_DIRECTION = 10;
/** Further than this from the current chapter's rest and we are between things. */
const OFF_REST = 80;

export interface SnapOptions {
  section: HTMLElement;
  items: HTMLElement[];
  /** called with the active index whenever it changes */
  onIndex?: (i: number) => void;
  /** called when paging engages or releases */
  onEngage?: (on: boolean) => void;
}

/** Returns a jump-to-chapter function, or null if paging could not be set up. */
export function initSnap({ section, items, onIndex, onEngage }: SnapOptions): ((i: number) => void) | null {
  if (items.length < 2) return null;

  let enabled = !reducedMotion;
  let index = 0;
  let animating = false;
  let wasEngaged = false;

  onMotionPrefChange((reduced) => {
    enabled = !reduced;
    if (reduced) animating = false;
  });

  const maxScroll = (): number => document.documentElement.scrollHeight - window.innerHeight;

  /** The scroll position at which item i sits in the middle of the viewport. */
  const restFor = (i: number): number => {
    const el = items[i];
    if (!el) return window.scrollY;
    const r = el.getBoundingClientRect();
    const centre = r.top + window.scrollY + r.height / 2;
    return clamp(centre - window.innerHeight / 2, 0, maxScroll());
  };

  const nearest = (): number => {
    const probe = window.scrollY + window.innerHeight / 2;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < items.length; i++) {
      const el = items[i]!;
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + window.scrollY + r.height / 2 - probe);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  /** Paging is live only while the story spans the middle of the viewport. */
  const engaged = (): boolean => {
    if (!enabled) return false;
    if (document.body.classList.contains('is-locked')) return false;
    const r = section.getBoundingClientRect();
    const probe = window.innerHeight / 2;
    return r.top <= probe && r.bottom >= probe;
  };

  const scroller = new Spring(
    window.scrollY,
    { stiffness: 150, damping: 22, mass: 1, restDelta: 0.6, restSpeed: 0.6 },
    (v) => window.scrollTo(0, v),
  );
  scroller.onRest(() => {
    animating = false;
  });

  const setIndex = (i: number): void => {
    if (i === index) return;
    index = i;
    onIndex?.(i);
  };

  const goTo = (i: number): void => {
    const next = clamp(i, 0, items.length - 1);
    scroller.snap(window.scrollY); // clears any run in progress
    animating = true;
    setIndex(next);
    scroller.set(restFor(next));
  };

  /**
   * Arriving from the intro — or anywhere between chapters — the first gesture
   * should settle onto the chapter we are heading into, not vault over it.
   */
  const settlesFirst = (dir: number): boolean => {
    const y = window.scrollY;
    const rest = restFor(index);
    if (Math.abs(y - rest) <= OFF_REST) return false;
    return (dir > 0 && rest > y) || (dir < 0 && rest < y);
  };

  /** false means "let the page have it" — an exit. */
  const canStep = (dir: number): boolean => {
    if (settlesFirst(dir)) return true;
    const next = index + dir;
    return next >= 0 && next < items.length;
  };

  const step = (dir: number): void => {
    goTo(settlesFirst(dir) ? index : index + dir);
  };

  /* ---------- wheel ---------- */
  let wheelAccum = 0;
  let wheelIdle = 0;

  window.addEventListener(
    'wheel',
    (e) => {
      if (!engaged()) return;
      if (e.ctrlKey) return; // pinch-zoom
      if (animating) {
        e.preventDefault();
        return;
      }
      const dir = e.deltaY > 0 ? 1 : -1;
      if (!canStep(dir)) return; // release

      e.preventDefault();
      wheelAccum += e.deltaY;
      window.clearTimeout(wheelIdle);
      wheelIdle = window.setTimeout(() => (wheelAccum = 0), 180);
      if (Math.abs(wheelAccum) < WHEEL_INTENT) return;
      wheelAccum = 0;
      step(dir);
    },
    { passive: false },
  );

  /* ---------- touch ---------- */
  let touchY = 0;
  let tracking = false;
  let decided = false;

  window.addEventListener(
    'touchstart',
    (e) => {
      touchY = e.touches[0]?.clientY ?? 0;
      tracking = engaged();
      decided = false;
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (!tracking || !engaged()) return;
      if (animating) {
        e.preventDefault();
        return;
      }
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (Math.abs(dy) < TOUCH_DIRECTION) {
        e.preventDefault(); // hold still until we know which way they mean
        return;
      }
      const dir = dy > 0 ? 1 : -1;
      if (!canStep(dir)) {
        tracking = false; // release: let the flick carry them out
        return;
      }
      e.preventDefault();
      if (decided || Math.abs(dy) < TOUCH_INTENT) return;
      decided = true;
      step(dir);
    },
    { passive: false },
  );

  window.addEventListener(
    'touchend',
    () => {
      tracking = false;
      decided = false;
    },
    { passive: true },
  );

  /* ---------- keyboard ---------- */
  window.addEventListener('keydown', (e) => {
    if (!engaged()) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;

    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ') dir = e.shiftKey ? -1 : 1;
    else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
      return;
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(items.length - 1);
      return;
    }
    if (!dir) return;
    if (!canStep(dir)) return; // release
    e.preventDefault();
    step(dir);
  });

  /* ---------- keep in step with free scrolling ---------- */
  window.addEventListener(
    'scroll',
    () => {
      if (!animating) setIndex(nearest());
      const on = engaged();
      if (on !== wasEngaged) {
        wasEngaged = on;
        onEngage?.(on);
      }
    },
    { passive: true },
  );

  return goTo;
}

/** The chapter numerals down the edge: a way through that isn't a gesture. */
export function initChapterMarks(
  count: number,
  goTo: ((i: number) => void) | null,
): { setActive: (i: number) => void; setVisible: (on: boolean) => void } {
  const nav = document.querySelector<HTMLElement>('[data-chapters]');
  const marks = nav ? Array.from(nav.querySelectorAll<HTMLButtonElement>('[data-chapter-go]')) : [];

  marks.forEach((b) => {
    b.addEventListener('click', () => {
      const i = clamp(Number(b.dataset.chapterGo), 0, count - 1);
      if (goTo) goTo(i);
      else document.querySelectorAll<HTMLElement>('[data-chapter]')[i]?.scrollIntoView({ block: 'center' });
    });
  });

  return {
    setActive(i) {
      marks.forEach((b, j) => {
        b.classList.toggle('is-on', j === i);
        if (j === i) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    },
    setVisible(on) {
      nav?.classList.toggle('is-on', on);
    },
  };
}
