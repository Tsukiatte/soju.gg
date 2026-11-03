/* Aura Farm Defense: what the gate units' passives and Releases look like (30 Oct; rules in tdgate.js). board.js hands
   every match event here first (event returns true when it was one of these), calls frame each frame and draw2d on
   its 2D layer. A Release: the figure becomes its released form (board.js swapForm), light goes up round it, and its
   own effect plays; while it lasts it keeps a rising aura in its colours. Built from tdfx's shared pieces (H) and the
   effects engine (V). */
(function () {
const AF = window.AF, TD = AF.TD, K = AF.kit, PI = Math.PI, sin = Math.sin, cos = Math.cos;
const rnd = (a, b) => a + Math.random() * (b - a);
let L = null; // what tdfx lends: V, H, ctx, take, give, world, views, sfx, MODELS
const RAIN = [0xff5a5a, 0xffb02e, 0xffe23a, 0x5aff8a, 0x4fc8ff, 0xa07bff];
const cols = p => ((AF.ATTACKS[p.u.k] || {}).c || [0xffffff, 0xd8e6ff, 0xffffff]);
const lend = () => (L = AF.TDFX.lend());
// the road as points every step units, for things that run its whole length
function roadPts(M, step = 1.2) {
  const out = [], n = Math.max(2, Math.ceil(M.map.len / step));
  for (let i = 0; i <= n; i++) { const [x, z] = TD.posAt(M.map, (i / n) * M.map.len); out.push([x, z]); }
  return out;
}
const knives = [], bombs = new Map();
let auraAcc = 0, ringAcc = 0, lastM = null;

// a thin needle for Hisame's thrusts, drawn once into tdfx's models
function models() {
  const { MODELS } = L;
  if (MODELS.needle) return;
  MODELS.needle = (g, c) => { K.box(g, 0.025, 0.025, 1.3, c[1], 0, 0, 0, { glow: 1, ink: false }); K.mesh(g, K.cone(0.03, 0.18, 4), 0xffffff, 0, 0, 0.72, { rx: PI / 2, glow: 1, ink: false }); };
}

// ---------------- events ----------------
const ON = {
  // any Release: the form changes in a burst of its light
  release(ev, p) {
    const { V, H, ctx, sfx } = L, c = ctx(p), [a, b] = cols(p), R = AF.attackRank(p.u.k);
    H.pillar(c, p.x, p.z, 1.5, a);
    V.burst(true, p.x, 0.9, p.z, 70, { cols: [a, b, 0xffffff], speed: [3, 9], up: 2.2, life: [0.4, 0.9], size: [0.15, 0.02], cell: V.CELL.hot, stretch: 1.8, k: 2.6, grav: 2 });
    V.burst(true, p.x, 0.1, p.z, 40, { cols: [a, 0xffffff], dir: [0, 1, 0], cone: 0.1, speed: [5, 11], life: [0.4, 0.7], size: [0.12, 0.03], cell: V.CELL.hot, stretch: 2.4, k: 2.8, spread: 0.6, flatSpread: true });
    for (let i = 0; i < 3; i++) V.later(i * 0.08, () => V.decal(p.x, p.z, 0, 1.4 + i * 0.9, { col: i % 2 ? b : a, k: 2 - i * 0.3, dur: 0.6 }));
    V.decal(p.x, p.z, 6, 2.2, { col: a, k: 1.5, dur: 1.4, speed: 0.8 });
    V.flash(a, 0.22 + 0.03 * Math.max(0, R - 6)); V.shake(0.22); V.ripple(p.x, 0.4, p.z, 0.012, 1.4);
    sfx("burst", { rank: Math.min(9, R) }, 0); sfx("tdBoom", {}, 0);
  },
  releaseEnd(ev, p) {
    const { V } = L, [a] = cols(p);
    V.burst(true, p.x, 1, p.z, 18, { cols: [a, 0xffffff], speed: [0.6, 1.6], up: 1, life: [0.5, 0.9], size: [0.1, 0.02], cell: V.CELL.star, k: 1.8, spin: 4 });
  },
  // ---- (31 Oct) the four Absolutes added past the Rift ----
  // Hallvard weighs them: a line of gold from the heaviest to the lightest, the heavy one struck
  balance(ev, p) {
    const { V, H, ctx } = L, c = ctx(p), [ax, az] = ev.a, [bx, bz] = ev.b;
    H.line([ax, 1.1, az], [bx, 1.1, bz], 0xffe9a8, 0.04, 0.35);
    H.line([ax, 4, az], [ax, 0.2, az], 0xffe9a8, 0.09, 0.2);
    H.flash(ax, 0.6, az, 0.7, 0xffffff, 1.6); H.sparks(c, ax, 0.6, az, 6);
    V.decal(ax, az, 0, 0.9, { col: 0xffe9a8, k: 1.5, dur: 0.4 });
  },
  relScales(ev, p) {
    const { V } = L;
    V.decal(p.x, p.z, 6, ev.r, { col: 0xffe9a8, k: 1.4, dur: 6, speed: 0.3 });
    V.decal(p.x, p.z, 0, ev.r * 0.9, { col: 0x2ee6ff, k: 1.2, dur: 1.2 });
    V.flash(0xffe9a8, 0.3); V.shake(0.25);
  },
  relMeteor(ev, p) {
    const { V, sfx } = L, x = ev.x, z = ev.z;
    V.bolt([x + 6, 22, z - 6], [x, 0.4, z], { col: 0x3dffa0, w: 1.4, dur: 0.5, depth: 1, jag: 0 });
    V.bolt([x + 6, 22, z - 6], [x, 0.4, z], { col: 0xffffff, w: 0.5, dur: 0.5, depth: 1, jag: 0 });
    V.later(0.18, () => {
      V.burst(true, x, 0.5, z, 120, { cols: [0x3dffa0, 0x2ee6ff, 0xa07bff, 0xffffff], speed: [4, 12], up: 3, life: [0.5, 1.1], size: [0.2, 0.03], cell: V.CELL.hot, stretch: 1.6, k: 2.6, grav: 4 });
      for (let i = 0; i < 3; i++) V.later(i * 0.07, () => V.decal(x, z, 0, ev.r * (0.8 + i * 0.5), { col: [0x3dffa0, 0x2ee6ff, 0xa07bff][i], k: 2, dur: 0.8 }));
      V.decal(x, z, 6, ev.r, { col: 0x2a2440, k: 1, dur: 3 });
      V.flash(0xd8fff0, 0.5); V.shake(0.7); V.chroma(0.012); V.ripple(x, 0.4, z, 0.02, 2.4);
      sfx("tdBoom", {}, 0);
    });
  },
  dream(ev, p) {
    const { V } = L, col = [0xff8a3a, 0x9fe8ff, 0xffe9a8][ev.n];
    V.burst(true, p.x, 1.6, p.z, 20, { cols: [col, 0xffffff], speed: [0.6, 1.6], up: 1.2, life: [0.6, 1], size: [0.12, 0.02], cell: V.CELL.star, k: 2, spin: 3 });
  },
  lily(ev, p) {
    const { H } = L;
    H.line([p.x - 0.3, 0.7, p.z], [ev.x, 0.6, ev.z], 0xff8aa8, 0.025, 0.1);
    H.flash(ev.x, 0.6, ev.z, 0.3, 0xffd0e0, 1.2);
  },
  relPack(ev, p) {
    const { V } = L;
    V.decal(p.x, p.z, 0, 2.4, { col: 0x8ad8ff, k: 1.8, dur: 0.6 });
    V.burst(true, p.x, 0.6, p.z, 40, { cols: [0x8ad8ff, 0xffffff], speed: [2, 6], up: 0.6, flat: true, life: [0.3, 0.6], size: [0.12, 0.02], cell: V.CELL.hot, stretch: 2, k: 2.2 });
    V.flash(0x8ad8ff, 0.25);
  },
  relWolf(ev, p) {
    const { V, H } = L, x = ev.x, z = ev.z;
    V.bolt([p.x, 0.5, p.z], [x, 0.5, z], { col: 0x8ad8ff, w: 0.32, dur: 0.35, depth: 1, jag: 0.1 });
    V.later(0.12, () => {
      V.burst(true, x, 0.5, z, 24, { cols: [0x8ad8ff, 0xffffff], speed: [2, 5], up: 1.2, life: [0.3, 0.6], size: [0.13, 0.02], cell: V.CELL.hot, stretch: 1.5, k: 2.4 });
      V.decal(x, z, 0, 1.3, { col: 0x8ad8ff, k: 1.8, dur: 0.4 }); H.flash(x, 0.5, z, 0.8, 0xffffff, 1.6);
    });
  },
  game(ev, p) {
    const { V } = L, col = [0x5a3a8a, 0xff3a4a, 0xffd23a][ev.n];
    V.decal(p.x, p.z, 0, 2.6, { col, k: 1.6, dur: 0.7 });
    V.burst(true, p.x, 1.5, p.z, 16, { cols: [col, 0xffffff], speed: [0.6, 1.4], up: 1, life: [0.5, 0.9], size: [0.1, 0.02], cell: V.CELL.star, k: 2, spin: 3 });
  },
  redLight(ev, p) { const { V } = L; V.decal(p.x, p.z, 0, ev.r, { col: 0xff3a4a, k: 1.8, dur: 0.5 }); },
  tag(ev, p) { const { V, H } = L, e = ev.e; H.flash(e.x, 1.2, e.z, 0.7, 0xffd23a, 2); V.decal(e.x, e.z, 0, 0.7, { col: 0xffd23a, k: 2, dur: 0.5 }); },
  tagPass(ev) { const { H } = L, e = ev.e; H.line([ev.x, 0.8, ev.z], [e.x, 0.8, e.z], 0xffd23a, 0.04, 0.35); H.flash(e.x, 1.2, e.z, 0.6, 0xffd23a, 2); },
  relStage(ev, p) {
    const { V } = L;
    V.flash(0x2a0810, 0.45); V.shake(0.2);
    V.decal(p.x, p.z, 6, 3.2, { col: 0xb0182e, k: 1.3, dur: 6, speed: 0.2 });
  },
  relAct(ev, p) {
    const { V, H } = L, col = [0xff5a8a, 0xb0182e, 0x8a5aff][ev.n - 1];
    V.flash(col, 0.25); V.shake(0.2);
    for (const [x, z] of ev.hits) { H.line([x - 0.6, 1.2, z - 0.6], [x + 0.6, 0.2, z + 0.6], col, 0.05, 0.25); V.burst(true, x, 0.7, z, 6, { cols: [col, 0xffffff], speed: [1, 3], up: 1, life: [0.4, 0.8], size: [0.1, 0.02], cell: V.CELL.petal || V.CELL.hot, k: 1.8, grav: 1 }); }
  },
  relFinale(ev, p) {
    const { V, H, sfx } = L;
    V.flash(0xffffff, 0.55); V.shake(0.6); V.chroma(0.01);
    for (const [x, z] of ev.hits) { H.line([x - 1.4, 0.8, z], [x + 1.4, 0.8, z], 0xffffff, 0.06, 0.4); H.line([x - 1.4, 0.8, z], [x + 1.4, 0.8, z], 0xff5a8a, 0.14, 0.3); V.burst(true, x, 0.8, z, 14, { cols: [0xff5a8a, 0xffffff], speed: [2, 6], up: 1, flat: true, life: [0.3, 0.6], size: [0.12, 0.02], cell: V.CELL.hot, stretch: 2, k: 2.4 }); }
    sfx("tdBoom", {}, 0);
  },
  // ---- the Order ----
  relArrow(ev, p) {
    const { V, H, ctx } = L, c = ctx(p), [a] = cols(p), x = ev.x, z = ev.z;
    H.line([x + 1.4, 8, z - 1.4], [x, 0.1, z], a, 0.06, 0.14);
    H.flash(x, 0.3, z, 0.6, 0xffffff, 1.4); H.sparks(c, x, 0.3, z, 5);
    V.decal(x, z, 0, 0.6, { col: a, k: 1.4, dur: 0.3 });
  },
  split(ev, p) {
    const { H, ctx } = L, c = ctx(p), [a] = cols(p);
    for (const [x, z] of ev.to) { H.line([ev.x, 0.6, ev.z], [x, 0.55, z], a, 0.035, 0.12); H.flash(x, 0.5, z, 0.35, 0xffffff, 1.2); H.sparks(c, x, 0.5, z, 3); }
  },
  bash(ev, p) {
    const { V } = L, [, b] = cols(p);
    V.decal(ev.x, ev.z, 0, 1.1, { col: b, k: 1.6, dur: 0.35 });
    V.burst(true, ev.x, 0.5, ev.z, 10, { cols: [b, 0xffffff], speed: [2, 4], up: 0.6, flat: true, life: [0.2, 0.35], size: [0.1, 0.02], cell: V.CELL.hot, stretch: 1.4, k: 2 });
  },
  relLance(ev, p, M) {
    const { V } = L, [a, b] = cols(p), pts = roadPts(M);
    // the lance runs the road from the start to the end
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
      V.later(i * 0.012, () => {
        V.bolt([x0, 0.7, z0], [x1, 0.7, z1], { col: a, w: 0.55, dur: 0.5, depth: 1, jag: 0 });
        V.bolt([x0, 0.7, z0], [x1, 0.7, z1], { col: 0xffffff, w: 0.18, dur: 0.5, depth: 1, jag: 0 });
        if (i % 3 === 0) V.burst(true, x1, 0.7, z1, 6, { cols: [a, b, 0xffffff], speed: [1, 3], up: 1, life: [0.3, 0.5], size: [0.12, 0.02], cell: V.CELL.hot, stretch: 1.4, k: 2 });
      });
    }
    V.flash(a, 0.35); V.shake(0.4); V.chroma(0.008);
  },
  relWall(ev, p) {
    const { V } = L, [a] = cols(p), f = p.face;
    for (let i = -6; i <= 6; i++) {
      const ang = f + i * 0.13, x = p.x + sin(ang) * 2, z = p.z + cos(ang) * 2;
      V.later(Math.abs(i) * 0.02, () => { V.bolt([x, 0.05, z], [x, 2.6, z], { col: a, w: 0.3, dur: 3, depth: 1, jag: 0 }); V.decal(x, z, 2, 0.8, { col: 0xd8f6ff, k: 1.2, dur: 3 }); });
    }
    V.decal(p.x, p.z, 2, ev.r, { col: 0xd8f6ff, k: 1.2, dur: 3 });
    V.burst(true, p.x, 0.4, p.z, 50, { cols: [a, 0xffffff], speed: [3, 7], up: 0.5, flat: true, life: [0.4, 0.7], size: [0.14, 0.03], cell: V.CELL.shard, k: 2, spin: 6 });
    V.shake(0.45); V.ripple(p.x, 0.4, p.z, 0.014, 1.2);
  },
  relEyes(ev, p) {
    const { V } = L, cs = [0x3dffa0, 0x2ee6ff, 0xa07bff, 0xff7ad9];
    V.flash(0xffffff, 0.5); V.chroma(0.012); V.shake(0.35);
    for (let i = 0; i < 4; i++) V.later(i * 0.07, () => V.decal(p.x, p.z, 0, ev.r * (0.4 + i * 0.2), { col: cs[i], k: 2.4, dur: 0.6 }));
    for (let i = 0; i < 28; i++) { const ang = (i / 28) * PI * 2, x = p.x + sin(ang) * ev.r, z = p.z + cos(ang) * ev.r; V.bolt([p.x, 1.6, p.z], [x, 0.4, z], { col: cs[i % 4], w: 0.08, dur: 0.22, depth: 1, jag: 0 }); }
    V.ripple(p.x, 0.4, p.z, 0.02, 1.2);
  },
  relTake(ev, p, M) {
    const { V } = L, [a] = cols(p);
    for (const o of M.units) if (o !== p && o.hold > 0) V.bolt([o.x, 1, o.z], [p.x, 1.8, p.z], { col: a, w: 0.07, dur: 4, depth: 3, jag: 0.06 });
    V.decal(p.x, p.z, 8, 3, { col: 0x0a1020, dur: 4, speed: 1.5 });
  },
  relGive(ev, p, M) {
    const { V, H } = L, [a] = cols(p);
    V.flash(0xffffff, 0.65); V.shake(0.6); V.chroma(0.014); V.ripple(p.x, 0.4, p.z, 0.022, 1.1);
    M.enemies.forEach((e, i) => { if (e.hp <= 0 && !e.leaked) return; V.later(i * 0.015, () => { H.skyBeam(e.x, e.z, a, 0.35, 0.5); V.decal(e.x, e.z, 3, 1.2, { col: a, k: 1.6, dur: 0.6 }); }); });
  },
  // ---- the Unwound ----
  relClones(ev, p) {
    const { V, H } = L, [a] = cols(p);
    ev.pts.forEach(([x, z], i) => V.later(i * 0.02, () => {
      H.line([p.x, 0.8, p.z], [x, 0.5, z], a, 0.03, 0.08);
      V.slash(x, 0.6, z, { ang: rnd(0, PI * 2), tilt: rnd(-0.4, 0.4), pitch: 1, r: 0.9, col: a, core: 0xffffff, dur: 0.18 });
    }));
    L.sfx("tdSlash", {}, 0.05);
  },
  relHowl(ev, p) {
    const { V } = L, [a, b] = cols(p);
    for (let i = 0; i < 3; i++) V.later(i * 0.12, () => V.decal(p.x, p.z, 0, ev.r * (0.5 + i * 0.3), { col: i ? b : a, k: 2.2, dur: 0.55 }));
    V.burst(true, p.x, 1.2, p.z, 40, { cols: [a, 0xffffff], speed: [3, 7], up: 0.3, flat: true, life: [0.3, 0.6], size: [0.12, 0.02], cell: V.CELL.streak, stretch: 2.2, k: 2 });
    V.ripple(p.x, 0.4, p.z, 0.02, 1.6); V.shake(0.4);
  },
  relLeap(ev, p) {
    const { V, H } = L, [a] = cols(p);
    let px = p.x, pz = p.z;
    ev.pts.forEach(([x, z], i) => { const x0 = px, z0 = pz; V.later(i * 0.07, () => { H.line([x0, 0.7, z0], [x, 0.6, z], a, 0.08, 0.16); V.slash(x, 0.6, z, { ang: rnd(0, PI * 2), tilt: 0.3, pitch: 1, r: 1.1, col: a, core: 0xffffff, dur: 0.2 }); }); px = x; pz = z; });
    V.shake(0.3);
  },
  leap(ev, p) { L.H.line([p.x, 0.7, p.z], [ev.x, 0.6, ev.z], cols(p)[0], 0.05, 0.12); },
  aim(ev, p) {
    // Molla's bombs are put down on the road to tick, not lobbed like a mortar
    if (p.u.k !== "molla") return false;
    L.V.decal(ev.x, ev.z, 0, ev.r * 0.9, { col: cols(p)[0], k: 1.1, dur: ev.delay + 0.1, a: 0.6, speed: 0.6 });
    return true;
  },
  relEscape(ev, p) {
    const { V } = L, [a, b] = cols(p);
    V.burst(true, p.x, 1.2, p.z, 36, { cols: [b, a, 0xffffff], speed: [2, 6], up: 2, life: [0.4, 0.8], size: [0.14, 0.05], cell: V.CELL.rune, k: 2, spin: 8 });
    V.flash(a, 0.2);
  },
  relSpear(ev, p, M) {
    const { V } = L, [a] = cols(p), pts = roadPts(M, 1.6);
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
      V.later(i * 0.008, () => { V.bolt([x0, 0.9, z0], [x1, 0.9, z1], { col: a, w: 0.3, dur: 0.35, depth: 2, jag: 0.03 }); V.bolt([x0, 0.9, z0], [x1, 0.9, z1], { col: 0xffffff, w: 0.08, dur: 0.35, depth: 1, jag: 0 }); });
    }
    V.flash(a, 0.3); V.shake(0.35);
  },
  exec(ev, p) {
    const { V, H } = L, [a] = cols(p);
    H.flash(ev.x, 0.6, ev.z, 0.8, 0xffffff, 1.6);
    V.burst(false, ev.x, 0.6, ev.z, 14, { cols: [0x101014, 0x2a2a30], speed: [1, 3], up: 1.5, life: [0.5, 0.9], size: [0.12, 0.04], cell: V.CELL.shard, grav: 3, spin: 6 });
    V.burst(true, ev.x, 0.6, ev.z, 10, { cols: [a, 0xffffff], speed: [1, 2.5], up: 1, life: [0.3, 0.5], size: [0.08, 0.02], cell: V.CELL.hot, k: 2 });
  },
  tstop1(ev, p) {
    const { V } = L;
    V.decal(ev.x, ev.z, 6, 0.9, { col: 0xffffff, k: 1.4, dur: 1, speed: 0 });
    V.burst(true, ev.x, 0.8, ev.z, 8, { cols: [0xffffff, 0xff3b4e], speed: [0.3, 0.8], life: [0.6, 1], size: [0.1, 0.04], cell: V.CELL.ring, k: 1.6 });
  },
  relStop(ev, p, M) {
    const { V, sfx } = L, [cx, cz] = TD.posAt(M.map, M.map.len * 0.5);
    V.flash(0xffffff, 0.45); V.ripple(p.x, 0.4, p.z, 0.02, 0.9);
    V.decal(cx, cz, 6, 9, { col: 0xffffff, k: 1.2, dur: 5, speed: 0.15 });
    sfx("tick", {}, 0);
  },
  knife(ev, p) {
    const { take, ctx } = L, g = take("kunai", ctx(p));
    const ang = rnd(0, PI * 2), d = 0.75;
    knives.push({ g, x: ev.x + sin(ang) * d, z: ev.z + cos(ang) * d, tx: ev.x, tz: ev.z, y: rnd(0.6, 1.1), t: 0, fly: -1, p });
  },
  relResume(ev, p) {
    const { V } = L;
    for (const k of knives) if (k.fly < 0) k.fly = rnd(0, 0.12);
    V.flash(0xff3b4e, 0.3); V.shake(0.5); V.chroma(0.012); V.ripple(p.x, 0.4, p.z, 0.02, 1.4);
  },
  // ---- the First Court ----
  relNeedles(ev, p) { const { V } = L, [a] = cols(p); V.flash(a, 0.18); V.burst(true, p.x, 0.9, p.z, 20, { cols: [a, 0xffffff], speed: [2, 5], up: 0.5, life: [0.2, 0.4], size: [0.08, 0.02], cell: V.CELL.streak, stretch: 2, k: 2 }); },
  relPatch(ev, p) {
    const { V } = L, [a] = cols(p);
    V.burst(true, p.x, 0.2, p.z, 90, { cols: [a, 0xffffff, 0xfff2a0], dir: [0, 1, 0], cone: 0.3, speed: [5, 12], life: [0.5, 1], size: [0.16, 0.03], cell: V.CELL.hot, stretch: 2.6, k: 2.6, spread: 0.8, flatSpread: true });
    V.decal(p.x, p.z, 4, 2.4, { col: 0x231c18, dur: 3 }); V.flash(a, 0.35); V.shake(0.5);
  },
  rcleave(ev, p) {
    const { V } = L, [a] = cols(p);
    for (let i = 0; i < 2; i++) V.slash(p.x, 0.55, p.z, { ang: p.face + i * PI, tilt: 0, pitch: 0.2, r: ev.r, col: a, core: 0xffffff, dur: 0.24, delay: i * 0.05 });
  },
  relStorm(ev, p) {
    const { V } = L, [a] = cols(p);
    V.decal(ev.x, ev.z, 0, ev.r, { col: a, k: 2, dur: 0.6 }); V.decal(ev.x, ev.z, 3, ev.r, { col: a, k: 1.2, dur: 6 });
    V.flash(a, 0.2);
  },
  relStitch(ev, p) { L.V.flash(0xff2a3a, 0.25); L.V.burst(true, p.x, 1, p.z, 24, { cols: [0xff2a3a, 0xffffff], speed: [1, 3], life: [0.4, 0.8], size: [0.08, 0.02], cell: V0().CELL.star, k: 2, spin: 6 }); },
  relCut(ev, p, M) {
    const { V } = L;
    alive(M).forEach((e, i) => V.later(i * 0.02, () => V.slash(e.x, 0.6, e.z, { ang: rnd(0, PI * 2), tilt: rnd(-0.3, 0.3), pitch: 1, r: 1, col: 0xff2a3a, core: 0xffffff, dur: 0.2 })));
    V.flash(0xffffff, 0.35); V.shake(0.45);
  },
  haze(ev, p) { const { V } = L, e = ev.e; V.burst(true, e.x, 1.2, e.z, 10, { cols: [0x9a6aff, 0xffffff], speed: [0.5, 1.5], life: [0.4, 0.7], size: [0.1, 0.02], cell: V.CELL.ring, k: 1.6 }); },
  relNeg(ev, p) { L.sfx("charge", {}, 0); },
  relTruth(ev, p, M) {
    const { V, H } = L, [a] = cols(p);
    V.flash(0xffffff, 0.7); V.shake(0.7); V.chroma(0.016); V.ripple(p.x, 0.4, p.z, 0.024, 1);
    alive(M).forEach((e, i) => V.later(i * 0.012, () => { V.slash(e.x, 0.7, e.z, { ang: rnd(0, PI * 2), tilt: 0, pitch: 1, r: 1.3, col: a, core: 0xffffff, dur: 0.24 }); H.flash(e.x, 0.6, e.z, 0.8, 0xffffff, 1.6); }));
    L.sfx("portalBurst", {}, 0);
  },
};
const V0 = () => L.V;
const alive = M => M.enemies.filter(e => e.hp > 0);
AF.TDREL = {
  event(ev) {
    const f = ON[ev.t], p = ev.p;
    if (!f || !p || !p.u || !AF.TDFX) return false;
    if (ev.t === "aim" && p.u.k !== "molla") return false;
    lend(); models();
    const M = AF.Board.match();
    const r = f(ev, p, M);
    return r !== false;
  },
  frame(dt, M) {
    if (!AF.TDFX) return;
    lend(); models();
    const { V, H, ctx, take, give } = L;
    if (M !== lastM) { lastM = M; knives.length = 0; for (const g of bombs.values()) give(g); bombs.clear(); }
    // the picture: grey while time stands still, half grey while the king takes the light back, negative while
    // Kagero shows what's real
    const king = M.units.some(p => p.u.k === "ragnvald" && p.relT > 0);
    V.grade(M.tstop > 0 ? 1 : king ? 0.55 : 0, M.neg > 0 ? 1 : 0, dt);
    auraAcc += dt; ringAcc += dt;
    const pulse = ringAcc > 1.4; if (pulse) ringAcc = 0;
    for (const p of M.units) {
      if (!p.s.gate) continue;
      const [a, b] = cols(p);
      // a released unit's aura: light rising round its feet
      if (p.relShow > 0) {
        const n = Math.round(dt * 60);
        for (let i = 0; i < n; i++) {
          const ang = rnd(0, PI * 2), r = rnd(0.3, 0.75);
          V.put(true, p.x + cos(ang) * r, rnd(0.05, 0.4), p.z + sin(ang) * r, 0, rnd(2.2, 4.2), 0, rnd(0.3, 0.55), 0.5, -1, 0.11, 0.02, V.CELL.hot, 2.4, V.lin(i % 2 ? b : a, 2.2), 0.9, 0, 0);
        }
      }
      // Vidar's reach, breathing on the ground; what's slowed near him frosts over
      if (p.u.k === "vidar" && pulse) V.decal(p.x, p.z, 0, TD.live(p).rng, { col: a, k: 0.9, dur: 1.3, a: 0.6 });
      // Bloodlust, rising off Kurogane the more he has
      if (p.u.k === "kurogane" && (p.blood || 0) > 5 && Math.random() < dt * p.blood * 0.6)
        V.put(true, p.x + rnd(-0.3, 0.3), rnd(0.2, 1.2), p.z + rnd(-0.3, 0.3), 0, rnd(1.2, 2.4), 0, rnd(0.4, 0.7), 0.5, -0.5, 0.09, 0.02, V.CELL.hot, 1.8, V.lin(a, 2), 0.9, 0, 0);
      // the light drawn out of every unit while Ragnvald takes it back
      if (p.u.k === "ragnvald" && p.relT > 0) for (const o of M.units) if (o !== p && o.hold > 0 && Math.random() < dt * 14) {
        const dx = p.x - o.x, dz = p.z - o.z, life = 0.6;
        V.put(true, o.x, 1, o.z, dx / life, 1.2, dz / life, life, 0, 0, 0.12, 0.04, V.CELL.hot, 1.2, V.lin(a, 2.4), 1, 0, 0);
      }
    }
    for (const e of M.enemies) {
      if (e.hp <= 0) continue;
      // Kagero's haze: a turned enemy has a slow violet spiral over its head
      if (e.confT > 0 && Math.random() < dt * 10) { const ang = rnd(0, PI * 2); V.put(true, e.x + cos(ang) * 0.3, 1.4 * e.def.size, e.z + sin(ang) * 0.3, -sin(ang) * 0.8, 0.3, cos(ang) * 0.8, 0.5, 0, 0, 0.1, 0.02, V.CELL.star, 0, V.lin(0x9a6aff, 2), 1, 0, 3); }
      // a slowed enemy right by Vidar frosts
      if (e.aSlow > 0.4 && Math.random() < dt * 6) V.put(true, e.x + rnd(-0.2, 0.2), rnd(0.3, 1), e.z + rnd(-0.2, 0.2), 0, 0.3, 0, 0.6, 1, 0, 0.08, 0.02, V.CELL.star, 0, V.lin(0xbff6ff, 2), 1, 0, 2);
    }
    // Tsumugi's thread, from one stitched enemy to the next along the road
    const sewn = M.enemies.filter(e => e.hp > 0 && e.threadT > 0).sort((x, y) => x.d - y.d);
    for (let i = 1; i < sewn.length; i++) { const e0 = sewn[i - 1], e1 = sewn[i]; V.bolt([e0.x, 0.7, e0.z], [e1.x, 0.7, e1.z], { col: 0xff2a3a, w: M.stitchT > 0 ? 0.06 : 0.035, dur: 0.05, depth: 2, jag: 0.03 }); }
    // Molla's bombs, ticking on the road, blinking faster as they go
    const live = new Set();
    for (const s of M.proj) {
      if (!s.bomb) continue;
      live.add(s);
      let g = bombs.get(s);
      if (!g) { g = take("bomb", ctx(s.p)); bombs.set(s, g); }
      const left = s.land - M.t, k = Math.max(0, Math.min(1, 1 - left / (s.delay || 2)));
      g.position.set(s.x, 0.17 + Math.abs(sin(M.t * (6 + 18 * k))) * 0.04, s.z); g.rotation.set(0, M.t * 0.6, 0);
      g.scale.setScalar(1 + 0.25 * k);
      if (sin(M.t * (5 + 25 * k)) > 0.85) V.put(true, s.x, 0.4, s.z, 0, 0, 0, 0.05, 0, 0, 0.3, 0.3, V.CELL.dot, 0, V.lin(0xff3a2a, 2.4), 1, 0, 0);
    }
    for (const [s, g] of bombs) if (!live.has(s)) { give(g); bombs.delete(s); }
    // Mezzanotte's knives: hanging still in the stopped world, then all at once
    for (let i = knives.length - 1; i >= 0; i--) {
      const k = knives[i]; k.t += dt;
      if (k.fly < 0) { k.g.position.set(k.x, k.y + sin(k.t * 2) * 0.03, k.z); k.g.rotation.set(0, Math.atan2(k.tx - k.x, k.tz - k.z), 0); continue; }
      k.fly += dt;
      const u = Math.min(1, Math.max(0, k.fly) / 0.12);
      k.g.position.set(k.x + (k.tx - k.x) * u, k.y + (0.6 - k.y) * u, k.z + (k.tz - k.z) * u);
      if (u >= 1) { H.flash(k.tx, 0.6, k.tz, 0.5, 0xffffff, 1.4); H.sparks(ctx(k.p), k.tx, 0.6, k.tz, 4); give(k.g); knives.splice(i, 1); }
    }
    // Shirasagi's storm: gold shards wheeling round the stretch of road
    for (const f of M.fields) if (f.storm) {
      const c = ctx(f.p);
      H.vortex(c, f.x, f.z, f.r, Math.ceil(dt * 90), { spin: 4.5, life: 0.6, h: 1.4, cell: "shard", cols: [0xffd76a, 0xfff6ea, 0xffffff], size: 0.12 });
    }
  },
  // on the 2D layer: what's held in the stopped world, over each enemy
  draw2d(c, scr, M) {
    if (!(M.tstop > 0)) return;
    c.save(); c.globalCompositeOperation = "source-over"; c.textAlign = "center";
    c.font = '15px "Fredoka One", Geist, system-ui, sans-serif';
    for (const e of M.enemies) {
      if (!(e.held > 0) || e.hp <= 0) continue;
      const [x, y] = scr(e.x, e.def.hb * e.def.size + 0.7, e.z), s = AF.fmt(e.held * 1.5);
      c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,.75)"; c.strokeText(s, x, y);
      c.fillStyle = "#ffffff"; c.fillText(s, x, y);
    }
    c.restore();
  },
};
})();
