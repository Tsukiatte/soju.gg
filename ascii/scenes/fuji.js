// fuji.js · a floating Mount Fuji, drawn only with letters
import { Cloud, rng, norm } from "../engine/ascii.js";

export const meta = {
  id: "fuji", title: "MOUNT FUJI", sub: "drawn with letters only",
  duration: 25.046, sky: ["#03050f", "#0b1030", "#1c1546"], accent: "#ff8fc0",
  // the song: JVKE "golden hour" (official), 10 bars from 38.337 s, so it loops on a downbeat.
  // hits = the beats the letters flash on: librosa-tracked beats before "shine", stronger where the piano
  // strikes and on chord changes. Nothing flashes after the drop except the drop itself.
  music: { bpm: 93.96, offset: 0.165, hits: [[0.165, 1.0], [0.792, 0.45], [1.407, 1.0], [2.046, 0.75], [2.661, 0.75], [3.3, 1.0], [3.95, 0.45], [4.588, 0.75], [5.204, 0.75], [5.854, 0.75], [6.481, 0.45], [7.096, 0.7], [7.746, 0.45], [8.35, 0.45], [8.965, 0.45]] },
  // the island builds first, the mountain rises last and is complete at 8.965 s, just before "...to see you
  // shine". The drop hits at 10.019 s: one white flash + a fast spin.
  drop: 10.019,
  timeline: [
    ["ground", -0.3, 1.407, "// the ground"],
    ["rock", 0.165, 2.661, "// the rock"],
    ["forest", 1.407, 3.95, "// a forest all around"],
    ["pagoda", 2.661, 3.95, "// the pagoda"],
    ["sakura", 2.661, 5.204, "// cherry trees"],
    ["torii", 3.95, 5.204, "// the gate"],
    ["lights", 3.95, 5.204, "// village lights"],
    ["mountain", 3.95, 8.965, "// the mountain rises last"],
    ["sky", 10.019, 11.279, "// the sky moves"],
  ],
  closing: [23.679, 24.746],                            // a fast dissolve under the glitch-out
};

const R = rng(2026);
const H = 1.22;                                         // summit height (island radius = 1)

function terrain(x, z) {                                // height of the island's top surface
  const cx = x + 0.05, cz = z + 0.08, r = Math.hypot(cx, cz), a = Math.atan2(cz, cx);
  const base = 0.74 * (1 + 0.035 * Math.sin(3 * a + 1.3) + 0.015 * Math.sin(7 * a + 0.4));   // an uneven footprint
  let y = r < base ? H * Math.pow(1 - r / base, 1.65) : 0;                                // concave slopes
  y += 0.07 * H * Math.exp(-((cx - 0.24) ** 2 + (cz + 0.12) ** 2) / 0.008);                // a shoulder on one flank
  y -= 0.02 * Math.exp(-((cx - 0.25) ** 2 + (cz + 0.13) ** 2) / 0.0015);                   // with its own crater
  const ridge = Math.pow(Math.abs(Math.sin(5.5 * a + 2 * r)), 6);                         // sharp ridges, soft gullies
  y += (0.022 * ridge - 0.008) * Math.min(1, r * 4) * Math.min(1, (base - r) * 6) * (r < base ? 1 : 0);
  const top = H * Math.pow(1 - 0.075 / base, 1.65);
  if (r < 0.075) y = top - (0.075 - r) * 0.6 + 0.01 * Math.sin(9 * a);                  // a ragged crater rim
  if (Math.hypot(x + 0.55, z - 0.5) < 0.24) y = Math.min(y, -0.015);                    // a small lake
  return Math.max(y, -0.015);
}

function colour(x, y, z) {                              // what the ground looks like at (x, y, z)
  const a = Math.atan2(z, x), h = y / H, n = 0.5 + 0.5 * Math.sin(13 * x + 7 * z);
  const snow = 0.4 + 0.07 * Math.sin(7 * a) + 0.06 * Math.abs(Math.sin(23 * a));  // ragged snowline
  if (Math.hypot(x + 0.55, z - 0.5) < 0.24) return [40, 170 + 40 * n, 255];       // lake
  if (h > snow) return h > snow + 0.08 ? [255, 250, 255] : [255, 196, 228];       // snow, pink at its edge
  if (y > 0.04) return [70 + 90 * h, 80 + 20 * h, 210 + 45 * h];                   // blue -> violet slopes
  return [60 + 70 * n, 190 + 50 * n, 80];                                          // grass
}

