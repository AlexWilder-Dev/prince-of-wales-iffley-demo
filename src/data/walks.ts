/** Local walks from the door. Indicative routes for the concept site. */

export interface Walk {
  title: string;
  desc: string;
  meta: string[];
}

export const walks: Walk[] = [
  {
    title: 'Down to the lock',
    desc: 'Out of the door, down Church Way past St Mary’s, then Mill Lane to Iffley Lock. Watch a boat go through and come back for a pint.',
    meta: ['15 min', 'Flat', 'Pushchairs ok'],
  },
  {
    title: 'The towpath loop',
    desc: 'Cross at the lock and follow the Thames Path north past the college boathouses to Donnington Bridge; cross back and return through the meadows.',
    meta: ['45 min', '2.2 miles', 'Dogs love it'],
  },
  {
    title: 'To Sandford and back',
    desc: 'The towpath south — willows, meadows, the odd narrowboat — to the next lock down. Turn round whenever you like.',
    meta: ['1 hr 15', '3.5 miles', 'Boots after rain'],
  },
];
