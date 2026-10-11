// Moonmeadow Ranch — game data: items, crops, shop stock and unicorn names.
'use strict';

const TILE = 16;
const DAYS_PER_SEASON = 14;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SEASON_NAMES = ['Spring', 'Summer', 'Fall', 'Winter'];
const SHOW_DAY = 14; // the Sparkle Show, held on the last day of spring, summer and fall
const SHOP_OPEN = 9 * 60, SHOP_CLOSE = 17 * 60;
const DAY_START = 6 * 60, DAY_END = 26 * 60; // 6:00 AM until 2:00 AM
const HEART = 100; // affection points per heart, 10 hearts max

const CROPS = {
  carrot:     { name: 'Prism Carrot', seasons: [0, 2],    days: 4, regrow: 0, seed: 20, item: 'carrot' },
  moonberry:  { name: 'Moonberry',    seasons: [0, 1],    days: 6, regrow: 3, seed: 45, item: 'moonberry' },
  clover:     { name: 'Rainbow Clover', seasons: [0, 1, 2], days: 4, regrow: 3, seed: 15, item: null },
  starfruit:  { name: 'Starfruit',    seasons: [1],       days: 8, regrow: 0, seed: 70, item: 'starfruit' },
  sunpetal:   { name: 'Sunpetal',     seasons: [1],       days: 5, regrow: 0, seed: 30, item: 'sunpetal' },
  glowpkin:   { name: 'Glowpkin',     seasons: [2],       days: 9, regrow: 0, seed: 80, item: 'glowpkin' },
  dreamwheat: { name: 'Dreamwheat',   seasons: [2],       days: 5, regrow: 0, seed: 25, item: 'dreamwheat' },
};

// kind: tool | seed | crop | product | treat | misc
const ITEMS = {
  hoe:     { name: 'Hoe', kind: 'tool', desc: 'Tills field earth and breaks stones.' },
  can:     { name: 'Watering Can', kind: 'tool', desc: 'Waters tilled soil. Refill at the pond.' },
  bigcan:  { name: 'Silver Watering Can', kind: 'tool', desc: 'Holds more water and soaks three tiles at once.' },
  sickle:  { name: 'Sickle', kind: 'tool', desc: 'Cuts weeds, clears withered plants and mows ripe clover into hay.' },
  brush:   { name: 'Mane Brush', kind: 'tool', desc: 'Brush a unicorn once a day. A full mane gives a Rainbow Strand.' },
  pail:    { name: 'Moon Pail', kind: 'tool', desc: 'Collects Moonmilk from a fed adult unicorn each morning.' },

  carrot:     { name: 'Prism Carrot', kind: 'treat', sell: 45, energy: 8, affection: 40, desc: 'A unicorn favourite. Feed one as a treat or ship it.' },
  moonberry:  { name: 'Moonberry', kind: 'crop', sell: 32, energy: 6, desc: 'Cool, pale berries that glimmer at dusk.' },
  starfruit:  { name: 'Starfruit', kind: 'crop', sell: 160, energy: 15, desc: 'Five-pointed and faintly warm.' },
  sunpetal:   { name: 'Sunpetal', kind: 'crop', sell: 75, desc: 'A summer bloom that follows the sun.' },
  glowpkin:   { name: 'Glowpkin', kind: 'crop', sell: 210, energy: 20, desc: 'A purple pumpkin with a soft inner glow.' },
  dreamwheat: { name: 'Dreamwheat', kind: 'crop', sell: 58, desc: 'Lavender grain. Smells like sleep.' },

  milk_s: { name: 'Moonmilk', kind: 'product', sell: 60, energy: 15, desc: 'Fresh from a content unicorn.' },
  milk_m: { name: 'Moonmilk (M)', kind: 'product', sell: 95, energy: 20, desc: 'From a unicorn with 4+ hearts.' },
  milk_l: { name: 'Moonmilk (L)', kind: 'product', sell: 140, energy: 25, desc: 'From a unicorn with 7+ hearts.' },
  milk_g: { name: 'Golden Moonmilk', kind: 'product', sell: 220, energy: 40, desc: 'Only a unicorn with 10 hearts gives this.' },
  mane:   { name: 'Rainbow Strand', kind: 'product', sell: 260, desc: 'Brushed from a full-grown mane. Weavers pay well.' },
  stardust: { name: 'Stardust', kind: 'misc', sell: 12, desc: 'What unicorns leave in the pasture. Sprinkle on soil to speed growth.' },

  sugar:  { name: 'Sugar Cube', kind: 'treat', sell: 10, energy: 5, affection: 30, desc: 'A sweet treat for a unicorn.' },
  charm:  { name: 'Wishing Charm', kind: 'misc', sell: 200, desc: 'Give to an adult unicorn with 4+ hearts to wish for a foal.' },
  ribbon: { name: 'Show Ribbon', kind: 'misc', sell: 0, desc: 'Proof of a Sparkle Show win.' },
};
for (const id of Object.keys(CROPS)) {
  ITEMS['seed_' + id] = { name: CROPS[id].name + ' Seeds', kind: 'seed', crop: id, price: CROPS[id].seed,
    desc: `Plant on tilled soil in ${CROPS[id].seasons.map(s => SEASON_NAMES[s]).join(' or ')}. Ripens in ${CROPS[id].days} days${CROPS[id].regrow ? `, then every ${CROPS[id].regrow}` : ''}.` };
}
const TOOL_ICONS = { hoe: 'hoe', can: 'can', bigcan: 'bigcan', sickle: 'sickle', brush: 'brush', pail: 'pail' };
const itemIcon = (id) => ART.icon(TOOL_ICONS[id] || id);

