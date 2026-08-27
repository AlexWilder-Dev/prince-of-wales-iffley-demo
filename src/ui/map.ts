/**
 * A stylised map of Iffley — the Thames, the lock, Church Way, St Mary's,
 * the meadows and the pub — with three walking routes that draw themselves
 * on. Not to scale; a signpost, not a survey.
 */
import { reducedMotion } from '../motion/prefs';
import { Spring } from '../motion/spring';

const ROUTES = [
  // i. down to the lock
  'M 240 152 C 230 172, 214 206, 202 236 C 180 238, 150 232, 132 216 S 104 200, 96 196',
  // ii. the towpath loop: lock → north along the Thames Path → Donnington Bridge → Meadow Lane → home
  'M 240 152 C 230 172, 214 206, 202 236 C 180 238, 150 232, 132 216 S 104 200, 96 196 L 52 178 C 30 140, 42 90, 46 40 L 118 38 C 150 62, 205 100, 262 112 L 244 148',
  // iii. to Sandford and back: lock → south along the towpath
  'M 240 152 C 230 172, 214 206, 202 236 C 180 238, 150 232, 132 216 S 104 200, 96 196 L 60 194 C 66 236, 96 270, 130 310',
];

const SVG = `
<svg viewBox="0 0 360 300" role="img" aria-labelledby="map-title map-desc">
  <title id="map-title">Map of Iffley village and the river</title>
  <desc id="map-desc">The Prince of Wales sits on Church Way in the middle of Iffley. St Mary's church is just south; Mill Lane leads from the church down to Iffley Lock on the Thames. The Thames Path runs along the far bank north to Donnington Bridge and south towards Sandford. Iffley Road runs north to Oxford.</desc>
  <defs>
    <path id="river-path" d="M 62 -20 C 70 60, 30 120, 70 175 S 150 240, 165 330" />
    <path id="thames-path" d="M 40 -20 C 48 60, 8 120, 48 178 S 128 246, 143 330" />
    <path id="church-way" d="M 318 62 C 290 84, 262 112, 244 148 S 214 208, 202 236" />
    <path id="iffley-road" d="M 336 -10 C 332 80, 336 200, 340 310" />
    <path id="mill-lane" d="M 202 236 C 180 238, 150 232, 132 216 S 104 200, 96 196" />
    <path id="meadow-lane" d="M 262 112 C 205 100, 150 62, 118 38" />
  </defs>

  <rect width="360" height="300" fill="#e7e2d8" />
  <path d="M -10 40 C 40 70, 20 150, 60 200 S 120 280, 150 310 L -10 310 Z" fill="#d2d8c6" />
  <ellipse cx="86" cy="118" rx="34" ry="24" fill="#c6cfba" opacity="0.8" />
  <ellipse cx="60" cy="230" rx="30" ry="20" fill="#c6cfba" opacity="0.8" />
  <path d="M 190 250 C 220 270, 260 300, 300 300 L 360 300 L 360 200 Z" fill="#dcdfd2" opacity="0.7" />

  <use href="#river-path" fill="none" stroke="#8fb3bc" stroke-width="30" stroke-linecap="round" />
  <use href="#river-path" fill="none" stroke="#a9c9d0" stroke-width="22" stroke-linecap="round" />
  <use href="#river-path" fill="none" stroke="#c8dee2" stroke-width="2" stroke-dasharray="1 14" stroke-linecap="round" opacity="0.9" />
  <text class="map__label map__label--river" dy="-4"><textPath href="#river-path" startOffset="20%">River Thames</textPath></text>

  <use href="#thames-path" fill="none" stroke="#7f8c6e" stroke-width="1.6" stroke-dasharray="4 4" />
  <text class="map__label" dy="-4" font-size="8"><textPath href="#thames-path" startOffset="38%">Thames Path</textPath></text>

  <!-- Donnington Bridge -->
  <path d="M 22 38 H 120" stroke="#cbc3a8" stroke-width="8" stroke-linecap="round" />
  <path d="M 22 38 H 120" stroke="#8a8468" stroke-width="1" stroke-dasharray="2 3" />
  <text class="map__label" x="74" y="28" text-anchor="middle" font-size="8">Donnington Bridge</text>

  <!-- lock -->
  <g transform="translate(92 190) rotate(48)">
    <rect x="-18" y="-6" width="36" height="12" rx="1" fill="#e7e2d8" stroke="#44534f" stroke-width="1.6" />
    <path d="M -18 0 H 18 M -6 -6 V 6 M 6 -6 V 6" stroke="#44534f" stroke-width="1.4" />
  </g>
  <text class="map__label" x="112" y="176">Iffley Lock</text>
  <text class="map__label" x="112" y="286" font-size="8">to Sandford ↓</text>

  <use href="#iffley-road" fill="none" stroke="#cbc3a8" stroke-width="9" stroke-linecap="round" />
  <use href="#iffley-road" fill="none" stroke="#f4f0e4" stroke-width="1.2" stroke-dasharray="6 6" />
  <text class="map__label" dy="-7" font-size="8"><textPath href="#iffley-road" startOffset="50%">Iffley Road</textPath></text>

  <use href="#church-way" fill="none" stroke="#cdc4a6" stroke-width="8" stroke-linecap="round" />
  <text class="map__label" dy="-6"><textPath href="#church-way" startOffset="6%">Church Way</textPath></text>

  <use href="#meadow-lane" fill="none" stroke="#cdc4a6" stroke-width="5" stroke-linecap="round" />
  <text class="map__label" dy="-5" font-size="8"><textPath href="#meadow-lane" startOffset="34%">Meadow Lane</textPath></text>

  <use href="#mill-lane" fill="none" stroke="#cdc4a6" stroke-width="6" stroke-linecap="round" />
  <text class="map__label" dy="11" font-size="8"><textPath href="#mill-lane" startOffset="20%">Mill Lane</textPath></text>

  <text class="map__label" x="44" y="132" text-anchor="middle" font-size="8">Iffley</text>
  <text class="map__label" x="44" y="142" text-anchor="middle" font-size="8">Meadows</text>
  <text class="map__label" x="300" y="22" text-anchor="middle">To Oxford ↑</text>
  <text class="map__label" x="270" y="292" text-anchor="middle" font-size="8">Iffley village</text>

  <g transform="translate(206 246)">
    <rect x="-9" y="-6" width="18" height="12" fill="#f4f0e4" stroke="#44534f" stroke-width="1.5" />
    <path d="M -9 -6 L 0 -13 L 9 -6" fill="#f4f0e4" stroke="#44534f" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M 0 -13 V -21 M -3 -18 H 3" stroke="#44534f" stroke-width="1.5" stroke-linecap="round" />
  </g>
  <text class="map__label" x="222" y="252" font-size="8">St Mary's</text>

  ${ROUTES.map((d, i) => `<path class="map__route" data-route-path="${i}" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />`).join('')}

  <g data-pin>
    <circle data-pulse r="12" fill="#c8741a" opacity="0.35" />
    <path d="M 0 4 C -9 -6, -9 -14, 0 -18 C 9 -14, 9 -6, 0 4 Z" fill="#c8741a" stroke="#0b1417" stroke-width="1.5" stroke-linejoin="round" />
    <circle cy="-9" r="3.2" fill="#0b1417" />
  </g>
  <text class="map__label map__label--pub" x="252" y="142">The Prince</text>
  <text class="map__label map__label--pub" x="252" y="156">of Wales</text>
  <text class="map__label" x="252" y="168" font-size="7.5">73 Church Way</text>

  <g transform="translate(26 70)">
    <circle r="11" fill="none" stroke="#7f8c6e" stroke-width="1" />
    <path d="M 0 -9 L 3 2 L 0 0 L -3 2 Z" fill="#44534f" />
    <text class="map__label" y="-14" text-anchor="middle" font-size="7">N</text>
  </g>
</svg>`;

