/**
 * Menus: renders the seasonal and Sunday roast panels onto the printed card
 * and runs the tabs (sprung underline, panel crossfade, roving tabindex).
 */
import { seasonal, roast, menuFootnote, type Dish, type Course } from '../data/menus';
import { initHover } from '../motion/hover';
import { revealNow } from '../motion/reveal';
import { measure } from '../motion/scroll';
import { Spring, SpringVector, presets, clamp01 } from '../motion/spring';

const BASE = import.meta.env.BASE_URL;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function dish(d: Dish): string {
  return `<li data-reveal>
    <div class="dish" data-hover="subtle">
      <div class="dish__row">
        <span class="dish__name">${esc(d.name)}</span>
        <span class="dish__dots" aria-hidden="true"></span>
        <span class="dish__price">${esc(d.price)}</span>
      </div>
      ${d.desc ? `<p class="dish__desc">${esc(d.desc)}</p>` : ''}
      ${d.tags?.length ? `<span class="dish__tags">${esc(d.tags.join(' · '))}</span>` : ''}
    </div>
  </li>`;
}

function course(c: Course): string {
  return `<section class="course">
    <div class="course__head" data-reveal>
      <h3 class="course__title">${esc(c.title)}</h3>
      ${c.note ? `<span class="course__note">${esc(c.note)}</span>` : ''}
    </div>
    <ul class="dishes" data-stagger="40">${c.dishes.map(dish).join('')}</ul>
  </section>`;
}

function seasonalPanel(): string {
  return `${seasonal.map(course).join('')}<p class="menu-panel__foot" data-reveal>${esc(menuFootnote)}</p>`;
}

function roastPanel(): string {
  return `<div class="roast-hero" data-reveal="weight">
      <div class="band band--true">
        <img src="${BASE}images/roast-800.webp" srcset="${BASE}images/roast-480.webp 480w, ${BASE}images/roast-800.webp 800w, ${BASE}images/roast-1200.webp 1200w" sizes="(min-width: 760px) 40vw, 92vw" alt="Gravy poured over rare roast beef with a Yorkshire pudding and roast potatoes" loading="lazy" decoding="async" />
      </div>
      <div class="roast-hero__text">
        <p class="sc">${esc(roast.eyebrow)}</p>
        <h3>${esc(roast.title)}</h3>
        <p>${esc(roast.intro)}</p>
      </div>
    </div>
    <section class="course">
      <div class="course__head" data-reveal><h3 class="course__title">The roasts</h3><span class="course__note">all with the trimmings</span></div>
      <ul class="dishes" data-stagger="40">${roast.roasts.map(dish).join('')}</ul>
    </section>
    <div class="trimmings" data-reveal><h4>With every roast</h4><p>${esc(roast.trimmings)}</p></div>
    <section class="course">
      <div class="course__head" data-reveal><h3 class="course__title">A bit extra</h3></div>
      <ul class="dishes" data-stagger="40">${roast.extras.map(dish).join('')}</ul>
    </section>
    <p class="menu-panel__foot" data-reveal>${esc(menuFootnote)}</p>`;
}

export function initMenus(): void {
  const panelS = document.querySelector<HTMLElement>('[data-panel="seasonal"]');
  const panelR = document.querySelector<HTMLElement>('[data-panel="roast"]');
  const tabsWrap = document.querySelector<HTMLElement>('.card__tabs');
  if (!panelS || !panelR || !tabsWrap) return;

  panelS.innerHTML = seasonalPanel();
  panelR.innerHTML = roastPanel();

  const panels: Record<string, HTMLElement> = { seasonal: panelS, roast: panelR };
  const tabs = Array.from(tabsWrap.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const underline = tabsWrap.querySelector<HTMLElement>('.card__underline');
  let current = 'seasonal';
  let busy = false;

  const ul = new SpringVector([0, 0], presets.snappy, ([x = 0, w = 0]) => {
    if (!underline) return;
    underline.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    underline.style.width = `${w.toFixed(1)}px`;
  });
  const place = (snap = false): void => {
    const tab = tabs.find((t) => t.dataset.tab === current);
    if (!tab) return;
    const target = [tab.offsetLeft, tab.offsetWidth];
    snap ? ul.snap(target) : ul.set(target);
  };
  place(true);
  window.addEventListener('resize', () => place(true), { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(() => place(true));

  const select = (key: string, focusTab = false): void => {
    const to = panels[key];
    const from = panels[current];
    if (!to || !from || key === current || busy) return;
    busy = true;
    current = key;
    tabs.forEach((t) => {
      const on = t.dataset.tab === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    place();

    const out = new Spring(1, presets.snappy, (v) => {
      from.style.opacity = clamp01(v).toFixed(3);
      from.style.transform = `translate3d(0, ${((1 - v) * -8).toFixed(2)}px, 0)`;
    });
    out.onRest(() => {
      from.hidden = true;
      from.style.opacity = '';
      from.style.transform = '';
      to.hidden = false;
      measure();
      const enter = new Spring(0, presets.gentle, (v) => {
        to.style.opacity = clamp01(v).toFixed(3);
        to.style.transform = `translate3d(0, ${((1 - v) * 16).toFixed(2)}px, 0)`;
      });
      enter.onRest(() => {
        to.style.opacity = '';
        to.style.transform = '';
        busy = false;
      });
      enter.set(1);
      revealNow(to);
      initHover(to);
    });
    out.set(0);
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.tab ?? ''));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      if (next) select(next.dataset.tab ?? '', true);
    });
  });
}
