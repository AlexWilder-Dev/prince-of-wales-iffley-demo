/** Data-driven lists: What's On, walks, opening hours. */
import { events } from '../data/events';
import { walks } from '../data/walks';
import { hours } from '../data/hours';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderEvents(): void {
  const list = document.querySelector<HTMLElement>('[data-events]');
  if (!list) return;
  list.innerHTML = events
    .map((e) => {
      const date = e.weekly
        ? `<div class="event__date event__date--weekly" aria-hidden="true"><span class="event__day">${esc(e.weekly.label)}</span><span class="event__month">${esc(e.weekly.day)}</span></div>`
        : e.date
          ? `<div class="event__date" aria-hidden="true"><span class="event__day">${esc(e.date.day)}</span><span class="event__month">${esc(e.date.month)}</span></div>`
          : '';
      return `<li data-reveal>
        <article class="event" data-hover>
          ${date}
          <div class="event__body">
            <p class="event__kicker">${esc(e.kicker)}</p>
            <h3 class="event__title">${esc(e.title)}</h3>
            <p class="event__desc">${esc(e.desc)}</p>
            <p class="event__meta">${esc(e.meta)}</p>
          </div>
        </article>
      </li>`;
    })
    .join('');
}

export function renderWalks(): void {
  const list = document.querySelector<HTMLElement>('[data-walks]');
  if (!list) return;
  list.innerHTML = walks
    .map(
      (w) => `<li data-reveal>
        <article class="walk" data-hover>
          <div class="walk__meta">${w.meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
          <h4>${esc(w.title)}</h4>
          <p>${esc(w.desc)}</p>
        </article>
      </li>`,
    )
    .join('');
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
