/* Aura Farm Defense: two hand-built attacks (1 Nov), drawn through tdfx.js's hooks (X.HOOK).
   - Vesh (Chris: "vesh's attack ingame is so underwhelming, no animation and its just a boring ass lightning bolt like
     everything else. hes dark and underworldly so make it hellish cmon"): HELLCHAINS. He wrenches his chains (or, evolved,
     drives his greatsword into the ground); a burning sigil opens under him and real chains lash out from him to the
     target and on down the line. Under each one the ground splits, hellfire comes up through the crack, and chains erupt
     out of it, wind round the enemy and drag it down. Evolved: gold-hot chains, the ground torn open toward the first,
     bigger fire, a slam as the last one goes under.
   - Søvn evolved (units_sovn.js): LULLABY RUSH. He strikes the pose and points; his Stand leaves him, crosses to where
     the enemy will be and buries it in a barrage of fists, then one last straight punch lands with the hit (a strike
     with a knockback, AF.ATTACKS["sovn@evo"]). The chains are 3D links (one instanced mesh); the Stand's trip is its
     model's own (R.stand.out). */
(function () {
const T = THREE, AF = window.AF, X = AF.TDFX, PI = Math.PI, sin = Math.sin, cos = Math.cos;
if (!X || !X.HOOK) return;
const rnd = (a, b) => a + Math.random() * (b - a);
const VI = 0xa07bff, G = 0x3dffa0, CY = 0x2ee6ff, PALE = 0xffe9a8;

// Søvn's evolved attack: the Stand's barrage, landing as one strike where the enemy will be
AF.ATTACKS["sovn@evo"] = { name: "Lullaby Rush", kind: "strike", el: "aurora", shape: "fist", c: [VI, G, 0xffffff], p: { atk: 3.0, spa: 2.4, aoe: 1.5, delay: 0.75, rng: 5.6, knock: 0.5 } };

// ---------------- chain links: one instanced mesh, refilled every frame ----------------
const LINK_N = 1200;
let links = null, linkWorld = null, linkGeo = null, linkMat = null, nLinks = 0;
const dummy = new T.Object3D(), col = new T.Color(), nxt = new T.Vector3();
function linkMesh(world) {
  if (links && linkWorld === world) return links;
  if (!linkGeo) { linkGeo = new T.TorusGeometry(0.15, 0.048, 6, 14); linkMat = new T.MeshBasicMaterial({ color: 0xffffff }); }
  links = new T.InstancedMesh(linkGeo, linkMat, LINK_N); links.frustumCulled = false; links.count = 0;
  links.instanceMatrix.setUsage(T.DynamicDrawUsage);
  links.setColorAt(0, col.setRGB(1, 1, 1));
  world.add(links); linkWorld = world;
  return links;
}
// one link at (x, y, z) pointing at (nx, ny, nz), rolled a quarter turn every other link; cl: [hex, brightness]
function link(x, y, z, nx, ny, nz, roll, s, cl) {
  if (!links || nLinks >= LINK_N || s <= 0.01) return;
  dummy.position.set(x, y, z); nxt.set(nx, ny, nz);
  if (nxt.distanceToSquared(dummy.position) < 1e-6) nxt.y += 0.01;
  dummy.lookAt(nxt); dummy.rotateZ(roll); dummy.rotateX(PI / 2);
  dummy.scale.set(s, s * 1.6, s);
  dummy.updateMatrix();
  links.setMatrixAt(nLinks, dummy.matrix);
  links.setColorAt(nLinks, col.setHex(cl[0]).multiplyScalar(cl[1]));
  nLinks++;
}
const fx = [];
// chains coming up out of the ground round a point (following the enemy while it lives), winding tighter, then
// dragged back down under
function wrap(o) {
  let t = 0;
  const N = 11, strands = o.evo ? 4 : 3;
  fx.push({ tick(dt) {
    t += dt; if (t > o.dur) return false;
    if (o.e && o.e.hp > 0) { o.x = o.e.x; o.z = o.e.z; }
    const rise = Math.min(1, t / 0.16), yank = t > o.dur - 0.24 ? (t - (o.dur - 0.24)) / 0.24 : 0, sq = 1 - 0.35 * Math.min(1, t / 0.3);
    const n = Math.max(2, Math.round(N * rise)), at = (s, u) => { const a = s * (2 * PI / strands) + u * 7.2 + t * 4.5, r = (0.36 + 0.16 * (1 - u)) * sq * o.s; return [o.x + cos(a) * r, u * 1.3 * o.s - yank * 1.9, o.z + sin(a) * r]; };
    for (let s = 0; s < strands; s++) for (let i = 0; i < n; i++) {
      const [x, y, z] = at(s, i / (N - 1)), [x2, y2, z2] = at(s, (i + 1) / (N - 1));
      if (y < -0.03) continue;
      link(x, y, z, x2, y2, z2, i % 2 ? PI / 2 : 0, o.s, i % 2 ? o.c1 : o.c0);
    }
    return true;
  } });
}
// a chain lashing from a to b: it flies out link by link, sags, whips, and goes slack
function whip(a, b, o) {
  let t = -(o.delay || 0);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), N = Math.max(4, Math.round(len / (0.18 * o.s)));
  fx.push({ tick(dt) {
    t += dt; if (t < 0) return true; if (t > o.dur) return false;
    const front = Math.min(1, t / 0.1), fade = t > o.dur - 0.14 ? 1 - (t - (o.dur - 0.14)) / 0.14 : 1, n = Math.round(N * front);
    const at = u => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sin(u * PI) * (0.08 + 0.3 * Math.max(0, t - 0.1)) + sin(u * 14 - t * 40) * 0.07 * (1 - u) * (1 - front * 0.5), a[2] + (b[2] - a[2]) * u];
    for (let i = 0; i < n; i++) { const p0 = at(i / N), p1 = at((i + 1) / N); link(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], i % 2 ? PI / 2 : 0, o.s * fade, i % 2 ? o.c1 : o.c0); }
    return true;
  } });
}

