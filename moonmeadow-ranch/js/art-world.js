// Moonmeadow Ranch — world art: terrain, trees, fences and buildings.
'use strict';

const SEASONS = ['spring', 'summer', 'fall', 'winter'];

const SEASON_PAL = {
  spring: { g: '#97d46c', gd: '#74b856', gl: '#bfe68a', path: '#dcb98f', pathd: '#c49d74', pathl: '#ead0ad', flower: ['#ff9ad5', '#fff1a8', '#c9a4ff'] },
  summer: { g: '#6fc95b', gd: '#4fa748', gl: '#98de71', path: '#d9b488', pathd: '#c09670', pathl: '#e8cca5', flower: ['#ffd35c', '#ff7f9f', '#ffffff'] },
  fall:   { g: '#cdb260', gd: '#a98d44', gl: '#e3cd83', path: '#d2a87e', pathd: '#b68b62', pathl: '#e3c29c', flower: ['#e8743c', '#c94f4f', '#ffb347'] },
  winter: { g: '#e8eff9', gd: '#c9d6ea', gl: '#ffffff', path: '#d9d2d6', pathd: '#bdb3bc', pathl: '#efe9ec', flower: ['#bcd2f5', '#ffffff', '#d8c8ff'] },
};

ART.grass = (season, v) => ART.memo(`grass:${season}:${v}`, () => {
  const p = SEASON_PAL[season];
  return ART.paint(16, 16, P => {
    P.rect(0, 0, 16, 16, p.g);
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(P.rnd() * 14) + 1, y = Math.floor(P.rnd() * 14) + 1;
      if (season === 'winter') { P.px(x, y, p.gd); continue; }
      P.px(x - 1, y - 1, p.gd); P.px(x + 1, y - 1, p.gd); P.px(x, y, p.gd);
    }
    for (let i = 0; i < 4; i++) P.px(Math.floor(P.rnd() * 16), Math.floor(P.rnd() * 16), p.gl);
  }, null, 11 + v * 97);
});

ART.flowers = (season, v) => ART.memo(`flowers:${season}:${v}`, () => {
  const p = SEASON_PAL[season];
  return ART.paint(16, 16, P => {
    const n = 2 + (v % 2);
    for (let i = 0; i < n; i++) {
      const x = 3 + Math.floor(P.rnd() * 10), y = 3 + Math.floor(P.rnd() * 10);
      const c = p.flower[Math.floor(P.rnd() * 3)];
      if (season === 'winter') { P.px(x, y, '#ffffff'); P.px(x + 1, y, '#dbe7fa'); continue; }
      P.px(x, y + 2, p.gd);
      P.px(x - 1, y, c); P.px(x + 1, y, c); P.px(x, y - 1, c); P.px(x, y + 1, c);
      P.px(x, y, season === 'fall' ? '#7a4a2c' : '#fff6a8');
    }
  }, null, 300 + v * 31);
});

ART.path = (season, v) => ART.memo(`path:${season}:${v}`, () => {
  const p = SEASON_PAL[season];
  return ART.paint(16, 16, P => {
    P.rect(0, 0, 16, 16, p.path);
    for (let i = 0; i < 7; i++) P.px(Math.floor(P.rnd() * 16), Math.floor(P.rnd() * 16), p.pathd);
    for (let i = 0; i < 5; i++) P.px(Math.floor(P.rnd() * 16), Math.floor(P.rnd() * 16), p.pathl);
    const x = Math.floor(P.rnd() * 12) + 2, y = Math.floor(P.rnd() * 12) + 2;
    P.rect(x, y, 2, 1, p.pathd); P.px(x, y - 1, p.pathl);
  }, null, 900 + v * 13);
});

