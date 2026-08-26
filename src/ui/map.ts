/**
 * A stylised, hand-drawn-feel map of Iffley: the Thames, the lock, Church
 * Way, St Mary's and the pub. Not to scale — it is a signpost, not a survey.
 * The walk-to-the-lock route draws itself on when the map scrolls into view.
 */
import { reducedMotion } from '../motion/prefs';
import { Spring } from '../motion/spring';

const SVG = `
<svg viewBox="0 0 360 300" role="img" aria-labelledby="map-title map-desc">
  <title id="map-title">Map of Iffley village</title>
  <desc id="map-desc">The Prince of Wales sits on Church Way in the middle of Iffley village. St Mary's church is just to the south; Mill Lane leads from the church down to Iffley Lock on the River Thames. Iffley Road runs north to Oxford.</desc>
  <defs>
    <path id="river-path" d="M 62 -20 C 70 60, 30 120, 70 175 S 150 240, 165 330" />
    <path id="thames-path" d="M 40 -20 C 48 60, 8 120, 48 178 S 128 246, 143 330" />
    <path id="church-way" d="M 318 62 C 290 84, 262 112, 244 148 S 214 208, 202 236" />
    <path id="iffley-road" d="M 336 -10 C 332 80, 336 200, 340 310" />
    <path id="mill-lane" d="M 202 236 C 180 238, 150 232, 132 216 S 104 200, 96 196" />
  </defs>

  <!-- ground -->
  <rect width="360" height="300" fill="#e6e0cb" />
  <path d="M -10 40 C 40 70, 20 150, 60 200 S 120 280, 150 310 L -10 310 Z" fill="#d3dcc2" />
  <ellipse cx="86" cy="118" rx="34" ry="24" fill="#c9d5b5" opacity="0.8" />
  <ellipse cx="60" cy="230" rx="30" ry="20" fill="#c9d5b5" opacity="0.8" />
  <path d="M 190 250 C 220 270, 260 300, 300 300 L 360 300 L 360 200 Z" fill="#dde0cd" opacity="0.7" />

  <!-- river -->
  <use href="#river-path" fill="none" stroke="#9fbec1" stroke-width="30" stroke-linecap="round" />
  <use href="#river-path" fill="none" stroke="#b7d1d2" stroke-width="22" stroke-linecap="round" />
  <use href="#river-path" fill="none" stroke="#cfe1e0" stroke-width="2" stroke-dasharray="1 14" stroke-linecap="round" opacity="0.9" />
  <text class="map__label map__label--river" dy="-4"><textPath href="#river-path" startOffset="18%">River Thames</textPath></text>

  <!-- Thames Path -->
  <use href="#thames-path" fill="none" stroke="#7f8c6e" stroke-width="1.6" stroke-dasharray="4 4" />
  <text class="map__label" dy="-4" font-size="8"><textPath href="#thames-path" startOffset="36%">Thames Path</textPath></text>

  <!-- lock -->
  <g transform="translate(92 190) rotate(48)">
    <rect x="-18" y="-6" width="36" height="12" rx="2" fill="#e6e0cb" stroke="#4a5a52" stroke-width="1.6" />
    <path d="M -18 0 H 18" stroke="#4a5a52" stroke-width="1.6" />
    <path d="M -6 -6 V 6 M 6 -6 V 6" stroke="#4a5a52" stroke-width="1.2" />
  </g>
  <text class="map__label" x="112" y="176">Iffley Lock</text>

  <!-- roads -->
  <use href="#iffley-road" fill="none" stroke="#c9c1a5" stroke-width="9" stroke-linecap="round" />
  <use href="#iffley-road" fill="none" stroke="#f3eed9" stroke-width="1.2" stroke-dasharray="6 6" />
  <text class="map__label" dy="-7" font-size="8"><textPath href="#iffley-road" startOffset="50%">Iffley Road</textPath></text>

  <use href="#church-way" fill="none" stroke="#cbc2a4" stroke-width="8" stroke-linecap="round" />
  <text class="map__label" dy="-6"><textPath href="#church-way" startOffset="6%">Church Way</textPath></text>

  <use href="#mill-lane" fill="none" stroke="#cbc2a4" stroke-width="6" stroke-linecap="round" />
  <text class="map__label" dy="11" font-size="8"><textPath href="#mill-lane" startOffset="20%">Mill Lane</textPath></text>

  <!-- meadow / village labels -->
  <text class="map__label" x="44" y="132" text-anchor="middle" font-size="8">Iffley</text>
  <text class="map__label" x="44" y="142" text-anchor="middle" font-size="8">Meadows</text>
  <text class="map__label" x="300" y="22" text-anchor="middle">To Oxford ↑</text>
  <text class="map__label" x="270" y="292" text-anchor="middle" font-size="8">Iffley village</text>

  <!-- St Mary's -->
  <g transform="translate(206 246)">
    <rect x="-9" y="-6" width="18" height="12" fill="#f3eed9" stroke="#4a5a52" stroke-width="1.5" />
    <path d="M -9 -6 L 0 -13 L 9 -6" fill="#f3eed9" stroke="#4a5a52" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M 0 -13 V -21 M -3 -18 H 3" stroke="#4a5a52" stroke-width="1.5" stroke-linecap="round" />
  </g>
  <text class="map__label" x="222" y="252" font-size="8">St Mary's</text>

  <!-- walking route: pub → church → lock -->
  <path class="map__route-draw" data-route d="M 240 152 C 230 172, 214 206, 202 236 C 180 238, 150 232, 132 216 S 104 200, 96 196"
        fill="none" stroke="#b28f4e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
        pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />

  <!-- the pub -->
  <g data-pin transform="translate(240 152)">
    <circle data-pulse r="12" fill="#d8963a" opacity="0.35" />
    <path d="M 0 4 C -9 -6, -9 -14, 0 -18 C 9 -14, 9 -6, 0 4 Z" fill="#d8963a" stroke="#0c1912" stroke-width="1.5" stroke-linejoin="round" />
    <circle cy="-9" r="3.2" fill="#0c1912" />
  </g>
  <text class="map__label map__label--pub" x="252" y="142">The Prince</text>
  <text class="map__label map__label--pub" x="252" y="156">of Wales</text>
  <text class="map__label" x="252" y="168" font-size="7.5">73 Church Way</text>

  <!-- compass -->
  <g transform="translate(26 30)">
    <circle r="11" fill="none" stroke="#7f8c6e" stroke-width="1" />
    <path d="M 0 -9 L 3 2 L 0 0 L -3 2 Z" fill="#4a5a52" />
    <text class="map__label" y="-14" text-anchor="middle" font-size="7">N</text>
  </g>
</svg>`;