// ---------------- Vesh: HELLCHAINS ----------------
function hellBurst(L, c, x, z, e, s, evo, last) {
  const V = L.V, H = L.H, C = V.CELL, hot = evo ? 0xffd76a : 0xff2a1a, fire = evo ? [0xffd76a, 0xff8a2a, 0xfff2c8] : [0xff3a1a, 0xff7a2a, 0xffb02e];
  V.decal(x, z, 4, 0.85 * s, { col: 0x1a0606, dur: 1.8 });
  V.decal(x, z, 3, 0.95 * s, { col: evo ? 0xff6a1a : 0xff2a0a, k: 1.2, dur: 0.7 });
  V.decal(x, z, 1, 0.8 * s, { col: 0x140406, dur: 2.5 });
  V.burst(true, x, 0.05, z, Math.round(24 * s), { cols: fire, dir: [0, 1, 0], cone: 0.14, speed: [3, 6.5 * s], life: [0.28, 0.55], size: [0.42 * s, 0.08], cell: C.flame, k: 1.5, spread: 0.3, flatSpread: true, drag: 1.2 });
  // thick black smoke rolling up through the fire
  V.burst(false, x, 0.3, z, Math.round(10 * s), { cols: [0x0e0608, 0x1a0c0e, 0x24100e], dir: [0, 1, 0], cone: 0.25, speed: [1.2, 2.6], life: [0.7, 1.2], size: [0.45, 1.1], cell: C.smoke, a: 0.75, drag: 1.4, spin: 1.2 });
  V.burst(false, x, 0.8, z, 8, { cols: [0x140608, 0x221014], dir: [0, 1, 0], cone: 0.4, speed: [0.8, 1.8], life: [0.8, 1.3], size: [0.5, 1.2], cell: C.smoke, a: 0.6, drag: 1.5, spin: 1, delay: 0.15 });
  V.burst(true, x, 0.3, z, 16, { cols: [hot, 0xffb02e], speed: [1.5, 4], up: 2.5, life: [0.5, 1.0], size: [0.06, 0.01], cell: C.dot, k: 2.4, grav: 2, drag: 1.2 });
  H.flash(x, 0.25, z, 0.9 * s, 0xff2a0a, 1.1, 0.14);
  wrap({ x, z, e, dur: 0.62, s, evo, c0: evo ? [0x1a1418, 1] : [0x3a2a2a, 1], c1: evo ? [0xffb02e, 1.25] : [0xff3a1a, 1.2] });
  if (last) V.later(0.4, () => {
    // the last one goes under: the crack slams shut over it
    V.decal(x, z, 0, 1.5 * s, { col: hot, k: 2, dur: 0.4 });
    V.burst(true, x, 0.1, z, Math.round(22 * s), { cols: fire, flat: true, speed: [3, 7], life: [0.25, 0.45], size: [0.12, 0], cell: C.hot, stretch: 1.4, k: 2.6, drag: 2 });
    V.burst(false, x, 0.3, z, 10, { cols: [0x1a0a0c, 0x2a1416], flat: true, speed: [1.5, 3.5], life: [0.6, 1], size: [0.4, 0.9], cell: C.smoke, a: 0.55, drag: 2.5, spin: 1 });
    V.shake(evo ? 0.18 : 0.1); V.ripple(x, 0.2, z, evo ? 0.005 : 0.003, 1.5);
  });
}
function hellChains(L, c, ev, p) {
  const V = L.V, H = L.H, C = V.CELL, evo = !!c.ev, s = evo ? 1.3 : 1, pts = ev.pts, hot = evo ? 0xffd76a : 0xff2a1a;
  linkMesh(L.world);
  // a burning sigil opens under him and the ground splits
  V.decal(p.x, p.z, 6, 1.1 * s, { col: evo ? 0xff8a1a : 0xff2a0a, k: 1.3, dur: 0.9, speed: 1.4 });
  V.decal(p.x, p.z, 4, 1.0 * s, { col: 0x1a0606, dur: 1.4 });
  V.burst(true, p.x, 0.1, p.z, 18, { cols: [hot, 0xff7a2a, 0xfff2b0], dir: [0, 1, 0], cone: 0.35, speed: [1.5, 3.5], life: [0.3, 0.6], size: [0.08, 0], cell: C.hot, stretch: 1, k: 2.4, spread: 0.5, flatSpread: true });
  // evolved: the ground tears open from him to the first
  if (evo) H.fissure(Object.assign({}, c, { c: [0xffd76a, 0xff5a1a, 0xfff2c8] }), p.x, p.z, pts[1][0], pts[1][1], 6, { step: 0.03, h: 1.4 });
  const hand = H.VW(p, 0.4, 0.3, 1.0), c0 = evo ? [0x1a1418, 1] : [0x3a2a2a, 1], c1 = evo ? [0xffb02e, 1.25] : [0xff3a1a, 1.2];
  for (let j = 1; j < pts.length; j++) {
    const [bx, bz] = pts[j], [ax, az] = pts[j - 1], d = 0.04 + (j - 1) * 0.12, e = ev.hit && ev.hit[j - 1];
    whip(j === 1 ? hand : [ax, 0.5, az], [bx, 0.5, bz], { delay: d, dur: 0.42, s, c0, c1 });
    V.later(d + 0.08, () => hellBurst(L, c, bx, bz, e, s, evo, j === pts.length - 1));
  }
  V.shake(evo ? 0.14 : 0.06); if (evo) { V.flash(0x3a0800, 0.1); V.chroma(0.003); }
  // his own hellfire instead of the gold and rainbow every Absolute's hits get (tdfx rarityFlair)
  p._rarT = V.time() + 0.6;
  L.sfx("tdBoom", {}, 0.06);
}
X.HOOK.event.vesh = (ev, p) => {
  const L = X.lend();
  if (ev.t === "fire") { const v = L.views.get(p.id); if (v) v.atk = 1; return true; }
  if (ev.t !== "chain") return false;
  hellChains(L, L.ctx(p), ev, p);
  return true;
};
// the wrench: chained, both arms dragged down; evolved, the greatsword up over his head and down into the ground
X.HOOK.pose.vesh = (v, s, e, R) => {
  const up = s < 0.35 ? s / 0.35 : Math.max(0, 1 - (s - 0.35) / 0.2), dn = s < 0.35 ? 0 : Math.min(1, (s - 0.35) / 0.15) * (1 - Math.max(0, (s - 0.75) / 0.25));
  if (v.p.u.ev) {
    R.armR.rotation.set(-0.6 - 2.5 * up + 0.9 * dn, 0, 0.2); R.armL.rotation.set(-0.5 - 2.3 * up + 0.8 * dn, 0, -0.3);
    v.holder.rotation.x = 0.25 * dn; v.holder.position.y = 0.16 * sin(Math.min(1, s / 0.5) * PI);
  } else {
    R.armR.rotation.set(-1.5 * up + 0.4 * dn, 0, 0.35 + 0.35 * up); R.armL.rotation.set(-1.5 * up + 0.4 * dn, 0, -0.35 - 0.35 * up);
    v.holder.rotation.x = -0.12 * up + 0.22 * dn;
  }
  return true;
};