// Untilled field earth.
ART.field = (v) => ART.memo(`field:${v}`, () => ART.paint(16, 16, P => {
  P.rect(0, 0, 16, 16, '#c99c74');
  for (let i = 0; i < 8; i++) P.px(Math.floor(P.rnd() * 16), Math.floor(P.rnd() * 16), '#b2865f');
  for (let i = 0; i < 4; i++) P.px(Math.floor(P.rnd() * 16), Math.floor(P.rnd() * 16), '#ddb48d');
}, null, 50 + v * 7));

ART.soil = (wet) => ART.memo(`soil:${wet}`, () => ART.paint(16, 16, P => {
  const base = wet ? '#6b4330' : '#a0694a', dark = wet ? '#4f2f22' : '#7d4e35', light = wet ? '#835640' : '#bb825e';
  P.rect(1, 1, 14, 14, base);
  for (let y = 3; y < 15; y += 4) {
    P.rect(2, y, 12, 1, dark);
    P.rect(2, y - 1, 12, 1, light);
  }
  P.rect(1, 1, 14, 1, dark);
}));

ART.water = (frame) => ART.memo(`water:${frame}`, () => ART.paint(16, 16, P => {
  P.rect(0, 0, 16, 16, '#74c9f0');
  P.rect(0, 10, 16, 6, '#68bde8');
  const off = frame * 4;
  [[2, 3], [9, 6], [4, 11], [12, 13]].forEach(([x, y]) => {
    P.rect((x + off) % 16, y, 3, 1, '#c4f0ff');
    P.px((x + off + 3) % 16, y - 1, '#e6fbff');
  });
}));

ART.rock = () => ART.memo('rock', () => ART.paint(16, 16, P => {
  P.ellipse(8, 10, 6, 4, '#8c84a3');
  P.ellipse(7, 9, 5, 3, '#a59dbb');
  P.ellipse(6, 8, 2, 1, '#c7c0d8');
  P.px(10, 12, '#746c8c'); P.px(11, 11, '#746c8c');
}, '#3f3852'));

ART.weed = (season) => ART.memo(`weed:${season}`, () => {
  const leaf = { spring: '#5fae4a', summer: '#468f3f', fall: '#a7863a', winter: '#9fb3c9' }[season];
  const leafl = { spring: '#86cf63', summer: '#64b052', fall: '#c9a552', winter: '#c9d8e8' }[season];
  return ART.paint(16, 16, P => {
    P.line(8, 14, 8, 6, leaf); P.line(8, 13, 4, 8, leaf); P.line(8, 13, 12, 7, leaf);
    P.line(7, 14, 3, 11, leafl); P.line(9, 14, 13, 11, leafl);
    P.px(4, 7, leafl); P.px(12, 6, leafl);
    if (season !== 'winter') { P.px(8, 5, '#c58cff'); P.px(7, 5, '#e3c4ff'); }
  }, '#2f3a26');
});

ART.bush = (season) => ART.memo(`bush:${season}`, () => {
  const c = {
    spring: ['#4f9a4a', '#6fbf5a', '#9ad874', '#ff9ad5'],
    summer: ['#3f8a43', '#5aae50', '#86cc6a', '#7fd0ff'],
    fall: ['#b04e30', '#d97139', '#f0a35a', '#ffe066'],
    winter: ['#b9c8dc', '#dbe6f4', '#ffffff', '#ff7f9f'],
  }[season];
  return ART.paint(16, 16, P => {
    P.ellipse(8, 9, 7, 6, c[0]);
    P.ellipse(7, 8, 5, 4, c[1]);
    P.ellipse(6, 6, 2, 2, c[2]);
    [[4, 10], [10, 7], [11, 11], [7, 12]].forEach(([x, y]) => P.px(x, y, c[3]));
  }, '#2e3a2c');
});