export function initMap(): void {
  const host = document.querySelector<HTMLElement>('[data-map]');
  if (!host) return;
  host.innerHTML = SVG;

  const route = host.querySelector<SVGPathElement>('[data-route]');
  const pin = host.querySelector<SVGGElement>('[data-pin]');
  const pulse = host.querySelector<SVGCircleElement>('[data-pulse]');
  if (!route || !pin) return;

  const draw = new Spring(1, { stiffness: 40, damping: 14, mass: 1, restDelta: 0.002, restSpeed: 0.002 }, (v) => {
    route.style.strokeDashoffset = String(Math.max(0, v));
  });
  const drop = new Spring(0, { stiffness: 260, damping: 16, mass: 1 }, (v) => {
    pin.style.transform = `translate(240px, ${(152 - (1 - v) * 40).toFixed(2)}px)`;
    pin.style.opacity = String(Math.min(1, v * 1.5));
  });
  const ring = new Spring(0, { stiffness: 30, damping: 9, mass: 1, restDelta: 0.002, restSpeed: 0.002 }, (v) => {
    if (!pulse) return;
    pulse.setAttribute('r', (10 + v * 10).toFixed(2));
    pulse.style.opacity = (0.45 * (1 - v)).toFixed(3);
  });

  // The pin's inline transform attribute is replaced by a CSS transform so it can spring.
  pin.removeAttribute('transform');
  pin.style.transformBox = 'fill-box';
  pin.style.transformOrigin = '0 0';
  pin.style.transform = 'translate(240px, 112px)';
  pin.style.opacity = '0';

  const play = (): void => {
    if (reducedMotion) {
      draw.snap(0);
      drop.snap(1);
      ring.snap(1);
      return;
    }
    window.setTimeout(() => drop.set(1), 200);
    window.setTimeout(() => draw.set(0), 500);
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
  } else {
    play();
  }
}
