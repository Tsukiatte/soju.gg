/* The Expedition map (3 Nov, owner: "make the map like an actual world like this map here make it explorable kind of").
   One island in a real sea, seen from above: a coast with bays, mountains, rivers, lakes, a volcano, a crater in the middle.
   The road tours the eight worlds clockwise and climbs into the crater at the end. Drag to look around, wheel or pinch to
   zoom out to the whole island. Clouds hide the worlds you haven't reached. Sparkling finds off the road reward looking. */
(function () {
const AF = window.AF, EP = AF.EP, G = AF.G, K = AF.kit, EI = () => AF.EI;
const T = window.THREE, PI = Math.PI;
const EM = AF.EM = { on: false };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;

// ---------------- noise ----------------
const fract = x => x - Math.floor(x);
const h2 = (i, j) => fract(Math.sin(i * 127.1 + j * 311.7) * 43758.5453);
const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j, u = a * a * (3 - 2 * a), v = b * b * (3 - 2 * b); return (h2(i, j) * (1 - u) + h2(i + 1, j) * u) * (1 - v) + (h2(i, j + 1) * (1 - u) + h2(i + 1, j + 1) * u) * v; };
const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1, t = 0; for (let k = 0; k < o; k++) { s += a * vn(x * f + k * 17, y * f - k * 9); t += a; a *= 0.5; f *= 2.03; } return s / t; };
const ridge = (x, y, o = 4) => 1 - Math.abs(2 * fbm(x, y, o) - 1);
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ---------------- the road: where it goes, world by world ----------------
const ROUTE = [
  [[10, 108], [-6, 99], [8, 87], [-10, 77], [-28, 85], [-44, 75], [-40, 60]], // Hollowbrook, up from the south beach
  [[-56, 54], [-78, 66], [-96, 54], [-112, 62], [-124, 46], [-108, 30], [-120, 14]], // Gullport, along the west coast
  [[-108, 2], [-124, -14], [-104, -26], [-116, -44], [-96, -56], [-78, -44], [-68, -60]], // Sunscar Dunes
  [[-52, -72], [-60, -92], [-36, -98], [-22, -84], [-6, -100], [12, -88], [22, -104]], // Frostveil Pass, the north
  [[36, -92], [50, -106], [66, -90], [56, -74], [76, -66], [92, -80], [102, -62]], // Gloomhollow
  [[118, -56], [130, -36], [112, -24], [126, -6], [138, 14], [118, 22], [108, 36]], // Cinderfall, the east
  [[116, 52], [100, 58], [114, 74], [92, 84], [72, 72], [60, 86], [44, 72]], // Neon Arcology
  [[34, 54], [46, 36], [26, 24], [38, 6], [16, -6], [-4, 8], [-12, -14]], // Starfall Expanse, in the crater
];
const ANCH = [[-25, 84, 62, 1], [-105, 42, 58, 1], [-105, -36, 58, 1], [-20, -92, 60, 1], [68, -84, 60, 1], [124, -12, 58, 1], [86, 68, 60, 1], [8, -2, 80, 0.62]];
const THEMES = EP.WORLDS.map(w => w.theme);
const ISLETS = [[-168, 86, 13], [-172, -62, 15], [168, 78, 13], [172, -84, 15], [-72, 134, 11], [72, 136, 10], [-104, -130, 12], [104, -132, 11], [-178, 12, 8], [178, 12, 8]];
const RIVERS = [[[-40, -20], [-62, 8], [-88, 18], [-112, 24], [-150, 22]], [[55, -25], [72, -42], [95, -46], [125, -78], [152, -104]], [[22, 50], [14, 70], [24, 92], [30, 130]]];
const LAKES = [[-68, -14, 9], [62, 24, 10], [-34, -46, 7]];
const VOLCANO = [152, -28], PEAK = [-10, -130];
// a smooth line through the points, each stretch knowing which world it is in
const dense = [];
(function spline() {
  const pts = []; ROUTE.forEach((l, w) => l.forEach(p => pts.push([p[0], p[1], w])));
  const at = i => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < 14; k++) {
      const t = k / 14, t2 = t * t, t3 = t2 * t;
      const f = c => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3);
      dense.push({ x: f(0), z: f(1), w: p1[2] });
    }
  }
  dense.push({ x: at(pts.length - 1)[0], z: at(pts.length - 1)[1], w: 7 });
  let s = 0; dense.forEach((d, i) => { if (i) s += Math.hypot(d.x - dense[i - 1].x, d.z - dense[i - 1].z); d.s = s; });
})();
const POS = {};
(function placeMain() {
  for (let w = 0; w < 8; w++) {
    const seg = dense.filter(d => d.w === w), s0 = seg[0].s, s1 = seg[seg.length - 1].s, list = EP.MAIN.filter(n => n.world === w);
    list.forEach((n, k) => {
      const want = lerp(s0, s1, (k + 0.5) / list.length);
      let lo = 0; for (let i = 0; i < seg.length; i++) if (seg[i].s <= want) lo = i;
      POS[n.id] = [seg[lo].x, seg[lo].z];
    });
  }
})();
// side roads leave the hut in whichever direction has room, curling out toward the coast
const sideLines = [];
(function placeSides() {
  for (const n of EP.NODES) {
    if (n.kind !== 'gate') continue;
    const hut = EP.MAIN[n.branchOf], [hx, hz] = POS[hut.id], w = n.world, base = Math.atan2(hz, hx);
    const make = (ang, flip) => { const ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz * flip, vz = ux * flip; return [[6, 0], [11, 3], [16, 6.5], [21, 5], [26, 1]].map(([a, b]) => [hx + ux * a + vx * b, hz + uz * a + vz * b]); };
    let best = null, bestScore = -1;
    for (const off of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.2, -2.2, PI]) for (const flip of [1, -1]) {
      const line = make(base + off, flip);
      let near = Infinity;
      for (const d of dense) { const fromHut = Math.hypot(d.x - hx, d.z - hz); if (fromHut < 6) continue; for (const p of line) near = Math.min(near, Math.hypot(d.x - p[0], d.z - p[1])); }
      for (const l of sideLines) for (const q of l) for (const p of line) near = Math.min(near, Math.hypot(q[0] - p[0], q[1] - p[1]));
      if (near > bestScore) { bestScore = near; best = line; }
    }
    const ids = [`gate-${w}`, `side-${w}-0`, `side-${w}-1`, `side-${w}-2`, `chest-${w}`];
    ids.forEach((id, i) => { POS[id] = best[i]; });
    sideLines.push([[hx, hz]].concat(best));
  }
})();
EM.posOf = id => POS[id];
EM.ROUTE = ROUTE;
// how far from any road: a coarse grid over the samples
const CELL = 10, roadGrid = new Map();
const addRoad = (x, z, main) => { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); if (!roadGrid.has(k)) roadGrid.set(k, []); roadGrid.get(k).push([x, z, main]); };
dense.forEach(d => addRoad(d.x, d.z, true));
for (const l of sideLines) for (let i = 0; i < l.length - 1; i++) for (let k = 0; k < 6; k++) addRoad(lerp(l[i][0], l[i + 1][0], k / 6), lerp(l[i][1], l[i + 1][1], k / 6), false);
const roadDist = (x, z) => { const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL); let best = 99; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const l = roadGrid.get((cx + i) + ',' + (cz + j)); if (!l) continue; for (const p of l) { const d = (p[0] - x) * (p[0] - x) + (p[1] - z) * (p[1] - z); if (d < best * best) best = Math.sqrt(d); } } return best; };
const segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * k, z - a[1] - dz * k); };
const riverDist = (x, z) => { let best = 99; for (const r of RIVERS) for (let i = 0; i < r.length - 1; i++) best = Math.min(best, segDist(x + Math.sin(z * 0.12) * 1.6, z + Math.sin(x * 0.1) * 1.6, r[i], r[i + 1])); return best; };

