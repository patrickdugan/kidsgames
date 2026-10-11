// Moonmeadow Ranch — crops, item icons, particles and HUD icons.
'use strict';

const LEAF = { carrot: '#5fae4a', moonberry: '#3f8a5a', clover: '#5fc06f', starfruit: '#5aa84f', sunpetal: '#5fae4a', glowpkin: '#4f9a4a', dreamwheat: '#9fb35a' };
const PLANT_OUT = '#26331f';

function star5(P, x, y, c, d) {
  [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [1, 3], [3, 3]].forEach(([dx, dy]) => P.px(x + dx, y + dy, c));
  P.px(x + 2, y + 2, d); P.px(x + 3, y + 1, d);
}

// Filled five-point star: R outer radius, r inner radius.
function starPoly(P, cx, cy, R, r, col) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) P.px(x, y, col);
  }
}

const CROP_ART = {
  carrot(P) {
    P.line(8, 10, 4, 2, '#5fae4a'); P.line(8, 10, 8, 1, '#5fae4a'); P.line(8, 10, 12, 3, '#5fae4a');
    P.px(4, 2, '#86cf63'); P.px(8, 1, '#86cf63'); P.px(12, 3, '#86cf63'); P.px(6, 5, '#86cf63'); P.px(10, 5, '#86cf63');
    P.ellipse(8, 12, 3, 2, '#ff9b3d'); P.rect(5, 13, 7, 1, '#ff6fae'); P.px(7, 11, '#ffc27a'); P.px(6, 12, '#ffc27a');
  },
  moonberry(P) {
    P.ellipse(8, 9, 6, 5, '#3f8a5a'); P.ellipse(7, 8, 4, 3, '#5aaa72');
    [[5, 7], [10, 6], [8, 11], [11, 10], [4, 11], [7, 4]].forEach(([x, y]) => {
      P.rect(x, y, 2, 2, '#8fcfff'); P.px(x, y, '#e6f8ff');
    });
  },
  clover(P) {
    const cols = ['#ff9ad5', '#7fe0a8', '#b79cff', '#ffe066'];
    [[4, 9], [11, 8], [7, 4], [8, 12]].forEach(([x, y], i) => {
      P.line(x, y + 1, x, y + 3, '#4f9a4a');
      const c = cols[i];
      P.rect(x - 2, y - 1, 2, 2, c); P.rect(x + 1, y - 1, 2, 2, c); P.rect(x - 1, y - 3, 2, 2, c);
      P.px(x, y, '#4f9a4a');
    });
    P.px(13, 4, '#ff8fbf'); P.px(13, 3, '#ffd1ec'); P.px(2, 5, '#ff8fbf');
  },
  starfruit(P) {
    P.line(8, 15, 8, 3, '#4f9a4a'); P.line(8, 11, 4, 9, '#5aa84f'); P.line(8, 9, 12, 7, '#5aa84f');
    P.px(3, 9, '#86cf63'); P.px(13, 7, '#86cf63');
    star5(P, 2, 3, '#ffe066', '#f0b030'); star5(P, 9, 1, '#ffe066', '#f0b030'); star5(P, 9, 9, '#ffe066', '#f0b030');
  },
  sunpetal(P) {
    P.line(8, 15, 8, 8, '#4f9a4a'); P.ellipse(5, 11, 2, 1, '#5fae4a'); P.ellipse(11, 12, 2, 1, '#5fae4a');
    P.circ(8, 5, 5, '#ff9ad5'); P.circ(8, 5, 3, '#ffc0e3');
    P.circ(8, 5, 2, '#ffcf4a'); P.px(7, 5, '#a0632e'); P.px(9, 4, '#a0632e'); P.px(8, 6, '#a0632e');
  },
  glowpkin(P) {
    P.line(2, 7, 7, 6, '#4f9a4a'); P.line(9, 6, 14, 8, '#4f9a4a'); P.ellipse(3, 6, 2, 1, '#5fae4a');
    P.ellipse(8, 11, 6, 4, '#a56be8');
    P.line(5, 8, 5, 14, '#8a4fd0'); P.line(8, 7, 8, 15, '#8a4fd0'); P.line(11, 8, 11, 14, '#8a4fd0');
    P.ellipse(6, 9, 1, 1, '#d2a8ff');
    P.rect(7, 5, 2, 3, '#6b8a3a');
    P.px(3, 13, '#ffe066'); P.px(13, 10, '#ffe066'); P.px(10, 12, '#fff3a8');
  },
  dreamwheat(P) {
    [3, 6, 9, 12].forEach((x, i) => {
      const top = 2 + (i % 2) * 2;
      P.line(x, 15, x + (i % 2 ? 1 : -1), top + 3, '#c9a8ff');
      P.rect(x - 1 + (i % 2 ? 1 : -1), top, 2, 4, '#f2d27a'); P.px(x + (i % 2 ? 1 : -1), top, '#fff3b0');
    });
  },
};

