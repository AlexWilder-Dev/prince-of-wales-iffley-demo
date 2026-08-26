/** Mock What's On listings — autumn 2026, set as a playbill. */

export interface PubEvent {
  when: string;
  title: string;
  desc: string;
  terms: string;
  /** set the title in the Tuscan signwriting face */
  big?: boolean;
}

export const events: PubEvent[] = [
  {
    when: 'Every Tuesday · eight o’clock',
    title: 'Quiz Night',
    desc: 'Teams of up to six. A bar tab for the winners, a wooden spoon for last. Eat first if you want to think straight.',
    terms: '£2 a head · just turn up',
  },
  {
    when: 'Thursday 17 September · from eight',
    title: 'Folk in the Snug',
    desc: 'An unplugged evening with players from Oxford’s folk circuit: fiddles, squeezeboxes and the occasional shanty.',
    terms: 'Free · no ticket',
  },
  {
    when: 'Saturday 3 October · seven o’clock',
    title: 'Harvest Supper',
    desc: 'Five courses from the autumn larder, each matched with a local ale or cider. One long table, one sitting.',
    terms: '£55 a head · book ahead',
    big: true,
  },
  {
    when: 'Thursday 5 November · from five',
    title: 'Bonfire Night by the fire pit',
    desc: 'Mulled cider, sausages in buns and the garden fire lit at dusk. Wrap up warm; sparklers for the small ones.',
    terms: 'Free · in the garden',
  },
];
