/* Aura Farm: Jenny (1 Nov, Chris: "add this character in the game, model it based on this reference as close as you can
   to the reference. Name it 'jenny' it's an eternal unit"). From his reference: a chestnut bob with a side fringe and a
   pink flower clip, blue eyes half-lidded over a little smile, a black choker with a gold ring, a dark purple
   off-shoulder crop top with long striped sleeves, loose black trousers, purple striped leg warmers and black high-tops
   laced in white; she stands with her hands behind her back and her weight on one hip. An Eternal with no gate of her
   own (the Void, Genesis and Rift Gates' Eternal pulls); her Defense attack is attacks.js "jenny". */
(function () {
const AF = window.AF, K = AF.kit, A = K.acc, POSES = K.POSES;
const { box, mesh, pivot, marker, cyl } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const SKIN = 0xf7dcc8, HAIR = 0x7a4a2e, HAIR2 = 0x5c3720, TOP = 0x3e2a5c, STRIPE = 0x2a1c40, PANTS = 0x141218, SHOE = 0x111114;
const SOCK = 0x4c3874, SOCK2 = 0x2c2046, PINK = 0xff3d9a, YEL = 0xffd23a, LACE = 0xf2f2f2, GOLD = 0xe0a83a;

// her clothes over the plain figure: bare shoulders above the top, a bare midriff below it, striped sleeves, the choker,
// the leg warmers and laced high-tops, and the flower in her hair
A.jennyOutfit = (R, L, o) => {
  const tor = R.torso;
  // off the shoulders: skin across the top of the body, the top's edge running straight across below it
  box(tor, 1.01, 0.2, 0.57, SKIN, 0, 0.91, 0, { ink: false });
  box(tor, 1.03, 0.07, 0.59, TOP, 0, 0.8, 0, { ink: false });
  // (1 Nov, "make the tits bigger"): a fuller chest, stepped in from the top so it reads round in blocks
  // (same day, "i need the chest to pop out more, like the reference"): out about twice as far
  box(tor, 0.96, 0.46, 0.44, TOP, 0, 0.6, 0.46);
  box(tor, 0.9, 0.14, 0.32, TOP, 0, 0.86, 0.4, { ink: false });
  box(tor, 0.9, 0.12, 0.36, TOP, 0, 0.33, 0.42, { ink: false });
  // (same day, "a line in the center of her chest ... like 2 squares"): a dark seam down the middle splits it in two
  box(tor, 0.045, 0.44, 0.02, 0x150c24, 0, 0.6, 0.685, { ink: false });
  box(tor, 0.04, 0.14, 0.02, 0x150c24, 0, 0.86, 0.565, { ink: false });
  box(tor, 0.04, 0.12, 0.02, 0x150c24, 0, 0.33, 0.605, { ink: false });
  // cropped: the midriff shows under it, the trousers sitting on the hips
  box(tor, 1.01, 0.22, 0.57, SKIN, 0, 0.1, 0, { ink: false });
  box(tor, 0.05, 0.06, 0.02, 0xd9a68c, 0, 0.1, 0.29, { ink: false });
  box(R.hips, 1.06, 0.2, 0.6, PANTS, 0, -0.06, 0);
  // the choker and its gold ring
  box(tor, 0.52, 0.09, 0.5, 0x0e0e12, 0, 1.03, 0, { ink: 0.01 });
  mesh(tor, cyl(0.05, 0.05, 0.03, 12), GOLD, 0, 0.97, 0.26, { rx: PI / 2, ink: false });
  // the arms: bare at the shoulder, then long sleeves striped down to the wrist
  for (const arm of [R.armL, R.armR]) {
    box(arm, 0.43, 0.2, 0.45, SKIN, 0, -0.07, 0, { ink: false });
    for (let i = 0; i < 4; i++) box(arm, 0.44, 0.055, 0.46, STRIPE, 0, -0.26 - i * 0.12, 0, { ink: false });
  }
  // the legs: striped leg warmers over the trousers, black high-tops laced in white on a white sole
  for (const leg of [R.legL, R.legR]) {
    if (!leg) continue;
    box(leg, 0.5, 0.38, 0.52, SOCK, 0, -0.55, 0);
    for (let i = 0; i < 3; i++) box(leg, 0.51, 0.06, 0.53, SOCK2, 0, -0.43 - i * 0.12, 0, { ink: false });
    for (let i = 0; i < 3; i++) box(leg, 0.2, 0.045, 0.02, LACE, 0, -0.74 - i * 0.07, 0.32, { ink: false });
    box(leg, 0.5, 0.06, 0.57, LACE, 0, -0.97, 0.04, { ink: false });
  }
  // the flower clip: five pink petals round a yellow heart, high on the left of her head, clipped on in front of the hair
  // (1 Nov, "flower has to get fixed, it's colliding with the hairstyle": it sat inside the hair's cap and fringe)
  const f = pivot(R.head, -0.42, 1.3, 0.7); f.rotation.set(-0.12, 0.2, 0.3);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; box(f, 0.26, 0.26, 0.08, PINK, cos(a) * 0.2, sin(a) * 0.2, 0, { rz: a, ink: 0.015 }); }
  box(f, 0.2, 0.2, 0.1, YEL, 0, 0, 0.03, { ink: 0.015 });
  marker(R, "flower", f);
};
// hands clasped behind her back, her weight on one hip, the head tipped
POSES.coy = (R, t, P, br) => {
  R.armL.rotation.set(0.38 + br * 0.02, 0, 0.3);
  R.armR.rotation.set(0.38 + br * 0.02, 0, -0.3);
  R.hips.rotation.z = 0.09 + sin(t * 0.9) * 0.02;
  R.torso.rotation.z = -0.12; R.torso.rotation.y += 0.1;
  R.head.rotation.z += 0.16; R.head.rotation.x += 0.04;
  if (R.legL) { R.legL.rotation.set(0.02, 0, -0.08); R.legR.rotation.set(0.14, 0, 0.06); }
};
AF.UNITS.push({
  key: "jenny", name: "Jenny", rarity: "eternal", base: 105000000,
  look: { skin: SKIN, hairC: HAIR, hairC2: HAIR2, hair: "bob", fringe: "side", top: TOP, sleeve: TOP, pants: PANTS, boot: SHOE, glove: SKIN,
    face: { style: "bored", eye: 0x4aa8ff, ew: 0.22, brow: 0.12, browC: HAIR2, mouth: "smile", blush: true } },
  acc: [["jennyOutfit", {}]],
  pose: { pose: "coy" }, scale: 1,
  fx: [{ k: "fall", kind: "petal", c: PINK, rate: 9 }, { k: "glow", at: "center", r: 150, stops: [[0, "rgba(255,61,154,.28)"], [0.6, "rgba(160,123,255,.12)"], [1, "rgba(40,10,40,0)"]] }, { k: "motes", c: YEL, rate: 18 },
    { k: "shock", c: PINK, every: 2.2, r: 190 }, { k: "stars", c: "rainbow", rate: 8 }],
  rim: [PINK, 0xa07bff],
});
AF.UNITS.forEach((d, i) => { d.idx = i; AF.UNIT[d.key] = d; });
})();
