/** Opening hours (mock). `days` are JS getDay() values, 0 = Sunday. */

export interface HoursRow {
  label: string;
  days: number[];
  open: string;
  food: string;
}

export const hours: HoursRow[] = [
  { label: 'Monday – Thursday', days: [1, 2, 3, 4], open: '12 – 11pm', food: 'Kitchen 12–3, 6–9' },
  { label: 'Friday', days: [5], open: '12 – midnight', food: 'Kitchen 12–3, 6–9.30' },
  { label: 'Saturday', days: [6], open: '12 – midnight', food: 'Kitchen 12–9.30' },
  { label: 'Sunday', days: [0], open: '12 – 10.30pm', food: 'Roasts 12–5, bar snacks after' },
];

export const contact = {
  phone: '01865 586 379',
  phoneHref: 'tel:+441865586379',
  email: 'reservations@princeofwalesiffley.co.uk',
  address: ['73 Church Way, Iffley', 'Oxford OX4 4EF'],
  instagram: 'https://instagram.com/princeatiffley',
  facebook: 'https://facebook.com/theprinceatiffley',
};
