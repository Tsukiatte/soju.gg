/* (3 Nov, owner: "make all the icons 3d if possible"): each drawing below is the plan for a real model. Every shape is extruded
   and bevelled, stacked in layers, given piped dark edges and a light from above, rendered once and kept as a picture.
   Our own icons (3 Nov, owner: "theres way too much text, do icons and stuff pelase no emjois though make your own icons").
   Every icon is hand-drawn here as a small two-tone sticker on a 24 x 24 grid with one dark outline, so they read as a set.
   AF.EI.i(name) gives an <svg>; AF.EI.chips(skill) turns a skill into icons and numbers. Names and sentences stay in tooltips. */
(function () {
const AF = window.AF;
const INK = '#1b1622';
const wrap = inner => `<g stroke="${INK}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;
const P = (fill, d, extra = '') => `<path fill="${fill}" d="${d}"${extra}/>`;
const C = (fill, cx, cy, r) => `<circle fill="${fill}" cx="${cx}" cy="${cy}" r="${r}"/>`;
const NS = ' stroke="none"';
const D = {
  // the nine picnic traits
  'icon:trait:sturdy': P('#e8382e', 'M16 5.2c2.6 1.2 3.8 3.6 3.2 6.6-1 5.2-6.6 9.6-14.6 10.2 3.8-2.6 6.2-5.8 7.2-9.4.7-2.6 1.8-5.6 4.2-7.4z') + P('#4aa65a', 'M16 5.2c.4-1.6 1.6-2.8 3.4-3.2l.9 1.8c-1.2.4-2 1.3-2.2 2.7z'),
  'icon:trait:swift': P('#fffdf5', 'M12 2.8c1.6 0 3 1 4 2.6l4.6 8.4c1.4 2.8-.2 5.8-3.2 5.8H6.6c-3 0-4.6-3-3.2-5.8L8 5.4C9 3.8 10.4 2.8 12 2.8z') + P('#26313a', 'M8 14h8v5.6H8z'),
  'icon:trait:keen': C('#8fe8a8', 9.4, 14.2, 6.6) + C('#8fe8a8', 17.4, 7.4, 3.9) + C('#8fe8a8', 18.6, 18, 2.5) + P('none', 'M6 12a3.8 3.8 0 0 1 2.6-2.4', ' stroke="#fff"'),
  'icon:trait:gilded': P('#ffb31e', 'M12 2.2c4.6 6 7.4 9 7.4 13a7.4 7.4 0 0 1-14.8 0c0-4 2.8-7 7.4-13z') + P('none', 'M8.6 15.4a3.6 3.6 0 0 0 2.6 3.4', ' stroke="#ffe9a8"'),
  'icon:trait:tempest': P('#fff4dc', 'M2.6 15.6c0-5.4 4.2-9.6 9.4-9.6s9.4 4.2 9.4 9.6c0 1.8-1.4 3.2-3.2 3.2H5.8c-1.8 0-3.2-1.4-3.2-3.2z') + P('none', 'M7.6 8l1.2 3.2M12 6.2v3.6M16.4 8l-1.2 3.2'),
  'icon:trait:solar': P('#fffdf5', 'M12 2.6c3.2 0 4.4 2 6.6 3.2 2.6 1.4 3.8 3.8 3.2 6.8-.6 3.6-2.8 4.8-4.8 6.8-2.2 2.2-5 3.2-8 2.2-3.2-1-6.2-3.8-6.6-7.4-.4-3.6 1.6-6 4.2-8C8 5 9.2 2.6 12 2.6z') + C('#ffc22a', 12, 12.2, 4.8),
  'icon:trait:eclipse': P('#ffe9a0', 'M15 2.6A9.8 9.8 0 1 0 21.6 16 8.2 8.2 0 0 1 15 2.6z') + P('#fff', 'M19 3.6l.8 1.9 2 .2-1.5 1.3.4 2-1.7-1-1.7 1 .4-2L16.200 5.700l2-.2z', ' stroke-width=".8"'),
  'icon:trait:astral': C('#3a2f7a', 12, 12, 9.8) + C('#5a4ab0', 12, 12, 6.4) + P('#ffe05a', 'M12 6.6l1.7 3.6 3.9.5-2.9 2.700.8 3.900L12 15.300l-3.500 2 .8-3.900-2.900-2.700 3.900-.5z', ' stroke-width="1"'),
  'icon:trait:infinity': P('#5ac88a', 'M9.600 2.600h4.800v4.800c0 1.600 3 2.600 3 5.600v7a1.800 1.800 0 0 1-1.800 1.800H8.400a1.800 1.800 0 0 1-1.800-1.800v-7c0-3 3-4 3-5.600z') + P('#fffdf5', 'M6.600 12.800h10.800v5.400H6.600z') + P('#d6403c', 'M9.200 1.400h5.600v2.800H9.200z'),
  // what things are
  heart: P('#ff5a6a', 'M12 21C6 16.5 2.5 13 2.5 8.7A5 5 0 0 1 12 6a5 5 0 0 1 9.5 2.7C21.5 13 18 16.5 12 21z') + P('#ffb0b8', 'M6.5 6.5a3 3 0 0 0-1.6 3', ' fill-opacity="0" stroke="#ffd0d4"'),
  sword: P('#e4edf6', 'M20.8 3.2l-7.6 1.5L5.6 12.4l6 6 7.7-7.7z') + P('#ffc83a', 'M3.6 10.6l9.8 9.8-1.8 1.6L2 12.4z') + P('#8a5a3a', 'M5.2 16.6l2.2 2.2-3.2 3.2L2 19.8z'),
  shield: P('#6ea8ff', 'M12 2.4l8.2 3v6.2c0 5-3.5 8.5-8.2 10.2-4.7-1.7-8.2-5.2-8.2-10.2V5.4z') + P('#a9ccff', 'M12 5.2v13.6C9 17.4 6.8 15 6.8 11.6V7.4z', NS),
  burst: P('#c79bff', 'M12 1.8l2.5 5.7 5.9-2.4-2.5 5.8L22.2 13l-5 1.5 1.9 5.9-5.6-2.8L12 22.2l-1.5-4.6-5.6 2.8 1.9-5.9-5-1.5 4.3-2.1-2.5-5.8 5.9 2.4z') + C('#fff', 12, 12, 2.4),
  plus: P('#7ee8a0', 'M9 2.8h6V9h6.2v6H15v6.2H9V15H2.8V9H9z'),
  skull: P('#f2e8f5', 'M12 2.6a8.4 8.4 0 0 0-8.4 8.4c0 3 1.5 5 3.7 6.2V21h9.4v-3.8c2.2-1.2 3.7-3.2 3.7-6.2A8.4 8.4 0 0 0 12 2.6z') + C(INK, 8.8, 11.6, 1.7) + C(INK, 15.2, 11.6, 1.7),
  fist: P('#ffb27a', 'M6 9.5V6a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v3.5a2 2 0 0 1 2 2v3c0 4-3 7-7 7h-2c-3 0-5.5-2-6-5l-1-3.5C3.5 11 5 9.5 6 9.5z') + P('#e8945a', 'M10 6v4M14 6v4', ' fill-opacity="0"'),
  fist2: P('#d88a5a', 'M2 11V8a1.7 1.7 0 0 1 3.4 0V7a1.7 1.7 0 0 1 3.4 0v5l-1 7H5.6C3.5 19 2 17 2 14z') + P('#ffb27a', 'M9 12V8.6a1.9 1.9 0 0 1 3.8 0v-1a1.9 1.9 0 0 1 3.8 0v1a1.9 1.9 0 0 1 3.8 0V12a1.5 1.5 0 0 1 1.5 1.5v2c0 3.5-2.6 6-6 6h-1.6c-2.6 0-4.6-1.7-5-4.2l-1-3C7 13 8 12 9 12z'),
  target: C('#ff5a4a', 12, 12, 9.4) + C('#fff', 12, 12, 6) + C('#ff5a4a', 12, 12, 2.6),
  drop: P('#ff5a6a', 'M12 2.4c4.4 6 7 8.8 7 12.6a7 7 0 0 1-14 0c0-3.8 2.6-6.6 7-12.6z') + P('#ffc0c6', 'M9 15a3.2 3.2 0 0 0 2.2 3', ' fill-opacity="0" stroke="#ffc0c6"'),
  poison: P('#8fe05a', 'M12 2.4c4.4 6 7 8.8 7 12.6a7 7 0 0 1-14 0c0-3.8 2.6-6.6 7-12.6z') + C(INK, 9.8, 13.5, 1.3) + C(INK, 14.2, 13.5, 1.3) + P('none', 'M10 17.5c1.2.8 2.8.8 4 0'),
  pencil: P('#ffd25a', 'M16.6 3.2l4.2 4.2L8.4 19.8l-4.2-4.2z') + P('#ff8a9a', 'M16.6 3.2a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8l-1 1-4.2-4.2z') + P('#f6e0c0', 'M4.2 15.6l4.2 4.2-5.6 1.4z'),
  stars: P('#ffe05a', 'M12 2.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 8.8l6-.7z'),
  bolt: P('#ffe05a', 'M13.6 1.8L4.6 13.6h6l-1.6 8.6 10.4-13h-6.4z'),
  boltR: P('#ff5a3a', 'M13.6 1.8L4.6 13.6h6l-1.6 8.6 10.4-13h-6.4z'),
  cloud: P('#c6c8d6', 'M6.6 19a4.6 4.6 0 0 1-.8-9.1A6.4 6.4 0 0 1 18 8.6 5.2 5.2 0 0 1 17.6 19z'),
  bubble: C('#7fd8ff', 12, 12, 9.4) + P('none', 'M7.4 9.8a5.4 5.4 0 0 1 3.6-3.4', ' stroke="#fff"'),
  horn: P('#ffc83a', 'M3 9.5l11-5.5v15L3 14z') + P('#e8a020', 'M14 7.5a5 5 0 0 1 0 8.5z') + P('none', 'M6 14.5l1 5.5h3l-1-4.5'),
  grave: P('#a8a8b4', 'M6 21V9.4a6 6 0 0 1 12 0V21z') + P('#7ee8a0', 'M10.6 7.6h2.8v2.6H16V13h-2.6v3.4h-2.8V13H8v-2.8h2.6z', ' stroke-width="1"'),
  helmet: P('#a9b4c6', 'M3.4 14.6a8.6 8.6 0 0 1 17.2 0V20h-5v-5H8.4v5h-5z') + P('#ffc83a', 'M10.6 3.6h2.8v8h-2.8z'),
  coin: C('#ffd93a', 12, 12, 9.6) + P('none', 'M8.4 7.4L12 12l3.6-4.6M12 12v5.2M8.8 12.6h6.4M8.8 15h6.4', ' stroke="#a6720f"'),
  crown: P('#ffd93a', 'M2.6 8.4l5 4.2L12 4.4l4.4 8.2 5-4.2-2 11.2H4.6z') + C('#ff5a6a', 12, 15.4, 1.5),
  cap: C('#ffd93a', 12, 12, 9.6) + C('#ffec8a', 12, 12, 5.2) + P('none', 'M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M5.4 18.6l1.4-1.4M17.2 6.8l1.4-1.4', ' stroke="#a6720f"'),
  cheers: P('#bff0c8', 'M5.6 2.8h12.8L16.6 18a3 3 0 0 1-3 2.8h-3.2a3 3 0 0 1-3-2.8z') + P('#6ad080', 'M7 9h10l-1 8.6a2 2 0 0 1-2 1.6h-4a2 2 0 0 1-2-1.6z', NS),
  xp: P('#7fd8ff', 'M12 2.5l9 5v9l-9 5-9-5v-9z') + P('#fff', 'M12 7l1.5 3.4 3.6.4-2.7 2.5.8 3.7L12 14.7l-3.2 1.8.8-3.7-2.7-2.5 3.6-.4z', NS),
  hourglass: P('#ffd25a', 'M6 2.6h12v3.6c0 2.8-3.4 4-3.4 5.8s3.4 3 3.4 5.8v3.6H6v-3.6c0-2.8 3.4-4 3.4-5.8S6 9 6 6.2z') + P('#c9882a', 'M8.6 18.6c.6-1.8 2.6-2.4 3.4-3.6.8 1.2 2.8 1.8 3.4 3.6z', NS),
  // the buttons
  play: P('#7fe07a', 'M6.6 3.4c0-1 1.1-1.6 2-1l12 8.1c.8.6.8 1.8 0 2.4l-12 8.1c-.9.6-2 0-2-1z'),
  pause: P('#e4edf6', 'M5.4 3.4h4.8v17.2H5.4zM13.8 3.4h4.8v17.2h-4.8z'),
  flask: P('#e8f4ff', 'M9.4 2.4h5.2v6.2l5.4 10a2.2 2.2 0 0 1-2 3.2H6a2.2 2.2 0 0 1-2-3.2l5.4-10z') + P('#7ee8a0', 'M7 15h10l2 3.8a1.2 1.2 0 0 1-1 1.8H6a1.2 1.2 0 0 1-1-1.8z', NS),
  robot: P('#a9c4e8', 'M4.6 9.4h14.8v10.4a2 2 0 0 1-2 2H6.6a2 2 0 0 1-2-2z') + C('#7fe0ff', 8.8, 14.4, 1.9) + C('#7fe0ff', 15.2, 14.4, 1.9) + P('none', 'M12 9.4V5') + C('#ff5a4a', 12, 3.8, 1.6),
  skip: P('#e4edf6', 'M3.2 4.2c0-.9 1-1.4 1.8-.9l10 7.6c.7.5.7 1.6 0 2.1l-10 7.6c-.8.5-1.8 0-1.8-.9z') + P('#ffd25a', 'M16.8 3.4h4v17.2h-4z'),
  retry: P('#7fd8ff', 'M12 4.2V1.4l5.4 4.2L12 9.8V7a5.6 5.6 0 1 0 5.6 5.6h3A8.6 8.6 0 1 1 12 4.2z'),
  map: P('#f0dfae', 'M2.6 5.6l6-2.4 6.8 2.4 6-2.4v15.2l-6 2.4-6.8-2.4-6 2.4z') + P('#8fd07a', 'M8.6 3.2l6.8 2.4v15.2l-6.8-2.4z', NS) + P('none', 'M8.6 3.2v15.2M15.4 5.6v15.2'),
  lock: P('#ffc83a', 'M5 10.4h14v10.2a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 20.6z') + P('none', 'M8 10.4V7a4 4 0 0 1 8 0v3.4') + C(INK, 12, 15.6, 1.3),
  check: P('#7fe07a', 'M2.8 13.2l3.4-3.4 4 4L18 5.8l3.4 3.4-11.2 11.4z'),
  x: P('#ff7a6a', 'M6 2.8L12 8.8l6-6L21.2 6l-6 6 6 6-3.2 3.2-6-6-6 6L2.8 18l6-6-6-6z'),
  swap: P('#ffd25a', 'M3 8.4L9 3.2v3h10v4.6H9v3zM21 15.6L15 20.8v-3H5v-4.6h10v-3z'),
  zoomIn: C('#e4edf6', 10.4, 10.4, 7.6) + P('none', 'M15.8 15.8l5.4 5.4M7 10.4h6.8M10.4 7v6.8'),
  zoomOut: C('#e4edf6', 10.4, 10.4, 7.6) + P('none', 'M15.8 15.8l5.4 5.4M7 10.4h6.8'),
  pin: P('#ff5a4a', 'M12 1.8a7.4 7.4 0 0 1 7.4 7.4c0 5-7.4 13-7.4 13S4.6 14.2 4.6 9.2A7.4 7.4 0 0 1 12 1.8z') + C('#fff', 12, 9.2, 2.8),
  party: C('#ffb8d0', 7.4, 8.4, 3.6) + P('#ff8ab4', 'M1.8 20a5.6 5.6 0 0 1 11.2 0z') + C('#ffd25a', 16.4, 7.2, 4.2) + P('#ffb82a', 'M9.4 21a7 7 0 0 1 14 0z'),
  anvil: P('#9aa6b8', 'M2.4 7h13.4a5.4 5.4 0 0 0 5.8 4.4V13H15c-1.6 0-3 1.2-3 2.8V17h3.6v3.6H5V17h3.4v-1.2C8.4 12.6 5 11.4 2.4 10.6z'),
  hammer: P('#9aa6b8', 'M5 3.4h11l3.6 3.6v3h-3l-2-1.6H5z') + P('#8a5a3a', 'M8 8.4h4l-.6 13H8.6z'),
  pot: P('#d86a4a', 'M3.6 10.4h16.8v6a5 5 0 0 1-5 5H8.6a5 5 0 0 1-5-5z') + P('#f09a6a', 'M1.8 8h20.4v2.6H1.8z') + P('none', 'M8.4 2.6c-1 1.6 1 2.4 0 3.6M12 2.6c-1 1.6 1 2.4 0 3.6M15.6 2.6c-1 1.6 1 2.4 0 3.6', ' stroke="#e4edf6"'),
  bottle: P('#7fe07a', 'M9.6 6h4.8v3.6c0 1.8 3 2.6 3 6.4v4.8a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6V16c0-3.8 3-4.6 3-6.4z') + P('#ffd93a', 'M9.2 1.8h5.6V6H9.2z') + P('#fff', 'M8.8 13.6h6.4v5.4H8.8z', ' stroke-width="1"'),
  luckyb: P('#7fe07a', 'M9.6 6h4.8v3.6c0 1.8 3 2.6 3 6.4v4.8a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6V16c0-3.8 3-4.6 3-6.4z') + P('#ffd93a', 'M9.2 1.8h5.6V6H9.2z') + P('#ffd93a', 'M12 12l1.3 2.7 3 .3-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.3z', ' stroke-width="1"'),
  sun: P('#ffd25a', 'M12 1.6l2 3.4 3.8-1 1 3.8 3.4 2-2 3.2 2 3.2-3.4 2-1 3.8-3.8-1-2 3.4-2-3.4-3.8 1-1-3.8-3.4-2 2-3.2-2-3.2 3.4-2 1-3.8 3.8 1z') + C('#ffa82a', 12, 12, 4.4),
  bag: P('#c9955a', 'M5.4 8h13.2l2 12a1.8 1.8 0 0 1-1.8 2H5.2a1.8 1.8 0 0 1-1.8-2z') + P('none', 'M8.6 10.8V6a3.4 3.4 0 0 1 6.8 0v4.8'),
  scroll: P('#f0dfae', 'M6 3h12.4a2.4 2.4 0 0 1 2.4 2.4V7h-3.4v12.4a2.6 2.6 0 0 1-2.6 2.6H5.4A2.4 2.4 0 0 1 3 19.6V18h11.2v1.4') + P('none', 'M7 8h7M7 12h7'),
  tent: P('#ff5a7a', 'M12 2.6l10 17.4H2z') + P('#fff0e0', 'M12 2.6L8 20h8z') + P('#7a2a3a', 'M12 12l-2.6 8h5.2z'),
  gate: P('#8a7a6a', 'M3 21V6.8h4V21zM17 21V6.8h4V21z') + P('#c9455a', 'M1.6 3.4h20.8v4H1.6z') + P('#6a4a2e', 'M7 9.6h10V21H7z') + C('#ffd93a', 14.4, 15.4, 1.2),
  chest: P('#b86a36', 'M2.8 11h18.4v9.4a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4z') + P('#d88a4a', 'M2.8 11V8a4.6 4.6 0 0 1 4.6-4.6h9.2A4.6 4.6 0 0 1 21.2 8v3z') + P('#ffd93a', 'M10 9.4h4v4.4h-4z'),
  castle: P('#8a8898', 'M3 22V8.4h2.2V6h2.4v2.4h2V6h2.4v3h2.4V6h2.4v2.4h2V6h2.4v2.4H21V22z') + P('#2a2228', 'M9.6 22v-5.4a2.4 2.4 0 0 1 4.8 0V22z'),
  die: P('#fff', 'M5 2.8h14A2.2 2.2 0 0 1 21.2 5v14a2.2 2.2 0 0 1-2.2 2.2H5A2.2 2.2 0 0 1 2.8 19V5A2.2 2.2 0 0 1 5 2.8z'),
  wheel: C('#3aa56a', 12, 12, 9.8) + P('#ffd93a', 'M12 12V2.2A9.8 9.8 0 0 1 21.8 12z', NS) + P('#ffd93a', 'M12 12v9.8A9.8 9.8 0 0 1 2.2 12z', NS) + C('#fff', 12, 12, 2.6) + P('none', 'M12 2.2v19.6M2.2 12h19.6'),
  // hats: what class a hero wears
  hat_cap: P('#ff9d3a', 'M4 15a8 8 0 0 1 16 0z') + P('#e87a2a', 'M3 15h13.4c2.4 0 4.6 1 5.6 3H6c-1.6 0-3-1.4-3-3z'),
  hat_top: P('#30323c', 'M7 3.4h10v13.2H7z') + P('#ff5a6a', 'M7 12.4h10v3H7z', NS) + P('#30323c', 'M2.8 16.6h18.4v3.4H2.8z'),
  hat_band: P('#ff5a6a', 'M3 8.6h18v6.2H3z') + P('#ff5a6a', 'M17 14.8l3.6 6.2-3.4 1-2.6-7.2z') + C('#fff', 9, 11.7, 1.6),
  hat_wizard: P('#8a6ae0', 'M12 1.8l6.4 15H5.6z') + P('#6a4ac0', 'M2 16.8h20v3.8H2z') + P('#ffd93a', 'M12 8l.9 2 2.1.2-1.6 1.4.5 2.1L12 12.6l-1.9 1.1.5-2.1L9 10.2l2.1-.2z', ' stroke-width=".8"'),
  hat_nurse: P('#fff', 'M4.4 7.4h15.2l1.6 10.4H2.8z') + P('#ff4a5a', 'M10.6 8.8h2.8v2.2h2.2v2.8h-2.2V16h-2.8v-2.2H8.4V11h2.2z', ' stroke-width="1"'),
  hat_tiara: P('#ffd93a', 'M3 18.4L2 7.6l5.4 4L12 3.8l4.6 7.8 5.4-4-1 10.8z') + C('#7fd8ff', 12, 13.8, 1.8),
  hat_bandana: P('#3a7ae0', 'M3.6 14a8.4 8.4 0 0 1 16.8 0z') + P('#3a7ae0', 'M18.6 14l3.8 4.6-3 1.4-2.8-6z') + C('#fff', 9, 10.4, 1) + C('#fff', 13.4, 9, 1) + C('#fff', 14.6, 12, 1),
  // materials
  mat_rice: P('#f4efe0', 'M2.8 12h18.4a9.2 9.2 0 0 1-18.4 0z') + P('#fff', 'M5.2 12a6.8 6.8 0 0 1 13.6 0z') + P('#d86a4a', 'M8 19.4h8v2H8z'),
  mat_barley: P('#e0b85a', 'M12 2l2.6 3.4L12 8.8 9.4 5.4zM7 6.6l3.6 2.6-.8 3.8-3.6-2.6zM17 6.6l-3.6 2.6.8 3.8 3.6-2.6zM7 12l3.6 2.6-.8 3.8-3.6-2.6zM17 12l-3.6 2.6.8 3.8 3.6-2.6z') + P('none', 'M12 8.8v13.4'),
  mat_lemon: P('#ffe14a', 'M12 3.4c4.8 0 8.8 3.8 8.8 8.6S16.8 20.6 12 20.6c-4.8 0-8.8-3.8-8.8-8.6S7.2 3.4 12 3.4z') + P('#7fd05a', 'M13 3.4c1-1.6 3-2 4.6-1.4-.4 1.8-2.4 3-4.6 1.4z') + P('none', 'M7.6 10.4a4.8 4.8 0 0 1 3-3', ' stroke="#fff6b0"'),
  mat_ice: P('#a8e4ff', 'M12 2.4l8.6 4.8v9.6L12 21.6l-8.6-4.8V7.2z') + P('#e0f6ff', 'M12 2.4l8.6 4.8L12 12 3.4 7.2z') + P('none', 'M12 12v9.6'),
  mat_charcoal: P('#55555f', 'M5 8.6l6-5 7.4 2.4 3 7-4 7.2-8.2 1.4-5.8-5z') + P('none', 'M9 9.6l5 2 3-4M14 11.6l-2 5', ' stroke="#8a8a96"'),
  mat_peach: P('#ffae8a', 'M12 6.6c5.4-3 9.4 1 9.4 5.8 0 5-4.4 9-9.4 9s-9.4-4-9.4-9c0-4.8 4-8.8 9.4-5.8z') + P('none', 'M12 6.6c-2 4-2 8 0 12', ' stroke="#e87a5a"') + P('#7fd05a', 'M12 6.6c0-2.4 2-4.2 4.6-4.2 0 2.6-2 4.4-4.6 4.2z'),
  mat_grape: C('#a6e05a', 8, 9, 3.4) + C('#a6e05a', 16, 9, 3.4) + C('#a6e05a', 12, 8, 3.4) + C('#a6e05a', 10, 14, 3.4) + C('#a6e05a', 14, 14, 3.4) + C('#a6e05a', 12, 19, 3.4) + P('none', 'M12 4.6V1.8'),
  mat_star: P('#c9a8ff', 'M12 1.6l2.2 8.2 8.2 2.2-8.2 2.2L12 22.4l-2.2-8.2L1.6 12l8.2-2.2z') + C('#fff', 18.6, 5.4, 1.4) + C('#fff', 5.4, 18.6, 1.1),
  mat_cork: P('#c9955a', 'M6.4 4.4h11.2L16 19.6H8z') + C('#8a5a2e', 10, 9, .9) + C('#8a5a2e', 14, 12, .9) + C('#8a5a2e', 11, 15.4, .9),
  // food and drink
  pot_heal1: P('#fff', 'M4 11h16a8 8 0 0 1-16 0z') + P('#7ee8a0', 'M6 11h12a6 6 0 0 1-.4 1.8H6.4A6 6 0 0 1 6 11z', NS) + P('none', 'M9.6 3.4c-1 1.8 1 2.6 0 4.2M14.4 3.4c-1 1.8 1 2.6 0 4.2', ' stroke="#e4edf6"'),
  pot_heal2: P('#58d888', 'M2.4 10h19.2a9.6 9.6 0 0 1-19.2 0z') + P('none', 'M8.4 2.6c-1 1.8 1 2.6 0 4.2M15.6 2.6c-1 1.8 1 2.6 0 4.2M12 2.6c-1 1.8 1 2.6 0 4.2', ' stroke="#e4edf6"'),
  pot_heal3: P('#38c070', 'M3.6 10.4h16.8v6a5 5 0 0 1-5 5H8.6a5 5 0 0 1-5-5z') + P('#d84a3a', 'M1.8 8h20.4v2.6H1.8z') + P('none', 'M8.4 2.6c-1 1.6 1 2.4 0 3.6M15.6 2.6c-1 1.6 1 2.4 0 3.6', ' stroke="#e4edf6"'),
  pot_rage1: P('#e8f4ff', 'M6 5h12l-1.8 15.6H7.8z') + P('#ffe14a', 'M7 12h10l-.9 8H7.9z', NS),
  pot_rage2: P('#7fe07a', 'M9.6 6h4.8v3.6c0 1.8 3 2.6 3 6.4v4.8a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6V16c0-3.8 3-4.6 3-6.4z') + P('#ffc83a', 'M9.2 1.8h5.6V6H9.2z') + P('#3a9a4a', 'M7.4 15.6h9.2v5.2a.8.8 0 0 1-.8.8H8.2a.8.8 0 0 1-.8-.8z', NS),
  pot_rage3: P('#ffd93a', 'M9.6 6h4.8v3.6c0 1.8 3 2.6 3 6.4v4.8a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6V16c0-3.8 3-4.6 3-6.4z') + P('#fff0a0', 'M9.2 1.8h5.6V6H9.2z'),
  pot_group: P('#8fe0d0', 'M2.6 9.4h18.8v7a5 5 0 0 1-5 5H7.6a5 5 0 0 1-5-5z') + P('#fff', 'M1.4 7h21.2v2.6H1.4z') + P('#ff5a6a', 'M10.4 11.6h3.2v2.4H16v3.2h-2.4v2h-3.2v-2H8V14h2.4z', ' stroke-width="1"'),
  pot_xp2: P('#b98cff', 'M3.6 8.4h13.6v6.4a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-6-6z') + P('none', 'M17.2 10.4h1.6a2.4 2.4 0 0 1 0 4.8h-1.8M7.4 2.6c-1 1.4 1 2.2 0 3.6M12.4 2.6c-1 1.4 1 2.2 0 3.6'),
  pot_lastcall: P('#ffc83a', 'M12 2.6a7 7 0 0 1 7 7c0 5 1.6 6 2.6 7.6H2.4C3.4 15.6 5 14.6 5 9.6a7 7 0 0 1 7-7z') + P('#c9882a', 'M9.4 18.6h5.2a2.6 2.6 0 0 1-5.2 0z'),
  // gear
  g_chop: P('#c9955a', 'M18.6 2.2l2.6 1.6L6.4 21.8l-1.4-.8zM13.4 1.8l2.6.8L4.6 21.4l-1.4-.4z'),
  g_skewer: P('none', 'M3 21L21 3') + C('#d8784a', 15.4, 8.6, 3) + C('#7fd05a', 10.6, 13.4, 3) + C('#ffb84a', 6.4, 17.6, 2.6),
  g_ladle: P('#c8d0dc', 'M20 2.4l1.6 1.6-9.6 9.6a5.6 5.6 0 1 1-1.6-1.6z'),
  g_tray: P('#c8d0dc', 'M1.8 14h20.4a10.2 10.2 0 0 1-20.4 0z') + P('none', 'M12 14V8.4') + C('#ffd25a', 12, 7, 1.6),
  g_sign: P('#8a5a3a', 'M4 2.8h16v15H4z') + P('#f0dfae', 'M6.4 5.2h11.2v10.2H6.4z', NS) + P('none', 'M8.4 8h7M8.4 11h7M9 17.8L7 22M15 17.8l2 4.2'),
  g_mitt: P('#ff8a6a', 'M6 12V7a4.6 4.6 0 0 1 9.2 0v3.6l2.6-2.4a2 2 0 0 1 2.8 2.8l-5.4 5.8V21H6z') + P('#fff', 'M6 17.4h9.2V21H6z'),
  g_set: C('#ffd93a', 8.4, 12, 6) + C('none', 15.6, 12, 6),
  // effects
  st_taunt: P('#ffb648', 'M3 10l13-5.6v15.2L3 14z') + P('none', 'M18.6 8.4a5 5 0 0 1 0 7.2M6.4 15l1.6 5h2.8'),
  st_guard: P('#8fd0ff', 'M15 3l6.4 2.4v5c0 4-2.6 6.8-6.4 8.2') + P('#6ea8ff', 'M9.4 5.2l6.6 2.4v5.2c0 4.2-2.8 7-6.6 8.4-3.8-1.4-6.6-4.2-6.6-8.4V7.6z'),
  st_more: P('#ff8a5a', 'M12 2.4l8.2 3v6.2c0 5-3.5 8.5-8.2 10.2-4.7-1.7-8.2-5.2-8.2-10.2V5.4z') + P('none', 'M12 5l-2 5 4 2.4-2.4 4.6'),
  st_power: P('#ffd25a', 'M12 2.2l8.4 9.4h-5v10h-6.8v-10h-5z'),
  st_weak: P('#b98cff', 'M12 21.8l8.4-9.4h-5v-10H8.6v10h-5z'),
  st_thorns: P('#d8a860', 'M12 2l2.2 6.4 6-3.2-3.2 6L23 13.4l-6 1.8 3.2 6-6-3.2L12 22l-2.2-4-6 3.2 3.2-6-6-1.8 6-2.2-3.2-6 6 3.2z'),
  st_counter: P('#ff9d3a', 'M12 4.4V1.4L6 6l6 4.6V7.4a6 6 0 1 1-6 6H3a9 9 0 1 0 9-9z'),
  st_mirror: P('#ff8ad0', 'M6 2.4h12v19.2H6z') + P('#ffe0f4', 'M8.4 5h7.2v14H8.4z', NS) + P('none', 'M10 14l4-5'),
  st_gang: P('#ff6a5a', 'M3.2 2.6l7 7-2 2-7-7zM20.8 2.6l-7 7 2 2 7-7z') + P('#e4edf6', 'M12 11.4l5 9.4H7z'),
  st_feeder: P('#7ee8a0', 'M12 21C6 16.5 2.5 13 2.5 8.7A5 5 0 0 1 12 6a5 5 0 0 1 9.5 2.7C21.5 13 18 16.5 12 21z') + P('#fff', 'M10.6 8.6h2.8v2.2h2.2v2.8h-2.2v2.2h-2.8v-2.2H8.4v-2.8h2.2z', ' stroke-width="1"'),
  st_magnet: P('#ff8ad0', 'M3.6 3h6v9.6a2.4 2.4 0 0 0 4.8 0V3h6v9.6a8.4 8.4 0 0 1-16.8 0z') + P('#fff', 'M3.6 3h6v4h-6zM14.4 3h6v4h-6z', ' stroke-width="1"'),
  st_drip: P('#ff5a6a', 'M12 21.8l6.8-8.4h-4V2.4H9.2v11h-4z'),
  st_shield2: P('#f0f0ff', 'M12 2.4l8.2 3v6.2c0 5-3.5 8.5-8.2 10.2-4.7-1.7-8.2-5.2-8.2-10.2V5.4z') + P('#ffd93a', 'M12 7l1.5 3.2 3.4.4-2.5 2.3.7 3.4L12 14.6l-3 1.7.7-3.4-2.5-2.3 3.4-.4z', ' stroke-width="1"'),
  // who a skill lands on
  t_me: C('#ffe9a0', 12, 8, 4.6) + P('#ffd25a', 'M3.6 21.6a8.4 8.4 0 0 1 16.8 0z'),
  t_ally: C('#9dff7a', 12, 8, 4.6) + P('#7fe07a', 'M3.6 21.6a8.4 8.4 0 0 1 16.8 0z'),
  t_team: C('#9dff7a', 7.4, 8.4, 3.6) + P('#7fe07a', 'M1.8 20a5.6 5.6 0 0 1 11.2 0z') + C('#9dff7a', 16.6, 8.4, 3.6) + P('#7fe07a', 'M11 20a5.6 5.6 0 0 1 11.2 0z'),
  t_foe: C('#ff8a6a', 12, 8, 4.6) + P('#ff5a4a', 'M3.6 21.6a8.4 8.4 0 0 1 16.8 0z'),
  t_foes: C('#ff8a6a', 7.4, 8.4, 3.6) + P('#ff5a4a', 'M1.8 20a5.6 5.6 0 0 1 11.2 0z') + C('#ff8a6a', 16.6, 8.4, 3.6) + P('#ff5a4a', 'M11 20a5.6 5.6 0 0 1 11.2 0z'),
  // a hand, for "drag this"
  hand: P('#fff', 'M9 2.6a2 2 0 0 1 4 0V10l5.6 1.2a2.8 2.8 0 0 1 2.2 3.2l-.8 5a3 3 0 0 1-3 2.6h-5.6a3 3 0 0 1-2.4-1.2L3.6 14.6a1.9 1.9 0 0 1 2.8-2.5L9 14.2z'),
  // the die, the arrow on a stage board, the wheel's pointer, the bottle meter
  die0: P('#fff', 'M6 2.8h12A3.2 3.2 0 0 1 21.2 6v12a3.2 3.2 0 0 1-3.2 3.2H6A3.2 3.2 0 0 1 2.8 18V6A3.2 3.2 0 0 1 6 2.8z') + P('none', 'M9 9.4a3 3 0 1 1 4.4 2.6c-1 .6-1.4 1.2-1.4 2.4M12 17.2v.2', ' stroke="#e0344a" stroke-width="2"'),
  die1: P('#fff', 'M6 2.8h12A3.2 3.2 0 0 1 21.2 6v12a3.2 3.2 0 0 1-3.2 3.2H6A3.2 3.2 0 0 1 2.8 18V6A3.2 3.2 0 0 1 6 2.8z') + C('#e0344a', 12, 12, 2.3),
  die2: P('#fff', 'M6 2.8h12A3.2 3.2 0 0 1 21.2 6v12a3.2 3.2 0 0 1-3.2 3.2H6A3.2 3.2 0 0 1 2.8 18V6A3.2 3.2 0 0 1 6 2.8z') + C('#e0344a', 8, 8, 2.1) + C('#e0344a', 16, 16, 2.1),
  die3: P('#fff', 'M6 2.8h12A3.2 3.2 0 0 1 21.2 6v12a3.2 3.2 0 0 1-3.2 3.2H6A3.2 3.2 0 0 1 2.8 18V6A3.2 3.2 0 0 1 6 2.8z') + C('#e0344a', 7.4, 7.4, 2) + C('#e0344a', 12, 12, 2) + C('#e0344a', 16.6, 16.6, 2),
  arrowG: P('#5fd86a', 'M12 1.8l10 11h-5.6v9.4H7.6v-9.4H2z'),
  arrowY: P('#ffd93a', 'M12 1.8l10 11h-5.6v9.4H7.6v-9.4H2z'),
  arrowR: P('#ff5a4a', 'M12 1.8l10 11h-5.6v9.4H7.6v-9.4H2z'),
  ptr: P('#fff4c8', 'M3.4 2.6h17.2L12 21.8z'),
  gaugeE: P('#d8f4e0', 'M9.2 5.6h5.6v3.6c0 1.8 3.4 2.8 3.4 6.6v5a1.8 1.8 0 0 1-1.8 1.8H7.6a1.8 1.8 0 0 1-1.8-1.8v-5c0-3.8 3.4-4.8 3.4-6.6z') + P('#ffd93a', 'M8.8 1.4h6.4v4.2H8.8z'),
  gaugeF: P('#6fe06a', 'M9.2 5.6h5.6v3.6c0 1.8 3.4 2.8 3.4 6.6v5a1.8 1.8 0 0 1-1.8 1.8H7.6a1.8 1.8 0 0 1-1.8-1.8v-5c0-3.8 3.4-4.8 3.4-6.6z') + P('#ffd93a', 'M8.8 1.4h6.4v4.2H8.8z') + C('#ffd93a', 12, 16.4, 2.6),
  // the lobby's buttons
  book: P('#6ea8ff', 'M12 6C10 4.4 6.8 3.8 2.8 4.4v14.8c4-.6 7.2 0 9.2 1.6 2-1.6 5.2-2.2 9.2-1.6V4.4C17.2 3.8 14 4.4 12 6z') + P('none', 'M12 6v14.8'),
  sound: P('#ffd25a', 'M11.4 3.6L6.2 8.4H2.4v7.2h3.8l5.2 4.8z') + P('none', 'M15 8.6a4.8 4.8 0 0 1 0 6.8M18 5.6a9 9 0 0 1 0 12.8', ' stroke="#7fd8ff" stroke-width="2"'),
  mute: P('#a8a8b4', 'M11.4 3.6L6.2 8.4H2.4v7.2h3.8l5.2 4.8z') + P('none', 'M15.4 9.4l5.4 5.4M20.8 9.4l-5.4 5.4', ' stroke="#ff5a4a" stroke-width="2.4"'),
  sliders: P('#9aa6b8', 'M2.6 4.6h18.8v2.8H2.6zM2.6 10.6h18.8v2.8H2.6zM2.6 16.6h18.8v2.8H2.6z') + C('#ffd25a', 16, 6, 2.7) + C('#ff8a5a', 8, 12, 2.7) + C('#7fd8ff', 14, 18, 2.7),
  search: C('#a8e4ff', 10.4, 10.4, 7.2) + P('#8a5a3a', 'M15.2 17.6l2.4-2.4 4.6 4.6a1.7 1.7 0 0 1-2.4 2.4z'),
  up: P('#7fe07a', 'M12 3.6l9.6 10.6h-5.4v6.2H7.8v-6.2H2.4z'),
  alert: P('#ffc83a', 'M12 2.4l10.4 18.8H1.6z') + P('none', 'M12 9.4v5.4M12 18v.2', ' stroke-width="2.4"'),
  info: C('#6ea8ff', 12, 12, 9.6) + P('none', 'M12 11v6M12 7.2v.2', ' stroke="#fff" stroke-width="2.6"'),
  uw: P('#ff5a4a', 'M4.6 2.4c-.6 3.4.6 6 3 7.4l-2.6 2C3 9.6 2.8 5 4.6 2.4zM19.4 2.4c.6 3.4-.6 6-3 7.4l2.6 2c2-2.2 2.2-6.8.4-9.4z') + P('#f2e8f5', 'M12 5.4a7.4 7.4 0 0 0-7.4 7.4c0 2.6 1.4 4.4 3.2 5.4v3.4h8.4v-3.4c1.8-1 3.2-2.8 3.2-5.4A7.4 7.4 0 0 0 12 5.4z') + C('#ff5a4a', 9.2, 12.6, 1.6) + C('#ff5a4a', 14.8, 12.6, 1.6),
  // the eight worlds, for their map signs
  w_village: P('#8a5a3a', 'M10.6 13h2.8v8.6h-2.8z') + P('#5fae4a', 'M12 1.8a7 7 0 0 1 6.8 8.6A5 5 0 0 1 15 17H9a5 5 0 0 1-3.8-6.6A7 7 0 0 1 12 1.8z'),
  w_harbor: P('#8a5a3a', 'M2.8 14h18.4l-3 6.8H5.8z') + P('#fff', 'M12 2.6l7 10H12z') + P('none', 'M12 2.6V14'),
  w_desert: P('#e8bf74', 'M12 3l9.6 18H2.4z') + P('#c9984a', 'M12 3l9.6 18H12z', NS),
  w_frost: P('#a8c8d8', 'M12 2.6l10.4 18.8H1.6z') + P('#fff', 'M12 2.6l4 7.2-2 1.6-2-1.4-2 1.4-2-1.6z', ' stroke-width="1"'),
  w_grave: P('#8a8a90', 'M6 21.4V9.4a6 6 0 0 1 12 0v12z') + P('none', 'M12 6.4v7.2M9 9.2h6'),
  w_volcano: P('#5a4040', 'M9 8h6l7.4 13.4H1.6z') + P('#ff6a2a', 'M9 8h6l1.6 3-2 1.6-2-1.4-2.2 1.4-2-1.6z', ' stroke-width="1"') + P('#ff9a4a', 'M10.6 2.4l1.4 3 1.6-3 .4 4.6h-4z', ' stroke-width="1"'),
  w_neon: P('#34365c', 'M3.4 8.4h6.4v13H3.4zM10.6 3h6.4v18.4h-6.4zM17.6 11h3.4v10.4h-3.4z') + P('#48e0ff', 'M12.2 6h3.2v2h-3.2zM12.2 10h3.2v2h-3.2z', NS) + P('#ff4ac0', 'M4.8 11h3.4v2H4.8z', NS),
  w_space: C('#c9a8ff', 12, 12, 6.8) + P('none', 'M2 15.6c4 1.4 8-.2 12.4-2.8S21 8.2 22 8.8c1 1-2 4-7.6 7S3 19 2 18c-.6-.8.8-2 3-3.4', ' stroke="#ffd93a"'),
};
const SET_C = { night: '#7a8ae0', lucky: '#7fe07a', again: '#ffb84a', last: '#ff6a7a', happy: '#ffd93a', mom: '#ff8ad0', pick: '#7fd8ff' };
for (const id in SET_C) D['set_' + id] = C(SET_C[id], 8.4, 12, 6) + C('none', 15.6, 12, 6);

// ---------------- the 3D pictures ----------------
// tools/soju_icons_bake.mjs turns every drawing into a real model (js is tools/soju_icons3d.js), renders it, and packs them all into
// art/icons3d.webp with its index in js/epic_iconatlas.js. Run it again after adding or changing a drawing. Anything not in the sheet
// yet shows its flat drawing, so nothing breaks in between.
const A = AF.EI_ATLAS || { cols: 1, rows: 1, at: {} }, SHEET = 'art/icons3d.webp';
const flat = n => wrap(D[n] || D.x);
const has = n => A.at[n] != null;
const box = n => (has(n) ? `${(A.at[n] % A.cols) * 24} ${Math.floor(A.at[n] / A.cols) * 24} 24 24` : '0 0 24 24');
const inner = n => (has(n) ? `<image href="${SHEET}" width="${A.cols * 24}" height="${A.rows * 24}"/>` : flat(n));
const i = (n, cls = '') => `<svg class="ei ${cls}" viewBox="${box(n)}" aria-hidden="true">${inner(n)}</svg>`;
const EI = AF.EI = { i, inner, D, flat, has };
// inside another drawing (the wheel)
EI.nest = (n, x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${box(n)}">${inner(n)}</svg>`;
// the rest of the game asks for its icons by name through here too
const icon2d = AF.icon, TAB = { 'tab:area': 'party', 'tab:summon': 'gate', 'tab:units': 'hat_top', 'tab:traits': 'burst', 'tab:ascend': 'st_power', 'tab:journal': 'scroll', 'tab:defense': 'map' };
AF.iconRaw = icon2d;
AF.icon = (key, cls = '') => (TAB[key] ? i(TAB[key], cls) : has('icon:' + key) ? i('icon:' + key, 'gi ' + cls) : icon2d(key, cls));
const sheetImg = new Image(); sheetImg.src = SHEET;
EI.sheet = sheetImg.decode().catch(() => {}); // resolves when the sheet can be drawn from
// onto a canvas, for pictures that live inside a 3D scene
EI.paint = (c, n, x, y, s) => {
  if (!has(n) || !sheetImg.naturalWidth) return false;
  const w = sheetImg.naturalWidth / A.cols, h = sheetImg.naturalHeight / A.rows;
  c.drawImage(sheetImg, (A.at[n] % A.cols) * w, Math.floor(A.at[n] / A.cols) * h, w, h, x, y, s, s);
  return true;
};
new Image().src = 'art/star3d.webp';

// ---------------- each thing's icon ----------------
const ROLE = { tank: 'shield', mage: 'burst', heal: 'plus', off: 'fist', rogue: 'skull' };
const ST = { chill: 'mat_ice', burn: 'burst', doom: 'skull', hush: 'mute', armor: 'helmet', hidden: 'search', frenzy: 'fist2', aloft: 'up', ward: 'grave', shell: 'st_shield2', taunt: 'st_taunt', mark: 'target', guard: 'st_guard', less: 'shield', more: 'st_more', power: 'st_power', weak: 'st_weak', poison: 'poison', bleed: 'drop', regen: 'pot_heal1', stun: 'stars', thorns: 'st_thorns', counter: 'st_counter', smoke: 'cloud', bubble: 'bubble', soup: 'pot_heal2', shareHeal: 'pot_group', mirror: 'st_mirror', gang: 'st_gang', feeder: 'st_feeder', spark: 'bolt', magnet: 'st_magnet', drip: 'st_drip', charge: 'boltR', immune: 'st_shield2' };
const KIT = { curse: 'skull', bodyguard: 'st_guard', pylon: 'st_shield2', brawl: 'fist', pack: 'fist2', sniper: 'target', bleed: 'drop', poison: 'poison', weaken: 'st_weak', stun: 'stars', drain: 'bottle', smoke: 'cloud', charger: 'boltR', bubble: 'bubble', healer: 'plus', summon: 'horn', revive: 'grave', ironclad: 'helmet', golden: 'coin', boss: 'crown' };
const WORLD = ['w_village', 'w_harbor', 'w_desert', 'w_frost', 'w_grave', 'w_volcano', 'w_neon', 'w_space'];
const GEAR = { chop: 'g_chop', skewer: 'g_skewer', ladle: 'g_ladle', tray: 'g_tray', sign: 'g_sign', mitt: 'g_mitt' };
EI.role = r => i(ROLE[r] || 'fist');
EI.st = id => i(ST[id] || 'stars');
EI.kit = id => i(KIT[id] || 'fist');
EI.world = w => i(WORLD[w] || 'w_village');
EI.worldName = w => WORLD[w] || 'w_village';
EI.mat = id => i('mat_' + id);
EI.pot = id => i('pot_' + id);
EI.hat = h => i('hat_' + h);
EI.gear = b => i(GEAR[b] || 'g_set');
EI.item = it => (it.set ? i('set_' + it.set) : EI.gear(it.base));
EI.setIcon = id => i('set_' + id);
EI.setC = id => SET_C[id];
// a prize or a cost as an icon
EI.of = it => {
  if (it.kind === 'yen') return i('coin');
  if (it.kind === 'caps') return i('cap');
  if (it.kind === 'cheers') return i('cheers');
  if (it.kind === 'mat') return EI.mat(it.id);
  if (it.kind === 'pot') return EI.pot(it.id);
  if (it.kind === 'recipe') return i('scroll');
  if (it.kind === 'item') return EI.item(it.item);
  return i('stars');
};

// ---------------- a skill as icons and numbers ----------------
// [icon, big number, small turns, who]. The number is what it does; who is only shown when it isn't obvious
const H = (n, x) => ['sword', n + '%' + (x ? ' ×' + x : '')];
const ALL = n => ['burst', n + '%'];
const S = (id, turns, val, who) => [ST[id], val != null ? val : '', turns, who];
const HEAL = (n, who) => ['plus', n + '%', 0, who];
const FX = {
  'Shove': [H(115), S('taunt', 3, null, 'me')], 'Behind Me': [S('less', 2, '55%', 'ally')],
  'No Entry': [H(95), S('weak', 2, '25%', 'foe')], 'House Rules': [S('less', 3, '25%', 'team')],
  'Three Cuts': [H(50, 3)], 'Hold the Line': [S('less', 1, '50%', 'ally'), S('less', 1, '40%', 'team')],
  'Grudge Slap': [H(80), ['heart', '+2%']], 'Pick On Me': [S('mark', 2, '20%', 'ally')],
  'Ice Gavel': [H(135), HEAL(40, 'ally')], 'Cover': [S('guard', 3, '35%', 'ally')],
  'Acorn Rain': [ALL(55)], 'Prickly Aura': [S('thorns', 3, '75%', 'ally')],
  'Zap': [ALL(45), ['st_shield2', '65%', 0, 'foes']], 'Go Again': [['play', '', 0, 'ally']],
  'Sour Drizzle': [ALL(20), S('poison', 3, '35%', 'foes')], 'Clean Rain': [['pot_group', '20%', 0, 'team']],
  'Chain Quill': [H(100), ['bolt', '67·45·30']], 'Static Charge': [S('spark', 3, null, 'ally')],
  'Shock Wave': [ALL(45), S('more', 3, '25%', 'foe')], 'Spike Coat': [S('thorns', 3, '35%', 'team')],
  'Hot Soup': [H(100), HEAL(20, 'team')], 'Soup Line': [S('soup', 3, '15%', 'ally')],
  'Thorn Vine': [H(35), S('poison', 3, '100%', 'foe')], 'Herb Tea': [HEAL(22, 'ally'), HEAL(10, 'team')],
  'Snub': [H(125), S('magnet', 3, null, 'foe')], 'Smelling Salts': [HEAL(30, 'ally'), ['st_shield2', '', 0, 'ally']],
  'Two Slaps': [H(55, 2), S('feeder', 3, '5%', 'foe')], 'Shared Bowl': [S('shareHeal', 3, null, 'team')],
  'Loud Note': [H(160), ['stars', '15%']], 'Encore': [HEAL(10, 'team'), S('regen', 3, '5%', 'team')],
  'Sling': [H(100)], 'Rally': [S('power', 3, '25%', 'team')],
  'Triple Shot': [H(30, 3), S('weak', 2, '20%', 'foe')], 'Return Fire': [S('counter', 3, '40%', 'ally')],
  'Reckless': [H(85), ['bottle', '→130%']], 'Blood Pact': [['heart', '-15%', 0, 'me'], ['drop', '=', 0, 'foes']],
  'Scrub': [H(90), ['st_shield2', '', 0, 'foe']], 'Pep Talk': [['heart', '-10%', 0, 'me'], S('power', 3, '60%', 'ally')],
  'Last Stand': [H(125)], 'Gang Up': [S('gang', 2, '25%', 'foes')],
  'Yarn Trick': [H(100), ['st_shield2', '', 0, 'foe']], 'Clean Getaway': [['st_shield2', '', 0, 'team'], S('power', 3, '15%', 'team')],
  'Razor Yarn': [H(30), S('bleed', 3, '90%', 'foe')], 'Decoy': [S('mirror', 2, null, 'ally')],
  'Pounce': [H(85), ALL(35)], 'First Aid': [S('soup', 3, '15%', 'ally')],
  'Double Dart': [H(50, 2), S('drip', 3, '25%', 'foe')], 'Bodyguard': [S('guard', 2, null, 'ally'), S('counter', 2, '50%', 'me')],
  'Backstab': [H(90), S('power', 2, '30%', 'me')], 'Stink Bomb': [ALL(35), ['skull', '?', 2, 'foes']],
  // the big moves
  'Big Hug': [H(500)], 'Belly Slide': [H(220), ALL(110)], 'Hoot Storm': [H(60, 6)], 'Quill Burst': [ALL(120), S('weak', 2, '25%', 'foes')],
  'Truffle Feast': [HEAL(35, 'team'), ['st_shield2', '', 0, 'team']], 'Lily Rain': [HEAL(20, 'team'), S('regen', 3, '10%', 'team')],
  'Fire Sale': [ALL(150)], 'Quack Blast': [ALL(120), S('stun', 1, null, 'foe')], 'Nine Lives': [H(200), S('stun', 1, null, 'foe')], 'Carrot Barrage': [H(350), ALL(100)],
};
const chip = ([ic, big, turns, who]) => `<span class="ec">${who ? `<i class="ec-who">${i('t_' + who)}</i>` : ''}${i(ic)}${big ? `<b>${big}</b>` : ''}${turns ? `<u>${turns}</u>` : ''}</span>`;
EI.chips = skill => `<span class="ecs">${(FX[skill.n] || []).map(chip).join('')}</span>`;
EI.FX = FX;
// a raider's picture, from its real model, in the sheet
EI.foePic = type => (has('foe_' + type) ? i('foe_' + type) : '');
})();
