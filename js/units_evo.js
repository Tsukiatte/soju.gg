/* Aura Farm: Evolutions (30 Oct, Chris: "I'd rather it be "evolution" and theres evolved versions of certain units. Their
   models would be unbelievably cool looking compared to their unevolved version, with flashy effects and good
   animations. In defense they should be around 2-3x better ... An underground "hell" like world ... There's a dark
   character that pops up dialogue and you have to accept the terms or whatever to evolve, then it tells u what you need").
   Six units can evolve, one per rarity from Mythic to Eternal (two Eternals). An evolved form is its base self remade
   by the pact: what it wore turns black, red and gold, pact marks burn on its face and arms, and it stands and fights
   instead of floating (the lesson of the gate units: characters, not robes and halos). Registered as "<key>@evo" for
   drawing only (never in AF.UNITS, so never summoned); a unit with u.ev draws as it (AF.formKey).
   The Keeper of Pacts ("@keeper") is the dark figure on the bone throne in the Underworld. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, A = K.acc, FX = K.FX;
const { box, mesh, pivot, marker, ring, cyl, cone, chain } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const BLK = 0x0c0a0e, RED = 0xff2a3a, EMB = 0xff5a1a, GOLD = 0xe8b54a, BONE = 0xece4d2;

// ======================= the pact's parts =======================
// burning marks: two strokes under each eye and a band round each forearm
A.pactMarks = (R, L, o) => {
  const c = o.c || RED, H = R.head;
  for (const s of [-1, 1]) {
    box(H, 0.05, 0.2, 0.03, c, s * 0.3, 0.3, 0.6, { rz: s * 0.18, glow: 1, ink: false });
    box(H, 0.04, 0.13, 0.03, c, s * 0.4, 0.32, 0.6, { rz: s * 0.3, glow: 1, ink: false });
  }
  if (o.brow !== false) box(H, 0.22, 0.04, 0.03, c, 0, 0.86, 0.6, { glow: 1, ink: false });
  if (o.arms !== false) for (const a of [R.armL, R.armR]) for (const y of [-0.42, -0.56]) box(a, 0.5, 0.035, 0.52, c, 0, y, 0, { glow: 1, ink: false });
};
// a broken black ring behind the head, three of its pieces gone, a red line along the inside; it turns slowly
A.crackedHalo = (R, L, o) => {
  const g = pivot(R.head, 0, o.y || 1.45, o.z == null ? -0.55 : o.z), r = o.r || 0.95, n = 14, gone = new Set(o.gone || [2, 3, 9]);
  for (let i = 0; i < n; i++) {
    if (gone.has(i)) continue;
    const a = (i / n) * PI * 2, p = pivot(g, cos(a) * r, sin(a) * r, 0); p.rotation.z = a + PI / 2;
    box(p, 0.42, 0.16, 0.1, o.c || BLK, 0, 0, 0, { rz: (i % 3 - 1) * 0.08 });
    box(p, 0.38, 0.04, 0.11, o.edge || RED, 0, -0.07, 0, { glow: 1, ink: false });
  }
  R.anim.push(t => { g.rotation.z = t * (o.sp || 0.25); });
};
// a ragged black mantle, its torn hem smouldering
A.emberMantle = (R, L, o) => {
  const c = o.c || BLK, e = o.edge || EMB;
  R.cape = chain(R, R.torso, 0, 0.98, -0.34, o.n || 4, 0.46, (s, i, n) => {
    const w = 1.2 + i * 0.14;
    box(s, w, 0.48, 0.06, c, 0, -0.23, 0);
    if (o.lining) box(s, w - 0.06, 0.44, 0.02, o.lining, 0, -0.23, 0.045, { ink: false });
    if (i === (o.n || 4) - 1) for (let k = 0; k < 7; k++) {
      const x = -w / 2 + 0.1 + k * (w - 0.2) / 6, h = 0.12 + ((k * 7) % 3) * 0.08;
      box(s, 0.16, h, 0.06, c, x, -0.5 - h / 2, 0, { rz: k % 2 ? 0.2 : -0.16 });
      box(s, 0.14, 0.04, 0.07, e, x, -0.5 - h, 0, { glow: 1, ink: false });
    }
  }, { b0: 0.14, b: 0.08, amp: 0.1, sp: 1.8, zamp: 0.06 });
};
// chains hanging from both wrists, the last link of each glowing
A.pactChains = (R, L, o) => {
  for (const h of [R.handL, R.handR]) chain(R, h, 0, -0.05, 0, o.n || 4, 0.2, (sg, i, n) => {
    mesh(sg, ring(0.1, 0.03, 5, 12), i === (o.n || 4) - 1 ? (o.glow || RED) : (o.c || 0x5a5a62), 0, -0.1, 0, { ry: i % 2 ? PI / 2 : 0, glow: i === (o.n || 4) - 1 ? 1 : 0 });
  }, { b0: 0.3, b: 0.1, amp: 0.14, sp: 2.4, zamp: 0.1 });
};
// a skull mask over the face: brow ridge, dark sockets lit from inside, a row of teeth
A.boneMask = (R, L, o) => {
  const H = R.head, c = o.c || BONE;
  box(H, 1.0, 0.86, 0.08, c, 0, 0.5, 0.6);
  box(H, 1.06, 0.14, 0.12, c, 0, 0.82, 0.62);
  for (const s of [-1, 1]) {
    box(H, 0.26, 0.22, 0.04, 0x050405, s * 0.22, 0.56, 0.65, { ink: false });
    box(H, 0.1, 0.08, 0.03, o.eye || RED, s * 0.22, 0.56, 0.67, { glow: 1, ink: false });
  }
  for (let k = -2; k <= 2; k++) box(H, 0.08, 0.14, 0.03, 0x2a2420, k * 0.12, 0.2, 0.65, { ink: false });
  if (o.crack) box(H, 0.04, 0.5, 0.03, 0x2a2420, 0.12, 0.62, 0.66, { rz: 0.4, ink: false });
};
// the ferryman's oar sharpened into a reaper's blade, a red lantern swinging off its neck
A.oarScythe = (R, L, o) => {
  const s = K.hand(R, o), c = o.c || 0x2a1a14, edge = o.edge || RED;
  box(s, 0.12, 3.6, 0.12, c, 0, 0.9, 0);
  const b = pivot(s, 0, 2.65, 0);
  for (let i = 0; i < 6; i++) { const a = i * 0.24; box(b, 0.32, 0.12, 0.08, o.blade || 0x1a1a20, -sin(a) * 1.0 - 0.15, cos(a) * 0.3 - i * 0.03, 0, { rz: a + 0.2 }); }
  for (let i = 0; i < 6; i++) { const a = i * 0.24; box(b, 0.3, 0.035, 0.09, edge, -sin(a) * 1.0 - 0.15, cos(a) * 0.3 - i * 0.03 - 0.07, 0, { rz: a + 0.2, glow: 1, ink: false }); }
  marker(R, "tip", b, -1.3, 0, 0); marker(R, "base", s, 0, 1.2, 0);
  const lp = pivot(s, 0.1, 2.2, 0);
  const lan = chain(R, lp, 0, 0, 0, 2, 0.22, (sg, i) => {
    if (i === 0) box(sg, 0.03, 0.22, 0.03, 0x3a3a40, 0, -0.11, 0, { ink: false });
    else { box(sg, 0.3, 0.36, 0.3, 0x1a1012, 0, -0.2, 0); box(sg, 0.22, 0.26, 0.32, o.lamp || RED, 0, -0.2, 0, { glow: 1, ink: false }); marker(R, "lantern", sg, 0, -0.2, 0); }
  }, { b0: 0, b: 0.1, amp: 0.2, sp: 1.6, zamp: 0.12 });
  return lan;
};
// a black sun on her back: a dark disc in a ring of red and gold flame, turning
A.blackSun = (R, L, o) => {
  const e = pivot(R.torso, 0, 1.9, -1.0);
  mesh(e, cyl(1.0, 1.0, 0.05, 48), 0x050304, 0, 0, 0, { rx: PI / 2 });
  mesh(e, ring(1.03, 0.06, 8, 64), o.rim || 0xffd76a, 0, 0, 0.03, { glow: 1, ink: false });
  const cor = pivot(e, 0, 0, -0.02);
  for (let i = 0; i < 22; i++) {
    const len = i % 2 ? 0.3 : 0.55 + (i % 3) * 0.12, r = pivot(cor); r.rotation.z = (i / 22) * PI * 2;
    box(r, 0.09, len, 0.04, i % 3 ? RED : (o.rim || 0xffd76a), 0, 1.15 + len / 2, 0, { glow: 1, ink: false });
  }
  marker(R, "sun", e, 0, 0, 0);
  R.anim.push(t => { cor.rotation.z = -t * 0.35; cor.scale.setScalar(1 + sin(t * 2.2) * 0.04); });
};
// (30 Oct) the bars of a cell burst from inside: a half ring behind him, bent outward, snapped, ends molten
A.brokenCage = (R, L, o) => {
  const g = pivot(R.root, 0, 0, -0.2), c = o.c || 0x2a2a30, hot = o.hot || 0xffd76a, n = o.n || 11;
  for (let i = 0; i < n; i++) {
    const a = PI * 0.08 + (i / (n - 1)) * PI * 0.84, r = 1.55, h = 2.4 + ((i * 37) % 5) * 0.35;
    const b = pivot(g, Math.cos(a) * r, 0, -Math.sin(a) * r);
    b.rotation.y = -a + PI / 2; b.rotation.z = (i % 2 ? 1 : -1) * 0.04; b.rotation.x = -0.32 - ((i * 13) % 3) * 0.08;
    box(b, 0.16, h, 0.16, c, 0, h / 2, 0);
    box(b, 0.22, 0.12, 0.22, 0x3a3a42, 0, 0.35, 0);
    box(b, 0.17, 0.16, 0.17, hot, 0, h + 0.06, 0, { glow: 1, ink: false });
    if (i % 3 === 1) box(b, 0.12, 0.38, 0.12, c, 0.06, h + 0.55, 0.04, { rz: 0.5, rx: 0.3 });
  }
  box(g, 3.4, 0.2, 0.2, c, 0, 0.12, -1.45);
  R.anim.push(t => { g.rotation.y = Math.sin(t * 0.7) * 0.04; });
};
// a crown of black horns rising from a gold band
A.hornCrown = (R, L, o) => {
  const H = R.head, g = o.c || GOLD;
  box(H, 1.26, 0.12, 1.16, g, 0, 1.02, 0.02, { ink: 0.02 });
  [[-0.42, 0.3, 0.2], [-0.16, 0.48, 0.05], [0.16, 0.48, -0.05], [0.42, 0.3, -0.2]].forEach(([x, h, rz]) => {
    mesh(H, cone(0.09, h, 4), o.horn || BLK, x, 1.1 + h / 2, 0.5, { rz });
    mesh(H, cone(0.045, h * 0.4, 4), o.tip || RED, x - rz * h * 0.4, 1.1 + h * 0.85, 0.5, { rz, glow: 1, ink: false });
  });
};
// an open wound in the air behind him, red at the edges (the rift, turned)
A.wound = (R, L, o) => A.riftTear(R, L, Object.assign({ c: o.c || RED, c2: o.c2 || 0x3dffc8 }, o));

// (30 Oct, "a better face, it looks tacky") the Keeper's face: shadow under the hood, slit eyes burning, cracks, a thin grin
A.demonFace = (R, L, o) => {
  const H = R.head, c = o.eye || RED, lit = [];
  box(H, 1.1, 1.02, 0.04, 0x050304, 0, 0.55, 0.585, { ink: false });
  for (const s of [-1, 1]) {
    lit.push(box(H, 0.36, 0.065, 0.03, c, s * 0.25, 0.64, 0.61, { rz: s * 0.34, glow: 1, ink: false, own: 1 }));
    box(H, 0.13, 0.035, 0.035, 0xfff0c0, s * 0.23, 0.635, 0.625, { rz: s * 0.34, glow: 1, ink: false });
    box(H, 0.028, 0.3, 0.03, c, s * 0.39, 0.42, 0.61, { rz: s * -0.22, glow: 1, ink: false });
    box(H, 0.024, 0.14, 0.03, c, s * 0.33, 0.3, 0.61, { rz: s * 0.35, glow: 1, ink: false });
  }
  for (let i = -6; i <= 6; i++) box(H, 0.04, i % 2 ? 0.06 : 0.09, 0.03, 0xffc0a0, i * 0.062, 0.27 + i * i * 0.0055, 0.61, { glow: 1, ink: false });
  R.anim.push(t => { const k = 0.75 + 0.25 * Math.abs(Math.sin(t * 3.1) * Math.sin(t * 1.7 + 1)); lit.forEach(m => m.material.color.setHex(c).multiplyScalar(1 + k)); });
};
// a throne of bones (the Keeper's seat): a black stone block, ribs for a back, skulls along the arms
A.boneThrone = (R, L, o) => {
  const g = pivot(R.root, 0, 0, -0.35);
  box(g, 2.3, 0.9, 1.5, 0x1a1418, 0, 0.0, 0.15);
  box(g, 2.5, 0.18, 1.7, 0x2a2024, 0, 0.5, 0.15);
  for (let i = 0; i < 5; i++) {
    const x = -0.9 + i * 0.45, h = 2.4 + (i === 2 ? 0.9 : i % 2 ? 0.5 : 0);
    mesh(g, cone(0.12, h, 5), BONE, x, 0.6 + h / 2, -0.55, { rz: (i - 2) * 0.12 });
  }
  for (const s of [-1, 1]) {
    box(g, 0.34, 0.34, 1.3, 0x1a1418, s * 1.1, 0.8, 0.15);
    const sk = pivot(g, s * 1.1, 1.08, 0.75);
    box(sk, 0.36, 0.32, 0.34, BONE, 0, 0.06, 0);
    for (const e of [-1, 1]) box(sk, 0.09, 0.08, 0.02, RED, e * 0.08, 0.1, 0.18, { glow: 1, ink: false });
  }
};

// ======================= Vesh, made for the Underworld (30 Oct) =======================
// never summoned (gate "underworld"); the Keeper gives him (ui.js uwGift). Weak as found, the strongest thing in the
// game evolved (AF.EVO_REQ.vesh inc/td, the def's tdK)
AF.UNITS.push({ key: "vesh", name: "Vesh, the Chained", rarity: "absolute", base: 4e8, gate: "underworld", tdK: 0.4,
  look: { skin: 0x8a8480, hairC: 0x3a3634, hairC2: 0x4a4644, hair: "messy", top: 0x3a3430, sleeve: 0x8a8480, pants: 0x2a2622, boot: 0x8a8480, glove: 0x8a8480,
    face: { style: "none", brow: null, mouth: "flat" } },
  acc: [["blindfold", { c: 0xb8ab94 }], ["pactChains", { c: 0x4a4a50, glow: 0x5a5a60 }], ["collarTall", { c: 0x3a3a40 }]],
  pose: { pose: "drop", headX: 0.25 }, scale: 0.92,
  fx: [{ k: "dust", rate: 2 }],
  rim: [0x6a6460, 0x3a3430],
});
{ const d = AF.UNITS[AF.UNITS.length - 1]; d.idx = AF.UNITS.length - 1; AF.UNIT[d.key] = d; }

// ======================= the evolved forms =======================
const EVO = AF.EVO = {};
// each is its base self with what changes (as units_gates.js's release): look and face merged, parts dropped or added,
// its own pose, effects, size and name. The requirements the Keeper names are in AF.EVO_REQ (data, below)
function evolve(key, d) {
  const b = AF.UNIT[key]; if (!b) return;
  const look = Object.assign({}, b.look, d.look || {});
  look.face = Object.assign({}, b.look.face, (d.look || {}).face || {});
  const acc = d.acc || b.acc.filter(([n]) => !(d.drop || []).includes(n)).concat(d.add || []);
  const def = Object.assign({}, b, { look, acc, pose: d.pose || b.pose, fx: d.fx || b.fx, scale: d.scale || b.scale, rim: d.rim || b.rim,
    name: d.name, key: key + "@evo", evo: true, base: key });
  EVO[key] = def; AF.UNIT[def.key] = def;
}
// (30 Oct, first look: the forms that dropped their wings and halos for black read as recolours, not upgrades): each
// keeps what made it and grows it (more wings, a bigger weapon, a stronger centrepiece), with the pact on top
evolve("kairo", {
  name: "Kairo, the Black Storm",
  look: { top: 0x161a2e, pants: 0x0a0e1a, boot: 0x0a0e1a, bootTrim: RED, glove: 0x0a0e1a, cuff: 0x4fe6ff, hairC: 0x1a2a5a, hairC2: 0x4fe6ff,
    face: { style: "narrow", eye: 0x4fe6ff, brow: -0.42, mouth: "grin" } },
  drop: ["cape", "greatsword"],
  add: [["armor", { c: 0x1e2440, trim: 0x4fe6ff, emblem: RED, glowEmblem: true }], ["cape", { c: 0x3a0a14, c2: 0x0a0e1a, trim: 0x4fe6ff, n: 4, w: 1.3 }], ["pactMarks", { c: 0x4fe6ff }],
    ["sword", { hand: "L", rot: [0.35, 0, 0.4], c: RED, glowBlade: true, len: 1.7, trim: 0x1a1a22 }], ["greatsword", { rot: [0.62, 0, -0.32], glow: 0x4fe6ff, trim: 0xd8e4ff, c: 0xe8f0ff }],
    ["crackedHalo", { edge: 0x4fe6ff, c: 0x1e2440, r: 0.95 }]],
  pose: { pose: "guard" }, scale: 1.12,
  fx: [{ k: "arc", a: "base", b: "tip", c: 0x4fe6ff, every: 0.3 }, { k: "arc", a: "handR", b: "head", c: 0xbff2ff, every: 0.6 }, { k: "arc", a: "handL", b: "feet", c: RED, every: 0.9 },
    { k: "sparks", a: "base", b: "tip", c: 0xbff2ff }, { k: "pressure", cols: [0x4fe6ff, 0x7fb8ff, RED], w: 50 }, { k: "shock", c: 0x4fe6ff, every: 2, r: 170 }, { k: "wind", rate: 6 }],
  rim: [0x4fe6ff, RED],
});
evolve("seraphine", {
  name: "Seraphine, the Unfallen",
  look: { robeIn: RED, face: { style: "glow", eye: 0xffd76a, brow: null, mouth: "flat" } },
  drop: ["wings", "crown"],
  add: [["wings", { kind: "light", c: 0xfff2b0, c2: 0xff5a6a, n: 7, pairs: 4, span: 1.5, flap: 1.0 }], ["crackedHalo", { edge: 0xffd76a, c: 0xfffaf2, r: 1.25, y: 1.25, z: -0.75 }],
    ["hornCrown", { c: 0xffd76a, horn: 0xfffaf2, tip: RED }], ["armor", { c: 0xfffaf2, trim: 0xffd76a, emblem: RED, glowEmblem: true }], ["pactMarks", { c: 0xffb02e, arms: false }],
    ["spear", { rot: [0.1, 0, 0.08], shaft: 0xffd76a, head: 0xffffff, glowHead: true, ribbon: RED }]],
  pose: { pose: "atSide", headX: -0.1 }, scale: 1.08,
  fx: [{ k: "rays", at: "halo", c: 0xffe6a0, n: 22, len: 240, spin: 0.2, a: 0.45 }, { k: "fall", kind: "feather", rate: 9 }, { k: "embers", rate: 16, c: 0xffd76a },
    { k: "glow", at: "center", r: 160, stops: [[0, "rgba(255,255,255,.85)"], [0.3, "rgba(255,210,140,.45)"], [0.7, "rgba(255,80,90,.18)"], [1, "rgba(255,80,90,0)"]] },
    { k: "pressure", cols: [0xffd76a, 0xffffff, RED], w: 48 }, { k: "shock", c: 0xfff2b0, every: 2.2, r: 180 }, { k: "flare", at: "halo", s: 52 }],
  rim: [0xffd76a, RED],
});
evolve("lumina", {
  name: "Lumina, Weaver of the Red Aurora",
  look: { robeTrim: RED, robeIn: 0x7dffcf, hairC: 0xff6a8a, hairC2: 0x7dffcf, face: { style: "glow", eye: 0xff8aa0, brow: null, mouth: "smile" } },
  drop: ["wings", "ribbons", "halo"],
  add: [["ribbons", { cols: [RED, 0xffd76a, 0x7dffcf, 0xff7ad9, 0x4fb8ff], n: 11 }], ["wings", { kind: "light", c: 0x7dffcf, c2: 0xff5a7a, n: 7, pairs: 3, span: 1.45, flap: 0.9 }],
    ["hornCrown", { c: 0x7dffcf, horn: 0x0a1c34, tip: 0xff6a8a }], ["runeRing", { c: 0xff5a7a, c2: 0x7dffcf, r: 1.7, y: 1.6, sp: 0.6 }], ["pactMarks", { c: 0xff6a8a }],
    ["staff", { shaft: 0x0a1c34, orb: 0xff6a8a }]],
  pose: { pose: "conduct" }, scale: 1.05,
  fx: [{ k: "threads", c: 0xff5a7a, rate: 4 }, { k: "motes", c: "rainbow", rate: 34 }, { k: "glow", at: "center", r: 170, stops: [[0, "rgba(255,120,150,.55)"], [0.5, "rgba(125,255,207,.25)"], [1, "rgba(60,10,40,0)"]] },
    { k: "ring", at: "feet", c: 0xff5a7a, every: 0.9, r: 120 }, { k: "stars", c: "rainbow", rate: 8 }, { k: "pressure", cols: [0xff5a7a, 0x7dffcf, 0xffd76a], w: 48 }],
  rim: [0xff5a7a, 0x7dffcf],
});
evolve("kharon", {
  name: "Kharon, Ferryman of the Red River",
  look: { robe: 0x08060a, robeTrim: RED, robeIn: 0x3a0a10, top: 0x08060a, sleeve: 0x08060a, face: { style: "glow", eye: RED, brow: null, mouth: "none" } },
  drop: ["lanternPole", "ghostLanterns", "riftTear"],
  add: [["horns", { c: 0x1a1418, tip: RED }], ["boneMask", { crack: true }], ["emberMantle", { lining: 0x5a0a14 }], ["pactChains", {}],
    ["oarScythe", { rot: [0.25, 0, 0.05] }], ["wound", { h: 4.6, w: 1.0, c: RED, c2: 0x3dffc8 }], ["ghostLanterns", { n: 6, c: RED }]],
  pose: { pose: "hold" }, scale: 1.3,
  fx: [{ k: "glow", at: "lantern", c: RED, r: 80 }, { k: "smoke", area: [0.1, 0.9, 0.62, 0.98], rate: 12, c: 0x2a0408, a: 0.5 }, { k: "embers", rate: 18, up: 50 },
    { k: "glow", at: "rift", c: RED, r: 170 }, { k: "eyes", iris: RED, rate: 1.5 }, { k: "shock", c: RED, every: 1.9, r: 190 }],
  rim: [RED, 0x3dffc8],
});
evolve("aurore", {
  name: "Aurore, the Black Sun",
  look: { robeTrim: 0xffd76a, robeIn: RED, hairC: 0xfff0d0, hairC2: 0xffb07a, face: { style: "glow", eye: 0xffd76a, brow: null, mouth: "flat" } },
  drop: ["sunDisc", "wings", "crown"],
  add: [["blackSun", {}], ["wings", { kind: "feather", c: 0xffffff, c2: 0xffd76a, n: 8, pairs: 4, span: 1.5, flap: 1.0 }], ["armor", { c: 0xfffaf2, trim: 0xffd76a, emblem: RED, glowEmblem: true }],
    ["hornCrown", { c: 0xffd76a, horn: 0x1a1210, tip: 0xffd76a }], ["pactMarks", { c: 0xffb02e }], ["spear", { rot: [0.05, 0, 0.1], shaft: 0xffd76a, head: 0xffffff, glowHead: true, ribbon: RED }]],
  pose: { pose: "atSide", headX: -0.08 }, scale: 1.1,
  fx: [{ k: "glow", at: "sun", r: 200, stops: [[0, "rgba(0,0,0,0)"], [0.3, "rgba(255,210,100,.65)"], [0.6, "rgba(255,50,40,.25)"], [1, "rgba(80,0,0,0)"]] },
    { k: "embers", rate: 28, up: 60, c: 0xffd76a }, { k: "fall", kind: "feather", rate: 9 }, { k: "shock", c: 0xffd76a, every: 1.8, r: 210 },
    { k: "pressure", cols: [0xffd76a, RED, 0xffffff], w: 54 }, { k: "motes", c: "rainbow", rate: 30 }, { k: "ring", at: "feet", c: 0xffd76a, every: 0.8, r: 130 }],
  rim: [0xffd76a, RED],
});
evolve("axiom", {
  name: "Axiom, the Rift Made Flesh",
  look: { robeTrim: RED, robeIn: 0x0a0a10, glove: 0x0a0a10, hairC2: RED, face: { style: "glow", eye: RED, brow: null, mouth: "smile" } },
  drop: ["wings", "blades", "riftTear"],
  add: [["wound", { h: 5.2, w: 1.3, c: RED, c2: 0x3dffc8 }], ["wings", { kind: "light", c: 0x3dffc8, c2: RED, n: 7, pairs: 4, span: 1.5, flap: 1 }], ["hole", { y: 0.55, r: 0.2, c: RED, gear: RED }],
    ["claws", { c: 0x0a0a10 }], ["pactMarks", {}], ["blades", { n: 10, r: 2.3, c: 0xffffff, glow: true, trim: RED, sp: 0.7 }], ["crackedHalo", { edge: 0x3dffc8, r: 1.1 }]],
  pose: { pose: "pockets", headY: -0.1 }, scale: 1.12,
  fx: [{ k: "glow", at: "rift", c: RED, r: 190 }, { k: "glitch", amount: 0.7 }, { k: "afterimage", n: 3, every: 0.08, off: 9 }, { k: "motes", c: "rainbow", rate: 40 },
    { k: "pressure", cols: [RED, 0x3dffc8, 0xffffff], w: 52 }, { k: "shock", c: "rainbow", every: 1.8, r: 210 }, { k: "stars", c: "rainbow", rate: 12 }],
  rim: [RED, 0x3dffc8],
});

evolve("vesh", {
  name: "Vesh, the Unbound Sovereign",
  look: { skin: 0x16121a, hairC: 0x1a1418, hairC2: 0xffd76a, hair: "long", top: 0x0c0a0e, sleeve: 0x0c0a0e, pants: 0x0c0a0e, boot: 0x0c0a0e, glove: 0x0c0a0e,
    face: { style: "glow", eye: 0xffd76a, brow: -0.2, mouth: "smile" } },
  acc: [["brokenCage", {}],
    ["armor", { c: 0x16121a, trim: 0xffd76a, emblem: RED, glowEmblem: true }], ["emberMantle", { lining: 0x3a2a0a, edge: 0xffd76a }],
    ["lavaCracks", { c: 0xffd76a }], ["hornCrown", { c: 0xffd76a, horn: 0x0c0a0e, tip: 0xffd76a }], ["pactMarks", { c: 0xffd76a }],
    ["brokenChains", { c: 0xffd76a, n: 9 }], ["greatsword", { rot: [0.62, 0, -0.32], glow: 0xffd76a, trim: 0x2a2018, c: 0x14121a }],
  ],
  pose: { pose: "emperor" }, scale: 1.4,
  fx: [{ k: "pressure", cols: [0xffd76a, RED, 0xffffff], w: 62, h: 270, rate: 46 }, { k: "embers", rate: 34, up: 70, c: 0xffd76a },
    { k: "shock", c: 0xffd76a, every: 1.6, r: 220 }, { k: "afterimage", n: 2, every: 0.09, off: 8 },
    { k: "glow", at: "center", r: 180, stops: [[0, "rgba(255,215,106,.4)"], [0.5, "rgba(255,40,40,.18)"], [1, "rgba(60,0,0,0)"]] },
    { k: "arc", a: "base", b: "tip", c: 0xffd76a, every: 0.4 }, { k: "eyes", iris: 0xffd76a, rate: 1.5 }],
  rim: [0xffd76a, RED],
});

// the Keeper of Pacts: drawn in the Underworld only
AF.UNIT["@keeper"] = {
  key: "@keeper", name: "The Keeper of Pacts", rarity: "absolute", base: 0, idx: -1, draw: true,
  look: { skin: 0x1a0e12, hair: "none", robe: 0x060406, robeTrim: RED, robeIn: 0x2a0408, top: 0x060406, sleeve: 0x060406, glove: 0x1a0e12,
    face: { style: "none", brow: null, mouth: "none" } },
  acc: [["boneThrone", {}], ["hood", { c: 0x0a0608, c2: RED }], ["horns", { c: 0x0a0608, tip: RED }], ["demonFace", {}], ["collarTall", { c: 0x060406, c2: RED }], ["emberMantle", { lining: 0x2a0408 }],
    ["pactChains", { n: 5 }], ["crackedHalo", { r: 1.25, y: 1.6, sp: 0.15 }]],
  pose: { pose: "sit" }, scale: 1.7,
  fx: [{ k: "embers", rate: 20, up: 40 }, { k: "eyes", iris: RED, rate: 2 }],
  rim: [RED, 0x2a0408],
};

// (30 Oct) the Keeper for his dialogue portrait: no throne or mantle, so the card frames his face and horns
AF.UNIT["@keeper-bust"] = Object.assign({}, AF.UNIT["@keeper"], { key: "@keeper-bust",
  acc: AF.UNIT["@keeper"].acc.filter(([n]) => n !== "boneThrone" && n !== "emberMantle" && n !== "crackedHalo"), pose: { pose: "atSide", headX: 0.08 }, scale: 1.2 });

// what each evolution asks, in the Keeper's words: stars on the unit itself, units of a rarity given to the lake,
// Aura Shards, and one deed (a goal key, game.js G.reqMet). Reasoned, not measured
AF.EVO_REQ = {
  // (30 Oct) mats: the Merchant's materials each needs (data.js AF.MATS)
  kairo:     { stars: 5, offer: ["legendary", 6], shards: 2e7, deed: "neon:hard", mats: { soul: 2 } },
  seraphine: { stars: 4, offer: ["secret", 4], shards: 8e7, deed: "frost:nightmare", mats: { soul: 3 } },
  lumina:    { stars: 3, offer: ["divine", 3], shards: 3e8, deed: "floor:village:30", mats: { soul: 2, ingot: 1 } },
  kharon:    { stars: 2, offer: ["transcendent", 2], shards: 8e8, deed: "space:hard", mats: { ingot: 2 } },
  aurore:    { stars: 1, offer: ["primordial", 2], shards: 2e9, deed: "space:nightmare", mats: { ingot: 2, contract: 1 } },
  axiom:     { stars: 1, offer: ["primordial", 2], shards: 2e9, deed: "floor:neon:20", mats: { ingot: 2, contract: 1 } },
  // (30 Oct) Vesh: his own income and Defense multipliers when evolved
  vesh:      { stars: 1, offer: ["eternal", 5], shards: 1e10, deed: "space:nightmare", inc: 60, td: 3.9, mats: { contract: 3, crown: 1 } },
};
// (1 Nov, "there needs to be a way to star up vesh too, through the underworld somehow"): a unit that is never summoned
// can't be fed copies, so the Keeper binds its stars instead: the price of each next star, from 2 to 5 (game.js G.starPact)
AF.STAR_PACT = {
  vesh: [
    { offer: ["primordial", 3], shards: 5e10, mats: { contract: 2 } },
    { offer: ["primordial", 6], shards: 2e11, mats: { contract: 3, crown: 1 } },
    { offer: ["eternal", 3], shards: 1e12, mats: { contract: 4, crown: 2 } },
    { offer: ["eternal", 6], shards: 5e12, mats: { contract: 6, crown: 3 } },
  ],
};
})();
