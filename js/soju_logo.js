/* The top-left logo: a low poly soju bottle, turning. (3 Nov, owner: "design a spining soju low poly logo and replace it with the hvd logo";
   then "make it a longer shaped soju", "make the padding the same on top and left", "make the cap yellow", and from a photo of a real
   bottle: "just make the 3d model a low poly version of this dont have the 3d model have that 2d overlya")
   All of it is the bottle's own mesh: the label's picture is coloured facets that turn with it. No lettering, so it isn't any brand's label.
   Drawn by hand on a 2D canvas: a few hundred flat faces a frame, and no WebGL context spent on so small a picture.
   Finds the canvas each frame, because the header can be rebuilt; nothing is drawn while it's hidden. */
(function () {
const SIDES = 12, SPIN = 1.25, HEIGHT = 54, TILT = 0.2, LEAN = -0.1;
const GLASS = [34, 142, 76], PALE = [58, 170, 98], CAP = [255, 214, 62], RIB = [248, 192, 42];
const C = { w: [252, 251, 246], y: [248, 196, 40], o: [240, 158, 30], r: [205, 50, 45], g: [92, 162, 60] };
// the label, top row first, six facets wide and repeated, so one picture is always facing you: a red seal, a block of yellow, a fruit and its leaf
const PICTURE = ["rwyyyw", "rwyyyw", "wwwyww", "wgoyww", "wwoyww"];
// the bottle from the base up: [height, radius, colour of the band below this ring]. Straight sides, a sloping shoulder, a thin neck, a lip, a ribbed cap.
const LABEL = "label", RIBBED = "ribbed", LAB_ROWS = PICTURE.length;
const RINGS = [[-1.1, 0.29], [-1.05, 0.33, GLASS], [-0.86, 0.33, GLASS], [-0.68, 0.335, LABEL], [-0.5, 0.335, LABEL], [-0.32, 0.335, LABEL], [-0.14, 0.335, LABEL], [0.04, 0.335, LABEL],
  [0.04, 0.33, GLASS], [0.2, 0.33, GLASS], [0.34, 0.29, GLASS], [0.48, 0.2, PALE], [0.58, 0.145, PALE], [0.8, 0.135, GLASS], [0.8, 0.16, GLASS], [0.85, 0.16, PALE],
  [0.85, 0.165, RIBBED], [1.06, 0.17, RIBBED], [1.1, 0.13, CAP], [1.1, 0.001, CAP]];
const L = norm([-0.45, 0.65, 0.62]), H = norm([-0.22, 0.32, 1]);
function norm(v) { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; }
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const st = Math.sin(TILT), ct = Math.cos(TILT), sl = Math.sin(LEAN), cl = Math.cos(LEAN);
function turn(p, sy, cy) {
  const x = p[0] * cy + p[2] * sy, z = p[2] * cy - p[0] * sy, y2 = p[1] * ct - z * st, z2 = p[1] * st + z * ct;
  return [x * cl - y2 * sl, x * sl + y2 * cl, z2];
}

const quads = [];
let labelRow = LAB_ROWS;
for (let r = 1; r < RINGS.length; r++) {
  const [y0, r0] = RINGS[r - 1], [y1, r1, band] = RINGS[r];
  if (band === LABEL) labelRow--;
  for (let s = 0; s < SIDES; s++) {
    const a0 = s / SIDES * Math.PI * 2, a1 = (s + 1) / SIDES * Math.PI * 2;
    const col = band === LABEL ? C[PICTURE[labelRow][s % 6]] : band === RIBBED ? (s % 2 ? RIB : CAP) : band;
    quads.push({ col, solid: col !== GLASS && col !== PALE, gold: col === CAP || col === RIB, v: [[Math.sin(a0) * r0, y0, Math.cos(a0) * r0], [Math.sin(a1) * r0, y0, Math.cos(a1) * r0], [Math.sin(a1) * r1, y1, Math.cos(a1) * r1], [Math.sin(a0) * r1, y1, Math.cos(a0) * r1]] });
  }
}
// the space the bottle sweeps through a whole turn: the canvas is exactly this, so its edge is the bottle's edge
const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
for (let n = 0; n < 96; n++) {
  const a = n / 96 * Math.PI * 2, sy = Math.sin(a), cy = Math.cos(a);
  for (const q of quads) for (const p of q.v) { const t = turn(p, sy, cy); box.x0 = Math.min(box.x0, t[0]); box.x1 = Math.max(box.x1, t[0]); box.y0 = Math.min(box.y0, t[1]); box.y1 = Math.max(box.y1, t[1]); }
}

function draw(cv, spin) {
  const dpr = Math.min(2, devicePixelRatio || 1), pad = dpr, ph = Math.round(HEIGHT * dpr), k = (ph - pad * 2) / (box.y1 - box.y0), pw = Math.ceil((box.x1 - box.x0) * k + pad * 2);
  if (cv.height !== ph || cv.width !== pw) { cv.width = pw; cv.height = ph; }
  const c = cv.getContext("2d"), sy = Math.sin(spin), cy = Math.cos(spin), list = [];
  for (const q of quads) {
    const v = q.v.map(p => turn(p, sy, cy)), n = norm(cross(sub(v[2], v[0]), sub(v[3], v[1])));
    list.push({ v, n, q, back: n[2] <= 0.001, z: (v[0][2] + v[1][2] + v[2][2] + v[3][2]) / 4 });
  }
  list.sort((a, b) => a.z - b.z);
  c.clearRect(0, 0, pw, ph);
  c.lineWidth = 0.6 * dpr; c.lineJoin = "round";
  const face = (v, rgb, alpha) => {
    c.globalAlpha = alpha;
    c.fillStyle = c.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    c.beginPath();
    v.forEach((p, i) => { const X = pad + (p[0] - box.x0) * k, Y = pad + (box.y1 - p[1]) * k; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
    c.closePath(); c.fill(); c.stroke();
    c.globalAlpha = 1;
  };
  // glass: the far side first, dark, then the near side over it, thin enough to see through
  for (const { v, n, q, back } of list) {
    if (back) { face(v, q.col.map(ch => Math.round(ch * 0.42)), 1); continue; }
    // the cap keeps its colour all the way round: full shadow turns yellow to brown, and a shine washes it out to cream
    const dim = Math.max(0, dot(n, L)), lit = q.gold ? 0.9 + 0.2 * dim : 0.56 + 0.6 * dim, glint = q.gold ? 0 : Math.pow(Math.max(0, dot(n, H)), 24) * 0.4;
    face(v, q.col.map(ch => Math.round(Math.min(255, ch * lit + 255 * glint))), q.solid ? 1 : 0.82);
  }
}
// as far from the left of the screen as from the top. The header is centred and scales with the window, so this is measured.
function align(cv) {
  const r = cv.getBoundingClientRect(), scale = r.height / cv.offsetHeight, was = parseFloat(cv.style.marginLeft) || 0, want = was + (r.top - r.left) / scale;
  if (scale > 0 && Math.abs(want - was) > 0.25) cv.style.marginLeft = `${want.toFixed(2)}px`;
}

const calm = matchMedia("(prefers-reduced-motion: reduce)");
let drawn = null, beat = 0;
requestAnimationFrame(function tick(t) {
  requestAnimationFrame(tick);
  const cv = document.querySelector(".soju-logo");
  if (!cv || !cv.offsetParent) return;
  const still = calm.matches || !!(AF.G && AF.G.S && AF.G.S.opts.reduced), a = still ? 0.5 : t / 1000 * SPIN;
  if (!(still && drawn === cv)) { draw(cv, a); drawn = still ? cv : null; }
  if (beat++ % 30 === 0) align(cv);
});
})();
