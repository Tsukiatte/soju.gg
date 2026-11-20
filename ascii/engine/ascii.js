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

export class Cloud {                              // every point: position, normal, colour, kind
  constructor() { this.d = []; }
  add(p, n, c, kind = 0) { this.d.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], kind); }
  get size() { return (this.f || this.d).length / 10; }
  pack() { this.f = Float32Array.from(this.d); this.d = null; return this; }
}

export const norm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

// Render one frame. view: {yaw, pitch, dist, lift, light:[x,y,z], tint:[r,g,b], fx(i, p) optional}
export function render(cloud, view, cols, rows, cell = [9, 16], extra = []) {
  const W = cols * cell[0], H = rows * cell[1];
  const zbuf = new Float32Array(cols * rows).fill(1e9);
  const ch = new Uint8Array(cols * rows), rgb = new Uint8Array(cols * rows * 3), glow = new Uint8Array(cols * rows);
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const F = view.focal * H, L = norm(...view.light), T = view.tint;
  const put = (x, y, z, nx, ny, nz, r, g, b, kind) => {
    let X = x * cy + z * sy, Z = -x * sy + z * cy, Y = y - view.lift;           // turn around the vertical axis
    const Y2 = Y * cp - Z * sp; Z = Y * sp + Z * cp; Y = Y2;                   // tip the camera up or down
    const NX = nx * cy + nz * sy, NZ0 = -nx * sy + nz * cy;
    const NY = ny * cp - NZ0 * sp, NZ = ny * sp + NZ0 * cp;
    const zc = Z + view.dist; if (zc < 0.1) return;
    const c = Math.floor((W / 2 + (X * F) / zc) / cell[0]), rw = Math.floor((H * view.horizon - (Y * F) / zc) / cell[1]);
    if (c < 0 || c >= cols || rw < 0 || rw >= rows) return;
    const k = rw * cols + c; if (zc >= zbuf[k]) return;
    zbuf[k] = zc;
    let lum;
    if (kind === 1) lum = 1;                                                    // lights glow on their own
    else if (kind === 2) lum = 0.42;                                            // petals: soft, never glaring
    else {
      const d = Math.max(0, NX * L[0] + NY * L[1] - NZ * L[2]);
      const rim = Math.pow(1 - Math.abs(NZ), 3) * 0.35;
      lum = Math.min(1, 0.16 + 0.84 * d + rim);
    }
    ch[k] = 1 + Math.min(RAMP.length - 2, Math.floor(lum * (RAMP.length - 1)));
    const s = kind === 1 ? 1.15 : 0.32 + 0.9 * lum;
    rgb[3 * k] = Math.min(255, r * s * (kind === 1 ? 1 : T[0]));
    rgb[3 * k + 1] = Math.min(255, g * s * (kind === 1 ? 1 : T[1]));
    rgb[3 * k + 2] = Math.min(255, b * s * (kind === 1 ? 1 : T[2]));
    glow[k] = kind === 1 ? 255 : 0;
  };
  const f = cloud.f, p = [0, 0, 0];
  for (let i = 0; i < f.length; i += 10) {
    p[0] = f[i]; p[1] = f[i + 1]; p[2] = f[i + 2];
    if (view.fx) view.fx(i / 10, p, f);
    put(p[0], p[1], p[2], f[i + 3], f[i + 4], f[i + 5], f[i + 6], f[i + 7], f[i + 8], f[i + 9]);
  }
  for (const e of extra) put(...e);                                            // moving bits: snow, petals, water
  let letters = 0; for (let k = 0; k < ch.length; k++) if (ch[k]) letters++;
  return { cols, rows, ch, rgb, glow, letters };
}