// ---------------- the land ----------------
const LM = EM.LM = [];
const field = (x, z) => {
  let f = -1;
  for (const [ax, az, R] of ANCH) f = Math.max(f, 1 - Math.hypot(x - ax, z - az) / R);
  for (const [ax, az, R] of ISLETS) f = Math.max(f, 1 - Math.hypot(x - ax, z - az) / R);
  f = Math.max(f, 1 - roadDist(x, z) / 13);
  for (const s of LM) f = Math.max(f, 1 - Math.hypot(x - s.x, z - s.z) / (s.fp + 13)); // land under every landmark
  return f + (fbm(x * 0.03, z * 0.03) - 0.5) * 0.62 + (fbm(x * 0.11, z * 0.11, 3) - 0.5) * 0.2;
};
// which world's ground this is: the nearest, with a soft border
const biome = (x, z) => {
  let a = 0, b = 0, da = 1e9, db = 1e9;
  const wob = (fbm(x * 0.06, z * 0.06, 3) - 0.5) * 26;
  for (let i = 0; i < 8; i++) { const A = ANCH[i], d = (Math.hypot(x - A[0], z - A[1]) + wob) / A[3]; if (d < da) { db = da; b = a; da = d; a = i; } else if (d < db) { db = d; b = i; } }
  return { a, b, k: smooth(0, 16, db - da) };
};
const relief = (w, x, z) => {
  switch (w) {
    case 0: return Math.max(0, fbm(x * 0.06, z * 0.06) - 0.38) * 9;
    case 1: return Math.max(0, fbm(x * 0.09, z * 0.09) - 0.42) * 4;
    case 2: return Math.abs(Math.sin((x + z * 0.6) * 0.16 + fbm(x * 0.05, z * 0.05) * 6)) * 2.4;
    case 3: return Math.pow(ridge(x * 0.045, z * 0.045), 2.2) * 19;
    case 4: return Math.max(0, fbm(x * 0.08, z * 0.08) - 0.36) * 7;
    case 5: return Math.max(0, fbm(x * 0.1, z * 0.1) - 0.4) * 8;
    case 6: return Math.floor(fbm(x * 0.05, z * 0.05) * 6) * 0.5;
    default: return 2 + Math.max(0, fbm(x * 0.09, z * 0.09) - 0.45) * 3;
  }
};
// ---------------- the trails, and the landmarks ----------------
// (4 Nov, owner: "add more off branch stages" and "add more landmarks"): each world's three trails leave the road where there is room, and each ends at the foot of a landmark. Nothing here is random: the same island every time
// (owner: "rotate all the stuff ... make sure they are oreinted to face the path"): a landmark is turned to face the stop at its foot. The camera only looks one way, so a place where that also shows you its front is worth a lot: above all for a gate or a wheel, which edge-on are a line
const trailLines = EM.trailLines = [];
// Working all this out takes the better part of a second, so tools/soju_map_spots.mjs saves the answer in js/epic_mapspots.js. If the road or a landmark has changed since, the saved one doesn't match, and it is worked out again here
const spotsSig = (() => { const t = JSON.stringify([ROUTE, EP.LANDMARKS.map(l => l.map(q => [q.key, q.fp, q.h, q.trail])), EP.TRAILS.map(l => l.map(q => [q.hub, q.ids.length])), LAKES, VOLCANO, PEAK]); let h = 0; for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) | 0; return h; })();
EM.spotsSig = spotsSig;
(function placeLandmarks() {
  const t0 = performance.now(), saved = AF.MAP_SPOTS;
  if (saved && saved.sig === spotsSig) {
    for (const q of saved.list) {
      const L = EP.LANDMARKS[q.w].find(o => o.key === q.key), tr = EP.TRAILS[q.w][L.trail];
      tr.ids.forEach((id, i) => { POS[id] = q.stops[i]; });
      trailLines.push({ w: q.w, j: L.trail, line: [POS[tr.hub]].concat(q.stops), near: q.near });
      LM.push(Object.assign({}, L, { w: q.w, x: q.x, z: q.z, room: q.room, strict: q.strict, ry: q.ry, stop: q.stops[q.stops.length - 1] }));
    }
    EM.spotsSaved = true;
    for (const t of trailLines) for (let i = 0; i < t.line.length - 1; i++) for (let k = 0; k < 6; k++) addRoad(lerp(t.line[i][0], t.line[i + 1][0], k / 6), lerp(t.line[i][1], t.line[i + 1][1], k / 6), false);
    EM.placeMs = performance.now() - t0;
    return;
  }
  // every road so far, on a coarse grid
  const CG = 10, grid = new Map();
  const addPt = (x, z) => { const k = Math.floor(x / CG) + ',' + Math.floor(z / CG); if (!grid.has(k)) grid.set(k, []); grid.get(k).push([x, z]); };
  const addLine = l => { for (let i = 0; i < l.length - 1; i++) for (let k = 0; k < 3; k++) addPt(lerp(l[i][0], l[i + 1][0], k / 3), lerp(l[i][1], l[i + 1][1], k / 3)); addPt(l[l.length - 1][0], l[l.length - 1][1]); };
  dense.forEach((d, i) => { if (i % 3 === 0) addPt(d.x, d.z); });
  sideLines.forEach(addLine);
  const clearOf = (x, z, skip) => { const cx = Math.floor(x / CG), cz = Math.floor(z / CG); let best = 30; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const l = grid.get((cx + i) + ',' + (cz + j)); if (!l) continue; for (const q of l) { if (skip && Math.hypot(q[0] - skip[0], q[1] - skip[1]) < skip[2]) continue; const d = Math.hypot(q[0] - x, q[1] - z); if (d < best) best = d; } } return best; };
  const allowed = (x, z, m) => Math.abs(x) < 210 - m && Math.abs(z) < 162 - m;
  const inLake = (x, z, r) => LAKES.some(([a, b, R]) => Math.hypot(x - a, z - b) < R + r + 2);
  const lmClear = (x, z) => { let best = 99; for (const s of LM) best = Math.min(best, Math.hypot(s.x - x, s.z - z) - s.fp); return best; };
  // a tall thing hides what is behind it on screen: nothing you can walk to may stand there
  let stopsNow = Object.values(POS);
  const hides = (x, z, L) => { const reach = L.h * 0.62 + L.fp * 0.3, half = L.fp * 0.9; for (const p of stopsNow) if (Math.abs(p[0] - x) < half && z - p[1] > 0 && z - p[1] < reach) return true; return false; };
  const homeC = new Map(), home = (x, z, w) => { const k = Math.round(x * 4) + ',' + Math.round(z * 4); let a = homeC.get(k); if (a === undefined) { a = biome(x, z).a; homeC.set(k, a); } return a === w; };
  // (owner: "make sure they are oreinted to face the path"): the stop goes in front of the landmark, on the side the camera looks from, and the trail bends to reach it. So every landmark faces its path, and you see the front of it
  for (let w = 0; w < 8; w++) {
    const list = EP.LANDMARKS[w].slice().sort((p, q) => q.fp - p.fp);
    for (const L of list) {
      const tr = EP.TRAILS[w][L.trail], hub = POS[tr.hub], n = tr.ids.length;
      let best = null, top = -Infinity;
      // if nowhere is free, ask less: first let it stand in front of something, then let the trail run longer and closer to its neighbours
      for (const level of [0, 1, 2]) if (!best || !best.home) for (let ai = 0; ai < 48; ai++) for (const far of level < 2 ? [0.75, 1, 1.3, 1.6, 2, 2.5] : [0.75, 1, 1.3, 1.6, 2, 2.5, 3, 3.5, 4]) {
        const strict = level === 0, minNear = level < 2 ? 4 : 2.8, minRoom = level < 2 ? 1.5 : 0.8;
        const ang = ai / 48 * PI * 2, D0 = L.fp + 3 + (6 * n + 2) * far, x = hub[0] + Math.cos(ang) * D0, z = hub[1] + Math.sin(ang) * D0;
        if (!allowed(x, z, L.fp) || inLake(x, z, L.fp) || (strict && hides(x, z, L))) continue;
        const room0 = Math.min(clearOf(x, z) - L.fp, lmClear(x, z) - L.fp, Math.hypot(x - VOLCANO[0], z - VOLCANO[1]) - L.fp - 10, Math.hypot(x - PEAK[0], z - PEAK[1]) - L.fp - 4);
        if (room0 < minRoom) continue;
        const atHome = home(x, z, w); // worked out once: it is the slow part
        for (const ry of [0, 0.3, -0.3, 0.55, -0.55]) {
          const sx = x + Math.sin(ry) * (L.fp + 3), sz = z + Math.cos(ry) * (L.fp + 3), Dn = Math.hypot(sx - hub[0], sz - hub[1]);
          if (Dn < 5 * n + 1.5 || Dn > (level < 2 ? 9.5 : 14) * n + (level < 2 ? 5 : 12) || !allowed(sx, sz, 4)) continue;
          const ux = (sx - hub[0]) / Dn, uz = (sz - hub[1]) / Dn;
          for (const amp of [0, 3, -3, 6, -6]) {
            // the best this one could possibly score: no need to walk its road if that can't beat what we have
            if (10 + Math.min(room0, 6) + (atHome ? 14 : -14) + 4 + Math.cos(ry) * 8 - Math.abs(amp) * 0.15 - far * 1.5 <= top) continue;
            const at = k => { const t = k / n, b = amp * Math.sin(t * PI); return [hub[0] + ux * Dn * t - uz * b, hub[1] + uz * Dn * t + ux * b]; }, stops = []; for (let k = 1; k <= n; k++) stops.push(at(k));
            let near = 30, room = room0; const skip = [hub[0], hub[1], 7];
            for (let k = 0.5; k <= n && near >= minNear; k += 0.5) { const q = at(k); near = Math.min(near, clearOf(q[0], q[1], skip), lmClear(q[0], q[1])); if (k < n) room = Math.min(room, Math.hypot(q[0] - x, q[1] - z) - L.fp); }
            if (near < minNear || room < minRoom) continue;
            if (strict && stops.some(q => Math.abs(q[0] - x) < L.fp * 0.9 && z - q[1] > 0 && z - q[1] < L.h * 0.62 + L.fp * 0.3)) continue;
            const score = Math.min(near, 10) + Math.min(room, 6) + (atHome ? 14 : -14) + (home(sx, sz, w) ? 4 : 0) + Math.cos(ry) * 8 - Math.abs(amp) * 0.15 - far * 1.5;
            if (score > top) { top = score; best = { stops, x, z, near, room, strict, ry, home: atHome }; }
          }
        }
      }
      if (!best) throw new Error('no place for ' + L.key);
      tr.ids.forEach((id, i) => { POS[id] = best.stops[i]; });
      stopsNow = Object.values(POS);
      const line = [hub].concat(best.stops);
      trailLines.push({ w, j: L.trail, line, near: best.near });
      addLine(line);
      LM.push(Object.assign({}, L, { w, x: best.x, z: best.z, room: best.room, strict: best.strict, ry: best.ry, stop: best.stops[n - 1] }));
    }
  }
  for (const t of trailLines) for (let i = 0; i < t.line.length - 1; i++) for (let k = 0; k < 6; k++) addRoad(lerp(t.line[i][0], t.line[i + 1][0], k / 6), lerp(t.line[i][1], t.line[i + 1][1], k / 6), false);
  EM.placeMs = performance.now() - t0;
})();
function heightRaw(x, z) {
  const f = field(x, z);
  if (f < 0) return Math.max(-7, f * 16);
  const rd = roadDist(x, z), B = biome(x, z);
  let flat = smooth(1.8, 8.5, rd), onSite = false; // a landmark stands on level ground, and no river runs through it
  for (const s of LM) { const d = Math.hypot(x - s.x, z - s.z); if (d < s.fp + 9) { flat = Math.min(flat, smooth(s.fp + 1, s.fp + 9, d)); if (d < s.fp + 3) onSite = true; } }
  let h = 0.25 + Math.min(f, 0.45) * 2.4;
  let rel = lerp(lerp(relief(B.a, x, z), relief(B.b, x, z), 0.5), relief(B.a, x, z), B.k);
  // the mountain ring round the crater
  const rr = Math.hypot(x - 8, z + 2), ring = smooth(44, 54, rr) * (1 - smooth(68, 84, rr));
  rel += Math.pow(ridge(x * 0.04 + 3, z * 0.04), 1.6) * 17 * ring;
  // the volcano, and the great peak in the north
  const dv = Math.hypot(x - VOLCANO[0], z - VOLCANO[1]);
  if (dv < 26) rel += 24 * Math.pow(1 - dv / 26, 1.25) - (dv < 4 ? (4 - dv) * 2.6 : 0);
  const dp = Math.hypot(x - PEAK[0], z - PEAK[1]);
  if (dp < 26) rel += 20 * Math.pow(1 - dp / 26, 1.3);
  h += rel * flat * smooth(0, 0.22, f);
  // rivers and lakes cut into it
  const rv = riverDist(x, z);
  if (rv < 4.4 && rd > 2 && !onSite) h = lerp(-0.9, h, smooth(1.3, 4.4, rv));
  if (!onSite) for (const [lx, lz, lr] of LAKES) { const d = Math.hypot(x - lx, z - lz) + (fbm(x * 0.2, z * 0.2, 2) - 0.5) * 6; if (d < lr + 2) h = lerp(-1.4, h, smooth(lr - 2, lr + 2, d)); }
  return h;
}
const GX0 = -226, GX1 = 226, GZ0 = -176, GZ1 = 176, GS = 2;
const NX = Math.round((GX1 - GX0) / GS), NZ = Math.round((GZ1 - GZ0) / GS);
let heights = null;
const heightAt = (x, z) => {
  if (!heights) return 0;
  const fx = (x - GX0) / GS, fz = (z - GZ0) / GS, i = Math.max(0, Math.min(NX - 1, Math.floor(fx))), j = Math.max(0, Math.min(NZ - 1, Math.floor(fz))), a = fx - i, b = fz - j, W = NX + 1;
  return lerp(lerp(heights[j * W + i], heights[j * W + i + 1], a), lerp(heights[(j + 1) * W + i], heights[(j + 1) * W + i + 1], a), b);
};
const groundAt = (x, z) => Math.max(0.02, heightAt(x, z));
EM.heightAt = heightAt;
EM.biomeAt = (x, z) => biome(x, z).a;
// for tools: a text picture of the island, so its shape can be checked without looking
EM.chart = (cols = 96, rows = 44) => {
  const out = [];
  for (let r = 0; r < rows; r++) { let s = ''; for (let c = 0; c < cols; c++) { const x = lerp(GX0, GX1, c / (cols - 1)), z = lerp(GZ0, GZ1, r / (rows - 1)), h = heightAt(x, z); s += h < 0 ? '.' : h > 8 ? '^' : String(biome(x, z).a); } out.push(s); }
  return out.join('\n');
};

