/* The Guide (4 Nov, owner: "make it possible to skip the tutorial and if they choose to do, have it remain somewhere as a button for them to rpess if they ever need help or actually jut put it as a guide tab in settings").
   Everything the tutorial teaches, to read at any time, and a button to play the tutorial again. Opens from Settings and from the book in the header. */
(function () {
const AF = window.AF;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const line = (ic, title, text) => `<div class="gd-l">${AF.EI.i(ic)}<div><b>${esc(title)}</b><p>${esc(text)}</p></div></div>`;
const PAGES = [
  ['party', 'Lobby', () => [
    line('party', 'Crew', 'Your home. Your heroes stand on the plots here.'),
    line('map', 'Expedition', 'The island, and the game itself: fights, gear and landmarks.'),
    line('hat_top', 'Summon', 'Gates give costumes and projectiles. They only change how you look, never how strong you are.'),
    line('party', 'Heroes', 'Hire heroes with yen. Open one to set its class, gear, costume and name.'),
    line('stars', 'Trait Lab', 'Roll a lasting edge and an aura for one hero. From the fifth world on you will need good ones.'),
    line('scroll', 'Journal', 'Goals that pay yen.'),
  ]],
  ['sword', 'Fighting', () => [
    line('hand', 'Attack', 'Drag a hero onto a raider. Each hero acts once a turn, then every raider acts.'),
    line('t_ally', 'Support', 'Tap a hero, or drag it onto a friend, for its support move instead of an attack.'),
    line('bottle', 'The bottle', 'Hits fill it. When it is full, drag it onto a hero for that hero\'s big move. It does not use up their turn.'),
    line('target', 'Read their next move', 'The icon over a raider is what it will do next, and the number is how hard. The red number on a hero is everything coming at them. Plan around it: a taunt or a stun changes it, and killing a raider cancels it.'),
    line('boltR', 'Wind-ups', 'A raider winding up lands a huge hit next turn. Kill it, stun it, or have a Defender take it.'),
    line('hourglass', 'Overtime', 'Past a few turns on one wave, raiders get angrier every turn. Nobody wins by just hiding.'),
    line('flask', 'Food and drink', 'Cook it in the Soup Pot and use it from the flask in a fight. It does not use up a turn.'),
    line('stars', 'Stars', 'Win fast and healthy for up to three. Each star is another prize on the wheel.'),
    line('robot', 'Auto', `Once you have beaten a stage by hand, the game can play it for you, for ${AF.EP.ENERGY_COST} energy a fight. It plays worse than you do. Energy comes back with time and at landmarks.`),
  ]],
  ['shield', 'Hero types', () => Object.keys(AF.EP.ROLE).map(r => { const R = AF.EP.ROLE[r]; return `<div class="gd-l">${AF.EI.role(r)}<div><b>${esc(R.n)}</b><p>${esc(R.d)}</p></div></div>`; }).concat(line('hat_top', 'Classes', 'Hat Stalls on the road sell new classes. A class changes a hero\'s moves, so it can change their whole job.'))],
  ['search', 'Knacks and locks', () => [
    `<p class="gd-note">Every hero has a knack nobody else can do, whatever class they wear. Bosses and some rooms have locks, and a stage's board shows them with the heroes who open them. No team opens everything: read the board, and bring a different three.</p>`,
  ].concat(Object.keys(AF.EP.SIG).map(a => { const S = AF.EP.SIG[a]; return `<div class="gd-l">${AF.EI.i(S.ic)}<div><b>${esc(AF.CREW[a].name)}: ${esc(S.n)}</b><p>${esc(S.d)}</p></div></div>`; })).concat(`<p class="gd-note">Bosses can't be out-muscled. Each hit only takes a slice off one, a Finisher takes most of a hero's health however much gear they wear, and it stops at each stage until its next turn.</p>`).concat(Object.keys(AF.EP.LOCKS).map(id => { const L = AF.EP.LOCKS[id]; return `<div class="gd-l">${AF.EI.i(L.ic)}<div><b>${esc(L.n)}</b><p>${esc(L.d)}</p></div></div>`; }))],
  ['w_frost', 'World rules', () => [
    `<p class="gd-note">Every world bends the fight its own way, shown on the stage's board with the hero types that answer it. The team that won the last world may not win this one.</p>`,
  ].concat(Object.keys(AF.EP.RULES).map(id => { const R = AF.EP.RULES[id]; return `<div class="gd-l">${AF.EI.i(R.ic)}<div><b>${esc(R.n)}</b><p>${esc(R.d)}</p><span class="gd-good" title="Good here">${R.good.map(r => AF.EI.role(r)).join('')}</span></div></div>`; })).concat(line('w_space', 'Starfall Expanse', 'The last world asks you everything: a different rule every wave.'))],
  ['anvil', 'Gear', () => [
    `<p class="gd-note">Levels alone won't carry you. Raiders grow faster than a team level does, and a team's level stops at the next castle until you beat it. From the fifth world gear alone won't either: you need good traits too.</p>`,
    line('scroll', 'Recipes', 'Buy new ones at Recipe Huts, or find them in chests.'),
    line('anvil', 'Forge', 'Open the Workshop on the map. Spend materials and yen to make a piece. The die decides how good it is.'),
    line('sword', 'Equip', 'Open a hero and press a gear slot. A weapon raises attack, an off-hand raises health. Each hero wears one of each.'),
    line('mat_rice', 'Materials', 'Each world grows its own. Wins and the wheel pay them. Replay old stops if you run short.'),
    line('arrowR', 'The arrow', 'On a stage\'s board. Green is easy, yellow is fair, red will probably beat you. Red usually means it is time to forge.'),
  ]],
  ['map', 'The island', () => [
    line('hand', 'Look around', 'Drag to move, wheel or pinch to zoom. Sparkles off the road are hidden finds.'),
    line('t_foes', 'Trails', 'Green stones lead off the road to a landmark, with fights and a chest on the way.'),
    line('gate', 'Buddy Gates', 'Purple stones. Pay caps or knock and wait, for harder fights and a better chest.'),
    line('pin', 'Landmarks', 'Each has a postcard to collect, which pays caps and cheers, and a picnic spot that refills energy every 8 hours. Collect a world\'s three for more.'),
    line('sun', 'Daily Dive', 'One big-paying fight a day.'),
    line('luckyb', 'Lucky Bottle', 'Not the bottle from fights. This turns Gold Caps into gear you can\'t forge. A small pull is usually materials or soup, with a small chance of a set piece. A big pull is always strong gear, and most often a set piece. Every cap fills the bar, and a full bar makes your next pull a set piece.'),
    line('g_set', 'Set pieces', 'A set is a weapon and an off-hand. Wear both on one hero for its bonus.'),
    line('cap', 'Gold Caps', 'From levelling up, beating castles, opening chests and collecting postcards.'),
  ]],
];
AF.openGuide = (at = 0) => {
  const box = document.createElement('div'); box.className = 'gd';
  let page = at, close = null;
  const draw = () => {
    box.innerHTML = `<div class="gd-tabs">${PAGES.map(([ic, n], i) => `<button class="gd-t${i === page ? ' on' : ''}" data-p="${i}" title="${esc(n)}">${AF.EI.i(ic)}<span>${esc(n)}</span></button>`).join('')}</div>
      <div class="gd-page">${PAGES[page][2]().join('')}</div>
      <button class="btn ghost sm" id="gdReplay">${AF.EI.i('retry')}<span>Play the tutorial again</span></button>`;
    box.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => { page = +b.dataset.p; AF.sfx && AF.sfx('click'); draw(); }; });
    box.querySelector('#gdReplay').onclick = () => { if (close) close(); AF.tutorial.replay(); AF.ui.go('area', true); };
  };
  draw();
  close = AF.ui.modal(box, { title: 'Guide', cls: 'gd-win' });
  const h = box.closest('.modal')?.querySelector('.modal-head h2');
  if (h) h.insertAdjacentHTML('afterbegin', AF.EI.i('book'));
  return close;
};
})();
