/* The first game. (3 Nov, owner: "do like a tutorial for the first ever game introduce them to all the mechanics ... slowly introduce this stuff to them and tell
   them everything when it happens the first time"; rewritten the same day for Expedition)
   Two things, kept in S.tut.seen so each happens once:
   - steps: one thing to do at a time, in order, shown beside whatever to press. They never pause anything and can be put off.
   - tips: a card the moment something first happens. They pause a fight until read, and wait for any window or reveal to finish.
   It only looks at the game from here (a few times a second, in AF.tutorial.pump), so nothing else has to know it exists. ?notutorial in the address turns it off for tools/.
   Loaded before ui.js; everything it uses is read when it runs. */
(function () {
const AF = window.AF, G = AF.G;
const $ = (s, r = document) => r.querySelector(s);
const on = !/notutorial/.test(location.search);
const EB = () => AF.EB, EP = () => AF.EP, UI = () => AF.UI, S = () => G.S;
const tut = () => S().tut || (S().tut = G.firstRun ? { seen: {} } : { seen: {}, off: true });
const seen = id => !!tut().seen[id];
const mark = id => { tut().seen[id] = 1; G.save(); };
const tab = t => `.tab[data-tab="${t}"]`;
const yen = () => S().yen;
const fight = () => { const E = EB(); return E && E.on && E.B && E.B.state === 'fight' ? E.B : null; };
// counted from when this run of the tutorial began, so playing it again from the Guide really walks through it again
const wins = () => (EP() ? EP().S().stats.wins - (tut().wins0 || 0) : 0);
const gearN = () => (EP() ? EP().S().gear.length - (tut().gear0 || 0) : 0);
const wornN = () => (EP() ? Object.values(EP().S().heroes).reduce((a, h) => a + (h.w ? 1 : 0) + (h.o ? 1 : 0), 0) - (tut().worn0 || 0) : 0);
const tierOf = t => (typeof t === 'function' ? t() : t);

// ---------------- what happens the first time ----------------
const TIPS = {
  turns: { ic: 'hourglass', title: 'Taking turns', text: 'Your heroes act, then the raiders do.', target: '#epTurn' },
  bottle: { ic: 'bottle', title: 'The bottle', text: 'Hits fill it. Full, it fires a big move.', target: '#epBottle' },
  bottleFull: { ic: 'bottle', title: 'Full!', text: 'Drag the bottle onto a hero.', target: '#epBottle' },
  wave: { ic: 'skull', title: 'Next wave', text: 'No healing between waves.', target: '#epWave' },
  support: { ic: 't_ally', title: 'Support', text: 'Drag onto a friend, or tap a hero.' },
  flyer: { ic: 'hand', title: 'Hold to read', text: 'Hold anyone to see what they do.' },
  status: { ic: 'stars', title: 'Effects', text: 'Icons show effects. The number is turns left.' },
  charge: { ic: 'boltR', title: 'Winding up', text: 'A huge hit next turn. Kill or stun it.' },
  bubble: { ic: 'bubble', title: 'Bubble', text: 'Hits bounce back. Hit someone else.' },
  smoke: { ic: 'cloud', title: 'Smoke', text: 'Attacks on it often miss.' },
  healer: { ic: 'plus', title: 'Medics', text: 'Take these out first.' },
  drain: { ic: 'bottle', title: 'Bottle thief', text: 'It drains your bottle. Pour it fast.' },
  boss: { ic: 'crown', title: 'Boss', text: 'Every boss is a puzzle. Hold it to read its tricks. Its stage board says who answers them.' },
  locks: { ic: 'lock', title: 'Locks', text: 'Some stages have locks, and these heroes open them. Green means you brought one.', target: '.ep-locks' },
  lock_armor: { ic: 'helmet', title: 'Armour', text: 'Hits do a quarter. Only Pip cracks it. Poison and burns go through.' },
  lock_hidden: { ic: 'search', title: 'Hidden', text: 'Hits mostly miss it. Owl always finds it.' },
  lock_frenzy: { ic: 'fist2', title: 'Frenzy', text: 'It acts twice. Make it hit Pebble and it freezes itself.' },
  lock_doom: { ic: 'skull', title: 'Doom', text: 'That hero falls when the count runs out. Pig can lift it, or beat whoever cast it.' },
  lock_aloft: { ic: 'up', title: 'Aloft', text: 'Close-up heroes can hardly reach it. Dot knocks it down.' },
  lock_ward: { ic: 'grave', title: 'Bone Ward', text: 'It takes a fifth from hits while its minions stand. Clear them first.' },
  lock_guard: { ic: 'st_guard', title: 'Bodyguard', text: 'It takes the hits for a friend. Mochi goes round it.' },
  traits: { ic: 'stars', title: 'Traits', text: 'From here raiders outgrow gear alone. Roll a good trait on your hitters, and on whoever holds the line.' },
  golden: { ic: 'coin', title: 'Golden Raider', text: 'Every hit pays. It leaves in 3 turns.' },
  lost: { ic: 'retry', title: 'Beaten', text: 'Replay old stops, or forge some gear.' },
  stars: { ic: 'stars', title: 'Stars', text: 'Fast and healthy earns more. Each star is a prize.', target: '.ep-bigstars' },
  wheel: { ic: 'wheel', title: 'Cap Wheel', text: 'Each pointer is a prize. Cheers spin it again.', target: '.ep-wheel' },
  map: { ic: 'map', title: 'The island', text: 'Drag and zoom to explore. Sparkles are hidden finds.', target: '#emZo' },
  arrow: { ic: 'target', title: 'The arrow', text: 'Green is easy. Red will likely beat you.', target: '.ep-b-top .ep-arrow' },
  joined: { ic: 'party', title: 'New hero', text: 'Three fight at once. Tap to swap.' },
  hat: { ic: 'tent', title: 'Hat Stall', text: 'New classes mean new moves.' },
  pot: { ic: 'pot', title: 'Soup Pot', text: 'Cook food to use in fights.', target: '#emPot' },
  gate: { ic: 'gate', title: 'Buddy Gate', text: 'A side road: harder fights and a chest.' },
  daily: { ic: 'sun', title: 'Daily Dive', text: 'One big-paying fight a day.', target: '#emDaily' },
  intent: { ic: 'target', title: 'Their next move', text: 'The icon over a raider is what it does next, and how hard. The red number on a hero is what is coming at them.', target: '.ep-tag.e .ep-int' },
  rule_tide: { ic: 'drop', title: 'High Tide', text: 'This world has a rule. Here, raiders heal every turn unless poisoned or bleeding. Finish them one at a time.', target: '#epRule' },
  rule_sun: { ic: 'sun', title: 'Scorching Sun', text: 'Your heroes lose health every turn here. Bring a Healer, or win fast.', target: '#epRule' },
  rule_shell: { ic: 'st_shield2', title: 'Ice Shell', text: 'Shells soak up most of a hit, and each hit cracks them. Hit them all at once, or poison them.', target: '#epRule' },
  rule_restless: { ic: 'grave', title: 'Restless Dead', text: 'A raider who falls gets back up, unless the whole wave is down. Bring them all low, then finish them together.', target: '#epRule' },
  rule_furnace: { ic: 'burst', title: 'The Furnace', text: 'Raiders hit harder every turn of a wave. Win fast, or weaken them.', target: '#epRule' },
  rule_grid: { ic: 'boltR', title: 'Power Grid', text: 'The Pylon shields the others, and only loses 1 a hit. Count your hits and take it down first.', target: '#epRule' },
  overtime: { ic: 'hourglass', title: 'Overtime', text: 'This wave is dragging on, so raiders are getting angrier every turn. Finish it.', target: '#epRule' },
  finish: { ic: 'book', title: "That's it", text: 'The Guide is in Settings, and on the book up top, whenever you need it.', target: '#bHelp' },
};

// ---------------- one thing to do at a time ----------------
const wornAny = () => S().units.some(u => { const d = AF.UNIT[u.k]; return d.costume || d.theme; });
// (4 Nov, owner: "just have a tutorial to run thru everything when a player first starts like evrythnig in lobby, and then in a run, how to play n shi how to use the ult and everything, how to forge equipment everything")
// first the lobby, one place at a time, with a Next button. Then a first fight: attack, support, the bottle. Then forging a piece and putting it on
const mapOrMach = () => !!$('#epM1') || (UI().tab === 'defense' && !EB().on && !$('.ep-over') && !$('.ep-wheel'));
const machT = sel => () => ($('#epM1') ? sel : '#emMach');
const machX = t => () => ($('#epM1') ? tierOf(t) : 'Open the Lucky Bottle again to keep going.');
const TOUR = (id, tb, target, ic, title, text) => ({ id, ic, next: true, done: () => false, on: () => { if (tb && UI().tab !== tb) AF.ui.go(tb, true); }, show: () => !EB().on, target, title, text });
const hasItem = () => Object.keys(S().skins || {}).length > 0;
// what you most recently got from a gate
const newest = () => { const k = Object.keys(S().skins || {}).filter(q => AF.UNIT[q] && AF.UNIT[q].item); return k.length ? AF.UNIT[k[k.length - 1]] : null; };
const STEPS = [
  TOUR('t_hello', 'area', null, 'party', 'Welcome to Picnic Patrol', 'Raiders took the picnic. A quick look around, then your first fight.'),
  TOUR('t_crew', 'area', tab('area'), 'party', 'Crew', 'Your home. Your heroes stand on the plots here.'),
  TOUR('t_heroes', 'units', tab('units'), 'party', 'Heroes', 'Hire heroes and dress them. Each one has a type: Defender, Attacker, Healer, Caster or Trickster.'),
  TOUR('t_summon', 'summon', tab('summon'), 'hat_top', 'Summon', 'Gates give costumes and projectiles. They only change your looks.'),
  TOUR('t_traits', 'traits', tab('traits'), 'stars', 'Trait Lab', 'Roll a lasting edge and an aura for one hero. Late on, you will need good ones.'),
  TOUR('t_journal', null, '#bJr', 'scroll', 'Journal', 'Goals that pay yen.'),
  TOUR('t_guide', null, '#bHelp', 'book', 'Guide', 'Forgot something? Everything is in here. It is in Settings too.'),
  { id: 'goExp', ic: 'map', done: () => UI().tab === 'defense' || wins() > 0, target: tab('defense'), title: 'Expedition', text: 'Raiders took the picnic. Go get it back.' },
  { id: 'pickStage', ic: 'pin', done: () => $('#epGo') || EB().on || wins() > 0, show: () => UI().tab === 'defense' && !UI().modalClose, target: '#emGoal', title: 'First stop', text: 'Press here, or tap the glowing stop.' },
  { id: 'start', ic: 'play', done: () => EB().on || wins() > 0, show: () => !!$('#epGo'), target: '#epGo', title: 'Go', text: 'Who you fight, and what you win.' },
  { id: 'firstAttack', ic: 'hand', done: () => (fight() ? fight().stats.dmg > 0 : wins() > 0), show: () => fight() && !EB().busy(), target: '.ep-tag.h', up: true, title: 'Attack', text: 'Drag Pip onto the raider.' },
  { id: 'support', ic: 't_ally', done: () => (fight() ? (fight().stats.sup || 0) > 0 : wins() > 0), show: () => fight() && !EB().busy() && fight().heroes.some(h => EP().canAct(fight(), h)), target: '.ep-tag.h', up: true, title: 'Support', text: 'Tap Pip for a support move. Later, drag it onto a friend.' },
  { id: 'ult', ic: 'bottle', done: () => (fight() ? (fight().stats.rages || 0) > 0 : wins() > 0), show: () => fight() && !EB().busy(), on: () => { const B = fight(); if (B && B.rage < 100) { B.rage = 100; EB().syncBottle(); } }, target: '#epBottle', title: 'Bottoms up', text: 'Hits fill the bottle. Full, drag it onto a hero for their big move. It costs no turn.' },
  { id: 'goForge', ic: 'anvil', done: () => gearN() > 0 || !!$('.ep-dicepick') || !forgeable(), show: () => UI().tab === 'defense' && !EB().on && wins() > 0 && !UI().modalClose && !$('.ep-over') && !$('.ep-wheel'), on: forgeGift, target: '#emForge', title: 'Gear', text: 'Raiders outgrow levels alone, so you need equipment. Open the Workshop.' },
  { id: 'doForge', ic: 'hammer', done: () => gearN() > 0 || !forgeable(), show: () => !!$('.ep-dicepick'), target: '.ep-tiles [data-c]:not([disabled])', title: 'Forge', text: 'Spend materials and yen to make a piece. Wins and the wheel pay materials.' },
  { id: 'equip', ic: 'sword', done: () => wornN() > 0 || !EP().S().gear.length, show: () => !EB().on && wins() > 0 && !$('.ep-over') && !$('.ep-wheel'), target: () => ($('[data-it]') ? '[data-it]' : $('.ep-h-gear') ? '.ep-h-gear .ep-gear.none, .ep-h-gear .ep-gear' : $('.ep-dicepick') ? '.modal .m-x' : $('.ep-slots .ep-fig') ? '.ep-slots .ep-fig' : '#emParty'), title: 'Put it on', text: () => ($('[data-it]') ? 'Pick what you just made.' : $('.ep-h-gear') ? 'Press a gear slot.' : $('.ep-dicepick') ? 'Close the Workshop.' : $('.ep-slots .ep-fig') ? 'Open a hero.' : 'Open your party.') },
  // (4 Nov, owner: "i need the tutorial to explain what lucky bottles are better")
  { id: 'goMach', ic: 'luckyb', done: () => !!$('#epM1'), show: () => UI().tab === 'defense' && !EB().on && wins() > 0 && !UI().modalClose && !$('.ep-over') && !$('.ep-wheel'), target: '#emMach', title: 'Lucky Bottle', text: 'Not the bottle from fights. This one turns Gold Caps into gear you can\'t forge. Have a look.' },
  { id: 'mCaps', ic: 'cap', next: true, done: () => false, show: mapOrMach, target: machT('.em-coins [title="Gold Caps"]'), title: 'Gold Caps', text: machX('You earn these by levelling up, beating castles, opening chests and collecting postcards.') },
  { id: 'mSmall', ic: 'luckyb', next: true, done: () => false, show: mapOrMach, target: machT('#epM1'), title: 'Small pull', text: machX(() => `${EP().MACHINE.small} caps. Usually materials or soup, with a small chance of a set piece.`) },
  { id: 'mBig', ic: 'luckyb', next: true, done: () => false, show: mapOrMach, target: machT('#epM2'), title: 'Big pull', text: machX(() => `${EP().MACHINE.big} caps. Strong gear every time, and most often a set piece.`) },
  { id: 'mBar', ic: 'stars', next: true, done: () => false, show: mapOrMach, target: machT('.ep-bar-big'), title: 'The bar', text: machX(() => `Every cap you spend fills it. At ${EP().MACHINE.bar}, your next pull is always a set piece.`) },
  { id: 'mSets', ic: 'g_set', next: true, done: () => false, show: mapOrMach, target: machT('.ep-sets'), title: 'Set pieces', text: machX('A set is a weapon and an off-hand. Wear both on one hero for its bonus. Hover one to read it.') },
  { id: 'goHeroes', ic: 'party', done: () => UI().tab === 'units', show: () => wins() >= 3 && !EB().on, target: tab('units'), title: 'Heroes', text: 'Hire more here.' },
  { id: 'buyHero', ic: 'coin', done: () => S().units.length > 3 || !AF.TOWERS.some(a => !G.towerOf(a) && yen() >= AF.CREW[a].unlock), show: () => UI().tab === 'units', target: '#uGrid .tw-buy.gold', title: 'Hire', text: 'Press a gold price.' },
  { id: 'goSummon', ic: 'hat_top', done: () => UI().tab === 'summon', show: () => wins() >= 3, target: tab('summon'), title: 'Gates', text: 'Costumes and projectiles.' },
  { id: 'pull', ic: 'coin', done: () => hasItem() || yen() < AF.GATES[0].cost, show: () => UI().tab === 'summon', target: '#bS1', title: 'Pull', text: 'See what you get.' },
  // (4 Nov, owner: "wear it is broken ijn the tutorial make sure it accoutns for getting both a projectile or getting a costume and it shold be highlihgting the cosmetic not the hero")
  { id: 'wear', ic: () => (newest() && newest().item === 'theme' ? 'burst' : 'hat_top'), done: () => wornAny() || !hasItem(), show: () => !$('.reveal'), target: () => {
      const d = newest(), want = d && d.item === 'theme' ? '#umFx' : '#umCos';
      if ($('.pick-grid')) return d && $(`.pick-grid [data-item="${d.key}"]`) ? `.pick-grid [data-item="${d.key}"]` : '.modal .m-x';
      if ($('.um-slot')) return want;
      return UI().tab === 'units' ? '#uGrid .tw:not(.tw-off) .ucard' : tab('units');
    }, title: 'Wear it', text: () => {
      const d = newest(), name = d ? d.name : 'it', slot = d && d.item === 'theme' ? 'projectile' : 'costume';
      if ($('.pick-grid')) return d && $(`.pick-grid [data-item="${d.key}"]`) ? `Pick your ${name}.` : `That is the wrong slot. Close this and press the ${slot} one.`;
      if ($('.um-slot')) return `${name} is a ${slot}. Press the ${slot} slot.`;
      return UI().tab === 'units' ? 'Open a hero.' : 'Go to Heroes.';
    } },
];

// the first piece is on the house: enough for one Bamboo weapon, whatever the wheel paid
const FIRST = 'g:chop:1';
// a replay that can no longer pay for one just moves on
const forgeable = () => { const P = EP(); return !P.S().tutGift || P.canCraft(FIRST); };
function forgeGift() { const P = EP(), e = P.S(); if (e.tutGift) return; e.tutGift = 1; const { mats, yen: y } = P.recipeCost(FIRST); for (const m in mats) e.mats[m] = Math.max(e.mats[m] || 0, mats[m]); S().yen = Math.max(S().yen, y); G.save(); AF.ui.refresh && AF.ui.refresh(); }

// ---------------- the card ----------------
let card = null, spot = null, tipOpen = null, showing = null;
const skipAll = () => { tut().off = true; closeTip(); hideStep(); G.save(); };
function build() {
  if (card) return;
  spot = document.createElement('div'); spot.className = 'coach-spot'; spot.hidden = true;
  card = document.createElement('div'); card.className = 'coach'; card.hidden = true;
  document.body.append(spot, card);
}
function setCard(title, text, buttons, why, ic) {
  card.className = 'coach' + (why ? ' ' + why : '');
  card.innerHTML = `<div class="coach-top">${ic && AF.EI ? AF.EI.i(ic) : ''}<div><h3></h3><p></p></div></div><div class="coach-acts">${buttons}<button class="coach-skip" data-a="skip">Skip</button></div>`;
  $('h3', card).textContent = title;
  $('p', card).textContent = text;
  $('[data-a="skip"]', card).onclick = skipAll;
  card.hidden = false;
}
// up: the card waits at the top of the screen, for a step you do on the figures themselves (it must not cover them)
function aim(sel, up) {
  const el = sel && $(sel), r = el && el.getBoundingClientRect();
  if (!r || !r.width || getComputedStyle(el).visibility === 'hidden') { spot.hidden = true; card.style.left = '50%'; card.style.top = '132px'; card.style.transform = 'translateX(-50%)'; return; }
  spot.hidden = false;
  spot.style.left = r.left - 6 + 'px'; spot.style.top = r.top - 6 + 'px'; spot.style.width = r.width + 12 + 'px'; spot.style.height = r.height + 12 + 'px';
  // beside it, whichever way there is room, and never off screen
  if (up) { card.style.left = '50%'; card.style.top = '84px'; card.style.transform = 'translateX(-50%)'; return; }
  const cw = card.offsetWidth, ch = card.offsetHeight, below = r.bottom + 16 + ch < innerHeight - 8;
  const x = Math.max(10, Math.min(innerWidth - cw - 10, r.left + r.width / 2 - cw / 2)), y = below ? r.bottom + 16 : Math.max(10, r.top - ch - 16);
  card.style.left = x + 'px'; card.style.top = y + 'px'; card.style.transform = 'none';
}
function hideStep() { showing = null; if (!tipOpen && card) { card.hidden = true; spot.hidden = true; } }

// a tip takes over like any window: nothing behind it can be pressed, and Esc closes it
let backdrop = null, wasPaused = false;
function openTip(id) {
  const t = TIPS[id];
  tipOpen = id; showing = null;
  backdrop = document.createElement('div'); backdrop.className = 'coach-back';
  document.body.appendChild(backdrop);
  if (EB().on) { wasPaused = EB().paused; EB().paused = true; }
  setCard(t.title, t.text, '<button class="btn gold sm" data-a="ok">OK</button>', 'tip', t.ic);
  $('[data-a="ok"]', card).onclick = closeTip;
  UI().modalClose = closeTip;
  aim(tierOf(t.target));
}
function closeTip() {
  if (!tipOpen) return;
  mark(tipOpen);
  tipOpen = null;
  if (backdrop) { backdrop.remove(); backdrop = null; }
  if (EB().on) EB().paused = wasPaused;
  if (UI().modalClose === closeTip) UI().modalClose = null;
  card.hidden = true; spot.hidden = true;
}
addEventListener('keydown', e => { if (tipOpen && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); closeTip(); } }, true);

// ---------------- watching ----------------
const queue = [];
const want = id => { if (!seen(id) && !queue.includes(id) && tipOpen !== id) queue.push(id); };
function watch() {
  const B = fight(), P = EP();
  if (B) {
    const foes = B.foes.filter(u => u.hp > 0), H = P.has;
    want('intent');
    if (B.turn >= 2) want('turns');
    if (B.rage >= 40 && seen('ult')) want('bottle');
    if (B.rage >= 100 && seen('ult')) want('bottleFull');
    for (const r of B.rules || []) want('rule_' + r.id);
    if (B.heat > 0 && !P.ruleK(B, 'furnace')) want('overtime');
    if (B.wave >= 1) want('wave');
    if (B.heroes.length >= 2) want('support');
    if (foes.some(e => e.air)) want('flyer');
    if (foes.concat(B.heroes).some(u => u.st.some(s => s.id !== 'charge'))) want('status');
    if (foes.some(e => H(e, 'charge'))) want('charge');
    if (foes.some(e => H(e, 'bubble'))) want('bubble');
    if (foes.some(e => H(e, 'smoke'))) want('smoke');
    if (foes.some(e => e.kit === 'healer' || e.kit === 'revive')) want('healer');
    if (foes.some(e => e.kit === 'drain')) want('drain');
    if (foes.some(e => e.boss)) want('boss');
    if (foes.some(e => H(e, 'armor'))) want('lock_armor');
    if (foes.some(e => H(e, 'hidden'))) want('lock_hidden');
    if (foes.some(e => H(e, 'frenzy'))) want('lock_frenzy');
    if (B.heroes.some(h => H(h, 'doom'))) want('lock_doom');
    if (foes.some(e => H(e, 'aloft'))) want('lock_aloft');
    if (foes.some(e => H(e, 'ward'))) want('lock_ward');
    if (foes.some(e => e.kit === 'bodyguard')) want('lock_guard');
    if (foes.some(e => e.kit === 'golden')) want('golden');
    watch.b = B;
    return;
  }
  if ($('.ep-bigstars')) { want('stars'); return; }
  if ($('.ep-wheel')) { want('wheel'); return; }
  if ($('.ep-over-in.lost')) { want('lost'); return; }
  if (EB() && EB().on) return;
  if ($('.ep-b-top .ep-arrow') && wins() > 0) want('arrow');
  if ($('.ep-locks')) want('locks');
  const t = UI().tab;
  if (t === 'defense' && wins() > 0) {
    want('map');
    const e = P.S();
    if (S().units.length >= 2) want('joined');
    if (P.reachNode().main > 4) want('hat');
    if (seen('equip') && P.canCraft('p:heal1')) want('pot');
    if (e.reach > P.BY['hut-0'].main) want('gate');
    if (e.reach >= P.BY['4-2-0'].main) want('traits');
    if (wins() >= 5) want('daily');
  }
  if (STEPS.every(s => seen(s.id))) want('finish');
}
const busy = () => $('.reveal') || $('.storm') || UI().busy || UI().sumBusy || (fight() && EB().busy());
function pump() {
  if (!on || !G.S || !AF.UI || !card || !EP() || !EB()) return;
  const T = tut();
  if (T.off || !T.begun) return;
  watch();
  if (tipOpen) { aim(tierOf(TIPS[tipOpen].target)); return; }
  // a tip waits for anything already on screen to finish
  if (queue.length && !busy() && !UI().modalClose) { const id = queue.shift(); hideStep(); if (!seen(id)) { openTip(id); } return; }
  const step = STEPS.find(s => !seen(s.id));
  if (!step) { hideStep(); return; }
  if (step.done()) { mark(step.id); return; }
  if (busy() || $('.ep-over') || (step.show && !step.show())) { hideStep(); return; }
  const text = tierOf(step.text);
  if (showing !== step.id || card.dataset.text !== text) {
    if (showing !== step.id && step.on) step.on();
    showing = step.id; card.dataset.text = text;
    if (step.next) { setCard(step.title, text, `<button class="btn gold sm" data-a="next">Next</button>`, 'step', tierOf(step.ic)); $('[data-a="next"]', card).onclick = () => { AF.sfx && AF.sfx('click'); mark(step.id); hideStep(); pump(); }; }
    else { setCard(step.title, text, `<button class="coach-later" data-a="later">Later</button>`, 'step', tierOf(step.ic)); $('[data-a="later"]', card).onclick = () => { mark(step.id); hideStep(); }; }
  }
  aim(tierOf(step.target), step.up);
}

AF.tutorial = {
  on,
  // the new player's welcome: true if it should show the choice to skip
  begin() { if (!on) return; build(); tut().begun = true; G.save(); },
  skip() { build(); tut().begun = true; skipAll(); },
  // (a save carrying on from an earlier visit)
  resume() { if (!on) return; const T = tut(); if (T.begun && !T.off) build(); },
  // for the admin panel
  replay() { const e = EP().S(); S().tut = { seen: {}, begun: true, wins0: e.stats.wins, gear0: e.gear.length, worn0: Object.values(e.heroes).reduce((a, h) => a + (h.w ? 1 : 0) + (h.o ? 1 : 0), 0) }; queue.length = 0; build(); G.save(); },
  // the very first fight lasts long enough to teach it
  longFirst: node => on && node.id === '0-0-0' && !!S().tut && !!S().tut.begun && !S().tut.off && !seen('ult'),
  stepIds: () => STEPS.map(q => q.id),
  state: () => ({ tip: tipOpen, step: showing, queue: queue.slice(), seen: Object.keys(tut().seen), off: !!tut().off, begun: !!tut().begun }),
  pump,
};
setInterval(pump, 150);
})();