// ---------------- how each world looks ----------------
const PAL = [
  { a: 0x6fb04f, b: 0x8cc463, low: 0x5a9a48, sand: 0xf0dfa8, road: 0xeadbb0, rock: 0x8a8a7a }, { a: 0x93c26e, b: 0xc4c98c, low: 0x79ad62, sand: 0xf4e4b4, road: 0xf0e4c0, rock: 0x9a9a8a },
  { a: 0xe6bd6e, b: 0xf2ce86, low: 0xd8ad60, sand: 0xf4dca0, road: 0xfff0c8, rock: 0xb88a52 }, { a: 0xdfeaf2, b: 0xf6fbfd, low: 0xbcd4e4, sand: 0xdfe8ee, road: 0x8fb4cc, rock: 0x8a9cb0 },
  { a: 0x54655a, b: 0x667660, low: 0x42524a, sand: 0x8a8a78, road: 0xb8b8a0, rock: 0x4a4a54 }, { a: 0x54423c, b: 0x6a5248, low: 0x3e302c, sand: 0x4a3c38, road: 0xe89860, rock: 0x2e2422 },
  { a: 0x32345a, b: 0x3e4070, low: 0x282a4a, sand: 0x4a4c6a, road: 0x5ad8ff, rock: 0x22243e }, { a: 0x382e68, b: 0x4a3c80, low: 0x2a2250, sand: 0x4a4478, road: 0xd8b8ff, rock: 0x241c44 },
];
const box = (w, h, d) => new T.BoxGeometry(w, h, d), cone = (r, h, s = 6) => new T.ConeGeometry(r, h, s), cyl = (a, b, h, s = 7) => new T.CylinderGeometry(a, b, h, s), ico = r => new T.IcosahedronGeometry(r, 0);
// every kind of thing that grows in a world: how many, how thick its clumps (0 is anywhere), and its parts [geometry, colour, height, scale, turn, glow]
const PROPS = [
  [{ n: 620, cl: 0.5, p: [[cyl(0.14, 0.2, 0.8), 0x7a5a3a, 0.4], [ico(0.85), 0x5fae4a, 1.3, [1, 1.15, 1]]] }, { n: 300, cl: 0.53, p: [[cyl(0.12, 0.16, 0.6), 0x6a4a2a, 0.3], [cone(0.75, 1.8), 0x3f8f4a, 1.35]] }, { n: 240, cl: 0, p: [[ico(0.42), 0x6fbf58, 0.28, [1, 0.7, 1]]] }, { n: 60, cl: 0, p: [[box(1.2, 0.8, 1), 0xeadfc4, 0.4], [cone(1, 0.75, 4), 0xc45a3a, 1.15, null, PI / 4]] }, { n: 120, cl: 0.45, p: [[ico(0.16), 0xffd25a, 0.2], [ico(0.13), 0xff8ab4, 0.26]] }],
  [{ n: 260, cl: 0.46, p: [[cyl(0.1, 0.16, 1.8), 0x9a7a4a, 0.9], [cone(1, 0.42, 6), 0x4fa850, 1.95]] }, { n: 120, cl: 0, p: [[ico(0.6), 0x9a9a8a, 0.25, [1, 0.6, 1]]] }, { n: 80, cl: 0, p: [[box(1.2, 0.75, 1), 0xd8c8a8, 0.38], [cone(0.95, 0.6, 4), 0x4a78a8, 1.05, null, PI / 4]] }, { n: 200, cl: 0, p: [[ico(0.38), 0x7fbf68, 0.24, [1, 0.7, 1]]] }],
  [{ n: 260, cl: 0, p: [[cyl(0.16, 0.2, 1.1), 0x5a9a4a, 0.55], [box(0.12, 0.42, 0.12), 0x5a9a4a, 0.75]] }, { n: 34, cl: 0, far: 7, p: [[cone(2.6, 2.8, 4), 0xd8ad62, 1.4, null, PI / 4]] }, { n: 160, cl: 0, p: [[ico(0.55), 0xb88a52, 0.25, [1, 0.6, 1]]] }, { n: 40, cl: 0, p: [[box(0.5, 0.9, 0.5), 0xc9a06a, 0.45]] }],
  [{ n: 760, cl: 0.44, p: [[cyl(0.1, 0.14, 0.4), 0x5a4a3a, 0.2], [cone(0.75, 1.3), 0x3f7f7f, 0.95], [cone(0.46, 0.85), 0xf4fafc, 1.65]] }, { n: 170, cl: 0, p: [[cone(0.42, 1.9, 4), 0xa8e4ff, 0.95, null, 0.4, 0.22]] }, { n: 130, cl: 0, p: [[ico(0.65), 0xa8b8c8, 0.28, [1, 0.6, 1]]] }],
  [{ n: 420, cl: 0.46, p: [[cyl(0.07, 0.17, 1.8), 0x3a2e2a, 0.9], [box(0.08, 0.7, 0.08), 0x3a2e2a, 1.4]] }, { n: 300, cl: 0.4, p: [[box(0.5, 0.72, 0.14), 0x8a8a90, 0.36]] }, { n: 80, cl: 0, p: [[cyl(0.04, 0.04, 1.2), 0x2a2a30, 0.6], [ico(0.17), 0xffb84a, 1.28, null, 0, 1]] }, { n: 110, cl: 0, p: [[ico(0.7), 0x4a4a50, 0.26, [1, 0.5, 1]]] }],
  [{ n: 70, cl: 0, far: 5, p: [[cyl(2, 2, 0.06, 12), 0xff6a2a, 0.08, [1, 1, 0.75], 0, 1]] }, { n: 380, cl: 0, p: [[ico(0.7), 0x2e2422, 0.26, [1, 0.8, 1]]] }, { n: 170, cl: 0, p: [[cone(0.26, 1.4, 4), 0x4a2e2a, 0.7]] }, { n: 90, cl: 0.5, p: [[cyl(0.1, 0.16, 1.4), 0x2a1a18, 0.7], [ico(0.28), 0xff8a3a, 1.5, null, 0, 0.9]] }],
  [{ n: 200, cl: 0, p: [[box(1.7, 4.4, 1.7), 0x1e2038, 2.2], [box(1.75, 0.22, 1.75), 0xff4ac0, 3.8, null, 0, 1], [box(1.75, 0.22, 1.75), 0x48e0ff, 2.3, null, 0, 1]] }, { n: 240, cl: 0, p: [[box(1.25, 2.1, 1.25), 0x242642, 1.05], [box(1.3, 0.16, 1.3), 0x7dff9a, 1.7, null, 0, 1]] }, { n: 240, cl: 0, p: [[cyl(0.04, 0.04, 1.5), 0x3a3c5c, 0.75], [ico(0.14), 0xffe14a, 1.55, null, 0, 1]] }],
  [{ n: 130, cl: 0, far: 4, p: [[cyl(1.5, 1.15, 0.18, 10), 0x1e1838, 0.08, [1, 1, 0.8]]] }, { n: 190, cl: 0, p: [[cone(0.38, 1.7, 5), 0xc9a8ff, 0.85, null, 0.3, 0.7], [cone(0.26, 1, 5), 0x8fd8ff, 0.5, null, 1.2, 0.7]] }, { n: 210, cl: 0, p: [[ico(0.65), 0x4a4068, 0.28, [1, 0.7, 1]]] }, { n: 240, cl: 0, p: [[ico(0.08), 0xffffff, 0.16, null, 0, 1]] }],
];

