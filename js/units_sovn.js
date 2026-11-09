/* Aura Farm: Søvn evolved (1 Nov, Chris: "add one absolute that you can evo thats about as good as vesh, with a really
   really cool attack and cool effects. i think the sovn, the dreaming child would be really cool, use the bear as like a
   'stand' in jojo it should be like that style. it should be really hard to evo").
   Awake at last, Søvn stops pretending the bear is a toy. It stands behind him as LULLABY: a hulking plush guardian made
   of dream, button eye and a stitched-shut one, a sewn heart on its chest, its legs trailing off into light. It floats
   at his back with its arms folded, and in Defense it leaves him, crosses to the target and buries it in a barrage of
   fists (tdhell.js drives the trip through R.stand.out). The Keeper's price is AF.EVO_REQ.sovn below. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, A = K.acc, POSES = K.POSES;
const { box, mesh, pivot, marker, ball, cyl, cone } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const G = 0x3dffa0, CY = 0x2ee6ff, VI = 0xa07bff, PALE = 0xffe9a8, NAVY = 0x1a2440, PINK = 0xff6a9a;
const v3 = new T.Vector3(), v4 = new T.Vector3();
const easeOut = k => 1 - Math.pow(1 - k, 3), easeIO = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

// ======================= LULLABY =======================
// o: size, c / c2 (fur, muzzle and paws), seam (the stitches' light), x / y / z (where it floats behind him)
A.standBear = (R, L, o) => {
  const k = o.size || 1, c = o.c || 0x4a3ab0, c2 = o.c2 || 0x9a88ff, dk = 0x150f38, seam = o.seam || G, eye = o.eye || PALE;
  const home = new T.Vector3(o.x || 0, o.y == null ? 0.7 : o.y, o.z == null ? -1.6 : o.z);
  const g = pivot(R.root, home.x, home.y, home.z); g.scale.setScalar(k);
  const S = { g, home, k, arms: [], ghosts: [], out: null };
  // no legs: below the waist it trails off into dream-light
  const tail = pivot(g, 0, 0, 0);
  [[1.0, c2, 2], [0.78, seam, 2], [0.56, CY, 2], [0.34, 0xffffff, 2]].forEach(([r, col, gl], i) =>
    mesh(tail, cone(r, 1.1, 8), col, 0, 1.15 - i * 0.48, 0, { rx: PI, glow: gl, ink: false }));
  S.tail = tail;
  // the body: a broad plush chest over a narrow waist, a lighter belly patch, a seam of light down the middle
  const body = pivot(g, 0, 1.55, 0); S.body = body;
  box(body, 1.8, 0.9, 1.2, c, 0, 0.25, 0);
  box(body, 2.8, 1.55, 1.6, c, 0, 1.35, 0);
  box(body, 1.5, 1.05, 0.12, c2, 0, 0.8, 0.68, { ink: false });
  for (let i = 0; i < 7; i++) box(body, 0.06, 0.13, 0.04, seam, 0, -0.05 + i * 0.3, 0.82, { glow: 1, ink: false });
  for (let i = 0; i < 5; i++) box(body, 0.16, 0.04, 0.03, seam, 0, 0.1 + i * 0.36, 0.83, { glow: 1, ink: false, rz: i % 2 ? 0.5 : -0.5 });
  // a heart sewn on over where his would be, its stitches glowing
  const hp = pivot(body, -0.72, 1.62, 0.82); hp.rotation.z = 0.18;
  box(hp, 0.36, 0.36, 0.04, PINK, 0, -0.08, 0, { rz: PI / 4, ink: 0.012 });
  for (const s of [-1, 1]) mesh(hp, cyl(0.15, 0.15, 0.04, 14), PINK, s * 0.12, 0.08, 0, { rx: PI / 2, ink: false });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; box(hp, 0.07, 0.025, 0.02, PALE, cos(a) * 0.24, sin(a) * 0.2 - 0.02, 0.03, { rz: a, glow: 1, ink: false }); }
  // a ribbon bow at the throat, as a toy bear has
  for (const s of [-1, 1]) box(body, 0.5, 0.36, 0.18, VI, s * 0.3, 2.06, 0.74, { rz: s * 0.35, ink: 0.012 });
  box(body, 0.2, 0.22, 0.2, 0xd8c8ff, 0, 2.06, 0.78, { ink: 0.012 });
  // the head: a bear's, heavy-browed, one sewing-button eye and one stitched shut, a zigzag mouth sewn across the snout
  const hd = pivot(body, 0, 2.15, 0.12); S.head = hd;
  box(hd, 1.9, 1.45, 1.5, c, 0, 0.7, 0);
  box(hd, 0.98, 0.56, 0.46, c2, 0, 0.4, 0.82);
  box(hd, 0.34, 0.2, 0.12, dk, 0, 0.58, 1.07, { ink: 0.015 });
  for (let i = 0; i < 5; i++) box(hd, 0.15, 0.035, 0.03, seam, -0.28 + i * 0.14, 0.26, 1.06, { rz: i % 2 ? 0.6 : -0.6, glow: 1, ink: false });
  box(hd, 1.55, 0.16, 0.12, dk, 0, 1.08, 0.74, { ink: false, rz: 0.04 });
  mesh(hd, cyl(0.26, 0.26, 0.08, 18), eye, -0.42, 0.86, 0.77, { rx: PI / 2, glow: 1, ink: false });
  mesh(hd, cyl(0.34, 0.34, 0.04, 18), eye, -0.42, 0.86, 0.75, { rx: PI / 2, glow: 2, ink: false });
  for (const [x, y] of [[-0.07, 0.07], [0.07, 0.07], [-0.07, -0.07], [0.07, -0.07]]) box(hd, 0.06, 0.06, 0.03, dk, -0.42 + x, 0.86 + y, 0.82, { ink: false });
  for (const r of [0.8, -0.8]) box(hd, 0.42, 0.07, 0.04, seam, 0.42, 0.86, 0.77, { rz: r, glow: 1, ink: false });
  for (const s of [-1, 1]) {
    const ear = pivot(hd, s * 0.85, 1.45, 0);
    mesh(ear, cyl(0.4, 0.4, 0.28, 16), c, 0, 0, 0, { rx: PI / 2 });
    mesh(ear, cyl(0.23, 0.23, 0.3, 14), c2, 0, 0, 0.02, { rx: PI / 2, ink: false });
  }
  for (let i = 0; i < 4; i++) box(hd, 0.13, 0.04, 0.03, seam, 0.55 + i * 0.1, 1.42 - i * 0.07, 0.76, { rz: -0.5, glow: 1, ink: false });
  // the arms: thick, sewing-button pauldrons, big plush fists with the knuckles stitched in light
  for (const s of [-1, 1]) {
    const sh = pivot(body, s * 1.6, 1.8, 0);
    box(sh, 0.92, 1.15, 0.92, c, 0, -0.5, 0);
    const pd = pivot(sh, s * 0.48, -0.1, 0);
    mesh(pd, cyl(0.44, 0.44, 0.12, 18), PALE, 0, 0, 0, { rz: PI / 2, ink: 0.012 });
    for (const [y, z] of [[0.1, 0.1], [-0.1, 0.1], [0.1, -0.1], [-0.1, -0.1]]) box(pd, 0.14, 0.07, 0.07, dk, s * 0.06, y, z, { ink: false });
    const fa = pivot(sh, 0, -1.05, 0);
    box(fa, 0.84, 1.0, 0.84, c, 0, -0.45, 0);
    box(fa, 0.88, 0.07, 0.88, seam, 0, -0.02, 0, { glow: 1, ink: false });
    const fist = pivot(fa, 0, -1.05, 0);
    box(fist, 1.04, 0.78, 1.04, c2, 0, -0.08, 0.04);
    for (let j = 0; j < 4; j++) box(fist, 0.18, 0.06, 0.18, seam, -0.36 + j * 0.24, -0.48, 0.1, { glow: 1, ink: false });
    S.arms.push({ sh, fa, fist, s });
  }
  // the barrage's afterimages: fists of light it throws faster than they can be seen (hidden until it attacks)
  for (let i = 0; i < 20; i++) {
    const q = pivot(g, 0, 0, 0); q.visible = false;
    box(q, 1.25, 1.1, 0.9, i % 3 ? c2 : seam, 0, 0, 0, { glow: 2, ink: false });
    box(q, 0.8, 0.7, 0.7, 0xffffff, 0, 0, 0.1, { glow: 1, ink: false });
    for (let j = 0; j < 4; j++) box(q, 0.2, 0.18, 0.1, i % 2 ? seam : CY, -0.36 + j * 0.24, 0.26, 0.42, { glow: 1, ink: false });
    S.ghosts.push({ g: q, x: sin(i * 12.9898), y: cos(i * 4.1414), ph: (i * 0.6180339) % 1 });
  }
  marker(R, "stand", hd, 0, 0.85, 0.9);
  marker(R, "standCore", body, 0, 1.35, 0.85);
  R.stand = S;
  R.anim.push(t => standStep(S, t));
};
// the folded-arms float behind him, or the trip out (S.out, set by tdhell.js): fly to the stop point, the barrage, one
// last straight punch, back. Times are fractions of S.out.d (real seconds)
function fold(S, t) {
  // upper arms down and a little forward, forearms swung in across the chest, the right one over the left
  for (const a of S.arms) {
    a.sh.rotation.set(-0.55 + (a.s > 0 ? -0.18 : 0) + sin(t * 1.7) * 0.03, 0, a.s * 0.12);
    a.fa.rotation.set(0, a.s * 0.45, -a.s * 1.5); a.fist.scale.setScalar(1);
  }
  for (const q of S.ghosts) q.g.visible = false;
}
function standStep(S, t) {
  const g = S.g, O = S.out, bob = sin(t * 1.7) * 0.12;
  S.body.scale.set(1 + sin(t * 1.7) * 0.015, 1 + sin(t * 1.7) * 0.025, 1);
  S.tail.rotation.y = t * 0.6; S.tail.scale.set(1, 1 + sin(t * 3) * 0.08, 1);
  S.head.rotation.set(0.06 + sin(t * 1.1) * 0.03, sin(t * 0.7) * 0.08, 0);
  let lt = -1;
  if (O) { if (O.t0 == null) O.t0 = t; lt = (t - O.t0) / O.d; if (lt < 0 || lt > 1.5) S.out = null; }
  if (!S.out) { g.position.set(S.home.x, S.home.y + bob, S.home.z); g.rotation.set(0, 0, 0); g.scale.setScalar(S.k); fold(S, t); return; }
  // the stop point and the target, in the space the stand floats in
  const par = g.parent;
  v3.set(O.x, 0, O.z); par.worldToLocal(v3);
  v4.set(O.tx, 0, O.tz); par.worldToLocal(v4);
  const out = lt < 0.28 ? easeOut(lt / 0.28) : lt < 1.05 ? 1 : 1 - easeIO(Math.min(1, (lt - 1.05) / 0.42));
  const fy = v3.y + (O.dy == null ? -0.35 : O.dy);
  g.position.set(lerp(S.home.x, v3.x, out), lerp(S.home.y + bob, fy, out), lerp(S.home.z, v3.z, out));
  g.rotation.set(0.22 * out, Math.atan2(v4.x - g.position.x, v4.z - g.position.z) * out, 0);
  g.scale.setScalar(S.k * (1 - 0.22 * out)); // a little smaller out there, so the barrage shows round it
  const [L, Rt] = S.arms[0].s < 0 ? S.arms : [S.arms[1], S.arms[0]];
  if (lt < 0.28) {
    // flying in: fists drawn back
    for (const a of S.arms) { a.sh.rotation.set(lerp(-0.6, 0.5, out), 0, a.s * lerp(0.12, -0.25, out)); a.fa.rotation.set(-1.4 * out, a.s * 0.45 * (1 - out), -a.s * 1.5 * (1 - out)); }
    for (const q of S.ghosts) q.g.visible = false;
  } else if (lt < 0.9) {
    // the barrage: both arms hammering, too fast to follow, a cloud of afterimage fists streaking in
    for (const a of S.arms) {
      const pk = Math.max(0, sin(t * 34 + (a.s > 0 ? PI : 0)));
      a.sh.rotation.set(-1.25 + (1 - pk) * 0.55, a.s * 0.12 * (1 - pk), -a.s * 0.18 * (1 - pk));
      a.fa.rotation.set(-(1 - pk) * 1.3, 0, 0);
      a.fist.scale.setScalar(1 + pk * 0.15);
    }
    for (const q of S.ghosts) {
      const k = (t * 7 + q.ph) % 1;
      q.g.visible = k < 0.85;
      q.g.position.set(q.x * 2.2 * (1 - k * 0.4), 2.9 + q.y * 1.3 - k * 0.8, 1.0 + k * 2.8);
      q.g.rotation.set(0.25 + k * 0.2, 0, q.x * 0.3);
      q.g.scale.setScalar(1.15 - k * 0.5);
    }
  } else if (lt < 1.05) {
    // the last one: wound right back, then all of it into one straight punch
    const w = Math.min(1, (lt - 0.9) / 0.07), hit = Math.max(0, Math.min(1, (lt - 0.97) / 0.06));
    L.sh.rotation.set(-0.8, 0, 0.5); L.fa.rotation.set(-1.4, 0, 0);
    Rt.sh.rotation.set(lerp(0.6 * w, -1.5, easeOut(hit)), 0, lerp(-0.3, 0, hit)); Rt.fa.rotation.set(lerp(-1.6 * w, 0, easeOut(hit)), 0, 0);
    Rt.fist.scale.setScalar(1 + 0.6 * hit);
    for (const q of S.ghosts) q.g.visible = false;
  } else {
    for (const a of S.arms) { const r = Math.min(1, (lt - 1.05) / 0.3); a.sh.rotation.set(lerp(-1.5, -0.6, r), 0, a.s * 0.12 * r); a.fa.rotation.set(0, a.s * 0.45 * r, -a.s * 1.5 * r); a.fist.scale.setScalar(1); }
    for (const q of S.ghosts) q.g.visible = false;
  }
}

// ======================= Søvn, awake =======================
// the pose: the one every Stand user strikes. Weight on one leg, hips cocked, one hand spread across his face with the
// eye showing between the fingers, the other arm flung out pointing at you
POSES.dreamPose = (R, t, P, br, fl) => {
  R.armR.rotation.set(-2.35 + sin(t * 1.3) * 0.04, -0.2, -0.95);
  R.armL.rotation.set(-1.15 + br * 0.03, 0.35, -0.55);
  R.torso.rotation.y += 0.32; R.torso.rotation.z = -0.08;
  R.head.rotation.x -= 0.12; R.head.rotation.z += 0.16; R.head.rotation.y -= 0.25;
  if (R.legL) { R.legL.rotation.set(0.15, 0, -0.18); R.legR.rotation.set(-0.12, 0, 0.12); }
};
const B = AF.UNIT.sovn;
if (B && AF.EVO) {
  // his evolved form: his own look with what changes (as units_evo.js evolve)
  const form = (key, d) => {
    const look = Object.assign({}, B.look, d.look || {}); look.face = Object.assign({}, B.look.face, (d.look || {}).face || {});
    const acc = B.acc.filter(([n]) => !(d.drop || []).includes(n)).concat(d.add || []);
    const def = Object.assign({}, B, { look, acc, pose: d.pose, fx: d.fx, scale: d.scale, rim: d.rim, name: d.name, key, evo: true, base: "sovn" });
    AF.UNIT[key] = def;
    return def;
  };
  AF.EVO.sovn = form("sovn@evo", {
    name: "Søvn, the Waking Dream",
    look: { hairC: 0xeaf2ff, hairC2: VI, top: NAVY, face: { style: "glow", eye: PALE, eh: 0.3, brow: -0.15, browC: 0xd8e4f4, mouth: "smile", blush: true } },
    drop: ["dreamBeast", "toySword"],
    add: [["toySword", { hand: "L", rot: [0.5, 0, -0.4], size: 1.15 }], ["standBear", { size: 0.82, x: 0.55, y: 1.15, z: -1.5 }]],
    pose: { pose: "dreamPose", float: true }, scale: 1.0,
    fx: [{ k: "glyphs", set: ["\u30b4"], c: VI, size: 30, rate: 2.6 }, { k: "pressure", cols: [VI, G, CY], w: 58 }, { k: "glow", at: "standCore", r: 150, stops: [[0, "rgba(160,123,255,.45)"], [0.5, "rgba(61,255,160,.18)"], [1, "rgba(20,10,60,0)"]] },
      { k: "glow", at: "stand", c: PALE, r: 46 }, { k: "stars", c: "rainbow", rate: 6 }, { k: "bubbles", rate: 4 }, { k: "fall", kind: "snow", rate: 5 }],
    rim: [VI, G],
  });
  // released: LULLABY at full size behind him, his meteor overhead
  form("sovn@evo@rel", {
    name: "Søvn, the Waking Dream",
    look: { hairC: 0xeaf2ff, hairC2: VI, top: NAVY, face: { style: "glow", eye: 0xffffff, eh: 0.34, brow: 0.2, browC: 0xd8e4f4, mouth: "open", blush: true } },
    drop: ["dreamBeast", "toySword"],
    add: [["toySword", { rot: [0.3, 0, 0.2], size: 1.3 }], ["standBear", { size: 1.0, x: 0.4, y: 1.3, z: -1.8 }], ["dreamMeteor", {}]],
    pose: { pose: "conjure", float: true }, scale: 1.0,
    fx: [{ k: "glyphs", set: ["\u30b4"], c: VI, size: 36, rate: 5 }, { k: "pressure", cols: [VI, G, CY, 0xffffff], w: 66 }, { k: "glow", at: "meteor", c: G, r: 120 }, { k: "stars", c: "rainbow", rate: 10 }],
    rim: [VI, G],
  });
  // what the Keeper asks: harder than any pact yet (Vesh's is five Eternals and 10B shards)
  AF.EVO_REQ.sovn = { stars: 2, offer: ["eternal", 8], shards: 1e12, deed: "floor:space:20", inc: 4, td: 2.4, mats: { contract: 6, crown: 3 } };
}
})();
