// Moonmeadow Ranch — art core: pixel helpers, the farmer, unicorns and Wren the shopkeeper.
// Every sprite in the game is painted at load time from the data in these art-*.js files.
'use strict';

const ART = { cache: new Map() };

ART.canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

// Adds a 1px outline around every opaque pixel (drawn into transparent neighbours).
ART.outline = (c, col) => {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const d = g.getImageData(0, 0, w, h).data;
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  g.fillStyle = col;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) g.fillRect(x, y, 1, 1);
  }
  return c;
};

// Paints a sprite from rows of palette characters. '.' is transparent.
ART.rows = (rows, pal, outline) => {
  const pad = outline ? 1 : 0, w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = ART.canvas(w + pad * 2, h + pad * 2), g = c.getContext('2d');
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const col = pal[r[x]];
      if (col) { g.fillStyle = col; g.fillRect(x + pad, y + pad, 1, 1); }
    }
  });
  if (outline) ART.outline(c, outline);
  return c;
};

ART.flip = (src) => {
  const c = ART.canvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
};

ART.rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// Procedural painter with pixel-snapped primitives.
ART.paint = (w, h, fn, outline, seed = 7) => {
  const c = ART.canvas(w, h), g = c.getContext('2d');
  const P = {
    g, w, h, rnd: ART.rng(seed),
    px(x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
    rect(x, y, rw, rh, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh)); },
    ellipse(cx, cy, rx, ry, col) {
      g.fillStyle = col;
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
        if ((x * x) / (rx * rx + 0.4) + (y * y) / (ry * ry + 0.4) <= 1) g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
      }
    },
    circ(cx, cy, r, col) { P.ellipse(cx, cy, r, r, col); },
    line(x0, y0, x1, y1, col) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      g.fillStyle = col;
      for (;;) {
        g.fillRect(x0, y0, 1, 1);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    },
    sprite(img, x, y) { g.drawImage(img, Math.round(x), Math.round(y)); },
  };
  fn(P);
  if (outline) ART.outline(c, outline);
  return c;
};

ART.memo = (key, fn) => {
  let v = ART.cache.get(key);
  if (!v) { v = fn(); ART.cache.set(key, v); }
  return v;
};

// Data URL for DOM icons, upscaled so the browser never blurs it.
ART.url = (img, scale = 4) => {
  const c = ART.canvas(img.width * scale, img.height * scale), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL();
};

/* ------------------------------------------------------------------ */
/* The farmer                                                          */
/* ------------------------------------------------------------------ */

const FARMER_PAL = {
  h: '#f4d77e', H: '#d2a24c', r: '#b56ee6', a: '#8a4f2e', s: '#ffdcbf', S: '#e8b08c',
  e: '#2b1d33', p: '#ff9fb2', t: '#ff9cc0', v: '#5d7fe0', V: '#3f5cb0', b: '#7a4a2c',
};
const FARMER_OUT = '#2b1d33';

const FARMER_BODY = {
  down: [
    '....hhhhhh....',
    '...hhhhhhhh...',
    '...rrrrrrrr...',
    '.HHHHHHHHHHHH.',
    '..aaaaaaaaaa..',
    '..assssssssa..',
    '..asessssesa..',
    '..aspsssspsa..',
    '...ssssssss...',
    '..tttttttttt..',
    '.ttvvttttvvtt.',
    '.ttvvvvvvvvtt.',
    '.ssvvvvvvvvss.',
    '..vvvvVVvvvv..',
    '..vvvvvvvvvv..',
  ],
  up: [
    '....hhhhhh....',
    '...hhhhhhhh...',
    '...rrrrrrrr...',
    '.HHHHHHHHHHHH.',
    '..aaaaaaaaaa..',
    '..aaaaaaaaaa..',
    '..aaaaaaaaaa..',
    '..aaaaaaaaaa..',
    '....ssssss....',
    '..tttttttttt..',
    '.ttvvttttvvtt.',
    '.ttvvvvvvvvtt.',
    '.ssvvvvvvvvss.',
    '..vvvvvvvvvv..',
    '..vvvvvvvvvv..',
  ],
  right: [
    '....hhhhhh....',
    '...hhhhhhhh...',
    '...rrrrrrrr...',
    '..HHHHHHHHHHHH',
    '...aaaasssss..',
    '...aaasssess..',
    '...aaasssssps.',
    '...aasssssss..',
    '....ssssss....',
    '....tttttt....',
    '....vvttvv....',
    '....vvttvv....',
    '....vvssvv....',
    '....vvvvvv....',
    '....vvvvvv....',
  ],
};

