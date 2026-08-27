# The Prince of Wales, Iffley — concept site

A speculative, scroll-driven demo site for The Prince of Wales, 73 Church Way, Iffley, Oxford.
The scroll is the story: the village bakery → the 1880s pub → restored by Sage & Mathew → today,
by the lock.

**Live:** https://alexwilder-dev.github.io/prince-of-wales-iffley-demo/

> Concept work only — not the pub's official website. Nothing is booked or sent anywhere; all
> content is static mock data.

## Design

Built from the pub's own vernacular rather than a restaurant template:

- **The sign.** The hero is a hanging pub sign — the Prince of Wales feathers, *Ich Dien*, Tuscan
  lettering — on a pendulum spring. A breeze nudges it, scrolling shoves it, a tap sets it swinging.
- **Four mechanisms.** Each chapter is a hand-drawn SVG object driven by scroll through a spring:
  the oven door lifts to show loaves glowing; a handpump pulls and a pint of bitter fills; the
  hearth catches and the name board is re-gilded; Iffley's mitre gates swing open and a rowing
  eight slides through (the college bumps races start at Iffley Lock).
- **Paint and paper.** Bottle-green painted boards with gold coach lines for the pub's voice;
  cream paper for reading. Square corners throughout.
- **Type.** IM Fell English (Oxford's 17th-century Fell types) for headings, Libre Caslon for
  reading, Sancreek (Victorian English wood type) for signwriting only.
- **Playbill, card, slip.** What's On is set as a Victorian playbill; menus as a printed card that
  opens with bread; the booking sheet is a reservation slip that gets a spring-slammed
  *Received* stamp.
- **Five photographs, no more.** The pub's own: the frontage under its chestnut, the four Wadworth
  handpumps, gravy going over the beef, the upstairs room, and the lit sign on Church Way at night.
  The building gets a light grade towards the house colours; food and drink are shown as they are.

## Stack

- Vite + vanilla TypeScript, zero runtime dependencies (≈17 KB JS gzipped, ≈7 KB CSS).
- A small spring-physics engine (`src/motion/spring.ts`) drives *every* movement: entrances,
  parallax, hover/press, the scroll follower, the era crossfade, the mechanisms, the sign.
- Photography is the pub's own, taken from princeofwalesiffley.co.uk and committed here (not
  hotlinked) in `assets/source`; `npm run images` rebuilds the responsive WebP variants.
- `prefers-reduced-motion` collapses to a static, fully visible page with every mechanism in its
  finished state.

## Motion model

`Spring` integrates `F = -k(x - target) - c·v` with semi-implicit Euler at 120 Hz sub-steps on one
shared `requestAnimationFrame` ticker that sleeps when everything is at rest. Presets are named by
feel (`gentle`, `heavy`, `snappy`, `hover`, `follow`, `drift`, `sheet`).

- `scroll.ts` — critically-damped scroll follower; parallax and progress helpers read the smoothed value.
- `reveal.ts` — `[data-reveal]` entrances with `data-delay` / `data-stagger`.
- `hover.ts` — `[data-hover]` lift/press springs (hover only on pointers that can hover).
- `ambient.ts` — overdamped random-walk drift for the window light.
- `ui/sign.ts` — the pendulum (ζ≈0.1, so it swings a while and always settles).
- `ui/mech.ts` — the four mechanisms; `ui/story.ts` drives them from chapter progress.

## Scripts

```
npm run dev       # local dev server (served under /prince-of-wales-iffley-demo/)
npm run build     # type-check + production build to dist/
npm run preview   # preview the build
npm run images    # rebuild public/images from the masters in assets/source
```

Deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.
