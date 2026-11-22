// asciiwizard runtime: turns a 3D point cloud into a grid of coloured letters.
// The same file runs in Node (to render the reel) and in the browser (soju.gg/ascii).

export const RAMP = " .,:;-~=+*xo#%@";

export function rng(seed) {                       // small, fast, repeatable random numbers
  let s = seed >>> 0;
  const r = () => ((s = (s + 0x6d2b79f5) >>> 0), (((s ^ (s >>> 15)) * (s | 1)) >>> 0) / 4294967296);
  r.range = (a, b) => a + (b - a) * r();
  r.normal = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2832 * r());
  return r;
}

const N = 12;                                      // floats per point
export class Cloud {                              // every point: position, normal, colour, kind, group, rank
  constructor() { this.d = []; }
  // kind 0 = lit surface, 1 = glows on its own, 2 = soft (petals, cloud).
  // group = which part of the model it belongs to; rank 0..1 = its turn while that part assembles.
  add(p, n, c, kind = 0, group = 0, rank = 0) {
    this.d.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], kind, group, rank);
  }
  get size() { return (this.f || this.d).length / N; }
  pack() { this.f = Float32Array.from(this.d); this.d = null; return this; }
}

export const norm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

// ---- colour: hue-shifted shading. Shadows lean cool, lit faces lean warm, midtones keep the material's
// own hue at full strength, and every letter gets its own small hue/value offset, so up close it is many
// colours and from a distance one smooth gradient.
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-6) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function hsl2rgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const towards = (a, b, u) => { const d = ((b - a + 540) % 360) - 180; return (a + d * u + 360) % 360; };
export function paint(r, g, b, lum, seed, seed2, cool = 255, warm = 40) {
  let [h, s, l] = rgb2hsl(r, g, b);
  const u = lum - 0.5, chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  if (chroma < 0.12) h = u > 0 ? warm : cool;                              // whites take the light's colour
  const grey = chroma < 0.25;                                              // snow, cloud: pastel is right
  h = u > 0 ? towards(h, warm, u * 0.5) : towards(h, cool, -u * 0.6);      // warm light, cool shade
  h = (h + (seed - 0.5) * 32 + 360) % 360;                                 // each letter its own hue
  s = grey ? 0.35 + 0.25 * (1 - lum) : Math.min(1, s * 1.15 + 0.12 - Math.max(0, u) * 0.15);
  l = grey ? 0.3 + 0.62 * lum : 0.2 + 0.5 * lum;                           // colour, not white, on lit faces
  l += (seed2 - 0.5) * 0.12;                                               // each letter its own value
  return hsl2rgb(h, s, l < 0.05 ? 0.05 : l > 0.95 ? 0.95 : l);
}

