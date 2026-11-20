// fuji.js · a floating Mount Fuji, drawn only with letters
import { Cloud, rng, norm } from "../engine/ascii.js";

export const meta = {
  id: "fuji", title: "MOUNT FUJI", sub: "drawn with letters only",
  duration: 24, sky: ["#0b1430", "#2a3a6e", "#c98aa0"], accent: "#ff9db5",
};

const R = rng(2026);
const H = 1.22;                                         // summit height (island radius = 1)

function terrain(x, z) {                                // height of the island's top surface
  const r = Math.hypot(x + 0.05, z + 0.08);
  let y = r < 0.74 ? H * Math.pow(1 - r / 0.74, 1.7) : 0; // Fuji's concave slopes
  if (r < 0.07) y = H * Math.pow(1 - 0.07 / 0.74, 1.7) - (0.07 - r) * 0.5; // the crater
  const a = Math.atan2(z, x);
  y += 0.012 * Math.sin(9 * a + 3 * r) * Math.min(1, r * 3);                // gullies down the sides
  const lake = Math.hypot(x + 0.55, z - 0.5);
  if (lake < 0.24) y = Math.min(y, -0.015);                                  // a small lake
  return Math.max(y, -0.015);
}

function ground(x, z) {                                 // colour of the ground at (x, z)
  const y = terrain(x, z), a = Math.atan2(z, x);
  const snow = 0.4 + 0.07 * Math.sin(7 * a) + 0.06 * Math.abs(Math.sin(23 * a)); // ragged snowline
  if (Math.hypot(x + 0.55, z - 0.5) < 0.24) return [[70, 140, 230], 0];     // lake
  if (y > snow * H) return [[255, 236, 244], 0];                            // snow cap
  if (y > 0.28) return [[78, 98, 190], 0];                                   // blue upper slopes
  if (y > 0.04) return [[60, 120, 150], 0];                                 // forest line
  return [[96, 170, 92], 0];                                                // grass
}

export function build() {
  const q = new Cloud();
  for (let i = 0; i < 90000; i++) {                     // the top: sample the disc, lift by terrain
    const r = Math.sqrt(R()) * 1.0, a = R() * 6.2832;
    const x = r * Math.cos(a), z = r * Math.sin(a), y = terrain(x, z), e = 0.004;
    const n = norm(terrain(x - e, z) - terrain(x + e, z), 2 * e, terrain(x, z - e) - terrain(x, z + e));
    q.add([x, y, z], n, ground(x, z)[0]);
  }
  for (let i = 0; i < 26000; i++) {                     // the rock underneath, hanging like a root
    const u = Math.pow(R(), 0.8), a = R() * 6.2832;
    const jag = 1 + 0.12 * Math.sin(5 * a + 9 * u) + 0.06 * R();
    const rad = (1 - u) ** 0.7 * jag, y = -0.02 - u * 0.95;
    const tone = 0.7 + 0.3 * Math.sin(20 * y + 3 * a);
    q.add([rad * Math.cos(a), y, rad * Math.sin(a)], norm(Math.cos(a), 0.15, Math.sin(a)),
      [170 * tone, 128 * tone, 108 * tone]);
  }
  pagoda(q, 0.58, 0.48);
  for (const [x, z, s] of [[0.42, 0.66, 0.11], [0.75, 0.28, 0.1], [0.3, 0.8, 0.08], [0.8, 0.55, 0.09], [-0.2, 0.86, 0.1]])
    sakura(q, x, z, s);
  torii(q, -0.3, 0.62);
  for (let i = 0; i < 70; i++) {                        // village lights around the rim
    const a = R() * 6.2832, r = 0.86 + 0.1 * R();
    q.add([r * Math.cos(a), 0.012, r * Math.sin(a)], [0, 1, 0], [255, 214, 120], 1);
  }
  return q.pack();
}

function box(q, x0, y0, z0, w, h, d, c, n = 400) {      // points on the sides of a box
  for (let i = 0; i < n; i++) {
    const f = Math.floor(R() * 5), u = R() - 0.5, v = R();
    const p = [[x0 + w / 2, y0 + v * h, z0 + u * d, 1, 0, 0], [x0 - w / 2, y0 + v * h, z0 + u * d, -1, 0, 0],
      [x0 + u * w, y0 + v * h, z0 + d / 2, 0, 0, 1], [x0 + u * w, y0 + v * h, z0 - d / 2, 0, 0, -1],
      [x0 + u * w, y0 + h, z0 + (v - 0.5) * d, 0, 1, 0]][f];
    q.add(p.slice(0, 3), p.slice(3), c);
  }
}

