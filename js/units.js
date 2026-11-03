/* Aura Farm roster: original characters, Common to Eternal plus the Rift Gate's own, put together from the parts kit.
   look = rig colours and face/hair, acc = accessories, pose = idle, fx = 2D card effects. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, A = K.acc;
const { box, mesh, pivot, marker, ball, ring, cyl, cone } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const DEFS = AF.UNITS = [];
const U = (key, name, rarity, base, d) => DEFS.push(Object.assign({ key, name, rarity, base }, d));

// ---- special pieces for the top units ----
A.eclipse = (R, L, o) => {
  const e = pivot(R.torso, 0, 1.95, -0.95);
  mesh(e, cyl(1.05, 1.05, 0.05, 48), 0x040306, 0, 0, 0, { rx: PI / 2, glow: 1, inkGeo: cyl(1.1, 1.1, 0.04, 48) });
  const rim = mesh(e, ring(1.08, 0.07, 10, 72), 0xfff0b8, 0, 0, 0.02, { glow: 1, own: 1 });
  const cor = pivot(e);
  for (let i = 0; i < 16; i++) {
    const len = i % 2 ? 0.34 : 0.62, r = pivot(cor); r.rotation.z = (i / 16) * PI * 2;
    box(r, 0.07, len, 0.04, i % 2 ? 0xc47bff : 0xffd76a, 0, 1.3 + len / 2, 0, { glow: 1, ink: false });
  }
  marker(R, "eclipse", e);
  R.anim.push(t => {
    cor.rotation.z = t * 0.22;
    const p = 0.82 + 0.18 * sin(t * 3.2);
    rim.material.color.setRGB(1.0, 0.93 * p + 0.05, 0.6 * p + 0.1);
  });
};
A.darkHalo = (R) => {
  const g = pivot(R.head, 0, 1.55, -0.2); g.rotation.x = PI / 2 - 0.3;
  mesh(g, ring(0.62, 0.11, 8, 48), 0x000000, 0, 0, 0, { glow: 1 });
  mesh(g, ring(0.75, 0.025, 6, 48), 0xffffff, 0, 0, 0, { glow: 1 });
  mesh(g, ring(0.49, 0.02, 6, 48), 0xffffff, 0, 0, 0, { glow: 1 });
  marker(R, "halo", g);
  R.anim.push(t => { g.rotation.z = t * 0.5; g.position.y = 1.55 + sin(t * 2) * 0.05; });
};
A.inkLines = (R) => {
  for (let i = 0; i < 7; i++) box(R.torso, 0.5 + (i % 3) * 0.15, 0.03, 0.02, 0x101010, (i % 2 ? 0.08 : -0.1), 0.15 + i * 0.12, 0.3, { ink: false });
  for (const a of [R.armL, R.armR]) for (let i = 0; i < 3; i++) box(a, 0.3, 0.03, 0.02, 0x101010, 0, -0.15 - i * 0.18, 0.23, { ink: false });
};
A.haloTriple = (R) => {
  const g = pivot(R.head, 0, 0.6, 0);
  const rings = [[1.0, 0xfff2b0, [PI / 2 - 0.2, 0, 0]], [1.18, 0x9fe8ff, [0.4, 0, 0.6]], [1.36, 0xffd0f0, [-0.5, 0.3, -0.5]]].map(([r, c, rot]) => {
    const p = pivot(g); p.rotation.set(...rot);
    const m = mesh(p, ring(r, 0.035, 6, 64), c, 0, 0, 0, { glow: 1 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; box(m, 0.1, 0.1, 0.1, 0xffffff, cos(a) * r, sin(a) * r, 0, { glow: 1, ink: false, rz: 0.785 }); }
    return m;
  });
  const top = pivot(R.head, 0, 1.75, 0);
  mesh(top, new T.OctahedronGeometry(0.2), 0xffffff, 0, 0, 0, { glow: 1 });
  marker(R, "halo", top);
  R.anim.push(t => {
    rings.forEach((m, i) => { m.rotation.z = t * (0.6 + i * 0.35) * (i % 2 ? -1 : 1); });
    top.rotation.y = t * 2; top.position.y = 1.75 + sin(t * 2.4) * 0.08;
  });
};
A.blackHole = (R) => {
  const g = pivot(R.root, 0, 2.6, -1.4);
  mesh(g, ball(0.85, 3), 0x000000, 0, 0, 0, { glow: 1 });
  const disk = pivot(g); disk.rotation.x = 1.2; disk.rotation.z = 0.25;
  const rings = [[1.25, 0.12, 0xffd27a], [1.5, 0.1, 0xff6a3a], [1.75, 0.09, 0xff3bc8], [2.0, 0.07, 0x7a3bff]].map(([r, tt, c]) => {
    const m = mesh(disk, ring(r, tt, 6, 64), c, 0, 0, 0, { glow: 1 }); m.scale.z = 0.4; return m;
  });
  mesh(g, ring(0.9, 0.04, 6, 48), 0xffe6c0, 0, 0, 0.1, { glow: 1 });
  const debris = [];
  for (let i = 0; i < 9; i++) {
    const d = pivot(disk);
    box(d, 0.14 + (i % 3) * 0.06, 0.12, 0.12, i % 2 ? 0x2a1a3a : 0x5a3a6a, 0, 0, 0, { ink: 0.02 });
    debris.push({ d, a: (i / 9) * PI * 2, r0: 2.6 + (i % 3) * 0.3, ph: i * 0.37 });
  }
  marker(R, "hole", g);
  marker(R, "holeEdgeA", g, -1.9, 0.4, 0); marker(R, "holeEdgeB", g, 1.9, -0.3, 0);
  R.anim.push(t => {
    rings.forEach((m, i) => { m.rotation.z = t * (1.6 - i * 0.3); });
    debris.forEach(q => {
      // (29 Oct, "vorrhal's planets ... flying at mach 12"): the angle was t times a speed that changes with k, so the
      // spin grew with the page's age (~250 turns a second after ten minutes). Now a steady 0.6 rad/s plus the speed-up
      // as each piece falls in, added up over its fall (k * k * 6.7 turns it ~0.6 + 2.4k rad/s, as meant)
      const k = ((t * 0.18 + q.ph) % 1), r = q.r0 * (1 - k * 0.65), a = q.a + t * 0.6 + k * k * 6.7;
      q.d.position.set(cos(a) * r, sin(a) * r, 0);
      q.d.rotation.set(t * 2, t * 3, 0);
      q.d.scale.setScalar(1 - k * 0.8);
    });
  });
};
A.clockRings = (R) => {
  const g = pivot(R.root, 0, 2.3, 0);
  const rs = [[1.9, 0xd8a84a, [0.35, 0, 0.15]], [1.6, 0x4fe6ff, [-0.4, 0, -0.3]], [1.3, 0xfff2c8, [1.2, 0, 0.2]]].map(([r, c, rot], k) => {
    const p = pivot(g); p.rotation.set(...rot);
    const m = mesh(p, ring(r, 0.05, 6, 72), c, 0, 0, 0, { glow: 1 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; box(m, i % 3 ? 0.06 : 0.12, 0.22, 0.06, c, cos(a) * r, sin(a) * r, 0, { glow: 1, ink: false, rz: a + PI / 2 }); }
    return m;
  });
  // the clock face behind his head
  const face = pivot(R.torso, 0, 1.65, -0.85);
  mesh(face, cyl(1.0, 1.0, 0.05, 48), 0x0e1430, 0, 0, 0, { rx: PI / 2, inkGeo: cyl(1.05, 1.05, 0.04, 48) });
  mesh(face, ring(1.0, 0.05, 6, 48), 0xd8a84a, 0, 0, 0.03, { glow: 1 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; box(face, 0.06, 0.16, 0.04, 0xfff2c8, cos(a) * 0.84, sin(a) * 0.84, 0.05, { glow: 1, ink: false, rz: a + PI / 2 }); }
  const hh = pivot(face, 0, 0, 0.06), mh = pivot(face, 0, 0, 0.08);
  box(hh, 0.08, 0.5, 0.03, 0xd8a84a, 0, 0.25, 0, { glow: 1, ink: false });
  box(mh, 0.05, 0.75, 0.03, 0x4fe6ff, 0, 0.37, 0, { glow: 1, ink: false });
  // an hourglass on its own orbit
  const hg = pivot(R.root, 1.6, 2.8, 0.4);
  mesh(hg, cone(0.22, 0.34, 6), 0xbff2ff, 0, 0.17, 0, { glow: 2, own: 1, rx: PI });
  mesh(hg, cone(0.22, 0.34, 6), 0xbff2ff, 0, -0.17, 0, { glow: 2, own: 1 });
  box(hg, 0.5, 0.05, 0.5, 0xd8a84a, 0, 0.36, 0); box(hg, 0.5, 0.05, 0.5, 0xd8a84a, 0, -0.36, 0);
  marker(R, "hourglass", hg); marker(R, "clock", face);
  R.anim.push(t => {
    rs.forEach((m, i) => { m.rotation.z = t * (0.4 + i * 0.25) * (i % 2 ? -1 : 1); });
    mh.rotation.z = -t * 1.2; hh.rotation.z = -t * 0.1;
    const a = t * 0.7; hg.position.set(cos(a) * 1.8, 2.6 + sin(t * 1.4) * 0.2, sin(a) * 1.0);
    hg.rotation.z = Math.floor(t / 3) * PI + K.smooth(0, 0.3, (t % 3) / 3) * PI;
  });
};
K.POSES.show = (R, t) => {
  R.armR.rotation.set(-1.7 + sin(t * 1.2) * 0.05, 0.2, -0.25);
  R.armL.rotation.set(0.25, 0, -0.06);
  R.head.rotation.y += -0.2;
};

const SK = [0xf5d6c0, 0xf1c9a8, 0xe8b896, 0xd9a47c, 0xc68a62, 0x9a6a48, 0x6e4a32];

// ================= COMMON =================
U("gary", "Gary, Office Temp", "common", 0.8, {
  look: { skin: SK[2], hairC: 0x5e4430, hair: "short", top: 0xa9c4e0, pants: 0xb9a27a, boot: 0x4a3220, belt: 0x3b2a1c,
    face: { style: "bored", eye: 0x3a2a1e, brow: 0, mouthW: 0.2 } },
  acc: [["glasses"], ["tie", { c: 0x8a3a3a }], ["lanyard"], ["cup"]],
  pose: { pose: "sip", headY: 0.1, turn: -0.12 }, fx: [{ k: "steam" }],
});
U("dale", "Dale, Mall Cop", "common", 0.7, {
  look: { skin: SK[3], hairC: 0x2a2018, hair: "short", top: 0x2c3e66, pants: 0x1a1c22, boot: 0x111111, belt: 0x111111,
    face: { style: "narrow", eye: 0x2a2a2a, brow: -0.05, mustache: 0x2a2018 } },
  acc: [["cap", { c: 0x2c3e66, c2: 0x1a2440, badge: 0xe8b54a }], ["nametag", { c: 0xe8b54a }], ["flashlight", { rot: [2.8, 0, 0] }]],
  pose: { pose: "rock", headY: 0.2 }, fx: [{ k: "beam" }],
});
U("brenda", "Brenda, Cashier", "common", 0.9, {
  look: { skin: SK[4], hairC: 0x3a1e12, hair: "bun", fringe: "straight", top: 0x2f8a5a, pants: 0x22252c, boot: 0x1a1a1a,
    face: { style: "bored", eye: 0x3a2a1e, brow: 0.05 } },
  acc: [["visorCap", { c: 0x2f8a5a }], ["nametag"], ["scanner", { rot: [0.9, 0, 0] }]],
  pose: { pose: "tap", headY: 0.15 }, fx: [{ k: "flash", at: "scan", c: 0xff2a2a, r: 18 }],
});
U("kevin", "Kevin, Intern", "common", 0.5, {
  look: { skin: SK[0], hairC: 0x8a5a2a, hair: "messy", fringe: "side", top: 0xf4f4f0, pants: 0x2a3550, boot: 0x3a2a1c,
    face: { eye: 0x5a8ac8, brow: 0.25, mouth: "frown", blush: true } },
  acc: [["lanyard", { c: 0xd84a3a }], ["papers", { rot: [0.85, 0, 0], at: [-0.3, 0, 0] }]],
  pose: { pose: "nervous" }, fx: [{ k: "drop", at: "head", rate: 0.8 }],
});
U("todd", "Todd, Gym Regular", "common", 0.6, {
  look: { skin: SK[3], hairC: 0x1a1410, hair: "short", top: 0x8a8f99, sleeve: SK[3], pants: 0x2a2d35, boot: 0xf2f2f2,
    face: { style: "narrow", eye: 0x3a2a1e, brow: -0.1, mouth: "smile" } },
  acc: [["headband", { c: 0xd84a3a, tails: false }]],
  pose: { pose: "stretch" }, fx: [{ k: "drop", at: "head", rate: 0.5 }],
});
U("linda", "Linda, Crossing Guard", "common", 1.0, {
  look: { skin: SK[2], hairC: 0xa8a8b0, hair: "bob", fringe: "straight", top: 0x3a3f4a, pants: 0x2a2d35, boot: 0x111111,
    face: { eye: 0x5a7a4a, brow: -0.05, mouth: "smile" } },
  acc: [["vest", { c: 0xd6ff3a }], ["stopSign", { rot: [2.75, 0, 0] }]],
  pose: { pose: "wave", headY: 0.2 }, fx: [],
});
U("pemberton", "Mr. Pemberton, Substitute", "common", 1.1, {
  look: { skin: SK[1], hairC: 0x8a7a6a, hair: "balding", top: 0x7a5a3a, chest: 0xe8e2d0, pants: 0x4a4a52, boot: 0x3a2a1c,
    face: { style: "narrow", eye: 0x4a4a4a, brow: -0.05, mustache: 0x8a7a6a } },
  acc: [["glasses"], ["watch"], ["mug", { c: 0x5a7a9a }]],
  pose: { pose: "watch" }, fx: [{ k: "steam" }],
});
U("stan", "Stan, Parking Attendant", "common", 1.2, {
  look: { skin: SK[5], hairC: 0x1a1410, hair: "none", top: 0x3a4a5a, pants: 0x2a2d35, boot: 0x111111,
    face: { style: "bored", eye: 0x2a1a10, brow: 0, mouth: "open" } },
  acc: [["beanie", { c: 0x4a4a52, c2: 0x5a5a62 }], ["vest", { c: 0xff7a1a }]],
  pose: { pose: "yawn" }, fx: [],
});

// ================= RARE =================
U("pip", "Pip, Rooftop Courier", "rare", 1.6, {
  look: { skin: SK[1], hairC: 0xd86a2a, hair: "messy", top: 0xf28a2a, pants: 0x2a3a5a, boot: 0xeaeaea,
    face: { eye: 0x3a8a5a, mouth: "grin", blush: true } },
  acc: [["cap", { c: 0x2a3a5a, back: true }], ["bag", { c: 0x6a4a2a }]],
  pose: { pose: "jog" }, fx: [{ k: "dust" }],
});
U("moss", "Moss Archer", "rare", 2.2, {
  look: { skin: SK[2], hairC: 0x3a2a1a, hair: "short", top: 0x3f6a3a, pants: 0x3a3020, boot: 0x2a1d10, belt: 0x2a1d10,
    face: { style: "narrow", eye: 0x6ac04a } },
  acc: [["hood", { c: 0x2f5a2f, c2: 0x7a9a4a }], ["cape", { c: 0x2f5a2f, n: 2, w: 1.1 }], ["bow", { hand: "L", rot: [-PI / 2, 0, 0] }]],
  pose: { pose: "archer" }, fx: [{ k: "fall", kind: "leaf", rate: 3 }],
});
U("brick", "Brick Guard", "rare", 2.6, {
  look: { skin: SK[4], hairC: 0x2a1a10, hair: "none", top: 0x6a6f78, pants: 0x4a4f58, boot: 0x2a2a2e,
    face: { eye: 0x3a2a1e, blush: true, brow: 0.1 } },
  acc: [["helmet", { c: 0x8a9098, trim: 0x6a6f78 }], ["shield", { planted: true, c: 0x7a5a3a, trim: 0xb8bec8, emblem: 0xd4a42a, w: 1.4, h: 1.7 }]],
  pose: { pose: "peek" }, scale: 0.95, fx: [],
});
U("papermonk", "Paper Monk", "rare", 3.0, {
  look: { skin: SK[1], hair: "none", robe: 0xf0ece0, robeTrim: 0xc0282a, top: 0xf0ece0,
    face: { style: "closed", mouth: "smile", brow: 0.1, browC: 0x3a2a1a } },
  acc: [["charms", { n: 6 }], ["sash", { c: 0xc0282a }]],
  pose: { pose: "hold", float: true }, fx: [{ k: "motes", c: 0xfff2d0, rate: 6 }],
});
U("static", "Static Kid", "rare", 2.0, {
  look: { skin: SK[3], hairC: 0xffe23a, hairC2: 0xfff6a0, hair: "spiky", top: 0x1a1a22, pants: 0x2a2a35, boot: 0xff3a6a,
    face: { eye: 0x4fe6ff, mouth: "smile" } },
  acc: [["headphones", { c: 0x2a2a30, c2: 0x3a3a44, glow: 0x4fe6ff }]],
  marks: [["spkA", "head", -0.7, 1.6, 0], ["spkB", "head", 0.7, 1.5, -0.2]],
  pose: { pose: "nod" }, fx: [{ k: "arc", a: "spkA", b: "spkB", c: 0x4fe6ff, jag: 14 }, { k: "sparks", a: "spkA", b: "spkB", c: 0xfff6a0, rate: 8 }],
});
U("copper", "Copper Brawler", "rare", 2.4, {
  look: { skin: SK[5], hairC: 0x1a1410, hairC2: 0xc87a3a, hair: "mohawk", top: 0xd84a3a, sleeve: SK[5], pants: 0x2a2d35, boot: 0x111111,
    face: { style: "narrow", eye: 0x3a2a1e, brow: -0.35, mouth: "grin" } },
  acc: [["tapedFists"], ["headband", { c: 0xd84a3a }]],
  pose: { pose: "bounce" }, fx: [{ k: "drop", at: "head", rate: 0.6 }],
});
U("tide", "Tide Apprentice", "rare", 3.2, {
  look: { skin: SK[1], hairC: 0x2ac8c8, hair: "bob", top: 0x2a6ab8, pants: 0x1a3a6a, boot: 0x1a2a4a, cuff: 0x8ff0ff,
    face: { eye: 0x2ac8ff, blush: true, mouth: "smile" } },
  acc: [["waterOrb"], ["sash", { c: 0x8ff0ff }]],
  pose: { pose: "juggle" }, fx: [{ k: "bubbles", at: "water" }],
});
U("gale", "Gale Runner", "rare", 2.8, {
  look: { skin: SK[2], hairC: 0xd8e8f0, hair: "spiky", top: 0x3a8a8a, pants: 0x2a3a3a, boot: 0xeaeaea,
    face: { eye: 0x8affd2, mouth: "grin" } },
  acc: [["goggles", { lens: 0x8affd2 }], ["scarf", { c: 0xe8f6ff, c2: 0x8affd2 }]],
  pose: { pose: "stand", headY: 0.25, turn: -0.2 }, fx: [{ k: "wind" }],
});
U("lantern", "Lantern Kid", "rare", 3.6, {
  look: { skin: SK[0], hairC: 0x3a2a1a, hair: "bob", top: 0xffd23a, pants: 0x2a3a5a, boot: 0xffd23a,
    face: { eye: 0x3a2a1a, blush: true, mouth: "smile" } },
  acc: [["hood", { c: 0xffd23a, c2: 0xe8b020 }], ["lanternPole", { rot: [0.55, 0, 0] }]],
  pose: { pose: "staff" },
  fx: [{ k: "glow", at: "lantern", c: 0xffc04a, r: 60 }, { k: "motes", c: 0xd8ff6a, rate: 4, area: [0.1, 0.9, 0.2, 0.8], up: 8 }],
});
U("rook", "Rook Patrol", "rare", 4.0, {
  look: { skin: SK[1], hairC: 0x5a3a22, hair: "short", top: 0x8a9098, pants: 0x4a4f58, boot: 0x3a3a40,
    face: { eye: 0x3a5a8a, brow: -0.15 } },
  acc: [["helmet", { c: 0xb8bec8, trim: 0x2a4a9a, plume: 0x2a4a9a }], ["tabard", { c: 0x2a4a9a, emblem: 0xe8b54a }],
    ["spear", { rot: [1.06, 0, 0], ribbon: 0x2a4a9a }]],
  pose: { pose: "guard" }, scale: 0.92, fx: [],
});

// ================= EPIC =================
U("vex", "Vex, Card Duelist", "epic", 9, {
  look: { skin: SK[0], hairC: 0x6a2aa8, hairC2: 0x9a5ad8, hair: "short", fringe: "side", top: 0x1a1a22, chest: 0xb8b0c8,
    pants: 0x1a1a22, boot: 0x2a2a30, belt: 0x6a2aa8, face: { style: "narrow", eye: 0xc47bff, brow: -0.1, mouth: "smile" } },
  acc: [["coat", { c: 0x2a1a3a, lapel: 0x6a2aa8 }], ["cards", { rot: [1.7, 0, 0] }]],
  pose: { pose: "show" }, fx: [{ k: "stars", c: 0xd8b0ff, rate: 3 }, { k: "motes", at: "cards", c: 0xc47bff, rate: 8, spread: 12, up: 20 }],
});
U("saffron", "Saffron Monk", "epic", 12, {
  look: { skin: SK[4], hairC: 0x1a1410, hair: "none", robe: 0xff9a2a, robeTrim: 0xc0282a, top: 0xff9a2a,
    face: { style: "closed", mouth: "smile", brow: 0.1, browC: 0x1a1410 } },
  acc: [["beads", { n: 12, c: 0x8a3a1a }], ["sash", { c: 0xc0282a }]],
  build: R => box(R.head, 0.32, 0.36, 0.32, 0x1a1410, 0, 1.3, -0.1),
  pose: { pose: "hold", float: true }, fx: [{ k: "motes", c: 0xffc23a, rate: 10 }, { k: "glow", at: "center", c: 0xffa23a, r: 90 }],
});
U("hex", "Hex Tinker", "epic", 11, {
  look: { skin: SK[3], hairC: 0xd84a2a, hair: "messy", top: 0x3a4a5a, pants: 0x2a3a4a, boot: 0x3a2a1c, belt: 0x5a3a22,
    face: { eye: 0xffa23a, mouth: "grin" } },
  acc: [["goggles", { lens: 0xffa23a }], ["apron", { c: 0x6a4a2a }], ["wrench", { rot: [1.2, 0, 0] }], ["drone", { glow: 0x4fe6ff }]],
  pose: { pose: "tinker" }, fx: [{ k: "flash", key: "hit", at: "handR", c: 0xffd27a, r: 22, sparks: true }],
});
U("cinder", "Cinder Ronin", "epic", 15, {
  look: { skin: SK[2], hairC: 0x1a1410, hair: "pony", fringe: "straight", hairTie: 0xc0282a, top: 0x5a1a1a, pants: 0x2a2a2a,
    boot: 0x1a1a1a, belt: 0xc9a24a, face: { style: "narrow", eye: 0xff6a2a, brow: -0.3, scar: true } },
  acc: [["conicalHat", { c: 0xc8a46a, band: 0x5a1a1a }], ["coat", { c: 0x3a1a1a, lapel: 0x5a1a1a }], ["sheath", { c: 0x1a1a22, grip: 0x6a1a1a }]],
  pose: { pose: "iai" }, fx: [{ k: "embers", at: "hilt", spread: 14, rate: 10 }, { k: "smoke", at: "hilt", rate: 4 }],
});
U("frost", "Frost Warden", "epic", 14, {
  look: { skin: SK[0], hairC: 0xbfe8ff, hair: "long", fringe: "side", top: 0x2a4a6a, pants: 0x2a3a4a, boot: 0xe6f2ff,
    face: { style: "narrow", eye: 0x8ff0ff } },
  acc: [["cape", { c: 0x3a5a7a, c2: 0xe6f2ff, fur: 0xf2f6fa }], ["spear", { rot: [1.06, 0, 0], head: 0x9ff2ff, glowHead: true, shaft: 0x6a8aa8 }]],
  pose: { pose: "guard" }, fx: [{ k: "fall", kind: "snow", rate: 12 }, { k: "glow", at: "tip", c: 0x9ff2ff, r: 40 }, { k: "steam", at: "face" }],
});
U("nova", "Nova Gunner", "epic", 18, {
  look: { skin: SK[3], hairC: 0x1a1a22, hair: "short", top: 0xe6e8ee, pants: 0x3a3f4a, boot: 0xe6e8ee, chest: 0xff5a2a,
    face: { style: "visor", eye: 0x4fe6ff } },
  acc: [["jetpack", { c: 0x9aa0a8, c2: 0xe6e8ee }], ["blaster", { rot: [1.5, 0, 0] }], ["blaster", { hand: "L", rot: [1.5, 0, 0] }],
    ["pauldron", { c: 0xe6e8ee, c2: 0xff5a2a, side: 1 }], ["pauldron", { c: 0xe6e8ee, c2: 0xff5a2a, side: -1 }]],
  pose: { pose: "aim", float: true }, fx: [{ k: "jet", at: ["jetL", "jetR"] }, { k: "glow", at: "muzzle", c: 0x4fe6ff, r: 20 }],
});
U("thorn", "Thorn Witch", "epic", 16, {
  look: { skin: 0xe8c8b0, hairC: 0x2f6a3a, hairC2: 0x4f9a4a, hair: "long", fringe: "straight", top: 0x2a1a2a, robe: 0x2a1a2a,
    robeTrim: 0x4f9a4a, face: { eye: 0xff6f9a, mouth: "smile" } },
  acc: [["wideHat", { c: 0x2a1a2a, band: 0x4f9a4a, rose: 0xd42a5a }], ["staff", { rot: [0.55, 0, 0], vine: true, flower: 0xff6f9a, orb: 0xffd0e0 }]],
  pose: { pose: "staff" }, fx: [{ k: "fall", kind: "petal", rate: 5 }, { k: "glow", at: "orb", c: 0xff6f9a, r: 36 }],
});
U("sable", "Sable Ninja", "epic", 13, {
  look: { skin: SK[2], hairC: 0x1a1a22, hair: "short", fringe: "spiky", top: 0x1a1a22, pants: 0x1a1a22, boot: 0x111111, belt: 0x5a1a2a,
    face: { style: "narrow", eye: 0xff3a5a, brow: -0.3, mouth: "none" } },
  acc: [["maskLower", { c: 0x1a1a22 }], ["scarf", { c: 0x5a1a2a, c2: 0x7a2a3a }], ["kunai", { rot: [1.39, 0, 0] }]],
  pose: { pose: "guard" }, fx: [{ k: "smoke", area: [0.2, 0.8, 0.75, 0.95], rate: 5, up: 10 }],
});
U("lotus", "Iron Lotus", "epic", 20, {
  look: { skin: SK[1], hairC: 0x1a1410, hair: "bun", hairC2: 0x1a1410, top: 0xe8f2ea, pants: 0x2a3a2a, boot: 0x1a1a1a, belt: 0x2f8a5a,
    face: { style: "narrow", eye: 0x2fd88a } },
  acc: [["gauntlets", { c: 0x2f8a5a, glow: 0x9cffd0 }], ["sash", { c: 0x2f8a5a }]],
  pose: { pose: "kata" }, fx: [{ k: "motes", c: 0x9cffd0, rate: 10 }, { k: "glow", at: "handR", c: 0x2fd88a, r: 30 }, { k: "glow", at: "handL", c: 0x2fd88a, r: 30 }],
});

// ================= LEGENDARY =================
U("kaida", "Kaida, Storm Blade", "legendary", 68, {
  look: { skin: SK[1], hairC: 0x1d2a44, hairC2: 0x2f4a7a, hair: "pony", top: 0x1b2233, pants: 0x141925, boot: 0x0c0e14,
    bootTrim: 0xe8b54a, belt: 0xe8b54a, collar: 0x8a1f2b, glove: 0x0c0e14, cuff: 0xe8b54a, face: { eye: 0x39e2ff, blush: true } },
  acc: [["pauldron", { c: 0xe8b54a, c2: 0xc9d3e0, side: 1 }], ["sash", { c: 0xe8b54a }],
    ["cape", { c: 0x24376a, c2: 0x8a1f2b, trim: 0xe8b54a }], ["greatsword", { rot: [0.62, 0, -0.32], glow: 0x7fe9ff }]],
  pose: { pose: "shoulder", headY: 0.22, turn: -0.18 },
  fx: [{ k: "sparks", a: "base", b: "tip", c: 0x78e6ff }, { k: "arc", a: "base", b: "tip", c: 0x3caaff }],
  rim: [0x6fd8ff, 0xffb21e],
});
U("orrin", "Orrin the Unbroken", "legendary", 95, {
  look: { skin: SK[3], hair: "none", top: 0x6a6f78, pants: 0x4a4f58, boot: 0x3a3a40, glove: 0x6a6f78, face: {} },
  acc: [["helmet", { c: 0x8a9098, closed: true, slit: 0xff7a2a, trim: 0xc9a24a, plume: 0xa82a2a, plume2: 0xc83a3a }],
    ["armor", { c: 0x8a9098, trim: 0xc9a24a, emblem: 0xa82a2a }], ["cape", { c: 0xa82a2a, c2: 0x5a1a1a }],
    ["hammer", { big: true, rot: [-2.79, 0, -0.25], shift: 0.8, glow: 0xff7a2a }]],
  pose: { pose: "lean", headY: 0.15 }, scale: 1.12,
  fx: [{ k: "embers", at: "hammer", spread: 20, rate: 8 }, { k: "glow", at: "hammer", c: 0xff7a2a, r: 40 }],
});
U("lumen", "Lumen Saint", "legendary", 110, {
  look: { skin: SK[0], hairC: 0xfff2c8, hairC2: 0xffe6a0, hair: "long", fringe: "side", top: 0xf6f2ea, pants: 0xe8e2d0,
    boot: 0xe8b54a, glove: 0xe8b54a, face: { eye: 0xffd23a } },
  acc: [["armor", { c: 0xf6f2ea, trim: 0xe8b54a, emblem: 0xffd23a, glowEmblem: true }], ["halo", { c: 0xfff2b0 }],
    ["cape", { c: 0xf6f2ea, c2: 0xe8b54a }], ["spear", { rot: [1.06, 0, 0], head: 0xfff6c8, glowHead: true, shaft: 0xe8b54a }]],
  pose: { pose: "guard" }, fx: [{ k: "rays", at: "halo", c: 0xffe6a0, n: 12, len: 120 }, { k: "motes", c: 0xfff2b0, rate: 10 }],
});
U("rasp", "Rasp, Rust King", "legendary", 80, {
  look: { skin: SK[4], hairC: 0x6a3a1a, hair: "messy", top: 0x5a4a3a, pants: 0x3a3020, boot: 0x2a2a2e, belt: 0x8a4a22,
    face: { style: "narrow", eye: 0xffa23a, mouth: "grin", scar: true } },
  acc: [["scrapCrown"], ["mechArm"], ["fur", { c: 0x6a5a4a }]],
  pose: { pose: "stand", turn: 0.2, headY: -0.1 },
  fx: [{ k: "sparks", a: "mech", b: "handR", c: 0xffc23a, rate: 10 }, { k: "smoke", at: "mech", rate: 3 }, { k: "glow", at: "mech", c: 0xffa23a, r: 34 }],
});
U("yuzu", "Yuzu, Sky Pirate", "legendary", 72, {
  look: { skin: SK[1], hairC: 0x2ac8b0, hair: "bob", top: 0xf2ece0, pants: 0x3a2a1a, boot: 0x5a3a22, belt: 0x5a3a22,
    face: { eye: 0xffb02e, mouth: "grin", blush: true } },
  acc: [["tricorn", { c: 0x3a1a2a, trim: 0xe8b54a, feather: 0xff5a3a }], ["coat", { c: 0x7a1a2a, lapel: 0xe8b54a }],
    ["flintlock", { rot: [1.45, 0, 0] }], ["parrot", { c: 0x3ac86a, c2: 0xe63a3a }]],
  pose: { pose: "aimOne", headY: -0.2 }, fx: [{ k: "stars", c: 0xffd76a, rate: 3 }, { k: "glow", at: "muzzle", c: 0xffb02e, r: 18 }],
});
U("corvid", "Corvid Shogun", "legendary", 120, {
  look: { skin: 0xe8c8b0, hairC: 0x0a0a0f, hair: "long", top: 0x16161c, pants: 0x101014, boot: 0x0a0a0f, glove: 0x16161c,
    face: { style: "narrow", eye: 0xff3030 } },
  acc: [["crowMask", { c: 0x1a1a22 }], ["armor", { c: 0x1e1e26, trim: 0x8a1a1a }], ["cape", { c: 0x0e0e12, c2: 0x3a0a0a }],
    ["katana", { rot: [1.39, 0, 0], len: 2.4, trim: 0x8a1a1a }]],
  pose: { pose: "guard" }, fx: [{ k: "fall", kind: "blackFeather", rate: 4 }, { k: "glow", at: "face", c: 0xff3030, r: 30 }],
});
U("mira", "Mira Starforge", "legendary", 88, {
  look: { skin: SK[5], hairC: 0xd8402a, hair: "bun", fringe: "side", top: 0x5a3a2a, sleeve: SK[5], pants: 0x3a2a20, boot: 0x2a1a10,
    glove: 0x3a2a20, face: { eye: 0xffa23a, mouth: "smile" } },
  acc: [["apron", { c: 0x6a4a2a }], ["goggles", { lens: 0xffa23a }], ["hammer", { rot: [1.2, 0, 0], c: 0x6a6f78, glow: 0xffa23a }]],
  pose: { pose: "forge" },
  fx: [{ k: "embers", rate: 12 }, { k: "flash", key: "hit", at: "hammer", c: 0xffd27a, r: 34, sparks: true }, { k: "glow", at: "hammer", c: 0xffa23a, r: 30 }],
});
U("choir", "Grave Choir", "legendary", 105, {
  look: { skin: 0xb8c8d0, hair: "none", robe: 0x1a1a2a, robeTrim: 0x8affd2, top: 0x1a1a2a, glove: 0xb8c8d0,
    face: { style: "glow", eye: 0x8affd2, brow: null, mouth: "none" } },
  acc: [["hood", { c: 0x1a1a2a, c2: 0x8affd2 }], ["ghostLanterns", { n: 4, c: 0x8affd2 }]],
  pose: { pose: "conduct", float: true },
  fx: [{ k: "motes", c: 0x8affd2, rate: 10, up: 20 }, { k: "glow", at: "lan0", c: 0x8affd2, r: 26 }, { k: "glow", at: "lan2", c: 0x8affd2, r: 26 }],
});

// ================= MYTHIC =================
U("azhar", "Azhar, Sunless Emperor", "mythic", 540, {
  look: { skin: 0xd9a47c, hairC: 0xf1ede6, hairC2: 0xd3ccd9, hair: "swept", fringe: "none", top: 0x17131d, robe: 0x17131d,
    robeTrim: 0xe8b54a, robeIn: 0x5b1f88, sleeve: 0x2a2036, glove: 0xd9a47c, cuff: 0xe8b54a,
    face: { style: "narrow", eye: 0xffd23a, ew: 0.24, eh: 0.2, brow: 0.32, browY: 0.66, mouthW: 0.12 } },
  acc: [["mantle", { c: 0x2a2036, trim: 0xe8b54a }], ["collarTall", { c: 0xe8b54a, c2: 0x5b1f88 }], ["crown"], ["eclipse"],
    ["orbitOrbs"], ["orb", { ring: 0xc47bff }]],
  pose: { pose: "emperor", float: true, headX: -0.06, headY: -0.12, turn: 0.1 },
  fx: [{ k: "glow", at: "eclipse", r: 120, stops: [[0, "rgba(255,226,140,.95)"], [0.35, "rgba(255,170,80,.45)"], [0.7, "rgba(170,80,255,.25)"], [1, "rgba(120,40,200,0)"]] },
    { k: "motes", c: "rainbow", rate: 22, area: [0.28, 0.72, 0.78, 0.92] }, { k: "stars", c: "rainbow", rate: 3 }],
  rim: [0xff4fd8, 0x4fe6ff],
});
U("conductor", "The Pale Conductor", "mythic", 620, {
  look: { skin: 0xeae6ee, hairC: 0xf2f2f6, hair: "short", fringe: "side", top: 0x101016, chest: 0xf2f2f6, pants: 0x101016,
    boot: 0x0a0a0a, glove: 0xf2f2f6, face: { style: "narrow", eye: 0xc8b0ff, brow: -0.1, mouth: "smile" } },
  acc: [["coat", { c: 0x101016, lapel: 0x2a2a3a }], ["tie", { c: 0xd42a5a, collar: 0xf2f2f6 }], ["baton", { rot: [2.6, 0, 0] }],
    ["notesRing", { c: 0xf2f2f6 }]],
  pose: { pose: "conduct", float: true },
  fx: [{ k: "notes", c: "rainbow", rate: 3 }, { k: "glow", at: "baton", c: 0xc8b0ff, r: 30 }, { k: "motes", c: "rainbow", rate: 12 }],
  rim: [0xc8b0ff, 0xff4fd8],
});
U("velka", "Velka Dawnbreaker", "mythic", 700, {
  look: { skin: SK[1], hairC: 0xffe08a, hairC2: 0xfff2c8, hair: "long", fringe: "side", top: 0xe8e2d6, pants: 0x8a9098,
    boot: 0xe8b54a, glove: 0xe8b54a, face: { eye: 0x4fa8ff, brow: -0.15 } },
  acc: [["armor", { c: 0xf2f2f6, trim: 0xe8b54a }], ["crown", { c: 0xe8b54a, gem: 0x4fa8ff }],
    ["wings", { kind: "feather", c: 0xfff6e8, c2: 0xffe08a, n: 6, span: 1.1 }],
    ["spear", { rot: [1.06, 0, 0], head: 0xfff6c8, glowHead: true, shaft: 0xe8b54a }]],
  pose: { pose: "guard", float: true },
  fx: [{ k: "rays", at: "center", c: 0xfff2c8, n: 14, len: 150 }, { k: "fall", kind: "feather", rate: 4 }, { k: "motes", c: "rainbow", rate: 10 }],
  rim: [0xffe08a, 0x4fa8ff],
});
U("ouroboros", "Ouroboros Monk", "mythic", 480, {
  look: { skin: SK[3], hair: "none", robe: 0x2a3a2a, robeTrim: 0x8ad86a, top: 0x2a3a2a, face: { style: "closed", brow: 0.1, browC: 0x1a1410 } },
  acc: [["serpent", { c: 0x3fae5a, c2: 0x2a7a3a, eye: 0xffd23a }], ["mantle", { c: 0x1a2a1a, trim: 0x8ad86a }]],
  pose: { pose: "hold", float: true },
  fx: [{ k: "glyphs", c: 0x8ad86a, rate: 2 }, { k: "motes", c: "rainbow", rate: 10 }, { k: "glow", at: "center", c: 0x3fae5a, r: 100 }],
  rim: [0x8ad86a, 0xff4fd8],
});
U("kestrel", "Kestrel Zero", "mythic", 760, {
  look: { skin: 0xe6e8ee, hair: "none", top: 0xf2f2f6, sleeve: 0x2a2a30, pants: 0x2a2a30, boot: 0xf2f2f6, glove: 0xf2f2f6,
    face: { style: "visor", eye: 0xff3a6a } },
  acc: [["headphones", { c: 0xf2f2f6, c2: 0xd8dae0, glow: 0xff3a6a }],
    ["wings", { kind: "light", c: 0x4fe6ff, c2: 0xff4fd8, n: 5, span: 1.2, flap: 2.2 }],
    ["pauldron", { c: 0xf2f2f6, c2: 0x4fe6ff, side: 1 }], ["pauldron", { c: 0xf2f2f6, c2: 0x4fe6ff, side: -1 }]],
  pose: { pose: "float", float: true }, fx: [{ k: "hexbits", c: 0x4fe6ff }, { k: "ring", at: "feet", c: 0xff4fd8, every: 1.2, back: true }],
  rim: [0x4fe6ff, 0xff4fd8],
});
U("vermilion", "Lady Vermilion", "mythic", 800, {
  look: { skin: 0xf5e6dc, hairC: 0x0a0a10, hair: "long", fringe: "straight", top: 0xb8102a, robe: 0xb8102a, robeTrim: 0xffc23a,
    robeIn: 0x2a0a10, sleeve: 0xb8102a, face: { style: "narrow", eye: 0xff3a3a, mouth: "smile" } },
  acc: [["parasol", { rot: [1.0, 0, 0.3], c: 0xc0182a, trim: 0xffc23a }], ["sash", { c: 0xffc23a }]],
  pose: { pose: "parasol", float: true },
  fx: [{ k: "fall", kind: "petal", c: 0xff3a4a, rate: 8 }, { k: "glow", at: "center", c: 0xff2a4a, r: 100 }, { k: "motes", c: "rainbow", rate: 8 }],
  rim: [0xff3a3a, 0xffc23a],
});

// ================= SECRET =================
U("unwritten", "The Unwritten", "secret", 4200, {
  look: { skin: 0xf4f1e8, hair: "none", robe: 0xf4f1e8, robeTrim: 0x1a1a1a, top: 0xf4f1e8, sleeve: 0xf4f1e8, glove: 0xf4f1e8,
    face: { style: "none", brow: null, mouth: "none" } },
  acc: [["hood", { c: 0xf4f1e8, c2: 0x1a1a1a }], ["pages", { n: 9 }], ["inkLines"]],
  pose: { pose: "float", float: true }, fx: [{ k: "ink", rate: 5 }, { k: "glitch", amount: 1 }, { k: "glyphs", c: 0xffffff, rate: 3 }],
  rim: [0xffffff, 0xff2a4a],
});
U("nullsaint", "Null Saint", "secret", 5600, {
  look: { skin: 0x1a1a20, hairC: 0xf6f6f6, hair: "long", fringe: "straight", robe: 0x0a0a0d, robeTrim: 0xffffff, top: 0x0a0a0d,
    sleeve: 0x0a0a0d, glove: 0x1a1a20, face: { style: "glow", eye: 0xffffff, brow: null, mouth: "none" } },
  acc: [["darkHalo"], ["mantle", { c: 0xf6f6f6, trim: 0x0a0a0d }]],
  pose: { pose: "float", float: true },
  fx: [{ k: "pillar", c: 0xffffff, w: 50, a: 0.25 }, { k: "glitch", amount: 1.4 }, { k: "motes", c: 0xffffff, rate: 12 }],
  rim: [0xffffff, 0xff2a4a],
});
U("aster", "Aster, End of Stars", "secret", 7400, {
  look: { skin: 0xdde6ff, hairC: 0x1a1a40, hairC2: 0x3a3a8a, hair: "long", fringe: "side", top: 0x0e1030, robe: 0x0e1030,
    robeTrim: 0xbfe0ff, sleeve: 0x0e1030, face: { eye: 0xffffff } },
  acc: [["cape", { c: 0x0e1030, c2: 0x1a1a50, stars: true }], ["planets"], ["halo", { c: 0xbfe0ff, r: 0.6 }]],
  pose: { pose: "float", float: true },
  fx: [{ k: "glow", at: "center", r: 130, stops: [[0, "rgba(120,140,255,.6)"], [0.5, "rgba(190,90,255,.3)"], [1, "rgba(40,20,120,0)"]] },
    { k: "stars", c: "rainbow", rate: 6 }, { k: "glitch", amount: 0.6 }],
  rim: [0xbfe0ff, 0xc48aff],
});
U("omen", "Omen", "secret", 9000, {
  look: { skin: 0x0a0a0f, hair: "none", robe: 0x0a0a0f, robeTrim: 0x3a0a14, top: 0x0a0a0f, sleeve: 0x0a0a0f, glove: 0x0a0a0f,
    face: { style: "none", brow: null, mouth: "none" } },
  acc: [["hood", { c: 0x0a0a0f, c2: 0x3a0a14 }], ["maskFull", { c: 0xf2f0ea, drip: 0xc01030 }], ["shards", { n: 8 }]],
  pose: { pose: "float", float: true },
  fx: [{ k: "smoke", area: [0.15, 0.85, 0.5, 0.95], rate: 8, c: 0x050508, a: 0.5 }, { k: "glitch", amount: 2 }, { k: "glow", at: "face", c: 0xc01030, r: 50 }],
  rim: [0xffffff, 0xc01030],
});

// ================= DIVINE =================
U("seraphine", "Seraphine, the Last Light", "divine", 85000, {
  look: { skin: 0xfff0e6, hairC: 0xfffaf0, hairC2: 0xffe9b0, hair: "long", fringe: "side", robe: 0xfffaf2, robeTrim: 0xffd76a,
    robeIn: 0xbfe8ff, top: 0xfffaf2, sleeve: 0xfffaf2, glove: 0xffd76a, cuff: 0xffd76a, face: { style: "glow", eye: 0xfff2b0, brow: null } },
  acc: [["wings", { kind: "light", c: 0xfff2b0, c2: 0x9fe8ff, n: 6, pairs: 3, span: 1.25, flap: 1.2 }], ["haloTriple"],
    ["crown", { c: 0xffd76a, gem: 0x9fe8ff }], ["mantle", { c: 0xfffaf2, trim: 0xffd76a }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "pillar", c: 0xfff6d8, w: 80, a: 0.4 }, { k: "rays", at: "halo", c: 0xffe6a0, n: 18, len: 220, spin: 0.15, a: 0.4 },
    { k: "glow", at: "center", r: 150, stops: [[0, "rgba(255,255,255,.9)"], [0.3, "rgba(255,230,160,.5)"], [0.7, "rgba(160,230,255,.2)"], [1, "rgba(160,230,255,0)"]] },
    { k: "fall", kind: "feather", rate: 7 }, { k: "motes", c: "rainbow", rate: 30 }, { k: "shock", c: 0xfff2b0, every: 2.6, r: 170 },
    { k: "flare", at: "halo", s: 46 }, { k: "stars", c: "rainbow", rate: 8 }, { k: "ring", at: "feet", c: "rainbow", every: 0.8, r: 100 }],
  rim: [0xfff2b0, 0x9fe8ff],
});
U("vorrhal", "Vorrhal, Maw of Worlds", "divine", 110000, {
  look: { skin: 0x2a1a3a, hairC: 0x0a0a12, hairC2: 0x2a0a3a, hair: "long", top: 0x0e0a16, pants: 0x0e0a16, boot: 0x0a0a12, glove: 0x1a0a2a,
    cuff: 0xb84dff, belt: 0xb84dff, face: { style: "glow", eye: 0xff3bc8, brow: -0.3, browC: 0x0a0a12, mouth: "grin" } },
  acc: [["horns", { c: 0x1a1020, tip: 0xb84dff }], ["armor", { c: 0x1a1226, trim: 0xb84dff, emblem: 0xff3bc8, glowEmblem: true }],
    ["cape", { c: 0x0a0612, c2: 0x3a0a5a, stars: true }], ["blackHole"]],
  pose: { pose: "divine", float: true, headX: -0.08 },
  fx: [{ k: "glow", at: "hole", r: 170, stops: [[0, "rgba(0,0,0,0)"], [0.3, "rgba(255,140,60,.55)"], [0.5, "rgba(255,59,200,.4)"], [0.8, "rgba(110,40,255,.2)"], [1, "rgba(60,0,120,0)"]] },
    { k: "swirl", at: "hole", rate: 60, hue: 290, flat: 0.45 }, { k: "arc", a: "holeEdgeA", b: "handL", c: 0xb84dff, every: 0.5, core: 0xffd0ff },
    { k: "arc", a: "holeEdgeB", b: "handR", c: 0xff3bc8, every: 0.6, core: 0xffe0f0 }, { k: "motes", c: 0xc48aff, rate: 20 },
    { k: "shock", c: 0xff3bc8, every: 3.2, r: 180, at: "hole" }, { k: "stars", c: "rainbow", rate: 5 }, { k: "glitch", amount: 0.5 }],
  rim: [0xff3bc8, 0x7a3bff],
});
U("chronarch", "Chronarch, Keeper of Hours", "divine", 95000, {
  look: { skin: SK[1], hairC: 0xf2f2f2, hairC2: 0xdadada, hair: "long", fringe: "side", robe: 0xf2ece0, robeTrim: 0xd8a84a,
    robeIn: 0x2a3a6a, top: 0xf2ece0, sleeve: 0x2a3a6a, glove: 0xd8a84a, cuff: 0xd8a84a,
    face: { style: "narrow", eye: 0x4fe6ff, mustache: 0xf2f2f2, brow: 0.1, browC: 0xf2f2f2 } },
  acc: [["monocle"], ["clockRings"], ["mantle", { c: 0x2a3a6a, trim: 0xd8a84a }]],
  build: R => { const b = pivot(R.head, 0, 0.2, 0.56); box(b, 0.7, 0.5, 0.12, 0xf2f2f2, 0, -0.1, 0); box(b, 0.4, 0.4, 0.1, 0xf2f2f2, 0, -0.45, 0); },
  pose: { pose: "divine", float: true },
  fx: [{ k: "afterimage", n: 3, every: 0.1, off: 7 }, { k: "glow", at: "clock", r: 140, stops: [[0, "rgba(255,240,190,.7)"], [0.5, "rgba(80,220,255,.3)"], [1, "rgba(80,220,255,0)"]] },
    { k: "fall", kind: "sand", rate: 30, speed: 1.4, size: 0.8 }, { k: "glyphs", set: ["XII", "III", "VI", "IX", "I", "V", "X"], c: 0xffe6a0, rate: 3, size: 13 },
    { k: "ring", at: "center", c: 0x4fe6ff, every: 1.0, r: 120, flat: 1 }, { k: "rays", at: "clock", c: 0xd8a84a, n: 12, len: 180, spin: -0.1, a: 0.3 },
    { k: "motes", c: "rainbow", rate: 16 }, { k: "flare", at: "hourglass", c: 0xbff2ff, s: 30 }],
  rim: [0x4fe6ff, 0xffd76a],
});

// =====================================================================================================
// 29 Oct roster expansion (request: "add more units for everything. like 5-10 each. 3 for the 0.01%")
// =====================================================================================================
const hand = K.hand, upright = K.upright, chain = K.chain;
function orbit(R, n, rad, y, make, sp, tilt) {
  const g = pivot(R.root, 0, y, 0);
  if (tilt) { g.rotation.x = tilt[0]; g.rotation.z = tilt[1]; }
  const items = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2, p = pivot(g, cos(a) * rad, 0, sin(a) * rad); make(p, i); items.push(p); }
  R.anim.push(t => { g.rotation.y = t * sp; items.forEach((p, i) => { p.position.y = sin(t * 2 + i * 2.1) * 0.1; }); });
  return { g, items };
}
// everyday props
A.parcel = (R, L, o) => {
  const s = pivot(R.handR, -0.38, 0, 0.36);
  box(s, 0.9, 0.62, 0.62, o.c || 0xb8864f, 0, 0, 0);
  box(s, 0.92, 0.1, 0.64, 0xd8c09a, 0, 0.12, 0, { ink: false });
  box(s, 0.1, 0.64, 0.64, 0xd8c09a, 0, 0, 0, { ink: false });
  upright(R, s, R.armR);
};
A.ladle = (R, L, o) => { const s = hand(R, o); box(s, 0.08, 1.1, 0.08, 0xb8bec8, 0, 0.45, 0); mesh(s, ball(0.18, 1), 0xb8bec8, 0, 1.05, 0.08); };
A.laptop = (R, L, o) => {
  const s = pivot(R.handR, -0.38, 0.05, 0.38);
  box(s, 0.9, 0.06, 0.62, 0x2a2c33, 0, 0, 0);
  const lid = pivot(s, 0, 0.03, -0.3); lid.rotation.x = -1.2;
  box(lid, 0.9, 0.62, 0.05, 0x2a2c33, 0, 0.31, 0);
  box(lid, 0.78, 0.5, 0.02, o.glow || 0x7fc8ff, 0, 0.31, 0.03, { glow: 1, ink: false });
  upright(R, s, R.armR);
};
A.dog = (R, L, o) => {
  const d = pivot(R.root, 0.95, 0, 0.55), c = o.c || 0xc89a5a, c2 = o.c2 || 0x8a5a2a;
  d.rotation.y = -0.6;
  box(d, 0.4, 0.34, 0.7, c, 0, 0.42, 0);
  const head = pivot(d, 0, 0.62, 0.38);
  box(head, 0.38, 0.36, 0.36, c, 0, 0, 0);
  box(head, 0.2, 0.14, 0.2, c2, 0, -0.06, 0.24);
  for (const s of [-1, 1]) {
    box(head, 0.12, 0.22, 0.06, c2, s * 0.16, 0.14, -0.05, { rz: s * 0.4 });
    box(head, 0.06, 0.06, 0.02, 0x111111, s * 0.1, 0.06, 0.19, { ink: false });
  }
  for (const [x, z] of [[-0.13, 0.25], [0.13, 0.25], [-0.13, -0.25], [0.13, -0.25]]) box(d, 0.1, 0.28, 0.1, c, x, 0.14, z);
  const tail = pivot(d, 0, 0.55, -0.36);
  box(tail, 0.08, 0.3, 0.08, c, 0, 0.14, 0, { rx: -0.6 });
  R.anim.push(t => { tail.rotation.z = sin(t * 14) * 0.6; head.rotation.y = sin(t * 1.3) * 0.3; d.position.y = Math.abs(sin(t * 3)) * 0.04; });
};
A.mop = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.08, 2.4, 0.08, 0x8a6a3a, 0, 0.3, 0);
  const h = box(s, 0.5, 0.3, 0.3, 0xe6e2d0, 0, -0.95, 0);
  for (let i = 0; i < 5; i++) box(h, 0.08, 0.3, 0.08, 0xe6e2d0, -0.2 + i * 0.1, -0.25, 0, { ink: 0.02 });
};
A.kite = (R, L, o) => {
  const top = pivot(R.root, -1.4, 4.4, -0.6), k = pivot(top);
  box(k, 0.7, 0.7, 0.04, o.c || 0xff4a6a, 0, 0, 0, { rz: 0.785 });
  box(k, 0.04, 0.95, 0.05, 0x2a1d10, 0, 0, 0.03, { ink: false });
  box(k, 0.7, 0.04, 0.05, 0x2a1d10, 0, 0, 0.03, { ink: false });
  chain(R, k, 0, -0.5, 0, 4, 0.28, (s, i) => box(s, 0.12, 0.12, 0.03, i % 2 ? (o.c2 || 0xffd23a) : 0x3ac8ff, 0, -0.14, 0, { ink: false, rz: 0.785 }),
    { b0: 0.3, b: 0.2, amp: 0.3, sp: 3, zamp: 0.3 });
  R.anim.push(t => { top.position.x = -1.4 + sin(t * 0.9) * 0.3; top.position.y = 4.4 + sin(t * 1.3) * 0.2; k.rotation.z = sin(t * 1.1) * 0.25; });
  marker(R, "kite", k);
};
A.skateboard = (R, L, o) => {
  const s = pivot(R.root, 0, -0.05, 0.05); s.rotation.y = 0.3;
  box(s, 0.62, 0.06, 1.7, o.c || 0x2a2a30, 0, 0, 0);
  box(s, 0.64, 0.02, 1.72, o.c2 || 0xff5a2a, 0, 0.035, 0, { ink: false });
  for (const z of [-0.6, 0.6]) for (const x of [-0.26, 0.26]) mesh(s, cyl(0.08, 0.08, 0.08, 8), 0xeaeaea, x, -0.08, z, { rz: PI / 2 });
};
A.plant = (R, L, o) => {
  const s = pivot(R.handR, -0.36, 0, 0.36);
  mesh(s, cyl(0.26, 0.2, 0.36, 10), o.c || 0xb8603a, 0, 0, 0);
  for (let i = 0; i < 5; i++) { const p = pivot(s, 0, 0.18, 0); p.rotation.set(-0.5 + (i % 2) * 0.3, (i / 5) * PI * 2, 0); box(p, 0.16, 0.5, 0.04, 0x4f9a3a, 0, 0.25, 0, { ink: 0.015 }); }
  upright(R, s, R.armR);
};
A.smoker = (R, L, o) => {
  const s = pivot(R.handR, 0, 0, 0.3);
  mesh(s, cyl(0.16, 0.16, 0.42, 10), 0xb8bec8, 0, 0, 0);
  mesh(s, cone(0.16, 0.22, 10), 0x9aa0a8, 0, 0.32, 0);
  marker(R, "steam", s, 0, 0.45, 0);
  upright(R, s, R.armR);
};
A.lute = (R, L, o) => {
  const s = pivot(R.torso, 0.1, 0.45, 0.45); s.rotation.set(0, 0, -0.6);
  const b = mesh(s, ball(0.36, 1), o.c || 0xc8863a, 0, 0, 0, { inkScale: 1.1 }); b.scale.set(1, 1.2, 0.45);
  box(s, 0.12, 1.0, 0.08, 0x5a3a1a, 0, 0.75, 0);
  box(s, 0.2, 0.2, 0.1, 0x5a3a1a, 0, 1.28, 0, { rz: 0.3 });
  for (let i = 0; i < 3; i++) box(s, 0.015, 1.2, 0.01, 0xeae2c8, -0.04 + i * 0.04, 0.5, 0.17, { ink: false });
  marker(R, "lute", s, 0, 0.3, 0.2);
};
A.dragonling = (R, L, o) => {
  const p = pivot(R.torso, -0.95, 1.5, 0.1), c = o.c || 0xd84a2a, c2 = o.c2 || 0xffb02e;
  box(p, 0.34, 0.32, 0.46, c, 0, 0, 0);
  box(p, 0.28, 0.26, 0.32, c, 0, 0.24, 0.22);
  box(p, 0.16, 0.1, 0.16, c2, 0, 0.16, 0.42);
  for (const s of [-1, 1]) {
    box(p, 0.06, 0.06, 0.03, 0xffe23a, s * 0.08, 0.3, 0.38, { glow: 1, ink: false });
    box(p, 0.06, 0.18, 0.06, c2, s * 0.09, 0.44, 0.16, { rx: -0.4 });
  }
  const wl = pivot(p, -0.17, 0.1, 0), wr = pivot(p, 0.17, 0.1, 0);
  box(wl, 0.04, 0.34, 0.4, c2, -0.02, 0.1, 0, { rz: 0.4 }); box(wr, 0.04, 0.34, 0.4, c2, 0.02, 0.1, 0, { rz: -0.4 });
  chain(R, p, 0, -0.05, -0.24, 3, 0.2, (s, i) => box(s, 0.12 - i * 0.03, 0.22, 0.12 - i * 0.03, c, 0, -0.1, 0), { b0: 1.2, b: 0.2, amp: 0.25, sp: 3, zamp: 0.3 });
  R.anim.push(t => { const f = sin(t * 10) * 0.45; wl.rotation.z = -f; wr.rotation.z = f; p.position.y = 1.5 + sin(t * 2.4) * 0.12; });
  marker(R, "dragon", p, 0, 0.18, 0.5);
};
// big pieces for the top rarities
A.blades = (R, L, o) => {
  const n = o.n || 6, rad = o.r || 1.7, g = pivot(R.root, 0, o.y || 2.0, 0);
  g.rotation.x = o.tilt || 0.2;
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2, p = pivot(g, cos(a) * rad, 0, sin(a) * rad);
    p.rotation.set(0, -a, PI);
    box(p, 0.12, 0.3, 0.12, 0x2a1d10, 0, 0, 0);
    box(p, 0.4, 0.08, 0.14, o.trim || 0xe8b54a, 0, 0.18, 0, { ink: 0.02 });
    box(p, 0.14, 1.1, 0.04, o.c || 0xdff6ff, 0, 0.78, 0, { glow: o.glow ? 1 : 0 });
    items.push(p);
  }
  R.anim.push(t => { g.rotation.y = t * (o.sp || 0.6); items.forEach((p, i) => { p.position.y = sin(t * 2 + i) * 0.12; }); });
};
A.lotus = (R, L, o) => {
  const g = pivot(R.root, 0, o.y || 0.15, 0), n = o.n || 10;
  for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) {
    const p = pivot(g); p.rotation.y = (i / n) * PI * 2 + k * (PI / n);
    box(p, 0.42, 0.06, 0.9 - k * 0.25, k ? (o.c2 || 0xffd0f0) : (o.c || 0xff8ac8), 0, 0.05 + k * 0.08, 0.7 - k * 0.15, { glow: 2, rx: -0.35 - k * 0.3 });
  }
  mesh(g, ring(0.65, 0.05, 6, 40), o.ring || 0xfff2b0, 0, 0.08, 0, { glow: 1, rx: PI / 2 });
  R.anim.push(t => { g.rotation.y = t * 0.25; });
};
A.ribbons = (R, L, o) => {
  const cs = o.cols || [0x7dffcf, 0x4fb8ff, 0xa07bff, 0xff7ad9];
  cs.forEach((c, k) => {
    const x = (k - (cs.length - 1) / 2) * 0.32;
    chain(R, R.torso, x, 1.05, -0.4, o.n || 6, 0.42, (s, i) => box(s, 0.26 - i * 0.02, 0.44, 0.04, c, 0, -0.2, 0, { glow: 2 }),
      { b0: 0.5 + k * 0.05, b: 0.1, amp: 0.18, sp: 1.6 + k * 0.2, zamp: 0.16, rz0: (k - (cs.length - 1) / 2) * 0.25 });
  });
};
A.runeRing = (R, L, o) => {
  const rad = o.r || 1.75, g = pivot(R.root, 0, o.y || 1.6, 0);
  g.rotation.set(o.rx || 0.4, 0, o.rz || 0.2);
  mesh(g, ring(rad, 0.04, 6, 72), o.c || 0xc9a8ff, 0, 0, 0, { glow: 1, rx: PI / 2 });
  const runes = pivot(g), n = o.n || 12;
  for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; box(runes, 0.16, 0.26, 0.04, o.c2 || 0xffffff, cos(a) * rad, 0, sin(a) * rad, { glow: 1, ink: false, ry: -a }); }
  R.anim.push(t => { runes.rotation.y = -t * (o.sp || 0.5); });
};
A.crystals = (R, L, o) => orbit(R, o.n || 7, o.r || 1.6, o.y || 1.9, (p, i) => {
  const cs = o.cols || [o.c || 0x9feaff];
  const c = mesh(p, new T.OctahedronGeometry(0.2 + (i % 3) * 0.06), cs[i % cs.length], 0, 0, 0, { glow: o.solid ? 0 : 1, inkScale: 1.15 });
  R.anim.push(t => { c.rotation.set(t * (0.8 + i * 0.1), t * 0.6, 0); });
}, o.sp || 0.5, [0.25, -0.1]);
A.lavaCracks = (R, L, o) => {
  const c = o.c || 0xff6a1a, gl = { glow: 1, ink: false, own: 1 }, parts = [];
  [[0.18, 0.62, 0.3, 0.9], [-0.22, 0.4, 0.3, -0.6], [0.05, 0.25, 0.3, 0.3]].forEach(([x, y, z, r]) => parts.push(box(R.torso, 0.05, 0.42, 0.02, c, x, y, z, Object.assign({ rz: r }, gl))));
  for (const a of [R.armL, R.armR]) parts.push(box(a, 0.04, 0.4, 0.02, c, 0, -0.35, 0.23, Object.assign({ rz: 0.4 }, gl)));
  if (R.legL) for (const l of [R.legL, R.legR]) parts.push(box(l, 0.04, 0.36, 0.02, c, 0, -0.3, 0.24, Object.assign({ rz: -0.3 }, gl)));
  R.anim.push(t => { const k = 0.6 + 0.4 * sin(t * 3); parts.forEach(p => p.material.color.setRGB(1, 0.35 + 0.3 * k, 0.05)); });
};
A.tvHead = (R, L, o) => {
  const H = R.head;
  // (30 Oct) 1.2 deep, so the unit's own head (front at 0.543) is inside it, and the screen stands clear of both
  box(H, 1.3, 1.1, 1.2, o.c || 0x2a2a30, 0, 0.6, 0);
  R.screen = box(H, 1.02, 0.8, 0.04, o.glow || 0xbfe8ff, 0, 0.6, 0.64, { glow: 1, ink: false, own: 1 });
  for (const s of [-1, 1]) {
    box(H, 0.04, 0.6, 0.04, 0x9aa0a8, s * 0.25, 1.4, 0, { rz: s * -0.5, ink: false });
    box(H, 0.16, 0.2, 0.03, 0x10131a, s * 0.22, 0.66, 0.66, { ink: false });
  }
  box(H, 0.3, 0.05, 0.03, 0x10131a, 0, 0.42, 0.66, { ink: false });
  R.anim.push(() => { const k = Math.random() < 0.08 ? 0.4 : 1; R.screen.material.color.setRGB(0.75 * k, 0.9 * k, 1 * k); });
};
A.antlers = (R, L, o) => {
  const c = o.c || 0x8a6a3a;
  for (const s of [-1, 1]) {
    const b = pivot(R.head, s * 0.4, 1.15, -0.05); b.rotation.z = s * -0.35;
    box(b, 0.12, 0.8, 0.12, c, 0, 0.4, 0);
    for (const [y, r] of [[0.35, 0.9], [0.6, 0.7]]) { const t = pivot(b, 0, y, 0); t.rotation.z = s * -r; box(t, 0.08, 0.4, 0.08, c, 0, 0.2, 0); }
    if (o.leaf) box(b, 0.22, 0.12, 0.05, o.leaf, s * 0.1, 0.82, 0.04, { glow: 1, ink: false });
  }
};
A.sunDisc = (R, L, o) => {
  const rad = o.r || 1.05, e = pivot(R.torso, 0, o.y || 1.95, -0.95);
  mesh(e, cyl(rad, rad, 0.05, 48), o.disc || 0x040306, 0, 0, 0, { rx: PI / 2, glow: 1, inkGeo: cyl(rad + 0.05, rad + 0.05, 0.04, 48) });
  const rim = mesh(e, ring(rad + 0.03, 0.07, 10, 72), o.rim || 0xfff0b8, 0, 0, 0.02, { glow: 1, own: 1 });
  const cor = pivot(e), base = new T.Color(o.rim || 0xfff0b8);
  for (let i = 0; i < 16; i++) {
    const len = i % 2 ? 0.34 : 0.62, r = pivot(cor); r.rotation.z = (i / 16) * PI * 2;
    box(r, 0.07, len, 0.04, i % 2 ? (o.rayB || 0xc47bff) : (o.rayA || 0xffd76a), 0, rad + 0.25 + len / 2, 0, { glow: 1, ink: false });
  }
  marker(R, "sun", e);
  R.anim.push(t => { cor.rotation.z = t * 0.22; const p = 0.82 + 0.18 * sin(t * 3.2); rim.material.color.setRGB(base.r * p + 0.1, base.g * p + 0.05, base.b * p); });
};
A.vortex = (R, L, o) => {
  const g = pivot(R.root, 0, o.y || 2.6, -1.4);
  mesh(g, ball(0.85, 3), o.core || 0x000000, 0, 0, 0, { glow: 1 });
  const disk = pivot(g); disk.rotation.x = 1.2; disk.rotation.z = 0.25;
  const cs = o.cols || [0xffd27a, 0xff6a3a, 0xff3bc8, 0x7a3bff];
  const rings = cs.map((c, i) => { const m = mesh(disk, ring(1.25 + i * 0.25, 0.12 - i * 0.015, 6, 64), c, 0, 0, 0, { glow: 1 }); m.scale.z = 0.4; return m; });
  marker(R, "hole", g);
  R.anim.push(t => rings.forEach((m, i) => { m.rotation.z = t * (1.6 - i * 0.3); }));
};
A.halos = (R, L, o) => {
  const g = pivot(R.head, 0, 0.6, 0), cs = o.cols || [0xfff2b0, 0x9fe8ff, 0xffd0f0];
  const rings = cs.map((c, i) => {
    const p = pivot(g); p.rotation.set(...[[PI / 2 - 0.2, 0, 0], [0.4, 0, 0.6], [-0.5, 0.3, -0.5]][i % 3]);
    const r = 1.0 + i * 0.18, m = mesh(p, ring(r, 0.035, 6, 64), c, 0, 0, 0, { glow: 1 });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2; box(m, 0.1, 0.1, 0.1, 0xffffff, cos(a) * r, sin(a) * r, 0, { glow: 1, ink: false, rz: 0.785 }); }
    return m;
  });
  const top = pivot(R.head, 0, 1.75, 0);
  mesh(top, new T.OctahedronGeometry(0.2), o.gem || 0xffffff, 0, 0, 0, { glow: 1 });
  marker(R, "halo", top);
  R.anim.push(t => { rings.forEach((m, i) => { m.rotation.z = t * (0.6 + i * 0.35) * (i % 2 ? -1 : 1); }); top.rotation.y = t * 2; top.position.y = 1.75 + sin(t * 2.4) * 0.08; });
};

// ================= COMMON (new) =================
U("doug", "Doug, Delivery Driver", "common", 0.75, {
  look: { skin: SK[3], hairC: 0x3a2a1a, hair: "short", top: 0x8a5a2a, pants: 0x6a4a2a, boot: 0x2a1a10, belt: 0x2a1a10,
    face: { style: "bored", eye: 0x3a2a1e, brow: 0, mouth: "flat" } },
  acc: [["cap", { c: 0x8a5a2a, c2: 0x6a4a2a }], ["parcel"]], pose: { pose: "hold" }, fx: [],
});
U("bev", "Bev, Lunch Lady", "common", 0.95, {
  look: { skin: SK[1], hairC: 0xb85a3a, hair: "bob", fringe: "straight", top: 0xf2efe8, pants: 0x4a4f58, boot: 0xf2f2f2,
    face: { eye: 0x5a7a4a, brow: -0.05, mouth: "smile", blush: true } },
  acc: [["beanie", { c: 0xf6f6f2, c2: 0xe6e6e0 }], ["apron", { c: 0xf6f6f2 }], ["ladle", { rot: [1.2, 0, 0] }]],
  pose: { pose: "tinker" }, fx: [{ k: "steam", at: "handR" }],
});
U("phil", "Phil, IT Support", "common", 0.65, {
  look: { skin: SK[0], hairC: 0x4a3a2a, hair: "messy", top: 0x3a4a5a, pants: 0x2a2d35, boot: 0x2a2a30,
    face: { style: "bored", eye: 0x4a6a8a, brow: 0.1, mouth: "flat" } },
  acc: [["glasses"], ["lanyard"], ["laptop"]], pose: { pose: "hold", headX: 0.2 }, fx: [{ k: "glow", at: "chest", c: 0x7fc8ff, r: 40 }],
});
U("rita", "Rita, Dog Walker", "common", 1.05, {
  look: { skin: SK[4], hairC: 0x2a1a10, hair: "pony", fringe: "side", hairTie: 0xff6fa8, top: 0x4fa8d8, pants: 0x2a2d35, boot: 0xeaeaea,
    face: { eye: 0x3a2a1e, mouth: "smile", blush: true } },
  acc: [["dog", { c: 0xd8b07a, c2: 0x8a5a2a }]], pose: { pose: "pocket", headY: 0.3 }, fx: [{ k: "dust" }],
});
U("earl", "Earl, Night Janitor", "common", 0.85, {
  look: { skin: SK[5], hairC: 0xd8d8d8, hair: "balding", top: 0x3a5a7a, pants: 0x3a5a7a, boot: 0x2a1a10,
    face: { style: "bored", eye: 0x2a1a10, brow: 0, mustache: 0xd8d8d8 } },
  acc: [["mop", { rot: [0.55, 0, 0] }]], pose: { pose: "staff" }, fx: [],
});
U("tess", "Tess, Barista", "common", 1.15, {
  look: { skin: SK[2], hairC: 0x5a2a1a, hair: "bun", fringe: "straight", top: 0x2a2a30, pants: 0x2a2d35, boot: 0x1a1a1a,
    face: { eye: 0x5a3a1a, mouth: "smile" } },
  acc: [["apron", { c: 0x6a4a2a }], ["mug", { c: 0xf2efe8 }]], pose: { pose: "watch" }, fx: [{ k: "steam" }],
});

// ================= RARE (new) =================
U("skye", "Skye, Kite Flyer", "rare", 1.7, {
  look: { skin: SK[1], hairC: 0xd8a03a, hair: "twin", hairTie: 0x3ac8ff, top: 0xff6a8a, pants: 0x2a3a5a, boot: 0xeaeaea,
    face: { eye: 0x3a8ac8, mouth: "grin", blush: true } },
  acc: [["kite", { c: 0xff4a6a }], ["scarf", { c: 0x3ac8ff, c2: 0xffd23a }]], pose: { pose: "wave" }, fx: [{ k: "wind" }],
});
U("ollie", "Ollie, Skater", "rare", 2.1, {
  look: { skin: SK[3], hairC: 0x1a1a22, hair: "messy", top: 0x2a8a5a, pants: 0x3a3f4a, boot: 0xff5a2a,
    face: { style: "narrow", eye: 0x3a2a1e, mouth: "grin" } },
  acc: [["cap", { c: 0xff5a2a, back: true }], ["skateboard"]], pose: { pose: "jog" }, fx: [{ k: "dust" }],
});
U("juniper", "Juniper, Herbalist", "rare", 2.5, {
  look: { skin: SK[0], hairC: 0x6a4a2a, hair: "long", fringe: "side", top: 0x6a8a4a, pants: 0x4a3a2a, boot: 0x3a2a1a,
    face: { eye: 0x4f9a3a, mouth: "smile", blush: true } },
  acc: [["plant"], ["bag", { c: 0x8a6a3a }]], pose: { pose: "hold" }, fx: [{ k: "fall", kind: "leaf", rate: 3 }],
});
U("ferro", "Ferro, Smith's Apprentice", "rare", 3.3, {
  look: { skin: SK[4], hairC: 0x2a1a10, hair: "short", top: 0x5a3a2a, sleeve: SK[4], pants: 0x3a2a20, boot: 0x2a1a10, glove: 0x3a2a20,
    face: { style: "narrow", eye: 0xffa23a, brow: -0.2 } },
  acc: [["apron", { c: 0x4a3a2a }], ["goggles", { lens: 0xffa23a }], ["hammer", { rot: [1.2, 0, 0], c: 0x6a6f78 }]],
  pose: { pose: "forge" }, fx: [{ k: "flash", key: "hit", at: "hammer", c: 0xffd27a, r: 26, sparks: true }],
});
U("dot", "Dot, Pixel Painter", "rare", 2.9, {
  look: { skin: SK[2], hairC: 0xff6fa8, hairC2: 0xffb0d0, hair: "bob", top: 0xf2efe8, pants: 0x3a5a9a, boot: 0xffd23a,
    face: { eye: 0x3a2a1e, mouth: "smile", blush: true } },
  acc: [["cap", { c: 0xd84a3a }], ["baton", { rot: [2.6, 0, 0] }]], pose: { pose: "conduct" },
  fx: [{ k: "motes", at: "baton", c: "rainbow", rate: 12, spread: 10, up: 14 }],
});
U("ozzie", "Ozzie, Beekeeper", "rare", 3.8, {
  look: { skin: SK[1], hairC: 0x8a6a3a, hair: "none", top: 0xf2efe8, pants: 0xf2efe8, boot: 0x2a2a2e, glove: 0xd8c09a,
    face: { eye: 0x3a2a1e, mouth: "smile" } },
  acc: [["hood", { c: 0xf6f2e0, c2: 0x2a2a2a }], ["smoker"]], pose: { pose: "pocket" },
  fx: [{ k: "steam" }, { k: "motes", c: 0xffd23a, rate: 6, area: [0.15, 0.85, 0.2, 0.7], up: 4, size: 1.8 }],
});

// ================= EPIC (new) =================
U("silva", "Silva, Glass Archer", "epic", 10, {
  look: { skin: SK[0], hairC: 0xd8eef8, hair: "long", fringe: "side", top: 0x2a4a6a, pants: 0x1a2a3a, boot: 0xd8eef8,
    face: { style: "narrow", eye: 0x7fe3ff } },
  acc: [["cape", { c: 0x9fd8f0, c2: 0x2a4a6a, n: 2 }], ["bow", { hand: "L", rot: [-PI / 2, 0, 0], c: 0x9feaff }]],
  pose: { pose: "archer" }, fx: [{ k: "sparks", a: "handL", b: "handR", c: 0x9feaff, rate: 8 }],
});
U("marlo", "Marlo, Tide Brawler", "epic", 13, {
  look: { skin: SK[4], hairC: 0x1a3a5a, hair: "spiky", top: 0x1a6a9a, sleeve: SK[4], pants: 0x1a2a3a, boot: 0x0a1a2a,
    face: { style: "narrow", eye: 0x4fe6ff, brow: -0.3, mouth: "grin" } },
  acc: [["gauntlets", { c: 0x1a6a9a, glow: 0x8ff0ff }], ["headband", { c: 0x4fe6ff }]], pose: { pose: "bounce" },
  fx: [{ k: "bubbles", at: "handR" }, { k: "bubbles", at: "handL" }],
});
U("quill", "Quill, Ink Scribe", "epic", 11, {
  look: { skin: SK[1], hairC: 0x1a1a22, hair: "bob", fringe: "straight", robe: 0x2a2a3a, robeTrim: 0xc9a24a, top: 0x2a2a3a,
    face: { style: "narrow", eye: 0xc9a24a } },
  acc: [["book", { c: 0x3a1a4a }], ["baton", { rot: [2.6, 0, 0] }]], pose: { pose: "conduct", float: true },
  fx: [{ k: "glyphs", c: 0xc9a24a, rate: 3 }, { k: "ink", rate: 2 }],
});
U("kindle", "Kindle, Ember Monk", "epic", 15, {
  look: { skin: SK[3], hairC: 0x1a1410, hair: "none", robe: 0xc83a1a, robeTrim: 0xffb02e, top: 0xc83a1a,
    face: { style: "closed", mouth: "smile", brow: 0.1, browC: 0x1a1410 } },
  acc: [["beads", { n: 10, c: 0xffb02e }], ["orb", { c: 0xff6a1a, ring: 0xffd23a }]], pose: { pose: "emperor", float: true },
  fx: [{ k: "embers", rate: 16 }, { k: "glow", at: "orb", c: 0xff6a1a, r: 44 }],
});
U("dash", "Dash Voltage", "epic", 19, {
  look: { skin: SK[2], hairC: 0xffe23a, hair: "spiky", top: 0x1a1a22, pants: 0x1a1a22, boot: 0xffe23a,
    face: { style: "visor", eye: 0xffe23a } },
  acc: [["jetpack", { c: 0x2a2a30, c2: 0xffe23a }], ["scarf", { c: 0xffe23a, c2: 0xfff6a0 }]], pose: { pose: "float", float: true },
  fx: [{ k: "jet", at: ["jetL", "jetR"], c: 0xffe23a }, { k: "arc", a: "jetL", b: "handR", c: 0xffe23a, every: 0.8 }],
});
U("nightjar", "Nightjar, Owl Scout", "epic", 14, {
  look: { skin: SK[2], hairC: 0x5a4a3a, hair: "short", top: 0x4a3a2a, pants: 0x2a2018, boot: 0x1a1410, belt: 0x8a6a3a,
    face: { style: "narrow", eye: 0xffb02e } },
  acc: [["hood", { c: 0x5a4a3a, c2: 0xc8a46a }], ["parrot", { c: 0x8a6a4a, c2: 0xd8c09a }], ["dagger", { rot: [1.39, 0, 0] }]],
  pose: { pose: "guard" }, fx: [{ k: "fall", kind: "feather", c: 0xd8c09a, rate: 2 }],
});

// ================= LEGENDARY (new) =================
U("seren", "Seren, Moon Archer", "legendary", 82, {
  look: { skin: SK[0], hairC: 0xe6e8f6, hair: "long", fringe: "side", top: 0xd8dae6, pants: 0x8a8fa8, boot: 0xb8bec8,
    face: { eye: 0x9fb8ff } },
  acc: [["armor", { c: 0xe6e8f0, trim: 0x9fb8ff }], ["halo", { c: 0xd8e6ff, r: 0.5 }], ["bow", { hand: "L", rot: [-PI / 2, 0, 0], c: 0xd8e6ff }]],
  pose: { pose: "archer" }, fx: [{ k: "stars", c: 0xd8e6ff, rate: 4 }, { k: "glow", at: "halo", c: 0x9fb8ff, r: 50 }],
});
U("grund", "Grund, Mountain King", "legendary", 100, {
  look: { skin: SK[3], hairC: 0x8a8a8a, hair: "long", top: 0x6a6258, pants: 0x4a4238, boot: 0x3a3228, glove: 0x6a6258,
    face: { style: "narrow", eye: 0x7fe3ff, brow: -0.25, mustache: 0x8a8a8a } },
  acc: [["scrapCrown"], ["armor", { c: 0x7a7268, trim: 0x4fb8ff }], ["hammer", { big: true, rot: [-2.79, 0, -0.25], shift: 0.8, c: 0x5a5248, glow: 0x4fb8ff }]],
  pose: { pose: "lean" }, scale: 1.14, fx: [{ k: "dust", rate: 4 }, { k: "glow", at: "hammer", c: 0x4fb8ff, r: 40 }],
});
U("vespera", "Vespera, Night Duelist", "legendary", 112, {
  look: { skin: 0xe8d0c8, hairC: 0x2a1a3a, hairC2: 0x4a2a6a, hair: "pony", fringe: "side", top: 0x1a1022, pants: 0x100818, boot: 0x0a0610,
    face: { style: "narrow", eye: 0xc47bff } },
  acc: [["coat", { c: 0x1a1022, lapel: 0x6a2aa8 }], ["maskLower", { c: 0x2a1a3a }], ["sheath", { c: 0x1a1022, grip: 0x6a2aa8, trim: 0xc47bff }]],
  pose: { pose: "iai" }, fx: [{ k: "smoke", at: "hilt", rate: 4, c: 0x2a1a3a }, { k: "glow", at: "hilt", c: 0xc47bff, r: 30 }],
});
U("torvik", "Torvik, Dragon Tamer", "legendary", 90, {
  look: { skin: SK[4], hairC: 0xa83a1a, hair: "spiky", top: 0x3a2a1a, pants: 0x2a2018, boot: 0x1a1410, belt: 0xc9a24a,
    face: { style: "narrow", eye: 0xffb02e, mouth: "grin", scar: true } },
  acc: [["fur", { c: 0x6a4a2a }], ["dragonling", { c: 0xd84a2a, c2: 0xffb02e }], ["spear", { rot: [1.06, 0, 0], head: 0xffb02e }]],
  pose: { pose: "guard" }, fx: [{ k: "embers", at: "dragon", spread: 8, rate: 10 }],
});
U("liora", "Liora, Starlight Bard", "legendary", 76, {
  look: { skin: SK[1], hairC: 0xffc8e8, hairC2: 0xffe6f2, hair: "long", fringe: "side", top: 0x3a2a6a, pants: 0x2a1a4a, boot: 0xffc8e8,
    face: { eye: 0xff8ac8, mouth: "smile", blush: true } },
  acc: [["cape", { c: 0x3a2a6a, c2: 0xffc8e8, stars: true, n: 2 }], ["lute"]], pose: { pose: "hold" },
  fx: [{ k: "notes", c: "rainbow", rate: 3 }, { k: "stars", c: 0xffe6f2, rate: 3 }],
});
U("tessar", "Tessar, Clockwork Knight", "legendary", 118, {
  look: { skin: SK[2], hair: "none", top: 0x8a6a3a, pants: 0x6a4a2a, boot: 0x4a3220, glove: 0x8a6a3a, face: {} },
  acc: [["helmet", { c: 0xc89a4a, closed: true, slit: 0x4fe6ff, trim: 0x8a6a3a }], ["armor", { c: 0xc89a4a, trim: 0x6a4a2a, emblem: 0x4fe6ff, glowEmblem: true }],
    ["runeRing", { r: 0.9, y: 2.0, rx: 1.3, rz: 0, n: 8, c: 0xc89a4a, c2: 0x4fe6ff, sp: 1.2 }], ["sword", { rot: [1.39, 0, 0], c: 0xd8dee6, trim: 0xc89a4a }]],
  pose: { pose: "guard" }, fx: [{ k: "sparks", a: "base", b: "tip", c: 0xffd27a, rate: 6 }],
});

// ================= MYTHIC (new) =================
U("nocturne", "Nocturne, Veil of Night", "mythic", 560, {
  look: { skin: 0xe8dcf0, hairC: 0x1a1030, hairC2: 0x3a2060, hair: "long", fringe: "straight", robe: 0x140c24, robeTrim: 0xc47bff, robeIn: 0x2a1048, top: 0x140c24,
    face: { style: "narrow", eye: 0xc47bff } },
  acc: [["crown", { c: 0xc47bff, gem: 0xffffff }], ["orbitOrbs", { n: 4, ring: 0xc47bff }], ["mantle", { c: 0x1a1030, trim: 0xc47bff }]],
  pose: { pose: "float", float: true }, fx: [{ k: "stars", c: "rainbow", rate: 5 }, { k: "glow", at: "center", c: 0x6a2aa8, r: 110 }],
  rim: [0xc47bff, 0x4fe6ff],
});
U("solenne", "Solenne, Sun Herald", "mythic", 640, {
  look: { skin: SK[3], hairC: 0xffd76a, hairC2: 0xfff2c8, hair: "long", fringe: "side", top: 0xfff6e0, robe: 0xfff6e0, robeTrim: 0xffb02e, robeIn: 0xff6a1a,
    face: { eye: 0xffb02e } },
  acc: [["sunDisc", { disc: 0xffb02e, rim: 0xfff6c8, rayA: 0xffd76a, rayB: 0xff6a1a }], ["wings", { kind: "feather", c: 0xfff2c8, c2: 0xffd76a, n: 5 }]],
  pose: { pose: "divine", float: true }, fx: [{ k: "rays", at: "sun", c: 0xffd76a, n: 14, len: 160 }, { k: "motes", c: "rainbow", rate: 10 }],
  rim: [0xffd76a, 0xff6a1a],
});
U("kairo", "Kairo, Storm Sovereign", "mythic", 720, {
  look: { skin: SK[4], hairC: 0x2a3a6a, hairC2: 0x4f6ab8, hair: "spiky", top: 0x10162a, pants: 0x0a0e1a, boot: 0x0a0e1a, bootTrim: 0x4fe6ff, glove: 0x0a0e1a, cuff: 0x4fe6ff,
    face: { style: "narrow", eye: 0x4fe6ff, brow: -0.3 } },
  acc: [["cape", { c: 0x1a2a5a, c2: 0x4fe6ff, trim: 0x4fe6ff }], ["greatsword", { rot: [0.62, 0, -0.32], glow: 0x4fe6ff, trim: 0xb8c8e8 }]],
  pose: { pose: "shoulder", float: true, headY: 0.2 },
  fx: [{ k: "arc", a: "base", b: "tip", c: 0x4fe6ff, every: 0.5 }, { k: "arc", a: "handR", b: "head", c: 0x7fb8ff, every: 0.9 }, { k: "sparks", a: "base", b: "tip", c: 0xbff2ff }],
  rim: [0x4fe6ff, 0xff4fd8],
});
U("mirelle", "Mirelle, Tide Empress", "mythic", 600, {
  look: { skin: SK[0], hairC: 0x2ad8c8, hairC2: 0x8ff0ff, hair: "long", fringe: "side", top: 0x0a4a6a, robe: 0x0a4a6a, robeTrim: 0x8ff0ff, robeIn: 0x2ad8c8,
    face: { eye: 0x8ff0ff, mouth: "smile" } },
  acc: [["crown", { c: 0x8ff0ff, gem: 0x2ad8c8 }], ["waterOrb", { c: 0x4fc8ff }], ["mantle", { c: 0x0a3a5a, trim: 0x8ff0ff }]],
  pose: { pose: "juggle", float: true }, fx: [{ k: "bubbles", at: "water", rate: 10 }, { k: "glow", at: "center", c: 0x2ad8c8, r: 110 }],
  rim: [0x8ff0ff, 0xff4fd8],
});
U("pyrrhos", "Pyrrhos, Phoenix Knight", "mythic", 780, {
  look: { skin: SK[3], hairC: 0xff6a1a, hairC2: 0xffd23a, hair: "spiky", top: 0x8a1a0a, pants: 0x5a1008, boot: 0xffb02e, glove: 0xffb02e,
    face: { style: "narrow", eye: 0xffd23a, brow: -0.3 } },
  acc: [["armor", { c: 0xc83a1a, trim: 0xffd23a, emblem: 0xffd23a, glowEmblem: true }], ["wings", { kind: "feather", c: 0xff6a1a, c2: 0xffd23a, n: 6, span: 1.15 }],
    ["spear", { rot: [1.06, 0, 0], head: 0xffd23a, glowHead: true, shaft: 0xc83a1a }]],
  pose: { pose: "guard", float: true }, fx: [{ k: "embers", rate: 24 }, { k: "glow", at: "center", c: 0xff6a1a, r: 120 }],
  rim: [0xffb02e, 0xff3a1a],
});
U("sylvara", "Sylvara, Forest Matriarch", "mythic", 520, {
  look: { skin: 0xd8c0a0, hairC: 0x3a6a2a, hairC2: 0x6aa84a, hair: "long", fringe: "straight", top: 0x2a4a1a, robe: 0x2a4a1a, robeTrim: 0x8ad86a, robeIn: 0xffb0d0,
    face: { eye: 0x8ad86a, mouth: "smile" } },
  acc: [["antlers", { c: 0x8a6a3a, leaf: 0x8ad86a }], ["staff", { rot: [0.55, 0, 0], vine: true, flower: 0xffb0d0, orb: 0xfff0f6 }]],
  pose: { pose: "staff", float: true }, fx: [{ k: "fall", kind: "leaf", rate: 6 }, { k: "fall", kind: "petal", rate: 4 }, { k: "glow", at: "orb", c: 0x8ad86a, r: 50 }],
  rim: [0x8ad86a, 0xffb0d0],
});

// ================= SECRET (new) =================
U("channel", "Channel Zero", "secret", 3600, {
  look: { skin: 0x2a2a30, hair: "none", top: 0x1a1a22, pants: 0x1a1a22, boot: 0x0a0a0a, glove: 0x2a2a30,
    face: { style: "none", brow: null, mouth: "none" } },
  acc: [["tvHead", { glow: 0xbfe8ff }], ["coat", { c: 0x2a2a30, lapel: 0x4a4a52 }]], pose: { pose: "stand", headY: 0.15 },
  fx: [{ k: "glitch", amount: 2.2 }, { k: "glow", at: "face", c: 0xbfe8ff, r: 50 }, { k: "hexbits", c: 0xbfe8ff, rate: 6 }],
  rim: [0xffffff, 0x4fe6ff],
});
U("crownless", "The Crownless", "secret", 6100, {
  look: { skin: 0x0a0a0f, hair: "none", robe: 0x0a0a0f, robeTrim: 0xc9a24a, top: 0x0a0a0f, sleeve: 0x0a0a0f, glove: 0x0a0a0f,
    face: { style: "glow", eye: 0xc9a24a, brow: null, mouth: "none" } },
  acc: [["hood", { c: 0x0a0a0f, c2: 0xc9a24a }], ["shards", { n: 6, c: 0x1a1a22, edge: 0xc9a24a }]],
  build: R => {
    // the crown floats a hand's breadth above the empty hood
    const g = pivot(R.head, 0, 1.7, 0.05);
    box(g, 1.0, 0.12, 0.06, 0xc9a24a, 0, 0, 0.42, { ink: 0.02 });
    for (const x of [-0.36, 0, 0.36]) box(g, 0.16, 0.16, 0.06, 0xc9a24a, x, 0.12, 0.42, { rz: 0.785, ink: 0.02 });
    R.anim.push(t => { g.position.y = 1.7 + sin(t * 1.8) * 0.1; });
    K.marker(R, "crown", g, 0, 0.1, 0.42);
  },
  pose: { pose: "float", float: true }, fx: [{ k: "smoke", area: [0.2, 0.8, 0.5, 0.95], rate: 8, c: 0x050508, a: 0.5 }, { k: "glitch", amount: 1 }, { k: "flare", at: "crown", c: 0xffd76a, s: 22 }],
  rim: [0xffd76a, 0xff2a4a],
});
U("mirrorsaint", "Mirror Saint", "secret", 7900, {
  look: { skin: 0xe6e8ee, hairC: 0xf6f6f6, hair: "long", fringe: "straight", robe: 0xd8dae0, robeTrim: 0xffffff, top: 0xd8dae0, sleeve: 0xd8dae0,
    face: { style: "glow", eye: 0x9feaff, brow: null } },
  acc: [["halo", { c: 0xffffff, r: 0.6 }], ["crystals", { n: 8, cols: [0xffffff, 0xd8e6ff, 0xbfefff] }], ["mantle", { c: 0xffffff, trim: 0x9feaff }]],
  pose: { pose: "float", float: true }, fx: [{ k: "pillar", c: 0xffffff, w: 60, a: 0.3 }, { k: "glitch", amount: 0.8 }, { k: "stars", c: 0xffffff, rate: 5 }],
  rim: [0xffffff, 0x9feaff],
});
U("reverb", "Reverb", "secret", 5000, {
  look: { skin: 0x10131a, hairC: 0xff3bc8, hairC2: 0x4fe6ff, hair: "spiky", top: 0xf2f2f6, pants: 0x0a0a10, boot: 0xf2f2f6,
    face: { style: "glow", eye: 0xff3bc8, brow: null, mouth: "grin" } },
  acc: [["headphones", { c: 0xf2f2f6, c2: 0x10131a, glow: 0xff3bc8 }]], pose: { pose: "nod" },
  fx: [{ k: "afterimage", n: 3, every: 0.08, off: 6 }, { k: "ring", at: "head", c: 0xff3bc8, every: 0.6, r: 70, flat: 1 }, { k: "glitch", amount: 1 }],
  rim: [0xff3bc8, 0x4fe6ff],
});
U("foldedmoon", "Folded Moon", "secret", 9400, {
  look: { skin: 0xf4f1e8, hair: "none", robe: 0xf4f1e8, robeTrim: 0x9fb8ff, top: 0xf4f1e8, sleeve: 0xf4f1e8, glove: 0xf4f1e8,
    face: { style: "closed", brow: null, mouth: "none" } },
  acc: [["pages", { n: 10 }], ["sunDisc", { disc: 0xf4f1e8, rim: 0x9fb8ff, rayA: 0xffffff, rayB: 0x9fb8ff, r: 0.95 }]],
  pose: { pose: "hold", float: true }, fx: [{ k: "glyphs", c: 0x9fb8ff, rate: 3 }, { k: "glitch", amount: 0.7 }, { k: "glow", at: "sun", c: 0x9fb8ff, r: 90 }],
  rim: [0xffffff, 0x9fb8ff],
});

// ================= DIVINE (new) =================
U("solvane", "Solvane, Sun Unbound", "divine", 92000, {
  look: { skin: SK[3], hairC: 0xfff2c8, hairC2: 0xffd76a, hair: "swept", robe: 0xfff6e0, robeTrim: 0xffb02e, robeIn: 0xffd76a, top: 0xfff6e0, sleeve: 0xffd76a, glove: 0xffb02e,
    face: { style: "glow", eye: 0xffffff, brow: null } },
  acc: [["sunDisc", { disc: 0xfff6c8, rim: 0xffffff, rayA: 0xffd76a, rayB: 0xff6a1a, r: 1.25 }], ["blades", { n: 6, c: 0xfff2c8, glow: true, trim: 0xffb02e }],
    ["wings", { kind: "light", c: 0xffd76a, c2: 0xfff6c8, n: 6, pairs: 2 }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "pillar", c: 0xfff6d8, w: 80, a: 0.4 }, { k: "rays", at: "sun", c: 0xffd76a, n: 20, len: 230, a: 0.4 }, { k: "motes", c: "rainbow", rate: 26 },
    { k: "shock", c: 0xffd76a, every: 2.4, r: 170 }, { k: "flare", at: "sun", s: 50 }],
  rim: [0xffd76a, 0xffffff],
});
U("marisol", "Marisol, Abyssal Queen", "divine", 118000, {
  look: { skin: 0xc8e8f0, hairC: 0x0a3a5a, hairC2: 0x2ad8c8, hair: "long", fringe: "straight", robe: 0x062a3a, robeTrim: 0x2ad8c8, robeIn: 0x0a4a6a, top: 0x062a3a,
    face: { style: "glow", eye: 0x2ad8c8 } },
  acc: [["vortex", { cols: [0x8ff0ff, 0x2ad8c8, 0x1a6ab8, 0x0a2a6a] }], ["ribbons", { cols: [0x2ad8c8, 0x4fb8ff, 0x8ff0ff] }], ["crown", { c: 0x2ad8c8, gem: 0xffffff }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "swirl", at: "hole", rate: 60, hue: 185, flat: 0.45 }, { k: "bubbles", at: "center", rate: 14 }, { k: "glow", at: "hole", c: 0x2ad8c8, r: 160 },
    { k: "shock", c: 0x2ad8c8, every: 3, r: 170, at: "hole" }],
  rim: [0x2ad8c8, 0x4fb8ff],
});
U("hrimgard", "Hrimgard, Frost Titan", "divine", 104000, {
  look: { skin: 0xd8eef8, hairC: 0xffffff, hairC2: 0xbfe8ff, hair: "long", top: 0x6a9ab8, pants: 0x4a7a98, boot: 0xe6f2ff, glove: 0xbfe8ff,
    face: { style: "glow", eye: 0x9feaff, brow: -0.2, browC: 0xffffff, mustache: 0xffffff } },
  acc: [["scrapCrown"], ["armor", { c: 0xbfe8ff, trim: 0xffffff, emblem: 0x9feaff, glowEmblem: true }], ["crystals", { n: 9, r: 1.8, cols: [0x9feaff, 0xffffff, 0xbfe8ff] }],
    ["fur", { c: 0xffffff }]],
  pose: { pose: "cross" }, scale: 1.14,
  fx: [{ k: "fall", kind: "snow", rate: 40 }, { k: "glow", at: "center", c: 0x9feaff, r: 150 }, { k: "ring", at: "feet", c: 0x9feaff, every: 1.2, r: 110 },
    { k: "steam", at: "face" }, { k: "stars", c: 0xffffff, rate: 6 }],
  rim: [0x9feaff, 0xffffff],
});
U("anima", "Anima, World Tree", "divine", 86000, {
  look: { skin: 0xc8a878, hairC: 0x3a8a3a, hairC2: 0x8ad86a, hair: "long", fringe: "side", robe: 0x4a3a1a, robeTrim: 0x8ad86a, robeIn: 0xffd76a, top: 0x4a3a1a,
    face: { style: "closed", brow: 0.1, browC: 0x3a8a3a, mouth: "smile" } },
  acc: [["antlers", { c: 0x6a4a2a, leaf: 0x8ad86a }], ["lotus", { c: 0x8ad86a, c2: 0xffd76a, ring: 0xffd76a }], ["ribbons", { cols: [0x8ad86a, 0xffd76a, 0x4fc86a] }]],
  pose: { pose: "meditate", float: true },
  fx: [{ k: "fall", kind: "leaf", rate: 10 }, { k: "motes", c: 0xffd76a, rate: 22 }, { k: "glow", at: "center", c: 0x8ad86a, r: 160 }, { k: "rays", at: "head", c: 0xd8ffb0, n: 12, len: 200, a: 0.3 }],
  rim: [0x8ad86a, 0xffd76a],
});
U("requiem", "Requiem, Final Choir", "divine", 128000, {
  look: { skin: 0xb8c0d8, hair: "none", robe: 0x14122a, robeTrim: 0xc9a8ff, robeIn: 0x2a1a4a, top: 0x14122a, glove: 0xb8c0d8,
    face: { style: "glow", eye: 0xc9a8ff, brow: null, mouth: "open" } },
  acc: [["hood", { c: 0x14122a, c2: 0xc9a8ff }], ["ghostLanterns", { n: 6, c: 0xc9a8ff }], ["halos", { cols: [0xc9a8ff, 0x8affd2, 0xffd0f0] }]],
  pose: { pose: "conduct", float: true },
  fx: [{ k: "notes", c: "rainbow", rate: 5 }, { k: "glow", at: "center", c: 0x6a4ab8, r: 150 }, { k: "flare", at: "halo", c: 0xc9a8ff, s: 40 },
    { k: "motes", c: 0xc9a8ff, rate: 20 }, { k: "shock", c: 0xc9a8ff, every: 2.8, r: 160 }],
  rim: [0xc9a8ff, 0x8affd2],
});

// ================= TRANSCENDENT =================
U("lumina", "Lumina, Aurora Weaver", "transcendent", 520000, {
  look: { skin: 0xf2f0ff, hairC: 0x7dffcf, hairC2: 0xa07bff, hair: "long", fringe: "side", robe: 0x0a1c34, robeTrim: 0x7dffcf, robeIn: 0xa07bff, top: 0x0a1c34,
    face: { style: "glow", eye: 0x7dffcf } },
  acc: [["ribbons", { cols: [0x7dffcf, 0x4fb8ff, 0xa07bff, 0xff7ad9], n: 7 }], ["wings", { kind: "light", c: 0x7dffcf, c2: 0xa07bff, n: 6, pairs: 2 }], ["halo", { c: 0x7dffcf }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "motes", c: "rainbow", rate: 30 }, { k: "glow", at: "center", r: 170, stops: [[0, "rgba(125,255,207,.6)"], [0.5, "rgba(160,123,255,.3)"], [1, "rgba(80,40,160,0)"]] },
    { k: "ring", at: "feet", c: 0x7dffcf, every: 0.9, r: 110 }, { k: "stars", c: "rainbow", rate: 6 }, { k: "pillar", c: 0x7dffcf, w: 70, a: 0.3 }],
  rim: [0x7dffcf, 0xa07bff],
});
U("kaelith", "Kaelith, Starborn", "transcendent", 680000, {
  look: { skin: 0xdde6ff, hairC: 0x0e1030, hairC2: 0x3a3a8a, hair: "long", fringe: "straight", robe: 0x0a0c24, robeTrim: 0xbfe0ff, top: 0x0a0c24, sleeve: 0x0a0c24,
    face: { style: "glow", eye: 0xffffff } },
  acc: [["cape", { c: 0x0a0c24, c2: 0x1a1a50, stars: true, n: 4 }], ["planets"], ["halos", { cols: [0xbfe0ff, 0xc48aff, 0xffffff] }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "stars", c: "rainbow", rate: 12 }, { k: "glow", at: "center", r: 170, stops: [[0, "rgba(140,160,255,.6)"], [0.5, "rgba(190,90,255,.3)"], [1, "rgba(40,20,120,0)"]] },
    { k: "flare", at: "halo", s: 44 }, { k: "shock", c: 0xbfe0ff, every: 2.6, r: 170 }, { k: "swirl", at: "center", rate: 30, hue: 230, flat: 0.3 }],
  rim: [0xbfe0ff, 0xc48aff],
});
U("orrisa", "Orrisa, Prism Oracle", "transcendent", 760000, {
  look: { skin: 0xf6f0ff, hairC: 0xffffff, hairC2: 0xd8c8ff, hair: "bob", fringe: "straight", robe: 0xf6f0ff, robeTrim: 0xa07bff, robeIn: 0x7dffcf, top: 0xf6f0ff,
    face: { style: "closed", brow: null, mouth: "smile" } },
  acc: [["crystals", { n: 10, r: 1.8, cols: [0xff3b4e, 0xffe93a, 0x4dff7a, 0x2ee6ff, 0xb84dff] }], ["runeRing", { c: 0xa07bff, c2: 0x7dffcf, r: 1.4, y: 2.1 }]],
  pose: { pose: "hold", float: true },
  fx: [{ k: "motes", c: "rainbow", rate: 30 }, { k: "glitch", amount: 0.5 }, { k: "rays", at: "center", c: 0xffffff, n: 18, len: 200, a: 0.25, spin: 0.4 },
    { k: "glow", at: "center", c: 0xa07bff, r: 160 }, { k: "stars", c: "rainbow", rate: 8 }],
  rim: [0xa07bff, 0x7dffcf],
});
U("zephyrine", "Zephyrine, Sky Sovereign", "transcendent", 600000, {
  look: { skin: SK[0], hairC: 0xe8f6ff, hairC2: 0x9fd8ff, hair: "long", fringe: "side", top: 0xf2f6fa, pants: 0x9fb8d8, boot: 0xffffff, glove: 0xffffff,
    face: { eye: 0x4fb8ff } },
  acc: [["armor", { c: 0xffffff, trim: 0x9fd8ff }], ["wings", { kind: "feather", c: 0xffffff, c2: 0xd8eeff, n: 6, pairs: 2, span: 1.2 }], ["blades", { n: 5, c: 0xd8f6ff, glow: true, trim: 0x9fd8ff }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "wind", rate: 10 }, { k: "fall", kind: "feather", rate: 8 }, { k: "glow", at: "center", c: 0x9fd8ff, r: 150 }, { k: "motes", c: "rainbow", rate: 18 },
    { k: "ring", at: "feet", c: 0xffffff, every: 1, r: 120 }],
  rim: [0x9fd8ff, 0xffffff],
});
U("ordo", "Ordo, the Balanced", "transcendent", 900000, {
  look: { skin: 0xd8d8d8, hairC: 0xffffff, hairC2: 0x111111, hair: "long", fringe: "straight", robe: 0x111111, robeTrim: 0xffffff, robeIn: 0xffffff, top: 0xf2f2f2, sleeve: 0x111111,
    face: { style: "glow", eye: 0xffffff, brow: null } },
  acc: [["runeRing", { c: 0xffffff, c2: 0x111111, r: 1.8 }], ["runeRing", { c: 0x111111, c2: 0xffffff, r: 1.5, rx: -0.5, rz: -0.3, sp: -0.7 }], ["darkHalo"]],
  pose: { pose: "meditate", float: true },
  fx: [{ k: "afterimage", n: 2, every: 0.14, off: 8 }, { k: "pillar", c: 0xffffff, w: 60, a: 0.3 }, { k: "glitch", amount: 0.4 },
    { k: "shock", c: 0xffffff, every: 2.2, r: 160 }, { k: "motes", c: 0xffffff, rate: 16 }],
  rim: [0xffffff, 0x7dffcf],
});

// ================= PRIMORDIAL =================
U("magmor", "Magmor, First Flame", "primordial", 4200000, {
  look: { skin: 0x2a1008, hairC: 0xff6a1a, hairC2: 0xffd23a, hair: "spiky", top: 0x1a0804, pants: 0x1a0804, boot: 0x0a0402, glove: 0x2a1008,
    face: { style: "glow", eye: 0xffd23a, brow: -0.35, browC: 0xff6a1a, mouth: "grin" } },
  acc: [["horns", { c: 0x1a0804, tip: 0xff6a1a }], ["lavaCracks"], ["sunDisc", { disc: 0x1a0402, rim: 0xff6a1a, rayA: 0xffb02e, rayB: 0xff2a00, r: 1.3 }]],
  pose: { pose: "cross" }, scale: 1.1,
  fx: [{ k: "embers", rate: 40, up: 60 }, { k: "glow", at: "sun", r: 180, stops: [[0, "rgba(255,200,80,.8)"], [0.4, "rgba(255,80,20,.5)"], [1, "rgba(120,10,0,0)"]] },
    { k: "smoke", area: [0.1, 0.9, 0.6, 0.95], rate: 10, c: 0x1a0804, a: 0.5 }, { k: "shock", c: 0xff6a1a, every: 2, r: 180 }, { k: "rays", at: "sun", c: 0xff6a1a, n: 18, len: 220, a: 0.35 }],
  rim: [0xff6a1a, 0xffd23a],
});
U("pelagra", "Pelagra, First Ocean", "primordial", 5300000, {
  look: { skin: 0x0a2a3a, hairC: 0x0a4a6a, hairC2: 0x2ad8c8, hair: "long", fringe: "side", robe: 0x041820, robeTrim: 0x2ad8c8, robeIn: 0x0a6a8a, top: 0x041820,
    face: { style: "glow", eye: 0x8ff0ff } },
  acc: [["vortex", { core: 0x000814, cols: [0x8ff0ff, 0x2ad8c8, 0x1a6ab8, 0x0a2a6a] }], ["ribbons", { cols: [0x0a6a8a, 0x2ad8c8, 0x8ff0ff, 0x1a6ab8], n: 7 }],
    ["serpent", { c: 0x1a6ab8, c2: 0x2ad8c8, eye: 0xffffff }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "swirl", at: "hole", rate: 80, hue: 190, flat: 0.45 }, { k: "bubbles", at: "center", rate: 20 }, { k: "glow", at: "hole", c: 0x2ad8c8, r: 190 },
    { k: "shock", c: 0x8ff0ff, every: 2.4, r: 180, at: "hole" }, { k: "motes", c: 0x8ff0ff, rate: 24 }],
  rim: [0x2ad8c8, 0x8ff0ff],
});
U("gaiadon", "Gaiadon, First Stone", "primordial", 3600000, {
  look: { skin: 0x5a4a3a, hairC: 0x3a5a2a, hair: "messy", top: 0x4a3a2a, pants: 0x3a2a1a, boot: 0x2a1a10, glove: 0x6a5a4a,
    face: { style: "glow", eye: 0xffb02e, brow: -0.3, browC: 0x3a5a2a } },
  acc: [["armor", { c: 0x6a5a4a, trim: 0xffb02e, emblem: 0xffb02e, glowEmblem: true }], ["crystals", { n: 9, r: 2.0, cols: [0xffb02e, 0xc8863a, 0xffd27a], solid: true }],
    ["lavaCracks", { c: 0xffb02e }], ["antlers", { c: 0x5a4a3a, leaf: 0x8ad86a }]],
  pose: { pose: "lean" }, scale: 1.2,
  fx: [{ k: "dust", rate: 8 }, { k: "shock", c: 0xffb02e, every: 2.2, r: 190, at: "feet" }, { k: "glow", at: "center", c: 0xc8863a, r: 170 },
    { k: "fall", kind: "sand", rate: 24, c: 0xc8863a }, { k: "embers", rate: 14, c: 0xffd27a }],
  rim: [0xffb02e, 0x8ad86a],
});
U("umbrael", "Umbrael, First Night", "primordial", 6200000, {
  look: { skin: 0x0a0812, hairC: 0x1a1030, hairC2: 0x3a1a5a, hair: "long", fringe: "straight", robe: 0x05040a, robeTrim: 0x6a2aa8, robeIn: 0x1a0a2a, top: 0x05040a, sleeve: 0x05040a,
    face: { style: "glow", eye: 0xff3bc8, brow: null } },
  acc: [["darkHalo"], ["shards", { n: 10, c: 0x05040a, edge: 0xc47bff }], ["cape", { c: 0x05040a, c2: 0x1a0a2a, stars: true, n: 4 }]],
  pose: { pose: "float", float: true },
  fx: [{ k: "glitch", amount: 1.5 }, { k: "smoke", area: [0.1, 0.9, 0.3, 0.95], rate: 14, c: 0x05040a, a: 0.55 }, { k: "stars", c: 0xc47bff, rate: 10 },
    { k: "glow", at: "halo", c: 0x6a2aa8, r: 180 }, { k: "shock", c: 0xff3bc8, every: 2.6, r: 180 }],
  rim: [0xc47bff, 0xff3bc8],
});
U("vitae", "Vitae, First Life", "primordial", 7800000, {
  look: { skin: 0xfff0e0, hairC: 0x8ad86a, hairC2: 0xffd76a, hair: "long", fringe: "side", robe: 0xfffaf0, robeTrim: 0x8ad86a, robeIn: 0xffd76a, top: 0xfffaf0,
    face: { style: "closed", brow: null, mouth: "smile" } },
  acc: [["lotus", { c: 0xffd76a, c2: 0xfff6d8, ring: 0x8ad86a }], ["serpent", { c: 0xffd76a, c2: 0x8ad86a, eye: 0xffffff }], ["ribbons", { cols: [0x8ad86a, 0xffd76a, 0xff8ac8, 0x7dffcf] }]],
  pose: { pose: "meditate", float: true },
  fx: [{ k: "motes", c: "rainbow", rate: 36 }, { k: "fall", kind: "petal", c: 0xffd0e0, rate: 10 }, { k: "glow", at: "center", r: 190, stops: [[0, "rgba(255,255,220,.8)"], [0.5, "rgba(140,220,100,.35)"], [1, "rgba(60,120,40,0)"]] },
    { k: "rays", at: "head", c: 0xfff6d8, n: 16, len: 230, a: 0.35 }, { k: "ring", at: "feet", c: "rainbow", every: 0.9, r: 120 }],
  rim: [0xffd76a, 0x8ad86a],
});

// ================= ETERNAL (0.01%) =================
U("aeon", "Aeon, the Endless", "eternal", 62000000, {
  look: { skin: 0xfff6ec, hairC: 0xffffff, hairC2: 0xffe9b0, hair: "long", fringe: "side", robe: 0xffffff, robeTrim: 0xd8a84a, robeIn: 0x2a3a6a, top: 0xffffff, sleeve: 0x2a3a6a, glove: 0xd8a84a,
    face: { style: "glow", eye: 0x4fe6ff, brow: null } },
  acc: [["clockRings"], ["halos", { cols: [0xffffff, 0x4fe6ff, 0xffd76a] }], ["wings", { kind: "light", c: 0xffffff, c2: 0x4fe6ff, n: 6, pairs: 3, span: 1.3, flap: 1 }],
    ["blades", { n: 8, r: 2.2, c: 0xffffff, glow: true, trim: 0xd8a84a, sp: -0.4 }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "afterimage", n: 3, every: 0.1, off: 8 }, { k: "pillar", c: 0xffffff, w: 90, a: 0.45 }, { k: "rays", at: "clock", c: 0xffffff, n: 24, len: 260, spin: -0.15, a: 0.4 },
    { k: "motes", c: "rainbow", rate: 40 }, { k: "shock", c: "rainbow", every: 2, r: 200 }, { k: "flare", at: "halo", s: 56 }, { k: "stars", c: "rainbow", rate: 12 },
    { k: "fall", kind: "sand", rate: 30, speed: 1.4, size: 0.8 }],
  rim: [0xffffff, 0x4fe6ff],
});
U("omnis", "Omnis, All That Is", "eternal", 88000000, {
  look: { skin: 0x0a0a14, hairC: 0xffffff, hairC2: 0xff3bc8, hair: "long", fringe: "straight", robe: 0x030306, robeTrim: 0xffffff, robeIn: 0x2a0a4a, top: 0x030306, sleeve: 0x030306,
    face: { style: "glow", eye: 0xffffff, brow: null } },
  acc: [["vortex", { cols: [0xff3b4e, 0xffe93a, 0x4dff7a, 0x2ee6ff, 0xb84dff] }], ["planets"], ["ribbons", { cols: [0xff3b4e, 0xffe93a, 0x4dff7a, 0x2ee6ff, 0xb84dff], n: 7 }],
    ["runeRing", { c: 0xffffff, c2: 0xff3bc8, r: 1.9, y: 1.7 }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "swirl", at: "hole", rate: 100, hue: 0, flat: 0.45 }, { k: "glitch", amount: 0.8 }, { k: "shock", c: "rainbow", every: 1.8, r: 210, at: "hole" },
    { k: "glow", at: "hole", r: 210, stops: [[0, "rgba(0,0,0,0)"], [0.3, "rgba(255,255,255,.6)"], [0.55, "rgba(255,59,200,.35)"], [1, "rgba(60,0,120,0)"]] },
    { k: "stars", c: "rainbow", rate: 16 }, { k: "motes", c: "rainbow", rate: 36 }, { k: "arc", a: "hole", b: "handR", c: 0xffffff, every: 0.5, core: 0xffd0ff }],
  rim: [0xffffff, 0xff3bc8],
});
U("aurore", "Aurore, the Last Dawn", "eternal", 115000000, {
  look: { skin: 0xfff0e6, hairC: 0xffe9b0, hairC2: 0xffffff, hair: "swept", robe: 0xfffaf2, robeTrim: 0xffd76a, robeIn: 0xff8ac8, top: 0xfffaf2, sleeve: 0xfffaf2, glove: 0xffd76a,
    face: { style: "glow", eye: 0xffd76a, brow: null } },
  acc: [["sunDisc", { disc: 0xffffff, rim: 0xffd76a, rayA: 0xffffff, rayB: 0xff8ac8, r: 1.4 }], ["wings", { kind: "feather", c: 0xffffff, c2: 0xffd76a, n: 7, pairs: 3, span: 1.3, flap: 1.1 }],
    ["lotus", { c: 0xffd76a, c2: 0xffffff, ring: 0xff8ac8 }], ["crown", { c: 0xffd76a, gem: 0xff8ac8 }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "pillar", c: 0xfff6d8, w: 100, a: 0.5 }, { k: "rays", at: "sun", c: 0xffffff, n: 28, len: 280, spin: 0.2, a: 0.45 }, { k: "fall", kind: "feather", rate: 10 },
    { k: "motes", c: "rainbow", rate: 44 }, { k: "flare", at: "sun", s: 70 }, { k: "shock", c: 0xffd76a, every: 1.8, r: 210 }, { k: "ring", at: "feet", c: "rainbow", every: 0.7, r: 130 },
    { k: "stars", c: "rainbow", rate: 14 }],
  rim: [0xffd76a, 0xff8ac8],
});

// ================= 29 Oct additions =================
// the Rift units' tear: a jagged slash of light behind one shoulder (straight behind, the body hid it), its edges
// crawling and splinters drifting out of it
A.riftTear = (R, L, o) => {
  const g = pivot(R.torso, o.x === undefined ? 1.15 : o.x, o.y || 1.2, -1.0), c = o.c || 0x3dffc8, c2 = o.c2 || 0x5a1aff, ht = (o.h || 3.2) * 1.2, wd = (o.w || 0.55) * 1.5;
  g.rotation.z = o.tilt === undefined ? -0.3 : o.tilt;
  const segs = [];
  for (let i = 0; i < 9; i++) {
    const f = i / 8 - 0.5, w = (1 - Math.abs(f) * 1.8) * wd + 0.06;
    segs.push(box(g, w, ht / 8 + 0.05, 0.05, i % 2 ? c : 0xffffff, (((i * 37) % 7) - 3) * 0.03, f * ht, 0, { glow: 1, ink: false, rz: (((i * 53) % 5) - 2) * 0.08 }));
  }
  box(g, wd * 0.45, ht * 0.78, 0.04, 0x05030a, 0, 0, 0.04, { ink: false });
  const bits = [];
  for (let i = 0; i < 8; i++) {
    const p = pivot(g);
    box(p, 0.12, 0.22, 0.05, i % 2 ? c : c2, 0, 0, 0, { glow: 1, ink: false, rz: 0.6 });
    bits.push({ p, ph: i * 0.77, s: i % 2 ? 1 : -1 });
  }
  marker(R, "rift", g);
  R.anim.push(t => {
    segs.forEach((m, i) => { m.scale.x = 0.8 + 0.35 * sin(t * 6 + i * 1.7); });
    bits.forEach(b => {
      const k = (t * 0.35 + b.ph) % 1;
      b.p.position.set(b.s * (0.3 + k * 1.6), ((b.ph % 1) - 0.5) * ht * 0.8 + sin(t + b.ph) * 0.2, k * 0.6);
      b.p.rotation.z = t * 2 + b.ph; b.p.scale.setScalar(1 - k * 0.8);
    });
  });
};

// common
U("gus", "Gus, Food Truck Cook", "common", 0.85, {
  look: { skin: SK[4], hairC: 0x2a1a10, hair: "short", top: 0xf2efe8, pants: 0x3a3f4a, boot: 0x1a1a1a,
    face: { style: "narrow", eye: 0x2a1a10, mustache: 0x2a1a10, mouth: "smile" } },
  acc: [["visorCap", { c: 0xd84a3a }], ["apron", { c: 0xd84a3a }], ["ladle", { rot: [1.1, 0, 0] }]],
  pose: { pose: "wave", headY: 0.15 }, fx: [{ k: "drop", at: "head", rate: 0.4 }],
});
U("marge", "Marge, Librarian", "common", 1.05, {
  look: { skin: SK[1], hairC: 0x9a9aa2, hair: "bun", fringe: "side", top: 0x6a4a6a, pants: 0x3a3040, boot: 0x2a1a10,
    face: { eye: 0x4a6a8a, brow: 0.05, mouth: "flat" } },
  acc: [["glasses"], ["book", { c: 0x2a4a6a }], ["cup"]], pose: { pose: "sip", turn: 0.1 }, fx: [{ k: "steam" }],
});
// rare
U("rowan", "Rowan, Lighthouse Keeper", "rare", 3.4, {
  look: { skin: SK[2], hairC: 0x8a8a8a, hair: "messy", top: 0x2a3a5a, pants: 0x3a3020, boot: 0x2a1d10, belt: 0x2a1d10,
    face: { style: "narrow", eye: 0x3a6a8a, mustache: 0x8a8a8a } },
  acc: [["beanie", { c: 0xc83a2a, c2: 0xe84a3a }], ["coat", { c: 0xe8c23a, lapel: 0xc8a22a }], ["lanternPole", { c: 0xffd76a }]],
  pose: { pose: "hold" }, fx: [{ k: "glow", at: "lantern", c: 0xffd76a, r: 60 }, { k: "fall", kind: "snow", rate: 4 }],
});
U("cleo", "Cleo, Street Magician", "rare", 3.8, {
  look: { skin: SK[3], hairC: 0x1a1410, hair: "bob", fringe: "straight", top: 0x1a1a22, pants: 0x1a1a22, boot: 0x111111, collar: 0xc83a5a, glove: 0xf2f2f2,
    face: { eye: 0xc83a5a, mouth: "grin", blush: true } },
  acc: [["wideHat", { c: 0x1a1a22, band: 0xc83a5a }], ["cape", { c: 0x1a1a22, c2: 0xc83a5a }], ["cards", { c: 0xc83a5a }]],
  pose: { pose: "show" }, fx: [{ k: "stars", c: 0xffd23a, rate: 3 }],
});
// epic
U("halcyon", "Halcyon, Wind Lancer", "epic", 18, {
  look: { skin: SK[1], hairC: 0x9fd8ff, hairC2: 0xe6f6ff, hair: "swept", top: 0x2a6a8a, pants: 0x1a3a4a, boot: 0xe6f6ff, belt: 0xe6f6ff,
    face: { style: "narrow", eye: 0x9fd8ff } },
  acc: [["scarf", { c: 0xe6f6ff, c2: 0x9fd8ff }], ["pauldron", { c: 0xe6f6ff, c2: 0x2a6a8a, side: 1 }], ["spear", { rot: [1.06, 0, 0], head: 0xe6f6ff, shaft: 0x2a6a8a }]],
  pose: { pose: "guard" }, fx: [{ k: "wind" }, { k: "dust" }],
});
U("wren", "Wren, Paper Crane Mage", "epic", 16, {
  look: { skin: SK[0], hairC: 0x2a2a3a, hair: "long", fringe: "straight", robe: 0xf4f1e8, robeTrim: 0x3a8ac8, top: 0xf4f1e8, sleeve: 0xf4f1e8,
    face: { style: "closed", mouth: "smile" } },
  acc: [["pages", { n: 8 }], ["sash", { c: 0x3a8ac8 }]], pose: { pose: "cast", float: true },
  fx: [{ k: "glyphs", c: 0x3a8ac8, rate: 2 }, { k: "motes", c: 0xf4f1e8, rate: 6 }],
});
// legendary
U("brann", "Brann, Thunder Smith", "legendary", 115, {
  look: { skin: SK[4], hairC: 0xc85a2a, hair: "mohawk", top: 0x3a2a1a, sleeve: SK[4], pants: 0x2a2018, boot: 0x1a1410, belt: 0x1a1410,
    face: { style: "narrow", eye: 0x4fe6ff, brow: -0.2, mouth: "grin", mustache: 0xc85a2a } },
  acc: [["apron", { c: 0x5a3a20 }], ["gauntlets", { c: 0x8a9098, glow: 0x4fe6ff }], ["hammer", { rot: [1.2, 0, 0], c: 0x5a6068, glow: 0x4fe6ff }]],
  pose: { pose: "forge" }, fx: [{ k: "flash", key: "hit", at: "hammer", c: 0x9feaff, r: 30, sparks: true }, { k: "arc", a: "hammer", b: "handL", c: 0x4fe6ff, every: 0.7 },
    { k: "embers", rate: 8, c: 0xffd23a }],
  rim: [0x4fe6ff, 0xffb21e],
});
U("isolde", "Isolde, Rose Knight", "legendary", 108, {
  look: { skin: SK[1], hairC: 0xd84a6a, hairC2: 0xff8aa8, hair: "pony", top: 0xe6e8ee, pants: 0x8a1a3a, boot: 0xe6e8ee, glove: 0xe6e8ee,
    face: { eye: 0xd84a6a, mouth: "smile" } },
  acc: [["armor", { c: 0xe6e8ee, trim: 0xd84a6a, emblem: 0xd84a6a }], ["cape", { c: 0x8a1a3a, c2: 0xd84a6a }], ["sword", { c: 0xfff0f4, trim: 0xd84a6a }]],
  pose: { pose: "guard", headY: 0.15 }, fx: [{ k: "fall", kind: "petal", c: 0xd84a6a, rate: 6 }],
  rim: [0xff8aa8, 0xffb21e],
});
// mythic
U("thalor", "Thalor, Comet Rider", "mythic", 740, {
  look: { skin: SK[2], hairC: 0xffffff, hairC2: 0x9feaff, hair: "spiky", top: 0x1a2a5a, pants: 0x10183a, boot: 0x9feaff, glove: 0x9feaff,
    face: { style: "visor", eye: 0x9feaff } },
  acc: [["jetpack", { c: 0x1a2a5a, c2: 0x9feaff }], ["scarf", { c: 0x9feaff, c2: 0xffffff }], ["orbitOrbs", { c: 0x1a2a5a, ring: 0x9feaff }]],
  pose: { pose: "float", float: true },
  fx: [{ k: "jet", at: ["jetL", "jetR"], c: 0x9feaff }, { k: "stars", c: 0xffffff, rate: 8 }, { k: "glow", at: "center", c: 0x4fb8ff, r: 110 }],
  rim: [0x9feaff, 0xffffff],
});
U("nyx", "Nyx, Dream Weaver", "mythic", 660, {
  look: { skin: 0xe8dcf8, hairC: 0x2a1a5a, hairC2: 0x8a5cff, hair: "long", fringe: "side", robe: 0x1a1040, robeTrim: 0xc9a8ff, robeIn: 0x8a5cff, top: 0x1a1040, sleeve: 0x1a1040,
    face: { style: "closed", mouth: "smile" } },
  acc: [["ribbons", { cols: [0xc9a8ff, 0x8a5cff, 0xffd0f0], n: 6 }], ["halo", { c: 0xc9a8ff, r: 0.6 }], ["orb", { c: 0x1a1040, ring: 0xffd0f0 }]],
  pose: { pose: "hold", float: true },
  fx: [{ k: "stars", c: 0xc9a8ff, rate: 6 }, { k: "glow", at: "center", c: 0x8a5cff, r: 110 }, { k: "motes", c: 0xffd0f0, rate: 10 }],
  rim: [0xc9a8ff, 0xff8ac8],
});
// secret
U("hollow", "Hollow, the Echo", "secret", 8200, {
  look: { skin: 0x0a0a0f, hair: "none", top: 0x0a0a0f, pants: 0x0a0a0f, boot: 0x0a0a0f, glove: 0x0a0a0f,
    face: { style: "none", brow: null, mouth: "none" } },
  acc: [["maskFull", { c: 0xf2f2f6, drip: 0x2a2a30 }], ["mantle", { c: 0x0a0a0f, trim: 0xf2f2f6 }]], pose: { pose: "float", float: true },
  fx: [{ k: "afterimage", n: 4, every: 0.12, off: 10 }, { k: "glitch", amount: 1.4 }, { k: "ring", at: "feet", c: 0xffffff, every: 0.9, r: 90 }],
  rim: [0xffffff, 0x2a2a30],
});
U("cipher", "Cipher", "secret", 6800, {
  look: { skin: 0x1a1a22, hair: "none", top: 0x0a1a12, pants: 0x0a0a10, boot: 0x0a0a10, glove: 0x1a1a22,
    face: { style: "glow", eye: 0x3dff8a, brow: null, mouth: "none" } },
  acc: [["hood", { c: 0x0a1a12, c2: 0x3dff8a }], ["coat", { c: 0x0a1a12, lapel: 0x3dff8a }], ["drone", { c: 0x1a1a22, glow: 0x3dff8a }]],
  pose: { pose: "tinker" }, fx: [{ k: "hexbits", c: 0x3dff8a, rate: 10 }, { k: "glyphs", c: 0x3dff8a, rate: 4 }, { k: "glitch", amount: 1.2 }],
  rim: [0x3dff8a, 0xffffff],
});
// divine
U("astraea", "Astraea, Scale of Stars", "divine", 122000, {
  look: { skin: SK[1], hairC: 0xffffff, hairC2: 0xbfe8ff, hair: "long", fringe: "straight", robe: 0xf6f8ff, robeTrim: 0x9fb8ff, robeIn: 0x2a3a6a, top: 0xf6f8ff, sleeve: 0xf6f8ff, glove: 0x9fb8ff,
    face: { style: "glow", eye: 0x9feaff, brow: null } },
  acc: [["halo", { c: 0xffffff, r: 0.6 }], ["wings", { kind: "light", c: 0xbfe8ff, c2: 0xffffff, n: 6, pairs: 2 }], ["crystals", { n: 8, cols: [0xffffff, 0xbfe8ff, 0xffe48a] }],
    ["staff", { rot: [0.55, 0, 0], orb: 0xffffff }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "pillar", c: 0xeaf4ff, w: 80, a: 0.4 }, { k: "rays", at: "halo", c: 0xffffff, n: 16, len: 200, a: 0.35 }, { k: "stars", c: "rainbow", rate: 10 },
    { k: "shock", c: 0x9feaff, every: 2.2, r: 170 }, { k: "motes", c: "rainbow", rate: 24 }],
  rim: [0xffffff, 0x9feaff],
});
U("veyra", "Veyra, Storm Mother", "divine", 115000, {
  look: { skin: SK[2], hairC: 0x2a3a6a, hairC2: 0x4fe6ff, hair: "swept", robe: 0x1a2244, robeTrim: 0x4fe6ff, robeIn: 0xffe23a, top: 0x1a2244, sleeve: 0x1a2244, glove: 0x4fe6ff,
    face: { style: "glow", eye: 0x4fe6ff, brow: null } },
  acc: [["crown", { c: 0x4fe6ff, gem: 0xffe23a }], ["wings", { kind: "light", c: 0x4fe6ff, c2: 0xffe23a, n: 5, pairs: 2 }], ["orbitOrbs", { n: 4, c: 0x1a2244, ring: 0xffe23a }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "arc", a: "handL", b: "handR", c: 0x4fe6ff, every: 0.4 }, { k: "arc", a: "head", b: "feet", c: 0xffe23a, every: 0.9 }, { k: "glow", at: "center", c: 0x4fe6ff, r: 140 },
    { k: "shock", c: 0x4fe6ff, every: 2, r: 180 }, { k: "motes", c: 0xbff2ff, rate: 26 }, { k: "wind" }],
  rim: [0x4fe6ff, 0xffe23a],
});
// transcendent
U("caelum", "Caelum, Sky Cartographer", "transcendent", 840000, {
  look: { skin: SK[3], hairC: 0xffe9b0, hair: "swept", robe: 0x0e1430, robeTrim: 0xd8a84a, robeIn: 0x4fb8ff, top: 0x0e1430, sleeve: 0x0e1430, glove: 0xd8a84a,
    face: { style: "glow", eye: 0xffd76a, brow: null } },
  acc: [["planets"], ["runeRing", { c: 0xd8a84a, c2: 0x9feaff, r: 1.9, y: 1.4 }], ["book", { c: 0x0e1430 }], ["mantle", { c: 0x0e1430, trim: 0xd8a84a }]],
  pose: { pose: "hold", float: true },
  fx: [{ k: "pillar", c: 0x9feaff, w: 80, a: 0.35 }, { k: "stars", c: "rainbow", rate: 14 }, { k: "glyphs", c: 0xffd76a, rate: 5 }, { k: "motes", c: "rainbow", rate: 30 },
    { k: "shock", c: 0xffd76a, every: 2, r: 190 }],
  rim: [0xffd76a, 0x4fb8ff],
});
U("mnemos", "Mnemos, Memory Garden", "transcendent", 720000, {
  look: { skin: 0xf0e6f8, hairC: 0xffd0f0, hairC2: 0x8ad86a, hair: "long", fringe: "side", robe: 0xfaf6ff, robeTrim: 0x8ad86a, robeIn: 0xff8ac8, top: 0xfaf6ff, sleeve: 0xfaf6ff,
    face: { style: "closed", brow: null, mouth: "smile" } },
  acc: [["lotus", { c: 0xff8ac8, c2: 0xffffff, ring: 0x8ad86a }], ["antlers", { c: 0xf6f0e0, leaf: 0x8ad86a }], ["pages", { n: 8 }], ["halos", { cols: [0xff8ac8, 0x8ad86a, 0xffffff] }]],
  pose: { pose: "meditate", float: true },
  fx: [{ k: "fall", kind: "petal", rate: 12 }, { k: "fall", kind: "leaf", c: 0x8ad86a, rate: 6 }, { k: "glow", at: "center", c: 0xff8ac8, r: 150 },
    { k: "motes", c: "rainbow", rate: 30 }, { k: "ring", at: "feet", c: 0x8ad86a, every: 0.9, r: 120 }],
  rim: [0xff8ac8, 0x8ad86a],
});
// primordial
U("ferrum", "Ferrum, First Iron", "primordial", 6800000, {
  look: { skin: 0x4a4f58, hairC: 0xff6a1a, hairC2: 0xffd23a, hair: "spiky", top: 0x2a2d35, pants: 0x1a1c22, boot: 0x5a5f68, glove: 0x5a5f68,
    face: { style: "glow", eye: 0xff6a1a, brow: null } },
  acc: [["armor", { c: 0x5a5f68, trim: 0xff6a1a, emblem: 0xff6a1a, glowEmblem: true }], ["gauntlets", { c: 0x5a5f68, glow: 0xff6a1a }], ["hammer", { big: true, rot: [1.2, 0, 0], c: 0x3a3f48, glow: 0xff6a1a }],
    ["lavaCracks", { c: 0xff6a1a }], ["shards", { n: 8, c: 0x3a3f48, edge: 0xff6a1a }]],
  pose: { pose: "forge" },
  fx: [{ k: "embers", rate: 34 }, { k: "glow", at: "center", c: 0xff6a1a, r: 160 }, { k: "shock", c: 0xff6a1a, every: 1.8, r: 190 },
    { k: "smoke", area: [0.2, 0.8, 0.5, 0.95], rate: 6, c: 0x1a1a1a, a: 0.4 }, { k: "flash", key: "hit", at: "hammer", c: 0xffd27a, r: 40, sparks: true }],
  rim: [0xff6a1a, 0xffd23a],
});
U("zephra", "Zephra, First Wind", "primordial", 5800000, {
  look: { skin: SK[0], hairC: 0xe6fff6, hairC2: 0x7dffcf, hair: "long", fringe: "side", robe: 0xf2fffa, robeTrim: 0x7dffcf, robeIn: 0x3dbfa0, top: 0xf2fffa, sleeve: 0xf2fffa,
    face: { style: "glow", eye: 0x7dffcf, brow: null } },
  acc: [["wings", { kind: "feather", c: 0xf2fffa, c2: 0x7dffcf, n: 7, pairs: 2, span: 1.25, flap: 1.4 }], ["ribbons", { cols: [0x7dffcf, 0xe6fff6, 0x3dbfa0], n: 7 }],
    ["vortex", { core: 0xe6fff6, cols: [0x7dffcf, 0xbfffe8, 0x3dbfa0, 0xffffff] }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "wind" }, { k: "fall", kind: "feather", rate: 10 }, { k: "swirl", at: "hole", rate: 60, hue: 140, flat: 0.45 }, { k: "motes", c: 0xe6fff6, rate: 34 },
    { k: "shock", c: 0x7dffcf, every: 2, r: 200 }],
  rim: [0x7dffcf, 0xffffff],
});
// eternal
U("nihil", "Nihil, the Quiet End", "eternal", 98000000, {
  look: { skin: 0x050508, hairC: 0x1a1a22, hairC2: 0xffffff, hair: "long", fringe: "straight", robe: 0x050508, robeTrim: 0xffffff, robeIn: 0x101018, top: 0x050508, sleeve: 0x050508,
    face: { style: "glow", eye: 0xffffff, brow: null } },
  acc: [["blackHole"], ["darkHalo"], ["wings", { kind: "feather", c: 0x101014, c2: 0xffffff, n: 7, pairs: 3, span: 1.35, flap: 0.6 }], ["inkLines"]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "swirl", at: "hole", rate: 80, hue: 220, flat: 0.45 }, { k: "fall", kind: "blackFeather", rate: 12 }, { k: "glitch", amount: 1 },
    { k: "shock", c: 0xffffff, every: 2, r: 210, at: "hole" }, { k: "stars", c: 0xffffff, rate: 12 },
    { k: "glow", at: "hole", r: 200, stops: [[0, "rgba(0,0,0,0)"], [0.35, "rgba(255,255,255,.45)"], [1, "rgba(0,0,0,0)"]] }],
  rim: [0xffffff, 0x2a2a30],
});

// ================= RIFT (Rift Gate only) =================
U("riftling", "Riftling", "secret", 9800, {
  gate: "rift",
  look: { skin: 0x0a1a1a, hairC: 0x3dffc8, hairC2: 0x5a1aff, hair: "spiky", top: 0x10101a, pants: 0x0a0a10, boot: 0x3dffc8,
    face: { style: "glow", eye: 0x3dffc8, brow: null, mouth: "grin" } },
  acc: [["riftTear", { h: 2.6, w: 0.45 }], ["scarf", { c: 0x5a1aff, c2: 0x3dffc8 }]], pose: { pose: "nod" },
  fx: [{ k: "glitch", amount: 1.2 }, { k: "glow", at: "rift", c: 0x3dffc8, r: 80 }, { k: "hexbits", c: 0x3dffc8, rate: 6 }],
  rim: [0x3dffc8, 0x5a1aff],
});
U("seam", "Seam, Rift Warden", "divine", 135000, {
  gate: "rift",
  look: { skin: SK[4], hairC: 0x10101a, hair: "short", top: 0x10101a, pants: 0x0a0a10, boot: 0x3dffc8, glove: 0x3dffc8,
    face: { style: "visor", eye: 0x3dffc8 } },
  acc: [["riftTear", { h: 3.4 }], ["armor", { c: 0x1a1a2a, trim: 0x3dffc8, emblem: 0x5a1aff, glowEmblem: true }], ["cape", { c: 0x10101a, c2: 0x5a1aff, trim: 0x3dffc8 }],
    ["greatsword", { rot: [0.62, 0, -0.32], glow: 0x3dffc8 }]],
  pose: { pose: "shoulder", headY: 0.2 },
  fx: [{ k: "glow", at: "rift", c: 0x3dffc8, r: 130 }, { k: "sparks", a: "base", b: "tip", c: 0x3dffc8 }, { k: "motes", c: 0x3dffc8, rate: 22 },
    { k: "shock", c: 0x5a1aff, every: 2.2, r: 170 }, { k: "glitch", amount: 0.6 }],
  rim: [0x3dffc8, 0x5a1aff],
});
U("vael", "Vael, Between Worlds", "transcendent", 950000, {
  gate: "rift",
  look: { skin: 0xe6fff8, hairC: 0x3dffc8, hairC2: 0xc9a8ff, hair: "long", fringe: "side", robe: 0x0a0a14, robeTrim: 0x3dffc8, robeIn: 0x5a1aff, top: 0x0a0a14, sleeve: 0x0a0a14,
    face: { style: "glow", eye: 0xc9a8ff, brow: null } },
  acc: [["riftTear", { h: 3.6, w: 0.7 }], ["halos", { cols: [0x3dffc8, 0x5a1aff, 0xffffff] }], ["crystals", { n: 9, cols: [0x3dffc8, 0x5a1aff, 0xffffff] }]],
  pose: { pose: "float", float: true },
  fx: [{ k: "afterimage", n: 3, every: 0.1, off: 8 }, { k: "glow", at: "rift", c: 0x3dffc8, r: 160 }, { k: "glitch", amount: 0.9 }, { k: "stars", c: 0x3dffc8, rate: 12 },
    { k: "motes", c: "rainbow", rate: 28 }, { k: "shock", c: 0x3dffc8, every: 2, r: 200 }],
  rim: [0x3dffc8, 0xc9a8ff],
});
U("kharon", "Kharon, Rift Ferryman", "primordial", 8500000, {
  gate: "rift",
  look: { skin: 0x1a1a22, hair: "none", robe: 0x0a0a10, robeTrim: 0x3dffc8, robeIn: 0x5a1aff, top: 0x0a0a10, sleeve: 0x0a0a10, glove: 0x1a1a22,
    face: { style: "glow", eye: 0x3dffc8, brow: null, mouth: "none" } },
  acc: [["hood", { c: 0x0a0a10, c2: 0x3dffc8 }], ["riftTear", { h: 3.8, w: 0.8 }], ["lanternPole", { c: 0x3dffc8 }], ["ghostLanterns", { c: 0x3dffc8 }]],
  pose: { pose: "hold" },
  fx: [{ k: "glow", at: "lantern", c: 0x3dffc8, r: 90 }, { k: "smoke", area: [0.15, 0.85, 0.55, 0.98], rate: 10, c: 0x0a1a18, a: 0.5 }, { k: "glow", at: "rift", c: 0x5a1aff, r: 170 },
    { k: "motes", c: 0x3dffc8, rate: 30 }, { k: "shock", c: 0x3dffc8, every: 1.8, r: 200 }, { k: "glitch", amount: 0.7 }],
  rim: [0x3dffc8, 0x5a1aff],
});
U("axiom", "Axiom, Heart of the Rift", "eternal", 140000000, {
  gate: "rift",
  look: { skin: 0xffffff, hairC: 0xffffff, hairC2: 0x3dffc8, hair: "swept", robe: 0xffffff, robeTrim: 0x3dffc8, robeIn: 0x5a1aff, top: 0xffffff, sleeve: 0xffffff, glove: 0x3dffc8,
    face: { style: "glow", eye: 0x5a1aff, brow: null } },
  acc: [["riftTear", { h: 4.2, w: 1.0 }], ["runeRing", { c: 0x3dffc8, c2: 0xffffff, r: 2.0, y: 1.6 }], ["blades", { n: 8, r: 2.2, c: 0x3dffc8, glow: true, trim: 0x5a1aff, sp: 0.5 }],
    ["wings", { kind: "light", c: 0x3dffc8, c2: 0x5a1aff, n: 6, pairs: 3, span: 1.3, flap: 1 }]],
  pose: { pose: "divine", float: true },
  fx: [{ k: "pillar", c: 0xbfffee, w: 100, a: 0.45 }, { k: "rays", at: "rift", c: 0x3dffc8, n: 22, len: 260, spin: 0.2, a: 0.4 }, { k: "glow", at: "rift", c: 0x3dffc8, r: 200 },
    { k: "afterimage", n: 3, every: 0.1, off: 8 }, { k: "glitch", amount: 0.8 }, { k: "shock", c: "rainbow", every: 1.8, r: 210 },
    { k: "motes", c: "rainbow", rate: 44 }, { k: "stars", c: "rainbow", rate: 14 }],
  rim: [0x3dffc8, 0xffffff],
});

AF.UNIT = {};
DEFS.forEach((d, i) => { d.idx = i; AF.UNIT[d.key] = d; });
// "Find every unit" counts the whole roster, however big it grows
if (AF.QUEST && AF.QUEST.f48) AF.QUEST.f48.goal = DEFS.length;
if (AF.QUEST && AF.QUEST.riftAll) AF.QUEST.riftAll.goal = DEFS.filter(d => d.gate === "rift").length;
})();