const FARMER_LEGS = {
  down: [
    ['..vvvv..vvvv..', '...vvv..vvv...', '...bbb..bbb...', '..bbbb..bbbb..'],
    ['..vvvv..vvvv..', '...vvv..vvv...', '..bbbb..bbb...', '........bbbb..'],
    ['..vvvv..vvvv..', '...vvv..vvv...', '...bbb..bbbb..', '..bbbb........'],
  ],
  right: [
    ['.....vvvv.....', '.....vvvv.....', '.....bbbb.....', '.....bbbbbb...'],
    ['....vvv.vvv...', '...vvv...vvv..', '...bbb...bbb..', '..bbb.....bbb.'],
    ['.....vvvv.....', '....vvvvv.....', '....bbbbb.....', '....bbbbbb....'],
  ],
};

ART.farmer = (dir, frame) => ART.memo(`farmer:${dir}:${frame}`, () => {
  if (dir === 'left') return ART.flip(ART.farmer('right', frame));
  const body = FARMER_BODY[dir];
  const legs = (dir === 'right' ? FARMER_LEGS.right : FARMER_LEGS.down)[frame];
  return ART.rows(body.concat(legs), FARMER_PAL, FARMER_OUT);
});

/* ------------------------------------------------------------------ */
/* Unicorns                                                            */
/* ------------------------------------------------------------------ */

// Coat genetics. o = outline, e = eye, p = muzzle blush, k = hooves, h/H = horn.
const COATS = {
  pearl:     { name: 'Pearl',      w: '#fbf7ff', s: '#d9cdef', k: '#9a86b8', o: '#4a3763', e: '#2d1f45', p: '#ffb0cb', h: '#ffe27a', H: '#e0a845' },
  lavender:  { name: 'Lavender',   w: '#e4d6ff', s: '#bba5ec', k: '#7d63b0', o: '#3f2c63', e: '#2d1f45', p: '#ff9fc8', h: '#ffe27a', H: '#e0a845' },
  rose:      { name: 'Rosequartz', w: '#ffd6e6', s: '#f2a7c6', k: '#b0688e', o: '#5a2f48', e: '#3a1f2e', p: '#ff7fa8', h: '#ffe9a3', H: '#e9b45a' },
  mint:      { name: 'Mint',       w: '#d6f6e6', s: '#a5dcc4', k: '#5f9c86', o: '#2e4f47', e: '#1f3a33', p: '#ffa7b8', h: '#ffe27a', H: '#e0a845' },
  sunbeam:   { name: 'Sunbeam',    w: '#fff0c2', s: '#f0cf87', k: '#b38b4a', o: '#5a4320', e: '#3a2a12', p: '#ff9f8a', h: '#fff6c8', H: '#e9b54a' },
  cocoa:     { name: 'Cocoa',      w: '#cfa58a', s: '#a77f65', k: '#5e4232', o: '#3a2619', e: '#1f140c', p: '#ffb3a3', h: '#ffe27a', H: '#d99a3c' },
  midnight:  { name: 'Midnight',   w: '#434a8c', s: '#2f3368', k: '#191c40', o: '#121330', e: '#fff6ff', p: '#a497ff', h: '#eef2ff', H: '#a8b4dc', stars: true },
  celestial: { name: 'Celestial',  w: '#2a2050', s: '#1a1336', k: '#0d0920', o: '#07040f', e: '#ffd9ff', p: '#ff7ad9', h: '#fff3b8', H: '#ffc95c', stars: true, rare: true },
};

const MANES = {
  cotton:  { name: 'Cotton Candy', c: ['#ff9ad5', '#b79cff', '#9fe7ff'] },
  rainbow: { name: 'Rainbow',      c: ['#ff7fb0', '#ffd36b', '#7fe0ff'] },
  sunset:  { name: 'Sunset',       c: ['#ff6f7d', '#ffa55c', '#ffe066'] },
  ocean:   { name: 'Tidepool',     c: ['#5ec8ff', '#5b7cff', '#b8f3ff'] },
  berry:   { name: 'Berry',        c: ['#d6457a', '#9b4dd6', '#ff9ad5'] },
  aurora:  { name: 'Aurora',       c: ['#5cf2b5', '#5ab8ff', '#c48cff'] },
  frost:   { name: 'Frost',        c: ['#ffffff', '#cfe3ff', '#9fb8ec'] },
  galaxy:  { name: 'Galaxy',       c: ['#ff5fd2', '#7a5cff', '#4de0ff'], rare: true },
};

