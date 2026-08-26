/** Mock menu content — late-summer / early-autumn 2026. */

export interface Dish {
  name: string;
  desc?: string;
  price: string;
  tags?: string[];
}

export interface Course {
  title: string;
  note?: string;
  dishes: Dish[];
}

export const seasonal: Course[] = [
  {
    title: 'To start',
    note: 'or a few to share',
    dishes: [
      {
        name: 'Sourdough & cultured butter',
        desc: 'Baked each morning — a nod to what this building used to do. Maldon salt.',
        price: '£4.50',
        tags: ['v'],
      },
      {
        name: 'Heritage tomatoes, whipped goat’s curd',
        desc: 'Basil oil, toasted seeds, a little honey.',
        price: '£9',
        tags: ['v', 'gf'],
      },
      {
        name: 'Smoked mackerel pâté',
        desc: 'Pickled cucumber, dill, rye toast.',
        price: '£9.50',
      },
      {
        name: 'Crispy pig’s cheek',
        desc: 'Bramley apple, mustard cream, watercress.',
        price: '£10',
        tags: ['gf'],
      },
      {
        name: 'Roasted beetroot & Oxford Blue',
        desc: 'Candied walnuts, chicory, sherry vinegar.',
        price: '£8.50',
        tags: ['v', 'gf'],
      },
    ],
  },
  {
    title: 'Mains',
    dishes: [
      {
        name: 'Cotswold chicken, sweetcorn & girolles',
        desc: 'Tarragon jus, charred corn, crispy skin.',
        price: '£22',
        tags: ['gf'],
      },
      {
        name: 'Hereford beef & ale pie',
        desc: 'Proper suet pastry, buttered greens, mash, gravy.',
        price: '£19',
      },
      {
        name: 'Beer-battered haddock',
        desc: 'Triple-cooked chips, crushed peas, tartare, half a lemon.',
        price: '£18.50',
      },
      {
        name: 'Pan-roasted hake',
        desc: 'Brown shrimp butter, samphire, new potatoes.',
        price: '£24',
        tags: ['gf'],
      },
      {
        name: 'Squash, sage & brown butter gnocchi',
        desc: 'Toasted hazelnuts, aged Berkswell.',
        price: '£17',
        tags: ['v'],
      },
      {
        name: 'The Prince burger',
        desc: 'Dry-aged beef, Oxford Blue or smoked cheddar, bacon jam, chips.',
        price: '£17.50',
      },
    ],
  },
  {
    title: 'Puddings',
    note: 'and a bit of cheese',
    dishes: [
      {
        name: 'Blackberry & apple crumble',
        desc: 'Oat crumble, proper custard.',
        price: '£8',
        tags: ['v'],
      },
      {
        name: 'Sticky toffee pudding',
        desc: 'Clotted cream, butterscotch.',
        price: '£8',
        tags: ['v'],
      },
      {
        name: 'Brown bread ice cream',
        desc: 'Honeycomb, a shot of coffee if you like.',
        price: '£7.50',
        tags: ['v'],
      },
      {
        name: 'Oxford Blue & quince',
        desc: 'Oatcakes, celery, membrillo.',
        price: '£10',
        tags: ['v'],
      },
    ],
  },
];

export const roast = {
  eyebrow: 'Every Sunday · 12 till 5',
  title: 'The roast people cross the city for',
  intro:
    'Rare-breed meat from butchers we know by name, potatoes roasted in dripping, Yorkshires the size of your hand. Booking is a good idea.',
  roasts: [
    {
      name: 'Roast sirloin of Hereford beef',
      desc: 'Served pink, horseradish cream.',
      price: '£22',
    },
    {
      name: 'Roast leg of Cotswold lamb',
      desc: 'Mint sauce, rosemary jus.',
      price: '£23',
    },
    {
      name: 'Slow-roast pork belly',
      desc: 'Proper crackling, Bramley apple sauce.',
      price: '£20',
    },
    {
      name: 'Squash, chestnut & sage roast',
      desc: 'With a vegan gravy on request.',
      price: '£17',
      tags: ['v', 'vg*'],
    },
    {
      name: 'The Trencherman',
      desc: 'A little of the beef, the lamb and the pork. Not for the faint-hearted.',
      price: '£27',
    },
    {
      name: 'Little roast',
      desc: 'Any of the above for the under-tens.',
      price: '£10',
    },
  ] satisfies Dish[],
  trimmings:
    'Every roast comes with dripping potatoes (rapeseed for the veg roast), a Yorkshire pudding, honey-roast carrots and parsnips, seasonal greens, cauliflower cheese and a jug of proper gravy.',
  extras: [
    { name: 'Extra Yorkshire', price: '£1.50' },
    { name: 'Cauliflower cheese for the table', price: '£6' },
    { name: 'Pigs in blankets', price: '£5' },
  ] satisfies Dish[],
};

export const menuFootnote =
  'Please tell us about allergies before ordering — everything is cooked in one kitchen. v vegetarian · vg vegan · gf gluten-free · * on request. A discretionary 10% service charge is added to tables of six or more.';