// stage: 0 seeds, 1 sprout, 2 growing, 3 ripe, 4 withered
ART.crop = (id, stage) => ART.memo(`crop:${id}:${stage}`, () => {
  const leaf = LEAF[id] || '#5fae4a';
  if (stage === 0) return ART.paint(16, 16, P => {
    [[5, 7], [10, 6], [7, 11], [11, 11], [4, 12]].forEach(([x, y]) => { P.px(x, y, '#4a2c1e'); P.px(x + 1, y, '#e8d3a8'); });
  });
  if (stage === 1) return ART.paint(16, 16, P => {
    P.line(8, 13, 8, 9, leaf); P.ellipse(6, 8, 2, 1, leaf); P.ellipse(10, 8, 2, 1, leaf); P.px(6, 8, '#a5e083');
  }, PLANT_OUT);
  if (stage === 2) return ART.paint(16, 16, P => {
    P.line(8, 14, 8, 5, leaf);
    P.ellipse(5, 10, 3, 1, leaf); P.ellipse(11, 9, 3, 1, leaf); P.ellipse(6, 6, 2, 1, leaf); P.ellipse(10, 5, 2, 1, leaf);
    P.px(4, 10, '#a5e083'); P.px(12, 9, '#a5e083');
  }, PLANT_OUT);
  if (stage === 4) return ART.paint(16, 16, P => {
    P.line(8, 14, 8, 8, '#8a6a4a'); P.line(8, 9, 4, 12, '#9c7b55'); P.line(8, 8, 12, 11, '#9c7b55'); P.line(8, 8, 6, 5, '#8a6a4a');
  }, '#3d2a22');
  return ART.paint(16, 16, P => CROP_ART[id](P), PLANT_OUT);
});

/* ------------------------------------------------------------------ */
/* Item icons                                                          */
/* ------------------------------------------------------------------ */

