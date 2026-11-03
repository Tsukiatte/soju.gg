/* Aura Farm Defense: signature moves (29 Oct, request: "the higher the rarity, the cooler the effects"). Legendary
   units have one every 4th attack, Mythic and up every 3rd; each unit's is its own. Every one is called with the
   unit's look (c: colours c.c, element c.el, size c.s, rarity c.R, upgrade tier c.T, counts c.n), the event, the unit,
   where the attack landed, and tdfx's shared pieces (H) and the effects engine (V). tdfx adds the screen flash for
   Mythic and up and a pillar at the unit from Divine up. */
(function () {
const AF = window.AF, PI = Math.PI, sin = Math.sin, cos = Math.cos, rnd = (a, b) => a + Math.random() * (b - a);
const dirTo = (p, x, z) => { const dx = x - p.x, dz = z - p.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l, l]; };
const RB = [0xff5a5a, 0xffb02e, 0xffe23a, 0x5aff8a, 0x4fc8ff, 0xa07bff];
// a big burst of one particle shape (o: cell, cols, speed, up, n, size, add, flat, life, grav, stretch, spin, k)
const blast = (V, x, y, z, o) => V.burst(o.add !== false, x, y, z, o.n || 30, { cols: o.cols, speed: o.speed || [2, 6], up: o.up || 1, flat: o.flat, life: o.life || [0.3, 0.6], size: [o.size || 0.1, 0],
  cell: V.CELL[o.cell || "hot"], stretch: o.stretch || 0, k: o.k || 2.6, grav: o.grav == null ? 4 : o.grav, drag: o.drag || 2, spin: o.spin || 0, a: o.a || 1, dir: o.dir, cone: o.cone });
const enemiesNear = (x, z, r) => { const M = AF.Board.match(); return M ? M.enemies.filter(e => e.hp > 0 && Math.hypot(e.x - x, e.z - z) <= r) : []; };

AF.TDSIG = {
  // ---------------- Legendary ----------------
  // Kaida: a crescent of lightning down the line, the sky striking along it
  thunderCleave(c, ev, p, x, z, H, V) {
    const [ux, uz] = dirTo(p, x, z);
    V.crescent(p.x, p.z, ux, uz, 5.5, 12, { r: 1.7 * c.s, col: c.c[0], core: 0xffffff });
    for (let i = 0; i < 3; i++) { const d = 1.4 + i * 1.3, bx = p.x + ux * d, bz = p.z + uz * d; V.later(0.08 + i * 0.1, () => { V.bolt([bx + 0.4, 9, bz - 0.6], [bx, 0.08, bz], { col: c.c[0], w: 0.15, dur: 0.25, forks: 2, depth: 5, jag: 0.14 }); H.ring(c, bx, bz, 1.1, 2.2, 0.35); H.sparks(c, bx, 0.3, bz, 14, { up: 2 }); }); }
    H.screen(x, z, { flash: [c.c[1], 0.18], shake: 0.18 });
  },
  // Orrin: the ground splits from his feet past the target, lava bursting up along the crack
  fissure(c, ev, p, x, z, H, V) {
    const [ux, uz] = dirTo(p, x, z);
    H.fissure(c, p.x + ux * 0.6, p.z + uz * 0.6, x + ux * 1.6, z + uz * 1.6, 9, { h: 1.4 });
    V.decal(x, z, 3, 1.4, { col: 0xff5a1a, k: 1.6, dur: 1.2 }); H.screen(x, z, { shake: 0.25, ripple: 0.006 });
  },
  // Lumen: a pillar of holy light on the target, six thin shafts round it
  sanctum(c, ev, p, x, z, H, V) {
    H.pillar(c, x, z, 1.3);
    H.ringBurst(c, x, z, 1.4, 6, { step: 0.04, at: (px, pz) => { H.skyBeam(px, pz, c.c[1], 0.08, 0.3, 7); H.flash(px, 0.3, pz, 0.6, c.c[2], 1.4); } });
    V.decal(x, z, 6, 1.6, { col: c.c[0], k: 1.6, dur: 1, speed: 0.5 });
  },
  // Rasp: the fist bursts into a storm of scrap, gears and hot metal flying out
  scrapStorm(c, ev, p, x, z, H, V) {
    V.burst(false, x, 0.5, z, 28, { cols: [0x8a5a3a, 0x6a6a72, 0xa86a3a], speed: [3, 8], up: 2, life: [0.6, 1], size: [0.12, 0.08], cell: V.CELL.shard, grav: 12, spin: 14 });
    blast(V, x, 0.6, z, { n: 14, cols: [c.c[0], c.c[2]], cell: "rune", size: 0.16, speed: [2, 5], flat: true, spin: 8, k: 2 });
    blast(V, x, 0.5, z, { n: 30, cols: [0xffd27a, 0xffffff], stretch: 1.6, speed: [4, 9], size: 0.05 });
    H.puff(c, x, 0.4, z, 8, 0x5a4a44, 0.7, 0.6); H.ring(c, x, z, 2, 2, 0.4); H.screen(x, z, { shake: 0.2 });
  },
  // Yuzu: a broadside: three cannonballs come in over the rooftops
  broadside(c, ev, p, x, z, H, V) {
    H.puff(c, p.x, 1, p.z, 6, 0x9a9a98, 0.6, 0.6);
    H.rain(c, x, z, 1.4, 3, { cell: "dot", col: 0x2a2a30, add: false, size: 0.32, stretch: 0, fall: 0.45, spread: 0.3, ox: -3, oz: 2, h: 5, hit: (bx, bz) => { H.explode(c, bx, bz, 0.9, 0.8); V.shake(0.12); } });
  },
  // Corvid: a murder of crows pours from him onto the target, then one red cut
  murder(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 26; i++) { const a = rnd(0, PI * 2), r = rnd(0.5, 1.5), sx = p.x + cos(a) * r, sz = p.z + sin(a) * r, t = rnd(0.25, 0.45); V.put(false, sx, rnd(1, 2.5), sz, (x - sx) / t, (0.6 - 1.8) / t, (z - sz) / t, t, 0, 0, 0.18, 0.14, V.CELL.feather, 0, V.lin(0x14141a), 1, rnd(0, 6), rnd(-6, 6), rnd(0, 0.2)); }
    V.later(0.4, () => { V.slash(x, 0.7, z, { ang: p.face, tilt: 0.6, r: 1.6, col: c.c[0], core: 0xffffff, dur: 0.24 }); V.slash(x, 0.7, z, { ang: p.face, tilt: -0.6, r: 1.6, col: c.c[0], core: 0xffffff, dur: 0.24, delay: 0.05, flip: true }); H.flash(x, 0.7, z, 1.6, c.c[0], 1.6); });
  },
  // Mira: the forge's heart goes off, molten drops raining all round
  forgeNova(c, ev, p, x, z, H, V) {
    H.flash(x, 0.6, z, 3, 0xffffff, 2.2, 0.16);
    blast(V, x, 0.6, z, { n: 40, cols: [0xffd27a, 0xffffff, c.c[0]], cell: "star", size: 0.14, speed: [3, 8], spin: 6 });
    for (let i = 0; i < 16; i++) V.put(true, x, 0.6, z, rnd(-3, 3), rnd(3, 6), rnd(-3, 3), 0.9, 0.5, 12, 0.1, 0.06, V.CELL.drop, 0, V.lin(0xff8a2a, 2.4), 1);
    H.ring(c, x, z, 2.2, 2.2, 0.5); V.later(0.1, () => H.ring(c, x, z, 2.8, 1.4, 0.5, 0xffffff)); V.decal(x, z, 3, 1.5, { col: 0xff8a2a, k: 1.6, dur: 1.2 }); H.screen(x, z, { shake: 0.2, ripple: 0.006 });
  },
  // Grave Choir: the dead answer: rings of green wail out and wisps rise all round
  wail(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 4; i++) V.later(i * 0.12, () => H.ring(c, x, z, 1 + i * 0.5, 1.6, 0.5, i % 2 ? c.c[1] : c.c[0]));
    for (let i = 0; i < 24; i++) { const a = rnd(0, PI * 2), d = rnd(0, 2); V.put(true, x + cos(a) * d, 0.1, z + sin(a) * d, 0, rnd(1.2, 2.4), 0, rnd(0.8, 1.3), 0.5, -0.5, 0.22, 0.05, V.CELL.dot, 0, V.lin(c.c[0], 2), 1, 0, 0, rnd(0, 0.4)); }
    V.flash(c.c[0], 0.12);
  },
  // Seren: one arrow of moonlight straight through, a moon over the mark, starlight falling
  moonbeam(c, ev, p, x, z, H, V) {
    const [ux, uz] = dirTo(p, x, z);
    H.line([p.x, 1, p.z], [x + ux * 4, 0.6, z + uz * 4], c.c[0], 0.12, 0.3); H.line([p.x, 1, p.z], [x + ux * 4, 0.6, z + uz * 4], 0xffffff, 0.04, 0.3);
    H.flash(x, 3, z, 1.6, c.c[1], 2, 0.5); V.burst(true, x, 3, z, 1, { cols: [c.c[0]], speed: [0, 0], life: [0.5, 0.5], size: [0.6, 1.6], cell: V.CELL.ring, k: 2, fixed: true });
    H.rain(c, x, z, 1.6, 10, { cell: "star", size: 0.14, stretch: 0.4, fall: 0.5, spread: 0.4, ox: 0, oz: 0 });
  },
  // Grund: the mountain throws a boulder down on them
  boulder(c, ev, p, x, z, H, V) {
    V.put(false, x + 1.2, 7, z - 1.2, -1.2 / 0.45, -6.6 / 0.45, 1.2 / 0.45, 0.45, 0, 0, 0.9, 0.9, V.CELL.shard, 0, V.lin(0x6a5a4a), 1, 0, 6);
    V.later(0.45, () => { H.explode(c, x, z, 1.5, 1.2); V.decal(x, z, 4, 1.6, { col: 0x231c18, dur: 3 }); V.burst(false, x, 0.4, z, 30, { cols: [0x6a5a4a, 0x8a7a6a], speed: [3, 7], up: 4, life: [0.6, 1], size: [0.14, 0.1], cell: V.CELL.shard, grav: 14, spin: 10 }); H.screen(x, z, { shake: 0.4, ripple: 0.008 }); });
  },
  // Vespera: a waltz: six cuts turning round the target, shadow petals left behind
  waltz(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 6; i++) V.later(i * 0.06, () => { V.slash(x, 0.65, z, { ang: (i / 6) * PI * 2, tilt: (i % 2 ? 0.5 : -0.5), r: 1.25, col: c.c[0], core: c.c[2], dur: 0.22, flip: i % 2 === 1 }); H.sparks(c, x, 0.6, z, 6); });
    V.later(0.36, () => { H.flash(x, 0.7, z, 1.8, c.c[0], 1.6); V.burst(false, x, 0.8, z, 18, { cols: [0x2a1a3a, c.c[0]], speed: [1, 3], up: 1, life: [0.8, 1.3], size: [0.14, 0.08], cell: V.CELL.petal, grav: 1.5, spin: 5, a: 0.9 }); });
  },
  // Torvik: the dragonling breathes a long cone of fire at them
  dragonBreath(c, ev, p, x, z, H, V) {
    const m = (p.pets && p.pets[0]) || p, [ux, uz] = dirTo(m, x, z);
    for (let k = 0; k < 4; k++) V.later(k * 0.06, () => H.cone(c, m.x, 0.8, m.z, ux, uz, 2.4, 14, { cols: [0xffd27a, 0xff6a1a, 0xff3a1a], s0: 0.15, s1: 0.65, cone: 0.28, k: 2.2 }));
    for (let i = 1; i <= 4; i++) V.later(0.1 + i * 0.05, () => V.decal(m.x + ux * i * 0.7, m.z + uz * i * 0.7, 1, 0.5, { dur: 3 }));
    V.shake(0.1);
  },
  // Liora: an encore: notes fly up round her and come down all over the target
  encore(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2, sx = p.x + cos(a) * 0.6, sz = p.z + sin(a) * 0.6, t = rnd(0.35, 0.5), tx = x + rnd(-0.8, 0.8), tz = z + rnd(-0.8, 0.8);
      V.put(true, sx, 1.4, sz, (tx - sx) / t, rnd(1, 3), (tz - sz) / t, t, 0, 6, 0.22, 0.18, V.CELL.note, 0, V.lin(i % 2 ? c.c[0] : c.c[1], 2.4), 1, rnd(-0.3, 0.3), 0, i * 0.02);
      V.later(t + i * 0.02, () => { H.ring(c, tx, tz, 0.6, 1.8, 0.3); H.flash(tx, 0.5, tz, 0.6, c.c[2], 1.4); }); }
    H.flash(p.x, 1.4, p.z, 1.4, c.c[0], 1.6);
  },
  // Tessar: the clockwork turns: a rune circle, gears flung outward, the hands ticking round
  gearstorm(c, ev, p, x, z, H, V) {
    V.decal(x, z, 6, 2, { col: c.c[0], k: 1.8, dur: 1.2, speed: 1 });
    blast(V, x, 0.5, z, { n: 18, cols: [c.c[0], c.c[1]], cell: "rune", size: 0.2, speed: [2, 5], flat: true, spin: 10, k: 2, life: [0.5, 0.8] });
    for (let i = 0; i < 6; i++) V.later(i * 0.07, () => { const a = (i / 6) * PI * 2; H.line([x, 0.1, z], [x + sin(a) * 1.8, 0.1, z + cos(a) * 1.8], c.c[1], 0.05, 0.3); });
    H.screen(x, z, { shake: 0.12 });
  },
  // Brann: an anvil comes down out of the storm, lightning riding it
  anvilDrop(c, ev, p, x, z, H, V) {
    V.put(false, x, 7, z, 0, -6.6 / 0.4, 0, 0.4, 0, 0, 0.7, 0.7, V.CELL.pixel, 0, V.lin(0x2a2a30), 1);
    V.later(0.38, () => { V.bolt([x + 0.3, 9, z - 0.5], [x, 0.08, z], { col: c.c[0], w: 0.2, dur: 0.3, forks: 3, depth: 6, jag: 0.12 }); H.explode(c, x, z, 1.4, 1); blast(V, x, 0.4, z, { n: 40, cols: [0xffd23a, 0xffffff], stretch: 1.8, speed: [4, 10], size: 0.05, up: 3 }); H.screen(x, z, { shake: 0.35, flash: [c.c[0], 0.2] }); });
  },
  // Isolde: a garden of thorns: rose petals storm round the target and the ground blooms red
  roseGarden(c, ev, p, x, z, H, V) {
    H.vortex(c, x, z, 1.8, 40, { cell: "petal", add: false, spin: 4, life: 0.8, h: 1.4, size: 0.15 });
    for (let i = 0; i < 5; i++) { const a = rnd(0, PI * 2), d = rnd(0.3, 1.4); V.later(i * 0.08, () => V.decal(x + cos(a) * d, z + sin(a) * d, 5, 0.45, { col: 0x8a1a2a, dur: 2.5 })); }
    V.decal(x, z, 3, 1.6, { col: c.c[0], k: 1.4, dur: 1 });
  },
  // ---------------- Mythic ----------------
  // Azhar: a total eclipse over the target: a black disc, its corona, the dark spilling out
  eclipse(c, ev, p, x, z, H, V) {
    V.put(false, x, 2.2, z, 0, 0, 0, 0.8, 0, 0, 1.2, 1.4, V.CELL.dot, 0, V.lin(0x08040c), 0.95);
    V.put(true, x, 2.2, z, 0, 0, 0, 0.8, 0, 0, 1.0, 1.9, V.CELL.ring, 0, V.lin(c.c[1], 2.6), 1);
    blast(V, x, 2.2, z, { n: 24, cols: [c.c[1], 0xffffff], cell: "streak", stretch: 2.5, speed: [3, 6], size: 0.07, grav: 0, life: [0.3, 0.6] });
    V.decal(x, z, 8, 2, { col: 0x100818, dur: 1.6 }); H.ring(c, x, z, 2.2, 2, 0.5, c.c[1]); H.screen(x, z, { shake: 0.2 });
  },
  // the Conductor: a crescendo: shock after shock rolling out, the notes thrown with them
  crescendo(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 5; i++) V.later(i * 0.09, () => { H.ring(c, x, z, 0.8 + i * 0.45, 1.8, 0.4, i % 2 ? c.c[1] : 0xffffff); V.ripple(x, 0.4, z, 0.003, 1.5); });
    blast(V, x, 0.8, z, { n: 24, cols: [c.c[0], c.c[1]], cell: "note", size: 0.22, speed: [2, 5], flat: true, spin: 2, k: 2.2, life: [0.5, 0.8] });
  },
  // Velka: daybreak: a wave of dawn sweeps down the line, light standing up along it, feathers drifting after
  daybreak(c, ev, p, x, z, H, V) {
    const [ux, uz] = dirTo(p, x, z);
    V.crescent(p.x, p.z, ux, uz, 6, 13, { r: 1.9, col: c.c[1], core: 0xffffff });
    for (let i = 1; i <= 6; i++) V.later(i * 0.07, () => { const bx = p.x + ux * i, bz = p.z + uz * i; V.burst(true, bx, 0.1, bz, 8, { cols: [c.c[0], 0xffffff], dir: [0, 1, 0], cone: 0.05, speed: [5, 9], life: [0.25, 0.4], size: [0.1, 0.03], cell: V.CELL.hot, stretch: 2, k: 3, spread: 0.3, flatSpread: true }); });
    V.burst(true, x, 2, z, 14, { cols: [c.c[0], 0xffffff], speed: [0.3, 1], life: [1, 1.6], size: [0.15, 0.1], cell: V.CELL.feather, grav: 0.8, spin: 3, spread: 1.5 });
  },
  // Ouroboros: the coil closes: the serpent's runes circle in tight and bite
  constrict(c, ev, p, x, z, H, V) {
    V.decal(x, z, 6, 1.8, { col: c.c[0], k: 1.8, dur: 1, speed: 1.5 });
    H.vortex(c, x, z, 2, 30, { cell: "rune", spin: 4, life: 0.6, h: 1.2, size: 0.15 });
    V.later(0.5, () => { H.flash(x, 0.6, z, 2, c.c[0], 1.8); H.ring(c, x, z, 1.6, 2, 0.3); });
  },
  // Kestrel: overclock: a fan of lasers sweeps the area, pixels everywhere
  overclock(c, ev, p, x, z, H, V) {
    const a0 = Math.atan2(x - p.x, z - p.z);
    for (let i = 0; i < 7; i++) V.later(i * 0.04, () => { const a = a0 - 0.5 + i * (1 / 6), l = Math.hypot(x - p.x, z - p.z) + 1.5; H.line([p.x, 1.1, p.z], [p.x + sin(a) * l, 0.4, p.z + cos(a) * l], i % 2 ? c.c[0] : c.c[1], 0.05, 0.14); });
    blast(V, x, 0.6, z, { n: 30, cols: [c.c[0], c.c[1], 0xffffff], cell: "pixel", size: 0.12, speed: [2, 6], spin: 6 });
    H.screen(x, z, { chroma: 0.006 });
  },
  // Lady Vermilion: the parasol opens and a storm of crimson petals spins out round the target
  crimsonBloom(c, ev, p, x, z, H, V) {
    blast(V, x, 0.7, z, { n: 50, cols: [c.c[0], c.c[1], 0xffffff], cell: "petal", size: 0.16, speed: [2, 6], flat: true, spin: 6, add: false, k: 1, grav: 1, life: [0.7, 1.1] });
    for (let i = 0; i < 4; i++) V.slash(x, 0.7, z, { ang: (i / 4) * PI * 2, tilt: 0.3, r: 1.3, col: c.c[0], core: c.c[2], dur: 0.25, delay: i * 0.04 });
    V.decal(x, z, 3, 1.8, { col: c.c[0], k: 1.6, dur: 1 });
  },
  // Kairo: the sovereign storm: five strikes come down across the area under a gathering sky
  thunderstorm(c, ev, p, x, z, H, V) {
    V.burst(false, x + 0.5, 8.4, z - 0.7, 12, { cols: [0x2a3040, 0x3a4256], flat: true, speed: [0.4, 1], life: [1, 1.6], size: [1.4, 2.4], cell: V.CELL.smoke, a: 0.75, drag: 1, spread: 1 });
    for (let i = 0; i < 5; i++) { const ox = x + rnd(-1.8, 1.8), oz = z + rnd(-1.8, 1.8); V.later(0.06 + i * 0.08, () => { V.bolt([ox + 0.4, 9, oz - 0.6], [ox, 0.08, oz], { col: c.c[0], w: 0.14, dur: 0.24, forks: 2, depth: 5, jag: 0.14 }); H.ring(c, ox, oz, 1, 2.2, 0.35); V.shake(0.08); }); }
  },
  // Nocturne: the veil of night falls: the ground goes dark and stars rain into it
  nightVeil(c, ev, p, x, z, H, V) {
    V.decal(x, z, 5, 2, { col: 0x140a24, dur: 2.2 });
    H.rain(c, x, z, 1.8, 14, { cell: "star", size: 0.14, stretch: 0.5, fall: 0.5, spread: 0.6, ox: 0.4, oz: -0.4 });
    V.flash(c.c[0], 0.12);
  },
  // Solenne: a solar flare bursts on the target: a second sun, its rays, the air shimmering
  solarFlare(c, ev, p, x, z, H, V) {
    H.flash(x, 0.8, z, 4, 0xfff2c8, 2.6, 0.2);
    blast(V, x, 0.8, z, { n: 30, cols: [c.c[0], 0xffffff], cell: "streak", stretch: 3, speed: [5, 10], size: 0.08, grav: 0, life: [0.25, 0.45] });
    H.ring(c, x, z, 2.4, 2.2, 0.5); V.decal(x, z, 1, 1.4, { dur: 3 }); H.screen(x, z, { ripple: 0.008, shake: 0.15 });
  },
  // Mirelle: a tidal wave rolls down the road onto them
  tsunami(c, ev, p, x, z, H, V) {
    const [ux, uz] = dirTo(p, x, z);
    for (let i = 0; i < 8; i++) { const bx = p.x + ux * (0.8 + i * 0.55), bz = p.z + uz * (0.8 + i * 0.55); V.later(i * 0.06, () => { blast(V, bx, 0.2, bz, { n: 10, cols: [c.c[0], c.c[1], 0xffffff], cell: "drop", size: 0.14, speed: [1, 3], up: 3, grav: 9, k: 2 }); V.decal(bx, bz, 7, 0.6, { col: c.c[0], dur: 1.6 }); }); }
    V.later(0.5, () => { H.ring(c, x, z, 2, 2, 0.4); H.bits(c, x, 0.3, z, 14, { r: 1 }); });
  },
  // Pyrrhos: the phoenix dives out of the sky onto the target and bursts
  phoenixDive(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 24; i++) { const t = 0.35, sx = x + 2.5 + rnd(-0.4, 0.4), sy = 6 + rnd(-0.4, 0.4), sz = z - 2.5 + rnd(-0.4, 0.4); V.put(true, sx, sy, sz, (x - sx) / t, (0.5 - sy) / t, (z - sz) / t, t, 0, 0, 0.2, 0.1, V.CELL.feather, 0.4, V.lin(i % 2 ? c.c[0] : c.c[1], 2.6), 1, 0, 0, rnd(0, 0.08)); }
    V.later(0.36, () => { H.explode(c, x, z, 1.6, 1.2); H.erupt(c, x, z, 0.6, 1.6); H.screen(x, z, { shake: 0.25, flash: [0xff8a2a, 0.15] }); });
  },
  // Sylvara: the forest's wrath: trees of green light burst up round them
  grove(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2, bx = x + cos(a) * 1.2, bz = z + sin(a) * 1.2; V.later(i * 0.05, () => { H.erupt(c, bx, bz, 0.35, 1.8); V.decal(bx, bz, 4, 0.6, { col: 0x2a3a1a, dur: 2 }); }); }
    H.bits(c, x, 2, z, 24, { r: 1.6, mode: "fall" }); V.decal(x, z, 3, 1.8, { col: c.c[0], k: 1.3, dur: 1.2 });
  },
  // Thalor: a shower of comets
  cometShower(c, ev, p, x, z, H, V) {
    H.rain(c, x, z, 1.8, 6, { cell: "star", size: 0.3, stretch: 1.2, fall: 0.5, spread: 0.5, ox: 2, oz: -2, h: 7, hit: (bx, bz) => { H.explode(c, bx, bz, 0.8, 0.6); } });
  },
  // Nyx: a lullaby: slow rings of dream drift out, bubbles rising, and they sleep
  lullaby(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 4; i++) V.later(i * 0.2, () => V.decal(x, z, 0, 1 + i * 0.4, { col: i % 2 ? c.c[1] : c.c[0], k: 1.2, dur: 0.9 }));
    blast(V, x, 0.4, z, { n: 20, cols: [c.c[0], c.c[1]], cell: "bubble", size: 0.2, speed: [0.3, 1], up: 1.5, grav: -0.5, life: [1, 1.6], k: 1.6 });
    for (const e of enemiesNear(x, z, 2)) V.burst(true, e.x, 1.2, e.z, 3, { cols: [0xffd0f0], speed: [0.2, 0.5], up: 0.8, life: [0.8, 1.2], size: [0.12, 0.08], cell: V.CELL.note, k: 2, grav: -0.3 });
    V.flash(c.c[0], 0.1);
  },
  // ---------------- Secret ----------------
  // the Unwritten: a blank page: ink rains in splashes and the colour drains for a moment
  inkStorm(c, ev, p, x, z, H, V) {
    H.rain(c, x, z, 1.8, 10, { cell: "drop", col: 0x101014, add: false, size: 0.2, stretch: 0, fall: 0.35, spread: 0.4, ox: 0, oz: 0, hit: (bx, bz) => V.decal(bx, bz, 5, 0.5, { col: 0x08080c, dur: 2.5 }) });
    V.flash(0xffffff, 0.15); V.chroma(0.004);
    blast(V, x, 0.6, z, { n: 20, cols: [0xffffff], cell: "pixel", size: 0.08, speed: [2, 5] });
  },
  // Null Saint: nullify: a white pillar, the world blinks to nothing round it
  nullify(c, ev, p, x, z, H, V) {
    H.pillar(c, x, z, 1.4, 0xffffff); V.flash(0xffffff, 0.3); V.chroma(0.008);
    H.ringBurst(c, x, z, 1.5, 12, { step: 0.015, at: (px, pz) => blast(V, px, 0.5, pz, { n: 5, cols: [0xffffff], cell: "pixel", size: 0.09, speed: [1, 3] }) });
  },
  // Aster: the end of stars: they fall
  starfall(c, ev, p, x, z, H, V) {
    H.rain(c, x, z, 2, 16, { cell: "star", size: 0.2, stretch: 0.8, fall: 0.45, spread: 0.6, ox: 1.5, oz: -1.5, h: 8, hit: (bx, bz) => { H.flash(bx, 0.3, bz, 0.8, c.c[1], 1.6); H.ring(c, bx, bz, 0.6, 1.6, 0.3); } });
  },
  // Omen: black rain: shards of nothing fall, red light where they land
  omenRain(c, ev, p, x, z, H, V) {
    H.rain(c, x, z, 1.8, 14, { cell: "shard", col: 0x14081c, add: false, size: 0.22, stretch: 0, fall: 0.35, spread: 0.5, ox: 0, oz: 0, hit: (bx, bz) => { H.flash(bx, 0.3, bz, 0.6, c.c[1], 1.6); } });
    V.decal(x, z, 5, 1.5, { col: 0x14081c, dur: 2 });
  },
  // Channel Zero: signal lost: static fills the area, white noise and stray bolts
  staticField(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 60; i++) { const a = rnd(0, PI * 2), d = Math.sqrt(Math.random()) * 1.8; V.put(true, x + cos(a) * d, rnd(0.1, 1.2), z + sin(a) * d, 0, 0, 0, rnd(0.05, 0.3), 0, 0, 0.1, 0.1, V.CELL.pixel, 0, V.lin(Math.random() < 0.5 ? 0xffffff : 0x8a8a98, 2), 1, 0, 0, rnd(0, 0.4)); }
    for (let i = 0; i < 4; i++) V.later(i * 0.08, () => V.bolt([x + rnd(-1.5, 1.5), 0.6, z + rnd(-1.5, 1.5)], [x + rnd(-1.5, 1.5), 0.6, z + rnd(-1.5, 1.5)], { col: 0xffffff, w: 0.05, dur: 0.12, depth: 4, jag: 0.4 }));
    V.chroma(0.01);
  },
  // the Crownless: a crown of thorns: shards burst out of the ground in a ring
  thornCrown(c, ev, p, x, z, H, V) {
    H.ringBurst(c, x, z, 1.3, 10, { step: 0.02, at: (px, pz, a) => { V.burst(true, px, 0.2, pz, 6, { cols: [c.c[0], 0xffffff], dir: [cos(a) * 0.3, 1, sin(a) * 0.3], cone: 0.2, speed: [3, 6], life: [0.3, 0.5], size: [0.14, 0.04], cell: V.CELL.shard, k: 2.2, spin: 6 }); V.decal(px, pz, 4, 0.4, { col: 0x231c18, dur: 1.5 }); } });
    H.flash(x, 0.6, z, 2, 0xffffff, 1.4);
  },
  // Mirror Saint: a hall of mirrors: the ray bounces between points of light all round
  hallOfMirrors(c, ev, p, x, z, H, V) {
    let ax = x, az = z;
    for (let i = 0; i < 7; i++) { const a = rnd(0, PI * 2), d = rnd(0.8, 1.8), bx = x + cos(a) * d, bz = z + sin(a) * d, fx = ax, fz = az; V.later(i * 0.04, () => { H.line([fx, 0.6, fz], [bx, 0.6, bz], i % 2 ? c.c[1] : 0xffffff, 0.06, 0.2); H.flash(bx, 0.6, bz, 0.7, 0xffffff, 1.8); }); ax = bx; az = bz; }
  },
  // Reverb: a feedback loop: the blast comes back three more times, louder each time
  echoes(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 3; i++) V.later(0.15 + i * 0.15, () => { H.ring(c, p.x, p.z, 2 + i * 0.3, 1.0 + i * 0.2, 0.35, i % 2 ? 0xffffff : c.c[0]); V.chroma(0.004 + i * 0.002); V.ripple(p.x, 0.3, p.z, 0.003, 1.6); });
  },
  // Folded Moon: an origami eclipse: paper folds out from the mark and back in under a paper moon
  origami(c, ev, p, x, z, H, V) {
    blast(V, x, 0.8, z, { n: 24, cols: [0xf4f1e8, c.c[0]], cell: "pixel", size: 0.14, speed: [2, 4], flat: true, spin: 10, add: false, k: 1, grav: 0, life: [0.4, 0.6] });
    V.later(0.35, () => H.vortex(c, x, z, 1.6, 24, { cell: "pixel", add: false, cols: [0xf4f1e8, c.c[0]], spin: 3, life: 0.4, size: 0.12 }));
    H.flash(x, 2.4, z, 1.0, c.c[0], 1.4, 0.6); V.decal(x, z, 6, 1.6, { col: c.c[0], k: 1.6, dur: 1 });
  },
  // Hollow: echo: the cut happens again, and again, a little late each time
  echoCut(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 4; i++) V.later(0.1 + i * 0.1, () => { V.slash(x, 0.65, z, { ang: p.face + i * 0.4, tilt: i % 2 ? 0.5 : -0.5, r: 1.2 + i * 0.1, col: 0xffffff, core: 0xffffff, k: 1.4 - i * 0.2, dur: 0.22 }); H.ring(c, x, z, 0.8 + i * 0.2, 1.2, 0.3, 0xffffff); });
  },
  // Cipher: root access: green code rains over the area, the ground lit with a rune
  decrypt(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 40; i++) { const a = rnd(0, PI * 2), d = Math.sqrt(Math.random()) * 1.8; V.put(true, x + cos(a) * d, rnd(2, 3.5), z + sin(a) * d, 0, -rnd(4, 7), 0, 0.45, 0, 0, 0.1, 0.1, V.CELL.pixel, 0.6, V.lin(c.c[0], 2.4), 1, 0, 0, rnd(0, 0.4)); }
    V.decal(x, z, 6, 1.8, { col: c.c[0], k: 1.6, dur: 1.2, speed: 1.5 });
  },
  // Riftling: a tear opens over the target, the world pulled into it
  tear(c, ev, p, x, z, H, V) {
    V.bolt([x, 2.6, z], [x, 0.1, z], { col: c.c[0], w: 0.1, dur: 0.6, depth: 5, jag: 0.12 });
    H.vortex(c, x, z, 1.6, 26, { cell: "pixel", spin: 4, life: 0.55, h: 2, cols: [c.c[0], c.c[1], 0xffffff] });
    V.decal(x, z, 8, 1.3, { col: c.c[0], k: 1.4, add: true, dur: 1.2, speed: 1.6 }); V.chroma(0.006);
  },
  // ---------------- Divine ----------------
  // Seraphine: judgment: pillars of light on everything near the target
  judgment(c, ev, p, x, z, H, V) {
    const list = enemiesNear(x, z, 3).slice(0, 6);
    if (!list.length) list.push({ x, z });
    list.forEach((e, i) => V.later(i * 0.06, () => H.pillar(c, e.x, e.z, 0.9)));
    V.burst(true, x, 2.5, z, 16, { cols: [0xffffff, c.c[1]], speed: [0.3, 1], life: [1, 1.6], size: [0.15, 0.1], cell: V.CELL.feather, grav: 0.8, spin: 3, spread: 2 });
    V.flash(0xfff6d8, 0.25);
  },
  // Vorrhal: devour: the maw opens wide and pulls everything near into the dark
  devour(c, ev, p, x, z, H, V) {
    V.decal(x, z, 8, 2.4, { col: 0x08040c, dur: 1.6, speed: 2 });
    H.vortex(c, x, z, 2.6, 50, { cell: "smoke", add: false, cols: [0x14081c, 0x2a0a3a], spin: 3, life: 0.7, size: 0.3 });
    H.vortex(c, x, z, 2.2, 30, { cell: "hot", cols: [c.c[1], 0xffffff], spin: 4, life: 0.6, stretch: 1.4 });
    V.later(0.6, () => { H.flash(x, 0.6, z, 2.4, c.c[1], 2); H.ring(c, x, z, 2.4, 2.2, 0.5, c.c[1]); H.screen(x, z, { shake: 0.35, ripple: 0.012, chroma: 0.008 }); });
  },
  // Chronarch: the hour hand: a clock face as wide as the road, its hand sweeping round once
  hourHand(c, ev, p, x, z, H, V) {
    V.decal(p.x, p.z, 6, 3, { col: c.c[0], k: 1.2, dur: 1.4, speed: 0.3 });
    for (let i = 0; i < 12; i++) V.later(i * 0.05, () => { const a = (i / 12) * PI * 2; H.line([p.x, 0.12, p.z], [p.x + sin(a) * 2.8, 0.12, p.z + cos(a) * 2.8], c.c[i === 11 ? 1 : 0], 0.07, 0.15); });
    blast(V, p.x, 1.2, p.z, { n: 24, cols: [c.c[0], c.c[1]], cell: "rune", size: 0.18, speed: [2, 4], flat: true, spin: 3, k: 2, life: [0.6, 1] });
    V.flash(0xffffff, 0.15); V.chroma(0.005);
  },
  // Solvane: the sun unbound: a supernova where it lands
  supernova(c, ev, p, x, z, H, V) {
    H.flash(x, 0.8, z, 5, 0xffffff, 2.6, 0.22);
    blast(V, x, 0.8, z, { n: 50, cols: [c.c[0], c.c[1], 0xffffff], cell: "hot", size: 0.08, stretch: 2, speed: [6, 12], up: 1, grav: 2, life: [0.3, 0.6] });
    for (let i = 0; i < 3; i++) V.later(i * 0.1, () => H.ring(c, x, z, 2 + i * 0.8, 2.2 - i * 0.4, 0.5, i % 2 ? 0xffffff : c.c[0]));
    V.decal(x, z, 1, 1.6, { dur: 4 }); H.screen(x, z, { shake: 0.35, ripple: 0.01 });
  },
  // Marisol: an abyssal whirlpool swallows the road
  whirlpool(c, ev, p, x, z, H, V) {
    V.decal(x, z, 8, 2.4, { col: c.c[0], k: 1.4, add: true, dur: 1.8, speed: 2 });
    H.vortex(c, x, z, 2.4, 50, { cell: "drop", spin: 4, life: 0.8, h: 0.6, cols: [c.c[0], c.c[1], 0xffffff], size: 0.12 });
    H.vortex(c, x, z, 2, 20, { cell: "bubble", spin: 3, life: 0.9, h: 1, size: 0.16 });
    H.ring(c, x, z, 2.6, 1.6, 0.6);
  },
  // Hrimgard: absolute zero: a forest of ice bursts up over the whole area
  absoluteZero(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 14; i++) { const a = rnd(0, PI * 2), d = Math.sqrt(Math.random()) * 2; V.later(i * 0.025, () => V.spikes(x + cos(a) * d, z + sin(a) * d, rnd(1, 1.8))); }
    V.decal(x, z, 2, 2.4, { col: c.c[0], k: 0.7, dur: 2.5 });
    blast(V, x, 2, z, { n: 30, cols: [0xffffff, c.c[0]], cell: "star", size: 0.1, speed: [0.3, 1], grav: 1, life: [1, 1.6], spin: 3 });
    V.flash(0xbfe8ff, 0.18); V.shake(0.2);
  },
  // Anima: the world tree rises: a trunk of light, leaves falling over everything
  worldTree(c, ev, p, x, z, H, V) {
    V.burst(true, x, 0.1, z, 50, { cols: [c.c[0], c.c[1], 0xffffff], dir: [0, 1, 0], cone: 0.08, speed: [5, 10], life: [0.5, 0.8], size: [0.2, 0.05], cell: V.CELL.hot, stretch: 1.6, k: 2.4, spread: 0.4, flatSpread: true });
    V.later(0.4, () => blast(V, x, 4.5, z, { n: 40, cols: [c.c[0], c.c[1]], cell: "leaf", size: 0.16, speed: [1.5, 3], flat: true, grav: 1.5, life: [1.2, 1.8], spin: 5, add: false, k: 1 }));
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; H.fissure(c, x, z, x + cos(a) * 2, z + sin(a) * 2, 4, { step: 0.06, h: 0.7 }); }
  },
  // Requiem: the final choir: violet rings, the dead rising, their song in the air
  requiem(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 5; i++) V.later(i * 0.1, () => H.ring(c, p.x, p.z, 1.2 + i * 0.4, 1.6, 0.5, i % 2 ? c.c[1] : c.c[0]));
    for (let i = 0; i < 20; i++) { const a = rnd(0, PI * 2), d = rnd(0.5, 2.6); V.put(true, p.x + cos(a) * d, 0.1, p.z + sin(a) * d, 0, rnd(1, 2), 0, rnd(1, 1.6), 0.4, -0.3, 0.26, 0.06, V.CELL.dot, 0, V.lin(c.c[0], 2), 1, 0, 0, rnd(0, 0.5)); }
    blast(V, p.x, 1.6, p.z, { n: 16, cols: [c.c[0], 0xffffff], cell: "note", size: 0.2, speed: [1, 2.5], grav: -0.5, life: [0.8, 1.2], k: 2 });
    V.flash(c.c[1], 0.15);
  },
  // Astraea: the scales: two pillars weigh the target between them, stars thrown out
  scales(c, ev, p, x, z, H, V) {
    H.pillar(c, x - 1, z + 0.6, 0.9); V.later(0.12, () => H.pillar(c, x + 1, z - 0.6, 0.9, c.c[1]));
    V.later(0.25, () => { blast(V, x, 0.8, z, { n: 30, cols: [0xffffff, c.c[1]], cell: "star", size: 0.14, speed: [2, 5], spin: 5 }); V.decal(x, z, 6, 1.8, { col: c.c[0], k: 1.6, dur: 1 }); });
  },
  // Veyra: a tempest: lightning everywhere, the wind tearing round
  tempest(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 6; i++) { const ox = x + rnd(-2, 2), oz = z + rnd(-2, 2); V.later(i * 0.06, () => { V.bolt([ox + 0.4, 9, oz - 0.6], [ox, 0.08, oz], { col: i % 2 ? c.c[1] : c.c[0], w: 0.13, dur: 0.22, forks: 2, depth: 5, jag: 0.15 }); H.ring(c, ox, oz, 0.9, 2, 0.3, i % 2 ? c.c[1] : c.c[0]); }); }
    H.vortex(c, x, z, 2.4, 30, { cell: "streak", spin: 6, life: 0.5, h: 2, stretch: 1.8 });
    H.screen(x, z, { shake: 0.3, flash: [c.c[0], 0.15] });
  },
  // Seam: seamless: the rift is cut open in a cross, the warden's blade leaving it gaping
  riftCleave(c, ev, p, x, z, H, V) {
    V.slash(x, 0.7, z, { ang: p.face, tilt: 0.7, r: 2, col: c.c[0], core: 0xffffff, dur: 0.3 }); V.slash(x, 0.7, z, { ang: p.face, tilt: -0.7, r: 2, col: c.c[1], core: 0xffffff, dur: 0.3, delay: 0.06, flip: true });
    V.later(0.12, () => { V.bolt([x - 1.4, 0.7, z - 1.4], [x + 1.4, 0.7, z + 1.4], { col: c.c[0], w: 0.1, dur: 0.5, depth: 5, jag: 0.1 }); H.vortex(c, x, z, 1.6, 24, { cell: "pixel", spin: 4, life: 0.5, cols: [c.c[0], c.c[1]] }); V.decal(x, z, 8, 1.6, { col: c.c[0], add: true, k: 1.4, dur: 1.2 }); V.chroma(0.008); });
  },
  // ---------------- Transcendent ----------------
  // Lumina: an aurora hangs over the road in curtains of every colour
  auroraCurtain(c, ev, p, x, z, H, V) {
    const [ux, uz] = dirTo(p, x, z), px = -uz, pz = ux;
    for (let i = 0; i < 24; i++) { const k = (i / 23 - 0.5) * 4, bx = x + px * k, bz = z + pz * k; V.burst(true, bx, 0.2, bz, 3, { cols: [RB[i % 6]], dir: [0, 1, 0], cone: 0.03, speed: [3, 5], life: [0.6, 0.9], size: [0.18, 0.05], cell: V.CELL.streak, stretch: 2.5, k: 2.2, delay: i * 0.015 }); }
    blast(V, x, 1.5, z, { n: 20, cols: RB, cell: "star", size: 0.12, speed: [0.5, 1.5], grav: 0, life: [0.8, 1.2], spin: 3 });
  },
  // Kaelith: a big bang: everything pulled to a point, then thrown out as new stars
  bigBang(c, ev, p, x, z, H, V) {
    H.vortex(c, x, z, 2.4, 40, { cell: "star", spin: 2, life: 0.4, cols: RB, size: 0.1 });
    V.later(0.42, () => { H.flash(x, 0.7, z, 4, 0xffffff, 2.6, 0.2); blast(V, x, 0.7, z, { n: 60, cols: RB, cell: "star", size: 0.14, speed: [4, 10], spin: 6, life: [0.4, 0.8] }); for (let i = 0; i < 3; i++) V.later(i * 0.08, () => H.ring(c, x, z, 2 + i, 2 - i * 0.4, 0.5, RB[i * 2])); H.screen(x, z, { shake: 0.35, ripple: 0.012 }); });
  },
  // Orrisa: refraction: the lance splits into every colour and lands everywhere at once
  refraction(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2, bx = x + cos(a) * 2, bz = z + sin(a) * 2; V.later(i * 0.03, () => { H.line([x, 0.6, z], [bx, 0.5, bz], RB[i], 0.06, 0.25); H.flash(bx, 0.5, bz, 0.8, RB[i], 1.8); }); }
    H.flash(x, 0.6, z, 1.6, 0xffffff, 2);
  },
  // Zephyrine: a hurricane stands up on the road
  hurricane(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 6; i++) V.later(i * 0.08, () => H.vortex(c, x, z, 1.8, 18, { cell: "streak", spin: 7, life: 0.5, h: 3.5, stretch: 2, size: 0.1 }));
    blast(V, x, 1, z, { n: 20, cols: [0xffffff, c.c[0]], cell: "feather", size: 0.15, speed: [2, 4], flat: true, grav: 0.5, spin: 6, add: false, k: 1, life: [0.8, 1.2] });
    H.ring(c, x, z, 2.2, 1.6, 0.6); V.shake(0.15);
  },
  // Ordo: balance: the area turns black on one side, white on the other, and evens out
  balance(c, ev, p, x, z, H, V) {
    V.decal(x - 0.7, z, 5, 1.4, { col: 0x08080c, dur: 1.6 }); V.decal(x + 0.7, z, 3, 1.4, { col: 0xffffff, k: 1.4, dur: 1.2 });
    V.decal(x, z, 6, 2, { col: 0xffffff, k: 1.6, dur: 1.4, speed: 0.8 });
    H.line([x, 0.1, z - 2], [x, 0.1, z + 2], 0xffffff, 0.06, 0.6);
    V.flash(0xffffff, 0.2); V.chroma(0.01);
  },
  // Caelum: a constellation: stars light up round the target and are drawn together
  constellation(c, ev, p, x, z, H, V) {
    const pts = []; for (let i = 0; i < 7; i++) { const a = rnd(0, PI * 2), d = rnd(0.6, 2); pts.push([x + cos(a) * d, rnd(0.5, 1.6), z + sin(a) * d]); }
    pts.forEach((q, i) => V.later(i * 0.05, () => { H.flash(q[0], q[1], q[2], 0.7, c.c[0], 2.2, 0.6); if (i) H.line(pts[i - 1], q, c.c[1], 0.035, 0.6); }));
    V.later(0.4, () => blast(V, x, 0.8, z, { n: 30, cols: [c.c[0], 0xffffff], cell: "star", size: 0.14, speed: [2, 5], spin: 5 }));
  },
  // Mnemos: remembrance: petals and leaves lift away and memories float up like bubbles
  remembrance(c, ev, p, x, z, H, V) {
    H.vortex(c, x, z, 1.8, 30, { cell: "petal", add: false, spin: 2, life: 1, h: 1.8, size: 0.15 });
    blast(V, x, 0.3, z, { n: 20, cols: [c.c[0], c.c[1], 0xffffff], cell: "bubble", size: 0.2, speed: [0.3, 1], up: 1.5, grav: -0.6, life: [1.2, 1.8], k: 1.6 });
    V.decal(x, z, 3, 2, { col: c.c[0], k: 1.3, dur: 1.4 });
  },
  // Vael: between worlds: the area flickers in and out, rifts opening and closing
  phase(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 4; i++) { const ox = x + rnd(-1.4, 1.4), oz = z + rnd(-1.4, 1.4); V.later(i * 0.08, () => { V.bolt([ox, 1.6, oz], [ox, 0.1, oz], { col: c.c[i % 2], w: 0.07, dur: 0.3, depth: 4, jag: 0.15 }); V.decal(ox, oz, 8, 0.6, { col: c.c[0], add: true, k: 1.4, dur: 0.6 }); }); }
    blast(V, x, 0.6, z, { n: 30, cols: [c.c[0], c.c[1], 0xffffff], cell: "pixel", size: 0.1, speed: [1, 4], spin: 6 }); V.chroma(0.008);
  },
  // ---------------- Primordial ----------------
  // Magmor: an eruption: a volcano opens under them, lava bombs raining all round
  eruption(c, ev, p, x, z, H, V) {
    V.decal(x, z, 4, 1.6, { col: 0x231c18, dur: 3 }); V.decal(x, z, 3, 1.4, { col: 0xff4a1a, k: 1.6, dur: 1.6 });
    V.burst(true, x, 0.1, z, 40, { cols: [0xffd27a, 0xff6a1a, 0xff3a1a], dir: [0, 1, 0], cone: 0.15, speed: [4, 9], life: [0.5, 0.9], size: [0.35, 0.1], cell: V.CELL.dot, k: 2.2, drag: 1 });
    H.rain(c, x, z, 2.2, 7, { cell: "dot", col: 0xff6a1a, size: 0.25, stretch: 0.6, fall: 0.6, spread: 0.5, ox: 0, oz: 0, h: 5, hit: (bx, bz) => H.explode(c, bx, bz, 0.6, 0.5) });
    H.screen(x, z, { shake: 0.35, ripple: 0.01 });
  },
  // Pelagra: the deluge: the sea comes down on the road
  deluge(c, ev, p, x, z, H, V) {
    H.rain(c, x, z, 2.2, 40, { cell: "drop", col: c.c[0], size: 0.14, stretch: 1, fall: 0.3, spread: 0.6, ox: 0, oz: 0, h: 5, hit: (bx, bz) => { if (Math.random() < 0.3) H.ring(c, bx, bz, 0.4, 1.4, 0.3); } });
    V.decal(x, z, 7, 2.2, { col: c.c[0], dur: 2.5 }); V.decal(x, z, 8, 1.8, { col: c.c[1], add: true, k: 1.2, dur: 1.6 });
  },
  // Gaiadon: tectonic: the ground breaks in three directions from the blow
  tectonic(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2 + rnd(0, 1); H.fissure(c, x, z, x + cos(a) * 2.8, z + sin(a) * 2.8, 7, { step: 0.04, h: 1.3 }); }
    V.burst(false, x, 0.4, z, 30, { cols: [0x8a6a4a, 0x6a5a4a], speed: [3, 7], up: 4, life: [0.7, 1.1], size: [0.18, 0.12], cell: V.CELL.shard, grav: 14, spin: 10 });
    // (30 Oct) the ripple bent the picture outward from the hit and read as a shove: a third of it, and of the shake
    H.screen(x, z, { shake: 0.16, ripple: 0.004 });
  },
  // Umbrael: endless night: the dark spreads over the area, its stars the only light
  endlessNight(c, ev, p, x, z, H, V) {
    V.decal(x, z, 5, 2.6, { col: 0x08040c, dur: 2.5 }); V.decal(x, z, 8, 2.2, { col: 0x100818, dur: 2 });
    blast(V, x, 0.6, z, { n: 30, cols: [c.c[1], 0xffffff], cell: "star", size: 0.12, speed: [1, 3], grav: 0, life: [0.8, 1.4], spin: 3 });
    H.ringBurst(c, x, z, 2, 12, { step: 0.02, at: (px, pz) => V.burst(false, px, 0.4, pz, 4, { cols: [0x14081c], speed: [1, 2], up: 1, life: [0.6, 0.9], size: [0.18, 0.1], cell: V.CELL.shard, grav: 6, spin: 8 }) });
    V.chroma(0.008); V.shake(0.2);
  },
  // Vitae: genesis: flowers burst open all over the road
  genesisBloom(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 8; i++) { const a = rnd(0, PI * 2), d = rnd(0.3, 2), bx = x + cos(a) * d, bz = z + sin(a) * d; V.later(i * 0.05, () => { blast(V, bx, 0.3, bz, { n: 10, cols: [c.c[0], 0xffffff, c.c[1]], cell: "petal", size: 0.15, speed: [1, 2.5], up: 1.5, grav: 1.5, add: false, k: 1, spin: 4, life: [0.8, 1.2] }); V.decal(bx, bz, 3, 0.6, { col: c.c[0], k: 1.4, dur: 1.2 }); }); }
    H.erupt(c, x, z, 0.5, 1.6);
  },
  // Ferrum: iron rain: hot iron comes down like hail
  ironRain(c, ev, p, x, z, H, V) {
    H.rain(c, x, z, 2, 16, { cell: "shard", col: 0x6a6a72, add: false, size: 0.18, stretch: 0, fall: 0.35, spread: 0.6, ox: 0.6, oz: -0.6, h: 6, hit: (bx, bz) => { V.burst(true, bx, 0.3, bz, 6, { cols: [0xffd27a, 0xff6a1a], speed: [2, 5], up: 2, life: [0.2, 0.4], size: [0.05, 0], cell: V.CELL.hot, stretch: 1.4, k: 3, grav: 8 }); V.decal(bx, bz, 3, 0.4, { col: 0xff6a1a, k: 1.4, dur: 0.6 }); } });
    V.shake(0.2);
  },
  // Zephra: a cyclone: a column of wind stands on the target and throws everything round
  cyclone(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 8; i++) V.later(i * 0.06, () => H.vortex(c, x, z, 1.4 + i * 0.05, 16, { cell: "streak", spin: 8, life: 0.45, h: 4, stretch: 2.2, size: 0.1 }));
    V.burst(false, x, 0.4, z, 20, { cols: [0xc8bca8, 0x8a7a6a], speed: [2, 4], up: 3, life: [0.8, 1.2], size: [0.1, 0.06], cell: V.CELL.shard, grav: 6, spin: 10 });
    H.ring(c, x, z, 2, 1.8, 0.6); V.shake(0.2);
  },
  // Kharon: the crossing: a line of lanterns along the road, the dead walking it
  crossing(c, ev, p, x, z, H, V) {
    const M = AF.Board.match(); if (!M) return;
    let d0 = 0, best = 1e9;
    for (let d = 0; d < M.map.len; d += 0.5) { const [px, pz] = AF.TD.posAt(M.map, d), dd = Math.hypot(px - x, pz - z); if (dd < best) { best = dd; d0 = d; } }
    for (let i = -4; i <= 4; i++) { const [px, pz] = AF.TD.posAt(M.map, Math.max(0, d0 + i * 0.6)); V.later((i + 4) * 0.05, () => { H.flash(px, 0.5, pz, 0.5, c.c[0], 1.3, 0.8); V.burst(true, px, 0.3, pz, 3, { cols: [c.c[0], 0xffffff], speed: [0.2, 0.6], up: 1.4, life: [0.8, 1.2], size: [0.2, 0.05], cell: V.CELL.dot, k: 2, grav: -0.5 }); }); }
    V.decal(x, z, 6, 1.6, { col: c.c[0], k: 1.6, dur: 1.4 });
  },
  // ---------------- Eternal ----------------
  // Aeon: the endless hour: a clock face over the whole area, time standing still in white light
  endless(c, ev, p, x, z, H, V) {
    V.decal(p.x, p.z, 6, 3.6, { col: c.c[1], k: 1.3, dur: 1.8, speed: -0.3 }); V.decal(p.x, p.z, 6, 2.4, { col: c.c[0], k: 1.2, dur: 1.8, speed: 0.5 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; V.later(i * 0.1, () => H.pillar(c, p.x + cos(a) * 2, p.z + sin(a) * 2, 0.8, c.c[1])); }
    blast(V, p.x, 1.4, p.z, { n: 36, cols: [0xffffff, c.c[1]], cell: "rune", size: 0.2, speed: [2, 5], flat: true, spin: 2, k: 2.2, life: [0.8, 1.2] });
    V.flash(0xffffff, 0.35); V.chroma(0.012); V.ripple(p.x, 0.4, p.z, 0.014, 1.2);
  },
  // Omnis: everything: a galaxy turns over the road and collapses into light
  allThatIs(c, ev, p, x, z, H, V) {
    V.decal(x, z, 8, 3, { col: c.c[0], add: true, k: 1.6, dur: 1.6, speed: 2 });
    H.vortex(c, x, z, 3, 70, { cell: "star", spin: 3, life: 0.8, cols: RB, size: 0.12, h: 1.6 });
    V.later(0.8, () => { H.flash(x, 0.8, z, 5, 0xffffff, 2.8, 0.25); blast(V, x, 0.8, z, { n: 70, cols: RB, cell: "star", size: 0.16, speed: [5, 12], spin: 6, life: [0.4, 0.9] }); for (let i = 0; i < 4; i++) V.later(i * 0.08, () => H.ring(c, x, z, 2 + i * 0.8, 2.2 - i * 0.3, 0.5, RB[i])); H.screen(x, z, { shake: 0.5, ripple: 0.016, chroma: 0.01 }); });
  },
  // Aurore: the last dawn: the sky opens and one great beam of morning comes down
  lastDawn(c, ev, p, x, z, H, V) {
    V.bolt([x, 12, z], [x, 0.05, z], { col: c.c[1], w: 0.9, dur: 0.6, depth: 1, jag: 0 }); V.bolt([x, 12, z], [x, 0.05, z], { col: 0xffffff, w: 0.35, dur: 0.6, depth: 1, jag: 0 });
    V.burst(true, x, 0.1, z, 50, { cols: [c.c[1], 0xffffff], dir: [0, 1, 0], cone: 0.04, speed: [8, 14], life: [0.3, 0.6], size: [0.15, 0.04], cell: V.CELL.hot, stretch: 2.6, k: 3, spread: 0.9, flatSpread: true });
    V.burst(true, x, 3, z, 24, { cols: [0xffffff, c.c[1]], speed: [0.3, 1], life: [1.2, 1.8], size: [0.18, 0.12], cell: V.CELL.feather, grav: 0.8, spin: 3, spread: 2.4 });
    V.decal(x, z, 3, 2.4, { col: c.c[1], k: 1.8, dur: 1.4 }); H.ring(c, x, z, 3, 2.2, 0.6, c.c[1]);
    V.flash(0xfff6d8, 0.4); V.shake(0.4); V.ripple(x, 0.4, z, 0.012, 1.3);
  },
  // Nihil: the quiet end: everything goes white, then the dark folds the area away
  quietEnd(c, ev, p, x, z, H, V) {
    V.flash(0xffffff, 0.5); V.chroma(0.014);
    V.later(0.15, () => { V.decal(x, z, 8, 2.8, { col: 0x08080c, dur: 2, speed: 2.5 }); H.vortex(c, x, z, 3, 50, { cell: "pixel", add: false, cols: [0x08080c, 0xffffff], spin: 3, life: 0.6, size: 0.12 }); });
    V.later(0.75, () => { H.ring(c, x, z, 2.6, 2.2, 0.5, 0xffffff); V.ripple(x, 0.4, z, 0.016, 1.2); V.shake(0.4); });
  },
  // Axiom: the heart of the rift: a cross of rifts, pillars at its four ends, the world pulled through
  axiom(c, ev, p, x, z, H, V) {
    for (let i = 0; i < 2; i++) V.slash(x, 0.8, z, { ang: p.face + i * PI / 2, tilt: 0, pitch: 1.0, r: 2.4, col: c.c[i], core: 0xffffff, dur: 0.32, delay: i * 0.06 });
    for (let i = 0; i < 4; i++) { const a = p.face + (i / 4) * PI * 2 + PI / 4; V.later(0.15 + i * 0.05, () => H.pillar(c, x + sin(a) * 2, z + cos(a) * 2, 0.8, c.c[i % 2])); }
    V.later(0.2, () => { H.vortex(c, x, z, 2.4, 40, { cell: "pixel", spin: 4, life: 0.6, cols: [c.c[0], c.c[1], 0xffffff] }); V.decal(x, z, 8, 2.2, { col: c.c[0], add: true, k: 1.6, dur: 1.4 }); });
    V.later(0.6, () => { H.flash(x, 0.8, z, 4, 0xffffff, 2.4, 0.2); H.screen(x, z, { shake: 0.45, ripple: 0.014, chroma: 0.012 }); });
  },
};
})();