const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// view: {yaw, pitch, dist, focal, lift, horizon, light, key, fill, t,
//        build: [progress 0..1 per group], gone: 0..1 (the closing scatter), fx(i, p) optional}
export function render(cloud, view, cols, rows, cell = [9, 16], extra = []) {
  const W = cols * cell[0], H = rows * cell[1];
  const zbuf = new Float32Array(cols * rows).fill(1e9);
  const ch = new Uint8Array(cols * rows), rgb = new Uint8Array(cols * rows * 3), glow = new Uint8Array(cols * rows);
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const F = view.focal * H, L = norm(...view.light), K = view.key || [1, 1, 1], Fl = view.fill || [1, 1, 1];
  const t = view.t || 0, gone = view.gone || 0, build = view.build, beat = view.pulse || 0;
  const put = (x, y, z, nx, ny, nz, r, g, b, kind, flash, seed) => {
    let X = x * cy + z * sy, Z = -x * sy + z * cy, Y = y - view.lift;           // turn around the vertical axis
    const Y2 = Y * cp - Z * sp; Z = Y * sp + Z * cp; Y = Y2;                   // tip the camera up or down
    const NX = nx * cy + nz * sy, NZ0 = -nx * sy + nz * cy;
    const NY = ny * cp - NZ0 * sp, NZ = ny * sp + NZ0 * cp;
    const zc = Z + view.dist; if (zc < 0.1) return;
    const c = Math.floor((W / 2 + (X * F) / zc) / cell[0]), rw = Math.floor((H * view.horizon - (Y * F) / zc) / cell[1]);
    if (c < 0 || c >= cols || rw < 0 || rw >= rows) return;
    const k = rw * cols + c; if (zc >= zbuf[k]) return;
    zbuf[k] = zc;
    let lum, d = 0.5;
    if (kind === 1) lum = 0.75 + 0.25 * Math.sin(t * 5 + seed * 40);           // lights twinkle
    else if (kind === 2) lum = 0.42 + 0.1 * Math.sin(t * 3 + seed * 20);       // petals, cloud: soft
    else {
      d = Math.max(0, NX * L[0] + NY * L[1] - NZ * L[2]);
      const rim = Math.pow(1 - Math.abs(NZ), 3) * 0.35;
      lum = Math.min(1, 0.16 + 0.84 * d + rim + 0.06 * Math.sin(t * 9 + seed * 60)); // letters shimmer
    }
    lum = Math.min(1, lum + flash * 0.5 + beat * 0.14);          // everything lifts on the beat
    ch[k] = 1 + Math.min(RAMP.length - 2, Math.floor(lum * (RAMP.length - 1)));
    if (kind === 1) {
      rgb[3 * k] = Math.min(255, r * 1.1); rgb[3 * k + 1] = Math.min(255, g * 1.1); rgb[3 * k + 2] = Math.min(255, b * 1.1);
      glow[k] = 255;
    } else {
      const c3 = paint(r, g, b, lum, seed, hash(seed * 977 + 3), view.cool ?? 255, view.warm ?? 40);
      rgb[3 * k] = Math.min(255, c3[0] + 150 * flash);
      rgb[3 * k + 1] = Math.min(255, c3[1] + 130 * flash);
      rgb[3 * k + 2] = Math.min(255, c3[2] + 110 * flash);
      glow[k] = flash > 0.1 ? Math.min(255, 200 * flash) : 0;
    }
  };
  const f = cloud.f, p = [0, 0, 0];
  for (let i = 0, j = 0; i < f.length; i += N, j++) {
    p[0] = f[i]; p[1] = f[i + 1]; p[2] = f[i + 2];
    let flash = 0;
    const seed = hash(j);
    if (build) {                                                               // assemble: fly in, land, flash
      const P = build[f[i + 10]] ?? 1;
      const u = clamp((P * 1.12 - f[i + 11]) / 0.12);
      if (u <= 0) continue;
      if (u < 1) {                                                             // drop in from just above
        const e = 1 - u, e2 = e * e;
        p[0] += e2 * (seed - 0.5) * 0.25; p[2] += e2 * (hash(j + 7) - 0.5) * 0.25; p[1] += e2 * 0.35;
        flash = 0.55 * (e < 0.35 ? e / 0.35 : (1 - e) / 0.65);
      }
    }
    if (gone > 0) {                                                            // the closing dissolve
      const top = 1 - clamp((f[i + 1] + 1.0) / 2.3);                           // summit first, roots last
      const v = clamp((gone * 1.3 - (0.85 * top + 0.15 * seed)) / 0.3);
      if (v > 0) {
        if (hash(j + 13) < v) continue;                                        // wink out as the sweep passes
        p[1] += v * 0.1; p[0] *= 1 + v * 0.05; p[2] *= 1 + v * 0.05;          // a small lift, no long fall
        flash = Math.max(flash, 0.6 * Math.sin(Math.PI * Math.min(1, v * 1.6)));
      }
    }
    if (view.fx) view.fx(j, p, f);
    put(p[0], p[1], p[2], f[i + 3], f[i + 4], f[i + 5], f[i + 6], f[i + 7], f[i + 8], f[i + 9], flash, seed);
  }
  for (const e of extra) put(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9], e[10] || 0, e[11] || 0);
  let letters = 0; for (let k = 0; k < ch.length; k++) if (ch[k]) letters++;
  return { cols, rows, ch, rgb, glow, letters };
}
