// Moonmeadow Ranch — drawing the world, lighting, and sound.
'use strict';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const lightCv = ART.canvas(1, 1), lctx = lightCv.getContext('2d');

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = Math.max(1, canvas.clientWidth || window.innerWidth), ch = Math.max(1, canvas.clientHeight || window.innerHeight);
  Game.cssSize = `${cw}x${ch}x${dpr}`;
  canvas.width = Math.max(1, Math.round(cw * dpr)); canvas.height = Math.max(1, Math.round(ch * dpr));
  const tilesW = clamp(cw / 60, 12, 20);
  const s = Math.max(1, Math.floor(Math.min(canvas.width / (TILE * tilesW), canvas.height / (TILE * 9))));
  Game.view = { s, w: Math.ceil(canvas.width / s), h: Math.ceil(canvas.height / s) };
  lightCv.width = Game.view.w; lightCv.height = Game.view.h;
}

function shadow(x, y, w) {
  ctx.fillStyle = 'rgba(46, 24, 70, 0.22)';
  ctx.fillRect(Math.round(x - w / 2) + 1, Math.round(y) - 1, w - 2, 1);
  ctx.fillRect(Math.round(x - w / 2), Math.round(y), w, 2);
}

function drawUnicorn(u, t, focused) {
  const kind = u.adult ? 'adult' : 'foal';
  const pose = u._st === 'sleep' ? 2 : u._st === 'walk' ? Math.floor(u._anim / 230) % 2 : 0;
  const img = ART.unicorn(u.coat, u.mane, kind, pose, u._dir);
  shadow(u._x, u._y - 1, u.adult ? 18 : 12);
  const x = Math.round(u._x - img.width / 2), y = Math.round(u._y - img.height + 1);
  ctx.drawImage(img, x, y);
  if (u._st === 'sleep') {
    const k = (t / 900 + u.uid) % 1;
    ctx.fillStyle = `rgba(255,255,255,${1 - k})`;
    const zx = u._x + (u._dir === 'r' ? 6 : -9), zy = y - 2 - k * 8;
    ctx.fillRect(zx, zy, 3, 1); ctx.fillRect(zx + 1, zy + 1, 1, 1); ctx.fillRect(zx, zy + 2, 3, 1);
    return;
  }
  // Little thought bubble when something is ready.
  const ready = u.adult && u.milk ? 'milk' : maneReady(u) ? 'mane' : u.hungry ? 'hay' : null;
  if (ready) {
    const hx = u._x + (u._dir === 'r' ? 3 : -3) * (u.adult ? 1 : 0);
    ctx.drawImage(ART.bubble(ready), Math.round(hx - 7), Math.round(y - 13 + Math.sin(t / 350 + u.uid) * 1.2));
  }
  if (focused) {
    ctx.font = '600 7px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    const label = u.name;
    const ty = y - (ready ? 18 : 4);
    const tw = Math.ceil(ctx.measureText(label).width) + 6;
    ctx.fillStyle = 'rgba(43,29,64,0.85)'; ctx.fillRect(Math.round(u._x - tw / 2), ty - 7, tw, 9);
    ctx.fillStyle = '#fff6e9'; ctx.fillText(label, Math.round(u._x), ty);
    const h = hearts(u);
    for (let i = 0; i < 10; i++) {
      ctx.drawImage(i < h ? ART.heart() : ART.heartEmpty(), Math.round(u._x - 25 + i * 5), ty + 3, 5, 4);
    }
  }
}