// ---------------- Søvn evolved: LULLABY RUSH ----------------
const rush = [];
X.HOOK.event.sovn = (ev, p) => {
  if (!p.u.ev) return false;
  const L = X.lend(), V = L.V, H = L.H, c = L.ctx(p), v = L.views.get(p.id), C = V.CELL;
  if (ev.t === "fire") { if (v) v.atk = 1; return true; }
  if (ev.t === "aim") {
    // the Stand goes: it stops just short of where the enemy will be, on the side Søvn is on
    const d = (ev.delay || 0.75) / Math.max(0.25, (AF.Board && AF.Board.speed) || 1);
    const dx = ev.x - p.x, dz = ev.z - p.z, l = Math.hypot(dx, dz) || 1, sx = ev.x - (dx / l) * 0.7, sz = ev.z - (dz / l) * 0.7;
    if (v && v.R.stand) v.R.stand.out = { x: sx, z: sz, tx: ev.x, tz: ev.z, d, t0: null };
    rush.push({ p, x: ev.x, z: ev.z, sx, sz, r: ev.r, t: 0, d, acc: 0, n: 0, L });
    V.decal(ev.x, ev.z, 6, ev.r * 1.05, { col: VI, k: 1.4, dur: d + 0.3, speed: 1.8 });
    H.flash(p.x, 1.6, p.z, 1.2, VI, 1.4, 0.12);
    L.sfx("tdSlash", {}, 0.05);
    return true;
  }
  if (ev.t === "land") {
    // the last punch: a white flash, a shockwave of dream-light, the ground cracked, the enemies thrown back
    const x = ev.x, z = ev.z, r = ev.r, dx = x - p.x, dz = z - p.z, l = Math.hypot(dx, dz) || 1;
    H.flash(x, 0.7, z, 1.4, 0xffffff, 1.5, 0.12);
    V.decal(x, z, 0, r * 1.7, { col: VI, k: 2.2, dur: 0.45 });
    V.later(0.06, () => V.decal(x, z, 0, r * 2.3, { col: G, k: 1.6, dur: 0.5 }));
    V.decal(x, z, 4, r * 0.9, { col: 0x1a1430, dur: 1.6 });
    V.burst(true, x, 0.6, z, 30, { cols: [VI, G, CY, 0xffffff, PALE], speed: [3, 8], up: 1, life: [0.3, 0.7], size: [0.16, 0.02], cell: C.star, k: 1.9, spin: 8, drag: 2 });
    V.burst(true, x, 0.5, z, 26, { cols: [0xffffff, VI], dir: [dx / l, 0.1, dz / l], cone: 0.5, speed: [6, 12], life: [0.12, 0.25], size: [0.1, 0], cell: C.streak, stretch: 2.4, k: 2.8 });
    V.shake(0.24); V.ripple(x, 0.4, z, 0.006, 1.8); V.flash(VI, 0.16); V.chroma(0.004);
    L.sfx("tdBoom", {}, 0.04);
    return true;
  }
  return false;
};
// the point: arm flung out at the target as the Stand leaves
X.HOOK.pose.sovn = (v, s, e, R) => {
  if (!v.p.u.ev) return false;
  const k = sin(PI * Math.min(1, s * 1.4));
  R.armL.rotation.set(-1.55 * k - 0.3 * (1 - k), 0.1, -0.15);
  R.armR.rotation.set(-2.4, -0.2, -0.95);
  v.holder.rotation.y = -0.25 * k;
  return true;
};
// the barrage while the Stand is there: sparks, flashes and streaks of fists all over the target, runes rising off him
function stepRush(dt) {
  for (let i = rush.length - 1; i >= 0; i--) {
    const q = rush[i], V = q.L.V, H = q.L.H, C = V.CELL;
    q.t += dt; const k = q.t / q.d;
    if (k > 1.25 || !V.on) { rush.splice(i, 1); continue; }
    if (Math.random() < dt * 10) V.burst(true, q.p.x + rnd(-0.4, 0.4), rnd(0.8, 1.8), q.p.z + rnd(-0.4, 0.4), 1, { cols: [VI, 0xc8b8ff], speed: [0.1, 0.3], up: 0.7, life: [0.7, 1.1], size: [0.22, 0.1], cell: C.rune, k: 1.8, spin: 1 });
    if (k < 0.3 || k > 0.96) continue;
    q.acc += dt;
    while (q.acc > 0.028) {
      q.acc -= 0.028; q.n++;
      // on the camera's side of the target, so the Stand's body doesn't hide them
      const cxz = AF.Board.camXZ ? AF.Board.camXZ() : [0.5, 0.9], cl0 = Math.hypot(cxz[0], cxz[1]) || 1;
      const x = q.x + (cxz[0] / cl0) * 0.45 + rnd(-0.45, 0.45), y = rnd(0.5, 1.3), z = q.z + (cxz[1] / cl0) * 0.45 + rnd(-0.45, 0.45), cl = [0xffffff, VI, G, PALE][q.n % 4];
      H.flash(x, y, z, rnd(0.55, 0.95), cl, 1.6, 0.12);
      V.burst(true, x, y, z, 1, { cols: [cl], speed: [0, 0], life: [0.14, 0.14], size: [0.5, 1.1], cell: C.ring, k: 1.8, fixed: true });
      V.burst(true, x, y, z, 4, { cols: [cl, 0xffffff], speed: [1.5, 4], life: [0.1, 0.22], size: [0.05, 0], cell: C.hot, stretch: 1.2, k: 2.6, drag: 2 });
      const fx0 = q.sx + rnd(-0.3, 0.3), fy0 = rnd(0.9, 1.3), fz0 = q.sz + rnd(-0.3, 0.3), tt = 0.07;
      V.put(true, fx0, fy0, fz0, (x - fx0) / tt, (y - fy0) / tt, (z - fz0) / tt, tt, 0, 0, 0.24, 0.12, C.streak, 2.4, V.lin(cl, 2.4), 1);
      if (q.n % 5 === 0) { V.decal(q.x, q.z, 0, 0.6, { col: VI, k: 1.6, dur: 0.18 }); V.shake(0.035); }
    }
  }
}
X.HELL = { rush, fx }; // for checking from the console
X.HOOK.frame.push(dt => {
  stepRush(dt);
  nLinks = 0;
  for (let i = fx.length - 1; i >= 0; i--) if (!fx[i].tick(dt)) fx.splice(i, 1);
  if (links) {
    links.count = nLinks;
    if (nLinks) { links.instanceMatrix.needsUpdate = true; if (links.instanceColor) links.instanceColor.needsUpdate = true; }
  }
});
})();
