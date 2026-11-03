/* Aura Farm Defense: every unit's attack, drawn (29 Oct, request: "I need you to do exactly this for all the units.
   Don't spare anything or cut corners, give all of the units specific individual effects, and the higher the rarity,
   the cooler the effects. The higher the upgrade ingame, the better those effects are").
   A unit's attack (attacks.js) names its mechanic, element, shape and colours. Here:
   - EL: each element's particles, the way they move, the mark it leaves on the ground
   - H: shared pieces (impacts, sparks, bursts, rings, pillars, rain, fissures, vortices...) the signatures reuse
   - models: projectiles, pets and orbiting pieces, pooled
   - ON: a renderer for every event a mechanic sends, with layers for rarity and for upgrade tier
   - frame: shots in flight, held beams, orbiting pieces, pets, things falling from the sky, fields, auras, burning
     and stunned enemies
   - poses: how each kind of attack moves the figure
   The first five (Cinder, Hex, Frost, Kairo, Nova) keep their hand-built versions (UNIQUE). Signature moves are in
   tdsig.js. board.js calls bind on mount, event for each match event, frame every frame and pose while a unit attacks. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, TD = AF.TD, PI = Math.PI, sin = Math.sin, cos = Math.cos;
const X = AF.TDFX = {};
// (1 Nov) what another file can add (tdhell.js): event renderers and poses by unit key (return true when handled),
// and steps run every frame
X.HOOK = { event: {}, pose: {}, frame: [] };
let V = null, views = null, world = null, sfx = () => {}, getM = () => null, M = null, label = () => {};
const bombs = new Map(); let bombGeo = null, bombMat = null;
const rnd = (a, b) => a + Math.random() * (b - a);
const RAINBOW = [0xff5a5a, 0xffb02e, 0xffe23a, 0x5aff8a, 0x4fc8ff, 0xa07bff];

// ---------------- elements ----------------
// spark / bits: particle shapes (vfx.js CELL); sAdd / bAdd: added as light (else blended, for dust, paper, ink);
// mode: how the bits move (rise, fall, burst, swirl, float); decal: the ground mark (vfx.js decal kinds, -1 none);
// puff: [colour, alpha] of smoke or dust; dAdd: a bright whirlpool instead of a dark one
const E = (spark, bits, mode, decal, o = {}) => Object.assign({ spark, bits, mode, decal, sAdd: true, bAdd: true, k: 2.3, stretch: 1.2, grav: 6, spin: 0, puff: null, c: [0xffffff, 0xd8e6ff, 0xffffff] }, o);
const EL = {
  coffee: E("drop", "drop", "burst", 7, { sAdd: false, bAdd: false, stretch: 0, grav: 9, puff: [0xf2ece4, 0.35] }),
  light: E("hot", "dot", "rise", 3), laser: E("hot", "pixel", "burst", 3),
  paper: E("pixel", "pixel", "fall", -1, { sAdd: false, bAdd: false, stretch: 0, grav: 3, spin: 8 }),
  sweat: E("drop", "drop", "burst", 0, { stretch: 0.6, grav: 9 }), sign: E("star", "star", "burst", 4),
  chalk: E("pixel", "smoke", "float", 5, { sAdd: false, bAdd: false, stretch: 0, grav: 4, puff: [0xf2f2ee, 0.5] }),
  dust: E("shard", "smoke", "float", 4, { sAdd: false, bAdd: false, stretch: 0, grav: 10, puff: [0xc8b89a, 0.5] }),
  slop: E("drop", "bubble", "rise", 7, { sAdd: false, stretch: 0, grav: 8 }), tech: E("hot", "pixel", "burst", 3),
  water: E("drop", "bubble", "rise", 0, { stretch: 0.5, grav: 8 }), fire: E("hot", "flame", "rise", 1, { puff: [0x3a3438, 0.6] }),
  hush: E("ring", "ring", "float", 0, { stretch: 0, grav: 0 }),
  nature: E("leaf", "leaf", "fall", 3, { sAdd: false, bAdd: false, stretch: 0, grav: 2, spin: 6 }),
  metal: E("hot", "shard", "burst", 4, { bAdd: false, k: 3 }), talisman: E("star", "rune", "float", 6),
  sound: E("ring", "note", "float", 0, { stretch: 0, grav: 0 }), copper: E("hot", "shard", "burst", 4, { bAdd: false }),
  wind: E("streak", "leaf", "swirl", 0, { stretch: 2, grav: 0, bAdd: false }), warm: E("star", "dot", "rise", 3),
  herb: E("leaf", "leaf", "rise", 7, { sAdd: false, bAdd: false, stretch: 0, grav: 2, spin: 6 }),
  forge: E("hot", "flame", "rise", 4, { k: 3 }), pixel: E("pixel", "pixel", "burst", -1, { stretch: 0 }),
  honey: E("drop", "drop", "fall", 7, { sAdd: false, bAdd: false, stretch: 0, grav: 8 }),
  magic: E("star", "star", "float", 6), arcane: E("star", "rune", "float", 6), holy: E("star", "dot", "rise", 3),
  ice: E("shard", "star", "fall", 2, { spin: 6 }), plasma: E("hot", "dot", "burst", 3),
  rose: E("petal", "petal", "fall", 3, { sAdd: false, bAdd: false, stretch: 0, grav: 2, spin: 5 }),
  shadow: E("streak", "smoke", "float", 5, { bAdd: false, stretch: 1.6 }), jade: E("hot", "leaf", "rise", 6),
  crystal: E("shard", "star", "burst", 0, { spin: 8, stretch: 0 }),
  ink: E("drop", "drop", "burst", 5, { sAdd: false, bAdd: false, stretch: 0.4, grav: 9 }),
  volt: E("hot", "hot", "burst", 3, { stretch: 1.8, k: 3 }),
  feather: E("feather", "feather", "fall", -1, { sAdd: false, bAdd: false, stretch: 0, grav: 1.5, spin: 4 }),
  storm: E("hot", "hot", "burst", 0, { stretch: 1.6, k: 3 }), lava: E("hot", "flame", "rise", 4, { puff: [0x3a2a24, 0.6], k: 3 }),
  rust: E("hot", "shard", "burst", 4, { bAdd: false }), powder: E("hot", "smoke", "float", 1, { bAdd: false, puff: [0x8a8a88, 0.6] }),
  crow: E("streak", "feather", "fall", 5, { bAdd: false, spin: 4 }), starfire: E("star", "flame", "rise", 1),
  spirit: E("dot", "dot", "rise", 3, { stretch: 0, grav: -1 }), moon: E("star", "dot", "fall", 3),
  earth: E("shard", "smoke", "float", 4, { sAdd: false, bAdd: false, stretch: 0, grav: 12, puff: [0xb8a888, 0.6] }),
  melody: E("star", "note", "float", 0), clockwork: E("hot", "rune", "float", 6),
  eclipse: E("star", "smoke", "swirl", 8, { bAdd: false }), dawn: E("star", "feather", "fall", 3, { spin: 3 }),
  serpent: E("leaf", "rune", "float", 6), cyber: E("pixel", "pixel", "burst", 3, { stretch: 0 }),
  night: E("star", "star", "fall", 5), sun: E("hot", "dot", "rise", 3, { k: 3 }), phoenix: E("hot", "feather", "rise", 1, { spin: 4 }),
  comet: E("star", "star", "fall", 4), dream: E("star", "bubble", "float", 3), null: E("pixel", "pixel", "burst", 6, { stretch: 0 }),
  cosmic: E("star", "star", "float", 3), void: E("shard", "smoke", "swirl", 8, { sAdd: false, bAdd: false, stretch: 0, grav: 4 }),
  static: E("pixel", "pixel", "burst", 0, { stretch: 0 }), shards: E("shard", "shard", "burst", 4, { spin: 10, stretch: 0 }),
  mirror: E("star", "shard", "burst", 0, { spin: 10 }), papermoon: E("pixel", "rune", "float", 6, { sAdd: false }),
  code: E("pixel", "pixel", "rise", 6, { stretch: 0, grav: -2 }), rift: E("streak", "pixel", "swirl", 8, { stretch: 1.8, dAdd: true }),
  time: E("star", "rune", "float", 6), abyss: E("drop", "bubble", "rise", 8, { stretch: 0.5, dAdd: true }),
  life: E("petal", "leaf", "rise", 3, { sAdd: false, bAdd: false, stretch: 0, grav: -0.5, spin: 4 }),
  justice: E("star", "star", "rise", 6), tempest: E("hot", "streak", "swirl", 0, { stretch: 2 }),
  aurora: E("star", "dot", "float", 3, { rainbow: true }), prism: E("star", "shard", "burst", 0, { rainbow: true, spin: 8 }),
  balance: E("pixel", "rune", "float", 6), starmap: E("star", "rune", "float", 6),
  memory: E("petal", "petal", "float", 3, { bAdd: false, spin: 4 }), galaxy: E("star", "star", "swirl", 8, { rainbow: true, dAdd: true }),
};
X.EL = EL;

// ---------------- a unit's look, worked out once per level ----------------
// T: upgrade tier (levels 0-1, 2-3, 4-5, 6); R: rarity (0 Common .. 9 Eternal); s: size; n(x): a particle count
const cache = new Map();
function ctx(p) {
  const lv = p.lv || 0, ev = !!(p.u && p.u.ev), id = p.id + ":" + lv + (ev ? "e" : "");
  let c = cache.get(id);
  if (c) return c;
  const key = p.u.k, A = (ev && AF.ATTACKS && AF.ATTACKS[key + "@evo"]) || (AF.ATTACKS && AF.ATTACKS[key]) || {}, el = EL[A.el] || EL.light, R = AF.attackRank ? AF.attackRank(key) : 0, k = lv / TD.UP.max;
  // rarity grows sizes and counts (29 Oct: a little faster now that attacks come about 1.7x less often; light still adds
  // up, so both growing fast would white out the top units)
  // (30 Oct) an evolved unit: bigger and fuller
  const nm = (0.8 + 0.7 * k) * (1 + 0.08 * R) * (ev ? 1.6 : 1);
  c = { key, A, el, R, k, ev, T: lv >= 6 ? 3 : lv >= 4 ? 2 : lv >= 2 ? 1 : 0, s: (0.9 + 0.3 * k) * (1 + 0.045 * R) * (ev ? 1.3 : 1), c: A.c || el.c, shape: A.shape || "", n: x => Math.max(1, Math.round(x * nm)) };
  cache.set(id, c);
  return c;
}
X.ctx = ctx;
const colsOf = c => (c.el.rainbow ? RAINBOW : [c.c[0], c.c[1], c.c[2]]);
// a point by the unit: fwd along its facing, side to its right, at height y
const VW = (p, fwd = 0.45, side = 0, y = 1) => { const f = p.face; return [p.x + sin(f) * fwd + cos(f) * side, y, p.z + cos(f) * fwd - sin(f) * side]; };

// ---------------- shared pieces ----------------
const H = X.H = { rnd, RAINBOW, colsOf, VW };
H.flash = (x, y, z, size, hex, k = 1.3, life = 0.1) => V.burst(true, x, y, z, 1, { cols: [hex], speed: [0, 0], life: [life, life], size: [size * 0.65, size], cell: V.CELL.dot, k, fixed: true });
// sparks in the element's own shape
H.sparks = (c, x, y, z, n, o = {}) => {
  const el = c.el;
  V.burst(el.sAdd, x, y, z, n, Object.assign({ cols: colsOf(c), speed: [1.5, 4], up: 1, life: [0.15, 0.35], size: [(el.stretch ? 0.05 : 0.1) * c.s, 0], cell: V.CELL[el.spark],
    stretch: el.stretch, k: el.k, grav: el.grav, drag: 2, spin: el.spin, a: el.sAdd ? 1 : 0.95 }, o));
};
// the element's own bits, moving its own way (o.mode overrides; o.r spreads where they start)
H.bits = (c, x, y, z, n, o = {}) => {
  const el = c.el, cell = V.CELL[el.bits], add = o.add != null ? o.add : el.bAdd, cols = o.cols || colsOf(c), sz = (o.size || 0.11) * c.s;
  for (let i = 0; i < n; i++) {
    const col = V.lin(cols[i % cols.length], add ? 2 : 1), a = rnd(0, PI * 2), r = rnd(0, o.r == null ? 0.35 : o.r);
    let px = x + cos(a) * r, py = y, pz = z + sin(a) * r, vx = 0, vy = 0, vz = 0, life = rnd(0.5, 0.9), grav = 0, drag = 1;
    switch (o.mode || el.mode) {
      case "rise": vx = rnd(-0.3, 0.3); vy = rnd(0.8, 1.8); vz = rnd(-0.3, 0.3); grav = -0.3; break;
      case "fall": py = y + rnd(0.5, 1.3); vx = rnd(-0.4, 0.4); vy = rnd(-0.6, -0.2); vz = rnd(-0.4, 0.4); grav = 0.6; life = rnd(0.8, 1.3); break;
      case "burst": { const s = rnd(1.5, 3.5); vx = cos(a) * s; vy = rnd(0.5, 2.5); vz = sin(a) * s; grav = 5; drag = 2; life = rnd(0.35, 0.6); break; }
      case "swirl": { const s = rnd(1.5, 3); vx = -sin(a) * s + cos(a); vy = rnd(0.2, 1); vz = cos(a) * s + sin(a); drag = 1.5; break; }
      default: vx = cos(a) * rnd(0.3, 0.9); vy = rnd(0.2, 0.7); vz = sin(a) * rnd(0.3, 0.9); drag = 1.2;
    }
    V.put(add, px, py, pz, vx, vy, vz, life * (o.life || 1), drag, grav, sz, sz * 0.4, cell, 0, col, add ? 1 : 0.9, rnd(0, PI * 2), el.spin ? rnd(-el.spin, el.spin) : rnd(-1.5, 1.5));
  }
};
H.puff = (c, x, y, z, n, hex, a = 0.6, size = 0.5) => V.burst(false, x, y, z, n, { cols: [hex], speed: [0.3, 1.1], up: 0.5, life: [0.6, 1.1], size: [size * 0.7 * c.s, size * 1.6 * c.s], cell: V.CELL.smoke, a, drag: 2.2, grav: -0.3, spin: 1 });
// the element's mark on the ground
const DARK = { 1: 1, 4: 1, 5: 1, 7: 1, 8: 1 };
H.mark = (c, x, z, r, dur) => {
  const el = c.el, kind = el.decal;
  if (kind < 0) return;
  const col = kind === 1 ? 0x140c08 : kind === 4 ? 0x231c18 : c.c[0];
  V.decal(x, z, kind, r, { col, k: el.dAdd || !DARK[kind] ? 1.3 : 1, add: !!el.dAdd, dur: dur || (kind === 1 ? 3.5 : kind >= 4 ? 1.6 : 0.5) });
};
H.ring = (c, x, z, r, k = 1.6, dur = 0.45, hex) => V.decal(x, z, 0, r, { col: hex || c.c[0], k, dur });
// a column of the element going up
H.erupt = (c, x, z, w = 0.5, h = 1) => {
  const el = c.el;
  V.burst(el.bAdd, x, 0.1, z, c.n(10), { cols: colsOf(c), dir: [0, 1, 0], cone: 0.12, speed: [2.5 * h, 5 * h], life: [0.3, 0.6], size: [0.14 * c.s, 0.03], cell: V.CELL[el.bits],
    k: 2.2, spread: w, flatSpread: true, drag: 1.2, spin: el.spin, a: el.bAdd ? 1 : 0.9 });
  V.decal(x, z, 3, w * 1.6, { col: c.c[0], k: 1.1, dur: 0.5 });
};
// the main hit: a flash, sparks, bits, smoke, a mark; more with rarity and upgrades
H.impact = (c, x, y, z, big = 1) => {
  const s = big * c.s;
  H.flash(x, y, z, 0.55 * s, c.c[1], 0.9); H.flash(x, y, z, 0.22 * s, c.c[2], 1.1);
  H.sparks(c, x, y, z, c.n(6 * big));
  if (c.R >= 1 || c.T >= 1) H.bits(c, x, y, z, c.n(3 * big), { r: 0.25 * s });
  if (c.el.puff) H.puff(c, x, y, z, Math.ceil(2 * big), c.el.puff[0], c.el.puff[1], 0.35 * big);
  // ground marks and eruptions at most twice a second per unit, so fast attackers don't paint the road over
  const now = V.time(), slow = now - (c._markT || -9) > 0.5;
  if (slow && big >= 0.7) c._markT = now;
  if (c.R >= 2 && big >= 0.7 && slow) H.mark(c, x, z, 0.45 * s);
  if (c.T >= 2 && big >= 0.7 && slow) for (let i = 0; i < 3; i++) {
    const a = rnd(0, PI * 2), d = rnd(0.3, 0.6) * s, px = x + cos(a) * d, pz = z + sin(a) * d;
    V.later(0.05 + i * 0.04, () => { H.flash(px, y, pz, 0.3 * s, c.c[1], 1); H.sparks(c, px, y, pz, 3); });
  }
  if (c.T >= 3 && big >= 0.7 && slow) H.erupt(c, x, z, 0.4 * s);
  if (c.R >= 7) V.burst(true, x, y, z, 4, { cols: RAINBOW, speed: [1, 3], up: 1, life: [0.3, 0.5], size: [0.06, 0], cell: V.CELL.star, k: 2.4, spin: 6 });
};
// a blast (lobbed shots, mortars): a fireball in the element's colours, sparks, smoke, debris, a ring and a mark
H.explode = (c, x, z, r, big = 1) => {
  const s = c.s * big;
  H.flash(x, 0.45, z, r * 1.25 * big, c.c[1], 1.3, 0.12); H.flash(x, 0.45, z, r * 0.5 * big, c.c[2], 1.6, 0.1);
  V.burst(c.el.bAdd || c.el.sAdd, x, 0.35, z, c.n(16 * big), { cols: colsOf(c), speed: [0.8, 2.4], up: 1.3, life: [0.3, 0.6], size: [0.45 * s, 0.1], cell: V.CELL.dot, k: 1.8, drag: 3.2, grav: -1.2, spread: r * 0.25, a: 0.9 });
  H.sparks(c, x, 0.4, z, c.n(16 * big), { speed: [3, 8], up: 2, life: [0.2, 0.45] });
  H.puff(c, x, 0.5, z, c.n(5 * big), c.el.puff ? c.el.puff[0] : 0x4a4a50, c.el.puff ? c.el.puff[1] : 0.55, 0.55);
  H.bits(c, x, 0.4, z, c.n(5 * big), { r: r * 0.4 });
  H.ring(c, x, z, r * 1.25, 1.8, 0.4);
  H.mark(c, x, z, r * 0.9, c.el.decal === 1 ? 4 : undefined);
};
// a beam straight down from the sky
H.skyBeam = (x, z, hex, w = 0.25, dur = 0.35, h = 10) => V.bolt([x, h, z], [x, 0.05, z], { col: hex, w, dur, depth: 1, jag: 0 });
// a pillar of light: a beam from the sky, light shooting up, a pool and a ring
H.pillar = (c, x, z, w = 1, hex) => {
  const col = hex || c.c[0];
  H.skyBeam(x, z, col, 0.3 * w, 0.4);
  V.burst(true, x, 0.1, z, c.n(16), { cols: [c.c[2], col], dir: [0, 1, 0], cone: 0.05, speed: [6, 12], life: [0.25, 0.45], size: [0.12 * w, 0.03], cell: V.CELL.hot, stretch: 2.2, k: 3, spread: 0.3 * w, flatSpread: true });
  V.decal(x, z, 3, 0.9 * w, { col, k: 1.5, dur: 0.6 }); V.decal(x, z, 0, 1.4 * w, { col, k: 1.7, dur: 0.5 });
};
// shots raining onto an area, each landing with a small hit (o: cell, col, size, fall, spread, h, hit(x, z))
H.rain = (c, x, z, r, n, o = {}) => {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, PI * 2), d = Math.sqrt(Math.random()) * r, tx = x + cos(a) * d, tz = z + sin(a) * d;
    const delay = rnd(0, o.spread == null ? 0.35 : o.spread), fall = o.fall || 0.35, h = o.h || 6, ox = (o.ox == null ? 1.2 : o.ox), oz = (o.oz == null ? -1.2 : o.oz);
    V.put(o.add !== false, tx + ox, h, tz + oz, -ox / fall, -(h - 0.25) / fall, -oz / fall, fall, 0, 0, (o.size || 0.12) * c.s, (o.size || 0.12) * c.s, V.CELL[o.cell || "hot"], o.stretch == null ? 1.6 : o.stretch,
      V.lin(o.col || c.c[0], o.add === false ? 1 : 2.6), 1, 0, 0, delay);
    V.later(delay + fall, () => (o.hit ? o.hit(tx, tz, i) : (H.flash(tx, 0.3, tz, 0.4 * c.s, c.c[2], 1), H.sparks(c, tx, 0.3, tz, 3))));
  }
};
// the ground cracking open from x0, z0 to x1, z1, the element bursting up along it
H.fissure = (c, x0, z0, x1, z1, n = 7, o = {}) => {
  for (let i = 0; i < n; i++) {
    const k = (i + 1) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
    V.later(i * (o.step || 0.05), () => { V.decal(x, z, 4, 0.6, { col: 0x231c18, dur: 2 }); H.erupt(c, x, z, 0.3, o.h || 1); if (o.hit) o.hit(x, z, i); });
  }
};
// the element whirled in toward a point
H.vortex = (c, x, z, r, n, o = {}) => {
  const cols = o.cols || colsOf(c), add = o.add != null ? o.add : true, life = o.life || 0.6, cell = V.CELL[o.cell || c.el.bits];
  for (let i = 0; i < n; i++) {
    const a = rnd(0, PI * 2), d = r * rnd(0.6, 1.05), sw = (o.spin || 3) * d, vin = d / life;
    V.put(add, x + cos(a) * d, rnd(0.2, o.h || 1), z + sin(a) * d, -sin(a) * sw - cos(a) * vin, rnd(-0.2, 0.4), cos(a) * sw - sin(a) * vin, life, 0, 0, (o.size || 0.1) * c.s, 0.02, cell, o.stretch || 0,
      V.lin(cols[i % cols.length], add ? 2.2 : 1), add ? 1 : 0.85, rnd(0, PI * 2), rnd(-3, 3), o.delay ? rnd(0, o.delay) : 0);
  }
};
// a cone of the element breathed from x, y, z along (dx, dz)
H.cone = (c, x, y, z, dx, dz, len, n, o = {}) => V.burst(o.add != null ? o.add : true, x, y, z, n, { cols: o.cols || colsOf(c), dir: [dx, 0.05, dz], cone: o.cone || 0.25, speed: [len * 1.6, len * 2.6],
  life: [0.3, 0.5], size: [o.s0 || 0.15, o.s1 || 0.5], cell: V.CELL[o.cell || "dot"], k: o.k || 2.2, drag: 2.5, spin: 2, a: 0.9 });
// a straight line of light from a to b (tracers, iai flashes, laser lines)
H.line = (a, b, hex, w = 0.05, dur = 0.12) => V.bolt(a, b, { col: hex, w, dur, depth: 1, jag: 0 });
// shards of the element bursting out from a point on a ring
H.ringBurst = (c, x, z, r, n, o = {}) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + (o.a0 || 0), px = x + cos(a) * r, pz = z + sin(a) * r;
    V.later((o.step || 0.02) * i, () => (o.at ? o.at(px, pz, a, i) : H.impact(c, px, 0.5, pz, 0.6)));
  }
};
H.screen = (x, z, o) => {
  if (o.flash) V.flash(o.flash[0], o.flash[1]);
  if (o.chroma) V.chroma(o.chroma);
  if (o.shake) V.shake(o.shake);
  if (o.ripple) V.ripple(x, 0.4, z, o.ripple, o.rs || 1.5);
};
H.label = (p, text, hex) => label(p.x, p.z, text, hex);
X.V = () => V;

// ---------------- models: projectiles, pets, orbiting pieces ----------------
// built from the kit's blocks; pooled per shape, given back when their shot or pet is gone
const pools = new Map();
const mat = (hex, glow) => K.mat(hex, glow ? 1 : 0);
function take(shape, c) {
  const list = pools.get(shape);
  if (list && list.length) { const g = list.pop(); g.visible = true; world.add(g); return g; }
  const g = new T.Group(), f = MODELS[shape];
  if (f) f(g, c.c); else K.mesh(g, K.ball(0.12, 1), c.c[0], 0, 0, 0, { glow: 1 });
  g.userData.shape = shape; world.add(g);
  return g;
}
function give(g) { g.removeFromParent(); g.visible = false; const s = g.userData.shape; if (!pools.has(s)) pools.set(s, []); pools.get(s).push(g); }
const { box, mesh, pivot, cone, ball, cyl, ring } = K;
const NO = { ink: false };
const MODELS = {
  arrow(g, c) { box(g, 0.035, 0.035, 0.62, 0x8a6a3a, 0, 0, 0, { ink: 0.01 }); mesh(g, cone(0.06, 0.16, 4), c[0], 0, 0, 0.36, { rx: PI / 2, ink: 0.01 }); for (const s of [-1, 1]) box(g, 0.1, 0.012, 0.12, c[1], s * 0.04, 0, -0.27, { ry: s * 0.3, ...NO }); },
  glassArrow(g, c) { box(g, 0.03, 0.03, 0.62, c[0], 0, 0, 0, { glow: 1, ...NO }); mesh(g, cone(0.07, 0.2, 4), 0xffffff, 0, 0, 0.38, { rx: PI / 2, glow: 1, ...NO }); },
  javelin(g, c) { box(g, 0.04, 0.04, 0.95, 0x6a5a4a, 0, 0, 0, { ink: 0.01 }); mesh(g, cone(0.07, 0.22, 4), c[0], 0, 0, 0.56, { rx: PI / 2, ink: 0.01 }); },
  lightSpear(g, c) { box(g, 0.045, 0.045, 1.0, c[0], 0, 0, 0, { glow: 1, ...NO }); mesh(g, cone(0.09, 0.3, 4), 0xffffff, 0, 0, 0.62, { rx: PI / 2, glow: 1, ...NO }); },
  kunai(g, c) { mesh(g, cone(0.06, 0.32, 4), 0xc8ccd2, 0, 0, 0.1, { rx: PI / 2, ink: 0.01 }); box(g, 0.03, 0.03, 0.14, c[0], 0, 0, -0.12, { ink: 0.01 }); mesh(g, ring(0.04, 0.012, 4, 10), 0xc8ccd2, 0, 0, -0.21, NO); },
  card(g, c) { box(g, 0.2, 0.012, 0.28, 0xffffff, 0, 0, 0, { ink: 0.008 }); box(g, 0.16, 0.014, 0.24, c[0], 0, 0.002, 0, NO); },
  bomb(g) { mesh(g, new T.SphereGeometry(0.17, 14, 10), 0x23232a, 0, 0, 0, { ink: 0.02 }); box(g, 0.08, 0.08, 0.08, 0x6a6a72, 0, 0.17, 0, { ink: 0.01 }); },
  cup(g, c) { mesh(g, cyl(0.09, 0.07, 0.2, 10), 0xf4f1e8, 0, 0, 0, { ink: 0.012 }); mesh(g, cyl(0.1, 0.1, 0.03, 10), c[0], 0, 0.11, 0, NO); },
  parcel(g, c) { box(g, 0.32, 0.22, 0.26, c[0], 0, 0, 0, { ink: 0.015 }); box(g, 0.33, 0.04, 0.27, 0xd8c08a, 0, 0, 0, NO); },
  page(g) { box(g, 0.24, 0.008, 0.3, 0xf4f1e8, 0, 0, 0, { ink: 0.006 }); for (let i = 0; i < 4; i++) box(g, 0.16, 0.01, 0.012, 0x9a9488, 0, 0.002, -0.08 + i * 0.05, NO); },
  crane(g, c) { mesh(g, cone(0.1, 0.32, 3), c[0], 0, 0, 0, { rx: PI / 2, ink: 0.008 }); for (const s of [-1, 1]) box(g, 0.24, 0.01, 0.1, c[1], s * 0.12, 0.02, 0, { rz: s * 0.4, ...NO }); },
  chalk(g) { box(g, 0.05, 0.05, 0.2, 0xf2f2ee, 0, 0, 0, { ink: 0.008 }); },
  ticket(g, c) { box(g, 0.24, 0.01, 0.13, c[0], 0, 0, 0, { ink: 0.006 }); box(g, 0.2, 0.012, 0.02, 0x3a3a44, 0, 0.002, 0.03, NO); },
  talisman(g, c) { box(g, 0.12, 0.01, 0.32, c[0], 0, 0, 0, { ink: 0.006 }); box(g, 0.05, 0.012, 0.24, c[1], 0, 0.002, 0, NO); },
  board(g, c) { box(g, 0.62, 0.035, 0.18, c[0], 0, 0, 0, { ink: 0.012 }); box(g, 0.6, 0.02, 0.16, c[1], 0, 0.02, 0, NO); for (const x of [-0.2, 0.2]) for (const z of [-0.07, 0.07]) mesh(g, cyl(0.035, 0.035, 0.03, 8), 0xf2f2ee, x, -0.04, z, { rx: PI / 2, ...NO }); },
  pan(g, c) { mesh(g, cyl(0.17, 0.14, 0.05, 14), 0x2a2a30, 0, 0, 0, { ink: 0.012 }); box(g, 0.05, 0.03, 0.26, 0x2a2a30, 0, 0, -0.27, { ink: 0.01 }); mesh(g, cyl(0.13, 0.13, 0.02, 12), c[0], 0, 0.03, 0, { glow: 1, ...NO }); },
  moon(g, c) { mesh(g, cyl(0.26, 0.26, 0.03, 24), c[1], 0, 0, 0, { ink: 0.01 }); mesh(g, cyl(0.2, 0.2, 0.035, 20), c[0], 0.09, 0, 0, { glow: 1, ...NO }); },
  ingot(g, c) { box(g, 0.26, 0.12, 0.14, c[1], 0, 0, 0, { glow: 1, ...NO }); box(g, 0.2, 0.06, 0.1, 0xffffff, 0, 0.05, 0, { glow: 1, ...NO }); },
  lavaBomb(g, c) { mesh(g, ball(0.2, 1), 0x2a1a14, 0, 0, 0, { ink: 0.02 }); for (let i = 0; i < 5; i++) box(g, 0.05, 0.05, 0.2, c[0], rnd(-0.1, 0.1), rnd(-0.1, 0.1), 0, { rx: rnd(0, 3), ry: rnd(0, 3), glow: 1, ...NO }); },
  comet(g, c) { mesh(g, ball(0.18, 1), c[2], 0, 0, 0, { glow: 1, ...NO }); mesh(g, ball(0.24, 1), c[0], 0, 0, 0, { glow: 2, ...NO }); },
  missile(g, c) { mesh(g, cyl(0.05, 0.05, 0.3, 8), 0xe6e8ee, 0, 0, 0, { rx: PI / 2, ink: 0.01 }); mesh(g, cone(0.05, 0.12, 8), c[0], 0, 0, 0.21, { rx: PI / 2, ink: 0.01 }); },
  shard(g, c) { mesh(g, new T.OctahedronGeometry(0.15, 0), c[0], 0, 0, 0, { ink: 0.015 }); mesh(g, new T.OctahedronGeometry(0.08, 0), c[1], 0, 0.02, 0, { glow: 1, ...NO }); },
  petalBlade(g, c) { box(g, 0.08, 0.012, 0.32, c[0], 0, 0, 0, { ink: 0.008 }); box(g, 0.05, 0.014, 0.24, c[1], 0, 0.002, 0, NO); },
  // pets
  dog(g, c) { const b = pivot(g, 0, 0.28, 0); box(b, 0.32, 0.22, 0.46, c[0], 0, 0, 0); box(b, 0.26, 0.24, 0.24, c[0], 0, 0.14, 0.3); box(b, 0.12, 0.1, 0.12, c[1], 0, 0.1, 0.44);
    box(b, 0.06, 0.06, 0.03, 0x14141a, 0, 0.14, 0.5, NO); for (const s of [-1, 1]) { box(b, 0.06, 0.12, 0.08, 0x6a4a2a, s * 0.13, 0.28, 0.28); box(b, 0.04, 0.04, 0.02, 0x14141a, s * 0.07, 0.2, 0.43, NO); }
    g.userData.tail = box(b, 0.05, 0.05, 0.2, c[0], 0, 0.1, -0.3, { rx: -0.6 }); g.userData.body = b; for (const x of [-0.11, 0.11]) for (const z of [-0.15, 0.15]) box(g, 0.08, 0.2, 0.08, c[0], x, 0.1, z); },
  bee(g, c) { const b = pivot(g, 0, 0, 0); box(b, 0.14, 0.12, 0.2, c[0], 0, 0, 0, { ink: 0.008 }); box(b, 0.145, 0.125, 0.04, c[1], 0, 0, 0.02, NO); box(b, 0.145, 0.125, 0.04, c[1], 0, 0, -0.05, NO);
    g.userData.wings = [-1, 1].map(s => box(b, 0.14, 0.01, 0.08, 0xeaf6ff, s * 0.1, 0.07, 0, { glow: 2, ...NO })); g.userData.body = b; },
  kite(g, c) { const b = pivot(g, 0, 0, 0); mesh(b, cone(0.32, 0.02, 4), c[0], 0, 0, 0, { rx: PI / 2, ink: 0.01 }); box(b, 0.02, 0.03, 0.55, c[1], 0, 0.02, 0, NO); box(b, 0.45, 0.03, 0.02, c[1], 0, 0.02, 0, NO); g.userData.body = b; },
  owl(g, c) { const b = pivot(g, 0, 0, 0); box(b, 0.26, 0.3, 0.24, c[0], 0, 0, 0); box(b, 0.22, 0.12, 0.05, c[2], 0, 0.06, 0.12, NO);
    for (const s of [-1, 1]) { box(b, 0.07, 0.07, 0.02, 0xffc23a, s * 0.06, 0.06, 0.15, { glow: 1, ...NO }); box(b, 0.04, 0.08, 0.04, c[1], s * 0.09, 0.18, 0); }
    g.userData.wings = [-1, 1].map(s => { const w = pivot(b, s * 0.14, 0.04, 0); box(w, 0.3, 0.04, 0.2, c[1], s * 0.15, 0, 0); return w; }); g.userData.body = b; },
  dragon(g, c) { const b = pivot(g, 0, 0, 0); box(b, 0.26, 0.22, 0.42, c[0], 0, 0, 0); box(b, 0.2, 0.18, 0.22, c[0], 0, 0.1, 0.28); box(b, 0.12, 0.08, 0.12, c[1], 0, 0.06, 0.42);
    for (const s of [-1, 1]) { box(b, 0.05, 0.05, 0.03, 0xffe23a, s * 0.06, 0.16, 0.39, { glow: 1, ...NO }); mesh(b, cone(0.03, 0.12, 4), c[1], s * 0.07, 0.24, 0.24, { rx: -0.5, ink: 0.008 }); }
    box(b, 0.08, 0.08, 0.32, c[0], 0, 0, -0.32, { rx: 0.3 }); g.userData.wings = [-1, 1].map(s => { const w = pivot(b, s * 0.12, 0.1, 0); box(w, 0.42, 0.03, 0.26, c[1], s * 0.22, 0, 0); return w; }); g.userData.body = b; },
  lanternGhost(g, c) { const b = pivot(g, 0, 0, 0); mesh(b, cone(0.22, 0.6, 8), 0xeafff8, 0, 0, 0, { glow: 2, ...NO }); mesh(b, ball(0.17, 1), 0xeafff8, 0, 0.24, 0, { glow: 2, ...NO });
    for (const s of [-1, 1]) box(b, 0.05, 0.07, 0.02, 0x0a1a1a, s * 0.06, 0.26, 0.16, NO); const l = pivot(b, 0.2, -0.05, 0.1); box(l, 0.1, 0.14, 0.1, 0x2a2a30, 0, 0, 0, { ink: 0.008 }); box(l, 0.07, 0.1, 0.07, c[0], 0, 0, 0, { glow: 1, ...NO }); g.userData.body = b; },
  // orbiting pieces
  darkOrb(g, c) { mesh(g, ball(0.16, 1), c[0], 0, 0, 0, { ink: 0.015 }); mesh(g, ring(0.2, 0.02, 6, 20), c[1], 0, 0, 0, { rx: PI / 2, glow: 1, ...NO }); },
  serpent(g, c) { for (let i = 0; i < 5; i++) mesh(g, ball(0.13 - i * 0.015, 1), i % 2 ? c[1] : c[0], 0, 0, -i * 0.16, { ink: 0.012 }); for (const s of [-1, 1]) box(g, 0.04, 0.04, 0.02, 0xffe23a, s * 0.06, 0.06, 0.1, { glow: 1, ...NO }); },
  planet(g, c) { mesh(g, ball(0.17, 1), c[0], 0, 0, 0, { ink: 0.015 }); mesh(g, ring(0.27, 0.02, 6, 24), c[1], 0, 0, 0, { rx: PI / 2 - 0.4, glow: 1, ...NO }); },
  sunBlade(g, c) { box(g, 0.08, 0.04, 0.5, c[0], 0, 0, 0, { glow: 1, ...NO }); mesh(g, cone(0.06, 0.18, 4), 0xffffff, 0, 0, 0.32, { rx: PI / 2, glow: 1, ...NO }); },
};
// shapes drawn as particles: cell, size, brightness, stretch, spin (and 'dark' for a blended one)
const PART = {
  bubble: ["bubble", 0.26, 1.6, 0], orb: ["hot", 0.3, 2.6, 0], plasma: ["hot", 0.16, 3.2, 0.35], bean: ["dot", 0.1, 1, 0, 0, 1], pixel: ["pixel", 0.13, 2.2, 0, 6],
  wisp: ["dot", 0.28, 2, 0], riftBolt: ["star", 0.3, 2.8, 0, 8], bit: ["pixel", 0.11, 2.4, 0, 4], note: ["note", 0.24, 2.2, 0, 2], glyph: ["rune", 0.3, 2.2, 0, 3],
  star: ["star", 0.32, 2.6, 0, 4], spark: ["hot", 0.12, 2.8, 0.4], gust: ["streak", 0.2, 1.8, 1.4], ray: ["hot", 0.2, 3, 0.6], prism: ["star", 0.3, 3, 0],
  flare: ["star", 0.36, 2.8, 0, 3], static: ["pixel", 0.12, 2.4, 0, 8], scan: ["hot", 0.12, 3, 0.5],
};

// ---------------- the renderers, one per event ----------------
const RANGED = { shot: 1, rapid: 1, snipe: 1, pierce: 1, spread: 1, seek: 1, boomer: 1 };
const SND = { shot: "tdShot", rapid: "tdShot", snipe: "tdShot", pierce: "tdShot", spread: "tdShot", seek: "tdShot", boomer: "tdSlash", tack: "tdShot" };
const ON = {
  fire(c, ev, p) {
    const v = views.get(p.id);
    if (v) { v.atk = 1; v.combo = p.combo; v.hand = p.hand; v.sig = ev.sig; }
    const k = c.A.kind;
    if (RANGED[k]) {
      const [mx, my, mz] = VW(p, 0.55, p.hand ? 0.3 : -0.3, 0.95), f = p.face;
      H.flash(mx, my, mz, 0.32 * c.s, c.c[2], 1.4, 0.07);
      H.sparks(c, mx, my, mz, c.n(3), { dir: [sin(f), 0.1, cos(f)], cone: 0.4, speed: [2, 4], life: [0.08, 0.18] });
      if (c.T >= 1) V.put(true, mx, my, mz, sin(f) * 1.5, 0, cos(f) * 1.5, 0.16, 2, 0, 0.1, 0.5 * c.s, V.CELL.ring, 0, V.lin(c.c[1], 2), 1);
    } else if (k === "tack") {
      H.flash(p.x, 0.8, p.z, 0.9 * c.s, c.c[2], 1.4); H.ring(c, p.x, p.z, 0.9, 1.4, 0.3);
    }
    if (SND[k]) sfx(SND[k], {}, k === "rapid" ? 0.07 : 0.05);
  },
  melee(c, ev, p) {
    const shp = c.shape, f = p.face, x = ev.x, z = ev.z, n = ev.n % 3, s = c.s;
    if (shp === "fist" || shp === "palm" || shp === "mechFist") {
      // a blow: a pop of light, a ring off it, the element thrown out behind; then a second (and from level 2 a third)
      const blow = (dl, m) => V.later(dl, () => {
        H.flash(x, 0.6, z, 0.75 * s * m, c.c[2], 1.4);
        V.burst(true, x, 0.6, z, 1, { cols: [c.c[1]], speed: [0, 0], life: [0.14, 0.14], size: [0.2 * s, 1.05 * s * m], cell: V.CELL.ring, k: 2, fixed: true });
        H.sparks(c, x, 0.6, z, c.n(7), { dir: [sin(f), 0.3, cos(f)], cone: 0.6, speed: [2, 5] });
      });
      blow(0, 1);
      if (c.key === "copper" || c.T >= 1) blow(0.1, 0.8);
      if (c.T >= 2) blow(0.2, 1.2);
      if (shp === "palm") V.decal(x, z, 6, 0.6 * s, { col: c.c[0], k: 1.4, dur: 0.6 });
    } else {
      const r = 1.15 * s, tilt = n === 1 ? 0.45 : -0.45;
      V.slash(x, 0.62, z, { ang: f, tilt, flip: n === 2, r, col: c.c[0], core: c.c[2], dur: 0.24 });
      if (c.T >= 2 || (n === 0 && c.A.kind === "combo")) V.slash(x, 0.7, z, { ang: f, tilt: -tilt, r: r * 1.12, col: c.c[1], core: 0xffffff, dur: 0.27, delay: 0.05, flip: n !== 2 });
      if (c.T >= 1) V.slash(x, 0.6, z, { ang: f + 0.18, tilt: tilt * 0.7, flip: n === 2, r: r * 0.92, col: c.c[0], core: c.c[1], k: 1.1, dur: 0.3, delay: 0.09 });
      H.sparks(c, x, 0.6, z, c.n(8));
      H.flash(x, 0.6, z, 0.45 * s, c.c[2], 1);
      if (c.T >= 3) { const a = f + (n === 1 ? 0.7 : -0.7), dx = sin(a) * 2.6, dz = cos(a) * 2.6; H.line([x - dx, 0.65, z - dz], [x + dx, 0.65, z + dz], c.c[0], 0.045, 0.12); }
    }
    if (c.R >= 1 || c.T >= 1) H.bits(c, x, 0.6, z, c.n(3));
    if (c.R >= 2) H.mark(c, x, z, 0.4 * s);
    sfx("tdSlash", {}, 0.06);
  },
  wave(c, ev) {
    V.crescent(ev.x, ev.z, ev.dx, ev.dz, ev.len, ev.speed, { r: 1.3 * c.s, col: c.c[0], core: c.c[2], trail: c.T >= 3 });
    if (c.T >= 2) V.later(0.08, () => V.crescent(ev.x, ev.z, ev.dx, ev.dz, ev.len, ev.speed, { r: 1.1 * c.s, col: c.c[1], core: c.c[2], flip: true }));
    V.burst(c.el.sAdd, ev.x, 0.5, ev.z, c.n(14), { cols: colsOf(c), speed: [1, 4], dir: [ev.dx, 0.3, ev.dz], cone: 0.6, life: [0.2, 0.4], size: [0.08, 0], cell: V.CELL[c.el.spark], stretch: c.el.stretch, k: 2.6, drag: 2 });
    V.shake(0.04 + 0.03 * c.T); sfx("tdSlash", {}, 0);
  },
  cut(c, ev, p) {
    V.slash(ev.x, 0.6, ev.z, { ang: p.face + PI / 2, tilt: rnd(-0.6, 0.6), r: 0.8 * c.s, dur: 0.16, col: c.c[0], core: c.c[2] });
    H.sparks(c, ev.x, 0.6, ev.z, c.n(6));
  },
  nova(c, ev, p) {
    const x = p.x, z = p.z, r = ev.r, k = c.A.kind, s = c.s;
    if (k === "spin") {
      // a whirl: blades of light all round, the air streaming round with them
      const ns = 3 + c.T;
      for (let i = 0; i < ns; i++) V.slash(x, 0.55, z, { ang: p.face + (i / ns) * PI * 2, tilt: 0, pitch: 0.15, r: r * 0.72, col: c.c[0], core: c.c[1], k: 1.2, coreK: 1.4, dur: 0.26, delay: i * 0.025 });
      for (let i = 0; i < c.n(18); i++) { const a = rnd(0, PI * 2), d = r * rnd(0.4, 0.9); V.put(true, x + cos(a) * d, rnd(0.3, 0.9), z + sin(a) * d, -sin(a) * 6, rnd(0, 0.5), cos(a) * 6, 0.25, 1, 0, 0.06, 0, V.CELL.streak, 2, V.lin(c.c[i % 2], 2.4), 1); }
      if (c.shape === "tornado" || c.T >= 2) H.vortex(c, x, z, r * 0.7, c.n(14), { h: 2.2, spin: 5, cell: "streak", stretch: 1.5, life: 0.5 });
    } else if (k === "stop") {
      // time stands still: a turning clock face on the ground, runes thrown out, the world goes pale for a blink
      V.decal(x, z, 6, r, { col: c.c[0], k: 1.1, dur: 1.2, speed: 0.4 });
      H.ring(c, x, z, r, 0.7, 0.6, c.c[1]);
      V.burst(true, x, 1.2, z, c.n(22), { cols: colsOf(c), flat: true, speed: [r * 1.2, r * 2], life: [0.6, 1], size: [0.12, 0.03], cell: V.CELL.rune, k: 2, drag: 3, spin: 2 });
      for (let i = 0; i < 2; i++) { const a = p.face + i * 2.1; H.line([x, 0.08, z], [x + sin(a) * r * (i ? 0.6 : 0.9), 0.08, z + cos(a) * r * (i ? 0.6 : 0.9)], c.c[0], 0.05, 0.6); }
      V.flash(c.c[2], 0.1);
    } else {
      H.ring(c, x, z, r, 1.5, 0.5);
      V.burst(c.el.sAdd, x, 0.2, z, c.n(28), { cols: colsOf(c), flat: true, speed: [r * 1.6, r * 2.6], life: [0.3, 0.55], size: [(c.el.stretch ? 0.08 : 0.12) * s, 0.02], cell: V.CELL[c.el.spark], stretch: c.el.stretch ? 1 : 0, k: 2.2, drag: 3, spin: c.el.spin, a: 0.95 });
      if (c.shape === "ring") for (let i = 0; i < 2 + (c.T >> 1); i++) V.later(i * 0.12, () => H.ring(c, x, z, r * (0.7 + i * 0.15), 0.9, 0.4, c.c[i % 2]));
      if (c.shape === "palm") { V.decal(x, z, 6, r * 0.5, { col: c.c[0], k: 1.5, dur: 0.8 }); V.burst(true, x, 0.8, z, c.n(12), { cols: [c.c[1], c.c[2]], flat: true, speed: [6, 9], life: [0.15, 0.25], size: [0.08, 0], cell: V.CELL.streak, stretch: 2.5, k: 2.6 }); }
      H.bits(c, x, 0.6, z, c.n(10), { r: r * 0.6 });
    }
    for (const o of ev.hits) H.impact(c, o.x, 0.5, o.z, 0.55);
    if (c.T >= 2) V.later(0.1, () => H.ring(c, x, z, r * 1.15, 1.0, 0.5, c.c[1]));
    if (c.T >= 3) H.erupt(c, x, z, 0.6, 1.2);
    V.shake(0.04 + 0.03 * c.T); V.ripple(x, 0.2, z, 0.002 + 0.0015 * c.T, 1.3);
    sfx(k === "spin" ? "tdSlash" : "tdBoom", {}, 0.08);
  },
  chain(c, ev, p) {
    const pts = ev.pts, el = c.A.el, s = c.s;
    const style = el === "melody" || el === "sound" ? "notes" : "bolt";
    // a strike from the sky onto the first (the storm callers)
    if (c.shape === "sky") { const [tx, tz] = pts[1]; V.bolt([tx + 0.5, 9, tz - 0.7], [tx, 0.08, tz], { col: c.c[0], w: 0.16 * s, dur: 0.28, forks: 2 + c.T, depth: 6, jag: 0.12 }); H.ring(c, tx, tz, 1.3 * s, 2.2, 0.4); }
    for (let j = 1; j < pts.length; j++) {
      const [ax, az] = pts[j - 1], [bx, bz] = pts[j], ay = j === 1 ? 1.0 : 0.55;
      if (style === "notes") {
        for (let k = 0; k < 3; k++) V.put(true, ax, ay, az, (bx - ax) / 0.22, (0.55 - ay) / 0.22 + rnd(-0.6, 0.6), (bz - az) / 0.22, 0.22, 0, 0, 0.17 * s, 0.17 * s, V.CELL.note, 0, V.lin(c.c[k % 2], 2.4), 1, rnd(-0.3, 0.3), 0, k * 0.05 + (j - 1) * 0.08);
        V.later(0.22 + (j - 1) * 0.08, () => H.ring(c, bx, bz, 0.6, 1.6, 0.3, c.c[1]));
      } else V.bolt([ax, ay, az], [bx, 0.55, bz], { col: c.c[0], w: (j === 1 ? 0.1 : 0.07) * s, dur: 0.22, depth: 4, jag: el === "static" || el === "code" ? 0.35 : 0.25, forks: c.T >= 2 ? 1 : 0 });
      H.impact(c, bx, 0.55, bz, j === 1 ? 0.8 : 0.5);
    }
    if (c.T >= 3) H.pillar(c, pts[1][0], pts[1][1], 0.7);
    if (c.R >= 4) V.flash(c.c[0], 0.08 + 0.03 * c.T);
    sfx("tdZap", {}, 0.06);
  },
  snipe(c, ev, p) {
    const [mx, my, mz] = VW(p, 0.6, 0.25, 0.95), x = ev.x, z = ev.z, s = c.s, w = (0.035 + 0.012 * c.T) * s;
    if (c.shape === "prism") for (let i = 0; i < 3 + c.T; i++) H.line([mx, my, mz], [x, 0.55, z], RAINBOW[(i * 2) % 6], w * 0.8, 0.14);
    else H.line([mx, my, mz], [x, 0.55, z], c.c[0], w, 0.11);
    H.flash(mx, my, mz, 0.4 * s, c.c[2], 2, 0.08);
    if (c.shape === "musket") H.puff(c, mx, my, mz, 4, 0x8a8a88, 0.6, 0.3);
    if (c.shape === "scan") { V.decal(x, z, 0, 0.6, { col: 0xff2a2a, k: 2, dur: 0.25 }); H.line([x - 0.5, 0.65, z], [x + 0.5, 0.65, z], 0xff2a2a, 0.02, 0.15); }
    if (c.T >= 2) V.later(0.05, () => H.line([mx, my, mz], [x, 0.55, z], c.c[1], w * 0.5, 0.2));
    H.impact(c, x, 0.55, z, 1);
    if (c.T >= 3) H.pillar(c, x, z, 0.6);
  },
  slam(c, ev, p) {
    const x = ev.x, z = ev.z, r = ev.r;
    H.flash(x, 0.4, z, r * 1.1, c.c[1], 1.2); H.flash(x, 0.4, z, r * 0.45, c.c[2], 1.4);
    H.ring(c, x, z, r * 1.25, 1.8, 0.4);
    V.decal(x, z, 4, r * 0.85, { col: 0x231c18, dur: 2 });
    V.burst(false, x, 0.3, z, c.n(10), { cols: [0x6a5a4a, 0x8a7a6a, c.c[0]], speed: [2.5, 5], up: 3, life: [0.5, 0.8], size: [0.09, 0.06], cell: V.CELL.shard, grav: 12, spin: 12 });
    H.puff(c, x, 0.2, z, c.n(4), 0xc8bca8, 0.5, 0.45);
    H.sparks(c, x, 0.4, z, c.n(10), { flat: true, speed: [2, 5] });
    H.bits(c, x, 0.5, z, c.n(5), { r: r * 0.5 });
    if (c.shape === "sign") { H.flash(x, 1.1, z, 1.3, 0xff2a2a, 1.6, 0.15); V.burst(true, x, 1.1, z, 1, { cols: [0xffffff], speed: [0, 0], life: [0.2, 0.2], size: [0.4, 1.6], cell: V.CELL.ring, k: 2, fixed: true }); }
    if (c.shape === "shield") V.slash(x, 0.6, z, { ang: p.face, tilt: 0, pitch: 1.2, r: r * 0.9, col: c.c[0], core: c.c[2], dur: 0.22 });
    if (c.T >= 1) V.later(0.08, () => H.ring(c, x, z, r * 1.7, 1.2, 0.5, c.c[1]));
    if (c.T >= 2) for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + rnd(0, 1); V.later(0.06 * i, () => H.erupt(c, x + cos(a) * r, z + sin(a) * r, 0.25)); }
    if (c.T >= 3) H.pillar(c, x, z, 0.8);
    V.shake(0.08 + 0.04 * c.T); V.ripple(x, 0.3, z, 0.003 + 0.002 * c.T, 1.4);
    sfx("tdBoom", {}, 0.06);
  },
  dash(c, ev, p) {
    const { x0, z0, x1, z1, dx, dz } = ev, len = Math.hypot(x1 - x0, z1 - z0), s = c.s;
    const v = views.get(p.id); if (v) v.lunge = len * 0.75;
    // afterimages down the path, the element streaming behind, one cut across the whole line
    for (let i = 0; i < 6; i++) {
      const k = i / 5, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
      V.later(k * 0.12, () => { V.burst(true, x, 0.7, z, 1, { cols: [c.c[0]], speed: [0, 0], life: [0.25, 0.25], size: [0.8 * s, 0.5 * s], cell: V.CELL.dot, k: 1.2, fixed: true }); H.bits(c, x, 0.5, z, c.n(2), { r: 0.2 }); });
    }
    V.burst(true, x0, 0.6, z0, c.n(14), { cols: colsOf(c), dir: [dx, 0, dz], cone: 0.08, speed: [len * 3, len * 5], life: [0.12, 0.22], size: [0.08, 0.02], cell: V.CELL.streak, stretch: 2.5, k: 2.6, spread: 0.2 });
    V.slash((x0 + x1) / 2, 0.65, (z0 + z1) / 2, { ang: Math.atan2(dx, dz) + PI / 2, tilt: 0.2, pitch: 0.9, r: len * 0.45, col: c.c[0], core: c.c[2], dur: 0.2, delay: 0.08 });
    for (const o of ev.hits) { const ox = o.x, oz = o.z; V.later(0.1, () => H.impact(c, ox, 0.55, oz, 0.7)); }
    if (c.T >= 2) V.later(0.16, () => V.burst(true, x1, 0.6, z1, c.n(10), { cols: colsOf(c), dir: [-dx, 0, -dz], cone: 0.1, speed: [len * 3, len * 4], life: [0.12, 0.2], size: [0.06, 0.02], cell: V.CELL.streak, stretch: 2.5, k: 2.4 }));
    if (c.T >= 3) for (let i = 0; i < 5; i++) { const k = (i + 0.5) / 5; V.decal(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, 3, 0.5, { col: c.c[0], k: 1.4, dur: 0.8 }); }
    sfx("tdSlash", {}, 0.06);
  },
  launch(c, ev, p) {
    if (c.A.kind === "tack") V.burst(true, p.x, 0.7, p.z, c.n(10), { cols: colsOf(c), flat: true, speed: [3, 6], life: [0.12, 0.22], size: [0.06, 0], cell: V.CELL.streak, stretch: 2, k: 2.4 });
  },
  hit(c, ev, p) {
    H.impact(c, ev.x, 0.55, ev.z, ev.s && (ev.s.line || ev.s.boomer) ? 0.6 : 0.75);
    if (c.shape === "bubble") H.ring(c, ev.x, ev.z, 0.6 * c.s, 1.6, 0.3);
  },
  aim(c, ev, p) {
    const { x, z, r, delay } = ev, kind = c.A.kind;
    // where it will land, marked on the ground until it does
    V.decal(x, z, kind === "mortar" ? 0 : 6, r * 0.9, { col: c.c[0], k: 1.1, dur: delay + 0.1, a: 0.7, speed: 0.6 });
    falls.push({ c, x, z, r, t: 0, delay, kind, sx: p.x, sz: p.z, g: null });
    // a rain lands with the strike
    if (kind === "volley") H.rain(c, x, z, r * 0.9, c.n(9), { fall: delay * 0.9, spread: delay * 0.1, cell: c.shape === "star" ? "star" : "streak", size: c.shape === "star" ? 0.14 : 0.1, stretch: c.shape === "star" ? 0.6 : 2 });
  },
  land(c, ev) {
    const { x, z, r } = ev, kind = c.A.kind;
    if (kind === "mortar") { H.explode(c, x, z, r); V.shake(0.1 + 0.03 * c.T); }
    else {
      H.flash(x, 0.4, z, r * 1.1, c.c[1], 1.3); H.flash(x, 0.4, z, r * 0.45, c.c[2], 1.4);
      H.ring(c, x, z, r * 1.15, 1.8, 0.4);
      H.sparks(c, x, 0.4, z, c.n(12), { speed: [2, 5], up: 2 });
      H.bits(c, x, 0.4, z, c.n(6), { r: r * 0.5 });
      H.mark(c, x, z, r * 0.9);
      if (kind === "strike") H.skyBeam(x, z, c.c[0], 0.18 * c.s, 0.25, 7);
    }
    if (c.T >= 1) V.later(0.08, () => H.ring(c, x, z, r * 1.6, 1.1, 0.5, c.c[1]));
    if (c.T >= 2) for (let i = 0; i < 3; i++) { const a = rnd(0, PI * 2), d = r * rnd(0.6, 1); V.later(0.1 + i * 0.06, () => H.impact(c, x + cos(a) * d, 0.4, z + sin(a) * d, 0.6)); }
    if (c.T >= 3) H.pillar(c, x, z, 0.8);
    V.ripple(x, 0.3, z, 0.003 + 0.0015 * c.T, 1.4);
    sfx("tdBoom", {}, 0.06);
  },
  boom(c, ev) {
    H.explode(c, ev.x, ev.z, ev.r);
    if (c.shape === "cup" || c.shape === "bubble") for (let i = 0; i < c.n(8); i++) V.put(false, ev.x, 0.4, ev.z, rnd(-2, 2), rnd(2, 4), rnd(-2, 2), 0.6, 0.5, 9, 0.12, 0.06, V.CELL.drop, 0, V.lin(c.c[0]), 0.9);
    if (c.T >= 1) V.later(0.09, () => H.ring(c, ev.x, ev.z, ev.r * 1.8, 1.1, 0.5, c.c[1]));
    if (c.T >= 2) for (let i = 0; i < 3; i++) { const a = rnd(0, PI * 2), d = ev.r * rnd(0.7, 1.1), bx = ev.x + cos(a) * d, bz = ev.z + sin(a) * d; V.later(0.18 + i * 0.06, () => H.explode(c, bx, bz, ev.r * 0.4, 0.5)); }
    if (c.T >= 3) H.erupt(c, ev.x, ev.z, 0.6, 1.4);
    V.shake(0.08 + 0.04 * c.T); V.ripple(ev.x, 0.3, ev.z, 0.003 + 0.002 * c.T, 1.5);
    sfx("tdBoom", {}, 0.05);
  },
  field(c, ev, p) {
    const { x, z, r, dur } = ev, hole = c.A.kind === "hole", sh = c.shape;
    // the patch itself, by what it's made of
    const kind = hole ? 8 : sh === "puddle" || sh === "herbs" ? 7 : sh === "brambles" ? 5 : sh === "roots" ? 4 : 3;
    // a black hole is black whatever its palette (unless its element glows)
    V.decal(x, z, kind, r, { col: hole && !c.el.dAdd ? 0x0a0610 : kind === 4 ? c.c[1] : c.c[0], k: kind === 3 ? 1.1 : 1, dur, add: hole && !!c.el.dAdd, speed: 1.4 });
    if (kind === 4) V.decal(x, z, 3, r * 0.9, { col: c.c[0], k: 0.8, dur });
    if (hole) V.decal(x, z, 0, r * 1.15, { col: c.c[1], k: 1.4, dur: 0.6 });
    fields.push({ c, x, z, r, t: dur, dur, hole, acc: 0, pulse: 0 });
    H.impact(c, x, 0.3, z, 0.8);
    sfx(hole ? "tdZap" : "drop", {}, 0.08);
  },
  fieldEnd(c, ev) { const f = ev.f; H.bits(c, f.x, 0.3, f.z, c.n(6), { r: f.r * 0.6 }); if (c.A.kind === "hole") { H.flash(f.x, 0.5, f.z, f.r * 1.2, c.c[1], 1.4); H.ring(c, f.x, f.z, f.r * 1.4, 1.6, 0.4, c.c[1]); } },
  beam(c, ev, p) {
    const v = views.get(p.id); if (v) { v.atk = 1; v.hand = true; }
    p._beamAt = V.time();
    if (Math.random() < 0.6) { H.sparks(c, ev.e.x, 0.6, ev.e.z, c.n(3), { life: [0.1, 0.25] }); H.flash(ev.e.x, 0.6, ev.e.z, 0.4 * c.s, c.c[2], 1, 0.06); }
    if (c.T >= 2 && Math.random() < 0.3) H.bits(c, ev.e.x, 0.6, ev.e.z, 2, { r: 0.2 });
    sfx("tdZap", {}, 0.4);
  },
  orbit(c, ev, p) {
    for (const o of ev.hits) { H.sparks(c, o.x, 0.6, o.z, c.n(3), { life: [0.1, 0.25] }); if (Math.random() < 0.3) H.flash(o.x, 0.6, o.z, 0.4 * c.s, c.c[2], 1, 0.06); }
    if (ev.hits.length) sfx("tdSlash", {}, 0.25);
  },
  bite(c, ev, p) {
    const sh = c.shape;
    H.impact(c, ev.x, 0.5, ev.z, 0.6);
    if (sh === "dragon") H.cone(c, ev.m.x, 0.6, ev.m.z, sin(ev.m.face), cos(ev.m.face), 0.9, c.n(10), { cell: "dot", cols: [0xffd27a, 0xff6a1a], s0: 0.12, s1: 0.4, k: 2.2 });
    if (sh === "dog") H.puff(c, ev.x, 0.2, ev.z, 2, 0xc8b89a, 0.5, 0.3);
    if (sh === "owl") V.burst(false, ev.x, 0.6, ev.z, 3, { cols: [c.c[0], c.c[1]], speed: [0.5, 1.5], up: 0.5, life: [0.8, 1.2], size: [0.12, 0.08], cell: V.CELL.feather, grav: 1, spin: 4, a: 0.9 });
    sfx(sh === "bee" ? "tdShot" : "tdSlash", {}, 0.1);
  },
};
const SIG_EV = { rhit: 1, melee: 1, swell: 1, nova: 1, chain: 1, snipe: 1, slam: 1, dash: 1, hit: 1, land: 1, boom: 1, field: 1, beam: 1, orbit: 1, bite: 1 };
function where(ev, p) {
  if (ev.x != null) return [ev.x, ev.z];
  if (ev.t === "chain") return ev.pts[1];
  if (ev.t === "dash") return [ev.x1, ev.z1];
  if (ev.e) return [ev.e.x, ev.e.z];
  return [p.x, p.z];
}
const SIG_GAP = 2.5;
let sigScreenT = -9; // the screen-wide flash of a big signature, at most every 1.5 s across all units
function playSig(c, ev, p, x, z) {
  const f = AF.TDSIG && c.A.sig && AF.TDSIG[c.A.sig.type];
  // (29 Oct, request: "remove the text above the abilities cause we dont need em anymore"): no name over a signature
  if (f) f(c, ev, p, x, z, H, V); else H.pillar(c, x, z, 1);
  // the rarer, the more the whole screen takes part
  if (c.R >= 4 && V.time() - sigScreenT >= 1.5) { sigScreenT = V.time(); V.flash(c.c[0], 0.1 + 0.02 * (c.R - 4)); V.chroma(0.002 + 0.0006 * (c.R - 4)); }
  if (c.R >= 6) H.pillar(c, p.x, p.z, 0.6, c.c[1]);
}
// (29 Oct, request: "Change up some of the effects on higher rarity units so it just gets that much more crazy the
// better rarity you have"): from Secret up, every attack lands with a layer in the rarity's own colour on top of its
// own effect, one more thing for each rarity: Secret a ring and star glints, Divine light rising off the ground,
// Transcendent a turning rune circle, Primordial a shockwave and a spray of its element, Eternal a golden halo and a
// rainbow star shower. At most every 0.8 s a unit, so a burst or a beam doesn't stack it
const RAR_EV = { hit: 1, boom: 1, land: 1, melee: 1, snipe: 1, slam: 1, nova: 1, chain: 1, beam: 1, orbit: 1, bite: 1, rhit: 1, dash: 1, field: 1, swell: 1 };
function rarityFlair(c, p, x, z) {
  const R = c.R, rc = parseInt((AF.RAR[AF.UNIT[c.key].rarity].color || "#ffffff").slice(1), 16), cols = R >= 9 ? RAINBOW : [rc, 0xffffff, rc];
  V.decal(x, z, 0, 0.8 + 0.12 * R, { col: rc, k: 1.15, dur: 0.45 });
  V.burst(true, x, 0.6, z, 4 + R, { cols, speed: [1, 2.5], up: 1.4, life: [0.4, 0.7], size: [0.12, 0.02], cell: V.CELL.star, k: 1.5, spin: 5, spread: 0.4 });
  if (R >= 6) V.burst(true, x, 0.1, z, 6 + R, { cols, dir: [0, 1, 0], cone: 0.12, speed: [1.6, 3.4], life: [0.5, 0.9], size: [0.07, 0.02], cell: V.CELL.hot, k: 1.6, spread: 0.7, flatSpread: true });
  if (R >= 7) V.decal(x, z, 6, 0.7 + 0.1 * R, { col: rc, k: 1.05, dur: 0.75 });
  if (R >= 8) { V.ripple(x, 0.4, z, 0.0035, 1.2); V.burst(true, x, 0.5, z, 10, { cols: colsOf(c), speed: [3, 6], life: [0.25, 0.45], size: [0.11, 0.02], cell: V.CELL[c.el.spark] != null ? V.CELL[c.el.spark] : V.CELL.shard, stretch: 1, k: 1.6 }); }
  if (R >= 9) { V.decal(x, z, 0, 2.1, { col: 0xffe8a0, k: 1.25, dur: 0.6 }); V.burst(true, x, 1.7, z, 14, { cols: RAINBOW, speed: [0.4, 1.4], grav: 2, life: [0.8, 1.2], size: [0.1, 0.03], cell: V.CELL.star, k: 1.6, spin: 4, spread: 0.9 }); }
}
// (30 Oct) the pact's layer on an evolved unit's hits: scorch, dark smoke and red embers (blended), a ring in its own
// colour, and every third time a crimson cross of bolts over the target
function evoFlair(c, p, x, z) {
  p._evoN = (p._evoN || 0) + 1;
  V.decal(x, z, 1, 0.8 * c.s, { col: 0x1a0406, k: 1, dur: 1.6 });
  V.decal(x, z, 0, 1.1 * c.s, { col: c.c[0], k: 1.2, dur: 0.4 });
  V.burst(false, x, 0.4, z, 6, { cols: [0x140608, 0x2a0a0e], speed: [0.4, 1.4], up: 1.2, life: [0.6, 1.0], size: [0.35, 0.7], cell: V.CELL.smoke, a: 0.7, drag: 2, grav: -0.6, spin: 1 });
  V.burst(false, x, 0.3, z, 12, { cols: [0xff2a3a, 0xff5a1a, 0xffb02e], speed: [1.5, 3.5], up: 2.2, life: [0.4, 0.8], size: [0.07, 0.02], cell: V.CELL.dot, a: 1, drag: 1.4, grav: 2.5 });
  if (p._evoN % 3 === 0) for (const [dx, dz] of [[1, 1], [1, -1]]) V.bolt([x - dx * 0.9, 0.5, z - dz * 0.9], [x + dx * 0.9, 0.5, z + dz * 0.9], { col: 0xff2a3a, w: 0.07, dur: 0.22, jag: 0.12 });
}
X.event = (ev, p) => {
  if (!V || !V.on || !p.u) return false;
  M = getM();
  const c = ctx(p), U = UNIQUE[c.key] || X.HOOK.event[c.key];
  let done = false;
  if (U) done = !!U(ev, p);
  if (!done && ON[ev.t] && AF.ATTACKS[c.key]) { ON[ev.t](c, ev, p); done = true; }
  // a signature move plays where its attack lands
  const sig = ev.sig || (ev.s && ev.s.sig);
  if (ev.t === "fire" && sig) p._sig = V.time();
  else if (sig && SIG_EV[ev.t] && (p._sig || ev.t === "beam" || ev.t === "orbit" || ev.t === "bite" || ev.t === "rhit") && c.A.sig) {
    // (29 Oct, screenshot of a white blob: Kharon's pets made a signature every third bite, one every 0.6 s, and each
    // one's light landed on the last): a unit's signature shows at most every 2.5 s; its damage still lands each time
    p._sig = 0;
    if (V.time() - (p._sigShown == null ? -9 : p._sigShown) >= SIG_GAP) { p._sigShown = V.time(); const [x, z] = where(ev, p); playSig(c, ev, p, x, z); }
  }
  if (p._sig && V.time() - p._sig > 2) p._sig = 0;
  if (c.R >= 5 && RAR_EV[ev.t] && V.time() - (p._rarT == null ? -9 : p._rarT) >= 0.8) { p._rarT = V.time(); const [x, z] = where(ev, p); rarityFlair(c, p, x, z); }
  if (c.ev && RAR_EV[ev.t] && V.time() - (p._evoT == null ? -9 : p._evoT) >= 0.55) { p._evoT = V.time(); const [x, z] = where(ev, p); evoFlair(c, p, x, z); }
  return done;
};

// ---------------- every frame ----------------
const falls = [], fields = [], shots = new Map(), orbits = new Map(), petMeshes = new Map(), beams = new Map(), orbs = new Map();
function drawShots(dt) {
  const seen = new Set(), C = V.CELL;
  for (const s of M.proj) {
    if (!s.p.u || s.wave || s.bomb || !AF.ATTACKS[s.p.u.k]) continue; // (30 Oct) Molla's bombs tick on the road (tdrel.js)
    const c = ctx(s.p), sh = c.shape;
    // where it is and which way it's going
    let dx = 0, dz = 1, y = 0.75;
    if (s.line || s.boomer) { dx = s.dx; dz = s.dz; }
    else { const ddx = s.tx - s.x, ddz = s.tz - s.z, l = Math.hypot(ddx, ddz) || 1; dx = ddx / l; dz = ddz / l; }
    if (s.kind === "lob") { const done = Math.hypot(s.x - s.sx, s.z - s.sz), k = done / Math.max(0.01, done + Math.hypot(s.tx - s.x, s.tz - s.z)); y = 0.7 + Math.sin(k * PI) * 1.7; }
    if (s.seek) y = 0.8 + sin(s.life * 9 + (s.i || 0) * 2) * 0.18;
    const vx = dx * (s.speed || 10), vz = dz * (s.speed || 10);
    if (MODELS[sh] && !PART[sh]) {
      let g = shots.get(s);
      if (!g) { g = take(sh, c); shots.set(s, g); }
      seen.add(s);
      g.position.set(s.x, y, s.z); g.rotation.set(0, Math.atan2(dx, dz), 0);
      if (sh === "bomb" || sh === "lavaBomb" || sh === "parcel" || sh === "cup" || sh === "pan") { g.rotation.x = s.life * 9; g.rotation.z = s.life * 5; }
      if (sh === "card" || sh === "ticket" || sh === "page" || sh === "talisman" || sh === "petalBlade" || sh === "moon" || sh === "board") g.rotation.y = s.life * 14;
      if (sh === "shard") { g.rotation.x = s.life * 8; g.rotation.y = s.life * 11; }
      if (sh === "bomb") V.put(true, s.x, y + 0.2, s.z, rnd(-0.5, 0.5), rnd(0.5, 1.5), rnd(-0.5, 0.5), rnd(0.12, 0.25), 1, 3, 0.07, 0, C.hot, 0.8, V.lin(Math.random() < 0.5 ? 0xffd27a : 0xff6a1a, 3), 1);
    } else {
      const P = PART[sh] || PART.orb, big = s.big ? 1.6 : 1;
      V.put(!P[5], s.x, y, s.z, P[3] ? vx : 0, 0, P[3] ? vz : 0, 0.035, 0, 0, P[1] * c.s * big, P[1] * c.s * big, C[P[0]], P[3], V.lin(c.c[0], P[5] ? 1 : P[2]), 1, s.life * (P[4] || 0), 0);
      if (!P[5]) V.put(true, s.x, y, s.z, 0, 0, 0, 0.03, 0, 0, P[1] * 0.45 * c.s * big, P[1] * 0.45 * c.s * big, C.hot, 0, V.lin(c.c[2], 2.6), 1);
      if (s.big) { orbs.set(s, [s.x, s.z]); seen.add(s); }
    }
    // its trail, in the element's own way (thicker with upgrades and rarity)
    const nt = 1 + (c.T >= 1 ? 1 : 0) + (c.R >= 5 ? 1 : 0);
    for (let i = 0; i < nt; i++) {
      const el = c.el;
      V.put(el.bAdd, s.x + rnd(-0.05, 0.05), y + rnd(-0.05, 0.05), s.z + rnd(-0.05, 0.05), rnd(-0.3, 0.3), rnd(-0.1, 0.3), rnd(-0.3, 0.3), rnd(0.15, 0.3) * (c.T >= 2 ? 1.6 : 1), 1, el.grav * 0.05,
        0.08 * c.s, 0, C[i ? el.bits : el.spark === "streak" ? "dot" : el.spark], 0, V.lin(c.c[i % 2], el.bAdd ? 2 : 1), el.bAdd ? 0.9 : 0.8, rnd(0, 6), rnd(-3, 3));
    }
  }
  for (const [s, g] of shots) if (!seen.has(s)) { give(g); shots.delete(s); }
  for (const [s, xz] of orbs) if (!seen.has(s)) { orbs.delete(s); orbBurst(xz[0], xz[1]); }
}
// things on their way down: a mortar arcing over, a strike gathering above its mark
function drawFalls(dt) {
  for (let i = falls.length - 1; i >= 0; i--) {
    const f = falls[i], c = f.c, C = V.CELL;
    f.t += dt;
    const u = Math.min(1, f.t / f.delay);
    if (f.kind === "mortar") {
      const x = f.sx + (f.x - f.sx) * u, z = f.sz + (f.z - f.sz) * u, y = 0.8 + Math.sin(u * PI) * 6 * (1 - u * 0.3) - u * 0.6;
      if (MODELS[c.shape] && !PART[c.shape]) { if (!f.g) f.g = take(c.shape, c); f.g.position.set(x, y, z); f.g.rotation.x += dt * 6; f.g.rotation.z += dt * 4; }
      else V.put(true, x, y, z, 0, 0, 0, 0.03, 0, 0, 0.35 * c.s, 0.35 * c.s, C.hot, 0, V.lin(c.c[0], 2.6), 1);
      for (let k = 0; k < 2; k++) V.put(c.el.bAdd, x, y, z, rnd(-0.3, 0.3), rnd(-0.2, 0.3), rnd(-0.3, 0.3), 0.4, 1, 0, 0.14 * c.s, 0.02, C[k ? c.el.bits : "dot"], 0, V.lin(c.c[k], 2), 0.9);
    } else if (f.kind === "strike") {
      // the strike's shape gathers above the mark and drops in the last moment
      const y = u < 0.7 ? 3.2 : 3.2 - ((u - 0.7) / 0.3) * 3;
      const P = PART[c.shape] || PART.star;
      V.put(true, f.x, y, f.z, 0, 0, 0, 0.03, 0, 0, P[1] * 1.6 * c.s * (0.5 + u * 0.5), P[1] * 1.6 * c.s, C[P[0]], 0, V.lin(c.c[0], 2.6), 1, f.t * 3, 0);
      if (Math.random() < 0.5) H.bits(c, f.x, y, f.z, 1, { r: 0.4 });
    }
    if (u >= 1) { if (f.g) give(f.g); falls.splice(i, 1); }
  }
}
// fields and holes keep moving while they last
function drawFields(dt) {
  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i], c = f.c;
    f.t -= dt;
    if (f.t <= 0) { fields.splice(i, 1); continue; }
    const want = dt * 10 * f.r * (1 + 0.5 * c.T), n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
    if (f.hole) {
      H.vortex(c, f.x, f.z, f.r, n * 2, { spin: 3.5, life: 0.7, h: 0.8, cell: c.el.bits === "smoke" ? "dot" : c.el.bits });
      V.put(false, f.x, 0.4, f.z, 0, 0, 0, 0.03, 0, 0, f.r * 0.45, f.r * 0.45, V.CELL.dot, 0, V.lin(c.el.dAdd ? c.c[1] : 0x08040c), c.el.dAdd ? 0.4 : 0.85);
      f.pulse -= dt;
      if (f.pulse <= 0) { f.pulse = 0.5; H.ring(c, f.x, f.z, f.r * 0.6, 1, 0.5, c.c[1]); }
    } else for (let k = 0; k < n; k++) { const a = rnd(0, PI * 2), d = Math.sqrt(Math.random()) * f.r * 0.9; H.bits(c, f.x + cos(a) * d, 0.1, f.z + sin(a) * d, 1, { r: 0, mode: c.el.mode === "fall" ? "rise" : undefined }); }
  }
}
// pieces circling an orbit unit
function drawOrbits(dt, t) {
  const live = new Set();
  for (const p of M.units) {
    if (p.s.kind !== "orbit" || !AF.ATTACKS[p.u.k]) continue;
    const c = ctx(p), n = ((p.s.cfg && p.s.cfg.n) || 3) + c.T, L = TD.live(p), r = L.rng * 0.72;
    let set = orbits.get(p.id);
    if (!set || set.n !== n) { if (set) set.items.forEach(give); set = { n, items: [] }; for (let i = 0; i < n; i++) set.items.push(take(c.shape, c)); orbits.set(p.id, set); }
    live.add(p.id);
    set.items.forEach((g, i) => {
      const a = t * (1.6 + 0.2 * c.T) + (i / n) * PI * 2, x = p.x + cos(a) * r, z = p.z + sin(a) * r, y = 0.65 + sin(t * 2 + i) * 0.12;
      g.position.set(x, y, z); g.rotation.set(0, -a, 0);
      if (c.shape === "planet") g.rotation.y = t * 2;
      if (c.T >= 1 || c.R >= 5) V.put(c.el.bAdd, x, y, z, 0, 0, 0, 0.3 + 0.1 * c.T, 0, 0, 0.12 * c.s, 0, V.CELL[c.el.bAdd ? "dot" : c.el.bits], 0, V.lin(c.c[i % 2], 2), 0.8);
    });
  }
  for (const [id, set] of orbits) if (!live.has(id)) { set.items.forEach(give); orbits.delete(id); }
}
// pets: each one's model follows it; wings beat, tails wag
function drawPets(dt, t) {
  const live = new Set();
  for (const p of M.units) {
    if (p.s.kind !== "summon" || !p.pets || !AF.ATTACKS[p.u.k]) continue;
    const c = ctx(p);
    for (const m of p.pets) {
      let g = petMeshes.get(m.id);
      if (!g) { g = take(c.shape, c); g.scale.setScalar(c.shape === "bee" ? 1.2 : 1); petMeshes.set(m.id, g); }
      live.add(m.id);
      const fly = c.shape !== "dog", y = fly ? 0.9 + sin(t * 3 + m.id) * 0.12 : 0;
      g.position.set(m.x, y, m.z); g.rotation.y = m.face;
      const U = g.userData;
      if (U.wings) U.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * sin(t * (c.shape === "bee" ? 40 : 10) + m.id) * 0.6; });
      if (U.tail) U.tail.rotation.y = sin(t * 14) * 0.6;
      if (U.body && !fly) U.body.position.y = 0.28 + Math.abs(sin(t * 10 + m.id)) * 0.05;
      if (c.T >= 1 || c.R >= 4) V.put(c.el.bAdd, m.x, y + 0.2, m.z, 0, 0.2, 0, 0.3, 0, 0, 0.1 * c.s, 0, V.CELL[c.el.bAdd ? "dot" : c.el.bits], 0, V.lin(c.c[0], 2), 0.7);
    }
  }
  for (const [id, g] of petMeshes) if (!live.has(id)) { give(g); petMeshes.delete(id); }
}
// held beams, from the hand to the target, thicker as they build
function drawBeams(dt, t) {
  const live = new Set();
  for (const p of M.units) {
    if (p.s.kind !== "beam" || !AF.ATTACKS[p.u.k]) continue;
    const c = ctx(p), e = p.beamE, on = e && e.hp > 0 && p._beamAt && V.time() - p._beamAt < 0.4;
    let b = beams.get(p.id);
    if (!b) { b = { a: V.ribbon(), b: V.ribbon() }; beams.set(p.id, b); }
    live.add(p.id);
    if (!on) { b.a.hide(); b.b.hide(); continue; }
    const ramp = Math.min(1, (p.beamT || 0) / 2), from = VW(p, 0.6, 0.3, 1.0), to = [e.x, 0.6, e.z], sh = c.shape;
    const w = (0.05 + 0.05 * ramp + 0.02 * c.T) * c.s * (1 + 0.04 * c.R);
    let col = c.c[0];
    if (c.el.rainbow) col = RAINBOW[Math.floor(t * 6) % 6];
    if (sh === "cone" || sh === "sweep") b.a.show(from, to, 0.04, 0.55 * c.s, col, 0.45, 0.05);
    else b.a.show(from, to, w, w * 1.15, col, 1, 0.25);
    if (c.T >= 2 || c.R >= 6) b.b.show(from, to, w * 0.4, w * 0.4, c.c[2], 1, 0.6); else b.b.hide();
    // light running down the beam
    const k = Math.random();
    V.put(true, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k, (to[0] - from[0]) * 2, 0, (to[2] - from[2]) * 2, 0.12, 0, 0, 0.08 * c.s, 0,
      V.CELL[sh === "staff" ? "note" : c.el.spark === "pixel" ? "pixel" : "hot"], sh === "staff" ? 0 : 1, V.lin(c.c[1], 2.4), 1);
    if (sh === "aurora" || c.T >= 3) for (let i = 0; i < 2; i++) { const kk = Math.random(); V.put(true, from[0] + (to[0] - from[0]) * kk, from[1] + (to[1] - from[1]) * kk + rnd(-0.2, 0.2), from[2] + (to[2] - from[2]) * kk, rnd(-0.5, 0.5), rnd(0.2, 0.8), rnd(-0.5, 0.5), 0.4, 1, 0, 0.1 * c.s, 0, V.CELL.star, 0, V.lin(RAINBOW[(Math.random() * 6) | 0], 2.2), 1); }
  }
  for (const [id, b] of beams) if (!live.has(id)) { b.a.free(); b.b.free(); beams.delete(id); }
}
// auras: from level 2 (and always from Mythic up) the element drifts round the unit, thicker the higher it goes
function drawAuras(dt) {
  for (const v of views.values()) {
    const p = v.p; if (!AF.ATTACKS[p.u.k]) continue;
    const c = ctx(p), u = OLD_AURA_OF[c.key];
    // (30 Oct) an evolved unit smoulders: red embers and dark wisps rising off it
    if (c.ev && Math.random() < dt * 6) {
      const x = p.x + rnd(-0.35, 0.35), z = p.z + rnd(-0.35, 0.35);
      V.burst(false, x, rnd(0.2, 0.9), z, 1, { cols: [0xff2a3a, 0xff7a2a], speed: [0.1, 0.4], up: 1, life: [0.6, 1.1], size: [0.05, 0.01], cell: V.CELL.dot, a: 1, grav: -1.2, drag: 1 });
      if (Math.random() < 0.4) V.burst(false, x, 0.3, z, 1, { cols: [0x1a0608], speed: [0.1, 0.3], up: 1, life: [0.8, 1.3], size: [0.25, 0.5], cell: V.CELL.smoke, a: 0.45, grav: -0.8, drag: 1.5, spin: 1 });
    }
    if (u) { const T2 = tierOf(p); if (T2) { const want = dt * (T2 === 3 ? 16 : T2 === 2 ? 8 : 4), n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0); if (n) u(p, T2, n); } continue; }
    if (c.T < 1 && c.R < 4) continue;
    const want = dt * (2.5 * c.T + 1.5 * Math.max(0, c.R - 3)), n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) H.bits(c, p.x + rnd(-0.4, 0.4), rnd(0.2, 1.3), p.z + rnd(-0.4, 0.4), 1, { r: 0.1, size: 0.08 });
  }
}
// what enemies show: stars over the stunned, flames on the burning, drips on the soaked
function drawStatus(dt, t) {
  for (const e of M.enemies) {
    if (e.hp <= 0) continue;
    const s = e.def.size;
    if (e.stunT > 0 && Math.random() < dt * 10) { const a = t * 7 + e.id; V.put(true, e.x + cos(a) * 0.3 * s, 1.15 * s, e.z + sin(a) * 0.3 * s, -sin(a), 0.1, cos(a), 0.3, 0, 0, 0.1, 0.05, V.CELL.star, 0, V.lin(0xffe23a, 2.2), 1, 0, 4); }
    if (e.dotT > 0 && e.dotP && e.dotP.u && Math.random() < dt * 9) { const c = ctx(e.dotP); H.bits(c, e.x + rnd(-0.2, 0.2), 0.5 * s, e.z + rnd(-0.2, 0.2), 1, { r: 0, mode: "rise", size: 0.09 }); }
    if (e.slowT > 0 && e.slowP && e.slowP.u && Math.random() < dt * 5) { const c = ctx(e.slowP); if (c.A.el !== "ice") V.put(c.el.bAdd, e.x + rnd(-0.2, 0.2), 0.7 * s, e.z + rnd(-0.2, 0.2), 0, -0.6, 0, 0.5, 0, 3, 0.07, 0.03, V.CELL.drop, 0, V.lin(c.c[0], c.el.bAdd ? 2 : 1), 0.9); }
  }
}

// ---------------- each character's own aura, from its card ----------------
// (29 Oct, request: "add the character's aura as effects ingame as well with the new particle system"): every effect
// a unit's card plays (units.js fx: embers off a hilt, arcs along a blade, leaves falling, jet flames...) plays round
// the figure on the board too, from the same points on the model, as 3D particles; plus its trait's glow and a
// shiny's rainbow. Rates run at about half the card's so a full board stays readable.
const wp = new T.Vector3();
function at(v, name) { const o = name && v.R.m[name]; if (!o) return null; o.getWorldPosition(wp); return [wp.x, wp.y, wp.z]; }
function body(v, h = 0.8) { return [v.p.x + rnd(-0.35, 0.35), rnd(0.25, 1.5) * h + 0.1, v.p.z + rnd(-0.35, 0.35)]; }
function emit(st, rate, dt, f) { st.acc = (st.acc || 0) + rate * dt; while (st.acc >= 1) { st.acc -= 1; f(); } }
const hexOf = (o, d) => (o.c === "rainbow" ? RAINBOW[(Math.random() * 6) | 0] : o.c != null ? o.c : d);
const CARD = {
  motes(v, o, st, dt) {
    emit(st, (o.rate || 14) * 0.45, dt, () => {
      const q = o.at ? at(v, o.at) : null, [x, y, z] = q ? [q[0] + rnd(-0.15, 0.15), q[1], q[2] + rnd(-0.15, 0.15)] : body(v);
      V.put(true, x, y, z, rnd(-0.15, 0.15), rnd(0.25, 0.6) * ((o.up || 30) / 30), rnd(-0.15, 0.15), rnd(0.9, 1.6) * (o.life || 1), 0.5, 0, 0.045 * (o.size || 1.6) / 1.6, 0.01, V.CELL.dot, 0, V.lin(hexOf(o, 0xfff2b0), 2.2), 1);
    });
  },
  embers(v, o, st, dt) {
    emit(st, (o.rate || 16) * 0.45, dt, () => {
      const q = o.at ? at(v, o.at) : null, [x, y, z] = q ? [q[0] + rnd(-0.12, 0.12), q[1], q[2] + rnd(-0.12, 0.12)] : body(v, 0.6);
      V.put(true, x, y, z, rnd(-0.2, 0.2), rnd(0.5, 1.1) * ((o.up || 40) / 40), rnd(-0.2, 0.2), rnd(0.6, 1.1), 0.6, -0.2, 0.045, 0, V.CELL.hot, 0, V.lin(hexOf(o, Math.random() < 0.5 ? 0xff8a2a : 0xffc04a), 2.6), 1);
    });
  },
  sparks(v, o, st, dt) {
    const a = at(v, o.a), b = at(v, o.b); if (!a || !b) return;
    emit(st, (o.rate || 14) * 0.45, dt, () => {
      const f = Math.random();
      V.put(true, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, rnd(-0.4, 0.4), rnd(0.2, 0.8), rnd(-0.4, 0.4), rnd(0.3, 0.6), 1, 2, 0.04, 0, V.CELL.hot, 0.6, V.lin(hexOf(o, 0xfff6a0), 2.6), 1);
    });
  },
  arc(v, o, st, dt) {
    const a = at(v, o.a), b = at(v, o.b); if (!a || !b) return;
    st.next = (st.next == null ? rnd(0.3, 1) : st.next) - dt;
    if (st.next <= 0) { st.next = rnd(0.7, 1.8) * (o.every || 1); V.bolt(a, b, { col: hexOf(o, 0x4fe6ff), w: 0.03, dur: 0.16, depth: 3, jag: 0.35 }); }
  },
  steam(v, o, st, dt) {
    emit(st, 2.5, dt, () => { const q = at(v, o.at) || [v.p.x, 1.1, v.p.z]; V.put(false, q[0] + rnd(-0.05, 0.05), q[1] + 0.05, q[2] + rnd(-0.05, 0.05), rnd(-0.1, 0.1), rnd(0.25, 0.45), rnd(-0.1, 0.1), rnd(1, 1.6), 0.5, 0, 0.06, 0.22, V.CELL.smoke, 0, V.lin(0xf4f4f4), 0.35, rnd(0, 6), rnd(-1, 1)); });
  },
  smoke(v, o, st, dt) {
    emit(st, (o.rate || 4) * 0.5, dt, () => { const q = (o.at && at(v, o.at)) || body(v, 0.5); V.put(false, q[0], q[1], q[2], rnd(-0.1, 0.1), rnd(0.2, 0.45), rnd(-0.1, 0.1), rnd(1, 1.6), 0.5, 0, 0.1, 0.3, V.CELL.smoke, 0, V.lin(hexOf(o, 0x4a4448)), 0.4, rnd(0, 6), rnd(-1, 1)); });
  },
  fall(v, o, st, dt) {
    const kind = o.kind || "snow", cell = { snow: "star", leaf: "leaf", petal: "petal", feather: "feather", blackFeather: "feather", sand: "pixel" }[kind] || "dot";
    const add = kind === "snow" || kind === "sand", col = kind === "blackFeather" ? 0x14141a : hexOf(o, { snow: 0xe6f6ff, leaf: 0x6ac04a, petal: 0xff6f9a, feather: 0xfff6dc, sand: 0xffd27a }[kind] || 0xffffff);
    emit(st, (o.rate || 8) * 0.3, dt, () => {
      const a = rnd(0, PI * 2), r = rnd(0, 0.8);
      V.put(add, v.p.x + cos(a) * r, 2.1, v.p.z + sin(a) * r, rnd(-0.2, 0.2), -rnd(0.4, 0.7) * (o.speed || 1), rnd(-0.2, 0.2), rnd(2.6, 3.4), 0.3, 0, kind === "sand" ? 0.03 : 0.09, kind === "sand" ? 0.03 : 0.08, V.CELL[cell], 0, V.lin(col, add ? 1.8 : 1), 0.95, rnd(0, 6), rnd(-2, 2));
    });
  },
  notes(v, o, st, dt) {
    emit(st, (o.rate || 2.5) * 0.6, dt, () => { const [x, y, z] = body(v); V.put(true, x, y, z, rnd(-0.2, 0.2), rnd(0.3, 0.6), rnd(-0.2, 0.2), rnd(1.2, 1.8), 0.5, 0, 0.12, 0.1, V.CELL.note, 0, V.lin(hexOf(o, RAINBOW[(Math.random() * 6) | 0]), 2), 1, rnd(-0.3, 0.3), 0); });
  },
  stars(v, o, st, dt) {
    emit(st, (o.rate || 4) * 0.6, dt, () => { const [x, y, z] = body(v, 1.1); V.put(true, x, y, z, 0, rnd(0, 0.1), 0, rnd(0.5, 0.9), 0, 0, 0.02, 0.11, V.CELL.star, 0, V.lin(hexOf(o, 0xffffff), 2.4), 1, 0, rnd(-2, 2)); });
  },
  ring(v, o, st, dt) {
    st.next = (st.next == null ? rnd(0, 1) : st.next) - dt;
    if (st.next <= 0) { st.next = 1.3 * (o.every || 1); V.decal(v.p.x, v.p.z, 0, 0.75, { col: hexOf(o, 0xffffff), k: 1.4, dur: 0.6 }); }
  },
  flash(v, o, st, dt) {
    st.next = (st.next == null ? rnd(0, 1.5) : st.next) - dt;
    if (st.next > 0) return;
    st.next = rnd(1.2, 2);
    const q = at(v, o.at) || body(v);
    H.flash(q[0], q[1], q[2], 0.35, hexOf(o, 0xffffff), 1.6, 0.08);
    if (o.sparks) V.burst(true, q[0], q[1], q[2], 6, { cols: [hexOf(o, 0xffffff)], speed: [1, 2.5], up: 0.8, life: [0.2, 0.4], size: [0.035, 0], cell: V.CELL.hot, stretch: 1, k: 2.6, grav: 4 });
  },
  drop(v, o, st, dt) { emit(st, 1, dt, () => { const q = at(v, "face") || [v.p.x, 1.25, v.p.z]; V.put(false, q[0] + rnd(-0.12, 0.12), q[1], q[2] + rnd(-0.12, 0.12), 0, -0.2, 0, 0.6, 0, 3, 0.05, 0.04, V.CELL.drop, 0, V.lin(0x9fd8ff), 0.85); }); },
  dust(v, o, st, dt) { emit(st, 2, dt, () => V.put(false, v.p.x + rnd(-0.3, 0.3), 0.06, v.p.z + rnd(-0.3, 0.3), rnd(-0.2, 0.2), rnd(0.05, 0.2), rnd(-0.2, 0.2), rnd(0.8, 1.2), 1, 0, 0.08, 0.22, V.CELL.smoke, 0, V.lin(0xc8b89a), 0.35, rnd(0, 6), rnd(-1, 1))); },
  wind(v, o, st, dt) {
    emit(st, 4, dt, () => { const a = rnd(0, PI * 2), r = rnd(0.4, 0.7); V.put(true, v.p.x + cos(a) * r, rnd(0.3, 1.4), v.p.z + sin(a) * r, -sin(a) * 2.5, rnd(0, 0.2), cos(a) * 2.5, 0.25, 0.5, 0, 0.03, 0, V.CELL.streak, 2, V.lin(hexOf(o, 0xeafff8), 1.6), 0.8); });
  },
  bubbles(v, o, st, dt) { emit(st, 2.5, dt, () => { const [x, y, z] = body(v, 0.7); V.put(true, x, y, z, rnd(-0.1, 0.1), rnd(0.3, 0.6), rnd(-0.1, 0.1), rnd(1, 1.6), 0.5, -0.1, 0.06, 0.1, V.CELL.bubble, 0, V.lin(hexOf(o, 0x9fe8ff), 1.6), 1); }); },
  jet(v, o, st, dt) {
    for (const name of [].concat(o.at || [])) {
      const q = at(v, name); if (!q) continue;
      emit(st[name] || (st[name] = {}), 18, dt, () => V.put(true, q[0], q[1], q[2], rnd(-0.1, 0.1), -rnd(1.5, 2.5), rnd(-0.1, 0.1), rnd(0.12, 0.22), 1, 0, 0.08, 0.01, V.CELL.dot, 0, V.lin(Math.random() < 0.5 ? hexOf(o, 0x6ff0ff) : 0xffffff, 2.4), 1));
    }
  },
  glyphs(v, o, st, dt) { emit(st, 2, dt, () => { const a = rnd(0, PI * 2); V.put(true, v.p.x + cos(a) * 0.55, rnd(0.4, 1.4), v.p.z + sin(a) * 0.55, -sin(a) * 0.6, 0.15, cos(a) * 0.6, rnd(1, 1.6), 0.3, 0, 0.1, 0.06, V.CELL.rune, 0, V.lin(hexOf(o, 0xffffff), 2), 1, 0, rnd(-1, 1)); }); },
  ink(v, o, st, dt) { emit(st, 2, dt, () => { const [x, y, z] = body(v, 0.8); V.put(false, x, y, z, 0, -0.3, 0, 0.8, 0, 2, 0.06, 0.04, V.CELL.drop, 0, V.lin(0x101014), 0.9); }); },
  hexbits(v, o, st, dt) { emit(st, 4, dt, () => { const [x, y, z] = body(v); V.put(true, x, y, z, 0, rnd(0.3, 0.6), 0, rnd(0.6, 1), 0, 0, 0.05, 0.03, V.CELL.pixel, 0, V.lin(hexOf(o, 0x4fe6ff), 2.2), 1); }); },
  glitch(v, o, st, dt) { emit(st, 5, dt, () => { const [x, y, z] = body(v, 1); V.put(true, x, y, z, 0, 0, 0, rnd(0.05, 0.15), 0, 0, rnd(0.05, 0.12), 0.06, V.CELL.pixel, 0, V.lin(Math.random() < 0.5 ? 0xffffff : hexOf(o, 0xff3bc8), 2), 1); }); },
  swirl(v, o, st, dt) {
    emit(st, 6, dt, () => { const a = rnd(0, PI * 2), r = 0.6; V.put(true, v.p.x + cos(a) * r, rnd(0.2, 1.2), v.p.z + sin(a) * r, -sin(a) * 1.4 - cos(a) * 0.5, 0.2, cos(a) * 1.4 - sin(a) * 0.5, 0.7, 0, 0, 0.05, 0.01, V.CELL.dot, 0, V.lin(hexOf(o, 0xbfe8ff), 2), 1); });
  },
  afterimage(v, o, st, dt) { emit(st, 3, dt, () => V.put(true, v.p.x + rnd(-0.1, 0.1), 0.8, v.p.z + rnd(-0.1, 0.1), rnd(-0.4, 0.4), 0, rnd(-0.4, 0.4), 0.35, 1, 0, 0.5, 0.6, V.CELL.dot, 0, V.lin(hexOf(o, 0xffffff), 0.5), 0.5)); },
  flare(v, o, st, dt) {
    st.next = (st.next == null ? rnd(0, 2) : st.next) - dt;
    if (st.next <= 0) { st.next = rnd(1.8, 2.8); V.put(true, v.p.x, 1.2, v.p.z, 0, 0, 0, 0.3, 0, 0, 0.3, 1.1, V.CELL.star, 0, V.lin(hexOf(o, 0xffffff), 2.2), 1); }
  },
  shock(v, o, st, dt) {
    st.next = (st.next == null ? rnd(0, 2) : st.next) - dt;
    if (st.next <= 0) { st.next = rnd(2, 3); V.decal(v.p.x, v.p.z, 0, 1.1, { col: hexOf(o, 0xffffff), k: 1.4, dur: 0.6 }); }
  },
  glow(v, o, st, dt) {
    const q = (o.at && at(v, o.at)) || [v.p.x, 0.9, v.p.z], r = Math.min(1.4, (o.r || 40) / 90);
    V.put(true, q[0], q[1], q[2], 0, 0, 0, 0.03, 0, 0, r, r, V.CELL.dot, 0, V.lin(hexOf(o, 0xffe6a0), 0.9), 0.55 + 0.15 * sin(clock * 3));
  },
  rays(v, o, st, dt) { emit(st, 3, dt, () => { const a = rnd(0, PI * 2); V.put(true, v.p.x, 1.1, v.p.z, cos(a) * 1.5, sin(a) * 1.5 + 0.3, -0.3, 0.35, 1, 0, 0.05, 0, V.CELL.streak, 2.2, V.lin(hexOf(o, 0xffe6a0), 1.8), 0.8); }); },
  pillar(v, o, st, dt) {
    st.next = (st.next == null ? rnd(0, 3) : st.next) - dt;
    if (st.next <= 0) { st.next = rnd(3, 4.5); H.skyBeam(v.p.x, v.p.z, hexOf(o, 0xffffff), 0.08, 0.45, 6); }
  },
  beam(v, o, st, dt) { const q = at(v, "beam") || at(v, "handR"); if (q) V.put(true, q[0], q[1], q[2], 0, 0, 0, 0.03, 0, 0, 0.18, 0.18, V.CELL.dot, 0, V.lin(0xfff2a0, 1.6), 0.8); },
};
function drawCardAuras(dt) {
  for (const v of views.values()) {
    if (!v.R || !v.R.m) continue;
    const d = AF.UNIT[v.p.u.k]; if (!d) continue;
    const st = v.cardSt || (v.cardSt = []);
    (d.fx || []).forEach((o, i) => { const f = CARD[o.k]; if (f) f(v, o, st[i] || (st[i] = {}), dt); });
    // the trait's own glow: motes in its colour, a ring now and then for the strong ones, every colour for the top
    const tr = AF.traitOf(v.p.u);
    if (tr && tr.tier >= 2) {
      const tc = tr.tier >= 6 ? "rainbow" : (AF.TRAIT_TIERS[tr.tier] || {}).color || 0xffffff;
      CARD.motes(v, { c: tc, rate: 4 + tr.tier * 2, size: 1.4 }, st.tr || (st.tr = {}), dt);
      if (tr.tier >= 4) CARD.ring(v, { c: tc === "rainbow" ? 0xffffff : tc, every: 2 }, st.tr2 || (st.tr2 = {}), dt);
    }
    if (v.p.u.sh) { CARD.stars(v, { c: "rainbow", rate: 5 }, st.sh1 || (st.sh1 = {}), dt); CARD.motes(v, { c: "rainbow", rate: 8, size: 1.2 }, st.sh2 || (st.sh2 = {}), dt); }
  }
}
let clock = 0;
X.frame = dt => {
  if (!V || !V.on) return;
  M = getM(); if (!M) return;
  clock += dt;
  drawShots(dt); drawFalls(dt); drawFields(dt); drawOrbits(dt, clock); drawPets(dt, clock); drawBeams(dt, clock); drawAuras(dt); drawStatus(dt, clock); drawCardAuras(dt);
  for (const f of X.HOOK.frame) f(dt, clock);
};
X.bind = o => {
  V = AF.VFX; views = o.views; world = o.world; sfx = o.sfx; getM = o.M; label = o.label || (() => {});
  pools.clear(); shots.clear(); orbits.clear(); petMeshes.clear(); beams.clear(); orbs.clear(); bombs.clear(); cache.clear();
  falls.length = 0; fields.length = 0; bombGeo = null;
};
// (30 Oct) what tdrel.js (the gate units' Releases) borrows
X.lend = () => ({ V, H, ctx, take, give, world, views, sfx, MODELS });
X.unbind = () => { pools.clear(); shots.clear(); orbits.clear(); petMeshes.clear(); beams.clear(); orbs.clear(); falls.length = 0; fields.length = 0; cache.clear(); };
X.isSlowIce = e => !!(e.slowP && e.slowP.u && AF.ATTACKS[e.slowP.u.k] && AF.ATTACKS[e.slowP.u.k].el === "ice");

// ---------------- poses ----------------
// how long an attack's motion lasts (decay per second of v.atk)
X.decay = p => { const k = p.s.kind; return k === "nova" || k === "chain" || k === "slam" || k === "stop" || k === "strike" || k === "volley" || k === "field" || k === "hole" ? 3.2 : k === "dash" ? 3.6 : k === "spin" ? 3.4 : 5; };
const POSE = {
  swing(v, s, e, R) { const d = (v.combo || 1) % 2 ? 1 : -1; R.armR.rotation.set(-1.5 - 0.4 * sin(PI * s), 0, d * (1.5 - 3 * e)); v.holder.position.z = 0.18 * sin(PI * s); v.holder.rotation.y = d * -0.3 * sin(PI * s); },
  punch(v, s, e, R) { const a = (v.combo || 1) % 2 ? R.armR : R.armL; a.rotation.set(-1.57 * sin(PI * Math.min(1, s * 1.6)), 0, 0); v.holder.position.z = 0.15 * sin(PI * s); },
  throw(v, s, e, R) { R.armR.rotation.set(-3.0 + 3.5 * e, 0, 0.2); R.armL.rotation.set(-0.8 * (1 - e), 0, -0.3); v.holder.rotation.x = 0.2 * sin(PI * s); },
  side(v, s, e, R) { R.armR.rotation.set(-1.4, 0, 1.4 - 2.6 * e); v.holder.rotation.y = 0.5 * sin(PI * s); },
  aim(v, s, e, R) { const a = v.hand ? R.armR : R.armL, b = v.hand ? R.armL : R.armR; a.rotation.set(-1.57 + 0.35 * sin(PI * s), 0, 0); b.rotation.set(-0.6, 0, 0); v.holder.position.z = -0.05 * sin(PI * s); },
  rifle(v, s, e, R) { R.armR.rotation.set(-1.5, 0, 0.1); R.armL.rotation.set(-1.35, 0, -0.35); v.holder.position.z = -0.1 * sin(PI * s); },
  bow(v, s, e, R) { R.armL.rotation.set(-1.57, 0, 0); R.armR.rotation.set(-1.57, 0, s < 0.5 ? -0.6 * (s / 0.5) : -0.6 + 1.0 * ((s - 0.5) / 0.5)); },
  cast(v, s, e, R) { R.armR.rotation.set(-2.2 + 0.9 * e, 0, 0.3); R.armL.rotation.set(-2.2 + 0.9 * e, 0, -0.3); v.holder.position.y = 0.07 * sin(PI * s); },
  raise(v, s, e, R) { R.armR.rotation.set(-3.0 + 1.4 * e, 0, 0.12); R.armL.rotation.set(-0.4, 0, -0.3); v.holder.position.y = 0.1 * sin(PI * s); },
  ground(v, s, e, R) { R.armR.rotation.set(-1.0 - 0.8 * sin(PI * s), 0, 0.2); R.armL.rotation.set(-1.0 - 0.8 * sin(PI * s), 0, -0.2); v.holder.rotation.x = 0.25 * sin(PI * s); },
  slam(v, s, e, R) {
    const up = s < 0.4 ? s / 0.4 : Math.max(0, 1 - (s - 0.4) / 0.25);
    R.armR.rotation.set(-0.5 - 2.6 * up, 0, 0.25); R.armL.rotation.set(-0.5 - 2.6 * up, 0, -0.25);
    v.holder.position.y = 0.24 * Math.max(0, sin(Math.min(1, s / 0.55) * PI));
    if (s > 0.55 && s < 0.8) v.holder.scale.y *= 1 - 0.12 * sin(((s - 0.55) / 0.25) * PI);
  },
  spin(v, s, e, R) { v.holder.rotation.y = -e * PI * 2 * (v.p.s.kind === "spin" ? 2 : 1); R.armR.rotation.set(-1.4, 0, 1.3); R.armL.rotation.set(-1.4, 0, -1.3); },
  dash(v, s, e, R) { v.holder.position.z = (v.lunge || 1.2) * sin(PI * s); R.armR.rotation.set(-1.6, 0, 0.9 - 1.8 * e); v.holder.rotation.x = 0.25 * sin(PI * s); },
  summon(v, s, e, R) { R.armR.rotation.set(-2.6 * sin(PI * s), 0, 0.3); },
};
const POSE_OF = { shot: "aim", rapid: "aim", snipe: "rifle", pierce: "throw", spread: "throw", boomer: "side", seek: "cast", tack: "cast", lob: "throw", mortar: "throw", strike: "raise", volley: "raise",
  field: "ground", hole: "cast", chain: "raise", beam: "aim", nova: "slam", spin: "spin", orbit: "cast", stop: "cast", slash: "swing", combo: "swing", slam: "slam", dash: "dash", summon: "summon" };
X.pose = (v, s, e, R) => {
  const key = v.p.u.k, hp = X.HOOK.pose[key];
  if (hp && hp(v, s, e, R)) return true;
  if (OLD_POSE_OF[key]) { OLD_POSE_OF[key](v, s, e, R); return true; }
  const A = AF.ATTACKS[key]; if (!A) return false;
  let pz = POSE_OF[A.kind] || "cast";
  if ((A.kind === "slash" || A.kind === "combo") && (A.shape === "fist" || A.shape === "palm" || A.shape === "mechFist")) pz = "punch";
  if ((A.kind === "pierce" || A.kind === "volley") && /arrow/i.test(A.shape)) pz = "bow";
  if (A.kind === "slam" && (A.shape === "fist" || A.shape === "palm" || A.shape === "mechFist")) pz = "punch";
  POSE[pz](v, s, e, R);
  return true;
};

// ---- the first five, hand-built (moved here from board.js) ----
// (29 Oct, requests: "since these are only lvl 1 these should be just very slightly toned down, and then at the max
// level it should get pretty crazy" and "i dont just want the brightness and size to grow, i want there to actually
// be more going on when you get to higher levels"): every attack is built in layers. Tier 0 (levels 0-1) is the plain
// attack; levels 2-3, 4-5 and 6 each add new pieces on top of the last, and sizes and particle counts climb a little
// with every level. Each handler takes an event and returns true when it drew it.
const tierOf = p => (p.lv >= 6 ? 3 : p.lv >= 4 ? 2 : p.lv >= 2 ? 1 : 0);
const LV = p => { const k = p.lv / TD.UP.max; return { T: tierOf(p), k, s: 0.9 + 0.3 * k, n: x => Math.max(1, Math.round(x * (0.8 + 0.7 * k))) }; };
const FIRE = [0xffb02e, 0xff5a1a, 0xffe2a0];
// a column of flame going up from the ground
function flameColumn(x, z, n, h = 1, w = 0.3) {
  const C = V.CELL;
  V.burst(true, x, 0.1, z, n, { cols: [0xff8a2a, 0xff4a1a, 0xffd27a], dir: [0, 1, 0], cone: 0.15, speed: [2.5 * h, 5 * h], life: [0.35, 0.65], size: [0.5, 0.1], cell: C.flame, rot: 0, k: 2.2, spread: w, flatSpread: true, drag: 1.2 });
  V.burst(false, x, 0.8 * h, z, Math.ceil(n / 3), { cols: [0x3a3438, 0x4a4448], dir: [0, 1, 0], cone: 0.3, speed: [1, 2], life: [0.8, 1.4], size: [0.4, 1.1], cell: C.smoke, a: 0.5, drag: 1.5, spin: 1, delay: 0.2 });
}
// a small blast (Hex's bomblets)
function miniBoom(x, z, r) {
  const C = V.CELL;
  V.burst(true, x, 0.4, z, 1, { cols: [0xfff0c0], speed: [0, 0], life: [0.1, 0.1], size: [r * 2, r * 2.6], cell: C.dot, k: 2.4, fixed: true });
  V.burst(true, x, 0.35, z, 12, { cols: [0xffd27a, 0xff8a2a, 0xff4a1a], speed: [0.6, 2], up: 1, life: [0.25, 0.5], size: [0.4, 0.1], cell: C.dot, k: 2.2, drag: 3, grav: -1 });
  V.burst(true, x, 0.35, z, 14, { cols: [0xffe08a, 0xffffff], speed: [3, 7], up: 1.5, life: [0.15, 0.35], size: [0.04, 0], cell: C.hot, stretch: 1.4, k: 3, drag: 3, grav: 8 });
  V.burst(false, x, 0.4, z, 5, { cols: [0x45454c, 0x2e2e34], speed: [0.4, 1], up: 0.7, life: [0.7, 1.2], size: [0.35, 0.9], cell: C.smoke, a: 0.7, drag: 2, grav: -0.4, spin: 1 });
  V.decal(x, z, 0, r * 1.4, { col: 0xffb04a, k: 2.2, dur: 0.3 });
  V.decal(x, z, 1, r * 0.8, { col: 0x140c08, dur: 3 });
  sfx("tdBoom", {}, 0.09);
}
const OLD = {
  iaido(ev, p) {
    const C = V.CELL, L = LV(p);
    if (ev.t === "fire") { const v = views.get(p.id); if (v) { v.atk = 1; v.combo = p.combo; } return true; }
    if (ev.t === "melee") {
      const n = ev.n % 3, f = p.face, x = ev.x, z = ev.z, r = 1.2 * L.s;
      V.slash(x, 0.62, z, { ang: f, tilt: n === 1 ? 0.45 : -0.45, flip: n === 2, r, col: 0xff4a1a, core: 0xfff2c8, dur: 0.24 });
      // the third swing crosses; from level 4 every swing does
      if (n === 0 || L.T >= 2) V.slash(x, 0.7, z, { ang: f, tilt: n === 1 ? -0.5 : 0.5, r: r * 1.15, col: 0xff7a1a, core: 0xffffff, dur: 0.27, delay: 0.05, flip: n !== 2 });
      // level 2: an afterimage of the cut, a beat behind and darker
      if (L.T >= 1) V.slash(x, 0.6, z, { ang: f + 0.18, tilt: n === 1 ? 0.3 : -0.3, flip: n === 2, r: r * 0.92, col: 0xb02a10, core: 0xff9a5a, k: 1.2, dur: 0.3, delay: 0.09 });
      V.burst(true, x, 0.6, z, L.n(12), { cols: FIRE, speed: [2, 6], up: 1, life: [0.2, 0.45], size: [0.07 * L.s, 0], cell: C.hot, stretch: 1.2, k: 2.6, grav: 6, drag: 2 });
      V.burst(true, x, 0.6, z, 1, { cols: [0xffb070], speed: [0, 0], life: [0.09, 0.09], size: [0.4 * L.s, 0.7 * L.s], cell: C.dot, k: 1, fixed: true });
      // level 2: flames lick up where the cut lands
      if (L.T >= 1) V.burst(true, x, 0.1, z, L.n(7), { cols: [0xff8a2a, 0xff4a1a, 0xffd27a], dir: [0, 1, 0], cone: 0.25, speed: [0.8, 1.8], life: [0.35, 0.6], size: [0.28, 0.05], cell: C.flame, rot: 0, k: 2, spread: 0.35, flatSpread: true, delay: 0.2 });
      // level 4: the ground under the target burns a moment
      if (L.T >= 2) V.decal(x, z, 3, 0.9, { col: 0xff5a1a, k: 1.4, dur: 0.6 });
      // max: the iai flash, one hard line of light straight through the target
      if (L.T >= 3) {
        const a = f + (n === 1 ? 0.7 : -0.7), dx = sin(a) * 3, dz = cos(a) * 3;
        V.bolt([x - dx, 0.65, z - dz], [x + dx, 0.65, z + dz], { col: 0xff7a2a, w: 0.05, dur: 0.12, depth: 1, jag: 0 });
        if (n === 0) { V.flash(0xff8a3a, 0.16); V.shake(0.06); }
      }
      sfx("tdSlash");
      return true;
    }
    if (ev.t === "swell") {
      const r = 1.3 * L.s;
      V.crescent(ev.x, ev.z, ev.dx, ev.dz, ev.len, ev.speed, { r, trail: L.T >= 3 });
      // level 4: a second crescent a beat behind, turned the other way
      if (L.T >= 2) V.later(0.08, () => V.crescent(ev.x, ev.z, ev.dx, ev.dz, ev.len, ev.speed, { r: r * 0.85, col: 0xff8a1a, flip: true }));
      V.burst(true, ev.x, 0.5, ev.z, L.n(16), { cols: FIRE, speed: [1, 4], dir: [ev.dx, 0.3, ev.dz], cone: 0.6, life: [0.2, 0.4], size: [0.08, 0], cell: C.hot, stretch: 1, k: 2.6, drag: 2 });
      // max: a pillar of flame where the wave ends
      if (L.T >= 3) { const ex = ev.x + ev.dx * ev.len, ez = ev.z + ev.dz * ev.len; V.later(ev.len / ev.speed, () => { flameColumn(ex, ez, 34, 1.3, 0.35); V.decal(ex, ez, 3, 1.2, { col: 0xff5a1a, k: 1.8, dur: 0.8 }); V.shake(0.08); }); }
      V.shake(0.04 + 0.03 * L.T); sfx("tdSlash", {}, 0);
      return true;
    }
    if (ev.t === "cut") {
      V.slash(ev.x, 0.6, ev.z, { ang: p.face + PI / 2, tilt: V.rnd(-0.6, 0.6), r: 0.8 * L.s, dur: 0.16, col: 0xff5a1a });
      V.burst(true, ev.x, 0.6, ev.z, L.n(8), { cols: FIRE, speed: [1.5, 4], up: 1.2, life: [0.2, 0.4], size: [0.06, 0], cell: C.hot, stretch: 1, k: 2.6, grav: 6 });
      if (L.T >= 1) V.burst(true, ev.x, 0.1, ev.z, L.n(5), { cols: [0xff8a2a, 0xffd27a], dir: [0, 1, 0], cone: 0.25, speed: [0.8, 1.6], life: [0.3, 0.5], size: [0.25, 0.05], cell: C.flame, rot: 0, k: 2, spread: 0.3, flatSpread: true });
      return true;
    }
    return false;
  },
  bomb(ev, p) {
    const C = V.CELL, L = LV(p);
    if (ev.t === "fire") { const v = views.get(p.id); if (v) v.atk = 1; return true; }
    if (ev.t !== "boom") return false;
    const x = ev.x, z = ev.z, r = ev.r * (0.9 + 0.2 * L.k);
    V.burst(true, x, 0.5, z, 1, { cols: [0xfff0c0], speed: [0, 0], life: [0.12, 0.12], size: [r * 1.7, r * 2.3], cell: C.dot, k: 2.1, fixed: true });
    V.burst(true, x, 0.35, z, L.n(24), { cols: [0xffd27a, 0xff8a2a, 0xff4a1a, 0xffb02e], speed: [0.8, 2.6], up: 1.4, life: [0.3, 0.65], size: [0.55 * L.s, 0.12], cell: C.dot, k: 1.8, drag: 3.2, grav: -1.5, spread: r * 0.25 });
    V.burst(false, x, 0.5, z, L.n(14), { cols: [0x3a3a40, 0x55555c, 0x2a2a2e], speed: [0.5, 1.7], up: 1, life: [1.0, 1.9], size: [0.5, 1.3 * L.s], cell: C.smoke, a: 0.8, drag: 2.2, grav: -0.45, spin: 1, spread: r * 0.3, delay: 0.1 });
    V.burst(false, x, 0.3, z, L.n(11), { cols: [0x2a2420, 0x4a3a2a, 0x6a5a4a], speed: [3, 6.5], up: 3, life: [0.6, 1], size: [0.1, 0.07], cell: C.shard, grav: 14, spin: 14 });
    V.burst(true, x, 0.4, z, L.n(26), { cols: [0xffe08a, 0xffffff, 0xffb04a], speed: [4, 10], up: 2, life: [0.2, 0.5], size: [0.05, 0], cell: C.hot, stretch: 1.6, k: 3, drag: 3, grav: 8 });
    V.decal(x, z, 0, r * 1.3, { col: 0xffb04a, k: 2.2, dur: 0.4 });
    V.decal(x, z, 1, r * 0.95, { col: 0x140c08, dur: 4.5 });
    // level 2: a second, wider shockwave, and the scorch keeps burning a moment
    if (L.T >= 1) {
      V.later(0.09, () => V.decal(x, z, 0, r * 1.9, { col: 0xffd27a, k: 1.6, dur: 0.5 }));
      V.decal(x, z, 3, r * 0.8, { col: 0xff6a1a, k: 1.2, dur: 1.4 });
      V.burst(true, x, 0.1, z, L.n(10), { cols: [0xffb02e, 0xff5a1a], dir: [0, 1, 0], cone: 0.4, speed: [0.5, 1.4], life: [0.4, 0.8], size: [0.06, 0], cell: C.hot, k: 2.4, spread: r * 0.5, flatSpread: true, delay: 1.0 });
    }
    // level 4: bomblets fly out and go off round the blast (six at max)
    if (L.T >= 2) {
      const nb = L.T >= 3 ? 6 : 3;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * PI * 2 + V.rnd(-0.4, 0.4), d = r * V.rnd(0.7, 1.15), bx = x + cos(a) * d, bz = z + sin(a) * d;
        V.put(false, x, 0.5, z, cos(a) * d / 0.22, 4, sin(a) * d / 0.22, 0.22, 0, 30, 0.12, 0.12, C.dot, 0, V.lin(0x23232a), 1);
        V.later(0.2 + i * 0.05, () => miniBoom(bx, bz, r * 0.42));
      }
    }
    // max: a mushroom cloud: a column of fire, a cap of smoke rolling out at the top, a ring of debris on the ground
    if (L.T >= 3) {
      V.burst(true, x, 0.4, z, 36, { cols: [0xffd27a, 0xff8a2a, 0xff4a1a], dir: [0, 1, 0], cone: 0.12, speed: [3, 6], life: [0.45, 0.8], size: [0.6, 0.2], cell: C.dot, k: 1.8, drag: 1.4, spread: 0.25 });
      V.later(0.3, () => {
        V.burst(false, x, 3.1, z, 26, { cols: [0x4a4248, 0x5a5258, 0x3a343a], flat: true, speed: [0.8, 1.8], up: 0.3, life: [1.2, 2], size: [0.8, 1.8], cell: C.smoke, a: 0.75, drag: 1.4, spin: 0.8 });
        V.burst(true, x, 3.0, z, 14, { cols: [0xff8a2a, 0xffb02e], flat: true, speed: [0.6, 1.4], life: [0.4, 0.7], size: [0.6, 0.2], cell: C.dot, k: 1.8, drag: 1.4 });
      });
      V.burst(false, x, 0.2, z, 24, { cols: [0x5a4a3a, 0x3a2e24], flat: true, speed: [4, 7], up: 1.2, life: [0.5, 0.8], size: [0.12, 0.08], cell: C.shard, grav: 10, spin: 12 });
      V.flash(0xffe0b0, 0.22);
    }
    V.ripple(x, 0.3, z, 0.004 + 0.003 * L.T, 1.5); V.shake(0.12 + 0.06 * L.T); V.chroma(0.002 + 0.001 * L.T);
    sfx("tdBoom");
    return true;
  },
  frost(ev, p) {
    const C = V.CELL, L = LV(p);
    if (ev.t === "fire") { const v = views.get(p.id); if (v) v.atk = 1; return true; }
    if (ev.t !== "nova") return false;
    const x = p.x, z = p.z, r = ev.r, hits = ev.hits.map(o => [o.x, o.z, o.def.size]);
    // the slam lands a beat after the spear goes up
    V.later(0.12, () => {
      V.decal(x, z, 0, r, { col: 0x9fe8ff, k: 1.2, dur: 0.5 });
      V.decal(x, z, 2, r * (L.T >= 2 ? 0.95 : 0.8), { col: 0x7fd8ff, k: 0.55, dur: L.T >= 2 ? 3 : 1.6 });
      V.burst(true, x, 0.15, z, L.n(30), { cols: [0xd8f6ff, 0x9fe8ff, 0xffffff], speed: [r * 1.6, r * 2.6], flat: true, life: [0.3, 0.55], size: [0.11, 0.02], cell: C.star, k: 1.8, drag: 3, spin: 6 });
      V.burst(false, x, 0.2, z, 10, { cols: [0xeaf6ff, 0xd8ecff], speed: [r * 0.8, r * 1.5], flat: true, life: [0.6, 1.0], size: [0.35, 0.8], cell: C.smoke, a: 0.22, drag: 2.5, grav: -0.3, spin: 1 });
      for (const [ox, oz, os] of hits) {
        V.spikes(ox, oz, (0.7 + os * 0.35) * (L.T >= 2 ? 1.25 : 1));
        V.burst(true, ox, 0.4, oz, L.n(6), { cols: [0xffffff, 0x9fe8ff], speed: [1, 3], up: 1.5, life: [0.25, 0.45], size: [0.08, 0], cell: C.shard, k: 2.4, grav: 5, spin: 8 });
      }
      // level 2: a ring of ice spikes bursts up round the edge of the nova, and the snow swirls outward
      if (L.T >= 1) {
        const ns = 8 + 2 * L.T;
        for (let i = 0; i < ns; i++) { const a = (i / ns) * PI * 2; V.later(i * 0.018, () => V.spikes(x + cos(a) * r * 0.92, z + sin(a) * r * 0.92, 0.75)); }
        for (let i = 0; i < L.n(24); i++) { const a = V.rnd(0, PI * 2), rr = V.rnd(0.3, 1) * r * 0.5; V.put(true, x + cos(a) * rr, V.rnd(0.2, 1.2), z + sin(a) * rr, -sin(a) * 3 + cos(a) * 1.5, V.rnd(0.2, 0.8), cos(a) * 3 + sin(a) * 1.5, V.rnd(0.6, 1), 1.2, 0.3, 0.08, 0.03, C.star, 0, V.lin(0xeaf8ff, 1.8), 1, 0, V.rnd(-4, 4)); }
      }
      // level 4: a second ring, and snow keeps falling on the frozen ground
      if (L.T >= 2) {
        V.later(0.1, () => V.decal(x, z, 0, r * 1.15, { col: 0xd8f6ff, k: 1.0, dur: 0.55 }));
        V.burst(true, x, 2, z, L.n(18), { cols: [0xffffff, 0xd8f6ff], speed: [0.1, 0.4], life: [1.2, 2], size: [0.07, 0.04], cell: C.star, k: 1.5, grav: 0.5, spread: r * 0.8, spin: 3, delay: 0.8 });
      }
      // max: pillars of ice round the Warden, icicles raining on everything it hit, a cold flash
      if (L.T >= 3) {
        for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2 + 0.3; V.spikes(x + cos(a) * 0.85, z + sin(a) * 0.85, 1.7); }
        for (const [ox, oz] of hits) {
          for (let k = 0; k < 4; k++) V.put(true, ox + V.rnd(-0.4, 0.4), 4.5, oz + V.rnd(-0.4, 0.4), 0, -6, 0, 0.6, 0, 6, 0.1, 0.1, C.shard, 1.2, V.lin(0xd8f6ff, 2.2), 1, 0, 0, k * 0.06);
          V.later(0.55, () => V.burst(true, ox, 0.2, oz, 8, { cols: [0xffffff, 0x9fe8ff], speed: [1, 2.5], up: 1, life: [0.2, 0.4], size: [0.06, 0], cell: C.shard, k: 2.4, grav: 5, spin: 8 }));
        }
        V.flash(0xbfe8ff, 0.1);
      }
      V.ripple(x, 0.2, z, 0.0025 + 0.002 * L.T, 1.3); V.shake(0.06 + 0.03 * L.T);
      sfx("tdBoom", {}, 0.05);
    });
    return true;
  },
  storm(ev, p) {
    const C = V.CELL, L = LV(p);
    if (ev.t === "fire") { const v = views.get(p.id); if (v) v.atk = 1; return true; }
    if (ev.t !== "chain") return false;
    const pts = ev.pts, [tx, tz] = pts[1], [cx, , cz] = VW(p, 0.7, 0, 0), s = L.s;
    V.slash(cx, 0.9, cz, { ang: p.face, tilt: -1.15, r: 1.35 * s, col: 0x2f8fff, core: 0xd8f6ff, dur: 0.24, delay: 0.1, pitch: 1.1 });
    V.later(0.12, () => V.burst(true, cx, 0.6, cz, L.n(12), { cols: [0xbff2ff, 0x4fb8ff], speed: [2, 5], up: 1, life: [0.15, 0.3], size: [0.05, 0], cell: C.hot, stretch: 1.3, k: 3, grav: 6 }));
    // level 2: a thunderhead gathers where the bolt comes from
    if (L.T >= 1) V.burst(false, tx + 0.5, 8.6, tz - 0.7, L.n(9), { cols: [0x2a3040, 0x3a4256, 0x232836], flat: true, speed: [0.3, 0.9], life: [0.9, 1.5], size: [1.1, 2.2], cell: C.smoke, a: 0.7, drag: 1, spin: 0.6, spread: 0.6 });
    // max: arcs crawl up out of the ground into the raised sword
    if (L.T >= 3) for (let i = 0; i < 2; i++) { const a = V.rnd(0, PI * 2); V.bolt([p.x + cos(a) * 0.9, 0.05, p.z + sin(a) * 0.9], VW(p, 0.15, 0.3, 2.0), { col: 0x9fe8ff, w: 0.05, dur: 0.16, depth: 4, jag: 0.25 }); }
    // the strike lands with the downswing
    V.later(0.12, () => {
      V.bolt([tx + 0.5, 9, tz - 0.7], [tx, 0.08, tz], { col: 0x4fb8ff, w: 0.17 * s, dur: 0.3, forks: 2 + L.T, depth: 6, jag: 0.12 });
      V.decal(tx, tz, 0, 1.3 * s, { col: 0x7fd0ff, k: 2.4, dur: 0.4 });
      V.decal(tx, tz, 3, 0.9 * s, { col: 0x4fb8ff, k: 1.6, dur: 0.35 });
      V.burst(true, tx, 0.2, tz, L.n(22), { cols: [0xbff2ff, 0x4fb8ff, 0xffffff], speed: [3, 7.5], up: 2.5, life: [0.2, 0.45], size: [0.06, 0], cell: C.hot, stretch: 1.5, k: 3, grav: 9, drag: 2 });
      V.burst(true, tx, 0.6, tz, 1, { cols: [0xbfe8ff], speed: [0, 0], life: [0.12, 0.12], size: [1.8 * s, 2.4 * s], cell: C.dot, k: 1.8, fixed: true });
      for (let j = 2; j < pts.length; j++) {
        const [ax, az] = pts[j - 1], [bx, bz] = pts[j];
        V.bolt([ax, 0.55, az], [bx, 0.55, bz], { col: 0x7fd0ff, w: 0.08 * s, dur: 0.24, depth: 4, jag: 0.25, forks: L.T >= 2 ? 1 : 0 });
        V.burst(true, bx, 0.55, bz, L.n(7), { cols: [0xbff2ff, 0xffffff], speed: [1.5, 4], life: [0.15, 0.3], size: [0.05, 0], cell: C.hot, stretch: 1.2, k: 3, grav: 6 });
      }
      // level 4: two more strikes come down round the target
      if (L.T >= 2) for (let i = 0; i < 2; i++) {
        const ox = tx + V.rnd(-1.6, 1.6), oz = tz + V.rnd(-1.6, 1.6);
        V.later(0.05 + i * 0.06, () => { V.bolt([ox + 0.4, 9, oz - 0.6], [ox, 0.08, oz], { col: 0x6fc8ff, w: 0.1 * s, dur: 0.22, forks: 1, depth: 5, jag: 0.14 }); V.decal(ox, oz, 0, 0.9, { col: 0x7fd0ff, k: 2, dur: 0.35 }); V.burst(true, ox, 0.2, oz, 10, { cols: [0xbff2ff, 0xffffff], speed: [2, 5], up: 2, life: [0.15, 0.35], size: [0.05, 0], cell: C.hot, stretch: 1.3, k: 3, grav: 8 }); });
      }
      // max: a pillar of light shoots up out of the strike
      if (L.T >= 3) {
        V.burst(true, tx, 0.1, tz, 26, { cols: [0xd8f6ff, 0x7fd0ff, 0xffffff], dir: [0, 1, 0], cone: 0.04, speed: [6, 13], life: [0.25, 0.45], size: [0.12, 0.04], cell: C.hot, stretch: 2.2, k: 3, spread: 0.35, flatSpread: true });
        V.decal(tx, tz, 0, 2.4, { col: 0xbfe8ff, k: 2.2, dur: 0.6 });
      }
      V.flash(0xbfe8ff, 0.16 + 0.07 * L.T); V.chroma(0.002 + 0.001 * L.T); V.shake(0.1 + 0.05 * L.T); V.ripple(tx, 0.2, tz, 0.003 + 0.002 * L.T, 1.8);
      sfx("tdZap");
    });
    return true;
  },
  twin(ev, p) {
    const C = V.CELL, L = LV(p);
    if (ev.t === "fire") {
      const v = views.get(p.id); if (v) { v.atk = 1; v.hand = p.hand; }
      const [mx, my, mz] = VW(p, 0.62, p.hand ? 0.34 : -0.34, 0.92), f = p.face;
      V.burst(true, mx, my, mz, 1, { cols: [0x9ff4ff], speed: [0, 0], life: [0.06, 0.06], size: [0.45 * L.s, 0.25], cell: C.star, k: 2.6, fixed: true });
      V.burst(true, mx, my, mz, L.n(4), { cols: [0x4fe6ff, 0xffffff], speed: [2, 5], dir: [sin(f), 0.1, cos(f)], cone: 0.5, life: [0.08, 0.16], size: [0.04, 0], cell: C.hot, stretch: 1, k: 3 });
      // level 2: a ring of energy off the muzzle
      if (L.T >= 1) V.put(true, mx, my, mz, sin(f) * 1.5, 0, cos(f) * 1.5, 0.16, 2, 0, 0.12, 0.6, C.ring, 0, V.lin(0x6ff0ff, 2), 1);
      // level 4: every fourth shot is a charged orb, and the jetpack fires
      const every = L.T >= 3 ? 3 : 4;
      if (L.T >= 2 && p.combo % every === 0) for (let i = M.proj.length - 1; i >= 0; i--) if (M.proj[i].p === p) { M.proj[i].big = true; break; }
      if (L.T >= 2) for (const sd of [-0.16, 0.16]) { const [jx, jy, jz] = VW(p, -0.32, sd, 0.95); V.burst(true, jx, jy, jz, 3, { cols: [0x8ff2ff, 0xffffff], dir: [0, -1, 0], cone: 0.2, speed: [2, 4], life: [0.1, 0.2], size: [0.12, 0.02], cell: C.dot, k: 2.2 }); }
      // max: a beam lances out with every shot
      if (L.T >= 3 && ev.e) V.bolt([mx, my, mz], [ev.e.x, 0.6, ev.e.z], { col: 0x4fe6ff, w: 0.035, dur: 0.07, depth: 1, jag: 0 });
      sfx("tdShot", {}, 0.05);
      return true;
    }
    if (ev.t === "hit") {
      V.burst(true, ev.x, 0.55, ev.z, L.n(7), { cols: [0x4fe6ff, 0xbff8ff, 0xffffff], speed: [1.5, 4], up: 1, life: [0.12, 0.3], size: [0.05, 0], cell: C.hot, stretch: 1.2, k: 3, grav: 5 });
      V.burst(true, ev.x, 0.55, ev.z, 1, { cols: [0x9ff4ff], speed: [0, 0], life: [0.08, 0.08], size: [0.4 * L.s, 0.65 * L.s], cell: C.dot, k: 2, fixed: true });
      if (L.T >= 3) V.decal(ev.x, ev.z, 0, 0.55, { col: 0x4fe6ff, k: 2, dur: 0.25 });
      return true;
    }
    return false;
  },
};
// a charged orb bursting where it lands
function orbBurst(x, z) {
  const C = V.CELL;
  V.burst(true, x, 0.6, z, 1, { cols: [0x9ff4ff], speed: [0, 0], life: [0.12, 0.12], size: [1.2, 1.7], cell: C.dot, k: 2.2, fixed: true });
  V.burst(true, x, 0.6, z, 22, { cols: [0x4fe6ff, 0xbff8ff, 0xffffff], speed: [2, 6], up: 1.2, life: [0.2, 0.45], size: [0.06, 0], cell: C.hot, stretch: 1.4, k: 3, grav: 5, drag: 2 });
  V.decal(x, z, 0, 1.0, { col: 0x4fe6ff, k: 2.2, dur: 0.35 });
  V.ripple(x, 0.5, z, 0.003, 1.6);
}
// the units' auras from level 2 on, thicker each tier
const AURA = {
  iaido(p, T, n) { for (let i = 0; i < n; i++) V.put(true, p.x + V.rnd(-0.45, 0.45), V.rnd(0.1, 0.6), p.z + V.rnd(-0.45, 0.45), V.rnd(-0.2, 0.2), V.rnd(0.6, 1.5), V.rnd(-0.2, 0.2), V.rnd(0.6, 1.1), 0.5, -0.4, 0.06, 0, V.CELL.hot, 0, V.lin(Math.random() < 0.5 ? 0xffb02e : 0xff5a1a, 2.4), 1); },
  bomb(p, T, n) { for (let i = 0; i < n; i++) { const [x, y, z] = VW(p, 0.3, V.rnd(-0.3, 0.3), V.rnd(0.6, 1.2)); V.put(true, x, y, z, V.rnd(-0.8, 0.8), V.rnd(0.5, 1.5), V.rnd(-0.8, 0.8), V.rnd(0.15, 0.3), 1, 4, 0.04, 0, V.CELL.hot, 0.8, V.lin(0xffd27a, 2.6), 1); } },
  frost(p, T, n) { for (let i = 0; i < n; i++) { const a = V.rnd(0, PI * 2), r = V.rnd(0.3, 0.8); V.put(true, p.x + cos(a) * r, V.rnd(1.2, 2.2), p.z + sin(a) * r, -sin(a) * 0.5, -0.4, cos(a) * 0.5, V.rnd(1.2, 2), 0.3, 0.1, 0.07, 0.04, V.CELL.star, 0, V.lin(0xeaf8ff, 1.6), 1, 0, V.rnd(-3, 3)); } },
  storm(p, T, n) {
    for (let i = 0; i < n; i++) { const [x, y, z] = VW(p, 0.15, 0.3, V.rnd(1.2, 2)); V.put(true, x, y, z, V.rnd(-1, 1), V.rnd(-1, 1), V.rnd(-1, 1), V.rnd(0.08, 0.16), 0, 0, 0.05, 0, V.CELL.hot, 1, V.lin(0xbff2ff, 3), 1); }
    if (Math.random() < 0.02 * T) V.bolt(VW(p, 0.1, V.rnd(-0.4, 0.4), V.rnd(0.4, 1)), VW(p, 0.15, 0.3, 2), { col: 0x7fd0ff, w: 0.03, dur: 0.1, depth: 3, jag: 0.3 });
  },
  twin(p, T, n) { for (const sd of [-0.16, 0.16]) for (let i = 0; i < Math.ceil(n / 2); i++) { const [x, y, z] = VW(p, -0.32, sd, 0.85); V.put(true, x, y, z, V.rnd(-0.2, 0.2), -V.rnd(1.5, 3), V.rnd(-0.2, 0.2), V.rnd(0.1, 0.22), 1, 0, 0.09, 0.01, V.CELL.dot, 0, V.lin(0x6ff0ff, 2.2), 1); } },
};
const OLD_POSE = {
  // a draw-cut each swing, alternating sides; the third is a full spin that throws the crescent
  iaido(v, s, e, R) {
    const n = (v.combo || 1) % 3;
    if (n === 0) { v.holder.rotation.y = -e * PI * 2; R.armR.rotation.set(-1.6, 0, 1.3); R.armL.rotation.set(-0.6, 0, -1.1); v.holder.position.z = 0.3 * sin(PI * s); }
    else { const d = n === 1 ? 1 : -1; R.armR.rotation.set(-1.5 - 0.4 * sin(PI * s), 0, d * (1.5 - 3 * e)); v.holder.position.z = 0.2 * sin(PI * s); v.holder.rotation.y = d * -0.35 * sin(PI * s); }
  },
  // wind up behind, throw overhand, lean into it
  bomb(v, s, e, R) { R.armR.rotation.set(-3.0 + 3.5 * e, 0, 0.2); R.armL.rotation.set(-0.8 * (1 - e), 0, -0.3); v.holder.rotation.x = 0.22 * sin(PI * s); },
  // spear up with both hands, a hop, and down into the ground
  frost(v, s, e, R) {
    const up = s < 0.4 ? s / 0.4 : Math.max(0, 1 - (s - 0.4) / 0.25);
    R.armR.rotation.set(-0.5 - 2.6 * up, 0, 0.25); R.armL.rotation.set(-0.5 - 2.6 * up, 0, -0.25);
    v.holder.position.y = 0.26 * Math.max(0, sin(Math.min(1, s / 0.55) * PI));
    if (s > 0.55 && s < 0.8) v.holder.scale.y *= 1 - 0.12 * sin(((s - 0.55) / 0.25) * PI);
  },
  // (29 Oct, request: "the slash animation is nonexistent on ... kairo"): the greatsword up over the head, then a
  // heavy cut down at the target as the lightning lands, the body lunging after it
  storm(v, s, e, R) {
    const up = Math.min(1, s / 0.35), cut = s < 0.35 ? 0 : Math.min(1, (s - 0.35) / 0.2), back = s < 0.75 ? 0 : (s - 0.75) / 0.25;
    const ex = 1 - Math.pow(1 - cut, 3);
    R.armR.rotation.set(-0.4 - 2.75 * up + 3.3 * ex - 0.15 * back, 0, 0.12 - 0.25 * ex); R.armL.rotation.set(-0.3 - 2.4 * up + 2.6 * ex, 0, -0.35);
    v.holder.position.y = 0.12 * sin(Math.min(1, s / 0.45) * PI);
    v.holder.position.z = 0.28 * ex * (1 - back);
    v.holder.rotation.x = 0.25 * ex * (1 - back) - 0.12 * up * (1 - cut);
  },
  // one blaster then the other, each kicking back
  twin(v, s, e, R) {
    const a = v.hand ? R.armR : R.armL, b = v.hand ? R.armL : R.armR;
    a.rotation.set(-1.57 + 0.4 * sin(PI * s), 0, 0); b.rotation.set(-1.5, 0, 0); v.holder.position.z = -0.05 * sin(PI * s);
  },
};

// the first five keep their hand-built versions
const UNIQUE = { cinder: OLD.iaido, hex: OLD.bomb, frost: OLD.frost, kairo: OLD.storm, nova: OLD.twin };
const OLD_POSE_OF = { cinder: OLD_POSE.iaido, hex: OLD_POSE.bomb, frost: OLD_POSE.frost, kairo: OLD_POSE.storm, nova: OLD_POSE.twin };
const OLD_AURA_OF = { cinder: AURA.iaido, hex: AURA.bomb, frost: AURA.frost, kairo: AURA.storm, nova: AURA.twin };
})();