const UNICORN_ROWS = [
  '....................h.',
  '...................hH.',
  '...............ww.hH..',
  '.............1wwwwww..',
  '............12wwwwwww.',
  '............12wwwewwww',
  '...........123wwwwwwww',
  '...........123swwwwwwp',
  '..........1233swwwwss.',
  '..........123wwwws....',
  '.12.wwwwwww23wwwws....',
  '123wwwwwwwwwwwwwws....',
  '123wwwwwwwwwwwwwws....',
  '.23swwwwwwwwwwwwws....',
  '.3..ssssssssssssss....',
];
const UNICORN_LEGS = [
  ['.3..ww.ww....ww.ww....', '....ws.ws....ws.ws....', '....kk.kk....kk.kk....'],
  ['.3..ww.ww....ww.ww....', '...ws...ws..ws...ws...', '...kk...kk..kk...kk...'],
];
const UNICORN_SLEEP_LEGS = ['...kss.......ssk......'];

const FOAL_ROWS = [
  '............h..',
  '.........w.hH..',
  '........1wwwww.',
  '.......12wwewww',
  '.......12wwwwwp',
  '......123swwss.',
  '.1....12www....',
  '12.wwwwwwwws...',
  '12wwwwwwwwws...',
  '.2ssssssssss...',
];
const FOAL_LEGS = [
  ['...ws....ws....', '...ws....ws....', '...kk....kk....'],
  ['..ws......ws...', '..ws......ws...', '..kk......kk...'],
];
const FOAL_SLEEP_LEGS = ['..ks.....sk....'];

// kind: 'adult' | 'foal'; pose: 0 stand, 1 walk, 2 sleep; facing: 'r' | 'l'
ART.unicorn = (coatId, maneId, kind, pose, facing) => ART.memo(`uni:${coatId}:${maneId}:${kind}:${pose}:${facing}`, () => {
  if (facing === 'l') return ART.flip(ART.unicorn(coatId, maneId, kind, pose, 'r'));
  const coat = COATS[coatId] || COATS.pearl, mane = (MANES[maneId] || MANES.cotton).c;
  const pal = { w: coat.w, s: coat.s, k: coat.k, e: coat.e, p: coat.p, h: coat.h, H: coat.H, 1: mane[0], 2: mane[1], 3: mane[2] };
  const adult = kind !== 'foal';
  let rows = (adult ? UNICORN_ROWS : FOAL_ROWS).slice();
  if (pose === 2) {
    rows = rows.map(r => r.replace('e', 's')).concat(adult ? UNICORN_SLEEP_LEGS : FOAL_SLEEP_LEGS);
  } else {
    rows = rows.concat((adult ? UNICORN_LEGS : FOAL_LEGS)[pose]);
  }
  const img = ART.rows(rows, pal, coat.o);
  if (coat.stars) {
    const g = img.getContext('2d');
    const spots = adult ? [[7, 12], [11, 13], [15, 12], [6, 14], [17, 7], [9, 13]] : [[5, 9], [8, 10], [10, 9]];
    spots.forEach(([x, y], i) => { g.fillStyle = i % 2 ? '#fff4b8' : '#ffffff'; g.fillRect(x, y, 1, 1); });
  }
  if (pose === 2) {
    // Lying down: drop the body so the folded legs sit on the ground line.
    const c = ART.canvas(img.width, img.height + (adult ? 2 : 2));
    c.getContext('2d').drawImage(img, 0, c.height - img.height);
    return c;
  }
  return img;
});

/* ------------------------------------------------------------------ */
/* Wren, who runs the market stall                                     */
/* ------------------------------------------------------------------ */

const WREN_PAL = {
  a: '#ff8fbf', A: '#e06a9c', s: '#ffd9c2', e: '#2b1d33', p: '#ff9fb2',
  t: '#fff3d6', g: '#6fbf8f', G: '#4f9a70', k: '#5b4a7a', b: '#6b3f2a',
};
const WREN_ROWS = [
  '.....aaaa.....',
  '....aAAAAa....',
  '...aaaaaaaa...',
  '..aaaaaaaaaa..',
  '..aAaaaaaaAa..',
  '..assssssssa..',
  '..asessssesa..',
  '..aspsssspsa..',
  '..aassssssaa..',
  '..tttttttttt..',
  '.ttggggggggtt.',
  '.ttggggggggtt.',
  '.ssggggggggss.',
  '..gggGGggggg..',
  '..gggggggggg..',
  '..kkkk..kkkk..',
  '...kkk..kkk...',
  '...bbb..bbb...',
  '..bbbb..bbbb..',
];
ART.wren = (blink) => ART.memo(`wren:${blink ? 1 : 0}`, () => {
  const rows = WREN_ROWS.slice();
  if (blink) rows[6] = '..assssssssa..';
  return ART.rows(rows, WREN_PAL, '#2b1d33');
});