const routeSprings: Spring[] = [];
let current = -1;
let played = false;

const DRAW = { stiffness: 36, damping: 13, mass: 1, restDelta: 0.002, restSpeed: 0.002 };

export function showRoute(i: number): void {
  if (i === current) return;
  const prev = routeSprings[current];
  const next = routeSprings[i];
  current = i;
  if (prev) prev.set(1);
  if (next && played) next.set(0);
}

export function initMap(): void {
  const host = document.querySelector<HTMLElement>('[data-map]');
  if (!host) return;
  host.innerHTML = SVG;

  const paths = Array.from(host.querySelectorAll<SVGPathElement>('[data-route-path]'));
  paths.forEach((p) => {
    routeSprings.push(new Spring(1, DRAW, (v) => p.style.setProperty('stroke-dashoffset', String(Math.max(0, Math.min(1, v))))));
  });

  const pin = host.querySelector<SVGGElement>('[data-pin]');
  const pulse = host.querySelector<SVGCircleElement>('[data-pulse]');
  if (!pin) return;

  const drop = new Spring(0, { stiffness: 260, damping: 16, mass: 1 }, (v) => {
    pin.style.transform = `translate(240px, ${(152 - (1 - v) * 40).toFixed(2)}px)`;
    pin.style.opacity = String(Math.min(1, v * 1.5));
  });
  const ring = new Spring(0, { stiffness: 30, damping: 9, mass: 1, restDelta: 0.002, restSpeed: 0.002 }, (v) => {
    if (!pulse) return;
    pulse.setAttribute('r', (10 + v * 10).toFixed(2));
    pulse.style.opacity = (0.45 * (1 - v)).toFixed(3);
  });
  pin.style.transform = 'translate(240px, 112px)';
  pin.style.opacity = '0';

  current = 0;

  const play = (): void => {
    played = true;
    if (reducedMotion) {
      drop.snap(1);
      ring.snap(1);
      routeSprings[current]?.snap(0);
      return;
    }
    window.setTimeout(() => drop.set(1), 200);
    window.setTimeout(() => routeSprings[current]?.set(0), 500);
    let beats = 0;
    const beat = (): void => {
      if (beats++ > 2) return;
      ring.snap(0);
      ring.set(1);
      window.setTimeout(beat, 1800);
    };
    window.setTimeout(beat, 700);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(host);
  } else play();
}
