/**
 * Ambient drift — the heat-haze / candlelight wander on the hero.
 *
 * A layer is given a new random target every so often and an overdamped
 * spring carries it there, so the motion never stops or snaps; it just keeps
 * wandering. Paused when off-screen or the tab is hidden.
 */
import { reducedMotion, onMotionPrefChange } from './prefs';
import { SpringVector, presets, type SpringConfig } from './spring';

export interface DriftOptions {
  /** max px offset from centre */
  amplitude?: number;
  /** base scale */
  scale?: number;
  /** ± scale wander */
  scaleAmplitude?: number;
  /** [min, max] ms between new targets */
  period?: [number, number];
  /** if set, opacity wanders between these bounds */
  opacity?: [number, number];
  config?: SpringConfig;
  /** element whose visibility gates the drift (defaults to the layer's parent) */
  gate?: Element | null;
}

const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

export function ambientDrift(layer: HTMLElement, opts: DriftOptions = {}): () => void {
  const amp = opts.amplitude ?? 10;
  const baseScale = opts.scale ?? 1;
  const scaleAmp = opts.scaleAmplitude ?? 0;
  const [pMin, pMax] = opts.period ?? [2600, 4800];
  const opacity = opts.opacity;
  const config = opts.config ?? presets.drift;

  const initial = [0, 0, baseScale, opacity ? (opacity[0] + opacity[1]) / 2 : 1];
  const sv = new SpringVector(initial, { ...config, restDelta: 0.0005, restSpeed: 0.0005 }, ([x = 0, y = 0, s = 1, o = 1]) => {
    layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
    if (opacity) layer.style.opacity = o.toFixed(3);
  });

  let timer = 0;
  let visible = true;
  let running = false;

  const wander = (): void => {
    if (!running) return;
    sv.set([
      rand(-amp, amp),
      rand(-amp, amp),
      baseScale + rand(-scaleAmp, scaleAmp),
      opacity ? rand(opacity[0], opacity[1]) : 1,
    ]);
    timer = window.setTimeout(wander, rand(pMin, pMax));
  };

  const start = (): void => {
    if (running || reducedMotion || !visible || document.hidden) return;
    running = true;
    layer.style.willChange = 'transform';
    wander();
  };
  const stop = (): void => {
    running = false;
    window.clearTimeout(timer);
  };

  const gate = opts.gate ?? layer.parentElement;
  if (gate && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        visible = !!entry?.isIntersecting;
        visible ? start() : stop();
      },
      { threshold: 0 },
    ).observe(gate);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  onMotionPrefChange((reduced) => {
    if (reduced) {
      stop();
      sv.snap([0, 0, baseScale, opacity ? opacity[1] : 1]);
      layer.style.transform = '';
    } else start();
  });

  if (reducedMotion) {
    sv.snap([0, 0, baseScale, opacity ? opacity[1] : 1]);
  } else {
    start();
  }
  return stop;
}
