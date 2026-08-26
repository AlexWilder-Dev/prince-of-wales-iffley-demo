/** Hero: the window-light wanders like candlelight; the copy drifts and fades as you leave. */
import { ambientDrift } from '../motion/ambient';
import { reducedMotion } from '../motion/prefs';
import { onScroll, viewport } from '../motion/scroll';
import { clamp01 } from '../motion/spring';

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const light = hero.querySelector<HTMLElement>('.hero__window');
  const copy = hero.querySelector<HTMLElement>('.hero__copy');

  if (light) {
    ambientDrift(light, {
      amplitude: 30,
      scale: 1,
      scaleAmplitude: 0.12,
      period: [700, 1600],
      opacity: [0.5, 1],
      config: { stiffness: 14, damping: 7, mass: 1 },
      gate: hero,
    });
  }

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
