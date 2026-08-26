/**
 * "Book a table" — a reservation slip: a bottom sheet on phones, a card on
 * desktop. Purely visual; nothing is sent. Invalid fields get a physical
 * shake; success slams a RECEIVED stamp onto the slip.
 */
import { initHover } from '../motion/hover';
import { Spring, SpringVector, presets, clamp, clamp01 } from '../motion/spring';

const TIME_GROUPS = [
  { label: 'Lunch', slots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'] },
  { label: 'Dinner', slots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'] },
];

const isDesktop = (): boolean => window.matchMedia('(min-width: 640px)').matches;

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function prettyTime(t: string): string {
  const [h = 0, m = 0] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}.${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initBooking(): void {
  const modal = document.getElementById('booking');
  if (!modal) return;
  const scrim = modal.querySelector<HTMLElement>('.modal__scrim');
  const sheet = modal.querySelector<HTMLElement>('.modal__sheet');
  const form = modal.querySelector<HTMLFormElement>('[data-booking-form]');
  const done = modal.querySelector<HTMLElement>('[data-booking-done]');
  if (!scrim || !sheet || !form || !done) return;

  const dateField = form.querySelector<HTMLElement>('[data-field="date"]');
  const timeField = form.querySelector<HTMLElement>('[data-field="time"]');
  const dateInput = form.querySelector<HTMLInputElement>('input[name="date"]');
  const times = form.querySelector<HTMLElement>('[data-times]');
  const partyOut = form.querySelector<HTMLOutputElement>('[data-party]');
  const summary = done.querySelector<HTMLElement>('[data-summary]');
  const stamp = done.querySelector<HTMLElement>('[data-stamp]');
  if (!dateField || !timeField || !dateInput || !times || !partyOut) return;

  const addError = (field: HTMLElement, text: string): void => {
    const el = document.createElement('span');
    el.className = 'field__error';
    el.textContent = text;
    el.setAttribute('role', 'alert');
    field.append(el);
  };
  addError(dateField, 'Pick a date to get started.');
  addError(timeField, 'Choose a time — lunch or dinner.');

  const shakers = new Map<HTMLElement, Spring>();
  const shake = (field: HTMLElement): void => {
    field.classList.add('is-invalid');
    let s = shakers.get(field);
    if (!s) {
      s = new Spring(0, { stiffness: 520, damping: 11, mass: 1, restDelta: 0.2, restSpeed: 0.2 }, (v) => {
        field.style.transform = `translate3d(${v.toFixed(2)}px, 0, 0)`;
      });
      s.onRest(() => (field.style.transform = ''));
      shakers.set(field, s);
    }
    s.set(0, 420);
  };
  const clearError = (field: HTMLElement): void => field.classList.remove('is-invalid');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  dateInput.min = isoLocal(today);
  dateInput.value = isoLocal(tomorrow);
  dateInput.addEventListener('input', () => clearError(dateField));

  let time: string | null = null;
  times.innerHTML = TIME_GROUPS.map(
    (g) =>
      `<span class="chips__group">${g.label}</span>` +
      g.slots.map((s) => `<button class="chip" type="button" aria-pressed="false" data-time="${s}" data-hover="button">${s}</button>`).join(''),
  ).join('');
  times.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-time]');
    if (!btn) return;
    time = btn.dataset.time ?? null;
    times.querySelectorAll<HTMLButtonElement>('[data-time]').forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
    clearError(timeField);
  });

  let party = 2;
  const stepBtns = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-step]'));
  const pop = new Spring(1, presets.snappy, (v) => {
    partyOut.style.transform = `scale(${v.toFixed(3)})`;
  });
  const syncStepper = (): void => {
    partyOut.value = String(party);
    stepBtns.forEach((b) => {
      const dir = Number(b.dataset.step);
      b.disabled = (dir < 0 && party <= 1) || (dir > 0 && party >= 8);
    });
  };
  stepBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const next = clamp(party + Number(b.dataset.step), 1, 8);
      if (next === party) return;
      party = next;
      syncStepper();
      pop.snap(1.22);
      pop.set(1);
    }),
  );
  syncStepper();

  let open = false;
  let opener: HTMLElement | null = null;

  const scrimSpring = new Spring(0, presets.gentle, (v) => {
    scrim.style.opacity = clamp01(v).toFixed(3);
  });
  const sheetSpring = new Spring(0, presets.sheet, (v) => {
    if (isDesktop()) {
      sheet.style.transform = `translate3d(0, ${((1 - v) * 28).toFixed(2)}px, 0) scale(${(0.96 + 0.04 * v).toFixed(4)})`;
      sheet.style.opacity = clamp01(v).toFixed(3);
    } else {
      sheet.style.transform = `translate3d(0, ${((1 - v) * 100).toFixed(2)}%, 0)`;
      sheet.style.opacity = '1';
    }
  });
  sheetSpring.onRest(() => {
    if (!open && sheetSpring.value === 0) {
      modal.hidden = true;
      resetForm();
    }
  });

  const stampSpring = new SpringVector([1.8, 0], { stiffness: 520, damping: 22, mass: 1 }, ([s = 1, o = 0]) => {
    if (!stamp) return;
    stamp.style.transform = `rotate(-12deg) scale(${s.toFixed(3)})`;
    stamp.style.opacity = clamp01(o).toFixed(3);
  });

  const showForm = (): void => {
    form.hidden = false;
    done.hidden = true;
    form.style.opacity = '';
    form.style.transform = '';
  };

  const resetForm = (): void => {
    time = null;
    party = 2;
    syncStepper();
    times.querySelectorAll<HTMLButtonElement>('[data-time]').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    clearError(dateField);
    clearError(timeField);
    dateInput.value = isoLocal(tomorrow);
    stampSpring.snap([1.8, 0]);
    showForm();
  };

  const openModal = (trigger: HTMLElement): void => {
    if (open) return;
    open = true;
    opener = trigger;
    modal.hidden = false;
    document.body.classList.add('is-locked');
    showForm();
    scrimSpring.set(1);
    sheetSpring.set(1);
    window.setTimeout(() => sheet.focus({ preventScroll: true }), 30);
  };

  const closeModal = (): void => {
    if (!open) return;
    open = false;
    document.body.classList.remove('is-locked');
    scrimSpring.set(0);
    sheetSpring.set(0);
    opener?.focus({ preventScroll: true });
  };

  document.querySelectorAll<HTMLElement>('[data-book]').forEach((b) => b.addEventListener('click', () => openModal(b)));
  modal.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => b.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[hidden]'));
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    if (!dateInput.value || dateInput.value < dateInput.min) {
      shake(dateField);
      ok = false;
    }
    if (!time) {
      shake(timeField);
      ok = false;
    }
    if (!ok) return;

    if (summary) {
      summary.textContent = `${prettyDate(dateInput.value)} · ${prettyTime(time ?? '')} · ${party} ${party === 1 ? 'guest' : 'guests'}`;
    }

    const out = new Spring(1, presets.snappy, (v) => {
      form.style.opacity = clamp01(v).toFixed(3);
      form.style.transform = `translate3d(0, ${((1 - v) * -10).toFixed(2)}px, 0)`;
    });
    out.onRest(() => {
      form.hidden = true;
      done.hidden = false;
      const enter = new Spring(0, presets.gentle, (v) => {
        done.style.opacity = clamp01(v).toFixed(3);
        done.style.transform = `translate3d(0, ${((1 - v) * 16).toFixed(2)}px, 0)`;
      });
      enter.onRest(() => {
        done.style.opacity = '';
        done.style.transform = '';
      });
      enter.set(1);
      window.setTimeout(() => stampSpring.set([1, 1]), 260);
      window.setTimeout(() => done.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true }), 120);
    });
    out.set(0);
  });

  initHover(modal);
}
