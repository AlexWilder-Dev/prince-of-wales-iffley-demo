/**
 * A tiny damped-spring engine.
 *
 * Every piece of motion on the site — entrances, parallax, hover, the scroll
 * follower, the booking sheet — is a mass on a spring integrated here with
 * semi-implicit Euler at a fixed 120 Hz sub-step. Nothing uses CSS easing.
 *
 *   F = -k·(x − target) − c·v        a = F / m
 */
import { reducedMotion } from './prefs';

export interface SpringConfig {
  /** k — how hard the spring pulls toward its target */
  stiffness: number;
  /** c — how much the motion is resisted */
  damping: number;
  /** m — heavier things accelerate and settle more slowly */
  mass: number;
  /** stop when |x − target| falls below this… */
  restDelta?: number;
  /** …and |v| falls below this */
  restSpeed?: number;
}

/**
 * Named feels. ζ = c / (2·√(k·m)); below 1 overshoots, at 1 settles fastest
 * with no overshoot, above 1 creeps in.
 */
export const presets = {
  /** ζ≈0.91 — entrances: a whisper of overshoot, then still. */
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  /** ζ≈0.86 with a heavy mass — images and large blocks drift in with weight. */
  heavy: { stiffness: 90, damping: 22, mass: 1.8 },
  /** ζ≈0.73 — buttons, tabs, small UI. A visible bounce. */
  snappy: { stiffness: 320, damping: 26, mass: 1 },
  /** ζ≈0.73 — hover lift. */
  hover: { stiffness: 420, damping: 30, mass: 1 },
  /** ζ≈1.03 — critically damped. The scroll follower: lag, never bounce. */
  follow: { stiffness: 160, damping: 26, mass: 1 },
  /** ζ≈1.2 — overdamped and slow. Ambient candle drift. */
  drift: { stiffness: 6, damping: 6, mass: 1 },
  /** ζ≈0.95 — modal sheets. */
  sheet: { stiffness: 220, damping: 28, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

export type PresetName = keyof typeof presets;

interface Tickable {
  tick(dt: number): boolean;
}

/** One requestAnimationFrame loop shared by every spring. It sleeps when everything is at rest. */
class Ticker {
  private items = new Set<Tickable>();
  private raf = 0;
  private last = 0;

  add(item: Tickable): void {
    this.items.add(item);
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  remove(item: Tickable): void {
    this.items.delete(item);
  }

  private frame = (now: number): void => {
    // Clamp so a background tab or a hitch never becomes a violent jump.
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.064) dt = 0.064;
    if (dt < 0) dt = 0;

    for (const item of this.items) {
      if (!item.tick(dt)) this.items.delete(item);
    }
    this.raf = this.items.size ? requestAnimationFrame(this.frame) : 0;
  };
}

export const ticker = new Ticker();

const SUBSTEP = 1 / 120;

function integrate(
  value: number,
  velocity: number,
  target: number,
  k: number,
  c: number,
  m: number,
  dt: number,
): [number, number] {
  let remaining = dt;
  while (remaining > 0) {
    const h = remaining < SUBSTEP ? remaining : SUBSTEP;
    const accel = (-k * (value - target) - c * velocity) / m;
    velocity += accel * h;
    value += velocity * h;
    remaining -= h;
  }
  return [value, velocity];
}

export type SpringListener = (value: number, spring: Spring) => void;

/** A single scalar on a spring. */
export class Spring implements Tickable {
  value: number;
  target: number;
  velocity = 0;
  private k: number;
  private c: number;
  private m: number;
  private restDelta: number;
  private restSpeed: number;
  private listener: SpringListener | undefined;
  private restListener: (() => void) | undefined;

  constructor(initial: number, config: SpringConfig, onUpdate?: SpringListener) {
    this.value = initial;
    this.target = initial;
    this.k = config.stiffness;
    this.c = config.damping;
    this.m = config.mass;
    this.restDelta = config.restDelta ?? 0.01;
    this.restSpeed = config.restSpeed ?? 0.01;
    this.listener = onUpdate;
  }

  onUpdate(fn: SpringListener): this {
    this.listener = fn;
    return this;
  }

  onRest(fn: () => void): this {
    this.restListener = fn;
    return this;
  }

  configure(config: Partial<SpringConfig>): this {
    if (config.stiffness !== undefined) this.k = config.stiffness;
    if (config.damping !== undefined) this.c = config.damping;
    if (config.mass !== undefined) this.m = config.mass;
    if (config.restDelta !== undefined) this.restDelta = config.restDelta;
    if (config.restSpeed !== undefined) this.restSpeed = config.restSpeed;
    return this;
  }

  /** Move toward a new target. `impulse` adds velocity (value-units per second) — a shove. */
  set(target: number, impulse = 0): this {
    if (reducedMotion) {
      this.snap(target);
      return this;
    }
    this.target = target;
    this.velocity += impulse;
    ticker.add(this);
    return this;
  }

  /** Jump straight to a value with no motion. Counts as coming to rest. */
  snap(value: number): this {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    ticker.remove(this);
    this.listener?.(value, this);
    this.restListener?.();
    return this;
  }

  get isResting(): boolean {
    return (
      Math.abs(this.velocity) < this.restSpeed && Math.abs(this.value - this.target) < this.restDelta
    );
  }

  tick(dt: number): boolean {
    [this.value, this.velocity] = integrate(
      this.value,
      this.velocity,
      this.target,
      this.k,
      this.c,
      this.m,
      dt,
    );
    const done = this.isResting;
    if (done) {
      this.value = this.target;
      this.velocity = 0;
    }
    this.listener?.(this.value, this);
    if (done) this.restListener?.();
    return !done;
  }
}

export type VectorListener = (values: number[], spring: SpringVector) => void;

/** Several scalars sharing one spring config and one update callback (x / y / scale…). */
export class SpringVector implements Tickable {
  values: number[];
  targets: number[];
  velocities: number[];
  private k: number;
  private c: number;
  private m: number;
  private restDelta: number;
  private restSpeed: number;
  private listener: VectorListener | undefined;
  private restListener: (() => void) | undefined;

  constructor(initial: number[], config: SpringConfig, onUpdate?: VectorListener) {
    this.values = [...initial];
    this.targets = [...initial];
    this.velocities = initial.map(() => 0);
    this.k = config.stiffness;
    this.c = config.damping;
    this.m = config.mass;
    this.restDelta = config.restDelta ?? 0.01;
    this.restSpeed = config.restSpeed ?? 0.01;
    this.listener = onUpdate;
  }

  onUpdate(fn: VectorListener): this {
    this.listener = fn;
    return this;
  }

  onRest(fn: () => void): this {
    this.restListener = fn;
    return this;
  }

  configure(config: Partial<SpringConfig>): this {
    if (config.stiffness !== undefined) this.k = config.stiffness;
    if (config.damping !== undefined) this.c = config.damping;
    if (config.mass !== undefined) this.m = config.mass;
    return this;
  }

  set(targets: (number | undefined)[], impulses?: number[]): this {
    if (reducedMotion) {
      this.snap(targets);
      return this;
    }
    for (let i = 0; i < this.targets.length; i++) {
      const t = targets[i];
      if (t !== undefined) this.targets[i] = t;
      const imp = impulses?.[i];
      if (imp) this.velocities[i] = (this.velocities[i] ?? 0) + imp;
    }
    ticker.add(this);
    return this;
  }

  snap(values: (number | undefined)[]): this {
    for (let i = 0; i < this.values.length; i++) {
      const v = values[i];
      if (v !== undefined) {
        this.values[i] = v;
        this.targets[i] = v;
      }
      this.velocities[i] = 0;
    }
    ticker.remove(this);
    this.listener?.(this.values, this);
    this.restListener?.();
    return this;
  }

  tick(dt: number): boolean {
    let done = true;
    for (let i = 0; i < this.values.length; i++) {
      const target = this.targets[i] ?? 0;
      const [v, vel] = integrate(
        this.values[i] ?? 0,
        this.velocities[i] ?? 0,
        target,
        this.k,
        this.c,
        this.m,
        dt,
      );
      this.values[i] = v;
      this.velocities[i] = vel;
      if (Math.abs(vel) >= this.restSpeed || Math.abs(v - target) >= this.restDelta) done = false;
    }
    if (done) {
      for (let i = 0; i < this.values.length; i++) {
        this.values[i] = this.targets[i] ?? 0;
        this.velocities[i] = 0;
      }
    }
    this.listener?.(this.values, this);
    if (done) this.restListener?.();
    return !done;
  }
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
