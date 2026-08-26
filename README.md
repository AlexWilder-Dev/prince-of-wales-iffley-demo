# The Prince of Wales, Iffley — concept site

A speculative, scroll-driven demo site for The Prince of Wales, 73 Church Way, Iffley, Oxford.
The scroll is the story: bakery → 1880s pub → restored by Sage & Mathew → today, by the lock.

**Live:** https://alexwilder-dev.github.io/prince-of-wales-iffley-demo/

> Concept work only — not the pub's official website. Nothing is booked or sent anywhere; all
> content is static mock data.

## Stack

- Vite + vanilla TypeScript, zero runtime dependencies (≈13 KB JS gzipped, ≈7 KB CSS).
- A small spring-physics engine (`src/motion/spring.ts`) drives *every* movement: entrances,
  parallax, hover/press, the scroll follower, the era crossfade, the booking sheet. No CSS easing.
- Free Unsplash photography, committed locally as responsive WebP (`npm run images` regenerates).
- `prefers-reduced-motion` collapses to a static, fully visible page.

## Motion model

`Spring` integrates `F = -k(x - target) - c·v` with semi-implicit Euler at 120 Hz sub-steps on one
shared `requestAnimationFrame` ticker that sleeps when everything is at rest. Presets are named by
feel (`gentle`, `heavy`, `snappy`, `hover`, `follow`, `drift`, `sheet`) with their damping ratios
documented inline.

- `scroll.ts` — critically-damped scroll follower; parallax and progress helpers read the smoothed value.
- `reveal.ts` — `[data-reveal]` entrances, with `data-delay` / `data-stagger`.
- `hover.ts` — `[data-hover]` lift/press springs (hover only on pointers that can hover).
- `ambient.ts` — overdamped random-walk drift for the hero's candlelight.
- `ui/story.ts` — chapter-indexed era crossfade, travelling light source, timeline thread.

## Scripts

```
npm run dev       # local dev server (served under /prince-of-wales-iffley-demo/)
npm run build     # type-check + production build to dist/
npm run preview   # preview the build
npm run images    # rebuild public/images from the Unsplash sources
```

Deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.