export function build() {
  const q = new Cloud();
  // the ground
  for (let i = 0; i < 160000; i++) {                     // sample the disc, lift each point by the terrain
    const r = Math.sqrt(R()), a = R() * 6.2832;
    const x = r * Math.cos(a), z = r * Math.sin(a), y = terrain(x, z), e = 0.004;
    const n = norm(terrain(x - e, z) - terrain(x + e, z), 2 * e, terrain(x, z - e) - terrain(x, z + e));
    // the mountain
    const peak = y > 0.04;                              // flat ground grows outwards, the mountain upwards
    q.add([x, y, z], n, colour(x, y, z), 0, peak ? 1 : 0, peak ? y / H : Math.max(0, (r - 0.6) / 0.4));
  }
  // the rock
  for (let i = 0; i < 48000; i++) {                     // hanging underneath like a root
    const u = Math.pow(R(), 0.8), a = R() * 6.2832;
    const jag = 1 + 0.12 * Math.sin(5 * a + 9 * u) + 0.06 * R();
    const rad = (1 - u) ** 0.7 * jag, y = -0.02 - u * 0.95, tone = 0.7 + 0.3 * Math.sin(20 * y + 3 * a);
    q.add([rad * Math.cos(a), y, rad * Math.sin(a)], norm(Math.cos(a), 0.15, Math.sin(a)),
      [(200 - 60 * u) * tone, (120 - 40 * u) * tone, (90 + 60 * u) * tone], 0, 2, u);
  }
  // a forest all around
  for (let i = 0; i < 110; i++) {                       // pines on every side of the island
    const a = R() * 6.2832, r = 0.74 + 0.22 * R();
    const x = r * Math.cos(a), z = r * Math.sin(a);
    if (Math.hypot(x + 0.55, z - 0.5) < 0.3 || Math.hypot(x - 0.58, z - 0.48) < 0.12 ||
        Math.hypot(x + 0.3, z - 0.62) < 0.1) continue;                    // not in the lake, pagoda or gate
    pine(q, x, terrain(x, z), z, 0.09 + 0.08 * R(), (a / 6.2832 + R() * 0.1) % 1);
  }
  for (let i = 0; i < 9; i++) {                         // little houses that the lights belong to
    const a = 0.4 + i * 0.68 + 0.2 * R(), r = 0.9;
    house(q, r * Math.cos(a), r * Math.sin(a), i / 9);
  }
  // the pagoda
  pagoda(q, 0.58, 0.48);
  // cherry trees
  for (const [x, z, s] of [[0.42, 0.66, 0.11], [0.75, 0.28, 0.1], [0.3, 0.8, 0.08], [0.8, 0.55, 0.09], [-0.2, 0.86, 0.1],
    [-0.82, -0.2, 0.09], [-0.6, -0.6, 0.1], [0.1, -0.88, 0.09], [0.55, -0.7, 0.08], [0.88, -0.15, 0.09], [-0.88, 0.25, 0.08]])
    sakura(q, x, z, s);
  // the gate
  torii(q, -0.3, 0.62);
  // village lights
  for (let i = 0; i < 120; i++) {                       // they switch on one by one around the rim
    const a = R() * 6.2832, r = 0.86 + 0.1 * R();
    q.add([r * Math.cos(a), 0.012, r * Math.sin(a)], [0, 1, 0], [255, 205, 90], 1, 6, R());
  }
  // the mountain rises last: its letters were sampled with the ground (group 1) and land after everything else
  return q.pack();
}

function box(q, x0, y0, z0, w, h, d, c, n, group, r0, r1) {   // points on the sides of a box
  for (let i = 0; i < n; i++) {
    const f = Math.floor(R() * 5), u = R() - 0.5, v = R();
    const p = [[x0 + w / 2, y0 + v * h, z0 + u * d, 1, 0, 0], [x0 - w / 2, y0 + v * h, z0 + u * d, -1, 0, 0],
      [x0 + u * w, y0 + v * h, z0 + d / 2, 0, 0, 1], [x0 + u * w, y0 + v * h, z0 - d / 2, 0, 0, -1],
      [x0 + u * w, y0 + h, z0 + (v - 0.5) * d, 0, 1, 0]][f];
    q.add(p.slice(0, 3), p.slice(3), c, 0, group, r0 + (r1 - r0) * v);
  }
}

