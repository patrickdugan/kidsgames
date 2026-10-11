// Moonmeadow Ranch — HUD, dialogue, input and boot. Panels live in ui-panels.js.
'use strict';

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iconImg = (canvasImg, cls = 'px') => `<img class="${cls}" src="${ART.url(canvasImg)}" alt="">`;

const UI = {
  dirty: true,
  modal: null,
  dialog: null,
  hudCache: {},
  iconUrls: new Map(),

  iconUrl(id) {
    if (!this.iconUrls.has(id)) this.iconUrls.set(id, ART.url(itemIcon(id)));
    return this.iconUrls.get(id);
  },

  blocking() { return !!this.modal || !!this.dialog || !Game.running; },

  /* ---------- HUD ---------- */
  tick() {
    if (!Game.running) return;
    const c = this.hudCache, s = state;
    const set = (key, val, fn) => { if (c[key] !== val) { c[key] = val; fn(val); } };
    set('date', `${SEASON_NAMES[s.season]}|${s.day}|${weekday()}|${s.year}`, () => {
      $('#hud-date').textContent = `${SEASON_NAMES[s.season]} ${s.day}`;
      $('#hud-weekday').textContent = `${weekday()} · Year ${s.year}`;
      $('#hud').dataset.season = SEASONS[s.season];
    });
    set('time', clockLabel(), v => { $('#hud-time').textContent = v; });
    const sky = s.weather === 'sun' && (s.time >= 19 * 60) ? 'moon' : s.weather;
    set('weather', sky, v => { $('#hud-weather').src = ART.url(ART.weather(v)); $('#hud-weather').alt = v; });
    set('gold', s.gold, v => { $('#hud-gold').textContent = v.toLocaleString(); });
    set('energy', Math.ceil(s.energy), v => {
      const pct = v / s.maxEnergy * 100;
      $('#hud-energy').style.width = pct + '%';
      $('#hud-energy').classList.toggle('low', pct < 25);
      $('#hud-energy-label').textContent = `${v}`;
    });
    set('shop', shopOpen() ? 1 : 0, v => { $('#hud-shop').textContent = v ? 'Market open' : 'Market closed'; $('#hud-shop').classList.toggle('closed', !v); });
    if (this.dirty) { this.renderHotbar(); this.dirty = false; }
    const h = held();
    const label = h ? (h.id === 'can' || h.id === 'bigcan' ? `${ITEMS[h.id].name} · ${s.water}/${s.waterMax}` : `${ITEMS[h.id].name}${h.n > 1 ? ' ×' + h.n : ''}`) : 'Empty hands';
    set('held', label, v => { $('#held-label').textContent = v; });
  },

  renderHotbar() {
    const bar = $('#hotbar');
    bar.innerHTML = '';
    for (let i = 0; i < HOTBAR; i++) {
      const s = state.inv[i];
      const b = el('button', 'slot' + (i === state.sel ? ' sel' : ''));
      b.type = 'button';
      b.title = s ? ITEMS[s.id].name : 'Empty';
      b.setAttribute('aria-label', `Slot ${i + 1}: ${s ? ITEMS[s.id].name : 'empty'}`);
      b.innerHTML = `<span class="key">${i < 9 ? i + 1 : ['0', '-', '='][i - 9]}</span>` +
        (s ? `<img class="px" src="${this.iconUrl(s.id)}" alt="">${s.n > 1 ? `<span class="n">${s.n}</span>` : ''}` : '');
      if (s && (s.id === 'can' || s.id === 'bigcan')) b.innerHTML += `<span class="water" style="width:${state.water / state.waterMax * 80}%"></span>`;
      b.addEventListener('click', () => { state.sel = i; this.dirty = true; SFX.play('ui'); });
      bar.appendChild(b);
    }
  },

  toast(text, kind = '') {
    const box = $('#toasts');
    const t = el('div', 'toast ' + kind);
    t.textContent = text;
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 3000);
    setTimeout(() => t.remove(), 3500);
  },

  /* ---------- dialogue ---------- */
  say(speaker, text, onDone) {
    const d = $('#dialog');
    this.dialog = { text, shown: 0, onDone };
    $('#dialog-name').textContent = speaker;
    $('#dialog-name').hidden = !speaker;
    $('#dialog-text').textContent = '';
    d.hidden = false;
    const step = () => {
      if (!this.dialog || this.dialog.text !== text) return;
      this.dialog.shown = Math.min(text.length, this.dialog.shown + 2);
      $('#dialog-text').textContent = text.slice(0, this.dialog.shown);
      if (this.dialog.shown < text.length) this.dialog.raf = setTimeout(step, 16);
    };
    step();
  },
  advanceDialog() {
    const d = this.dialog;
    if (!d) return;
    if (d.shown < d.text.length) { d.shown = d.text.length; $('#dialog-text').textContent = d.text; return; }
    this.dialog = null;
    $('#dialog').hidden = true;
    if (d.onDone) d.onDone();
  },

  /* ---------- modal shell ---------- */
  openModal(name, html, { closable = true, wide = false } = {}) {
    const m = $('#modal'), card = $('#modal-card');
    card.className = 'modal-card' + (wide ? ' wide' : '');
    card.innerHTML = html;
    m.hidden = false;
    this.modal = { name, closable };
    card.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.closeModal()));
    const first = card.querySelector('[autofocus]') || card.querySelector('button:not([data-close])') || card.querySelector('button');
    if (first) setTimeout(() => { first.focus({ preventScroll: true }); card.scrollTop = 0; }, 30);
    return card;
  },
  closeModal() {
    const m = this.modal;
    $('#modal').hidden = true; $('#modal-card').innerHTML = '';
    this.modal = null;
    this.dirty = true;
    if (m && m.onClose) m.onClose();
    canvas.focus();
  },

  confirm(text, yesLabel, onYes) {
    const card = this.openModal('confirm', `
      <p class="confirm-text">${esc(text)}</p>
      <div class="row-btns"><button class="btn primary" id="c-yes" type="button">${esc(yesLabel)}</button><button class="btn" data-close type="button">Not yet</button></div>`);
    card.querySelector('#c-yes').addEventListener('click', () => { this.closeModal(); onYes(); });
  },
};

