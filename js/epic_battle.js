/* The fight on screen (3 Nov, owner: "do levels and game mechanics like angry birds epic"). The board (board.js) draws the
   world, the camera and the effects; this file stands the heroes and raiders in it, plays back what epic_rules.js says
   happened, and takes the controls: drag a hero to a raider to attack, drag to a friend to support, tap for support on
   yourself, hold to read, drag the bottle to a hero when it is full. */
(function () {
const AF = window.AF, G = AF.G, EP = AF.EP, Bd = AF.Board, sfx = AF.sfx, K = AF.kit;
const T = window.THREE, PI = Math.PI;
const EB = AF.EB = { B: null, on: false, paused: false, auto: false };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = x => x * x * (3 - 2 * x);
const out = x => 1 - (1 - x) * (1 - x);
const fmtN = n => (n >= 100000 ? Math.round(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));

// ---------------- the arena: a short strip of this world's ground, with its scenery behind the fight ----------------
const HSLOT0 = [[-3.8, 0.2], [-5.5, -1.5], [-5.8, 1.6]], ESLOT0 = [[3.8, 0.2], [5.5, -1.5], [5.8, 1.6], [7.5, 0.1], [2.3, -1.9], [2.2, 2.1]];
let HSLOT = HSLOT0, ESLOT = ESLOT0, narrow = false;
const seeded = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }; };
function arenaOf(fight) {
  const src = AF.TD.MAP[fight.map] || AF.TD.MAPS[0], r = seeded(String(fight.id || fight.name));
  if (!src.all) AF.TD.prep(src);
  const bare = new Set(['hall', 'arch', 'flowers', 'portal', 'gate']);
  const pool = src.all.filter(p => !bare.has(p[0]) && p[0] !== src.goal);
  const all = [];
  for (let i = 0; i < 44 && pool.length; i++) {
    const p = pool[Math.floor(r() * pool.length)], x = -24 + r() * 48, z = -7.5 - r() * 14;
    all.push([p[0], x, z, r() * 6.28, (p[4] || 1) * (0.9 + r() * 0.25), p[5]]);
  }
  const bx = narrow ? 5.4 : 9.4;
  return Object.assign({}, src, { bounds: [-bx, bx, -2.4, 3], pts: [[-40, 0.4], [-20, 0.2], [-10, 0.5], [0, 0.2], [10, 0.4], [20, 0.2], [40, 0.3]], roadW: 7.5, all, frontZ: 3.4, tower: null, cam: null, keepClear: HSLOT.concat(ESLOT) });
}

// ---------------- what the rest of the file works with ----------------
let B = null, kit = null, ui = null, tags = null, input = null, dragSvg = null, dragPath = null, preview = null, bottleEl = null, info = null, potBar = null;
const views = new Map();
let timers = [], tweens = [], busy = false, press = null, hoverV = null, armed = false, onEnd = null, time = 0, floaters = [], shownRage = 0, potPick = null;
const wait = s => new Promise(r => timers.push({ t: s, r }));
const tween = (dur, f, ease) => new Promise(r => tweens.push({ t: 0, dur, f, ease: ease || (x => x), r }));
function stepAnims(dt) {
  const d = dt * (EB.auto ? 1.5 : 1);
  for (let i = timers.length - 1; i >= 0; i--) { const q = timers[i]; q.t -= d; if (q.t <= 0) { timers.splice(i, 1); q.r(); } }
  for (let i = tweens.length - 1; i >= 0; i--) {
    const q = tweens[i]; q.t += d;
    const k = Math.min(1, q.t / q.dur);
    q.f(q.ease(k));
    if (k >= 1) { tweens.splice(i, 1); q.r(); }
  }
}

