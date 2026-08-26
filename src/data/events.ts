/** Mock What's On listings — autumn 2026. */

export interface PubEvent {
  kicker: string;
  title: string;
  desc: string;
  meta: string;
  /** Either a calendar date… */
  date?: { day: string; month: string };
  /** …or a recurring slot. */
  weekly?: { label: string; day: string };
}

export const events: PubEvent[] = [
  {
    kicker: 'Every week',
    title: 'Quiz night',
    desc: 'Teams of up to six, £2 a head, a bar tab for the winners and a wooden spoon for last. Eat first if you want to think straight.',
    meta: 'Tuesdays · 8pm · just turn up',
    weekly: { label: 'Every', day: 'Tue' },
  },
  {
    kicker: 'Live music',
    title: 'Folk in the Snug',
    desc: 'An unplugged evening with players from Oxford’s folk circuit: fiddles, squeezeboxes and the occasional shanty.',
    meta: 'Thursday 17 September · from 8pm · free',
    date: { day: '17', month: 'Sep' },
  },
  {
    kicker: 'Tasting supper',
    title: 'Harvest Supper',
    desc: 'Five courses from the autumn larder, each matched with a local ale or cider. One long table, one sitting.',
    meta: 'Saturday 3 October · 7pm · £55 a head',
    date: { day: '3', month: 'Oct' },
  },
  {
    kicker: 'In the garden',
    title: 'Bonfire Night by the fire pit',
    desc: 'Mulled cider, sausages in buns and the fire pit lit from five. Wrap up warm; sparklers for the small ones.',
    meta: 'Thursday 5 November · from 5pm',
    date: { day: '5', month: 'Nov' },
  },
];
