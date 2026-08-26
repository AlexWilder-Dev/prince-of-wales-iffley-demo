/** Data-driven lists: the playbill, the walking routes, opening hours. */
import { events } from '../data/events';
import { walks } from '../data/walks';
import { hours } from '../data/hours';
import { showRoute } from './map';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderEvents(): void {
  const list = document.querySelector<HTMLElement>('[data-events]');
  if (!list) return;
  list.innerHTML = events
    .map(
      (e) => `<li class="playbill__item" data-reveal>
        <span class="playbill__when">${esc(e.when)}</span>
        <h3 class="playbill__name${e.big ? ' playbill__name--big' : ''}">${esc(e.title)}</h3>
        <p class="playbill__desc">${esc(e.desc)}</p>
        <span class="playbill__price">${esc(e.terms)}</span>
      </li>`,
    )
    .join('');
}

export function renderWalks(): void {
  const list = document.querySelector<HTMLElement>('[data-walks]');
  if (!list) return;
  const numerals = ['i', 'ii', 'iii'];
  list.innerHTML = walks
    .map(
      (w, i) => `<li data-reveal>
        <button class="route" type="button" data-route="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}" data-hover="subtle">
          <span class="route__num">${numerals[i] ?? i + 1}.</span>
          <span class="route__name">${esc(w.title)}</span>
          <span class="route__meta">${esc(w.meta.join(' · '))}</span>
          <span class="route__desc">${esc(w.desc)}</span>
        </button>
      </li>`,
    )
    .join('');
  const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-route]'));
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.route);
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      showRoute(i);
    }),
  );
}

export function renderHours(): void {
  const dl = document.querySelector<HTMLElement>('[data-hours]');
  if (!dl) return;
  const today = new Date().getDay();
  dl.innerHTML = hours
    .map(
      (h) => `<dt class="${h.days.includes(today) ? 'is-today' : ''}">${esc(h.label)}</dt>
      <dd>${esc(h.open)}<small>${esc(h.food)}</small></dd>`,
    )
    .join('');
}