// ---------------- figures ----------------
// hats: what class a hero is wearing. They go on the cube itself, in its own units (1 across, its top about 0.5), in the
// same part lists costumes use. A costume with a hat of its own wins
const GOLD = 0xffd25a, DARK = 0x22242c;
const HATS = {
  cap: c => [['cyl', 0.36, 0.42, 0.2, 0, 0.58, 0, c], ['box', 0.56, 0.04, 0.3, 0, 0.49, 0.36, c]],
  top: c => [['cyl', 0.48, 0.48, 0.03, 0, 0.51, 0, DARK], ['cyl', 0.31, 0.31, 0.38, 0, 0.71, 0, DARK], ['cyl', 0.315, 0.315, 0.08, 0, 0.56, 0, c]],
  band: c => [['box', 1.03, 0.13, 1.03, 0, 0.36, 0, c], ['box', 0.06, 0.26, 0.03, 0.22, 0.26, -0.53, c], ['box', 0.06, 0.2, 0.03, 0.32, 0.28, -0.53, c]],
  wizard: c => [['cyl', 0.56, 0.56, 0.03, 0, 0.51, 0, c], ['cone', 0.4, 0.52, 0, 0.77, 0, c, { seg: 8 }], ['ring', 0.28, 0.03, 0, 0.62, 0, GOLD, { rx: 1.57 }]],
  nurse: () => [['box', 0.56, 0.18, 0.4, 0, 0.59, 0, 0xffffff], ['box', 0.16, 0.05, 0.02, 0, 0.6, 0.205, 0xff4a5a], ['box', 0.05, 0.16, 0.02, 0, 0.6, 0.205, 0xff4a5a]],
  tiara: () => [['cyl', 0.32, 0.34, 0.05, 0, 0.525, 0.04, GOLD], ['cone', 0.07, 0.2, 0, 0.64, 0.3, GOLD, { seg: 4 }], ['cone', 0.055, 0.14, -0.17, 0.6, 0.26, GOLD, { seg: 4 }], ['cone', 0.055, 0.14, 0.17, 0.6, 0.26, GOLD, { seg: 4 }]],
  bandana: c => [['box', 0.94, 0.2, 0.94, 0, 0.47, 0, c], ['cone', 0.1, 0.24, 0.22, 0.46, -0.54, c, { rx: -1.8 }]],
};
const hatOn = (R, def, u) => {
  const worn = def.costume ? AF.soju.wear.COSTUME[def.costume] : null;
  if (!R.cube || (worn && worn.top > 0.56)) return;
  const f = HATS[u.cls.hat];
  if (f) AF.soju.wear.addParts(R.cube, f(AF.CREW[u.animal].c[0]));
};
// how tall everyone stands in a fight, whatever their model's own size
const TALL = { w: 1.15, f: 1.05, b: 1.55, B: 2.7 };
const NATURAL = {};
const naturalOf = (g, type) => { if (NATURAL[type]) return NATURAL[type]; g.scale.setScalar(1); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.updateMatrixWorld(true); const b = new T.Box3().setFromObject(g); return (NATURAL[type] = Math.max(0.3, b.max.y)); };
function addFloor(v, col) {
  const g = new T.RingGeometry(0.56, 0.7, 36); g.rotateX(-PI / 2);
  const ring = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.0, depthWrite: false }));
  ring.material.userData.board = true; ring.position.y = 0.05; ring.renderOrder = 3; v.g.add(ring); v.ring = ring;
  const blob = kit.blob(); v.g.add(blob); v.blob = blob;
}
function heroView(u, slot) {
  const [x, z] = HSLOT[slot], tw = G.towerOf(u.animal), key = AF.formKey(tw);
  const g = new T.Group(); g.position.set(x, 0, z); kit.world.add(g);
  const holder = new T.Group(), S = narrow ? 0.62 : 0.5; holder.scale.setScalar(S); g.add(holder);
  const R = AF.R3.makeRig(holder, key, tw.sh, tw.tr === 'golden');
  hatOn(R, AF.UNIT[key], u);
  const v = { u, g, holder, R, x, z, S, ox: 0, oy: 0, oz: 0, ph: Math.random() * 20, hurt: 0, atk: 0, face: 0.62, h: 1.5, hero: true, hp: u.hp, lean: 0 };
  K.animate(R, 0, R.P);
  g.updateMatrixWorld(true);
  v.h = Math.max(0.9, new T.Box3().setFromObject(holder).max.y);
  g.rotation.y = v.face;
  addFloor(v, 0xffd25a);
  addTag(v);
  if (AF.aura) v.aura = AF.aura.attach(g, () => tw.tr, Object.assign(AF.aura.measure(R, g), { alive: () => u.hp > 0 }));
  views.set(u.id, v);
  return v;
}
function foeView(u, i, fromRight) {
  const [x, z] = ESLOT[Math.min(i, ESLOT.length - 1)];
  const g = kit.foe(u.type);
  const nat = naturalOf(g, u.type), S = ((TALL[u.who] || TALL.w) * (narrow ? 1.3 : 1)) / nat;
  g.scale.setScalar(S); g.position.set(x, 0, z);
  kit.world.add(g);
  const v = { u, g, x, z, S, ox: fromRight ? 11 : 0, oy: 0, oz: 0, ph: Math.random() * 6, hurt: 0, face: -0.62, h: nat * S, foe: true, hp: u.hp, air: u.air, walkIn: fromRight ? 1 : 0, lean: 0 };
  g.rotation.y = v.face;
  if (u.kit === 'golden') g.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.side !== T.BackSide) { o.material = o.material.clone(); o.material.userData.board = true; const l = o.material.color.getHSL({}).l; o.material.color.setHSL(0.13, 0.9, 0.35 + l * 0.5); if (o.material.emissive) { o.material.emissive.set(0x4a3000); o.material.emissiveIntensity = 0.5; } } });
  // the ring sits outside the model's scale, so every raider's target ring is the same size on screen
  const ringG = new T.Group(); ringG.scale.setScalar(1 / S); g.add(ringG);
  const shim = { g: ringG };
  addFloorFoe(shim);
  v.ring = shim.ring;
  addTag(v);
  views.set(u.id, v);
  return v;
}
function addFloorFoe(v) {
  const g = new T.RingGeometry(0.7, 0.88, 36); g.rotateX(-PI / 2);
  const ring = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0, depthWrite: false }));
  ring.material.userData.board = true; ring.position.y = 0.05; ring.renderOrder = 3; v.g.add(ring); v.ring = ring;
}
function addTag(v) {
  const u = v.u, EI = AF.EI, badge = v.foe && (u.boss ? EI.i('crown') : u.kit !== 'brawl' ? EI.kit(u.kit) : '');
  const t = el('div', 'ep-tag ' + (v.hero ? 'h' : 'e') + (u.boss ? ' boss' : '') + (u.kit === 'golden' ? ' gold' : ''), `
    <div class="ep-int"></div><div class="ep-bar">${badge ? `<em>${badge}</em>` : ''}<span><i></i><u></u><b></b></span></div><div class="ep-st"></div>`);
  tags.appendChild(t);
  v.intEl = t.querySelector('.ep-int'); v.intSig = '';
  v.tag = t; v.barI = t.querySelector('.ep-bar i'); v.barU = t.querySelector('.ep-bar u'); v.barN = t.querySelector('.ep-bar b'); v.stEl = t.querySelector('.ep-st');
  paintHp(v); paintSt(v);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function paintHp(v) {
  if (!v.tag) return;
  const p = clamp(v.hp / v.u.max, 0, 1);
  v.barI.style.width = (p * 100).toFixed(1) + '%';
  v.barU.style.width = (p * 100).toFixed(1) + '%';
  v.barN.textContent = v.u.kit === 'golden' ? `${B.stats.coins}` : fmtN(Math.max(0, v.hp));
  v.tag.classList.toggle('low', p < 0.3);
}
function paintSt(v) {
  if (!v.stEl) return;
  v.stEl.innerHTML = v.u.st.filter(s => EP.ST[s.id]).map(s => `<i title="${esc(EP.ST[s.id].n)}">${AF.EI.st(s.id)}${s.id === 'shell' || s.id === 'armor' || s.id === 'chill' ? `<b>${s.v}</b>` : s.t > 0 && s.t < 9 ? `<b>${s.t}</b>` : ''}</i>`).join('');
}
// (4 Nov, owner: "a puzzle"): what each raider means to do next, over its head, and over each hero everything coming at them, in red when it would finish them. Worked out afresh as you act: a taunt, a stun or a kill changes it there and then
function paintIntents() {
  if (!B || !tags) return;
  const show = B.state === 'fight' && B.phase === 'player' && !B.needsWave, inc = {}, I = AF.EI, live = B.heroes.filter(h => h.hp > 0);
  for (const v of views.values()) {
    if (!v.foe || !v.intEl) continue;
    const it = show && v.u.hp > 0 ? EP.intent(B, v.u) : null;
    if (it && it.n) { if (it.k === 'all') for (const h of live) inc[h.id] = (inc[h.id] || 0) + it.n; else if (it.to) inc[it.to] = (inc[it.to] || 0) + it.n; }
    const to = it && it.to ? B.heroes.find(h => h.id === it.to) : null, sig = it ? `${it.ic}|${it.n || ''}|${it.k}|${to ? to.id : ''}` : '';
    if (sig !== v.intSig) { v.intSig = sig; v.intEl.className = 'ep-int k-' + (it ? it.k : 'none'); v.intEl.innerHTML = it ? `${I.i(it.ic)}${it.n ? `<b>${fmtN(it.n)}</b>` : ''}${to ? `<u title="${esc(to.name)}">${I.role(to.role)}</u>` : it.k === 'all' ? `<u>${I.i('t_team')}</u>` : ''}` : ''; }
  }
  for (const v of views.values()) {
    if (!v.hero || !v.intEl) continue;
    const n = show && v.u.hp > 0 ? inc[v.u.id] || 0 : 0, dead = n >= v.u.hp, sig = n ? `${n}|${dead}` : '';
    if (sig !== v.intSig) { v.intSig = sig; v.intEl.className = 'ep-int inc' + (dead ? ' lethal' : ''); v.intEl.innerHTML = n ? `${I.i('sword')}<b>${fmtN(n)}</b>` : ''; }
  }
  const r = ui && ui.querySelector('#epRule');
  if (r) { const list = B.rules || [], sig = list.map(q => q.id).join() + '|' + Math.round((B.heat || 0) * 100); if (r.dataset.sig !== sig) { r.dataset.sig = sig; r.innerHTML = list.map(q => { const R = EP.RULES[q.id]; return `<span class="ep-rl" title="${esc(R.n + '. ' + R.d)}">${I.i(R.ic)}</span>`; }).join('') + (B.heat ? `<b class="ep-heat" title="Raiders are hitting this much harder">+${Math.round(B.heat * 100)}%</b>` : ''); } }
}
let intentTick = 0;

// ---------------- numbers and labels over a figure ----------------
function floatText(x, y, text, cls) {
  const f = el('div', 'ep-num ' + (cls || ''), esc(text));
  f.style.left = x + 'px'; f.style.top = y + 'px';
  tags.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}
const headOf = v => { const [x, y] = Bd.screenOf(v.x + v.ox, v.z + v.oz, v.h * 0.82 + v.oy); return [x, y]; };
const say = (v, text, cls) => { const [x, y] = headOf(v); floatText(x, y, text, cls); };
// what happened, as a picture over the figure
const sayI = (v, svg) => { const [x, y] = headOf(v), f = el('div', 'ep-num ic', svg); f.style.left = x + 'px'; f.style.top = y + 'px'; tags.appendChild(f); setTimeout(() => f.remove(), 1000); };

// ---------------- effects: the board's VFX when it is on, nothing when not ----------------
const FX = {
  hit(v, big, cols) { const V = kit.V; if (!V || !V.on) return; const x = v.x + v.ox, y = v.h * 0.45 + v.oy, z = v.z + v.oz; V.burst(true, x, y, z, big ? 18 : 9, { cols: cols || [0xffffff, 0xffd25a, 0xff8a3a], speed: [2, 5], life: [0.22, 0.42], size: [big ? 0.3 : 0.2, 0], cell: V.CELL.dot, grav: 6 }); V.burst(false, x, y * 0.4, z, 4, { cols: [0xd8ccb4], speed: [0.5, 1.4], life: [0.3, 0.5], size: [0.28, 0.5], cell: V.CELL.smoke, flat: true }); if (big) V.shake(0.16); },
  heal(v) { const V = kit.V; if (!V || !V.on) return; V.burst(true, v.x + v.ox, 0.2, v.z + v.oz, 12, { cols: [0x7ee8a0, 0xd8ffe0], speed: [0.3, 0.8], up: 2.2, life: [0.5, 0.9], size: [0.16, 0.04], cell: V.CELL.star, spread: 0.45, flatSpread: true }); },
  buff(v, col) { const V = kit.V; if (!V || !V.on) return; V.burst(true, v.x + v.ox, 0.1, v.z + v.oz, 10, { cols: [col || 0xffd25a, 0xffffff], speed: [0.2, 0.6], up: 2.6, life: [0.4, 0.7], size: [0.14, 0.02], cell: V.CELL.dot, spread: 0.5, flatSpread: true }); },
  puff(v) { const V = kit.V; if (!V || !V.on) return; V.burst(false, v.x + v.ox, 0.6, v.z + v.oz, 14, { cols: [0xe8e0d0, 0xc8c0b0], speed: [0.6, 2], life: [0.4, 0.8], size: [0.4, 0.9], cell: V.CELL.smoke }); V.burst(true, v.x + v.ox, 0.8, v.z + v.oz, 10, { cols: [0xffd25a, 0xffffff], speed: [2, 5], life: [0.25, 0.5], size: [0.14, 0], cell: V.CELL.star, grav: 4 }); },
  slash(v, flip) { const V = kit.V; if (!V || !V.on) return; V.slash(v.x + v.ox - 0.1, v.h * 0.5, v.z + v.oz + 0.1, { r: 1.5, dur: 0.22, ang: flip ? PI / 2 : -PI / 2, col: 0xffa04a, flip }); },
  bolt(a, b, col) { const V = kit.V; if (!V || !V.on) return; V.bolt([a.x + a.ox, a.h * 0.8, a.z + a.oz], [b.x + b.ox, b.h * 0.5, b.z + b.oz], { col, dur: 0.2, w: 0.14 }); },
  ringOf(v, col) { const V = kit.V; if (!V || !V.on) return; V.ripple(v.x + v.ox, 0.1, v.z + v.oz, 0.02, 1.4); V.burst(true, v.x + v.ox, 0.1, v.z + v.oz, 16, { cols: [col || 0xffffff], speed: [2.4, 3], life: [0.3, 0.4], size: [0.12, 0], cell: V.CELL.dot, flat: true }); },
  rage(v) { const V = kit.V; if (!V || !V.on) return; V.flash(0xffe9a0, 0.3); V.shake(0.26); V.chroma(0.4); V.burst(true, v.x + v.ox, 1, v.z + v.oz, 44, { cols: [0xffe14a, 0x9dff7a, 0xffffff], speed: [3, 8], life: [0.4, 0.8], size: [0.3, 0], cell: V.CELL.star }); },
};
// what a thrower sends across: the hero's projectile, the very model it wears on its tower page
function projectileOf(v) {
  if (v.shot !== undefined) return v.shot;
  const X = AF.TDFX, L = X && X.lend ? X.lend() : null, wear = AF.soju.wear;
  if (!L || !v.hero) return (v.shot = null);
  const tw = G.towerOf(v.u.animal), c = X.ctx({ id: 'ep:' + tw.k, lv: 0, u: tw, s: {} });
  let shape = c.shape && L.MODELS[c.shape] ? c.shape : null, spin = (c.A && c.A.spin) || 9;
  if (!shape) { const d = wear.shotOf(v.u.animal); if (d) { shape = d.shape; spin = d.spin || 9; } }
  // (4 Nov, owner: "make projectiles show during expeidion runs i cant see them"): a skin's spin is a word, "flat", "tumble" or "roll". Multiplied as a number it turned the model's rotation to NaN and it drew as nothing
  const turn = typeof spin === 'number' ? [spin, 0, spin * 0.6] : spin === 'flat' ? [0, 11, 0] : spin === 'roll' ? [0, 0, 12] : [9, 0, 5.4];
  return (v.shot = shape ? { L, c, shape, turn } : null);
}
async function throwAt(a, b, dur = 0.46) { // long enough to see it fly
  const sh = projectileOf(a), ax = a.x + a.ox + 0.35, az = a.z + a.oz, ay = a.h * 0.7, bx = b.x + b.ox, bz = b.z + b.oz, by = b.h * 0.55;
  sfx('tdShot');
  if (sh && kit.V && kit.V.on) {
    const g = sh.L.take(sh.shape, sh.c);
    await tween(dur, k => { g.position.set(ax + (bx - ax) * k, ay + (by - ay) * k + Math.sin(k * PI) * 1.1, az + (bz - az) * k); g.rotation.set(k * sh.turn[0], k * sh.turn[1], k * sh.turn[2]); });
    sh.L.give(g);
  } else {
    const V = kit.V;
    if (V && V.on) V.bolt([ax, ay, az], [bx, by, bz], { col: 0xffd25a, dur });
    await wait(dur);
  }
}

// a hero who fights up close, or by magic, still shows what it wears: a few fly off the target on the hit
function flingAt(a, b, n = 3) {
  const sh = projectileOf(a);
  if (!sh || !kit.V || !kit.V.on) return;
  const x = b.x + b.ox, z = b.z + b.oz, y = b.h * 0.55;
  for (let i = 0; i < n; i++) {
    const g = sh.L.take(sh.shape, sh.c), t = (i / n) * PI * 2 + Math.random(), sp = 1.1 + Math.random() * 0.7, up = 1 + Math.random();
    tween(0.6, k => { g.position.set(x + Math.cos(t) * sp * k, y + up * k - 2.2 * k * k, z + Math.sin(t) * sp * 0.5 * k); g.rotation.set(k * sh.turn[0], k * sh.turn[1], k * sh.turn[2]); }).then(() => sh.L.give(g));
  }
}
// (4 Nov, owner: "make sure projectile skins actually work and maybe make them like hit particles like minecraft too ... some of the heroes are melee"): every hit by a hero
// knocks little square chips off the target, in the colours of its projectile skin, or the hero's own without one. They fall and land.
const chipGeo = new T.BoxGeometry(1, 1, 1), chipMats = new Map();
const chipMat = c => { let m = chipMats.get(c); if (!m) { m = new T.MeshBasicMaterial({ color: c, toneMapped: false }); chipMats.set(c, m); } return m; };
function chips(v, by, big) {
  if (!kit.world || !by || !by.hero) return;
  const tw = G.towerOf(by.u.animal), id = tw && G.wearing(tw).theme, wear = AF.soju.wear, cols = (id && wear.colorsOf(wear.THEME[id])) || (heroColor(by) || [0xffffff]), n = big ? 16 : 9;
  const x = v.x + v.ox, y = v.h * 0.5 + v.oy, z = v.z + v.oz;
  EB.lastChips = { n, cols, id: id || null };
  for (let i = 0; i < n; i++) {
    const m = new T.Mesh(chipGeo, chipMat(cols[i % cols.length])), a = Math.random() * PI * 2, sp = 0.6 + Math.random() * 1.2, up = 1.4 + Math.random() * 1.6, s = 0.05 + Math.random() * 0.06;
    m.scale.setScalar(s); m.position.set(x, y, z); kit.world.add(m);
    const life = 0.5 + Math.random() * 0.25;
    tween(life, k => { const t = k * life, h = y + up * t - 5.2 * t * t; m.position.set(x + Math.cos(a) * sp * t, Math.max(s / 2, h), z + Math.sin(a) * sp * 0.6 * t); m.rotation.set(t * 7, t * 5, 0); m.scale.setScalar(s * (k > 0.72 ? (1 - k) / 0.28 : 1)); }).then(() => kit.world.remove(m));
  }
}
// ---------------- moves on screen ----------------
const viewOf = id => views.get(id);
const lunge = (v, to, dur) => {
  const x0 = v.ox, z0 = v.oz, dx = to.x + to.ox - v.x + (v.hero ? -1.15 : 1.15) * (to.u.size > 1.3 ? 1.3 : 1), dz = to.z + to.oz - v.z + 0.05;
  v.walk = 1;
  return tween(dur, k => { v.ox = x0 + (dx - x0) * k; v.oz = z0 + (dz - z0) * k; }, smooth).then(() => { v.walk = 0; });
};
const backHome = (v, dur) => {
  const x0 = v.ox, z0 = v.oz; v.walk = 1;
  return tween(dur, k => { v.ox = x0 * (1 - k); v.oz = z0 * (1 - k); }, smooth).then(() => { v.walk = 0; v.ox = 0; v.oz = 0; });
};
const swingArm = v => { v.atk = 1; };
const armsUp = v => { v.atk = 1; };

async function doAct(ev, fx) {
  const a = viewOf(ev.by), to = viewOf(ev.to);
  if (!a) { await applyAll(fx); return; }
  const hits = fx.filter(e => e.t === 'hit' && e.by === ev.by || e.t === 'miss' && e.by === ev.by || e.t === 'bounce' && e.by === ev.by);
  // 1: a hero or raider's own attack
  if (ev.kind === 'attack') {
    const style = a.hero ? a.u.style : a.air ? 'throw' : 'melee';
    if (style === 'melee' && to) {
      await lunge(a, to, 0.2);
      swingArm(a); sfx('tdSlash'); FX.slash(to, !a.hero);
      if (a.hero) flingAt(a, to);
      await wait(0.08);
      await applySpaced(fx, ev.by, 0.11);
      await wait(0.08);
      await backHome(a, 0.22);
    } else if (style === 'throw') {
      swingArm(a); await wait(0.1);
      await throwSeq(a, fx, ev.by, to);
    } else {
      armsUp(a); await wait(0.2); sfx('tdZap');
      await castSeq(a, fx, ev.by, to);
    }
    return;
  }
  if (ev.kind === 'charge') { armsUp(a); sfx('charge'); FX.buff(a, 0xff5a3a); await wait(0.2); await applyAll(fx); await wait(0.22); return; }
  if (ev.kind === 'slam') { armsUp(a); await wait(0.22); kit.V && kit.V.on && kit.V.shake(0.3); sfx('tdBoom'); if (kit.V && kit.V.on) kit.V.burst(false, a.x, 0.2, a.z, 18, { cols: [0xd8ccb4], speed: [2, 5], life: [0.4, 0.7], size: [0.4, 0.8], cell: kit.V.CELL.smoke, flat: true }); await applySpaced(fx, ev.by, 0.08); await wait(0.15); return; }
  if (ev.kind === 'rage') {
    sfx('burst'); FX.rage(a); bigBanner(ev.n);
    armsUp(a); await wait(0.42);
    if (hits.length && hits[0].to !== a.u.id) await castSeq(a, fx, ev.by, null, true);
    else { await applySpaced(fx, ev.by, 0.08); }
    await wait(0.2);
    return;
  }
  // support, or a raider casting
  armsUp(a); await wait(0.2); sfx('chime', { i: 5 });
  if (to && to !== a) FX.bolt(a, to, a.hero ? 0x8fffb0 : 0xc79bff);
  if (ev.all) for (const v of views.values()) if (v.hero && v.u.hp > 0) FX.buff(v);
  await applySpaced(fx, ev.by, 0.06);
  await wait(0.2);
}
async function applyAll(list) { for (const e of list) await apply(e); }
// everything, with a beat between hits
async function applySpaced(list, by, gap) { for (const e of list) { if (e.t === 'hit') { await apply(e); await wait(gap); } else await apply(e); } }
async function throwSeq(a, fx, by, firstTo) {
  let i = 0;
  while (i < fx.length) {
    const e = fx[i];
    if ((e.t === 'hit' || e.t === 'miss' || e.t === 'bounce') && e.by === by) {
      const b = viewOf(e.to) || firstTo;
      if (b && b !== a && !e.fx) { swingArm(a); await throwAt(a, b); }
      await apply(e); i++;
      while (i < fx.length && !((fx[i].t === 'hit' || fx[i].t === 'miss' || fx[i].t === 'bounce') && fx[i].by === by)) { await apply(fx[i]); i++; }
    } else { await apply(e); i++; }
  }
}
async function castSeq(a, fx, by, firstTo, big) {
  for (const e of fx) {
    if (e.t === 'hit' && e.by === by) {
      const b = viewOf(e.to);
      if (b) { FX.bolt(a, b, a.hero ? AF.CREW[a.u.animal].c[0] : 0xc79bff); FX.ringOf(b, a.hero ? AF.CREW[a.u.animal].c[0] : 0xffffff); if (a.hero) throwAt(a, b, 0.36); }
      await wait(big ? 0.09 : 0.06);
    }
    await apply(e);
  }
  await wait(0.1);
}
const heroColor = v => (v.hero ? AF.CREW[v.u.animal].c : null);
async function apply(ev) {
  const v = viewOf(ev.to), I = AF.EI;
  switch (ev.t) {
    case 'crack': if (v) paintSt(v); return;
    case 'say': if (v) { sayI(v, I.i(ev.ic)); paintSt(v); } return;
    case 'hit': {
      if (!v) return;
      v.hp = ev.hp; v.hurt = 1; paintHp(v);
      const big = ev.crit || ev.n > v.u.max * 0.25;
      if (!ev.self) { const by = viewOf(ev.by); FX.hit(v, big, by && heroColor(by) ? heroColor(by).concat([0xffffff]) : null); chips(v, by, big); }
      say(v, fmtN(ev.n), (v.hero ? 'hurt' : 'dmg') + (ev.crit ? ' crit' : '') + (ev.dot ? ' dot' : ''));
      if (!ev.dot) sfx('tdKill', { i: 0 });
      return;
    }
    case 'heal': if (!v) return; v.hp = ev.hp; paintHp(v); FX.heal(v); sfx('heal'); say(v, '+' + fmtN(ev.n), 'heal'); return;
    case 'miss': if (v) sayI(v, I.i('x')); return;
    case 'resist': if (v) sayI(v, I.i('st_shield2')); return;
    case 'bounce': if (v) { sayI(v, I.i('bubble')); FX.ringOf(v, 0x7fd8ff); } return;
    case 'st':
      if (!v) return;
      paintSt(v);
      if (ev.on && ev.id && EP.ST[ev.id]) { const D = EP.ST[ev.id]; sayI(v, I.st(ev.id)); FX.buff(v, parseInt(D.c.slice(1), 16)); }
      return;
    case 'dispel': if (v) { paintSt(v); sayI(v, I.i('st_shield2')); FX.ringOf(v, 0xffffff); } return;
    case 'cleanse': if (v) { paintSt(v); sayI(v, I.i('plus')); FX.heal(v); } return;
    case 'die':
      if (!v) return;
      v.hp = 0; paintHp(v); paintSt(v); FX.puff(v); sfx(v.hero ? 'drop' : 'pop', { i: 4 }); // one hero going down is a thud: the losing jingle is for losing the fight
      v.dying = 1; v.tag.classList.add('out');
      await wait(0.12);
      return;
    case 'revive':
      if (!v) return;
      v.hp = ev.hp; v.dying = 0; v.dead = false; v.g.visible = true; v.tag.classList.remove('out'); paintHp(v); sayI(v, I.i('grave')); FX.heal(v);
      return;
    case 'rage': setBottle(ev.v, ev.d); return;
    case 'drain': bottleEl && bottleEl.classList.add('drained'); setTimeout(() => bottleEl && bottleEl.classList.remove('drained'), 500); return;
    case 'coin': if (v) { const [x, y] = headOf(v); floatText(x + 30, y, '+' + ev.n, 'coin'); paintHp(v); sfx('coin', { i: 4 }); } return;
    case 'spawn': { const u = EP.unit(B, ev.to); if (u) { const fv = foeView(u, slotFree(), false); fv.oy = 3; await tween(0.28, k => { fv.oy = 3 * (1 - k * k); }); sfx('drop'); FX.ringOf(fv, 0xffffff); } return; }
    case 'wave': await waveIn(ev); return;
    case 'enemy': paintTurn(); await wait(0.28); return;
    case 'player': paintTurn(); return;
    case 'stunned': if (v) sayI(v, I.i('stars')); await wait(0.25); return;
    case 'flee': if (v) { sayI(v, I.i('coin')); v.dying = 0; await tween(0.5, k => { v.ox = 12 * k * k; }); v.g.visible = false; v.dead = true; v.tag.classList.add('out'); } return;
    case 'again': if (v) sayI(v, I.i('retry')); return;
    case 'potion': if (v) FX.heal(v); sfx('collect', { i: 4 }); paintHud(); return;
    case 'xp2': if (viewOf(B.heroes[0].id)) sayI(viewOf(B.heroes[0].id), I.i('xp')); return;
    default:
  }
}
function slotFree() {
  const used = new Set([...views.values()].filter(v => v.foe && v.u.hp > 0).map(v => v.x + ',' + v.z));
  for (let i = 0; i < ESLOT.length; i++) if (!used.has(ESLOT[i][0] + ',' + ESLOT[i][1])) return i;
  return ESLOT.length - 1;
}
async function waveIn(ev) {
  for (const [id, v] of views) if (v.foe) { removeFoe(v); views.delete(id); }
  ev.foes.forEach((id, i) => { const u = EP.unit(B, id); if (u) foeView(u, u.boss ? 0 : i, true); });
  paintHud();
  if (ev.of > 1) waveBanner(ev.n, ev.of, ev.n === ev.of && B.stage.boss);
  sfx('whoosh');
  const list = [...views.values()].filter(v => v.foe);
  for (const v of list) v.walk = 1;
  await tween(0.62, k => { for (const v of list) v.ox = 11 * (1 - k); }, out);
  for (const v of list) { v.walk = 0; v.ox = 0; v.walkIn = 0; }
  await wait(0.1);
}
function removeFoe(v) {
  if (v.tag) v.tag.remove();
  if (v.ring && v.ring.parent) { v.ring.parent.parent && v.ring.parent.parent.remove(v.ring.parent); v.ring.geometry.dispose(); }
  kit.world.remove(v.g); v.g.visible = true; v.g.position.set(0, 0, 0); v.g.rotation.set(0, 0, 0);
  if (v.u.kit !== 'golden') kit.freeFoe(v.g, v.u.type);
}

// ---------------- the flow of a fight ----------------
async function play(evs) {
  if (!evs) return;
  let i = 0;
  while (i < evs.length && EB.on) {
    const ev = evs[i++];
    if (ev.t === 'act') {
      const fx = [];
      while (i < evs.length && evs[i].t !== 'act' && evs[i].t !== 'beat') fx.push(evs[i++]);
      await doAct(ev, fx);
    } else if (ev.t === 'beat') await wait(0.1);
    else await apply(ev);
  }
}
async function flow(evs) {
  busy = true; paintHud();
  await play(evs);
  const B0 = B;
  while (EB.on && B === B0) {
    if (B.state !== 'fight') { paintHud(); await wait(0.5); if (EB.on && B === B0 && onEnd) onEnd(B); return; }
    if (B.needsWave) { await wait(0.35); await play(EP.nextWave(B)); continue; }
    if (EP.needsEnd(B)) { await wait(0.2); await play(EP.endTurn(B)); continue; }
    if (EB.auto) {
      const h = B.heroes.find(u => EP.canAct(B, u));
      const bottle = EP.decideBottle(B);
      if (bottle) { await play(EP.bottomsUp(B, bottle)); continue; }
      if (h) { const m = EP.decide(B, h); await play(m.k === 'support' ? EP.support(B, h, m.to) : EP.attack(B, h, m.to)); continue; }
    }
    break;
  }
  busy = false; paintHud();
}
EB.busy = () => busy;
EB.auras = () => [...views.values()].map(v => v.aura).filter(Boolean);
// for the dev panel: the fight was changed from outside, so catch up
EB.syncBottle = () => { setBottle(B.rage); };
EB.kick = () => { if (busy) return; for (const v of views.values()) { if (v.u.hp <= 0 && !v.dead && !v.dying) { v.hp = 0; paintHp(v); v.dying = 1; if (v.tag) v.tag.classList.add('out'); } } EP.settle(B); flow([]); };

// ---------------- the frame ----------------
function poseView(v, dt) {
  const u = v.u;
  v.hurt = Math.max(0, v.hurt - dt * 5);
  if (v.dying > 0 && !v.dead) {
    v.dying = Math.max(0, v.dying - dt * 3.2);
    const k = v.dying;
    v.g.scale.setScalar((v.hero ? 1 : v.S) * Math.max(0.02, k));
    if (k <= 0) { v.dead = true; v.g.visible = false; v.g.scale.setScalar(v.hero ? 1 : v.S); }
  }
  if (v.dead) return;
  v.g.position.set(v.x + v.ox, v.oy + (v.air ? Math.sin(time * 2 + v.ph) * 0.1 : 0), v.z + v.oz);
  const shake = v.hurt > 0 ? Math.sin(time * 60) * 0.07 * v.hurt : 0;
  v.g.position.x += shake;
  if (v.hero) {
    const R = v.R;
    R.atk = v.atk || 0;
    K.animate(R, time + v.ph, R.P); // its signature move, when R.atk is up
    if (v.atk > 0) v.atk = Math.max(0, v.atk - dt * 3.4);
    // a cube has no legs: it leans into a run with a small hop, and rocks back when hit
    v.holder.rotation.x = (v.walk ? 0.28 : 0) - v.hurt * 0.32;
    v.holder.position.y = v.walk ? Math.abs(Math.sin(time * 15)) * 0.2 : 0;
    // a beaten-down hero: a little slump
    const p = v.hp / u.max;
    v.g.rotation.z = p < 0.3 ? -0.08 : 0;
    const can = B && B.state === 'fight' && !busy && EP.canAct(B, u);
    const target = hoverV === v;
    v.ring.material.opacity = can ? 0.5 + Math.sin(time * 4) * 0.25 : target ? 0.9 : 0.14;
    v.ring.material.color.set(target ? 0x9dff7a : can ? 0xffd25a : 0xffffff);
  } else {
    const g = v.g, w = time * 3 + v.ph;
    g.rotation.z = Math.sin(w) * 0.03;
    const legs = g.userData.legs || [];
    legs.forEach((l, i) => { l.rotation.x = v.walk ? Math.sin(time * 14 + i * PI) * 0.8 : Math.sin(w * 0.5 + i * PI) * 0.06; });
    if (g.userData.anim) g.userData.anim(w * 2);
    g.scale.setScalar(v.S * (1 + v.hurt * 0.1) * (v.dying > 0 ? Math.max(0.02, v.dying) : 1));
    v.ring.material.opacity = hoverV === v ? 0.95 : 0;
    // charging: it swells and glows
    if (EP.has(u, 'charge') && !(v.dying > 0)) g.scale.setScalar(v.S * (1.08 + Math.sin(time * 9) * 0.05));
  }
  const [sx, sy] = Bd.screenOf(v.x + v.ox, v.z + v.oz, v.h + v.oy + 0.1);
  v.tag.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
}
EB.frame = dt => {
  if (!EB.on) return;
  time += dt;
  if (!EB.paused) stepAnims(dt);
  for (const v of views.values()) poseView(v, EB.paused ? 0 : dt);
  if (++intentTick % 10 === 0) paintIntents();
};
EB.key = e => {
  if (!EB.on) return false;
  if (e.key === 'Escape') { togglePause(); return true; }
  if (e.key === 'a' || e.key === 'A') { pressAuto(); return true; }
  return false;
};

// ---------------- the controls ----------------
function pickAt(px, py) {
  let best = null, bd = Infinity;
  for (const v of views.values()) {
    if (v.dead || v.u.hp <= 0) continue;
    const [fx, fy] = Bd.screenOf(v.x + v.ox, v.z + v.oz, 0), [, ty] = Bd.screenOf(v.x + v.ox, v.z + v.oz, v.h);
    const hw = Math.max(46, (fy - ty) * 0.42);
    const dx = Math.abs(px - fx), inY = py <= fy + 20 && py >= ty - 12;
    if (dx < hw && inY) { const d = dx + Math.abs(py - (fy + ty) / 2) * 0.5; if (d < bd) { bd = d; best = v; } }
  }
  return best;
}
const ptr = e => { const r = input.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
// (3 Nov, owner: "make the drag snap") the nearest figure within reach grabs the line, so a rough drag lands where you meant
const centreOf = v => { const [x, y] = Bd.screenOf(v.x + v.ox, v.z + v.oz, v.h * 0.5); return [x, y]; };
function snapAt(px, py, range, heroesOnly) {
  let best = null, bd = range * range;
  for (const v of views.values()) {
    if (v.dead || v.u.hp <= 0 || (heroesOnly && !v.hero)) continue;
    const [x, y] = centreOf(v), d = (x - px) ** 2 + (y - py) ** 2;
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}
const SNAP = () => Math.max(110, innerWidth * 0.11);
let snapped = null;
function setSnap(v) { if (v !== snapped) { snapped = v; hoverV = v; if (v) sfx('tick', { i: 3 }); } }
function drawDrag(ax, ay, bx, by, col, locked) {
  const lift = Math.abs(bx - ax) * 0.18 + 26, mx = (ax + bx) / 2, my = Math.min(ay, by) - lift, ang = Math.atan2(by - my, bx - mx);
  dragPath.setAttribute('d', `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`);
  dragPath.style.stroke = col;
  dragSvg.classList.toggle('locked', !!locked);
  const head = dragSvg.querySelector('polygon');
  head.setAttribute('points', '0,-13 26,0 0,13');
  head.setAttribute('transform', `translate(${bx} ${by}) rotate(${ang * 180 / PI}) translate(-12 0)`);
  head.style.fill = col;
  dragSvg.style.display = 'block';
}
const hideDrag = () => { dragSvg.style.display = 'none'; preview.style.display = 'none'; hoverV = null; snapped = null; };
function showPreview(x, y, icon, title, body, cls) {
  preview.className = 'ep-preview ' + (cls || '');
  preview.innerHTML = `<i>${icon}</i><span><b>${esc(title)}</b>${body}</span>`;
  preview.style.display = 'flex';
  const w = preview.offsetWidth, h = preview.offsetHeight;
  preview.style.left = clamp(x - w / 2, 8, innerWidth - w - 8) + 'px'; preview.style.top = clamp(y - h - 74, 8, innerHeight - h - 8) + 'px';
}
function describe(v) {
  const u = v.u, I = AF.EI;
  const row = (icon, sk) => `<div class="ep-i-r" title="${esc(sk.d)}"><i>${icon}</i><span><b>${esc(sk.n)}</b>${I.chips(sk)}</span></div>`;
  const sts = u.st.filter(s => EP.ST[s.id]).map(s => `<span class="ep-i-st" title="${esc(EP.ST[s.id].d)}">${I.st(s.id)}<b>${esc(EP.ST[s.id].n)}</b></span>`).join('');
  if (v.hero) {
    const C = u.cls;
    return `<h4>${I.hat(C.hat)}${esc(u.name)}<small>${esc(C.n)}</small></h4>${row(I.i(EP.SIG[u.animal].ic), EP.SIG[u.animal])}${row(I.i('sword'), C.a)}${row(I.i('t_ally'), C.s)}${row(I.i('bottle'), EP.HEROES[u.animal].rage)}${sts ? `<div class="ep-i-sts">${sts}</div>` : ''}`;
  }
  const Kit = EP.KITS[u.kit];
  const it = B.phase === 'player' && u.hp > 0 ? EP.intent(B, u) : null, tg = it && it.to ? B.heroes.find(h => h.id === it.to) : null;
  const next = it ? `<div class="ep-i-next">${I.i(it.ic)}<b>${it.k === 'stun' ? 'Stunned' : it.k === 'hold' ? 'Holding the shield up' : it.k === 'all' ? `All, ${fmtN(it.n)} each` : it.k === 'cast' ? (tg ? `Casting on ${esc(tg.name)}` : 'Casting') : `${esc(tg ? tg.name : '')} ${fmtN(it.n)}`}</b></div>` : '';
  const locks = u.boss ? EP.locksOf(B.stage).filter(id => id !== 'aloft' && id !== 'caster').map(id => { const L = EP.LOCKS[id]; return `<span class="ep-i-st" title="${esc(L.d)}">${I.i(L.ic)}<b>${esc(L.n)}</b></span>`; }).join('') : '';
  return `<h4>${I.kit(u.kit)}${esc(u.name)}<small>${esc(Kit.n)}</small></h4><p>${esc(Kit.d)}</p>${next}${sts ? `<div class="ep-i-sts">${sts}</div>` : ''}${locks ? `<div class="ep-i-sts">${locks}</div>` : ''}`;
}
function showInfo(v) {
  info.innerHTML = describe(v);
  info.style.display = 'block';
  const [x, y] = headOf(v), w = info.offsetWidth, h = info.offsetHeight;
  info.style.left = clamp(x - w / 2, 8, innerWidth - w - 8) + 'px'; info.style.top = clamp(y - h - 24, 8, innerHeight - h - 8) + 'px';
}
const hideInfo = () => { if (info) info.style.display = 'none'; };
function onDown(e) {
  if (EB.paused || !B) return;
  const [px, py] = ptr(e), v = pickAt(px, py);
  hideInfo();
  if (potPick) { const t = snapAt(px, py, SNAP(), true); if (t) usePotion(potPick, t.u); else { potPick = null; paintPots(); } return; }
  if (!v) { armed = false; paintBottle(); return; }
  if (armed && v.hero) { armed = false; fireBottle(v.u); return; }
  press = { v, x0: px, y0: py, moved: false, shown: false, t: performance.now() };
  press.hold = setTimeout(() => { if (press && !press.moved) { press.shown = true; showInfo(v); } }, 380);
  try { input.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
}
function onMove(e) {
  if (!B) return;
  const [px, py] = ptr(e);
  if (!press) {
    if (bottlePress) { moveBottle(px, py); return; }
    const v = EB.paused ? null : pickAt(px, py);
    input.style.cursor = v && !busy && (v.foe || EP.canAct(B, v.u)) ? 'pointer' : '';
    return;
  }
  if (!press.moved && Math.hypot(px - press.x0, py - press.y0) > 11) { press.moved = true; hideInfo(); clearTimeout(press.hold); paintGhost(); }
  if (!press.moved) return;
  const h = press.v;
  if (!h.hero || busy || !EP.canAct(B, h.u)) return;
  const t = snapAt(px, py, SNAP()), [ax, ay] = centreOf(h), I = AF.EI, C = h.u.cls;
  setSnap(t);
  if (t) {
    const [tx, ty] = centreOf(t);
    drawDrag(ax, ay, tx, ty, t.foe ? '#ff7a5a' : '#9dff7a', true);
    if (t.foe) showPreview(tx, ty, I.i('sword'), C.a.n, I.chips(C.a), 'atk');
    else showPreview(tx, ty, I.i('t_ally'), C.s.n, I.chips(C.s), 'sup');
  } else { drawDrag(ax, ay, px, py, '#ffffff', false); preview.style.display = 'none'; }
}
function onUp(e) {
  if (!press || !B) return;
  clearTimeout(press.hold);
  const p = press; press = null;
  const [px, py] = ptr(e), h = p.v, t = p.moved ? snapAt(px, py, SNAP()) : null;
  hideDrag();
  if (p.shown) { hideInfo(); return; }
  if (busy) return;
  if (!p.moved) {
    // a quick tap: support on yourself for a hero who can still act; reading for anyone else
    if (h.hero && EP.canAct(B, h.u)) { flow(EP.support(B, h.u, h.u)); return; }
    showInfo(h); setTimeout(hideInfo, 1800);
    return;
  }
  if (!h.hero || !EP.canAct(B, h.u) || !t) return;
  if (t.foe) flow(EP.attack(B, h.u, t.u));
  else flow(EP.support(B, h.u, t.u));
}
// the bottle: drag it to a hero, or tap it and then tap a hero
let bottlePress = null;
function fireBottle(u) {
  if (busy || B.rage < 100) return;
  armed = false; paintBottle();
  flow(EP.bottomsUp(B, u));
}
function moveBottle(px, py) {
  const r = bottleEl.getBoundingClientRect(), box = input.getBoundingClientRect();
  bottlePress.moved = bottlePress.moved || Math.hypot(px - bottlePress.x0, py - bottlePress.y0) > 10;
  if (!bottlePress.moved) return;
  const t = snapAt(px, py, 9999, true), I = AF.EI;
  setSnap(t);
  if (t) { const [tx, ty] = centreOf(t), R = EP.HEROES[t.u.animal].rage; drawDrag(r.left + r.width / 2 - box.left, r.top + 10 - box.top, tx, ty, '#ffe14a', true); showPreview(tx, ty, I.i('bottle'), R.n, I.chips(R), 'rage'); }
}
function onBottleDown(e) {
  e.preventDefault(); e.stopPropagation();
  if (!B || EB.paused) return;
  if (B.rage < 100 || busy) { sfx('error'); return; }
  const [px, py] = ptr(e);
  bottlePress = { x0: px, y0: py, moved: false };
  window.addEventListener('pointermove', bottleMove);
  window.addEventListener('pointerup', bottleUp, { once: true });
}
const bottleMove = e => { if (bottlePress) { const [px, py] = ptr(e); moveBottle(px, py); } };
function bottleUp(e) {
  window.removeEventListener('pointermove', bottleMove);
  if (!bottlePress) return;
  const p = bottlePress; bottlePress = null;
  const [px, py] = ptr(e); hideDrag();
  if (!p.moved) { armed = !armed; paintBottle(); return; }
  const t = snapAt(px, py, 9999, true);
  if (t) fireBottle(t.u);
}

// ---------------- the HUD ----------------
function setBottle(v) { shownRage = v; paintBottle(); }
function paintBottle() {
  if (!bottleEl) return;
  // the full bottle shows from the bottom up: 8% to 94% of the picture is the bottle itself
  bottleEl.querySelector('.ep-gauge .f').style.clipPath = `inset(${(94 - 86 * (shownRage / 100)).toFixed(1)}% 0 0 0)`;
  const full = shownRage >= 100;
  bottleEl.classList.toggle('full', full);
  bottleEl.classList.toggle('armed', armed);
}
function waveBanner(n, of, boss) {
  const b = el('div', 'ep-wavebn', boss ? AF.EI.i('crown') : Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''));
  ui.appendChild(b); setTimeout(() => b.remove(), 1000);
}
function bigBanner(text) {
  const b = el('div', 'ep-rage', `${AF.EI.i('bottle')}${esc(text)}`);
  ui.appendChild(b); setTimeout(() => b.remove(), 900);
}
const paintTurn = () => { const t = ui && ui.querySelector('#epTurn'); if (t) t.classList.toggle('foes', B.phase === 'enemy'); };
function paintWaves() {
  const w = ui.querySelector('#epWave');
  if (w) w.innerHTML = Array.from({ length: B.waves.length }, (_, i) => `<i class="${i < B.wave ? 'done' : i === B.wave ? 'on' : ''}"></i>`).join('');
}
// first fights: a ghost hand shows the drag, instead of a line of words
function paintGhost() {
  const g = ui && ui.querySelector('#epGhost'); if (!g) return;
  const show = B && B.state === 'fight' && !busy && !EB.auto && B.phase === 'player' && !press && EP.S().stats.wins < 2 && !Object.keys(B.acted).length && B.foes.some(f => f.hp > 0);
  g.classList.toggle('show', !!show);
  if (!show) return;
  const h = views.get(B.heroes.find(u => u.hp > 0).id), f = views.get(B.foes.find(u => u.hp > 0).id);
  if (!h || !f) return;
  const z = +getComputedStyle(document.documentElement).getPropertyValue('--uiz') || 1, [ax, ay] = centreOf(h), [bx, by] = centreOf(f);
  g.style.setProperty('--ax', ax / z + 'px'); g.style.setProperty('--ay', ay / z + 'px'); g.style.setProperty('--bx', bx / z + 'px'); g.style.setProperty('--by', by / z + 'px');
}
function paintHud() {
  if (!ui || !B) return;
  const end = ui.querySelector('#epEnd'), a = ui.querySelector('#epAuto'), tn = ui.querySelector('#epTurnN');
  paintWaves();
  if (tn) tn.textContent = B.turn;
  const can = B.state === 'fight' && !busy && B.phase === 'player';
  if (end) end.disabled = !can;
  if (a) { a.classList.toggle('on', EB.auto); a.classList.toggle('locked', autoLocked && !EB.auto); }
  const enN = ui.querySelector('#epEnN'); if (enN) enN.textContent = EP.energy();
  paintTurn();
  paintPots();
  paintGhost();
}
function paintPots() {
  if (!potBar) return;
  const e = EP.S(), I = AF.EI, list = Object.keys(EP.POTIONS).filter(id => (e.pots[id] || 0) > 0);
  const open = potBar.classList.contains('open');
  potBar.querySelector('.ep-pots-c').textContent = list.reduce((a, id) => a + e.pots[id], 0);
  const box = potBar.querySelector('.ep-pots-l');
  if (!open) { box.innerHTML = ''; return; }
  box.innerHTML = list.map(id => `<button class="ep-pot${potPick === id ? ' pick' : ''}" data-p="${id}" title="${esc(EP.POTIONS[id].n + ': ' + EP.POTIONS[id].d)}">${I.pot(id)}<b>${e.pots[id]}</b></button>`).join('') || `<span class="ep-pots-none">${I.i('pot')}</span>`;
  for (const b of box.querySelectorAll('button')) b.onclick = () => {
    if (busy) return;
    const id = b.dataset.p;
    if (EP.POTIONS[id].pick) { potPick = potPick === id ? null : id; paintPots(); return; }
    usePotion(id, null);
  };
}
function usePotion(id, u) {
  const e = EP.S();
  if (!(e.pots[id] > 0) || busy) return;
  e.pots[id]--; potPick = null;
  potBar.classList.remove('open');
  G.save();
  const evs = EP.potion(B, id, u);
  flow(evs);
}
let autoLocked = false;
EB.autoLocked = () => autoLocked;
function autoRefused() { EP.S().autoOn = false; EB.auto = false; sfx('error'); AF.ui.toast(`No energy. +1 in ${Math.ceil(EP.energyIn() / 60)} min`, 'bad'); }
// a fight pays for auto-play once, however often it is switched on
function payAuto() { const B = EB.B; if (!B || B.autoPaid) return true; if (!EP.spendEnergy()) return false; B.autoPaid = true; return true; }
function setAuto(on) { if (on && !payAuto()) { autoRefused(); paintHud(); return; } EB.auto = on; EP.S().autoOn = on; paintHud(); if (on && !busy) flow([]); }
// a stage has to be beaten once by hand before Auto will play it. The button and the key ask here; EB.setAuto below does not, for the dev panel and the tests
function pressAuto() { if (autoLocked) { sfx('error'); AF.ui.toast('Beat this stage once to use Auto', 'bad'); return; } sfx('click'); setAuto(!EB.auto); }
function togglePause() {
  if (!EB.on) return;
  EB.paused = !EB.paused;
  const P = ui.querySelector('#epPause');
  P.hidden = !EB.paused;
  if (EB.paused) hideDrag();
}
function buildHud(fight) {
  const I = AF.EI;
  ui = el('div', 'ep-ui');
  ui.innerHTML = `
    <div id="epHead"><button class="ep-btn" id="epPauseB" title="Pause">${I.i('pause')}</button><div id="epWave" title="Waves"></div><div id="epRule"></div></div>
    <div id="epTurn" title="Turn"><span class="you">${I.i('sword')}</span><span class="them">${I.i('skull')}</span><b id="epTurnN"></b></div>
    <div class="ep-pots" id="epPots"><button class="ep-btn ep-potb" id="epPotB" title="Food and drink">${I.i('flask')}<span class="ep-pots-c">0</span></button><div class="ep-pots-l"></div></div>
    <div id="epGhost">${I.i('hand')}</div>
    <button class="ep-bottle" id="epBottle" title="Full: drag onto a hero">
      <span class="ep-gauge">${I.i('gaugeE')}${I.i('gaugeF', 'f')}</span>
      <span class="ep-bottle-h">${I.i('hand')}</span></button>
    <button class="ep-btn ep-end" id="epEnd" title="End turn">${I.i('skip')}</button>
    <button class="ep-btn ep-auto" id="epAuto" title="${autoLocked ? 'Auto-play: beat this stage once first' : 'Auto-play: 3 energy a fight'}">${I.i('robot')}<em class="ep-en">${autoLocked ? I.i('lock') : `${I.i('bolt')}<b id="epEnN">0</b>`}</em></button>
    <div id="epPause" class="ep-pause" hidden><div class="ep-pause-in"><button class="ep-big" id="epResume" title="Keep fighting">${I.i('play')}</button><button class="ep-big" id="epQuit" title="Retreat to the map. Pays nothing.">${I.i('map')}</button></div></div>`;
  document.body.appendChild(ui);
  bottleEl = ui.querySelector('#epBottle'); potBar = ui.querySelector('#epPots');
  ui.querySelector('#epPauseB').onclick = () => { sfx('click'); togglePause(); };
  ui.querySelector('#epResume').onclick = () => { sfx('click'); togglePause(); };
  ui.querySelector('#epQuit').onclick = () => { sfx('click'); EB.paused = false; if (EB.onQuit) EB.onQuit(); };
  ui.querySelector('#epEnd').onclick = () => { if (busy || !B || B.phase !== 'player') return; sfx('click'); B.heroes.forEach(h => { if (h.hp > 0) B.acted[h.id] = true; }); flow([]); };
  ui.querySelector('#epAuto').onclick = pressAuto;
  ui.querySelector('#epPotB').onclick = () => { sfx('click'); potBar.classList.toggle('open'); paintPots(); };
  bottleEl.addEventListener('pointerdown', onBottleDown);
  info = el('div', 'ep-info'); document.body.appendChild(info);
  preview = el('div', 'ep-preview'); document.body.appendChild(preview);
  dragSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); dragSvg.setAttribute('class', 'ep-drag');
  dragSvg.innerHTML = '<path fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 15"/><polygon/>';
  dragPath = dragSvg.querySelector('path');
  document.body.appendChild(dragSvg);
}

// ---------------- in and out ----------------
EB.start = (host, fight, party, o = {}) => {
  EB.leave();
  time = 0; timers = []; tweens = []; busy = true; armed = false; press = null; potPick = null; shownRage = 0; onEnd = o.onEnd; EB.onQuit = o.onQuit; EB.paused = false;
  autoLocked = !!o.autoLocked; EB.auto = !autoLocked && !!EP.S().autoOn; // it stays on from fight to fight until you turn it off, or the energy runs out. A stage not yet beaten is played by hand and pays nothing, and Auto comes back on the next stage that allows it
  // a phone held upright: the two sides stand closer so everyone is still a good size
  narrow = innerWidth < 760 && innerWidth < innerHeight;
  const squeeze = l => l.map(([x, z]) => [x * 0.58, z * 1.5]);
  HSLOT = narrow ? squeeze(HSLOT0) : HSLOT0; ESLOT = narrow ? squeeze(ESLOT0) : ESLOT0;
  B = EB.B = EP.newBattle(fight, party, { rage: o.rage || 0 });
  shownRage = B.rage;
  const map = arenaOf(fight);
  map.theme = fight.theme || map.theme;
  const uiz = () => +getComputedStyle(document.documentElement).getPropertyValue('--uiz') || 1;
  Bd.pad = () => { const z = uiz(); return narrow ? { top: 90 * z, bottom: 150 * z, side: 8 } : { top: 150 * z, bottom: 92 * z, side: 40 * z }; };
  const M = { epic: true, cam: [0, 0.5, 1], map, units: [], enemies: [], proj: [], ev: [], team: B.heroes.map(h => ({ u: G.towerOf(h.animal) })), diff: {}, state: 'play' };
  Bd.mount(host, M, {});
  kit = Bd.kit();
  EB.on = true;
  tags = el('div', 'ep-tags'); host.appendChild(tags);
  input = el('div', 'ep-input'); host.appendChild(input);
  input.addEventListener('pointerdown', onDown);
  input.addEventListener('pointermove', onMove);
  input.addEventListener('pointerup', onUp);
  input.addEventListener('pointercancel', () => { press = null; hideDrag(); });
  input.addEventListener('contextmenu', e => e.preventDefault());
  buildHud(fight);
  B.heroes.forEach((u, i) => heroView(u, i));
  // (4 Nov, owner: "energy not being spent?"): this sat after the return below, so a fight with Auto left on from the last one never paid
  if (EB.auto && !payAuto()) autoRefused();
  paintBottle(); paintHud();
  // the first wave's events are waiting in the log
  const first = B.log; B.log = [];
  flow(first);
  return B;
};
EB.leave = () => {
  if (!EB.on) return;
  EB.on = false;
  for (const v of views.values()) if (v.tag) v.tag.remove(); // the figures go with the board's scene, below
  views.clear();
  timers = []; tweens = [];
  for (const x of [ui, info, preview, dragSvg, tags, input]) if (x) x.remove();
  ui = info = preview = dragSvg = bottleEl = potBar = null;
  tags = input = null;
  B = EB.B = null; kit = null; busy = false;
  Bd.unmount(); Bd.zoom = 1; Bd.pad = null;
};
// for the tests: where a figure stands on the page
EB.screenOf = u => { const v = views.get(u.id); if (!v) return null; const [x, y] = Bd.screenOf(v.x + v.ox, v.z + v.oz, v.h * 0.5); const r = input.getBoundingClientRect(); return [r.left + x, r.top + y]; };
EB.views = () => views;
EB.slots = () => ({ h: HSLOT, e: ESLOT });
EB.shapeOf = u => { const v = views.get(u.id), sh = v && projectileOf(v); return sh ? sh.shape : null; };
EB.setAuto = setAuto;
EB.isPaused = () => EB.paused;
})();