function drawPlayer(t) {
  const frame = player.moving ? 1 + (Math.floor(player.anim / 150) % 2) : 0;
  const img = ART.farmer(player.dir, frame);
  shadow(player.x, player.y - 1, 12);
  const x = Math.round(player.x - img.width / 2), y = Math.round(player.y - img.height + 1);
  const toolBehind = player.dir === 'up';
  const drawTool = () => {
    if (player.actT <= 0 || !player.actItem) return;
    const p = 1 - player.actT / 260;
    const d = DIRS[player.dir];
    const ang = (player.dir === 'left' ? -1 : 1) * (-0.9 + p * 1.8);
    ctx.save();
    ctx.translate(Math.round(player.x + d[0] * 9), Math.round(player.y - 9 + d[1] * 6));
    ctx.rotate(ang);
    if (player.dir === 'left') ctx.scale(-1, 1);
    ctx.drawImage(itemIcon(player.actItem), -8, -12);
    ctx.restore();
  };
  if (toolBehind) drawTool();
  ctx.drawImage(img, x, y);
  if (!toolBehind) drawTool();
}

function drawParticles() {
  ctx.textAlign = 'center';
  for (const p of particles) {
    const a = 1 - Math.max(0, (p.life / p.max - 0.6) / 0.4);
    ctx.globalAlpha = a;
    if (p.kind === 'heart') ctx.drawImage(ART.heart(), Math.round(p.x - 3), Math.round(p.y));
    else if (p.kind === 'sparkle') ctx.drawImage(ART.sparkle(p.col || '#fff3a8'), Math.round(p.x - 2), Math.round(p.y - 2));
    else if (p.kind === 'text') {
      ctx.font = '600 7px "Pixelify Sans", monospace';
      ctx.fillStyle = '#2b1d33'; ctx.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y) + 1);
      ctx.fillStyle = p.col; ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
    } else { ctx.fillStyle = p.col || '#ffffff'; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.kind === 'drop' ? 1 : 2, 2); }
  }
  ctx.globalAlpha = 1;
}

function drawBrackets(x, y, w, h, col) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = col;
  [[0, 0, 1, 1], [w - 1, 0, -1, 1], [0, h - 1, 1, -1], [w - 1, h - 1, -1, -1]].forEach(([cx, cy, sx, sy]) => {
    ctx.fillRect(x + cx + (sx < 0 ? -2 : 0), y + cy, 3, 1);
    ctx.fillRect(x + cx, y + cy + (sy < 0 ? -2 : 0), 1, 3);
  });
}

function drawCursor() {
  const [tx, ty] = targetTile();
  drawBrackets(tx * TILE, ty * TILE, TILE, TILE, 'rgba(255,255,255,0.75)');
}

function screenToWorld(sx, sy) {
  const k = canvas.width / Math.max(1, canvas.clientWidth) / Game.view.s;
  return [Game.cam.x + sx * k, Game.cam.y + sy * k];
}

// Mouse hover: shade the 3x3 reach on the ground, then bracket whatever a click would act on.
function hoverHit() {
  const [wx, wy] = screenToWorld(Game.mouse.sx, Game.mouse.sy);
  const hit = resolvePoint(wx, wy);
  const cursor = hit.reach ? 'pointer' : 'default';
  if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
  const [px, py] = playerTile();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fillRect((px - 1) * TILE, (py - 1) * TILE, TILE * 3, TILE * 3);
  return hit;
}
function drawHoverMarks(hit) {
  const col = hit.reach ? 'rgba(255,255,255,0.95)' : 'rgba(255,150,180,0.7)';
  if (hit.kind === 'unicorn') {
    const u = hit.u, w = u.adult ? 26 : 19, h = u.adult ? 22 : 17;
    drawBrackets(u._x - w / 2, u._y - h, w, h + 2, col);
  } else if (hit.kind === 'building') {
    const [x, y, w, h] = hit.b.rect;
    drawBrackets(x, y, w, h, col);
  } else drawBrackets(hit.tx * TILE, hit.ty * TILE, TILE, TILE, col);
}

