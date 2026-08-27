/**
 * The four story mechanisms — hand-drawn SVG objects that move as you scroll.
 *
 *   oven    the iron door lifts, loaves glow
 *   pump    the handpump pulls, a pint of bitter fills
 *   hearth  the fire catches, the sign is re-gilded
 *   lock    Iffley's mitre gates swing open, a rowing eight slides through
 *
 * Each mechanism mounts into a container and returns an update(m) with
 * m ∈ [0, 1] — already spring-smoothed by the caller — plus its own ambient
 * flicker/ripple driven by springs wandering between random targets.
 */
import { reducedMotion } from '../motion/prefs';
import { SpringVector, clamp01, lerp, type SpringConfig } from '../motion/spring';

type Update = (m: number) => void;

export interface Mechanism {
  svg: string;
  mount(root: SVGSVGElement, gate: Element): Update;
}

const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

/** Wander a SpringVector between random targets while `gate` is on screen. */
function wander(
  initial: number[],
  targets: () => number[],
  apply: (v: number[]) => void,
  period: [number, number],
  config: SpringConfig,
  gate: Element,
): void {
  if (reducedMotion) {
    apply(initial);
    return;
  }
  const sv = new SpringVector(initial, { ...config, restDelta: 0.0005, restSpeed: 0.0005 }, apply);
  let timer = 0;
  let running = false;
  const step = (): void => {
    if (!running) return;
    sv.set(targets());
    timer = window.setTimeout(step, rand(period[0], period[1]));
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
  new IntersectionObserver((es) => (es[0]?.isIntersecting ? start() : stop()), { threshold: 0 }).observe(gate);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

const q = <T extends Element>(root: Element, sel: string): T | null => root.querySelector<T>(sel);

/* ------------------------------------------------------------------ oven */
const oven: Mechanism = {
  svg: `<svg viewBox="0 0 320 240" aria-hidden="true">
  <defs>
    <radialGradient id="ovenGlow" cx="50%" cy="85%" r="75%">
      <stop offset="0" stop-color="#f0b464"/><stop offset=".45" stop-color="#b8590c"/><stop offset="1" stop-color="#2a1006"/>
    </radialGradient>
    <clipPath id="ovenMouth"><path d="M96 214 V150 A64 58 0 0 1 224 150 V214 Z"/></clipPath>
  </defs>
  <g stroke="currentColor" stroke-width="1" opacity=".28" fill="none">
    <path d="M28 214 V128 A132 108 0 0 1 292 128 V214"/>
    <path d="M28 190 H82 M28 166 H70 M34 142 H68 M292 190 H238 M292 166 H250 M286 142 H252 M56 190 V166 M50 166 V142 M264 190 V166 M270 166 V142 M60 118 L72 104 M256 118 L244 104 M120 104 L128 92 M200 104 L192 92 M160 96 V84"/>
  </g>
  <path d="M28 214 V128 A132 108 0 0 1 292 128 V214" fill="none" stroke="currentColor" stroke-width="2"/>
  <g clip-path="url(#ovenMouth)">
    <rect data-glow x="96" y="88" width="128" height="128" fill="url(#ovenGlow)" opacity=".15"/>
    <g data-loaves fill="#d9a35c" stroke="#5a3210" stroke-width="1.4">
      <ellipse cx="126" cy="198" rx="26" ry="13"/><ellipse cx="164" cy="192" rx="30" ry="15"/><ellipse cx="200" cy="199" rx="23" ry="12"/>
      <path d="M114 194 l10 -6 M121 200 l10 -6 M150 186 l12 -7 M158 192 l12 -7 M191 196 l9 -5 M197 201 l9 -5" fill="none"/>
    </g>
    <g data-door>
      <rect x="92" y="86" width="136" height="132" fill="#343a3c" stroke="#15191a" stroke-width="2"/>
      <rect x="102" y="96" width="116" height="112" fill="none" stroke="#59605f" stroke-width="1.5"/>
      <path d="M92 130 H228 M92 174 H228" stroke="#59605f" stroke-width="1"/>
      <circle cx="160" cy="176" r="5" fill="#87908f"/><path d="M148 176 H172" stroke="#15191a" stroke-width="2.5"/>
      <circle cx="104" cy="108" r="1.6" fill="#87908f"/><circle cx="216" cy="108" r="1.6" fill="#87908f"/><circle cx="104" cy="196" r="1.6" fill="#87908f"/><circle cx="216" cy="196" r="1.6" fill="#87908f"/>
    </g>
  </g>
  <path d="M96 214 V150 A64 58 0 0 1 224 150 V214" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M16 214 H304" stroke="currentColor" stroke-width="2"/>
  <path d="M16 226 H304" stroke="currentColor" stroke-width="1" opacity=".4"/>
  <g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M258 213 L302 70"/><path d="M300 76 l-14 -3 5 -16 14 4 z" fill="currentColor"/></g>
  <g data-dust fill="currentColor" opacity=".3">
    <circle cx="60" cy="106" r="1.5"/><circle cx="74" cy="84" r="1.1"/><circle cx="50" cy="70" r="1.3"/><circle cx="86" cy="60" r=".9"/><circle cx="246" cy="60" r="1.2"/><circle cx="262" cy="92" r="1"/><circle cx="234" cy="48" r="1.4"/>
  </g>
</svg>`,
  mount(root, gate) {
    const door = q<SVGGElement>(root, '[data-door]');
    const glow = q<SVGRectElement>(root, '[data-glow]');
    const dust = q<SVGGElement>(root, '[data-dust]');
    if (dust) {
      dust.style.willChange = 'transform';
      wander(
        [0, 0],
        () => [rand(-6, 6), rand(-10, 4)],
        ([x = 0, y = 0]) => (dust.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`),
        [1800, 3200],
        { stiffness: 5, damping: 5, mass: 1 },
        gate,
      );
    }
    return (m) => {
      if (door) door.style.transform = `translateY(${(-134 * m).toFixed(2)}px)`;
      if (glow) glow.setAttribute('opacity', (0.15 + 0.85 * m).toFixed(3));
    };
  },
};

/* ------------------------------------------------------------------ pump */
const pump: Mechanism = {
  svg: `<svg viewBox="0 0 320 240" aria-hidden="true">
  <defs>
    <clipPath id="pintClip"><path d="M226 116 h48 l-5 92 h-38 z"/></clipPath>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#f0b464" stop-opacity=".55"/><stop offset="1" stop-color="#f0b464" stop-opacity="0"/></radialGradient>
  </defs>
  <g transform="translate(46 62)">
    <path d="M0 0 h28 M28 0 v-12" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M18 -12 h20 l-4 -14 h-12 z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle data-lamp-glow cx="28" cy="-22" r="34" fill="url(#lampGlow)"/>
    <ellipse data-lamp cx="28" cy="-22" rx="4" ry="7" fill="#f0b464"/>
  </g>
  <rect x="0" y="200" width="320" height="40" fill="#2b1a0f"/>
  <path d="M0 200 H320" stroke="currentColor" stroke-width="2"/>
  <path d="M0 212 H320 M0 226 H320" stroke="#4a2f1c" stroke-width="1"/>
  <path d="M0 236 H320" stroke="currentColor" stroke-width="1" opacity=".35"/>
  <path d="M161 154 c0 -16 10 -22 28 -22 h32 c10 0 17 7 17 20" fill="none" stroke="#5a3f14" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M238 152 v6" stroke="#5a3f14" stroke-width="4.5" stroke-linecap="round"/>
  <path data-stream d="M238 160 V196" stroke="#c8862a" stroke-width="3" stroke-linecap="round" opacity="0"/>
  <rect x="142" y="196" width="38" height="6" fill="#5a3f14"/>
  <rect x="150" y="146" width="22" height="52" rx="3" fill="#b28f4e" stroke="#5a3f14" stroke-width="1.5"/>
  <g data-handle>
    <path d="M161 146 V64" stroke="#5a3f14" stroke-width="5" stroke-linecap="round"/>
    <rect x="151" y="36" width="20" height="46" rx="10" fill="#f0eae1" stroke="#5a3f14" stroke-width="1.5"/>
    <path d="M155 48 h12 M155 58 h12 M155 68 h12" stroke="#b28f4e" stroke-width="1"/>
  </g>
  <g clip-path="url(#pintClip)">
    <rect data-beer x="220" y="208" width="60" height="0" fill="#c8862a"/>
    <rect data-head x="220" y="208" width="60" height="0" fill="#f3ead6"/>
  </g>
  <path d="M226 116 h48 l-5 92 h-38 z" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M231 150 h38" stroke="currentColor" stroke-width="1" opacity=".35"/>
</svg>`,
  mount(root, gate) {
    const handle = q<SVGGElement>(root, '[data-handle]');
    const beer = q<SVGRectElement>(root, '[data-beer]');
    const head = q<SVGRectElement>(root, '[data-head]');
    const stream = q<SVGPathElement>(root, '[data-stream]');
    const lamp = q<SVGElement>(root, '[data-lamp]');
    const lampGlow = q<SVGElement>(root, '[data-lamp-glow]');
    if (handle) {
      handle.style.transformOrigin = '161px 146px';
      handle.style.transformBox = 'view-box';
    }
    if (lamp && lampGlow) {
      lamp.style.transformOrigin = '74px 47px';
      lamp.style.transformBox = 'view-box';
      wander(
        [1, 0.9],
        () => [rand(0.85, 1.2), rand(0.6, 1)],
        ([s = 1, o = 1]) => {
          lamp.style.transform = `scale(${(0.9 + (s - 0.9) * 0.6).toFixed(3)}, ${s.toFixed(3)})`;
          lampGlow.style.opacity = o.toFixed(3);
        },
        [140, 420],
        { stiffness: 60, damping: 9, mass: 1 },
        gate,
      );
    }
    // A beer engine is pulled TOWARDS the person serving — away from the spout
    // and the glass, which sit to the right. So the handle swings left.
    const PULL_ARC = -74;

    return (m) => {
      const pull = clamp01((m - 0.04) / 0.5);
      const fill = clamp01((m - 0.22) / 0.72);
      if (handle) handle.style.transform = `rotate(${(PULL_ARC * pull).toFixed(2)}deg)`;
      const h = 86 * fill;
      if (beer) {
        beer.setAttribute('y', (208 - h).toFixed(2));
        beer.setAttribute('height', h.toFixed(2));
      }
      if (head) {
        const hh = 11 * clamp01((fill - 0.7) / 0.3);
        head.setAttribute('y', (208 - h - hh).toFixed(2));
        head.setAttribute('height', hh.toFixed(2));
      }
      if (stream) stream.setAttribute('opacity', pull > 0.2 && fill < 0.97 ? '1' : '0');
    };
  },
};

/* ------------------------------------------------------------------ hearth */
const hearth: Mechanism = {
  svg: `<svg viewBox="0 0 320 240" aria-hidden="true">
  <defs>
    <radialGradient id="fireGlow"><stop offset="0" stop-color="#f0b464" stop-opacity=".7"/><stop offset="1" stop-color="#f0b464" stop-opacity="0"/></radialGradient>
    <mask id="gild"><rect data-gild x="56" y="22" width="0" height="56" fill="#fff"/></mask>
  </defs>
  <rect x="54" y="22" width="212" height="54" fill="none" stroke="currentColor" stroke-width="2"/>
  <rect x="60" y="28" width="200" height="42" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/>
  <text x="160" y="59" text-anchor="middle" font-family="Sancreek, 'IM Fell English', serif" font-size="21" letter-spacing="1.5" fill="#6a6f70">PRINCE OF WALES</text>
  <text x="160" y="59" text-anchor="middle" font-family="Sancreek, 'IM Fell English', serif" font-size="21" letter-spacing="1.5" fill="#ecca70" mask="url(#gild)">PRINCE OF WALES</text>
  <rect x="34" y="98" width="252" height="12" fill="currentColor"/>
  <rect x="48" y="110" width="22" height="104" fill="none" stroke="currentColor" stroke-width="2"/>
  <rect x="250" y="110" width="22" height="104" fill="none" stroke="currentColor" stroke-width="2"/>
  <rect x="70" y="110" width="180" height="104" fill="#0a0806"/>
  <circle data-fire-glow cx="160" cy="180" r="96" fill="url(#fireGlow)" opacity="0"/>
  <g data-flames>
    <path data-flame d="M132 196 C122 180 126 168 132 156 C138 168 142 180 132 196 Z" fill="#e07b1f"/>
    <path data-flame d="M160 196 C146 176 150 156 160 134 C170 156 174 176 160 196 Z" fill="#f0b464"/>
    <path data-flame d="M186 196 C176 182 180 170 186 158 C192 170 196 182 186 196 Z" fill="#e07b1f"/>
    <path data-flame d="M160 196 C154 186 156 176 160 168 C164 176 166 186 160 196 Z" fill="#fbe1a0"/>
  </g>
  <g fill="#7a2d12"><ellipse cx="134" cy="198" rx="16" ry="6"/><ellipse cx="162" cy="200" rx="18" ry="6"/><ellipse cx="188" cy="198" rx="14" ry="5"/></g>
  <path d="M100 204 H220 M104 194 H216" stroke="#343a3c" stroke-width="3"/>
  <path d="M34 214 H286" stroke="currentColor" stroke-width="2"/>
  <path d="M34 226 H286" stroke="currentColor" stroke-width="1" opacity=".4"/>
</svg>`,
  mount(root, gate) {
    const flames = Array.from(root.querySelectorAll<SVGPathElement>('[data-flame]'));
    const glow = q<SVGCircleElement>(root, '[data-fire-glow]');
    const gild = q<SVGRectElement>(root, '[data-gild]');
    let lit = 0;
    const flick = flames.map(() => 1);
    const paint = (): void => {
      flames.forEach((f, i) => {
        f.style.transform = `scale(${(0.9 + 0.1 * (flick[i] ?? 1)).toFixed(3)}, ${(lit * (flick[i] ?? 1)).toFixed(3)})`;
      });
      if (glow) glow.setAttribute('opacity', (0.75 * lit * ((flick[1] ?? 1) * 0.5 + 0.5)).toFixed(3));
    };
    flames.forEach((f) => {
      f.style.transformOrigin = '160px 196px';
      f.style.transformBox = 'view-box';
    });
    wander(
      flick,
      () => flames.map(() => rand(0.78, 1.18)),
      (v) => {
        v.forEach((x, i) => (flick[i] = x));
        paint();
      },
      [110, 320],
      { stiffness: 70, damping: 9, mass: 1 },
      gate,
    );
    return (m) => {
      lit = m;
      paint();
      if (gild) gild.setAttribute('width', (208 * clamp01((m - 0.3) / 0.6)).toFixed(2));
    };
  },
};

/* ------------------------------------------------------------------ lock */
function eightSvg(): string {
  const seats = [];
  for (let i = 0; i < 8; i++) {
    const y = -44 + i * 12;
    const side = i % 2 === 0 ? 1 : -1;
    seats.push(
      `<path d="M0 ${y} L${(34 * side).toFixed(0)} ${y - 6}" stroke="#0b1417" stroke-width="1.6"/><path d="M${(34 * side).toFixed(0)} ${y - 6} l${(7 * side).toFixed(0)} -2" stroke="#0b1417" stroke-width="3" stroke-linecap="round"/><circle cy="${y}" r="2.2" fill="#c8741a"/>`,
    );
  }
  return `<g data-eight><path d="M0 -66 C4 -50 4 50 0 62 C-4 50 -4 -50 0 -66 Z" fill="#0b1417"/>${seats.join('')}<circle cy="56" r="2.2" fill="#eb9d4c"/></g>`;
}

const lock: Mechanism = {
  svg: `<svg viewBox="0 0 320 240" aria-hidden="true">
  <rect x="0" y="0" width="92" height="240" fill="#b4b593"/>
  <rect x="228" y="0" width="92" height="240" fill="#b4b593"/>
  <g fill="#a2a67e"><circle cx="36" cy="44" r="18"/><circle cx="52" cy="60" r="14"/><circle cx="24" cy="66" r="12"/><circle cx="286" cy="200" r="16"/><circle cx="300" cy="184" r="12"/></g>
  <path d="M20 96 c6 -10 6 -22 0 -32 M32 100 c8 -12 8 -26 0 -40 M44 96 c6 -10 6 -22 0 -32" stroke="#787d55" stroke-width="1.2" fill="none"/>
  <rect x="92" y="0" width="136" height="240" fill="#7aa6b0"/>
  <g data-ripples stroke="#e0eaec" stroke-width="1" fill="none" opacity=".75">
    <path d="M104 26 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0"/><path d="M114 52 q10 -4 20 0 t20 0 t20 0 t20 0"/><path d="M104 214 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0"/><path d="M118 232 q10 -4 20 0 t20 0 t20 0 t20 0"/>
  </g>
  <rect x="92" y="70" width="18" height="122" fill="#8a9193"/>
  <rect x="210" y="70" width="18" height="122" fill="#8a9193"/>
  <path d="M92 70 H110 M92 192 H110 M210 70 H228 M210 192 H228" stroke="#5a5d50" stroke-width="1"/>
  <g stroke="#4a3520" stroke-width="7" stroke-linecap="round"><path d="M110 176 v40"/><path d="M210 176 v40"/></g>
  ${eightSvg()}
  <g data-gate-l><rect x="0" y="-4" width="54" height="8" fill="#4a3520" stroke="#0b1417" stroke-width="1"/><path d="M0 0 H-42" stroke="#4a3520" stroke-width="5" stroke-linecap="round"/></g>
  <g data-gate-r><rect x="0" y="-4" width="54" height="8" fill="#4a3520" stroke="#0b1417" stroke-width="1"/><path d="M0 0 H-42" stroke="#4a3520" stroke-width="5" stroke-linecap="round"/></g>
  <g fill="#8a9193"><rect x="86" y="92" width="12" height="4"/><rect x="222" y="92" width="12" height="4"/></g>
</svg>`,
  mount(root, gate) {
    const left = q<SVGGElement>(root, '[data-gate-l]');
    const right = q<SVGGElement>(root, '[data-gate-r]');
    const eight = q<SVGGElement>(root, '[data-eight]');
    const ripples = q<SVGGElement>(root, '[data-ripples]');
    const L0 = 15.6;
    const R0 = 164.4;
    if (left) {
      left.style.transformOrigin = '0 0';
      left.style.transform = `translate(110px, 98px) rotate(${L0}deg)`;
    }
    if (right) {
      right.style.transformOrigin = '0 0';
      right.style.transform = `translate(210px, 98px) rotate(${R0}deg)`;
    }
    if (eight) eight.style.transform = 'translate(160px, 300px)';
    if (ripples) {
      wander(
        [0],
        () => [rand(-10, 10)],
        ([x = 0]) => (ripples.style.transform = `translateX(${x.toFixed(2)}px)`),
        [1600, 3000],
        { stiffness: 4, damping: 4, mass: 1 },
        gate,
      );
    }
    return (m) => {
      const open = clamp01((m - 0.05) / 0.45);
      const go = clamp01((m - 0.3) / 0.7);
      if (left) left.style.transform = `translate(110px, 98px) rotate(${(L0 + 74 * open).toFixed(2)}deg)`;
      if (right) right.style.transform = `translate(210px, 98px) rotate(${(R0 - 74 * open).toFixed(2)}deg)`;
      if (eight) eight.style.transform = `translate(160px, ${lerp(300, -90, go).toFixed(2)}px)`;
    };
  },
};

export const mechanisms: Record<string, Mechanism> = { oven, pump, hearth, lock };
