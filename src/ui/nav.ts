/**
 * Navigation: solid-on-scroll bar, brand shrink, active-section indicator,
 * spring-driven anchor scrolling and the full-screen mobile menu.
 */
import { Spring, SpringVector, presets, clamp01 } from '../motion/spring';
import { onScroll, scrollToElement, track, viewport } from '../motion/scroll';

export function initNav(): void {
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  if (!nav || !menu) return;

  const bg = nav.querySelector<HTMLElement>('.nav__bg');
  const brand = nav.querySelector<HTMLElement>('.nav__brand');
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('[data-nav]'));
  const indicator = nav.querySelector<HTMLElement>('.nav__indicator');
  const burger = nav.querySelector<HTMLButtonElement>('.nav__burger');
  const lines = burger ? Array.from(burger.querySelectorAll<HTMLElement>('.nav__burger-line')) : [];
  const scrim = menu.querySelector<HTMLElement>('.menu__scrim');
  const menuLinks = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]'));
  const menuFoot = menu.querySelector<HTMLElement>('.menu__foot');

  /* ---- solid background + brand shrink ---- */
  let solid = false;
  let menuOpen = false;

  const bgSpring = new Spring(0, presets.gentle, (v) => {
    if (bg) bg.style.opacity = clamp01(v).toFixed(3);
  });
  const brandSpring = new Spring(1, presets.snappy, (v) => {
    if (brand) brand.style.transform = `scale(${v.toFixed(4)})`;
  });

  const syncBar = (): void => {
    bgSpring.set(solid || menuOpen ? 1 : 0);
    brandSpring.set(solid ? 0.9 : 1);
  };

  /* ---- active section indicator ---- */
  const sections = links
    .map((a) => {
      const id = a.getAttribute('href')?.slice(1) ?? '';
      const el = id ? document.getElementById(id) : null;
      return el ? { a, t: track(el) } : null;
    })
    .filter((x): x is { a: HTMLAnchorElement; t: ReturnType<typeof track> } => x !== null);

  const ind = new SpringVector([0, 0], presets.gentle, ([x = 0, w = 0]) => {
    if (!indicator) return;
    indicator.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    indicator.style.width = `${w.toFixed(1)}px`;
  });
  let active = -1;
  const setActive = (i: number): void => {
    if (i === active) return;
    active = i;
    sections.forEach((s, j) => s.a.classList.toggle('is-active', j === i));
    if (!indicator) return;
    const hit = sections[i];
    if (!hit) {
      indicator.style.opacity = '0';
      return;
    }
    const first = indicator.style.opacity !== '1';
    indicator.style.opacity = '1';
    if (first) ind.snap([hit.a.offsetLeft, hit.a.offsetWidth]);
    else ind.set([hit.a.offsetLeft, hit.a.offsetWidth]);
  };

  onScroll((_, raw) => {
    const shouldBeSolid = raw > 24;
    if (shouldBeSolid !== solid) {
      solid = shouldBeSolid;
      syncBar();
    }
    const probe = raw + viewport.h * 0.38;
    let idx = -1;
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (s && s.t.top <= probe) idx = i;
    }
    setActive(idx);
  });

  /* ---- mobile menu ---- */
  const scrimSpring = new Spring(0, presets.gentle, (v) => {
    if (scrim) scrim.style.opacity = clamp01(v).toFixed(3);
  });
  scrimSpring.onRest(() => {
    if (!menuOpen && scrimSpring.value === 0) menu.hidden = true;
  });

  const linkSprings = menuLinks.map(
    (a) =>
      new Spring(0, presets.gentle, (v) => {
        a.style.opacity = clamp01(v).toFixed(3);
        a.style.transform = `translate3d(0, ${((1 - v) * 28).toFixed(2)}px, 0)`;
      }),
  );
  const footSpring = new Spring(0, presets.gentle, (v) => {
    if (!menuFoot) return;
    menuFoot.style.opacity = clamp01(v).toFixed(3);
    menuFoot.style.transform = `translate3d(0, ${((1 - v) * 20).toFixed(2)}px, 0)`;
  });
  const burgerSpring = new Spring(0, presets.snappy, (v) => {
    const [l0, l1] = lines;
    if (l0) l0.style.transform = `translate3d(0, ${(3.5 * v).toFixed(2)}px, 0) rotate(${(45 * v).toFixed(2)}deg)`;
    if (l1) l1.style.transform = `translate3d(0, ${(-3.5 * v).toFixed(2)}px, 0) rotate(${(-45 * v).toFixed(2)}deg)`;
  });

  let timers: number[] = [];
  const clearTimers = (): void => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };

  const openMenu = (): void => {
    if (menuOpen) return;
    menuOpen = true;
    clearTimers();
    menu.hidden = false;
    document.body.classList.add('is-locked');
    burger?.setAttribute('aria-expanded', 'true');
    burger?.setAttribute('aria-label', 'Close menu');
    scrimSpring.set(1);
    burgerSpring.set(1);
    syncBar();
    linkSprings.forEach((s, i) => timers.push(window.setTimeout(() => s.set(1), 70 + i * 55)));
    timers.push(window.setTimeout(() => footSpring.set(1), 70 + linkSprings.length * 55));
    timers.push(window.setTimeout(() => menuLinks[0]?.focus({ preventScroll: true }), 120));
  };

  const closeMenu = (restoreFocus = true): void => {
    if (!menuOpen) return;
    menuOpen = false;
    clearTimers();
    document.body.classList.remove('is-locked');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Open menu');
    scrimSpring.set(0);
    burgerSpring.set(0);
    syncBar();
    linkSprings.forEach((s) => s.set(0));
    footSpring.set(0);
    if (restoreFocus) burger?.focus({ preventScroll: true });
  };

  burger?.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  scrim?.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (menuOpen && window.innerWidth >= 1000) closeMenu(false);
    const hit = sections[active];
    if (hit && indicator) ind.snap([hit.a.offsetLeft, hit.a.offsetWidth]);
  });

  /* ---- spring-driven anchor scrolling ---- */
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not(.skip)').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) closeMenu(false);
      const offset = id === 'top' ? 0 : nav.offsetHeight - 1;
      scrollToElement(target, offset);
      history.replaceState(null, '', `#${id}`);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}