/* ---------- input ---------- */

const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT')) {
    if (e.key === 'Escape' && UI.modal && UI.modal.closable) UI.closeModal();
    return;
  }
  const dir = KEYMAP[e.code];
  if (dir) { input[dir] = true; e.preventDefault(); return; }
  if (!Game.running) return;
  SFX.init();
  if (UI.dialog) {
    if (['Space', 'KeyE', 'Enter', 'KeyJ', 'KeyK', 'KeyZ', 'KeyX'].includes(e.code)) { e.preventDefault(); UI.advanceDialog(); }
    return;
  }
  if (UI.modal) {
    if ((e.code === 'Escape' || (e.code === 'Tab' && UI.modal.name === 'bag') || (e.code === 'KeyI' && UI.modal.name === 'bag')) && UI.modal.closable) { e.preventDefault(); UI.closeModal(); }
    return;
  }
  switch (e.code) {
    case 'Space': case 'KeyJ': case 'KeyZ': e.preventDefault(); Game.mouse.t = 0; if (!e.repeat) useHeld(); break;
    case 'KeyE': case 'KeyK': case 'KeyX': case 'Enter': e.preventDefault(); Game.mouse.t = 0; if (!e.repeat) interact(); break;
    case 'KeyQ': state.sel = (state.sel + HOTBAR - 1) % HOTBAR; UI.dirty = true; break;
    case 'KeyR': state.sel = (state.sel + 1) % HOTBAR; UI.dirty = true; break;
    case 'Tab': case 'KeyI': case 'KeyB': e.preventDefault(); UI.openBag(); break;
    case 'KeyF': eatHeld(); break;
    case 'KeyM': SFX.setMusic(!SFX.musicOn); UI.toast(SFX.musicOn ? 'Music on' : 'Music off'); break;
    case 'Escape': case 'KeyP': UI.openMenu(); break;
    default: {
      const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'].indexOf(e.code);
      if (n >= 0) { state.sel = n; UI.dirty = true; }
    }
  }
});
window.addEventListener('keyup', (e) => { const dir = KEYMAP[e.code]; if (dir) input[dir] = false; });
window.addEventListener('blur', () => { input.up = input.down = input.left = input.right = false; });