// ---------------- building it ----------------
let gl = null, scene = null, cam = null, host = null, canvas = null, W = 1, H = 1, labels = null, ro = null;
let hooks = {}, built = false, time = 0, water = null, goalArrow = null, goldenM = null;
const focus = { x: 0, z: 90, tx: 0, tz: 90, vx: 0, vz: 0 };
const view = { h: 46, to: 46 };
const nodes = new Map(), finds = new Map(), worldClouds = [], signs = [], anims = [];
const party = { list: [], at: null, x: 0, z: 0, path: [], moving: false, key: '' };
const mat = (hex, glow) => { const m = new T.MeshLambertMaterial({ color: hex, flatShading: true }); if (glow) { m.emissive = new T.Color(hex); m.emissiveIntensity = glow; } return m; };
const mesh = (geo, hex, x, y, z, glow) => { const m = new T.Mesh(geo, mat(hex, glow)); m.position.set(x, y, z); m.castShadow = true; return m; };
const ca = new T.Color(), cb = new T.Color(), cc = new T.Color();
function buildGround() {
  const geo = new T.PlaneGeometry(GX1 - GX0, GZ1 - GZ0, NX, NZ);
  geo.rotateX(-PI / 2); geo.translate((GX0 + GX1) / 2, 0, (GZ0 + GZ1) / 2);
  const Ps = geo.attributes.position, Cs = new Float32Array(Ps.count * 3);
  heights = new Float32Array(Ps.count);
  for (let v = 0; v < Ps.count; v++) {
    const x = Ps.getX(v), z = Ps.getZ(v), h = heightRaw(x, z);
    heights[v] = h; Ps.setY(v, h);
    if (h < 0) {
      // the sea floor shows through the water: pale over the shallows, dark further out
      const d = Math.min(1, -h / 5);
      ca.set(0xf4e4b4).lerp(cb.set(0x2ab0c8), smooth(0, 0.28, d)).lerp(cb.set(0x0d4f86), smooth(0.25, 1, d));
    } else {
      const B = biome(x, z), Pa = PAL[B.a], Pb = PAL[B.b], n = fbm(x * 0.09, z * 0.09, 3);
      const paint = Q => cc.set(Q.a).lerp(ca.set(Q.b), n).clone();
      ca.copy(paint(Pb)).lerp(paint(Pa), B.k);
      const rock = cb.set(Pa.rock), sand = new T.Color(Pa.sand);
      if (h > 4.5) ca.lerp(rock, smooth(4.5, 7.5, h));
      if (h > 10) ca.lerp(cc.set(0xf6fbfd), smooth(10, 13, h) * (B.a === 5 ? 0 : 1));
      if (h < 0.75) ca.lerp(sand, 1 - smooth(0.3, 0.75, h));
      const rd = roadDist(x, z);
      if (rd < 3.4) ca.lerp(cc.set(Pa.low), (1 - rd / 3.4) * 0.45);
      const dv = Math.hypot(x - VOLCANO[0], z - VOLCANO[1]);
      if (dv < 4.6) ca.set(0xff7a2a);
      else if (dv < 9) ca.lerp(cc.set(0x2a1a18), 0.7);
    }
    Cs[v * 3] = ca.r; Cs[v * 3 + 1] = ca.g; Cs[v * 3 + 2] = ca.b;
  }
  geo.setAttribute('color', new T.BufferAttribute(Cs, 3)); geo.computeVertexNormals();
  const ground = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  ground.receiveShadow = true; ground.castShadow = true;
  scene.add(ground);
  // the sea beyond the mesh, and the water over everything
  const deep = new T.Mesh(new T.PlaneGeometry(2400, 2400), new T.MeshBasicMaterial({ color: 0x0d4f86 })); deep.rotation.x = -PI / 2; deep.position.y = -7.2; scene.add(deep);
  const wgeo = new T.PlaneGeometry(2400, 2400); wgeo.rotateX(-PI / 2);
  water = new T.Mesh(wgeo, new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { t: { value: 0 }, c: { value: new T.Color(0x2a94d0) } },
    vertexShader: 'varying vec2 p; void main(){ p = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec2 p; uniform float t; uniform vec3 c;
      void main(){ float a = sin(p.x*.34 + t*.55 + sin(p.y*.21 + t*.3)*2.4)*sin(p.y*.42 - t*.45 + sin(p.x*.13)*1.8);
        float b = sin(p.x*.9 - t*.7 + sin(p.y*.5)*2.)*sin(p.y*1.1 + t*.6);
        vec3 col = c + vec3(.32,.36,.38)*(smoothstep(.72,.98,a)*.55 + smoothstep(.86,1.,b)*.3);
        gl_FragColor = vec4(col, .6);
        #include <colorspace_fragment>
      }`,
  }));
  water.renderOrder = 1;
  scene.add(water);
}
function ribbon(points, width, colorAt, lift = 0.12) {
  const v = [], col = [], idx = [], c = new T.Color();
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i], a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, w = width * (0.9 + Math.sin(i * 0.9) * 0.1);
    const ya = groundAt(x + nx * w, z + nz * w) + lift, yb = groundAt(x - nx * w, z - nz * w) + lift;
    v.push(x + nx * w, ya, z + nz * w, x - nx * w, yb, z - nz * w);
    c.set(colorAt(x, z)); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i) { const q = (i - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide })); m.receiveShadow = true; scene.add(m);
}
function dashes(points, gap, s = 1) {
  // the white dashes that mark a trail on a map
  const list = []; let run = 0;
  for (let i = 1; i < points.length; i++) { const a = points[i - 1], b = points[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); run += L; if (run >= gap) { run = 0; list.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1])]); } }
  const m = new T.InstancedMesh(new T.BoxGeometry(0.34 * s, 0.05, 0.95 * s), new T.MeshBasicMaterial({ color: 0xffffff }), list.length), d = new T.Object3D();
  list.forEach(([x, z, r], i) => { d.position.set(x, groundAt(x, z) + 0.19, z); d.rotation.set(0, r, 0); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
  m.computeBoundingSphere(); scene.add(m);
}
function buildRoads() {
  const colorOf = (x, z) => PAL[biome(x, z).a].road;
  const pts = dense.map(d => [d.x, d.z]);
  ribbon(pts, 0.82, colorOf);
  dashes(pts, 1.9);
  for (const l of sideLines.concat(trailLines.map(t => t.line))) {
    const line = []; for (let i = 0; i < l.length - 1; i++) for (let k = 0; k < 8; k++) line.push([lerp(l[i][0], l[i + 1][0], k / 8), lerp(l[i][1], l[i + 1][1], k / 8)]);
    line.push(l[l.length - 1]);
    ribbon(line, 0.5, colorOf, 0.13);
    dashes(line, 1.5, 0.75);
  }
  // a bridge wherever the road meets a river
  let last = -99;
  dense.forEach((d, i) => {
    if (riverDist(d.x, d.z) < 2 && i - last > 20) {
      last = i;
      const a = dense[Math.max(0, i - 2)], b = dense[Math.min(dense.length - 1, i + 2)], g = new T.Group(); g.position.set(d.x, groundAt(d.x, d.z) + 0.22, d.z); g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      g.add(mesh(box(2.6, 0.18, 7), 0x8a5a3a, 0, 0, 0), mesh(box(0.14, 0.5, 7), 0x6a4a2a, -1.25, 0.3, 0), mesh(box(0.14, 0.5, 7), 0x6a4a2a, 1.25, 0.3, 0));
      scene.add(g);
    }
  });
}
function buildProps() {
  const dummy = new T.Object3D();
  THEMES.forEach((th, w) => {
    const [ax, az, R] = ANCH[w];
    for (const prop of PROPS[w]) {
      const list = [];
      for (let i = 0; i < prop.n * 7 && list.length < prop.n; i++) {
        const ang = rnd() * PI * 2, r = Math.sqrt(rnd()) * R * 1.12, x = ax + Math.cos(ang) * r, z = az + Math.sin(ang) * r;
        const h = heightAt(x, z);
        if (h < 0.55 || h > (w === 3 ? 13 : 8)) continue;
        if (biome(x, z).a !== w) continue;
        if (prop.cl && fbm(x * 0.055 + w * 7, z * 0.055) < prop.cl) continue;
        if (roadDist(x, z) < 2.5 + (prop.far || 0) || riverDist(x, z) < 3.2) continue;
        let clash = false; for (const id in POS) if (Math.hypot(POS[id][0] - x, POS[id][1] - z) < 3 + (prop.far || 0)) { clash = true; break; }
        if (clash || LM.some(s => Math.hypot(s.x - x, s.z - z) < s.fp + 1.5 + (prop.far || 0))) continue;
        list.push([x, z, h, 0.75 + rnd() * 0.65, rnd() * 6.28]);
      }
      for (const [geo, hex, y, sc, turn, glow] of prop.p) {
        const m = new T.InstancedMesh(geo, mat(hex, glow), list.length);
        list.forEach(([x, z, h, s, ry], i) => {
          dummy.position.set(x, h + y * s, z); dummy.rotation.set(0, (turn || 0) + (turn != null ? 0 : ry), 0);
          dummy.scale.set(s * (sc ? sc[0] : 1), s * (sc ? sc[1] : 1), s * (sc ? sc[2] : 1));
          dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
        });
        m.castShadow = !glow; m.computeBoundingSphere();
        scene.add(m);
      }
    }
  });
  // palms on the little islands
  const palms = []; for (const [x0, z0, R] of ISLETS) for (let i = 0; i < R; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * R * 0.6, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r; if (heightAt(x, z) > 0.4) palms.push([x, z, heightAt(x, z)]); }
  const trunk = new T.InstancedMesh(cyl(0.1, 0.16, 1.8), mat(0x9a7a4a), palms.length), leaf = new T.InstancedMesh(cone(1, 0.42, 6), mat(0x4fa850), palms.length);
  palms.forEach(([x, z, h], i) => { dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.position.set(x, h + 0.9, z); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix); dummy.position.set(x, h + 1.95, z); dummy.updateMatrix(); leaf.setMatrixAt(i, dummy.matrix); });
  trunk.computeBoundingSphere(); leaf.computeBoundingSphere(); scene.add(trunk, leaf);
}
// everything still in a world's landmarks becomes one mesh (and one more for what glows), so twenty-four of them cost sixteen draws. What moves stays itself
const lmMeshes = EM.lmMeshes = [];
function bakeLandmarks(w, roots) {
  const lit = { p: [], n: [], c: [] }, glow = { p: [], n: [], c: [] }, keep = [];
  const walk = o => {
    if (o.userData.live) { keep.push(o); return; }
    if (o.isMesh) {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld); g.computeVertexNormals();
      const to = o.userData.glow ? glow : lit, P = g.attributes.position, N = g.attributes.normal, c = o.material.color;
      for (let i = 0; i < P.count; i++) { to.p.push(P.getX(i), P.getY(i), P.getZ(i)); to.n.push(N.getX(i), N.getY(i), N.getZ(i)); to.c.push(c.r, c.g, c.b); }
    }
    o.children.forEach(walk);
  };
  roots.forEach(r => { scene.add(r); r.updateMatrixWorld(true); walk(r); });
  keep.forEach(o => { scene.attach(o); o.traverse(q => { if (q.isMesh) q.castShadow = false; }); });
  roots.forEach(r => scene.remove(r));
  const made = [];
  for (const [b2, mat] of [[lit, new T.MeshLambertMaterial({ vertexColors: true })], [glow, new T.MeshBasicMaterial({ vertexColors: true })]]) {
    if (!b2.p.length) continue;
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b2.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b2.n, 3)); g.setAttribute('color', new T.Float32BufferAttribute(b2.c, 3));
    const m = new T.Mesh(g, mat); m.castShadow = mat.isMeshLambertMaterial; m.receiveShadow = mat.isMeshLambertMaterial; scene.add(m); made.push(m);
  }
  lmMeshes[w] = made;
}
function buildLandmarks() {
  for (let w = 0; w < 8; w++) {
    const roots = LM.filter(s => s.w === w).map(s => {
      const g = new T.Group(); g.position.set(s.x, groundAt(s.x, s.z) - 0.05, s.z); g.rotation.y = s.ry; g.userData.key = s.key;
      AF.EML.build(s.key, g).forEach(f => anims.push(f));
      return g;
    });
    bakeLandmarks(w, roots);
  }
  // ships at sea
  for (const [x, z, r] of [[-168, 40, 1], [-160, -18, 2.4], [150, 52, 0.4], [-40, 138, 1.4], [60, -150, 3]]) {
    const g = new T.Group(); g.position.set(x, 0.1, z); g.rotation.y = r;
    g.add(mesh(box(1.8, 0.8, 5), 0x8a5a3a, 0, 0.3, 0), mesh(cyl(0.1, 0.1, 5), 0x6a4a2a, 0, 3, 0), mesh(box(3, 2.4, 0.1), 0xfff8e8, 0, 3.4, 0.1));
    scene.add(g);
    anims.push(t => { g.position.y = 0.1 + Math.sin(t + x) * 0.08; g.rotation.z = Math.sin(t * 0.8 + z) * 0.04; });
  }
}
function buildClouds() {
  const white = new T.MeshLambertMaterial({ color: 0xffffff, flatShading: true, emissive: 0xc8d8f0, emissiveIntensity: 0.35 }), d = new T.Object3D(), geo = new T.IcosahedronGeometry(1, 1);
  const shift = CAMDIR.z / CAMDIR.y, cloudList = EM.cloudList = [], veil = white.clone(); veil.transparent = true; veil.opacity = 0.88; veil.depthWrite = true;
  for (let w = 1; w < 8; w++) {
    const list = [], cover = (x0, z0, n, spread) => { for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * spread, y = 22 + rnd() * 5; list.push([x0 + Math.cos(a) * r, y, z0 + Math.sin(a) * r + y * shift, 7 + rnd() * 8]); } };
    const seg = dense.filter(q => q.w === w);
    for (let i = 0; i < seg.length; i += 7) cover(seg[i].x, seg[i].z, 5, 16);
    const sideOf = sideLines[w]; for (const p of sideOf) cover(p[0], p[1], 3, 12);
    for (const t of trailLines) if (t.w === w) for (const p of t.line) cover(p[0], p[1], 3, 12);
    for (const q of LM) if (q.w === w) cover(q.x, q.z, 6 + Math.round(q.fp), q.fp + 7); // the biggest still stand up out of the cloud, a promise of what is coming
    const [ax, az, R] = ANCH[w]; cover(ax, az, 46, R * (w === 7 ? 0.9 : 0.95));
    // (4 Nov, owner: "make the central clouds slightly transparent so they can see a ltitle bit only a little tho"); the band round the world's edge stays solid
    // (4 Nov, owner: "i cant see the next stage here"): this world's clouds keep off every stop before it, and off its own first stop, which is the next one you go to
    const clear = EP.NODES.filter(n => n.world < w || n.main === Math.min(...EP.NODES.filter(q => q.world === w && q.main != null).map(q => q.main))).map(n => POS[n.id]).filter(Boolean);
    const keep = list.filter(([x, y, z, s]) => !clear.some(p => Math.hypot(x - p[0], z - y * shift - p[1]) < s + 4));
    cloudList[w] = keep;
    const m = new T.InstancedMesh(geo, veil.clone(), keep.length);
    keep.forEach(([x, y, z, s], i) => { d.position.set(x, y, z); d.rotation.set(rnd(), rnd(), rnd()); d.scale.set(s, s * 0.6, s); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.computeBoundingSphere(); m.renderOrder = 3; scene.add(m);
    worldClouds[w] = m;
  }
  // a band of cloud round the edge of the world, like the border of an old map
  const list = [];
  for (let a = 0; a < 6.283; a += 0.022) { const rx = 262 + rnd() * 24, rz = 212 + rnd() * 24; list.push([Math.cos(a) * rx, 16 + rnd() * 8, Math.sin(a) * rz + 12, 16 + rnd() * 16]); }
  const edge = new T.InstancedMesh(geo, white, list.length);
  list.forEach(([x, y, z, s], i) => { d.position.set(x, y, z); d.rotation.set(rnd(), rnd(), rnd()); d.scale.set(s, s * 0.55, s); d.updateMatrix(); edge.setMatrixAt(i, d.matrix); });
  edge.computeBoundingSphere(); scene.add(edge);
}
const stoneG = cyl(1.15, 1.3, 0.36, 12), topG = cyl(0.9, 0.95, 0.1, 12), rimM = () => new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
const ROOF = [0xc4453a, 0x3a78c0, 0xd8a040, 0x5ac0e0, 0x6a4a9a, 0xe0602a, 0xff4ac0, 0xb98cff];
const BUILD = {
  hat: g => { g.add(mesh(cyl(1.3, 1.45, 0.95, 8), 0xff5a7a, 0, 0.48, 0), mesh(cone(1.6, 1.3, 8), 0xfff0e0, 0, 1.6, 0)); for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + 0.4; g.add(mesh(box(0.3, 0.97, 0.07), 0xfff0e0, Math.cos(a) * 1.38, 0.48, Math.sin(a) * 1.38)); } g.add(mesh(box(0.07, 0.6, 0.07), 0x6a4a2a, 0, 2.5, 0), mesh(cone(0.42, 0.36, 6), 0xffd25a, 0, 2.7, 0)); },
  hut: g => { g.add(mesh(box(2, 1.1, 1.7), 0xc9a06a, 0, 0.55, 0), mesh(cone(1.75, 1, 4), 0x7a4a2e, 0, 1.6, 0), mesh(box(0.6, 0.75, 0.07), 0x4a2e1e, 0, 0.38, 0.87), mesh(box(0.3, 0.95, 0.3), 0x8a8a90, 0.6, 1.95, -0.2)); g.children[1].rotation.y = PI / 4; },
  gate: g => { g.add(mesh(box(0.5, 2.4, 0.5), 0x8a7a6a, -1.1, 1.2, 0), mesh(box(0.5, 2.4, 0.5), 0x8a7a6a, 1.1, 1.2, 0), mesh(box(3, 0.42, 0.62), 0xc9455a, 0, 2.6, 0), mesh(box(1.75, 2, 0.12), 0x6a4a2e, 0, 1, 0)); g.userData.door = g.children[3]; },
  // a landmark's stop: a postbox for its postcard, and a picnic blanket to rest on
  landmark: g => { g.add(mesh(box(2.8, 0.06, 2.2), 0xd9443c, 0, 0.1, 0.5), mesh(box(0.9, 0.07, 2.2), 0xfff6e4, 0, 0.11, 0.5), mesh(cyl(0.1, 0.12, 1.2, 6), 0x5a3a22, -0.7, 0.6, -0.6), mesh(box(1, 0.8, 0.8), 0xe0453a, -0.7, 1.55, -0.6), mesh(cyl(0.4, 0.4, 1, 10), 0xe0453a, -0.7, 1.95, -0.6), mesh(box(0.56, 0.08, 0.04), 0x3a2a1e, -0.7, 1.75, -0.18), mesh(box(0.06, 0.6, 0.06), 0xffd25a, -0.1, 2.1, -0.6), mesh(box(0.4, 0.26, 0.05), 0xffd25a, 0.08, 2.3, -0.6)); g.children[2].rotation.z = 0; g.children[4].rotation.x = PI / 2; },
  chest: g => { g.add(mesh(box(1.6, 0.85, 1.1), 0x9a5a2e, 0, 0.45, 0), mesh(box(1.66, 0.45, 1.16), 0xb86a36, 0, 1.08, 0), mesh(box(0.3, 0.36, 0.06), 0xffd25a, 0, 0.85, 0.58)); g.userData.lid = g.children[1]; },
  castle: (g, n) => { const c = 0x6a6878, d = 0x4e4c5a, r = ROOF[n.world]; g.add(mesh(box(3.4, 1.9, 2.2), c, 0, 0.95, -0.2), mesh(box(0.95, 1.3, 0.1), 0x2a2228, 0, 0.65, 0.95)); for (const x of [-1.8, 1.8]) g.add(mesh(cyl(0.68, 0.78, 3, 8), d, x, 1.5, 0.25), mesh(cone(0.9, 1.3, 8), r, x, 3.6, 0.25)); g.add(mesh(cyl(0.78, 0.86, 3.9, 8), d, 0, 1.95, -0.9), mesh(cone(1.05, 1.55, 8), r, 0, 4.7, -0.9), mesh(box(0.07, 1, 0.07), 0x333333, 0, 5.9, -0.9), mesh(box(0.8, 0.44, 0.04), 0xffd25a, 0.4, 6.15, -0.9)); },
};
function buildNodes() {
  for (const n of EP.NODES) {
    const [x, z] = POS[n.id], y = groundAt(x, z), g = new T.Group(); g.position.set(x, y, z); scene.add(g);
    const N = { n, g, x, z, y, base: null, top: null, rim: null, state: '', mark: null };
    if (n.kind === 'stage') {
      N.base = new T.Mesh(stoneG, mat(0x8a8a90)); N.base.position.y = 0.18; N.base.castShadow = true;
      N.top = new T.Mesh(topG, mat(0xffffff)); N.top.position.y = 0.4;
      g.add(N.base, N.top);
    } else {
      BUILD[n.kind](g, n);
      g.traverse(o => { if (o.isMesh) o.userData.color = o.material.color.getHex(); });
    }
    const rg = new T.RingGeometry(1.45, 1.8, 28); rg.rotateX(-PI / 2);
    N.rim = new T.Mesh(rg, rimM()); N.rim.position.y = 0.16; N.rim.renderOrder = 2; g.add(N.rim);
    nodes.set(n.id, N);
  }
  goalArrow = new T.Group();
  const head = new T.Mesh(cone(0.6, 1, 4), new T.MeshLambertMaterial({ color: 0xffd25a, emissive: 0xffa82a, emissiveIntensity: 0.6, flatShading: true })); head.rotation.x = PI; goalArrow.add(head);
  scene.add(goalArrow);
  goldenM = new T.Group();
  const coin = new T.Mesh(cyl(0.8, 0.8, 0.2, 14), new T.MeshLambertMaterial({ color: 0xffd25a, emissive: 0xffa82a, emissiveIntensity: 0.8 })); coin.rotation.x = PI / 2; goldenM.add(coin);
  goldenM.visible = false; scene.add(goldenM);
}
// sparkling finds, off the road: worth looking around for
function buildFinds() {
  const geo = new T.OctahedronGeometry(0.55, 0);
  for (let w = 0; w < 8; w++) {
    const seg = dense.filter(q => q.w === w); let made = 0, tries = 0;
    while (made < EP.FINDS_PER_WORLD && tries++ < 400) {
      const p = seg[Math.floor(rnd() * seg.length)], a = rnd() * 6.28, r = 7 + rnd() * 16, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, h = heightAt(x, z);
      if (h < 0.5 || h > 5 || biome(x, z).a !== w || roadDist(x, z) < 5) continue;
      let clash = false; for (const f of finds.values()) if (Math.hypot(f.x - x, f.z - z) < 14) clash = true;
      if (clash) continue;
      const id = `${w}-${made}`, m = new T.Mesh(geo, new T.MeshLambertMaterial({ color: 0xfff0a0, emissive: 0xffc83a, emissiveIntensity: 0.9, flatShading: true }));
      m.position.set(x, h + 1.1, z); scene.add(m);
      finds.set(id, { id, w, x, z, y: h + 1.1, m });
      made++;
    }
  }
}
function build() {
  scene = new T.Scene();
  scene.add(new T.HemisphereLight(0xffffff, 0x8a8aa0, 1.15));
  const sun = new T.DirectionalLight(0xfff0d8, 2); sun.position.set(-90, 150, 60); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -280, right: 280, top: 240, bottom: -240, near: 1, far: 480 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.35;
  scene.add(sun);
  cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, 900);
  seed = 11;
  buildGround(); buildRoads(); buildProps(); buildLandmarks(); buildNodes(); buildFinds(); buildClouds();
  gl.shadowMap.needsUpdate = true;
  built = true;
}

// ---------------- how the map reads right now ----------------
const STATE_COL = { locked: 0x6a6a74, open: 0xffd25a, done: 0x7fd86a, gold: 0xffc23a };
function stateOf(n) {
  if (!EP.isOpen(n)) return 'locked';
  if (n.kind === 'stage' || n.kind === 'castle') { const s = EP.best(n.id); return s >= 3 ? 'gold' : s > 0 ? 'done' : 'open'; }
  if (n.kind === 'chest') return EP.S().chests[n.ckey != null ? n.ckey : n.world] ? 'done' : 'open';
  if (n.kind === 'gate') return EP.gateOpen(n.world) ? 'done' : 'open';
  if (n.kind === 'landmark') return !EP.lmHas(n.lm) || EP.lmCanRest(n.lm) ? 'open' : 'done';
  return 'open';
}
function paintNode(N) {
  const n = N.n, st = stateOf(n);
  N.state = st;
  if (n.kind === 'stage') {
    N.top.material.color.set(STATE_COL[st]);
    N.base.material.color.set(n.side != null ? 0x7a5a9a : n.trail != null ? 0x3f9a8a : st === 'locked' ? 0x565660 : 0x8a8a90); // a trail's stones are green, a Buddy Gate's purple
  } else {
    const dim = st === 'locked';
    N.g.traverse(o => { if (o.isMesh && o.userData.color != null) { o.material.color.set(o.userData.color); if (dim) o.material.color.multiplyScalar(0.55); } });
    if (n.kind === 'gate' && N.g.userData.door) N.g.userData.door.visible = st !== 'done';
    if (n.kind === 'chest' && N.g.userData.lid) N.g.userData.lid.rotation.x = st === 'done' ? -1.1 : 0;
  }
}
// (4 Nov, owner: "this icon moves fix"): these were page elements laid over the map, a frame behind it while panning and a
// fixed size while it zoomed, so they slid about on their buildings. Now they are part of the picture and cannot.
const BADGE = { hat: 'tent', hut: 'scroll', gate: 'gate', chest: 'chest', castle: 'crown', landmark: 'pin' };
const MARK_PX = 3, MARK_HOME = 1 / 18.5; // canvas pixels for each design pixel, and world units for each design pixel at the usual zoom
const markMats = new Map(), starImg = new Image(); starImg.src = 'art/star3d.webp';
const starReady = starImg.decode().catch(() => {});
function markMat(kind, locked, stars) {
  const badge = BADGE[kind]; if (!badge && !stars) return null;
  const key = `${kind}|${locked ? 1 : 0}|${stars}`; let m = markMats.get(key); if (m) return m;
  const w = stars ? 37 : 29, h = (badge ? 29 : 0) + (stars ? 13 : 0) + (badge && stars ? 1 : 0);
  const cv = document.createElement('canvas'); cv.width = w * MARK_PX; cv.height = h * MARK_PX;
  const c = cv.getContext('2d'), tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace;
  m = new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
  m.userData = { w, h };
  const draw = () => {
    c.setTransform(MARK_PX, 0, 0, MARK_PX, 0, 0); c.clearRect(0, 0, w, h);
    if (badge) {
      const x = (w - 29) / 2;
      c.globalAlpha = locked ? 0.55 : 1;
      c.beginPath(); c.arc(x + 14.5, 14.5, 13.5, 0, 6.3); c.fillStyle = '#fffdf5'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(58,42,30,.45)'; c.stroke();
      EI().paint(c, badge, x + 4.5, 4.5, 20);
      c.globalAlpha = 1;
    }
    if (stars) {
      const y = badge ? 30 : 0;
      c.beginPath(); c.roundRect(0, y, 37, 13, 2); c.fillStyle = '#fffdf5'; c.fill();
      if (starImg.naturalWidth) for (let i = 0; i < 3; i++) {
        if (i < stars) { c.drawImage(starImg, 2 + i * 11, y + 1, 11, 11); continue; }
        // a star not earned: its shape in grey
        const o = document.createElement('canvas'); o.width = o.height = 33; const q = o.getContext('2d');
        q.drawImage(starImg, 0, 0, 33, 33); q.globalCompositeOperation = 'source-atop'; q.fillStyle = '#b9ad98'; q.fillRect(0, 0, 33, 33);
        c.globalAlpha = 0.7; c.drawImage(o, 2 + i * 11, y + 1, 11, 11); c.globalAlpha = 1;
      }
    }
    tx.needsUpdate = true;
  };
  draw();
  Promise.all([EI().sheet, starReady]).then(draw);
  markMats.set(key, m);
  return m;
}
function markOf(N) {
  const mat = markMat(N.n.kind, N.state === 'locked', EP.best(N.n.id) || 0);
  if (!mat) { if (N.mark) N.mark.visible = false; return null; }
  if (!N.mark) { N.mark = new T.Sprite(mat); N.mark.renderOrder = 6; scene.add(N.mark); }
  N.mark.material = mat;
  return N.mark;
}
const openWorld = w => EP.reachNode().world >= w;
EM.refresh = () => {
  if (!built) return;
  for (const N of nodes.values()) paintNode(N);
  const g = EP.goal(), Ng = nodes.get(g.id);
  goalArrow.position.set(Ng.x, Ng.y + 2.6 + (Ng.n.kind === 'castle' ? 6 : 0), Ng.z);
  const e = EP.S();
  goldenM.visible = !!e.golden;
  if (e.golden && POS[e.golden]) goldenM.position.set(POS[e.golden][0], groundAt(POS[e.golden][0], POS[e.golden][1]) + 3.3, POS[e.golden][1]);
  for (const f of finds.values()) f.m.visible = openWorld(f.w) && !(e.finds || {})[f.id];
  // (4 Nov, owner: "make the next area to unlock in expedition slightly more transparent")
  const nextWorld = worldClouds.findIndex((m, w) => m && !openWorld(w));
  worldClouds.forEach((m, w) => { if (m) { m.visible = !openWorld(w); m.material.opacity = w === nextWorld ? 0.72 : 0.88; } });
  buildParty();
  paintSigns();
  labelsDirty = true;
};
let labelsDirty = true;
// the party on the road: the leader and whoever walks behind
function buildParty() {
  const list = EP.partyList(), key = list.map(a => { const t = G.towerOf(a); return t ? t.k : a; }).join();
  if (key === party.key) return;
  party.key = key;
  for (const f of party.list) scene.remove(f.g);
  party.list = list.map((a, i) => {
    const t = G.towerOf(a), g = new T.Group(), holder = new T.Group();
    holder.scale.setScalar(0.6); g.add(holder); scene.add(g);
    const R = AF.R3.makeRig(holder, AF.formKey(t), t.sh, t.tr === 'golden');
    if (AF.aura) AF.aura.attach(g, () => t.tr, AF.aura.measure(R, g));
    return { g, R, i, holder, ph: i * 2.1 };
  });
  if (party.at == null) {
    const e = EP.S(), at = e.at && POS[e.at] ? e.at : EP.goal().id;
    party.at = at; [party.x, party.z] = POS[at];
  }
}
const routeTo = id => {
  // main road nodes go via the road; a side node walks through its gate; a trail's, from the stop it leaves
  const cur = EP.BY[party.at], to = EP.BY[id], mainI = n => (n.main != null ? n.main : n.trail != null ? n.branchOf : EP.BY['gate-' + n.world].branchOf);
  const idsOf = n => (n.trail != null ? EP.TRAILS[n.world][n.trail].ids : [`gate-${n.world}`, `side-${n.world}-0`, `side-${n.world}-1`, `side-${n.world}-2`, `chest-${n.world}`]);
  const line = [];
  const sideLine = n => { const ids = idsOf(n), k = ids.indexOf(n.id); return ids.slice(0, k + 1).map(i => POS[i]); };
  // along the same trail, you just walk along it
  if (cur.main == null && to.main == null && idsOf(cur)[0] === idsOf(to)[0]) { const ids = idsOf(cur), a = ids.indexOf(cur.id), b = ids.indexOf(to.id), dir = b > a ? 1 : -1; for (let i = a + dir; i !== b + dir; i += dir) line.push(POS[ids[i]]); return line; }
  if (cur.main == null) line.push(...sideLine(cur).reverse());
  const a = mainI(cur), b = mainI(to), dir = b > a ? 1 : -1;
  for (let i = a; i !== b + dir; i += dir) line.push(POS[EP.MAIN[i].id]);
  if (to.main == null) line.push(...sideLine(to));
  return line;
};
EM.walkTo = id => {
  if (!POS[id] || party.at === id) return;
  party.path = routeTo(id);
  party.at = id; party.moving = true;
  EP.S().at = id;
};
function stepParty(dt) {
  if (party.moving && party.path.length) {
    let go = dt * Math.max(26, party.path.length * 8);
    while (go > 0 && party.path.length) {
      const [tx, tz] = party.path[0], d = Math.hypot(tx - party.x, tz - party.z);
      if (d <= go) { party.x = tx; party.z = tz; go -= d; party.path.shift(); }
      else { party.dir = Math.atan2(tx - party.x, tz - party.z); party.x += (tx - party.x) / d * go; party.z += (tz - party.z) / d * go; go = 0; }
    }
    if (!party.path.length) party.moving = false;
  }
  party.list.forEach((f, i) => {
    const off = [[-0.1, 0.5], [-1.1, -0.3], [-1.3, 0.9]][i] || [0, 0], x = party.x + off[0], z = party.z + off[1];
    f.g.position.set(x, groundAt(x, z) + 0.42, z);
    f.g.rotation.y = party.moving ? party.dir || 1 : 0.5;
    K.animate(f.R, time + f.ph, f.R.P);
    f.holder.position.y = party.moving ? Math.abs(Math.sin(time * 14 + f.ph)) * 0.22 : 0;
  });
}

// ---------------- the camera ----------------
const CAMDIR = new T.Vector3(0, 1, 0.62).normalize();
const VIEW_MIN = 20, VIEW_MAX = 290, VIEW_HOME = 46;
const SPAN = () => Math.max(view.h / H, W < 700 ? (view.h * 0.46) / W : 0);
function placeCam() {
  const k = SPAN();
  cam.left = -W * k / 2; cam.right = W * k / 2; cam.top = H * k / 2; cam.bottom = -H * k / 2;
  cam.position.set(focus.x, 0, focus.z).addScaledVector(CAMDIR, 300);
  cam.lookAt(focus.x, 0, focus.z);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  EM.fine = 1 / k > 9;
}
const v3 = new T.Vector3();
function scr(x, y, z) { v3.set(x, y, z).project(cam); return [(v3.x + 1) * W / 2, (1 - v3.y) * H / 2]; }
EM.nodeScreen = id => { const p = POS[id]; if (!p) return null; const [x, y] = scr(p[0], groundAt(p[0], p[1]) + 0.4, p[1]), r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; };
function clampFocus() {
  // the further out you are, the less there is to push past
  const k = SPAN(), mx = Math.max(0, 215 - (W * k) / 2 * 0.55), mz = Math.max(0, 170 - (H * k) / 2 * 0.55);
  focus.tx = Math.max(-mx, Math.min(mx, focus.tx)); focus.tz = Math.max(-mz, Math.min(mz + 10, focus.tz));
}
// stands the party on a stop at once, with no walk
EM.placeAt = id => { const p = POS[id]; if (!p) return false; party.at = id; party.path = []; party.moving = false; [party.x, party.z] = p; EP.S().at = id; return true; };
EM.focusOn = (id, instant) => {
  const p = POS[id]; if (!p) return;
  focus.tx = p[0]; focus.tz = p[1]; focus.vx = focus.vz = 0;
  if (instant) { focus.x = focus.tx; focus.z = focus.tz; placeCam(); labelsDirty = true; }
};
EM.zoomBy = f => { view.to = Math.max(VIEW_MIN, Math.min(VIEW_MAX, view.to * f)); };
EM.home = () => { view.to = VIEW_HOME; };
EM.view = view;
EM.focus = focus;

// ---------------- input ----------------
const drag = { on: false, x: 0, y: 0, moved: 0, last: 0 };
const ptrs = new Map();
let pinch = 0, hoverN = null;
function nodeAt(px, py) {
  let best = null, bd = 34 * 34;
  if (!EM.fine) return null;
  for (const N of nodes.values()) {
    if (!openWorld(N.n.world)) continue;
    const [x, y] = scr(N.x, N.y + 0.4 + (N.n.kind === 'stage' ? 0 : 0.9), N.z), d = (x - px) ** 2 + (y - py) ** 2;
    if (d < bd) { bd = d; best = N; }
  }
  return best;
}
function findAt(px, py) {
  if (!EM.fine) return null;
  for (const f of finds.values()) { if (!f.m.visible) continue; const [x, y] = scr(f.x, f.y, f.z); if ((x - px) ** 2 + (y - py) ** 2 < 30 * 30) return f; }
  return null;
}
const xy = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
function onDown(e) {
  const [x, y] = xy(e);
  lmTag(null);
  ptrs.set(e.pointerId, [x, y]);
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); drag.moved = 99; return; }
  Object.assign(drag, { on: true, x, y, x0: x, y0: y, moved: 0, last: performance.now() });
  focus.vx = focus.vz = 0;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
}
function onMove(e) {
  const [x, y] = xy(e);
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [x, y]);
  if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (d > 0) { view.to = Math.max(VIEW_MIN, Math.min(VIEW_MAX, view.to * (pinch / d))); view.h = view.to; pinch = d; placeCam(); labelsDirty = true; }
    return;
  }
  if (!drag.on) { hoverN = nodeAt(x, y); canvas.style.cursor = hoverN || findAt(x, y) ? 'pointer' : 'grab'; lmTag(hoverN ? null : EM.landmarkAt(x, y), x, y); return; }
  const k = SPAN(), dx = x - drag.x, dy = y - drag.y, now = performance.now(), dtm = Math.max(0.006, (now - drag.last) / 1000);
  drag.moved = Math.max(drag.moved, Math.hypot(x - drag.x0, y - drag.y0));
  if (drag.moved > 5) {
    canvas.style.cursor = 'grabbing';
    const zk = 1 / CAMDIR.y;
    focus.tx -= dx * k; focus.tz -= dy * k * zk; clampFocus();
    focus.x = focus.tx; focus.z = focus.tz;
    focus.vx = focus.vx * 0.6 + (-dx * k / dtm) * 0.4; focus.vz = focus.vz * 0.6 + (-dy * k * zk / dtm) * 0.4;
    placeCam(); labelsDirty = true;
  }
  drag.x = x; drag.y = y; drag.last = now;
}
function onUp(e) {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = 0;
  if (!drag.on) return;
  drag.on = false;
  canvas.style.cursor = 'grab';
  if (drag.moved <= 5) {
    const [x, y] = xy(e), f = findAt(x, y), N = f ? null : nodeAt(x, y);
    if (f && hooks.find) { const got = hooks.find(f.id); if (got) { f.m.visible = false; floatAt(f, got); } }
    else if (N && hooks.pick) hooks.pick(N.n);
    else if (!EM.fine) { // zoomed out: a tap zooms back in on that spot
      const r = canvas.getBoundingClientRect(), k = SPAN(); focus.tx = focus.x + (x - r.width / 2) * k; focus.tz = focus.z + (y - r.height / 2) * k / CAMDIR.y; clampFocus(); view.to = VIEW_HOME;
    }
    focus.vx = focus.vz = 0;
  } else if (performance.now() - drag.last > 80) { focus.vx = focus.vz = 0; }
}
function onWheel(e) {
  e.preventDefault();
  EM.zoomBy(Math.exp(e.deltaY * 0.0014));
}
function floatAt(f, html) {
  const [x, y] = scr(f.x, f.y, f.z), el = document.createElement('div');
  el.className = 'em-float'; el.innerHTML = html; el.style.left = x + 'px'; el.style.top = y + 'px';
  labels.appendChild(el); setTimeout(() => el.remove(), 1400);
}

// ---------------- the world's signs: what you see zoomed out ----------------
function buildSigns() {
  EP.WORLDS.forEach((w, i) => {
    const el = document.createElement('button'); el.className = 'em-wb';
    el.onclick = () => { if (!openWorld(i)) return; focus.tx = ANCH[i][0]; focus.tz = ANCH[i][1]; clampFocus(); view.to = VIEW_HOME; };
    labels.appendChild(el);
    signs[i] = el;
  });
}
function paintSigns() {
  signs.forEach((el, i) => {
    const open = openWorld(i), stars = EP.NODES.filter(n => n.world === i && (n.kind === 'stage' || n.kind === 'castle')).reduce((a, n) => a + EP.best(n.id), 0);
    el.classList.toggle('shut', !open);
    el.innerHTML = open ? `${EI().world(i)}<b>${EP.WORLDS[i].name}</b>${stars ? `<u>${EI().i('stars')}${stars}</u>` : ''}` : EI().i('lock');
    el.title = open ? EP.WORLDS[i].name : '';
  });
}

// ---------------- mounting and the frame ----------------
EM.mount = (el, h) => {
  hooks = h || {};
  if (!gl) {
    gl = new T.WebGLRenderer({ antialias: true, alpha: false });
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); gl.outputColorSpace = T.SRGBColorSpace;
    gl.shadowMap.enabled = true; gl.shadowMap.type = T.PCFSoftShadowMap; gl.shadowMap.autoUpdate = false;
    gl.setClearColor(0x0d4f86, 1);
    canvas = gl.domElement; canvas.className = 'em-gl';
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag.on = false; });
    canvas.addEventListener('pointerleave', () => lmTag(null));
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.style.touchAction = 'none';
    labels = document.createElement('div'); labels.className = 'em-labels';
    buildSigns();
  }
  if (!built) build();
  host = el;
  host.append(canvas, labels);
  EM.on = true;
  resize();
  if (ro) ro.disconnect();
  ro = new ResizeObserver(resize); ro.observe(host);
  EM.refresh();
  const at = party.at && POS[party.at] ? party.at : EP.goal().id;
  EM.focusOn(at, true);
};
function resize() {
  if (!host) return;
  const r = host.getBoundingClientRect();
  W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  gl.setSize(W, H, false);
  canvas.style.width = '100%'; canvas.style.height = '100%';
  placeCam(); labelsDirty = true;
}
EM.unmount = () => { EM.on = false; if (ro) { ro.disconnect(); ro = null; } if (canvas && canvas.parentNode) canvas.remove(); if (labels && labels.parentNode) labels.remove(); host = null; };
function placeLabels() {
  const margin = 80;
  for (const N of nodes.values()) {
    const big = N.n.kind !== 'stage', [x, y] = scr(N.x, N.y + (big ? (N.n.kind === 'castle' ? 8.4 : N.n.kind === 'hat' ? 4 : 3.4) : 0.42), N.z);
    const on = EM.fine && openWorld(N.n.world) && x > -margin && x < W + margin && y > -margin && y < H + margin;
    if (!on) { if (N.mark) N.mark.visible = false; continue; }
    const mark = markOf(N); if (!mark) continue;
    // it zooms with the map, but never so small it can't be read
    const u = mark.material.userData, size = Math.max(MARK_HOME, SPAN() * 0.85);
    mark.visible = true;
    if (big) mark.position.set(N.x, N.y + (N.n.kind === 'castle' ? 8.4 : N.n.kind === 'hat' ? 4 : 3.4), N.z);
    else mark.position.set(N.x, N.y + 0.42, N.z + 1.05); // a stop's stars sit just in front of its stone
    mark.scale.set(u.w * size, u.h * size, 1);
  }
  signs.forEach((el, i) => {
    const A = ANCH[i], [x, y] = scr(A[0], 6, A[1]), on = !EM.fine;
    el.style.display = on ? '' : 'none';
    if (on) el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
  });
}
const nearestWorld = () => { let w = 0, b = Infinity; for (let i = 0; i < 8; i++) { const d = Math.hypot(ANCH[i][0] - focus.x, ANCH[i][1] - focus.z) / ANCH[i][3]; if (d < b) { b = d; w = i; } } return w; };
EM.frame = dt => {
  if (!EM.on) return;
  time += dt;
  if (water) water.material.uniforms.t.value = time;
  for (const a of anims) a(time);
  if (Math.abs(view.to - view.h) > 0.01) { view.h += (view.to - view.h) * (1 - Math.exp(-dt * 9)); clampFocus(); placeCam(); labelsDirty = true; }
  if (!drag.on) {
    if (Math.abs(focus.vx) > 0.2 || Math.abs(focus.vz) > 0.2) { focus.tx += focus.vx * dt; focus.tz += focus.vz * dt; const f = Math.exp(-dt * 4.2); focus.vx *= f; focus.vz *= f; clampFocus(); }
    const k = 1 - Math.exp(-dt * 8), dx = focus.tx - focus.x, dz = focus.tz - focus.z;
    if (Math.abs(dx) + Math.abs(dz) > 0.002) { focus.x += dx * k; focus.z += dz * k; placeCam(); labelsDirty = true; }
  }
  const pulse = 0.5 + Math.sin(time * 3.6) * 0.5;
  if (goalArrow) { const n = nodes.get(EP.goal().id); goalArrow.position.y = n.y + 2.6 + (n.n.kind === 'castle' ? 6 : 0) + pulse * 0.5; }
  if (goldenM && goldenM.visible) goldenM.rotation.y = time * 2.4;
  for (const f of finds.values()) if (f.m.visible) { f.m.rotation.y = time * 1.6; f.m.position.y = f.y + Math.sin(time * 2.4 + f.x) * 0.16; const s = 1 + Math.sin(time * 5 + f.z) * 0.12; f.m.scale.setScalar(s); }
  for (const N of nodes.values()) {
    if (N.state === 'open') { N.rim.material.opacity = 0.25 + pulse * 0.5; N.rim.material.color.set(0xffd25a); }
    else if (N === hoverN && N.state !== 'locked') { N.rim.material.opacity = 0.55; N.rim.material.color.set(0xffffff); }
    else N.rim.material.opacity = 0;
  }
  stepParty(dt);
  if (labelsDirty) { placeLabels(); labelsDirty = false; }
  gl.render(scene, cam);
  if (hooks.tick) hooks.tick(nearestWorld());
};
// a landmark's name, on a tag by the mouse. Not a title: the game's tooltips would read that as one for the whole map
let lmEl = null;
function lmTag(s, x, y) {
  if (!s) { if (lmEl) lmEl.hidden = true; return; }
  if (!lmEl) { lmEl = document.createElement('div'); lmEl.className = 'em-lm'; }
  if (lmEl.parentNode !== labels) labels.appendChild(lmEl);
  lmEl.hidden = false; lmEl.textContent = s.name; lmEl.style.left = x + 'px'; lmEl.style.top = y + 'px';
}
EM.lmTagText = () => (lmEl && !lmEl.hidden ? lmEl.textContent : '');
// which landmark is under this point of the map
EM.landmarkAt = (px, py) => { let best = null, bd = Infinity; const k = SPAN(); for (const s of LM) { if (!openWorld(s.w)) continue; const [x, y] = scr(s.x, groundAt(s.x, s.z) + s.h * 0.45, s.z), rx = Math.max(s.fp, 3) / k, ry = (s.h * 0.62 + 2) / k, d = ((x - px) / rx) ** 2 + ((y - py) / ry) ** 2; if (d < 1 && d < bd) { bd = d; best = s; } } return best; };
// (owner: "make them have a special node"): a picture of a landmark from the stop at its foot, for its postcard. Drawn once
const cards = new Map();
EM.postcard = key => {
  if (cards.has(key)) return cards.get(key);
  const s = LM.find(q => q.key === key); if (!s || !gl) return null;
  const pr = gl.getPixelRatio(), vw = Math.min(W, 480), vh = Math.min(H, Math.round(vw * 2 / 3));
  const c = new T.PerspectiveCamera(30, vw / vh, 1, 1400), dist = Math.max(s.h * 1.15, s.fp * 2.2) * 2 + 6, y0 = groundAt(s.x, s.z) + s.h * 0.46;
  c.position.set(s.x + Math.sin(s.ry) * dist * 0.92, y0 + dist * 0.28, s.z + Math.cos(s.ry) * dist * 0.92); c.lookAt(s.x, y0, s.z);
  // nothing that isn't the world in the picture
  const hide = [goalArrow, goldenM].concat(worldClouds.filter(Boolean), [...nodes.values()].map(N => N.mark).filter(Boolean)), was = hide.map(o => o.visible);
  hide.forEach(o => { o.visible = false; });
  const clear = new T.Color(); gl.getClearColor(clear); gl.setClearColor(0xa8dcf4, 1);
  gl.setViewport(0, 0, vw, vh); gl.setScissor(0, 0, vw, vh); gl.setScissorTest(true);
  gl.render(scene, c);
  const out = document.createElement('canvas'); out.width = 480; out.height = 320;
  out.getContext('2d').drawImage(canvas, 0, canvas.height - vh * pr, vw * pr, vh * pr, 0, 0, 480, 320);
  gl.setScissorTest(false); gl.setViewport(0, 0, W, H); gl.setClearColor(clear, 1);
  hide.forEach((o, i) => { o.visible = was[i]; });
  cards.set(key, out);
  return out;
};
// what tools/soju_map_spots.mjs saves
EM.spotsDump = () => ({ sig: spotsSig, list: LM.map(s => { const tr = EP.TRAILS[s.w][s.trail], t = trailLines.find(q => q.w === s.w && q.j === s.trail); return { key: s.key, w: s.w, x: s.x, z: s.z, room: s.room, strict: s.strict, ry: s.ry, near: t.near, stops: tr.ids.map(id => POS[id]) }; }) });
EM.party = party;
EM.cloudOpacity = () => worldClouds.map((m, w) => (m && m.visible ? [w, m.material.opacity] : null)).filter(Boolean);
// how many clouds now showing sit over a stop
EM.coveredBy = id => { const p = POS[id]; if (!p) return -1; const shift = CAMDIR.z / CAMDIR.y; let n = 0; (EM.cloudList || []).forEach((l, w) => { if (!l || !worldClouds[w] || !worldClouds[w].visible) return; for (const [x, y, z, r] of l) if (Math.hypot(x - p[0], z - y * shift - p[1]) < r) n++; }); return n; };
EM.marks = () => [...nodes.values()].filter(N => N.mark && N.mark.visible).map(N => ({ id: N.n.id, kind: N.n.kind, sp: N.mark }));
EM.scene = () => scene;
EM.camera = () => cam;
EM.renderer = () => gl;
EM.finds = finds;
EM.findXY = id => { const f = finds.get(id); if (!f) return null; const [x, y] = scr(f.x, f.y, f.z), r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; };
EM.screenOfWorld = (x, z) => { const [a, b] = scr(x, groundAt(x, z), z), r = canvas.getBoundingClientRect(); return [r.left + a, r.top + b]; };
})();
