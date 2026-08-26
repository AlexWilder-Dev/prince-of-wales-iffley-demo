/** Motion preferences. Everything springs unless the visitor asked us not to. */
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

export let reducedMotion = mq.matches;

const listeners = new Set<(reduced: boolean) => void>();

mq.addEventListener('change', (e) => {
  reducedMotion = e.matches;
  document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  listeners.forEach((l) => l(reducedMotion));
});
document.documentElement.classList.toggle('reduced-motion', reducedMotion);

export function onMotionPrefChange(fn: (reduced: boolean) => void): void {
  listeners.add(fn);
}

/** A pointer that can genuinely hover (desktop). Touch devices get press feedback instead. */
export const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