const TREE_COLORS = {
  oak: {
    spring: ['#4f9a4a', '#6fbf5a', '#9ad874', '#ffb3dd'],
    summer: ['#3f8a43', '#5aae50', '#86cc6a', null],
    fall:   ['#b8492c', '#e07a3a', '#f4a95c', '#ffd35c'],
  },
  blossom: {
    spring: ['#d97bb5', '#f3a6d4', '#ffd1ec', '#ffffff'],
    summer: ['#8f80d9', '#b3a3f0', '#dccfff', '#fff3b0'],
    fall:   ['#d65f86', '#ee89a4', '#ffb7c8', '#ffe2a8'],
    winter: ['#c6d2e6', '#e4ecf8', '#ffffff', '#ffd1ec'],
  },
};

ART.tree = (kind, season) => ART.memo(`tree:${kind}:${season}`, () => {
  const bare = kind === 'oak' && season === 'winter';
  return ART.paint(32, 42, P => {
    // trunk
    P.rect(13, 24, 6, 15, '#8a5a3c');
    P.rect(13, 24, 2, 15, '#a8714d');
    P.rect(17, 26, 2, 13, '#6e4630');
    P.rect(11, 37, 10, 2, '#8a5a3c');
    if (bare) {
      P.line(15, 26, 8, 12, '#8a5a3c'); P.line(16, 26, 24, 10, '#8a5a3c');
      P.line(15, 22, 15, 5, '#8a5a3c'); P.line(16, 22, 16, 5, '#a8714d');
      P.line(11, 18, 6, 16, '#8a5a3c'); P.line(21, 16, 27, 14, '#8a5a3c');
      [[8, 11], [24, 9], [15, 4], [6, 15], [27, 13]].forEach(([x, y]) => { P.rect(x - 1, y - 1, 3, 1, '#ffffff'); });
      return;
    }
    const c = TREE_COLORS[kind][season];
    const blobs = [[16, 15, 12, 10], [8, 19, 7, 6], [24, 19, 7, 6], [16, 8, 8, 6]];
    blobs.forEach(([x, y, rx, ry]) => P.ellipse(x, y, rx, ry, c[0]));
    blobs.forEach(([x, y, rx, ry]) => P.ellipse(x - 1, y - 2, rx - 2, ry - 2, c[1]));
    P.ellipse(12, 8, 4, 2, c[2]); P.ellipse(7, 16, 2, 1, c[2]); P.ellipse(20, 12, 2, 1, c[2]);
    if (c[3]) {
      for (let i = 0; i < 9; i++) {
        const x = 6 + Math.floor(P.rnd() * 20), y = 6 + Math.floor(P.rnd() * 18);
        P.px(x, y, c[3]);
      }
    }
  }, '#3a2a35', kind === 'oak' ? 5 : 9);
});

// Picket fence, joined to its neighbours. mask bits: 1 up, 2 right, 4 down, 8 left.
ART.fence = (mask) => ART.memo(`fence:${mask}`, () => ART.paint(16, 16, P => {
  const wood = '#fff6ee', shade = '#d9c6dc';
  if (mask & 8) { P.rect(0, 6, 8, 2, wood); P.rect(0, 11, 8, 2, wood); P.rect(0, 8, 8, 0, shade); }
  if (mask & 2) { P.rect(8, 6, 8, 2, wood); P.rect(8, 11, 8, 2, wood); }
  if (mask & 1) P.rect(7, 0, 2, 6, wood);
  if (mask & 4) P.rect(7, 12, 2, 4, wood);
  P.rect(6, 2, 4, 13, wood);
  P.rect(9, 3, 1, 12, shade);
  P.px(7, 1, wood); P.px(8, 1, wood);
}, '#6b5470'));

/* ------------------------------------------------------------------ */
/* Buildings                                                           */
/* ------------------------------------------------------------------ */