function pagoda(q, x, z) {                              // five storeys, each roof wider than its walls
  for (let k = 0; k < 5; k++) {
    const y = k * 0.055, w = 0.1 - k * 0.013;
    box(q, x, y, z, w, 0.04, w, [255, 60, 60], 550, 3, k / 5, (k + 0.6) / 5);
    box(q, x, y + 0.04, z, w * 1.55, 0.012, w * 1.55, [110, 70, 120], 750, 3, (k + 0.6) / 5, (k + 1) / 5);
  }
  for (let i = 0; i < 200; i++) q.add([x, 0.28 + i * 0.00045, z], [0, 1, 0], [255, 215, 90], 1, 3, 1);
}

function pine(q, x, y0, z, h, rank) {                    // a dark cone of needles on a short trunk
  for (let i = 0; i < 40; i++) q.add([x, y0 + i * h * 0.004, z], [0, 0, -1], [110, 70, 50], 0, 7, rank * 0.9);
  for (let i = 0; i < 520; i++) {
    const v = R(), a = R() * 6.2832, rad = (1 - v) * h * 0.36, yy = y0 + h * 0.18 + v * h;
    const n = norm(Math.cos(a), 0.45, Math.sin(a));
    const g = R() < 0.5 ? [20, 105, 75] : [15, 85, 100];      // deep pine, darker than the grass
    q.add([x + Math.cos(a) * rad, yy, z + Math.sin(a) * rad], n, g, 0, 7, Math.min(1, rank * 0.9 + v * 0.1));
  }
}

function house(q, x, z, rank) {                          // white walls, a dark roof, a warm window
  const y0 = terrain(x, z);
  box(q, x, y0, z, 0.045, 0.03, 0.035, [235, 225, 210], 160, 7, rank, rank);
  box(q, x, y0 + 0.03, z, 0.055, 0.012, 0.045, [90, 60, 80], 140, 7, rank, rank);
}

function sakura(q, x, z, s) {                           // a trunk, then a pink crown that bursts open
  for (let i = 0; i < 400; i++) q.add([x, i * s * 0.0024, z], [0, 0, -1], [120, 70, 60], 0, 4, i / 2000);
  for (let i = 0; i < 2800; i++) {
    const n = norm(R.normal(), R.normal() * 0.8 + 0.4, R.normal()), r = s * (0.85 + 0.15 * R());
    const pink = R() < 0.5 ? [255, 110, 190] : [255, 175, 225];
    q.add([x + n[0] * r, s * 1.1 + n[1] * r * 0.8, z + n[2] * r], n, pink, 0, 4, 0.2 + 0.8 * R());
  }
}

function torii(q, x, z) {                               // the red gate by the lake
  for (const dx of [-0.05, 0.05]) box(q, x + dx, 0, z, 0.012, 0.11, 0.012, [255, 60, 45], 350, 5, 0, 0.7);
  box(q, x, 0.11, z, 0.15, 0.012, 0.016, [255, 60, 45], 450, 5, 0.8, 1);
  box(q, x, 0.085, z, 0.12, 0.008, 0.012, [235, 50, 45], 280, 5, 0.7, 0.8);
}

// the sky moves
const D = meta.duration, TAU = 6.2832;
const PUFF = Array.from({ length: 630 }, () => R.normal() * 0.6);   // one cloud shape, reused
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const wave = (t, at, len) => { const u = (t - at) / len; return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };
export function pulse(t) {                               // how hard the song is hitting right now (0..1)
  let p = 0;
  for (const [h, k] of meta.music.hits)
    for (const dt of [t - h, t - h + meta.duration]) if (dt >= 0 && dt < 0.6) p = Math.max(p, k * Math.exp(-dt * 7));
  return p;
}
const part = (t, name) => {                             // an even speed from one big beat to another
  const s = meta.timeline.find((x) => x[0] === name);
  const u = (t - s[1]) / (s[2] - s[1]);
  return u <= 0 ? 0 : u >= 1 ? 1 : u;
};