const SUPPLIES = [
  { id: 'hay1', name: 'Hay bale', desc: 'Delivered to the silo.', price: 25, icon: 'hay', hay: 1 },
  { id: 'hay10', name: 'Hay, 10 bales', desc: 'Delivered to the silo.', price: 220, icon: 'hay', hay: 10 },
  { id: 'sugar', name: 'Sugar Cube', desc: ITEMS.sugar.desc, price: 40, icon: 'sugar', item: 'sugar' },
  { id: 'charm', name: 'Wishing Charm', desc: ITEMS.charm.desc, price: 800, icon: 'charm', item: 'charm' },
];

const UPGRADES = [
  { id: 'bigcan', name: 'Silver Watering Can', desc: 'Holds 40 water and soaks three tiles per pour.', price: 2000, icon: 'bigcan' },
  { id: 'stable', name: 'Stable Extension', desc: 'Room and trough space for 8 unicorns instead of 4.', price: 4500, icon: 'hay' },
  { id: 'goldbrush', name: 'Golden Brush', desc: 'Brushing gives extra affection and manes regrow a day sooner.', price: 1500, icon: 'brush' },
];

const UNICORN_NAMES = ['Biscuit', 'Nebula', 'Marshmallow', 'Pip', 'Clementine', 'Juniper', 'Sprinkles', 'Moonpie', 'Tansy',
  'Bramble', 'Opal', 'Waffle', 'Comet', 'Lupin', 'Pudding', 'Fennel', 'Quill', 'Daisy', 'Nimbus', 'Sorrel', 'Truffle', 'Wisp',
  'Peony', 'Gumdrop', 'Halcyon', 'Mochi', 'Thimble', 'Saffron', 'Puddle', 'Starling'];

const COMMON_COATS = Object.keys(COATS).filter(k => !COATS[k].rare);
const COMMON_MANES = Object.keys(MANES).filter(k => !MANES[k].rare);

const WREN_LINES = [
  'Brush them every day and their manes come in thick as cloud.',
  'Clover cut with the sickle goes straight into your silo as hay.',
  'Unicorns hate an empty trough. Fill it before bed!',
  'Sprinkle Stardust on soil and things grow faster. Don\'t ask me why.',
  'A unicorn with ten hearts gives Golden Moonmilk. I\'ve only seen it once.',
  'The day after rain, look up. Rainbows make unicorns very generous.',
  'Wishing Charms only work on unicorns who trust you. Four hearts, at least.',
  'Ship anything in the bin by the house. I collect it overnight.',
];