const ICON_OUT = '#2b1d33';
const ICONS = {
  hoe(P) {
    P.line(3, 14, 11, 4, '#a8714d'); P.line(4, 14, 12, 4, '#8a5a3c');
    P.rect(9, 1, 6, 3, '#b9b4cf'); P.rect(13, 1, 2, 5, '#9590b0'); P.px(10, 1, '#e6e2f2');
  },
  can(P) {
    P.rect(3, 6, 9, 8, '#7fb4ef'); P.rect(3, 6, 9, 2, '#a9d0ff'); P.rect(3, 12, 9, 2, '#5f92d0');
    P.line(12, 9, 15, 5, '#7fb4ef'); P.px(15, 4, '#a9d0ff');
    P.line(2, 7, 1, 10, '#5f92d0'); P.line(4, 5, 10, 5, '#5f92d0'); P.px(4, 4, '#5f92d0'); P.px(10, 4, '#5f92d0');
    P.px(6, 9, '#ff9ad5'); P.px(7, 10, '#ff9ad5'); P.px(8, 9, '#ff9ad5');
  },
  bigcan(P) {
    P.rect(3, 6, 9, 8, '#dfe6f5'); P.rect(3, 6, 9, 2, '#ffffff'); P.rect(3, 12, 9, 2, '#b6c0d8');
    P.line(12, 9, 15, 5, '#dfe6f5'); P.px(15, 4, '#ffffff');
    P.line(2, 7, 1, 10, '#b6c0d8'); P.line(4, 5, 10, 5, '#ffd36b'); P.px(4, 4, '#ffd36b'); P.px(10, 4, '#ffd36b');
    star5(P, 5, 8, '#ffd36b', '#e0a845');
  },
  sickle(P) {
    P.line(3, 14, 6, 10, '#a8714d'); P.line(4, 14, 7, 10, '#8a5a3c');
    P.line(7, 10, 11, 9, '#cfcbe0'); P.line(11, 9, 13, 6, '#cfcbe0'); P.line(13, 6, 12, 3, '#cfcbe0'); P.line(12, 3, 9, 2, '#cfcbe0');
    P.line(7, 9, 11, 8, '#9590b0'); P.line(11, 8, 12, 6, '#9590b0'); P.px(9, 2, '#ffffff');
  },
  brush(P) {
    P.ellipse(8, 7, 6, 4, '#c58f5f'); P.ellipse(7, 6, 4, 2, '#dda874');
    P.rect(3, 10, 11, 3, '#fff1d6'); for (let x = 3; x < 14; x += 2) P.px(x, 13, '#e8d3a8');
    P.px(7, 6, '#ff8fbf'); P.px(9, 6, '#ff8fbf'); P.px(8, 7, '#ff8fbf'); P.px(8, 6, '#ff8fbf');
  },
  pail(P) {
    P.line(3, 6, 8, 1, '#8c84a3'); P.line(8, 1, 13, 6, '#8c84a3');
    P.rect(3, 6, 11, 2, '#e3d9f4'); P.rect(4, 8, 9, 6, '#c8d4e8'); P.rect(4, 8, 2, 6, '#e6edf7'); P.rect(11, 8, 2, 6, '#a6b2cc');
    P.rect(4, 6, 9, 1, '#f3e9ff');
  },
  seeds(P) {
    P.ellipse(8, 10, 5, 5, '#e8d3a8'); P.ellipse(7, 9, 3, 3, '#f5e6c4');
    P.rect(6, 3, 5, 2, '#e8d3a8'); P.rect(6, 5, 5, 1, '#b08d57');
  },
  carrot(P) {
    P.line(11, 3, 13, 1, '#5fae4a'); P.line(11, 3, 14, 4, '#5fae4a'); P.line(11, 3, 10, 0, '#86cf63');
    P.line(4, 13, 11, 4, '#ff9b3d'); P.line(5, 13, 12, 5, '#ff9b3d'); P.line(5, 12, 11, 5, '#ff9b3d'); P.line(6, 13, 12, 6, '#e57a26');
    P.px(7, 9, '#ff6fae'); P.px(8, 8, '#ff6fae'); P.px(9, 8, '#ff6fae'); P.px(8, 9, '#ff6fae');
  },
  moonberry(P) {
    P.ellipse(9, 3, 3, 1, '#5aaa72'); P.line(8, 4, 8, 6, '#3f8a5a');
    [[5, 8], [10, 8], [7, 12], [12, 12], [3, 12]].forEach(([x, y]) => {
      P.rect(x - 1, y - 1, 3, 3, '#8fcfff'); P.px(x - 2, y, '#8fcfff'); P.px(x + 2, y, '#6fb3ef'); P.px(x, y - 2, '#8fcfff'); P.px(x, y + 2, '#6fb3ef');
      P.px(x - 1, y - 1, '#e6f8ff');
    });
  },
  starfruit(P) {
    starPoly(P, 8, 8.5, 7.5, 3.4, '#ffe066');
    starPoly(P, 7.5, 8, 4.5, 2, '#fff1a8');
    P.px(8, 9, '#f0b030'); P.px(9, 10, '#f0b030'); P.px(11, 12, '#f0b030'); P.px(5, 12, '#f0b030');
  },
  sunpetal(P) {
    P.circ(8, 8, 6, '#ff9ad5'); P.circ(8, 8, 4, '#ffc0e3'); P.circ(8, 8, 3, '#ffcf4a');
    P.px(7, 7, '#a0632e'); P.px(9, 8, '#a0632e'); P.px(8, 10, '#a0632e'); P.px(6, 9, '#a0632e');
  },
  glowpkin(P) {
    P.ellipse(8, 9, 6, 5, '#a56be8');
    P.line(5, 5, 5, 13, '#8a4fd0'); P.line(8, 4, 8, 14, '#8a4fd0'); P.line(11, 5, 11, 13, '#8a4fd0');
    P.ellipse(6, 7, 1, 1, '#d2a8ff'); P.rect(7, 2, 2, 3, '#6b8a3a'); P.px(9, 1, '#86cf63');
    P.px(13, 4, '#ffe066'); P.px(2, 12, '#ffe066');
  },
  dreamwheat(P) {
    P.line(5, 15, 7, 8, '#b48cf0'); P.line(8, 15, 8, 8, '#c9a8ff'); P.line(11, 15, 9, 8, '#b48cf0');
    [[4, 4], [8, 3], [12, 4]].forEach(([x, y]) => {
      P.ellipse(x, y + 1, 1.6, 3.4, '#f2d27a'); P.px(x - 1, y, '#fff3b0'); P.px(x - 1, y + 2, '#fff3b0'); P.px(x + 1, y + 3, '#d9b04f');
    });
    P.rect(5, 10, 7, 2, '#ff8fbf'); P.px(6, 10, '#ffd1ec');
  },
  hay(P) {
    P.ellipse(8, 9, 6, 5, '#f2d27a'); P.ellipse(7, 8, 4, 3, '#ffe9a3');
    for (let i = 0; i < 6; i++) P.line(3 + i * 2, 5 + (i % 2), 4 + i * 2, 13, '#d9b04f');
    P.rect(2, 9, 13, 2, '#b56ee6');
  },
  milk(P, cap) {
    P.rect(5, 1, 6, 2, cap); P.rect(6, 3, 4, 2, '#e8f4ff');
    P.rect(4, 5, 8, 10, '#e8f4ff'); P.rect(5, 7, 6, 7, '#f1e6ff'); P.rect(5, 7, 2, 7, '#ffffff');
    star5(P, 6, 8, cap, cap);
  },
  mane(P) {
    const c = ['#ff7fb0', '#ffd36b', '#7fe0ff', '#b79cff'];
    c.forEach((col, i) => {
      P.line(2 + i, 13 - i, 6 + i, 5 - i, col);
      P.line(6 + i, 5 - i, 11, 3 + i, col);
      P.line(11, 3 + i, 13 - i, 8 + i, col);
    });
  },
  stardust(P) {
    P.ellipse(8, 11, 6, 3, '#c9a8ff'); P.ellipse(7, 10, 4, 2, '#e3d0ff');
    [[4, 10, '#ff9ad5'], [10, 10, '#9fe7ff'], [8, 12, '#ffe066'], [6, 11, '#ffffff']].forEach(([x, y, c]) => P.px(x, y, c));
    P.px(11, 3, '#ffe066'); P.px(10, 4, '#ffe066'); P.px(12, 4, '#ffe066'); P.px(11, 5, '#ffe066'); P.px(11, 4, '#ffffff');
  },
  sugar(P) {
    P.rect(3, 6, 7, 7, '#ffffff'); P.rect(10, 6, 3, 7, '#e3dcf0');
    P.rect(5, 3, 8, 3, '#f3eefa'); P.px(4, 5, '#f3eefa'); P.px(12, 5, '#e3dcf0');
    P.px(5, 9, '#e8e2f2'); P.px(7, 11, '#e8e2f2'); P.px(13, 2, '#ff9ad5'); P.px(14, 1, '#ffd1ec');
  },
  charm(P) {
    P.line(8, 0, 8, 3, '#ffd36b');
    P.circ(5, 7, 3, '#ff7fb0'); P.circ(11, 7, 3, '#ff7fb0');
    for (let y = 8; y < 14; y++) P.rect(2 + (y - 8), y, 13 - (y - 8) * 2, 1, '#ff7fb0');
    P.px(4, 6, '#ffd1ec'); P.px(5, 5, '#ffd1ec');
    star5(P, 6, 7, '#ffe066', '#f0b030');
  },
  ribbon(P) {
    P.circ(8, 6, 5, '#5b7cff'); P.circ(8, 6, 3, '#8fa8ff'); P.circ(8, 6, 1, '#ffd36b');
    P.rect(5, 10, 3, 6, '#5b7cff'); P.rect(9, 10, 3, 6, '#5b7cff');
  },
  coin(P) {
    P.circ(8, 8, 6, '#ffd36b'); P.circ(8, 8, 4, '#ffe9a3'); P.rect(7, 5, 2, 6, '#e0a845'); P.px(6, 5, '#ffffff');
  },
};