// The farmhouse. night=true lights the windows.
ART.house = (season, night) => ART.memo(`house:${season}:${night}`, () => ART.paint(80, 74, P => {
  const roof = '#ef8ab3', roofd = '#cf6896', roofl = '#ffb3d1';
  // chimney
  P.rect(57, 2, 9, 16, '#b0798f'); P.rect(57, 2, 9, 2, '#8f5c72');
  for (let y = 6; y < 18; y += 4) P.rect(57, y, 9, 1, '#9a6880');
  // roof
  for (let y = 8; y < 40; y++) {
    const inset = Math.max(0, Math.round((22 - (y - 8)) * 0.55));
    P.rect(1 + inset, y, 78 - inset * 2, 1, roof);
  }
  for (let y = 12; y < 40; y += 5) {
    const inset = Math.max(0, Math.round((22 - (y - 8)) * 0.55));
    P.rect(1 + inset, y, 78 - inset * 2, 1, roofd);
    for (let x = 3 + inset + ((y / 5) % 2) * 3; x < 77 - inset; x += 6) P.px(x, y + 1, roofd);
  }
  P.rect(14, 9, 52, 1, roofl);
  if (season === 'winter') {
    for (let y = 8; y < 13; y++) {
      const inset = Math.max(0, Math.round((22 - (y - 8)) * 0.55));
      P.rect(1 + inset, y, 78 - inset * 2, 1, '#ffffff');
    }
    P.rect(57, 1, 9, 2, '#ffffff');
  }
  // walls
  P.rect(4, 40, 72, 30, '#efe3fa');
  P.rect(4, 40, 72, 2, '#cdb9e6');
  P.rect(4, 40, 3, 30, '#b79bd6'); P.rect(73, 40, 3, 30, '#b79bd6');
  P.rect(4, 66, 72, 6, '#b6a8c4');
  for (let x = 6; x < 76; x += 7) P.rect(x, 66, 1, 6, '#9c8daf');
  P.rect(4, 68, 72, 1, '#9c8daf');
  // windows
  const glass = night ? '#ffe08a' : '#bfe6ff', glassl = night ? '#fff4c4' : '#e6f7ff';
  [[11, 46], [55, 46]].forEach(([x, y]) => {
    P.rect(x, y, 15, 13, '#ffffff');
    P.rect(x + 2, y + 2, 11, 9, glass);
    P.rect(x + 2, y + 2, 4, 3, glassl);
    P.rect(x + 7, y + 2, 1, 9, '#ffffff'); P.rect(x + 2, y + 6, 11, 1, '#ffffff');
    P.rect(x - 1, y + 13, 17, 3, '#9a6a4e');
    const f = season === 'winter' ? ['#ffffff', '#dbe7fa'] : ['#ff8fbf', '#ffe066', '#b79cff'];
    for (let i = 0; i < 6; i++) P.px(x + 1 + i * 2.6, y + 12, f[i % f.length]);
  });
  // door
  P.rect(33, 49, 14, 21, '#9a5f7a');
  P.rect(34, 47, 12, 2, '#9a5f7a');
  P.rect(35, 46, 10, 1, '#9a5f7a');
  P.rect(35, 51, 4, 17, '#ad7290'); P.rect(41, 51, 4, 17, '#ad7290');
  P.rect(38, 52, 4, 3, night ? '#ffe08a' : '#ffd1ec');
  P.px(44, 60, '#ffd36b');
  P.rect(31, 70, 18, 2, '#c9b8d8');
}, '#3f2c4a'));