export function view(t) {
  const ph = (t / D) * TAU;
  const dusk = 0.5 - 0.5 * Math.cos(ph);                 // sunset -> night -> sunset
  const ripple = wave(t, meta.drop, 2.4);                // a ring of light rolls out on the drop
  const beat = pulse(t);
  const tb = t >= meta.closing[1] ? t - D : t;           // the next loop starts growing before this one ends
  const gone = tb < 0 ? 0 : ease((t - meta.closing[0]) / (meta.closing[1] - meta.closing[0]));
  return {
    t, yaw: -ph - 0.6 - (t > meta.drop ? 4 * Math.PI * (1 - Math.exp(-(t - meta.drop) / 0.9)) : 0), pitch: -0.3 - 0.08 * Math.sin(ph), focal: 0.82, lift: 0.22, horizon: 0.47, // one turn per loop
    dist: 3.95 - 0.35 * part(tb, "mountain") - 0.4 * wave(t, 12.523, 6.262) - 0.035 * beat, // leans in; nods on the beat
    light: [-0.6, 0.65, 0.55],
    key: [1.2 - 0.25 * dusk, 0.95 - 0.15 * dusk, 0.8 + 0.2 * dusk],  // warm sun, then moonlight
    fill: [0.55, 0.62 + 0.1 * dusk, 1.15],
    warm: 38 - 18 * dusk, cool: 250 + 25 * dusk,           // sunset gold -> moonlit rose; violet shadows
    build: ["ground", "mountain", "rock", "pagoda", "sakura", "torii", "lights", "forest"].map((n) => part(tb, n)),
    gone, dusk, pulse: Math.min(1, beat + 1.2 * Math.exp(-Math.max(0, t - meta.drop) * 3) * (t >= meta.drop ? 1 : 0)),
    fx: ripple > 0 ? (i, p) => {                          // a wave of light rolls out from the summit
      const r = Math.hypot(p[0], p[2]), front = ((t - meta.drop) / 2.4) * 1.4;
      p[1] += 0.07 * ripple * Math.exp(-((r - front) ** 2) * 60);
    } : null,
  };
}

export function extras(t) {                             // things that move on their own
  const out = [], ph = t / D, on = part(t, "sky") * (1 - ease((t - meta.closing[0]) / 0.5));
  if (on <= 0) return out;
  for (let i = 0; i < Math.round(70 * on); i++) {      // cherry petals drifting past the island
    const s = (i * 0.6180339) % 1, u = (ph * 2 + s) % 1;
    const a = i * 2.4 + ph * TAU, r = 0.5 + 0.9 * ((i * 0.37) % 1);
    out.push([r * Math.cos(a), 1.2 - u * 2.6, r * Math.sin(a), 0, 0, -1, 255, 150, 210, 2, 0, s]);
  }
  for (let i = 0; i < Math.round(150 * on); i++) {     // a waterfall pouring off the rim by the lake
    const u = (ph * 6 + i / 150) % 1, a = 2.32 + 0.05 * Math.sin(i);
    out.push([Math.cos(a) * (1 + u * 0.08), -u * 1.4, Math.sin(a) * (1 + u * 0.08), Math.cos(a), 0, Math.sin(a),
      90, 210, 255, 0, 0, i / 150]);
  }
  for (let k = 0; k < 9; k++) {                        // nine sunset clouds circling the mountain
    const a0 = (k / 9) * TAU - ph * TAU * 2, r0 = 1.28 + 0.06 * Math.sin(k * 2.1);
    const tint = k % 3 === 0 ? [255, 190, 170] : k % 3 === 1 ? [255, 170, 215] : [210, 190, 255];
    for (let j = 0; j < Math.round(120 * on); j++) {
      const u = PUFF[j * 3], v = PUFF[j * 3 + 1], w = PUFF[j * 3 + 2];
      const a = a0 + u * 0.16, r = r0 + w * 0.08;
      out.push([r * Math.cos(a), 0.44 + (k % 3) * 0.05 + v * 0.05, r * Math.sin(a), 0, 1, 0, ...tint, 2, 0, j / 120]);
    }
  }
  return out;
}