const MILK_CAPS = { milk_s: '#c9b8e8', milk_m: '#8fc3ff', milk_l: '#ff9ad5', milk_g: '#ffd34d' };

ART.icon = (key) => ART.memo(`icon:${key}`, () => {
  if (MILK_CAPS[key]) return ART.paint(16, 16, P => ICONS.milk(P, MILK_CAPS[key]), ICON_OUT);
  if (key.startsWith('seed_')) {
    const crop = key.slice(5);
    return ART.paint(16, 16, P => {
      ICONS.seeds(P);
      const mark = { carrot: '#ff9b3d', moonberry: '#8fcfff', clover: '#7fe0a8', starfruit: '#ffe066', sunpetal: '#ff9ad5', glowpkin: '#a56be8', dreamwheat: '#c9a8ff' }[crop] || '#ffffff';
      P.circ(8, 10, 2, mark); P.px(7, 9, '#ffffff');
    }, ICON_OUT);
  }
  const fn = ICONS[key];
  if (!fn) return ART.paint(16, 16, P => P.rect(4, 4, 8, 8, '#ff00ff'));
  return ART.paint(16, 16, P => fn(P), ICON_OUT);
});

/* ------------------------------------------------------------------ */
/* Particles and HUD                                                   */
/* ------------------------------------------------------------------ */