function pagoda(q, x, z) {                              // five storeys, each roof wider than its walls
  for (let k = 0; k < 5; k++) {
    const y = k * 0.055, w = 0.1 - k * 0.013;
    box(q, x, y, z, w, 0.04, w, [190, 40, 46], 300);
    box(q, x, y + 0.04, z, w * 1.55, 0.012, w * 1.55, [60, 50, 60], 420);
  }
  for (let i = 0; i < 60; i++) q.add([x, 0.28 + i * 0.0015, z], [0, 1, 0], [240, 200, 90]);
}

function sakura(q, x, z, s) {                           // a cherry tree: trunk + pink crown
  for (let i = 0; i < 120; i++) q.add([x, i * s * 0.008, z], [0, 0, -1], [90, 60, 50]);
  for (let i = 0; i < 1600; i++) {
    const n = norm(R.normal(), R.normal() * 0.8 + 0.4, R.normal()), r = s * (0.85 + 0.15 * R());
    const pink = 0.85 + 0.15 * R();
    q.add([x + n[0] * r, s * 1.1 + n[1] * r * 0.8, z + n[2] * r], n, [255 * pink, 150 * pink, 190 * pink]);
  }
}

function torii(q, x, z) {                               // the red gate by the lake
  for (const dx of [-0.05, 0.05]) box(q, x + dx, 0, z, 0.012, 0.11, 0.012, [220, 50, 40], 200);
  box(q, x, 0.11, z, 0.15, 0.012, 0.016, [220, 50, 40], 260);
  box(q, x, 0.085, z, 0.12, 0.008, 0.012, [200, 45, 40], 160);
}

// Everything below is time: it all repeats every `duration` seconds, so the reel loops perfectly.
const D = meta.duration, TAU = 6.2832;
const PUFF = Array.from({ length: 210 }, () => R.normal() * 0.6);   // one cloud shape, reused
const wave = (t, at, len) => { const u = (t - at) / len; return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };

export function view(t) {
  const ph = (t / D) * TAU;
  const dusk = 0.5 - 0.5 * Math.cos(ph);                 // sunset -> night -> sunset
  const ripple = Math.max(wave(t, 5.5, 3), wave(t, 15.5, 3));
  return {
    yaw: -ph, pitch: -0.3 - 0.08 * Math.sin(ph), dist: 3.6 - 0.4 * wave(t, 9, 6), focal: 0.82,
    lift: 0.22, horizon: 0.47,
    light: [-0.6, 0.65, 0.55],
    tint: [1.05 - 0.3 * dusk, 0.92 - 0.2 * dusk, 0.95 + 0.1 * dusk],
    ripple, dusk,
    fx: ripple > 0 ? (i, p) => {                         // a wave of light rolls out from the summit
      const r = Math.hypot(p[0], p[2]), front = ((t - 5.5) % 10) / 3 * 1.4;
      p[1] += 0.06 * ripple * Math.exp(-((r - front) ** 2) * 60);
    } : null,
  };
}

export function extras(t) {                             // things that move on their own
  const out = [], ph = t / D;
  for (let i = 0; i < 70; i++) {                        // cherry petals drifting down past the island
    const s = (i * 0.6180339) % 1, u = (ph * 2 + s) % 1;
    const a = i * 2.4 + ph * TAU, r = 0.5 + 0.9 * ((i * 0.37) % 1);
    out.push([r * Math.cos(a), 1.2 - u * 2.6, r * Math.sin(a), 0, 0, -1, 255, 170, 205, 2]);
  }
  for (let i = 0; i < 90; i++) {                        // a waterfall pouring off the rim by the lake
    const u = (ph * 6 + i / 90) % 1, a = 2.32 + 0.05 * Math.sin(i);
    out.push([Math.cos(a) * (1.0 + u * 0.08), -u * 1.4, Math.sin(a) * (1.0 + u * 0.08), Math.cos(a), 0, Math.sin(a), 120, 190, 255, 0]);
  }
  for (let k = 0; k < 9; k++) {                        // nine soft clouds circling the mountain
    const a0 = (k / 9) * TAU - ph * TAU * 2, r0 = 1.28 + 0.06 * Math.sin(k * 2.1);
    for (let j = 0; j < 70; j++) {
      const u = PUFF[j * 3], v = PUFF[j * 3 + 1], w = PUFF[j * 3 + 2];
      const a = a0 + u * 0.16, r = r0 + w * 0.08;
      out.push([r * Math.cos(a), 0.44 + k % 3 * 0.05 + v * 0.05, r * Math.sin(a), 0, 1, 0, 232, 236, 255, 2]);
    }
  }
  return out;
}
