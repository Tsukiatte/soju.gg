/* Aura Farm Defense: the units of the gates past the Rift (30 Oct, Chris approved the fifteen: "yea looks good then").
   Each has a passive, the "In Defense" line of its notes (AF.GATE_NOTES in units_gates.js), and a RELEASE: an ability
   with its own cooldown that turns the figure into its released form for a while (board.js) and does what the
   "Release" line says. td.js calls TD.G where these need it: before and after damage lands, after a unit fires, when a
   homing shot hits, when an enemy falls, when a wave starts, and once a step. Rules only, no drawing (tdrel.js draws
   the events sent here). Damage is in multiples of the unit's live damage (TD.live). */
(function () {
const AF = window.AF, TD = AF.TD, { hurt, afflict, near, lead, line } = TD._;
// bosses and brutes (3+ lives) shrug off most of what would stop them (29 Oct: "heavy units must never be stopped")
const heavy = e => e.def.boss || e.def.lives >= 3;
const alive = (M, p) => M.enemies.filter(e => e.hp > 0 && (!p || TD.can(p, e)));
const within = (M, p, r) => alive(M, p).filter(e => Math.hypot(e.x - p.x, e.z - p.z) <= r);
const firstOf = list => list.slice().sort((a, b) => b.d - a.d);
const key = p => p.u.k;
// run fn every gap seconds of a release
function every(p, gap, dt, fn) { p.relAcc = (p.relAcc || 0) + dt; while (p.relAcc >= gap) { p.relAcc -= gap; fn(); } }

// ---- what the team dealt over the last 10 seconds (Kagero's release), in quarter-second buckets ----
const BK = 40;
function logDmg(M, n) {
  const D = M.dlog || (M.dlog = { i: Math.floor(M.t * 4), b: new Float64Array(BK) }), i = Math.floor(M.t * 4);
  for (let j = D.i + 1; j <= i && j <= D.i + BK; j++) D.b[j % BK] = 0;
  if (i > D.i) D.i = i;
  D.b[i % BK] += n;
}
const logSum = M => { if (!M.dlog) return 0; logDmg(M, 0); let s = 0; for (const v of M.dlog.b) s += v; return s; };

// ---- Tsumugi's thread: an enemy she hits is sewn on; damage to one is shared by the rest (30%, half in her release) ----
const THREADS = 8;
function stitch(M, p, e) {
  if (e.hp <= 0) return;
  e.threadT = Math.max(e.threadT || 0, 6); e.threadP = p; e.threadAt = M.t;
  if (M.stitchT > 0) return;
  const on = M.enemies.filter(o => o.hp > 0 && o.threadT > 0);
  if (on.length > THREADS) { on.sort((a, b) => a.threadAt - b.threadAt); for (const o of on.slice(0, on.length - THREADS)) o.threadT = 0; }
}

// ---- the releases ----
// cd: seconds between releases (by rarity), dur: how long it runs (start does an instant one), global: it reaches the
// whole board (the auto release looks at every enemy, not just those in reach), want: when the auto release uses it
const CD = { divine: 45, transcendent: 55, primordial: 65, eternal: 75, absolute: 90 };
const SHOW = 3; // the released form stays on the board at least this long
const NEEDLE = { pierce: 99, speed: 60, w: 0.35 };
const R = TD.RELEASE = {
  // a rain of light arrows over the whole road for 4 s
  elske: { dur: 4, global: true, tick(M, p, dt, L) {
    every(p, 0.1, dt, () => {
      const list = alive(M, p); if (!list.length) return;
      const e = list[(Math.random() * list.length) | 0];
      hurt(M, p, e, L.atk * 0.45);
      near(M, e.x, e.z, 0.7, o => { if (o !== e) hurt(M, p, o, L.atk * 0.22); }, p);
      M.ev.push({ t: "relArrow", p, x: e.x, z: e.z });
    });
  } },
  // one great lance down the length of the road: everything on it is hit and knocked back
  dagnatt: { global: true, start(M, p, L) {
    const hits = alive(M, p);
    for (const e of hits) { hurt(M, p, e, L.atk * 3); afflict(M, p, e, { knock: 1.2 }, 0); }
    M.ev.push({ t: "relLance", p, n: hits.length });
  } },
  // twice his size, his shield a wall across the road: everything in front of it stops for 3 s and takes a slam
  bjarnulf: { dur: 6, start(M, p, L) {
    const r = L.rng * 1.8, hits = within(M, p, r);
    for (const e of hits) { hurt(M, p, e, L.atk * 3); e.stunT = Math.max(e.stunT || 0, e.def.boss ? 1 : heavy(e) ? 1.5 : 3); }
    M.ev.push({ t: "relWall", p, r, n: hits.length });
  } },
  // he pulls the blindfold down and looks: a huge hit on everything in his sight, pushed back up the road
  vidar: { start(M, p, L) {
    const r = L.rng * 2.2, hits = within(M, p, r);
    for (const e of hits) { hurt(M, p, e, L.atk * 8); afflict(M, p, e, { knock: 2 }, 0); }
    M.ev.push({ t: "relEyes", p, r, n: hits.length });
  } },
  // he takes back the light he lent: 4 s with every other unit still while he draws it in, then all of it at once, at
  // twice what they would have dealt, on every enemy
  ragnvald: { dur: 4, global: true, want: (M, p) => M.units.filter(o => o !== p && o.s.atk > 0).length >= 3, start(M, p) {
    let dps = 0;
    for (const o of M.units) if (o !== p && o.s.kind !== "farm") { const L = TD.live(o); dps += L.spa ? L.atk / L.spa : 0; o.hold = 4; }
    p.taken = dps * 4 * 2;
    M.ev.push({ t: "relTake", p });
  }, end(M, p) {
    const hits = alive(M, p);
    for (const e of hits) hurt(M, p, e, p.taken, "release");
    M.ev.push({ t: "relGive", p, n: hits.length });
  } },
  // twelve of him for 6 s, each one cutting a different enemy
  secondo: { dur: 6, tick(M, p, dt, L) {
    every(p, 0.5, dt, () => {
      const hits = firstOf(within(M, p, L.rng * 2)).slice(0, 12);
      for (const e of hits) hurt(M, p, e, L.atk * 0.8);
      if (hits.length) M.ev.push({ t: "relClones", p, pts: hits.map(e => [e.x, e.z]) });
    });
  } },
  // a howl: everything in range freezes with fear for 2 s, then he leaps through all of it
  lupo: { dur: 2, start(M, p, L) {
    p.fear = within(M, p, L.rng * 1.6);
    for (const e of p.fear) e.stunT = Math.max(e.stunT || 0, e.def.boss ? 0.6 : heavy(e) ? 1 : 2);
    M.ev.push({ t: "relHowl", p, r: L.rng * 1.6 });
  }, end(M, p, L) {
    const hits = (p.fear || []).filter(e => e.hp > 0);
    for (const e of hits) hurt(M, p, e, L.atk * 3);
    M.ev.push({ t: "relLeap", p, pts: hits.map(e => [e.x, e.z]) });
    p.fear = null;
  } },
  // every bomb of his on the board goes off at once, and his six arms lay a fresh row down the road
  molla: { global: true, start(M, p, L) {
    for (const s of M.proj) if (s.p === p && s.bomb) s.land = M.t;
    for (const e of firstOf(alive(M, p)).slice(0, 6)) {
      const [x, z] = lead(M, e, 1);
      M.proj.push({ p, sky: true, bomb: true, x, z, land: M.t + 1, delay: 1, r: 1.8, dmg: L.atk * 1.5, kind: "mortar", life: 0, st: p.s.cfg, sig: false });
    }
    M.ev.push({ t: "relEscape", p });
  } },
  // a spear of light down the whole road, then everything under 30% health dies (a boss under 10%)
  ultimo: { global: true, start(M, p, L) {
    const hits = alive(M, p);
    for (const e of hits) hurt(M, p, e, L.atk * 4);
    let kills = 0;
    for (const e of hits) if (e.hp > 0 && e.hp <= e.max * (e.def.boss ? 0.1 : 0.3)) { p.dealt += e.hp; e.hp = 0; kills++; M.ev.push({ t: "exec", p, x: e.x, z: e.z }); }
    M.ev.push({ t: "relSpear", p, n: hits.length, kills });
  } },
  // time stops for 5 s: only he moves, hanging a knife in front of every enemy; everything the team deals is held,
  // then lands at once, x1.5
  mezzanotte: { dur: 5, global: true, start(M, p) { M.tstop = 5; M.tstopP = p; M.ev.push({ t: "relStop", p }); },
    tick(M, p, dt, L) {
      M.tstop = Math.max(0.01, p.relT);
      every(p, 0.25, dt, () => { const list = alive(M, p); if (!list.length) return; const e = list[(Math.random() * list.length) | 0]; hurt(M, p, e, L.atk); M.ev.push({ t: "knife", p, x: e.x, z: e.z }); });
    },
    end(M, p) {
      M.tstop = 0; M.tstopP = null;
      for (const e of M.enemies) {
        e.stunT = 0;
        if (e.held > 0 && e.hp > 0) { const h = e.held, by = e.heldP && M.units.includes(e.heldP) ? e.heldP : p; e.held = 0; e.heldP = null; hurt(M, by, e, h * 1.5, "unheld"); }
      }
      M.ev.push({ t: "relResume", p });
    } },
  // the blade stabs out and back twelve times in one breath, down the whole road
  hisame: { dur: 1.2, global: true, start(M, p) { p.relN = 0; M.ev.push({ t: "relNeedles", p }); }, tick(M, p, dt, L) {
    every(p, 0.1, dt, () => {
      const list = firstOf(alive(M, p)); if (!list.length) return;
      const e = list[p.relN++ % Math.min(list.length, 4)], dx = e.x - p.x, dz = e.z - p.z, l = Math.hypot(dx, dz) || 1;
      p.face = Math.atan2(dx, dz);
      line(M, p, p.x, p.z, dx / l, dz / l, 40, Object.assign({}, p.s.cfg, NEEDLE), L.atk * 1.4, false);
    });
  } },
  // off comes the patch: Bloodlust counts double and every swing cleaves all round him, for 8 s
  kurogane: { dur: 8, start(M, p) { M.ev.push({ t: "relPatch", p }); } },
  // thousands of shards circle one stretch of road for 6 s and shred whatever walks in
  shirasagi: { dur: 6, start(M, p, L) {
    const e = firstOf(alive(M, p))[0];
    const [x, z] = e ? lead(M, e, 0.8) : [p.x, p.z];
    M.fields.push({ p, x, z, r: 2.4, t: 6, dur: 6, tick: 0.2, acc: 0, dmg: L.atk * 0.5, st: {}, kind: "field", pull: 0, id: M.id++, storm: true });
    M.ev.push({ t: "relStorm", p, x, z, r: 2.4 });
  } },
  // the whole board sewn together for 6 s, every hit shared by every enemy, then one cut through all of them
  tsumugi: { dur: 6, global: true, start(M, p) {
    M.stitchT = 6;
    for (const e of alive(M)) { e.threadT = Math.max(e.threadT || 0, 6.2); e.threadP = p; e.threadAt = M.t; }
    M.ev.push({ t: "relStitch", p });
  }, tick(M, p) {
    M.stitchT = p.relT;
    for (const e of alive(M)) if (!(e.threadT > 0)) { e.threadT = p.relT + 0.2; e.threadP = p; e.threadAt = M.t; }
  }, end(M, p, L) {
    M.stitchT = 0;
    const hits = alive(M, p);
    for (const e of hits) hurt(M, p, e, L.atk * 6);
    M.ev.push({ t: "relCut", p, n: hits.length });
  } },
  // the board turns to negative and nothing seems to happen; then every enemy takes all the damage the team dealt in
  // the last 10 seconds, at once
  kagero: { dur: 1.5, global: true, want: M => logSum(M) > 0, start(M, p) { p.truth = logSum(M); M.neg = 1.5; M.ev.push({ t: "relNeg", p, amount: p.truth }); },
    end(M, p) {
      M.neg = 0;
      const hits = alive(M, p);
      for (const e of hits) hurt(M, p, e, p.truth, "truth");
      M.ev.push({ t: "relTruth", p, amount: p.truth, n: hits.length });
    } },
};
// (31 Oct) the four Absolutes added past the Rift (units_abs.js)
Object.assign(R, {
  // for 6 s every hit on an enemy in his reach also lands, at half, on every other enemy in his reach (TD.G.after)
  hallvard: { dur: 6, start(M, p, L) { p.scaleR = L.rng * 1.15; M.ev.push({ t: "relScales", p, r: p.scaleR }); } },
  // a meteor onto the busiest stretch of road, then everything on the board freezes for 2 s
  sovn: { global: true, start(M, p, L) {
    const list = alive(M, p); if (!list.length) return;
    let best = list[0], bn = 0;
    for (const e of list) { let n = 0; for (const o of list) if (Math.hypot(o.x - e.x, o.z - e.z) <= 2.2) n++; if (n > bn) { bn = n; best = e; } }
    const x = best.x, z = best.z;
    near(M, x, z, 2.2, o => hurt(M, p, o, L.atk * 10), p);
    for (const e of alive(M)) e.stunT = Math.max(e.stunT || 0, e.def.boss ? 0.6 : heavy(e) ? 1 : 2);
    M.ev.push({ t: "relMeteor", p, x, z, r: 2.2 });
  } },
  // the pack: wolves run down the road for 4 s and burst on whatever they reach
  vespro: { dur: 4, global: true, start(M, p) { M.ev.push({ t: "relPack", p }); }, tick(M, p, dt, L) {
    every(p, 0.32, dt, () => {
      const list = firstOf(alive(M, p)); if (!list.length) return;
      const e = list[(Math.random() * Math.min(list.length, 6)) | 0];
      near(M, e.x, e.z, 1.3, o => hurt(M, p, o, L.atk * 2), p);
      M.ev.push({ t: "relWolf", p, x: e.x, z: e.z });
    });
  } },
  // the last act: three acts that hit and slow every enemy, then the final cut through all of them
  shigure: { dur: 6, global: true, start(M, p) { p.act = 0; M.ev.push({ t: "relStage", p }); }, tick(M, p, dt, L) {
    every(p, 1.5, dt, () => {
      if (p.act >= 3) return;
      p.act++;
      const hits = alive(M, p);
      for (const e of hits) { hurt(M, p, e, L.atk * 1.5); afflict(M, p, e, { slow: [0.3, 1.5] }, 0); }
      M.ev.push({ t: "relAct", p, n: p.act, hits: hits.map(e => [e.x, e.z]) });
    });
  }, end(M, p, L) {
    const hits = alive(M, p);
    for (const e of hits) hurt(M, p, e, L.atk * 8);
    M.ev.push({ t: "relFinale", p, hits: hits.map(e => [e.x, e.z]) });
  } },
});
// the star map's Quick Release and Eclipse charge them faster
TD.relCd = p => (CD[AF.UNIT[key(p)].rarity] || 60) / (AF.G && AF.G.S ? 1 + AF.G.star("relCharge") : 1);
// 0 to 1: how charged a unit's release is
TD.relCharge = p => (p.s.gate ? Math.max(0, Math.min(1, 1 - (p.relCd == null ? TD.relCd(p) * 0.5 : p.relCd) / TD.relCd(p))) : 0);
// one copy of a unit releasing at a time, and one time stop / taking back at a time across the board
const BOARD_WIDE = { mezzanotte: 1, ragnvald: 1, kagero: 1, tsumugi: 1, sovn: 1, shigure: 1 };
TD.canRelease = (M, p) => !!(p && p.s.gate && R[key(p)] && M.state !== "won" && M.state !== "lost" && !(p.relT > 0) && (p.relCd == null ? TD.relCd(p) * 0.5 : p.relCd) <= 0
  && !M.units.some(o => o !== p && o.relT > 0 && (key(o) === key(p) || (BOARD_WIDE[key(o)] && BOARD_WIDE[key(p)]))));
TD.release = (M, p) => {
  if (!TD.canRelease(M, p)) return false;
  const D = R[key(p)], L = TD.live(p);
  p.relCd = TD.relCd(p); p.relT = D.dur || 0; p.relShow = Math.max(SHOW, D.dur || 0); p.relAcc = 0;
  if (D.start) D.start(M, p, L);
  M.ev.push({ t: "release", p, k: key(p), dur: p.relShow });
  p.rels = (p.rels || 0) + 1;
  return true;
};
// the auto release uses one when there's something worth it in reach: a boss or a brute, or four or more enemies
function wants(M, p, L) {
  const D = R[key(p)], list = D.global ? alive(M, p) : within(M, p, L.rng * 1.6);
  if (!list.length || (D.want && !D.want(M, p))) return false;
  return list.some(heavy) || list.length >= (D.global ? 8 : 4);
}

TD.G = {
  before(M, p, e, dmg, how) {
    // Kagero's haze: a turned enemy takes half again
    if (e.confT > 0) dmg *= 1.5;
    // (31 Oct) Shigure's games: Shadows (in his reach, +40%) and Tag (the tagged one takes double)
    if (e.tag) dmg *= 2;
    if (M.shig) for (const sp of M.shig) if (sp.game === 0 && Math.hypot(e.x - sp.x, e.z - sp.z) <= sp.grng) { dmg *= 1.4; break; }
    // Mezzanotte's stop: the damage waits (it lands x1.5 when time starts again)
    if (M.tstop > 0 && how !== "unheld") { e.held = (e.held || 0) + dmg; if (!e.heldP && p.s) e.heldP = p; return 0; }
    return dmg;
  },
  after(M, p, e, real, how) {
    if (p.s) { e.lastP = p; if (how !== "truth") logDmg(M, real); }
    if (p.u && key(p) === "tsumugi" && how !== "share") stitch(M, p, e);
    if (e.threadT > 0 && how !== "share") {
      const share = real * (M.stitchT > 0 ? 0.5 : 0.3);
      for (const o of M.enemies) if (o !== e && o.hp > 0 && o.threadT > 0) hurt(M, o.threadP || p, o, share, "share");
    }
    // (31 Oct) Hallvard's release: a hit on anything in his reach lands at half on everything else there
    if (how !== "share" && real > 0 && M.scales) for (const hv of M.scales) {
      if (Math.hypot(e.x - hv.x, e.z - hv.z) > hv.scaleR) continue;
      for (const o of M.enemies) if (o !== e && o.hp > 0 && Math.hypot(o.x - hv.x, o.z - hv.z) <= hv.scaleR) hurt(M, hv, o, real * 0.5, "share");
      break;
    }
    // Ultimo ends whatever he hits low enough
    if (p.u && key(p) === "ultimo" && e.hp > 0 && e.hp <= e.max * (e.def.boss ? 0.04 : 0.12)) { p.dealt += e.hp; e.hp = 0; M.ev.push({ t: "exec", p, x: e.x, z: e.z }); }
  },
  fire(M, p, e, L, atk) {
    switch (key(p)) {
      case "dagnatt": // Natt's shield bashes round Dag's target and knocks back
        near(M, e.x, e.z, 1.0, o => { hurt(M, p, o, atk * 0.5); afflict(M, p, o, { knock: 0.5 }, 0); }, p);
        M.ev.push({ t: "bash", p, x: e.x, z: e.z });
        break;
      case "secondo": p.ramp = Math.min(20, (p.ramp || 0) + 1); break;
      // (31 Oct) Søvn's dream this wave: fire that burns, frost that slows, or stars that split to two more
      case "sovn":
        if (p.dream === 0) afflict(M, p, e, { dot: [0.5, 2] }, atk);
        else if (p.dream === 1) afflict(M, p, e, { slow: [0.4, 1.5] }, atk);
        else { const to = alive(M, p).filter(o => o !== e && Math.hypot(o.x - e.x, o.z - e.z) <= 2).slice(0, 2); for (const o of to) hurt(M, p, o, atk * 0.5); if (to.length) M.ev.push({ t: "split", p, x: e.x, z: e.z, to: to.map(o => [o.x, o.z]) }); }
        break;
      // Vespro: she fires a small shot of her own with every one of his
      case "vespro": if (e.hp > 0) { hurt(M, p, e, atk * 0.3); M.ev.push({ t: "lily", p, x: e.x, z: e.z }); } break;
      // Shigure's Tag: the first one he hits is it, if nobody is
      case "shigure": if (p.game === 2 && !M.enemies.some(o => o.hp > 0 && o.tag) && e.hp > 0) { e.tag = true; M.ev.push({ t: "tag", p, e }); } break;
      case "molla": for (let i = M.proj.length - 1; i >= 0; i--) { const s = M.proj[i]; if (s.p === p && s.sky) { s.bomb = true; break; } } break;
      case "mezzanotte":
        if (p.combo % 12 === 0 && e.hp > 0) { e.stunT = Math.max(e.stunT || 0, e.def.boss ? 0.5 : 1); M.ev.push({ t: "tstop1", p, e, x: e.x, z: e.z }); }
        break;
      case "kurogane":
        p.blood = Math.min(50, (p.blood || 0) + 1);
        if (p.relT > 0) { const hits = []; near(M, p.x, p.z, L.rng * 1.3, o => { hurt(M, p, o, atk * 0.6); hits.push(o); }, p); M.ev.push({ t: "rcleave", p, r: L.rng * 1.3, n: hits.length }); }
        break;
    }
  },
  // Elske's arrow splits in three where it lands
  shot(M, s) {
    if (key(s.p) !== "elske") return;
    const to = alive(M, s.p).filter(o => o !== s.e && Math.hypot(o.x - s.x, o.z - s.z) <= 2.6).sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z)).slice(0, 3);
    for (const o of to) hurt(M, s.p, o, s.dmg * 0.4);
    if (to.length) M.ev.push({ t: "split", p: s.p, x: s.x, z: s.z, to: to.map(o => [o.x, o.z]) });
  },
  // Lupo leaps at the next one the moment something he hit falls
  kill(M, e) {
    // (31 Oct) Shigure's Tag passes to the nearest one left when the tagged one falls
    if (e.tag) {
      e.tag = false;
      let nx = null, nd = 1e9;
      for (const o of M.enemies) if (o.hp > 0 && o !== e) { const d = Math.hypot(o.x - e.x, o.z - e.z); if (d < nd) { nd = d; nx = o; } }
      if (nx) { nx.tag = true; M.ev.push({ t: "tagPass", p: (M.shig && M.shig[0]) || e.lastP, x: e.x, z: e.z, e: nx }); }
    }
    const p = e.lastP;
    if (p && p.u && key(p) === "lupo" && M.units.includes(p) && p.cd > 0.05) { p.cd = 0.05; M.ev.push({ t: "leap", p, x: e.x, z: e.z }); }
  },
  wave(M) {
    for (const p of M.units) {
      if (key(p) === "bjarnulf") p.grow = Math.min(25, (p.grow || 0) + 1);
      if (key(p) === "secondo") p.ramp = 0;
      if (key(p) === "sovn") { p.dream = (Math.random() * 3) | 0; M.ev.push({ t: "dream", p, n: p.dream }); }
      if (key(p) === "shigure") { p.game = (Math.random() * 3) | 0; p.gameAcc = 0; M.ev.push({ t: "game", p, n: p.game }); }
    }
  },
  step(M, dt) {
    for (const e of M.enemies) {
      e.aSlow = 0;
      if (e.threadT > 0) e.threadT -= dt;
      if (M.tstop > 0) e.stunT = Math.max(e.stunT || 0, M.tstop);
    }
    const king = M.units.some(p => key(p) === "ragnvald");
    M.scales = null; M.shig = null;
    for (const p of M.units) {
      if (p.hold > 0) p.hold -= dt;
      if (!p.s.gate) continue;
      const k = key(p), L0 = TD.live(Object.assign({}, p, { gm: 1, gs: 1 }));
      // live buffs
      let gm = 1, gs = 1;
      if (king && p.s.gate === "aurora" && k !== "ragnvald") gm *= 1.15;
      if (k === "bjarnulf") gm *= 1 + 0.06 * (p.grow || 0);
      if (k === "kurogane") gm *= 1 + 0.04 * (p.blood || 0) * (p.relT > 0 ? 2 : 1);
      if (k === "secondo") gs = 1 + 0.03 * (p.ramp || 0);
      // (31 Oct) Vespro: +40% for each of the four spaces round him nobody stands in
      if (k === "vespro") { let n = 0; for (const o of M.units) if (o !== p && Math.hypot(o.x - p.x, o.z - p.z) <= 1.6) n++; gm *= 1 + 0.4 * Math.max(0, 4 - n); }
      // Hallvard: every 2 s the healthiest enemy in reach loses a quarter of its gap to the weakest (at most 3 hits)
      if (k === "hallvard") {
        if (p.relT > 0) (M.scales = M.scales || []).push(p);
        p.balAcc = (p.balAcc || 0) + dt;
        if (p.balAcc >= 2) {
          p.balAcc = 0;
          const list = within(M, p, L0.rng);
          if (list.length >= 2) {
            let hi = list[0], lo = list[0];
            for (const e of list) { if (e.hp > hi.hp) hi = e; if (e.hp < lo.hp) lo = e; }
            const dmg = Math.min((hi.hp - lo.hp) * 0.25, L0.atk * 3);
            if (dmg > 0) { hurt(M, p, hi, dmg, "balance"); M.ev.push({ t: "balance", p, a: [hi.x, hi.z], b: [lo.x, lo.z] }); }
          }
        }
      }
      // Shigure's game: who's playing, and Red Light's freeze every 3 s
      if (k === "shigure") {
        if (p.game == null) p.game = (Math.random() * 3) | 0;
        p.grng = L0.rng; (M.shig = M.shig || []).push(p);
        if (p.game === 1) {
          p.gameAcc = (p.gameAcc || 0) + dt;
          if (p.gameAcc >= 3) {
            p.gameAcc = 0;
            const hits = within(M, p, L0.rng).filter(e => !e.def.boss);
            for (const e of hits) e.stunT = Math.max(e.stunT || 0, heavy(e) ? 0.3 : 0.8);
            if (hits.length) M.ev.push({ t: "redLight", p, r: L0.rng });
          }
        }
      }
      if (k === "sovn" && p.dream == null) p.dream = (Math.random() * 3) | 0;
      p.gm = gm; p.gs = gs;
      // the figure grows with him (board.js p.sz): a little each wave, half again in his Release
      if (k === "bjarnulf") p.sz = (1 + Math.min(0.5, 0.02 * (p.grow || 0))) * (p.relT > 0 ? 1.5 : 1);
      // Vidar: whatever comes near him slows, up to 90% right beside him
      if (k === "vidar") for (const e of alive(M, p)) {
        const d = Math.hypot(e.x - p.x, e.z - p.z); if (d > L0.rng) continue;
        const s = 0.9 * (1 - d / L0.rng) * (e.def.boss ? 0.6 : heavy(e) ? 0.8 : 1);
        if (s > e.aSlow) e.aSlow = s;
      }
      // Kagero: each enemy that walks into his range once; one in four turns round for 2 s (never a boss or brute)
      if (k === "kagero") for (const e of alive(M)) {
        if (e.hazed || Math.hypot(e.x - p.x, e.z - p.z) > L0.rng) continue;
        e.hazed = 1;
        if (!heavy(e) && Math.random() < 0.25) { e.confT = 2; M.ev.push({ t: "haze", p, e }); }
      }
      // the release: charging, running, ending
      const D = R[k];
      if (p.relCd == null) p.relCd = TD.relCd(p) * 0.5;
      if (p.relShow > 0) p.relShow -= dt;
      if (p.relT > 0) {
        if (D.tick) D.tick(M, p, dt, TD.live(p));
        p.relT -= dt;
        if (p.relT <= 0) { p.relT = 0; if (D.end) D.end(M, p, TD.live(p)); M.ev.push({ t: "releaseEnd", p, k }); }
      } else if (p.relCd > 0) p.relCd -= dt;
      else if (M.autoRel && M.state === "wave" && wants(M, p, L0)) TD.release(M, p);
    }
    if (M.neg > 0) M.neg -= dt;
  },
};
})();