// The unicorn stable: a lilac barn with a star weathervane.
ART.stable = (season, night) => ART.memo(`stable:${season}:${night}`, () => ART.paint(96, 84, P => {
  const wall = '#e7a7c1', walld = '#c9849f', trim = '#fff6ee', roof = '#7d6bc9', roofd = '#5f4fa8', roofl = '#a193e6';
  // weathervane
  P.rect(47, 1, 2, 12, '#c9a24a');
  const star = [[48, 2], [47, 3], [48, 3], [49, 3], [46, 4], [47, 4], [48, 4], [49, 4], [50, 4], [47, 5], [49, 5]];
  star.forEach(([x, y]) => P.px(x + 4, y - 1, '#ffd36b'));
  // gambrel roof
  for (let y = 12; y < 42; y++) {
    let inset;
    if (y < 24) inset = Math.round(30 - (y - 12) * 1.8);
    else inset = Math.max(1, Math.round(9 - (y - 24) * 0.5));
    P.rect(inset, y, 96 - inset * 2, 1, roof);
  }
  for (let y = 15; y < 42; y += 4) {
    let inset = y < 24 ? Math.round(30 - (y - 12) * 1.8) : Math.max(1, Math.round(9 - (y - 24) * 0.5));
    P.rect(inset + 1, y, 94 - inset * 2, 1, roofd);
  }
  P.rect(32, 13, 32, 1, roofl);
  if (season === 'winter') {
    for (let y = 12; y < 20; y++) {
      const inset = Math.round(30 - (y - 12) * 1.8);
      P.rect(inset, y, 96 - inset * 2, 1, y < 17 ? '#ffffff' : '#e6eef9');
    }
  }
  // hayloft
  P.rect(40, 22, 16, 13, trim);
  P.rect(42, 24, 12, 11, night ? '#ffd98a' : '#6b4a5e');
  if (!night) { P.rect(43, 30, 10, 5, '#f2d27a'); P.px(45, 29, '#f2d27a'); P.px(50, 29, '#f2d27a'); }
  // walls
  P.rect(5, 42, 86, 40, wall);
  for (let x = 9; x < 91; x += 6) P.rect(x, 42, 1, 40, walld);
  P.rect(5, 42, 86, 2, trim);
  P.rect(5, 42, 3, 40, trim); P.rect(88, 42, 3, 40, trim);
  // big door with white X
  P.rect(30, 50, 36, 32, '#b46f8f');
  P.rect(30, 50, 36, 3, trim); P.rect(30, 50, 3, 32, trim); P.rect(63, 50, 3, 32, trim); P.rect(47, 50, 2, 32, trim);
  P.line(33, 53, 46, 80, trim); P.line(46, 53, 33, 80, trim);
  P.line(49, 53, 62, 80, trim); P.line(62, 53, 49, 80, trim);
  // side windows
  [[12, 52], [72, 52]].forEach(([x, y]) => {
    P.rect(x, y, 12, 10, trim);
    P.rect(x + 2, y + 2, 8, 6, night ? '#ffe08a' : '#bfe6ff');
    P.rect(x + 2, y + 2, 3, 2, night ? '#fff4c4' : '#e6f7ff');
  });
  // horseshoe-star plaque
  P.rect(44, 44, 8, 5, '#fff6ee'); P.rect(46, 45, 4, 3, '#ff8fbf');
}, '#3a2a52'));

ART.silo = (season) => ART.memo(`silo:${season}`, () => ART.paint(32, 62, P => {
  P.ellipse(16, 12, 13, 10, season === 'winter' ? '#ffffff' : '#ef8ab3');
  P.ellipse(14, 9, 8, 5, season === 'winter' ? '#f4f8ff' : '#ffb3d1');
  P.rect(3, 14, 26, 46, '#cdbfe8');
  P.rect(3, 14, 5, 46, '#e2d8f4'); P.rect(24, 14, 5, 46, '#ab9bd0');
  for (let y = 20; y < 60; y += 8) P.rect(3, y, 26, 1, '#ab9bd0');
  P.rect(11, 22, 10, 9, '#6b4a5e'); P.rect(12, 26, 8, 5, '#f2d27a');
  P.rect(12, 44, 8, 14, '#9a5f7a'); P.rect(13, 46, 6, 1, '#b67a96');
}, '#3a2a52'));

ART.trough = () => ART.memo('trough', () => ART.paint(32, 16, P => {
  P.rect(1, 4, 30, 9, '#b07a50');
  P.rect(3, 5, 26, 4, '#6e4630');
  P.rect(1, 9, 30, 1, '#8e5a3a');
  P.rect(2, 13, 3, 3, '#8e5a3a'); P.rect(27, 13, 3, 3, '#8e5a3a');
  P.rect(1, 4, 30, 1, '#cf9a6e');
}, '#3d2a22'));