ART.heart = (col = '#ff6fae') => ART.memo(`heart:${col}`, () => ART.rows([
  '.xx.xx.',
  'xhxxxxx',
  'xxxxxxx',
  '.xxxxx.',
  '..xxx..',
  '...x...',
], { x: col, h: '#ffffff' }));

ART.heartEmpty = () => ART.memo('heartEmpty', () => ART.rows([
  '.xx.xx.',
  'x..x..x',
  'x.....x',
  '.x...x.',
  '..x.x..',
  '...x...',
], { x: '#b9a7d6' }));

ART.sparkle = (col) => ART.memo(`sparkle:${col}`, () => ART.rows([
  '..x..',
  '..x..',
  'xxwxx',
  '..x..',
  '..x..',
], { x: col, w: '#ffffff' }));

// Thought bubbles over unicorns: milk ready, mane ready, hungry.
const GLYPHS = {
  milk: ['..ccc..', '..www..', '.wwwww.', '.wpppw.', '.wpppw.', '.wwwww.'],
  mane: ['.11111.', '1222221', '2333332', '34...43', '4.....4'],
  hay:  ['.y.y.y.', 'yyyyyyy', '.yyyyy.', 'rrrrrrr', '.yyyyy.'],
};
ART.bubble = (kind) => ART.memo(`bubble:${kind}`, () => {
  const c = ART.paint(13, 13, P => {
    P.rect(1, 0, 11, 10, '#fff8ff'); P.rect(0, 1, 13, 8, '#fff8ff');
    P.rect(5, 10, 3, 1, '#fff8ff'); P.px(6, 11, '#fff8ff');
  }, '#4a3763');
  const g = ART.rows(GLYPHS[kind], { c: '#ff9ad5', w: '#b9a7d6', p: '#efe4ff', 1: '#ff7fb0', 2: '#ffd36b', 3: '#7fe0a8', 4: '#7fc4ff', y: '#f2c94c', r: '#b56ee6' });
  c.getContext('2d').drawImage(g, Math.floor((c.width - g.width) / 2), kind === 'mane' ? 3 : 2);
  return c;
});

ART.weather = (kind) => ART.memo(`weather:${kind}`, () => ART.paint(16, 16, P => {
  if (kind === 'sun') {
    P.circ(8, 8, 4, '#ffd36b'); P.circ(7, 7, 2, '#fff1a8');
    [[8, 1], [8, 15], [1, 8], [15, 8], [3, 3], [13, 3], [3, 13], [13, 13]].forEach(([x, y]) => P.px(x, y, '#ffb84d'));
  } else if (kind === 'rain' || kind === 'snow') {
    P.ellipse(8, 6, 6, 3, '#dfe6f5'); P.ellipse(5, 5, 3, 3, '#dfe6f5'); P.ellipse(10, 4, 3, 3, '#ffffff');
    if (kind === 'rain') [[4, 11], [8, 12], [12, 11], [6, 14], [10, 14]].forEach(([x, y]) => { P.px(x, y, '#5ec8ff'); P.px(x, y + 1, '#8fdcff'); });
    else [[4, 12], [8, 13], [12, 12]].forEach(([x, y]) => { P.px(x, y, '#ffffff'); P.px(x - 1, y, '#cfe3ff'); P.px(x + 1, y, '#cfe3ff'); P.px(x, y - 1, '#cfe3ff'); P.px(x, y + 1, '#cfe3ff'); });
  } else if (kind === 'moon') {
    P.circ(7, 8, 6, '#fff1c4');
    P.g.globalCompositeOperation = 'destination-out'; P.circ(10, 6, 5, '#000'); P.g.globalCompositeOperation = 'source-over';
    P.px(4, 8, '#ffe08a'); P.px(5, 12, '#ffe08a'); P.px(13, 12, '#ffffff'); P.px(14, 4, '#ffffff');
  } else if (kind === 'rainbow') {
    ['#ff7fb0', '#ffd36b', '#7fe0a8', '#7fc4ff', '#b79cff'].forEach((c, i) => {
      for (let a = 0; a <= Math.PI; a += 0.05) P.px(8 + Math.cos(a) * (7 - i), 12 - Math.sin(a) * (7 - i), c);
    });
  }
}, kind === 'sun' ? null : '#3a2a52'));
