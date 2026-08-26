/**
 * Hero: parallax image, content that drifts and fades as you leave,
 * and the ambient candle/heat-haze wander on the image and glows.
 */
import { ambientDrift } from '../motion/ambient';
import { reducedMotion } from '../motion/prefs';
import { onScroll, parallax, viewport } from '../motion/scroll';
import { clamp01 } from '../motion/spring';

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const media = hero.querySelector<HTMLElement>('.hero__media');
  const img = hero.querySelector<HTMLElement>('.hero__img');
  const content = hero.querySelector<HTMLElement>('.hero__content');
  const glows = Array.from(hero.querySelectorAll<HTMLElement>('.hero__glow'));

  if (media) parallax(media, 0.32);

  if (content) {
    onScroll((s) => {
      if (reducedMotion) {
        content.style.transform = '';
        content.style.opacity = '';
        return;
      }
      const vh = viewport.h;
      if (s > vh * 1.3) return;
      const t = clamp01(s / (vh * 0.8));
      content.style.transform = `translate3d(0, ${(s * 0.2).toFixed(1)}px, 0)`;
      content.style.opacity = (1 - t * t).toFixed(3);
    });
  }

  if (img) {
    ambientDrift(img, {
      amplitude: 9,
      scale: 1.08,
      scaleAmplitude: 0.015,
      period: [3200, 5600],
      gate: hero,
    });
  }

  glows.forEach((g, i) => {
    ambientDrift(g, {
      amplitude: 28,
      scale: 1,
      scaleAmplitude: 0.14,
      period: i === 0 ? [650, 1400] : [900, 1900],
      opacity: [0.45, 1],
      config: { stiffness: 14, damping: 7, mass: 1 },
      gate: hero,
    });
  });
}