ART.bin = () => ART.memo('bin', () => ART.paint(16, 16, P => {
  P.rect(1, 6, 14, 9, '#b07a50');
  P.rect(1, 9, 14, 1, '#8e5a3a'); P.rect(1, 12, 14, 1, '#8e5a3a');
  P.rect(0, 3, 16, 4, '#8e5a3a'); P.rect(0, 3, 16, 1, '#b8845b');
  P.rect(7, 5, 2, 3, '#ffd36b');
  P.px(6, 6, '#ffd36b'); P.px(9, 6, '#ffd36b');
}, '#3d2a22'));

ART.sign = () => ART.memo('sign', () => ART.paint(18, 20, P => {
  P.rect(8, 10, 2, 9, '#8a5a3c');
  P.rect(1, 2, 16, 9, '#c58f5f'); P.rect(1, 2, 16, 1, '#e0ad7c');
  P.rect(3, 5, 12, 1, '#7a4a2c'); P.rect(3, 7, 9, 1, '#7a4a2c');
  P.px(14, 7, '#ff8fbf');
}, '#3d2a22'));

ART.lamp = (lit) => ART.memo(`lamp:${lit}`, () => ART.paint(10, 30, P => {
  P.rect(4, 8, 2, 21, '#5b4a7a'); P.rect(2, 27, 6, 2, '#5b4a7a');
  P.rect(2, 2, 6, 7, '#5b4a7a');
  P.rect(3, 3, 4, 5, lit ? '#ffe08a' : '#cfe6f5');
  P.rect(3, 1, 4, 1, '#5b4a7a');
}, '#2a2038'));

// Market stall, split so Wren can stand between the awning and the counter.
ART.stallBack = () => ART.memo('stallBack', () => ART.paint(66, 50, P => {
  P.rect(3, 12, 3, 37, '#8a5a3c'); P.rect(60, 12, 3, 37, '#8a5a3c');
  P.rect(6, 16, 54, 22, '#d9c0a3'); P.rect(6, 16, 54, 2, '#bfa384');
  // shelves of produce
  for (let i = 0; i < 6; i++) {
    const cols = ['#ff9b3d', '#9fd8ff', '#ffe066', '#a56be8', '#ff8fbf', '#f2d27a'];
    P.rect(9 + i * 8, 24, 6, 3, cols[i]);
  }
  P.rect(6, 27, 54, 1, '#8a5a3c');
  // awning
  for (let x = 0; x < 66; x++) {
    const stripe = Math.floor(x / 6) % 2 === 0;
    P.rect(x, 2, 1, 12, stripe ? '#ff8fbf' : '#fff6ee');
  }
  for (let x = 0; x < 66; x += 6) P.ellipse(x + 3, 14, 3, 2, Math.floor(x / 6) % 2 === 0 ? '#ff8fbf' : '#fff6ee');
  P.rect(0, 1, 66, 2, '#e06a9c');
}, '#3d2a35'));

ART.stallFront = () => ART.memo('stallFront', () => ART.paint(66, 22, P => {
  P.rect(2, 2, 62, 18, '#c58f5f');
  P.rect(2, 2, 62, 3, '#e0ad7c');
  for (let x = 6; x < 64; x += 8) P.rect(x, 6, 1, 14, '#a8734a');
  // baskets
  [[8, '#ff9b3d'], [24, '#ffe066'], [42, '#9fd8ff']].forEach(([x, c]) => {
    P.rect(x, 0, 12, 4, '#9a6a3e'); P.ellipse(x + 6, 0, 5, 2, c);
  });
  P.rect(54, -1, 6, 6, '#fff6ee'); P.rect(55, 0, 4, 1, '#ff8fbf'); P.rect(55, 2, 3, 1, '#7a4a2c');
}, '#3d2a35'));