function render() {
  const V = Game.view, s = V.s, t = Game.t;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1b1428'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const mapW = MAP_W * TILE, mapH = MAP_H * TILE;
  let cx = Math.round(player.x - V.w / 2), cy = Math.round(player.y - 10 - V.h / 2);
  cx = V.w >= mapW ? Math.round((mapW - V.w) / 2) : clamp(cx, 0, mapW - V.w);
  cy = V.h >= mapH ? Math.round((mapH - V.h) / 2) : clamp(cy, 0, mapH - V.h);
  Game.cam.x = cx; Game.cam.y = cy;
  ctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);

  const x0 = Math.floor(cx / TILE) - 1, y0 = Math.floor(cy / TILE) - 1;
  const x1 = x0 + Math.ceil(V.w / TILE) + 2, y1 = y0 + Math.ceil(V.h / TILE) + 3;
  const season = seasonKey();
  const dark = darkness(state.time, state.weather);
  const night = dark > 0.25;

  drawGround(ctx, x0, y0, x1, y1, season, t);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inMap(x, y)) continue;
    const s0 = state.soil[idx(x, y)];
    if (s0 && s0.crop) drawCrop(ctx, x, y, s0, t);
  }
  let focus = null, hover = null;
  if (Game.running && !UI.blocking()) {
    const m = Game.mouse;
    if (m.over && performance.now() - m.t < 4000) {
      hover = hoverHit();
      if (hover.kind === 'unicorn') focus = hover.u;
    } else {
      drawCursor();
      focus = targetUnicorn();
    }
  }

  const list = [];
  for (const st of world.statics) {
    if (st.tx < x0 - 6 || st.tx > x1 + 2 || st.ty < y0 - 1 || st.ty > y1 + 6) continue;
    list.push({ y: st.sortY, f: () => drawStatic(ctx, st, season, night, t) });
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inMap(x, y)) continue;
    const o = state.objs[idx(x, y)];
    if (o) list.push({ y: (y + 1) * TILE - (o === 'stardust' ? 8 : 2), f: () => drawObj(ctx, x, y, o, season, t) });
  }
  for (const u of state.unicorns) list.push({ y: u._y, f: () => drawUnicorn(u, t, u === focus) });
  if (Game.running) list.push({ y: player.y, f: () => drawPlayer(t) });
  list.sort((a, b) => a.y - b.y);
  for (const d of list) d.f();
  if (hover) drawHoverMarks(hover);
  drawParticles();

  // Night: darken, then cut soft holes for windows, lamps, horns and the farmer's lantern.
  if (dark > 0.01) {
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, V.w, V.h);
    lctx.fillStyle = `rgba(24, 14, 60, ${dark})`;
    lctx.fillRect(0, 0, V.w, V.h);
    const lights = [];
    if (night) {
      lights.push(...lightSources());
      if (Game.running) lights.push([player.x, player.y - 10, 46]);
      for (const u of state.unicorns) {
        const hx = u._x + (u._dir === 'r' ? 1 : -1) * (u.adult ? 9 : 5), hy = u._y - (u.adult ? 20 : 13);
        lights.push([hx, hy, 14]);
      }
    }
    lctx.globalCompositeOperation = 'destination-out';
    for (const [lx, ly, r] of lights) {
      const x = lx - cx, y = ly - cy;
      if (x < -r || y < -r || x > V.w + r || y > V.h + r) continue;
      const g = lctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g; lctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    lctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lightCv, 0, 0);
    if (night) {
      ctx.globalCompositeOperation = 'lighter';
      for (const [lx, ly, r] of lights) {
        const x = lx - cx, y = ly - cy;
        if (x < -r || y < -r || x > V.w + r || y > V.h + r) continue;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.8);
        g.addColorStop(0, `rgba(255, 196, 140, ${0.16 * dark})`); g.addColorStop(1, 'rgba(255,196,140,0)');
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.imageSmoothingEnabled = false;
  }
  ctx.setTransform(s, 0, 0, s, 0, 0);
  drawWeather(ctx);
  if (Game.fade > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(20, 12, 38, ${Game.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/* ------------------------------------------------------------------ */
/* Sound: tiny synthesized effects and a music-box loop                */
/* ------------------------------------------------------------------ */

const SFX = {
  ac: null, sfxOn: true, musicOn: true, master: null, musicGain: null, step: 0, timer: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = 0.6; this.master.connect(this.ac.destination);
      this.musicGain = this.ac.createGain(); this.musicGain.gain.value = this.musicOn ? 1 : 0; this.musicGain.connect(this.master);
      this.timer = setInterval(() => this.tick(), 260);
    } catch (e) { this.ac = null; }
  },
  tone(f, d, type = 'square', v = 0.05, slide = 0, delay = 0, dest) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d, v, freq, type = 'lowpass') {
    if (!this.ac) return;
    const t = this.ac.currentTime, n = Math.floor(this.ac.sampleRate * d);
    const buf = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    src.buffer = buf; f.type = type; f.frequency.value = freq; g.gain.value = v;
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
  },
  play(name) {
    if (!this.sfxOn || !this.ac) return;
    const T = (...a) => this.tone(...a);
    switch (name) {
      case 'till': this.noise(0.09, 0.35, 700); T(120, 0.07, 'triangle', 0.08); break;
      case 'rock': this.noise(0.14, 0.4, 1200); T(90, 0.1, 'square', 0.04, -30); break;
      case 'water': this.noise(0.22, 0.12, 2400, 'bandpass'); break;
      case 'refill': T(400, 0.18, 'sine', 0.06, 500); break;
      case 'cut': this.noise(0.06, 0.25, 3500, 'highpass'); break;
      case 'plant': T(520, 0.06, 'triangle', 0.07); break;
      case 'harvest': T(660, 0.08, 'triangle', 0.07); T(990, 0.12, 'triangle', 0.06, 0, 0.07); break;
      case 'pickup': T(880, 0.05, 'square', 0.035); T(1320, 0.07, 'square', 0.03, 0, 0.05); break;
      case 'coin': T(988, 0.06, 'square', 0.035); T(1319, 0.16, 'square', 0.035, 0, 0.06); break;
      case 'heart': T(784, 0.1, 'sine', 0.07); T(1047, 0.18, 'sine', 0.06, 0, 0.09); break;
      case 'sparkle': [1568, 2093, 2637].forEach((f, i) => T(f, 0.09, 'sine', 0.035, 0, i * 0.05)); break;
      case 'wish': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.3, 'sine', 0.05, 0, i * 0.09)); break;
      case 'nope': T(220, 0.14, 'square', 0.035, -80); break;
      case 'ui': T(700, 0.03, 'square', 0.02); break;
      case 'buy': T(784, 0.05, 'square', 0.03); T(1175, 0.1, 'square', 0.03, 0, 0.05); break;
      case 'fanfare': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.22, 'triangle', 0.07, 0, i * 0.14)); break;
    }
  },
  // A gentle generative music box; the scale shifts with the season and slows at night.
  tick() {
    if (!this.ac || !this.musicOn || !state) return;
    const scales = [[0, 2, 4, 7, 9], [0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 3, 7, 8]];
    const roots = [261.63, 293.66, 220, 246.94];
    const sc = scales[state.season], root = roots[state.season];
    const late = state.time > 20 * 60;
    this.step++;
    if (late && this.step % 2) return;
    const note = (deg, oct = 0) => root * Math.pow(2, (sc[((deg % 5) + 5) % 5] + 12 * (Math.floor(deg / 5) + oct)) / 12);
    if (this.step % 8 === 0) this.tone(note(0, -1), 1.6, 'sine', 0.035, 0, 0, this.musicGain);
    if (this.step % 8 === 4) this.tone(note(this.step % 16 === 4 ? 3 : 4, -1), 1.4, 'sine', 0.03, 0, 0, this.musicGain);
    if (Math.random() < (late ? 0.35 : 0.55)) {
      this.mel = clamp((this.mel || 5) + pick([-2, -1, -1, 1, 1, 2, 0]), 2, 11);
      this.tone(note(this.mel), 0.7, 'triangle', 0.025, 0, 0, this.musicGain);
    }
  },
  setMusic(on) { this.musicOn = on; if (this.musicGain) this.musicGain.gain.value = on ? 1 : 0; },
};
