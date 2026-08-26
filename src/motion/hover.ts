/**
 * Spring hover / press. On a mouse the element lifts and grows a touch on
 * hover; everywhere it dips on press and springs back on release.
 */
import { canHover } from './prefs';
import { SpringVector, presets } from './spring';

export interface HoverOptions {
  /** px to rise on hover (negative = up) */
  lift?: number;
  /** scale on hover */
  scale?: number;
  /** scale while pressed */
  press?: number;
}

export function springHover(el: HTMLElement, opts: HoverOptions = {}): void {
  const lift = opts.lift ?? -6;
  const scale = opts.scale ?? 1.015;
  const press = opts.press ?? 0.975;

  const sv = new SpringVector([0, 1], presets.hover, ([y = 0, s = 1]) => {
    el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
  });
  sv.onRest(() => {
    if (sv.values[0] === 0 && sv.values[1] === 1) el.style.transform = '';
  });

  let hovered = false;
  let pressed = false;

  const settle = (): void => {
    if (pressed) sv.set([hovered ? lift * 0.5 : 0, press]);
    else if (hovered) sv.set([lift, scale]);
    else sv.set([0, 1]);
  };

  if (canHover) {
    el.addEventListener('pointerenter', () => {
      hovered = true;
      settle();
    });
    el.addEventListener('pointerleave', () => {
      hovered = false;
      pressed = false;
      settle();
    });
  }

  el.addEventListener('pointerdown', () => {
    pressed = true;
    settle();
  });
  const up = (): void => {
    if (!pressed) return;
    pressed = false;
    // A little upward impulse so a tap feels like a release, not a fade.
    sv.set(hovered ? [lift, scale] : [0, 1], [0, 0.6]);
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  window.addEventListener('pointerup', up, { passive: true });
}

export function initHover(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-hover]').forEach((el) => {
    if (el.dataset.hoverWired) return;
    el.dataset.hoverWired = '1';
    const preset = el.dataset.hover;
    if (preset === 'subtle') springHover(el, { lift: -3, scale: 1.006, press: 0.985 });
    else if (preset === 'button') springHover(el, { lift: -2, scale: 1.03, press: 0.96 });
    else springHover(el);
  });
}
