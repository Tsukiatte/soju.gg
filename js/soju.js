/* Soju models for the whole game. (2 Nov, owner: "build off this instead and just use the soju models, and style")
   Every figure and enemy still gets its rig, so poses, markers and effects keep working, but the rig's own meshes go and a
   painted rounded cube takes their place: one cube per character, its character painted on. Painter from Picnic Patrol. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit;
// Characters are painted, not modelled: one rounded cube, six canvas-drawn faces in a 3x2 atlas.
// Cell order: 0 right, 1 left, 2 top, 3 bottom, 4 front (the face), 5 back. Matches RoundedBoxGeometry's groups.
const CELL = 128;
const INK = '#3a2a2a';

const SPECIES = {
  pip: { base: '#f7f1e6', shade: '#e5d9c6', inner: '#ffb7c2', ears: 'long', muzzle: 'bunny' },
  bao: { base: '#a97550', shade: '#8f5f3f', inner: '#e8c9a3', ears: 'round', muzzle: 'bear' },
  mochi: { base: '#eab676', shade: '#d3985a', inner: '#ffc9b5', ears: 'pointy', muzzle: 'cat', stripes: true },
  dot: { base: '#ffdf6b', shade: '#efc54a', inner: '#ff9d3c', ears: 'none', muzzle: 'duck' },
  fig: { base: '#83c75d', shade: '#66ad47', inner: '#ffe9a0', ears: 'bulge', muzzle: 'frog' },
  owl: { base: '#a98052', shade: '#8a6540', inner: '#f4c86a', ears: 'small', muzzle: 'cat' },
  fox: { base: '#f0883e', shade: '#d06c28', inner: '#fff1e0', ears: 'pointy', muzzle: 'cat' },
  pig: { base: '#ffb6c4', shade: '#ee97a8', inner: '#ff8fa6', ears: 'round', muzzle: 'pig' },
  penguin: { base: '#2c3346', shade: '#20263a', inner: '#ff9d3c', ears: 'none', muzzle: 'duck', belly: '#f6f3ea' },
  hazel: { base: '#a98561', shade: '#8d6b4b', inner: '#f3dcc0', ears: 'small', muzzle: 'hedgehog', spikes: true },
};

const ENEMY_LOOK = {
  crumb: { base: '#d9a662', shade: '#b98443', spots: '#7fae5b', face: 'grumpy' },
  cracker: { base: '#f0cf85', shade: '#d7b264', dots: true, face: 'mean' },
  pickle: { base: '#6e9e3a', shade: '#567f2a', warts: true, face: 'sad' },
  jelly: { base: '#ee6d7f', shade: '#cd4f62', shine: true, face: 'wobbly' },
  jellet: { base: '#f59aa6', shade: '#d67885', shine: true, face: 'wobbly' },
  puff: { base: '#cfe6f2', shade: '#a9cbdd', spots: '#8cc26a', face: 'mean' },
  loaf: { base: '#b77b3f', shade: '#94602d', spots: '#6fa358', face: 'boss', crust: true },
};

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function dot(c, x, y, r, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function shadeBand(c, shade) {
  c.fillStyle = shade;
  c.fillRect(0, CELL * 0.76, CELL, CELL * 0.24);
}

function eyes(c, opts = {}) {
  const { y = 56, gap = 25, r = 11, color = INK, shine = '#fff', mood = 'happy' } = opts;
  for (const side of [-1, 1]) {
    const x = 64 + side * gap;
    dot(c, x, y, r, color);
    dot(c, x - 3, y - 4, r * 0.36, shine);
    if (mood === 'grumpy' || mood === 'mean' || mood === 'boss') {
      c.strokeStyle = INK;
      c.lineWidth = mood === 'boss' ? 7 : 5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x - side * 15, y - (mood === 'mean' ? 14 : 16));
      c.lineTo(x + side * 13, y - (mood === 'mean' ? 25 : 20));
      c.stroke();
    }
  }
}

function blush(c, color = 'rgba(255,120,130,0.45)') {
  dot(c, 30, 74, 9, color);
  dot(c, 98, 74, 9, color);
}

function drawMuzzle(c, kind, inner, line = INK) {
  c.strokeStyle = line;
  c.lineWidth = 4;
  c.lineCap = 'round';
  if (kind === 'bunny') {
    dot(c, 64, 70, 5, inner);
    c.beginPath(); c.moveTo(64, 74); c.lineTo(64, 80); c.moveTo(64, 80); c.quadraticCurveTo(57, 86, 52, 80);
    c.moveTo(64, 80); c.quadraticCurveTo(71, 86, 76, 80); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(59, 83, 10, 8);
  } else if (kind === 'bear') {
    c.fillStyle = inner; c.beginPath(); c.ellipse(64, 80, 21, 16, 0, 0, Math.PI * 2); c.fill();
    dot(c, 64, 73, 6.5, line);
    c.beginPath(); c.moveTo(64, 78); c.lineTo(64, 84); c.quadraticCurveTo(57, 90, 53, 85);
    c.moveTo(64, 84); c.quadraticCurveTo(71, 90, 75, 85); c.stroke();
  } else if (kind === 'cat') {
    c.fillStyle = inner; c.beginPath(); c.moveTo(58, 71); c.lineTo(70, 71); c.lineTo(64, 78); c.fill();
    c.beginPath(); c.moveTo(64, 78); c.quadraticCurveTo(58, 86, 51, 81); c.moveTo(64, 78); c.quadraticCurveTo(70, 86, 77, 81);
    c.moveTo(24, 70); c.lineTo(10, 66); c.moveTo(24, 78); c.lineTo(10, 80); c.moveTo(104, 70); c.lineTo(118, 66); c.moveTo(104, 78); c.lineTo(118, 80);
    c.stroke();
  } else if (kind === 'duck') {
    c.fillStyle = inner; rr(c, 42, 66, 44, 22, 11); c.fill();
    c.strokeStyle = '#c96e1c'; c.lineWidth = 3; c.beginPath(); c.moveTo(46, 77); c.lineTo(82, 77); c.stroke();
  } else if (kind === 'pig') {
    c.fillStyle = inner; c.beginPath(); c.ellipse(64, 80, 22, 16, 0, 0, Math.PI * 2); c.fill();
    dot(c, 56, 80, 4, line); dot(c, 72, 80, 4, line);
  } else if (kind === 'frog') {
    c.beginPath(); c.moveTo(26, 76); c.quadraticCurveTo(64, 104, 102, 76); c.stroke();
    dot(c, 60, 66, 2.5, line); dot(c, 68, 66, 2.5, line);
  } else if (kind === 'hedgehog') {
    c.fillStyle = inner; c.beginPath(); c.ellipse(64, 80, 24, 18, 0, 0, Math.PI * 2); c.fill();
    dot(c, 64, 72, 6, line);
    c.beginPath(); c.moveTo(56, 84); c.quadraticCurveTo(64, 91, 72, 84); c.stroke();
  }
}

function drawEarsOnFace(c, kind, base, inner) {
  // Ears are painted as a band across the top edge so they wrap over the rounded corner onto the top face.
  if (kind === 'long') {
    for (const x of [34, 94]) {
      c.fillStyle = base; rr(c, x - 12, -22, 24, 46, 12); c.fill();
      c.fillStyle = inner; rr(c, x - 6, -22, 12, 38, 6); c.fill();
    }
  } else if (kind === 'round' || kind === 'small') {
    const r = kind === 'round' ? 17 : 11;
    for (const x of [24, 104]) { dot(c, x, 13, r, base); dot(c, x, 13, r * 0.55, inner); }
  } else if (kind === 'pointy') {
    for (const side of [-1, 1]) {
      const x = 64 + side * 40;
      c.fillStyle = base; c.beginPath(); c.moveTo(x - 17, 22); c.lineTo(x + side * 3, -6); c.lineTo(x + 17, 22); c.fill();
      c.fillStyle = inner; c.beginPath(); c.moveTo(x - 8, 20); c.lineTo(x + side * 2, 4); c.lineTo(x + 8, 20); c.fill();
    }
  } else if (kind === 'bulge') {
    for (const x of [33, 95]) dot(c, x, 22, 21, base);
  }
}

function drawSkinMark(c, look, cell) {
  const { mark, accent, base } = look;
  const front = cell === 4;
  c.save();
  if (mark === 'apron') {
    if (front) { c.fillStyle = accent; rr(c, 30, 92, 68, 40, 8); c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2; c.strokeRect(46, 102, 36, 18); }
    else if (cell < 2) { c.strokeStyle = accent; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 104); c.lineTo(128, 104); c.stroke(); }
    else if (cell === 5) { c.strokeStyle = accent; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 104); c.lineTo(128, 104); c.stroke(); dot(c, 64, 104, 8, accent); }
  } else if (mark === 'pleats') {
    if (cell === 2) { c.strokeStyle = accent; c.lineWidth = 6; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(64 + Math.cos(a) * 12, 64 + Math.sin(a) * 12); c.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); c.stroke(); } dot(c, 64, 64, 12, accent); }
    else { c.strokeStyle = accent; c.lineWidth = 5; for (let i = 16; i < 128; i += 24) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 6, 22); c.stroke(); } }
  } else if (mark === 'sauce') {
    c.fillStyle = accent;
    if (cell === 2) { c.beginPath(); c.ellipse(64, 64, 50, 40, 0.2, 0, Math.PI * 2); c.fill(); }
    else { for (let i = 0; i < 6; i++) { const w = 12 + (i * 7) % 11; rr(c, i * 22, -8, w, 22 + (i * 13) % 26, 7); c.fill(); } }
  } else if (mark === 'lantern') {
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(0, 34, 128, 6); c.fillRect(0, 88, 128, 6);
    c.fillStyle = accent; c.fillRect(0, 0, 128, 12); c.fillRect(0, 116, 128, 12);
  } else if (mark === 'roll') {
    if (cell === 2 || cell === 3) { dot(c, 64, 64, 54, accent); dot(c, 64, 64, 30, '#ff9d3c'); dot(c, 50, 58, 10, '#5fb35a'); dot(c, 76, 72, 10, '#f4d35e'); }
    else { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, 20, 128, 5); c.fillRect(0, 62, 128, 5); c.fillRect(0, 104, 128, 5); }
  } else if (mark === 'skewers') {
    c.fillStyle = accent;
    for (let i = 0; i < 3; i++) { rr(c, 12 + i * 40, 104, 24, 18, 7); c.fill(); }
  } else if (mark === 'noodles') {
    c.strokeStyle = accent; c.lineWidth = 7; c.lineCap = 'round';
    for (let y = cell === 2 ? 14 : front ? 102 : 18; y < 128; y += 22) {
      c.beginPath(); c.moveTo(-4, y); c.bezierCurveTo(30, y - 14, 60, y + 14, 132, y - 6); c.stroke();
    }
  } else if (mark === 'label') {
    if (front) { c.fillStyle = accent; rr(c, 22, 94, 84, 30, 6); c.fill(); c.fillStyle = base; c.font = '700 18px sans-serif'; c.textAlign = 'center'; c.fillText(look.tag || '', 64, 116); }
    else if (cell < 2 || cell === 5) { c.fillStyle = accent; c.fillRect(0, 44, 128, 40); }
    c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, 10, 10, 10, 90, 5); c.fill();
  } else if (mark === 'neon') {
    c.strokeStyle = accent; c.lineWidth = 6; c.shadowColor = accent; c.shadowBlur = 18;
    if (front) { rr(c, 8, 8, 112, 112, 18); c.stroke(); }
    else { rr(c, 18, 18, 92, 92, 16); c.stroke(); c.strokeStyle = '#3fe0d0'; c.shadowColor = '#3fe0d0'; rr(c, 36, 36, 56, 56, 10); c.stroke(); }
  } else if (mark === 'tent') {
    c.fillStyle = accent;
    if (front) { c.beginPath(); c.moveTo(0, 128); c.lineTo(0, 92); c.quadraticCurveTo(64, 132, 128, 92); c.lineTo(128, 128); c.fill(); }
    else { for (let i = 0; i < 128; i += 32) c.fillRect(i, 0, 16, 128); }
  } else if (mark === 'moon') {
    if (!front) { dot(c, 64, 60, 28, accent); dot(c, 76, 52, 25, base); }
    c.fillStyle = accent;
    for (const [x, y, r] of [[18, 20, 3], [106, 30, 2.5], [28, 108, 2.5], [100, 104, 3.5]]) dot(c, x, y, r, accent);
  } else if (mark === 'glass') {
    c.fillStyle = 'rgba(255,255,255,.26)'; rr(c, 10, 8, 14, 112, 7); c.fill(); rr(c, 32, 8, 6, 112, 3); c.fill();
    if (front) { c.fillStyle = accent; rr(c, 26, 96, 76, 26, 5); c.fill(); }
    else if (cell !== 2 && cell !== 3) { c.fillStyle = accent; c.fillRect(0, 50, 128, 30); }
  } else if (mark === 'windows') {
    c.fillStyle = accent;
    const y = front ? 96 : 40;
    for (let i = 0; i < 4; i++) { rr(c, 6 + i * 30, y, 24, 22, 4); c.fill(); }
    if (!front) { c.fillStyle = '#d9534f'; c.fillRect(0, 78, 128, 6); }
  } else if (mark === 'mask') {
    if (front) { c.strokeStyle = accent; c.lineWidth = 6; c.beginPath(); c.moveTo(14, 34); c.lineTo(52, 42); c.moveTo(114, 34); c.lineTo(76, 42); c.stroke(); c.fillStyle = accent; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(34 + i * 17, 98); c.lineTo(42 + i * 17, 116); c.lineTo(50 + i * 17, 98); c.fill(); } }
    else { c.strokeStyle = accent; c.lineWidth = 5; c.beginPath(); for (let i = 0; i < 6; i++) { c.moveTo(0, 18 + i * 20); c.lineTo(128, 18 + i * 20); } c.stroke(); }
  } else if (mark === 'wisps') {
    c.fillStyle = accent;
    for (const [x, y, r] of [[22, 30, 9], [100, 22, 7], [34, 104, 7], [104, 96, 11], [64, 112, 5]]) { dot(c, x, y, r, accent); dot(c, x, y, r * .45, '#fff'); }
  } else if (mark === 'constellation') {
    c.strokeStyle = accent; c.lineWidth = 2; c.shadowColor = accent; c.shadowBlur = 8;
    const pts = [[12, 24], [38, 12], [58, 40], [92, 18], [116, 42], [100, 88], [70, 112], [28, 100], [14, 72]];
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
    for (const [x, y] of pts) dot(c, x, y, 4, '#fff');
  } else if (mark === 'star') {
    c.fillStyle = accent; c.beginPath();
    const cx = 64, cy = front ? 112 : 64, R = front ? 13 : 34;
    for (let i = 0; i < 10; i++) { const r = i % 2 ? R * .45 : R, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  c.restore();
}

function paintCharacter(animal, skin) {
  const sp = SPECIES[animal];
  const look = skin?.look;
  const base = look?.base ?? sp.base;
  const canvas = document.createElement('canvas');
  canvas.width = CELL * 3;
  canvas.height = CELL * 2;
  const g = canvas.getContext('2d');
  const shade = look ? `color-mix(in srgb, ${base} 82%, #1a1030)` : sp.shade;
  const dark = look && isDark(base);
  const inner = look ? (dark ? look.accent : sp.inner) : sp.inner;
  const eyeColor = dark ? '#fff' : INK;
  const eyeShine = dark ? look.accent : '#fff';

  const cell = (i, fn) => {
    g.save();
    g.translate((i % 3) * CELL, Math.floor(i / 3) * CELL);
    g.beginPath(); g.rect(0, 0, CELL, CELL); g.clip();
    g.fillStyle = base; g.fillRect(0, 0, CELL, CELL);
    fn(g);
    if (look) drawSkinMark(g, look, i);
    g.restore();
  };

  // Sides
  for (const i of [0, 1]) cell(i, c => {
    shadeBand(c, shade);
    if (sp.stripes && !look) { c.fillStyle = sp.shade; for (let y = 20; y < 100; y += 26) { rr(c, i === 0 ? 74 : 0, y, 54, 11, 5); c.fill(); } }
    if (sp.spikes && !look) drawSpikes(c, sp.shade);
    if (animal === 'dot' && !look) { c.fillStyle = sp.shade; c.beginPath(); c.ellipse(64, 66, 32, 24, 0, 0, Math.PI * 2); c.fill(); }
  });
  // Top
  cell(2, c => {
    if (sp.stripes && !look) { c.fillStyle = sp.shade; for (const x of [34, 58, 82]) { rr(c, x, 6, 12, 58, 6); c.fill(); } }
    if (sp.spikes && !look) drawSpikes(c, sp.shade);
    if (sp.ears === 'long') for (const x of [34, 94]) { c.fillStyle = inner; rr(c, x - 7, 86, 14, 50, 7); c.fill(); }
    if (animal === 'dot' && !look) { c.fillStyle = '#fff3b5'; c.beginPath(); c.moveTo(64, 26); c.quadraticCurveTo(76, 56, 64, 74); c.quadraticCurveTo(52, 56, 64, 26); c.fill(); }
    if (animal === 'fig') { dot(c, 33, 112, 18, base); dot(c, 95, 112, 18, base); }
  });
  // Bottom
  cell(3, c => { c.fillStyle = shade; c.fillRect(0, 0, CELL, CELL); });
  // Front: the character's face
  cell(4, c => {
    shadeBand(c, shade);
    if (sp.belly && !look) { c.fillStyle = sp.belly; c.beginPath(); c.ellipse(64, 76, 50, 46, 0, 0, Math.PI * 2); c.fill(); }
    drawEarsOnFace(c, sp.ears, base, inner);
    if (animal === 'fig') {
      for (const x of [33, 95]) { dot(c, x, 34, 16, '#fff'); dot(c, x, 34, 9, INK); dot(c, x - 3, 30, 3, '#fff'); }
    } else {
      eyes(c, { color: eyeColor, shine: eyeShine });
    }
    if (!dark) blush(c);
    drawMuzzle(c, sp.muzzle, inner, dark ? look.accent : INK);
  });
  // Back
  cell(5, c => {
    shadeBand(c, shade);
    if (sp.stripes && !look) { c.fillStyle = sp.shade; for (let y = 16; y < 96; y += 24) { rr(c, 24, y, 80, 11, 5); c.fill(); } }
    if (sp.spikes && !look) drawSpikes(c, sp.shade);
    if (animal === 'pip') dot(c, 64, 94, 21, '#fff');
    if (animal === 'bao') { dot(c, 64, 96, 13, sp.shade); }
    if (animal === 'dot') { c.fillStyle = '#fff3b5'; c.beginPath(); c.moveTo(44, 102); c.lineTo(64, 72); c.lineTo(84, 102); c.fill(); }
    if (animal === 'mochi') { c.strokeStyle = sp.shade; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, 118); c.quadraticCurveTo(94, 100, 82, 76); c.stroke(); }
  });
  return canvas;
}

function drawSpikes(c, color) {
  c.fillStyle = color;
  for (let y = 12; y < 124; y += 22) {
    for (let x = (y % 44 === 12 ? 10 : 22); x < 124; x += 24) {
      c.beginPath(); c.moveTo(x - 8, y + 9); c.lineTo(x, y - 9); c.lineTo(x + 8, y + 9); c.fill();
    }
  }
}

function isDark(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 96;
}

function paintEnemy(kind) {
  const l = ENEMY_LOOK[kind];
  const canvas = document.createElement('canvas');
  canvas.width = CELL * 3;
  canvas.height = CELL * 2;
  const g = canvas.getContext('2d');
  for (let i = 0; i < 6; i++) {
    g.save();
    g.translate((i % 3) * CELL, Math.floor(i / 3) * CELL);
    g.beginPath(); g.rect(0, 0, CELL, CELL); g.clip();
    g.fillStyle = i === 3 ? l.shade : l.base; g.fillRect(0, 0, CELL, CELL);
    if (i !== 2) shadeBand(g, l.shade);
    if (l.crust) { g.strokeStyle = '#7b4c20'; g.lineWidth = 14; rr(g, 6, 6, 116, 116, 22); g.stroke(); }
    if (l.spots) for (const [x, y, r] of [[22, 22, 11], [104, 30, 8], [92, 106, 12], [30, 100, 7]]) dot(g, x, y, r, l.spots);
    if (l.dots) for (let y = 16; y < 128; y += 32) for (let x = 16; x < 128; x += 32) dot(g, x, y, 4, l.shade);
    if (l.warts) for (const [x, y] of [[20, 26], [54, 14], [104, 22], [18, 80], [108, 84], [64, 112]]) dot(g, x, y, 6, l.shade);
    if (l.shine) { g.fillStyle = 'rgba(255,255,255,.38)'; rr(g, 12, 12, 14, 52, 7); g.fill(); dot(g, 19, 76, 6, 'rgba(255,255,255,.38)'); }
    if (i === 4) drawEnemyFace(g, l.face);
    g.restore();
  }
  return canvas;
}

function drawEnemyFace(c, face) {
  c.strokeStyle = INK;
  c.lineCap = 'round';
  if (face === 'boss') {
    eyes(c, { y: 54, gap: 28, r: 13, mood: 'boss' });
    c.fillStyle = INK; c.beginPath(); c.moveTo(34, 96); c.quadraticCurveTo(64, 72, 94, 96); c.lineTo(34, 96); c.fill();
    c.fillStyle = '#fff'; c.fillRect(46, 84, 10, 11); c.fillRect(72, 84, 10, 11);
    return;
  }
  eyes(c, { y: 54, gap: 22, r: 9, mood: face });
  c.lineWidth = 5;
  c.beginPath();
  if (face === 'grumpy') { c.moveTo(50, 88); c.quadraticCurveTo(64, 78, 78, 88); }
  else if (face === 'mean') { c.moveTo(50, 84); c.lineTo(78, 88); }
  else if (face === 'sad') { c.moveTo(48, 90); c.quadraticCurveTo(64, 76, 80, 90); dot(c, 88, 68, 5, '#a8e4ff'); }
  else if (face === 'wobbly') { c.moveTo(46, 84); c.quadraticCurveTo(55, 76, 64, 84); c.quadraticCurveTo(73, 92, 82, 84); }
  c.stroke();
}

// ---------------- the rounded cube, UVs laid into the painter's 3x2 sheet ----------------
function cubeGeometry(seg = 3, round = 0.22) {
  const half = 0.5, r = round;
  const stops = [];
  for (let i = 0; i <= seg; i++) stops.push(-half + (r * i) / seg);
  for (let i = seg; i >= 0; i--) stops.push(half - (r * i) / seg);
  const pos = [], nor = [], uv = [], idx = [];
  // cell, then the 3D point for lattice (a, b); a runs left to right and b bottom to top as seen from outside
  const faces = [
    [0, (a, b) => [half, b, -a]], [1, (a, b) => [-half, b, a]], [2, (a, b) => [a, half, -b]],
    [3, (a, b) => [a, -half, b]], [4, (a, b) => [a, b, half]], [5, (a, b) => [-a, b, -half]],
  ];
  const clampIn = v => Math.max(-(half - r), Math.min(half - r, v));
  for (const [cell, fn] of faces) {
    const col = cell % 3, row = Math.floor(cell / 3), base = pos.length / 3, n = stops.length;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = stops[i], b = stops[j], [px, py, pz] = fn(a, b);
      const ix = clampIn(px), iy = clampIn(py), iz = clampIn(pz);
      let nx = px - ix, ny = py - iy, nz = pz - iz;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      pos.push(ix + nx * r, iy + ny * r, iz + nz * r);
      nor.push(nx, ny, nz);
      uv.push((col + a + half) / 3, 1 - (row + 1 - (b + half)) / 2);
    }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const p = base + j * n + i;
      idx.push(p, p + 1, p + n, p + 1, p + n + 1, p + n);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
const CUBE = cubeGeometry();
const RAMP = K.mat(0xffffff).gradientMap;
const mats = new Map();
function material(key, paintIt) {
  if (mats.has(key)) return mats.get(key);
  const t = new T.CanvasTexture(paintIt());
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  const m = new T.MeshToonMaterial({ map: t, gradientMap: RAMP });
  mats.set(key, m);
  return m;
}

// ---------------- what a character looks like ----------------
const ANIMALS = ['pip', 'bao', 'mochi', 'dot', 'fig', 'hazel'];
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
const MARKS = {
  common: ['apron', 'apron', 'skewers'], rare: ['pleats', 'sauce', 'roll', 'skewers'], epic: ['noodles', 'tent', 'lantern'],
  legendary: ['neon', 'glass', 'windows'], mythic: ['moon', 'neon', 'mask'], secret: ['wisps', 'mask'], divine: ['wisps', 'star'],
  transcendent: ['constellation', 'moon'], primordial: ['mask', 'neon'], eternal: ['constellation', 'star'], absolute: ['constellation', 'wisps'],
};
const PROPS = { legendary: 'cap', mythic: 'horns', secret: 'horns', divine: 'halo', transcendent: 'halo', primordial: 'horns', eternal: 'crown', absolute: 'crown' };
function shift(col, mode) {
  const c = new T.Color(col), hsl = {};
  c.getHSL(hsl);
  if (mode === 'shiny') c.setHSL((hsl.h + 0.47) % 1, Math.min(1, hsl.s * 1.25 + 0.12), Math.min(0.85, hsl.l * 1.08 + 0.04));
  return '#' + c.getHexString();
}
function animalOf(def, base) { return def.animal || ANIMALS[hash(base) % ANIMALS.length]; }
function lookOf(def, base, mode) {
  if (def.crew && !mode) return null;
  const L = def.look || {};
  if (mode === 'gold') return { base: '#f0b52a', accent: '#fff3b8', mark: 'star', tag: '' };
  const main = L.top ?? L.robe ?? L.skin ?? 0xcccccc;
  const trim = L.hairC ?? L.pants ?? L.robeTrim ?? 0xffffff;
  const list = MARKS[def.rarity] || MARKS.common;
  return { base: shift(hex(main), mode), accent: shift(hex(trim), mode), mark: list[hash(base + 'm') % list.length], tag: def.name ? def.name.slice(0, 4).toUpperCase() : '' };
}
function addProp(parent, kind, col) {
  const m = K.mat(col, 1), add = (geo, x, y, z, rz = 0) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.rotation.z = rz; parent.add(o); return o; };
  if (kind === 'cap') add(new T.CylinderGeometry(0.3, 0.33, 0.11, 14), 0.03, 0.56, 0, -0.14);
  else if (kind === 'horns') { add(new T.ConeGeometry(0.1, 0.32, 6), -0.3, 0.64, 0, 0.3); add(new T.ConeGeometry(0.1, 0.32, 6), 0.3, 0.64, 0, -0.3); }
  else if (kind === 'halo') { const o = add(new T.TorusGeometry(0.3, 0.035, 8, 24), 0, 0.8, 0); o.rotation.x = Math.PI / 2; }
  else if (kind === 'crown') {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; add(new T.ConeGeometry(0.075, 0.24, 5), Math.cos(a) * 0.27, 0.66, Math.sin(a) * 0.27); }
    add(new T.CylinderGeometry(0.31, 0.31, 0.07, 14), 0, 0.53, 0);
  }
}
function stripMeshes(root) {
  const out = [];
  root.traverse(o => { if (o.isMesh || o.isSprite || o.isLine || o.isPoints) out.push(o); });
  for (const o of out) if (o.parent) o.parent.remove(o);
}
const SIZE = 2.45;
// (2 Nov, owner: "give them some unique poses like for example the helicopter one should be floating above the ground")
// One signature idle per animal, plus a move when it attacks (R.atk runs 1 to 0, set by board.js). Skins use their animal's pose.
const S2 = v => { const s = Math.sin(v); return s * s; };
const POSE = {
  // hovers off the ground, nose down, swaying on its rotor
  fig: (t, a) => ({ y: 0.55 + Math.sin(t * 2.6) * 0.09, rx: 0.16 + Math.sin(t * 1.3) * 0.03, rz: Math.sin(t * 1.1) * 0.07, ry: Math.sin(t * 0.7) * 0.14 - a * 0.1 }),
  // high in a banking turn, wings flapping
  dot: (t, a) => ({ y: 0.7 + Math.sin(t * 1.8) * 0.12, rz: Math.sin(t * 0.9) * 0.3, rx: 0.1, ry: Math.sin(t * 0.9) * 0.2, wing: Math.sin(t * 9) * 0.4, s: 1 + a * 0.08 }),
  // (2 Nov, owner: "the bouncing makes me uncomfortable dont do that") stands still and alert, looking around, leaning back on a throw
  pip: (t, a) => ({ ry: Math.sin(t * 0.5) * 0.22, rz: Math.sin(t * 0.8) * 0.02, rx: -0.14 * a }),
  // heavy rock from corner to corner, then a big squash on the slam
  bao: (t, a) => ({ rz: Math.sin(t * 1.1) * 0.08, sy: 0.96 + Math.abs(Math.sin(t * 1.1)) * 0.05 - S2(a * 1.57) * 0.3, sx: 1.04 + S2(a * 1.57) * 0.2, y: S2(a * 3.14) * 0.3 }),
  // crouched flat and still, slowly scanning, popping up on the shot
  mochi: (t, a) => ({ sy: 0.8 + a * 0.2, sx: 1.08 - a * 0.08, rx: 0.14 - a * 0.25, ry: Math.sin(t * 0.45) * 0.34 }),
  // low and wide, shivering its spikes, spinning on an attack
  hazel: (t, a) => ({ sy: 0.82, sx: 1.12, rz: Math.sin(t * 19) * 0.012, ry: Math.sin(t * 0.8) * 0.1 + (1 - a) * (a > 0 ? 6.283 : 0) }),
  // tall and upright, head snapping from side to side, ducking to launch
  owl: (t, a) => ({ sy: 1.1 - a * 0.14, sx: 0.94 + a * 0.08, ry: Math.round(Math.sin(t * 0.55) * 1.4) * 0.3, rz: Math.round(Math.sin(t * 0.37)) * 0.09 }),
  // sways from side to side, leaning into each throw
  fox: (t, a) => ({ x: Math.sin(t * 1.5) * 0.14, rz: -Math.sin(t * 1.5) * 0.13 - a * 0.2, ry: Math.sin(t * 1.5) * 0.14 }),
  // a happy waddle, bouncing on its toes
  pig: t => ({ rz: Math.sin(t * 2.7) * 0.13, y: Math.abs(Math.sin(t * 2.7)) * 0.1, ry: Math.sin(t * 1.35) * 0.1 }),
  // sways on its feet, flopping forward onto its belly to slide
  penguin: (t, a) => ({ rz: Math.sin(t * 1.9) * 0.1, sy: 1.04 - a * 0.1, rx: a * 0.7, y: a * 0.08 }),
};
function poseFor(R, cube, animal) {
  const fn = POSE[animal];
  if (!fn) return;
  const y0 = cube.position.y, x0 = cube.position.x, rx0 = cube.rotation.x, wings = cube.userData.wings || [];
  R.anim.push(t => {
    const a = R.atk || 0, p = fn(t, a), s = SIZE * (p.s || 1);
    const sx = p.sx || 1, sy = p.sy || 1;
    // squash and stretch from the feet, or a crouch floats and a stretch sinks into the ground
    cube.position.set(x0 + (p.x || 0), y0 + (p.y || 0) + (s * sy - SIZE) / 2, 0);
    cube.rotation.set(rx0 + (p.rx || 0), p.ry || 0, p.rz || 0);
    cube.scale.set(s * sx, s * sy, s * sx);
    for (let i = 0; i < wings.length; i++) wings[i].rotation.z = (i ? -1 : 1) * (0.12 + (p.wing || 0));
  });
}
function dress(R, def, key, shiny, gold) {
  stripMeshes(R.root);
  const base = key.split('@')[0], mode = gold ? 'gold' : shiny ? 'shiny' : '';
  const animal = animalOf(def, base);
  const look = lookOf(def, base, mode);
  const cube = new T.Mesh(CUBE, material(`u:${key}:${mode}:${animal}`, () => paintCharacter(animal, look)));
  cube.scale.setScalar(SIZE);
  cube.position.y = SIZE / 2 + 0.05 - R.hipY;
  cube.rotation.x = -0.1;
  (R.torso || R.root).add(cube);
  const prop = PROPS[def.rarity];
  if (prop && look) addProp(cube, prop, parseInt(look.accent.slice(1), 16));
  // the flyers wear what flies them, so the attack pattern reads on any skin
  if (animal === 'fig') {
    const rotor = new T.Mesh(new T.BoxGeometry(1.25, 0.03, 0.1), K.mat(0x3a2a2a, 1));
    rotor.position.y = 0.62; cube.add(rotor);
    const hub = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.12, 8), K.mat(0x3a2a2a, 1));
    hub.position.y = 0.56; cube.add(hub);
    R.anim.push(t => { rotor.rotation.y = t * 26; });
  } else if (animal === 'dot') {
    for (const s of [-1, 1]) {
      const wing = new T.Mesh(new T.BoxGeometry(0.62, 0.05, 0.3), K.mat(0xfff4dc));
      wing.position.set(s * 0.72, 0.02, -0.05); wing.rotation.z = s * 0.12; cube.add(wing);
      (cube.userData.wings = cube.userData.wings || []).push(wing);
    }
  }
  R.cube = cube;
  poseFor(R, cube, animal);
  return R;
}

// ---------------- enemies ----------------
const FOE_FACES = ['grumpy', 'mean', 'sad', 'wobbly'];
function foePaint(type, col, isBig) {
  const canvas = document.createElement('canvas');
  canvas.width = CELL * 3; canvas.height = CELL * 2;
  const g = canvas.getContext('2d'), c = new T.Color(col), hsl = {};
  c.getHSL(hsl);
  const shade = new T.Color().setHSL(hsl.h, hsl.s, Math.max(0, hsl.l * 0.74));
  const dark = hsl.l < 0.28, base = '#' + c.getHexString(), sh = '#' + shade.getHexString();
  const face = isBig ? 'boss' : FOE_FACES[hash(type) % FOE_FACES.length];
  for (let i = 0; i < 6; i++) {
    g.save();
    g.translate((i % 3) * CELL, Math.floor(i / 3) * CELL);
    g.beginPath(); g.rect(0, 0, CELL, CELL); g.clip();
    g.fillStyle = i === 3 ? sh : base; g.fillRect(0, 0, CELL, CELL);
    if (i !== 2) shadeBand(g, sh);
    for (const [x, y, r] of [[22, 22, 9], [104, 30, 7], [92, 106, 10], [30, 100, 6]]) dot(g, x, y, r, sh);
    if (i === 4) {
      if (dark) { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(14, 30, 100, 76); }
      drawEnemyFace(g, face);
    }
    g.restore();
  }
  return canvas;
}
function foe(g, L, type) {
  g.updateMatrixWorld(true);
  const bb = new T.Box3().setFromObject(g), size = bb.getSize(new T.Vector3());
  // the largest part's colour keeps each world's enemies looking like they belong to that world
  let col = 0x9a8a7a, best = -1;
  g.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.color || o.material.side === T.BackSide) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const s = o.geometry.boundingSphere.radius;
    if (s > best) { best = s; col = o.material.color.getHex(); }
  });
  stripMeshes(g);
  L.length = 0;
  const big = size.y > 2.6;
  const s = Math.max(0.55, Math.max(size.y * 0.8, Math.min(size.x, size.z)));
  const cube = new T.Mesh(CUBE, material(`f:${type}`, () => foePaint(type, col, big)));
  cube.scale.setScalar(s);
  cube.position.y = Math.max(s / 2, (bb.min.y + bb.max.y) / 2);
  cube.rotation.x = -0.12;
  g.add(cube);
}

AF.soju = { dress, foe, ANIMALS, animalOf, hash };
})();
