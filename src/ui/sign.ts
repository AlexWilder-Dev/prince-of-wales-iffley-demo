/**
 * The hanging pub sign — a pendulum on a very lightly damped spring.
 * A breeze nudges it now and then, scrolling shoves it, and a tap sets it
 * swinging. It always settles.
 */
import { reducedMotion, onMotionPrefChange } from '../motion/prefs';
import { Spring, clamp } from '../motion/spring';

export function initSign(): void {
  const wrap = document.querySelector<HTMLElement>('[data-sign]');
  const board = document.querySelector<HTMLElement>('[data-sign-board]');
  if (!wrap || !board) return;

  const MAX = 34; // degrees, either way
  const angle = new Spring(
    0,
    { stiffness: 14, damping: 0.85, mass: 1, restDelta: 0.03, restSpeed: 0.03 },
    (v) => {
      board.style.transform = `rotate(${clamp(v, -MAX, MAX).toFixed(2)}deg)`;
    },
  );

  const shove = (impulse: number): void => {
    if (reducedMotion) return;
    const next = clamp(angle.velocity + impulse, -220, 220);
    angle.set(0, next - angle.velocity);
  };

  // A scroll gives the board a shove proportional to how hard you scrolled.
  let lastY = window.scrollY;
  let visible = true;
  window.addEventListener(
    'scroll',
    () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!visible || Math.abs(dy) < 1) return;
      shove(clamp(dy * 1.1, -90, 90));
    },
    { passive: true },
  );

  // A tap on the board sets it swinging away from your finger.
  board.addEventListener('pointerdown', (e) => {
    const r = board.getBoundingClientRect();
    const side = e.clientX < r.left + r.width / 2 ? 1 : -1;
    shove(side * 110);
  });

  // The breeze.
  let timer = 0;
  const breeze = (): void => {
    if (visible && !document.hidden) shove((Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 22));
    timer = window.setTimeout(breeze, 2600 + Math.random() * 3200);
  };
  const start = (): void => {
    window.clearTimeout(timer);
    if (!reducedMotion) timer = window.setTimeout(breeze, 900);
  };

  new IntersectionObserver(
    (es) => {
      visible = !!es[0]?.isIntersecting;
    },
    { threshold: 0.1 },
  ).observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(timer);
    else start();
  });
  onMotionPrefChange((reduced) => {
    if (reduced) {
      window.clearTimeout(timer);
      angle.snap(0);
    } else start();
  });

  if (reducedMotion) angle.snap(0);
  else {
    // Arrive already swinging, as if the door just closed.
    angle.snap(-6);
    angle.set(0, 60);
    start();
  }
}