canvas.addEventListener('wheel', (e) => {
  if (!Game.running || UI.blocking()) return;
  e.preventDefault();
  state.sel = (state.sel + (e.deltaY > 0 ? 1 : HOTBAR - 1)) % HOTBAR; UI.dirty = true;
}, { passive: false });

$('#dialog').addEventListener('click', () => UI.advanceDialog());

// Click or tap anything within one tile of the farmer. Right-click interacts without using the held item.
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  Object.assign(Game.mouse, { over: true, sx: e.offsetX, sy: e.offsetY, t: performance.now() });
});
canvas.addEventListener('pointerleave', () => { Game.mouse.over = false; canvas.style.cursor = ''; });
canvas.addEventListener('pointerdown', (e) => {
  if (!Game.running) return;
  e.preventDefault();
  SFX.init();
  if (UI.dialog) { UI.advanceDialog(); return; }
  if (UI.blocking()) return;
  if (e.pointerType === 'mouse') Object.assign(Game.mouse, { over: true, sx: e.offsetX, sy: e.offsetY, t: performance.now() });
  const [wx, wy] = screenToWorld(e.offsetX, e.offsetY);
  clickAt(wx, wy, e.button === 2 ? 'act' : 'smart');
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch controls
function bindHold(btn, dir) {
  const on = (e) => { e.preventDefault(); input[dir] = true; btn.classList.add('down'); SFX.init(); };
  const off = (e) => { e.preventDefault(); input[dir] = false; btn.classList.remove('down'); };
  btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off); btn.addEventListener('pointercancel', off);
}
document.querySelectorAll('#touch [data-dir]').forEach(b => bindHold(b, b.dataset.dir));
$('#t-use').addEventListener('pointerdown', (e) => { e.preventDefault(); SFX.init(); if (UI.dialog) UI.advanceDialog(); else useHeld(); });
$('#t-act').addEventListener('pointerdown', (e) => { e.preventDefault(); SFX.init(); if (UI.dialog) UI.advanceDialog(); else interact(); });
$('#btn-bag').addEventListener('click', () => { if (!UI.blocking()) UI.openBag(); });
$('#btn-menu').addEventListener('click', () => { if (!UI.blocking()) UI.openMenu(); });
const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
if (coarse) document.body.classList.add('touch');

/* ---------- boot ---------- */

function startGame(fresh) {
  if (fresh) newState();
  spawnPlayer();
  placeUnicorns();
  particles.length = 0;
  Game.sleeping = Game.passingOut = false;
  Game.running = true;
  Game.fade = 1; Game.fadeDir = -1;
  $('#title').hidden = true;
  $('#hud').hidden = false;
  $('#touch').hidden = !document.body.classList.contains('touch');
  UI.hudCache = {}; UI.dirty = true;
  SFX.init();
  canvas.focus();
  if (fresh) {
    setTimeout(() => UI.say('Wren', 'Welcome to Moonmeadow! Biscuit has been waiting in the pasture. Fill the trough at the stable, brush and pet them every day, and the Moonmilk will flow. Your field could use some work, too.', () =>
      UI.toast('Tip: click anything next to you to use your tool on it. Esc shows all controls.')), 700);
  } else {
    UI.toast(`${dateLabel()} · ${clockLabel()}. Welcome back.`);
    UI.namePending();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(50, now - (Game.last || now));
  Game.last = now;
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (canvas.clientWidth && `${canvas.clientWidth}x${canvas.clientHeight}x${dpr}` !== Game.cssSize) resize();
    if (Game.running) update(dt);
    else {
      Game.t += dt;
      updateUnicorns(dt);
      updateWeatherFx(dt);
      // Slow drift over the pasture behind the title card.
      player.x = 36 * TILE + Math.sin(Game.t / 9000) * 70;
      player.y = 17 * TILE + Math.cos(Game.t / 11000) * 30;
    }
    render();
    UI.tick();
  } catch (e) {
    if (!Game.reported) { Game.reported = true; console.error(e); }
  }
}

function boot(data) {
  buildWorld();
  resize();
  const restored = data && data.state;
  if (restored) { state = restored; startGame(false); }
  else UI.showTitle();
  requestAnimationFrame(frame);
}
