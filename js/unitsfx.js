/* Aura Farm Defense: each unit's own sounds (29 Oct, request: "get an agent to find sound effects for all of the
   units, describe them to it so it knows what to look for"). An attack sound as it fires (its signature's sound on a
   signature), and for some a hit sound where it lands. Since 29 Oct they are made for the game (synthesized in
   tools/sfx_design, one set per unit, every file at most 1 s) and live in sfx/td/; a match loads only its team's. Levels: each file's loudness is measured as it decodes (the RMS
   of its audible part) and brought to one level per role, so a whisper and a cannon sit together; attacks that repeat
   fast or hum (rapid fire, beams, orbits, fields) sit lower. */
(function () {
const AF = window.AF;
// unit: [attack, hit, signature], file names under sfx/ without ".ogg" ("" when it has none); a farm's "attack" is
// its payout. Written by tools/wire_td_sfx.py from tools/sfx_design/manifest.json
const U = AF.UNIT_SFX = {
  gary: ["td/gary_attack", "td/gary_hit", ""],
  dale: ["td/dale_attack", "", ""],
  brenda: ["td/brenda_attack", "", ""],
  kevin: ["td/kevin_attack", "td/kevin_hit", ""],
  todd: ["td/todd_attack", "", ""],
  linda: ["td/linda_attack", "", ""],
  pemberton: ["td/pemberton_attack", "td/pemberton_hit", ""],
  stan: ["td/stan_attack", "td/stan_hit", ""],
  pip: ["td/pip_attack", "td/pip_hit", ""],
  moss: ["td/moss_attack", "td/moss_hit", ""],
  brick: ["td/brick_attack", "", ""],
  papermonk: ["td/papermonk_attack", "td/papermonk_hit", ""],
  static: ["td/static_attack", "", ""],
  copper: ["td/copper_attack", "", ""],
  tide: ["td/tide_attack", "td/tide_hit", ""],
  gale: ["td/gale_attack", "td/gale_hit", ""],
  lantern: ["td/lantern_attack", "td/lantern_hit", ""],
  rook: ["td/rook_attack", "td/rook_hit", ""],
  vex: ["td/vex_attack", "td/vex_hit", ""],
  saffron: ["td/saffron_attack", "", ""],
  hex: ["td/hex_attack", "td/hex_hit", ""],
  cinder: ["td/cinder_attack", "td/cinder_hit", ""],
  frost: ["td/frost_attack", "", ""],
  nova: ["td/nova_attack", "td/nova_hit", ""],
  thorn: ["td/thorn_attack", "", ""],
  sable: ["td/sable_attack", "td/sable_hit", ""],
  lotus: ["td/lotus_attack", "", ""],
  kaida: ["td/kaida_attack", "td/kaida_hit", "td/kaida_sig"],
  orrin: ["td/orrin_attack", "", "td/orrin_sig"],
  lumen: ["td/lumen_attack", "td/lumen_hit", "td/lumen_sig"],
  rasp: ["td/rasp_attack", "", "td/rasp_sig"],
  yuzu: ["td/yuzu_attack", "", ""],
  corvid: ["td/corvid_attack", "", "td/corvid_sig"],
  mira: ["td/mira_attack", "td/mira_hit", "td/mira_sig"],
  choir: ["td/choir_attack", "td/choir_hit", "td/choir_sig"],
  azhar: ["td/azhar_attack", "", "td/azhar_sig"],
  conductor: ["td/conductor_attack", "", "td/conductor_sig"],
  velka: ["td/velka_attack", "td/velka_hit", "td/velka_sig"],
  ouroboros: ["td/ouroboros_attack", "", "td/ouroboros_sig"],
  kestrel: ["td/kestrel_attack", "td/kestrel_hit", "td/kestrel_sig"],
  vermilion: ["td/vermilion_attack", "", ""],
  unwritten: ["td/unwritten_attack", "td/unwritten_hit", "td/unwritten_sig"],
  nullsaint: ["td/nullsaint_attack", "", "td/nullsaint_sig"],
  aster: ["td/aster_attack", "", "td/aster_sig"],
  omen: ["td/omen_attack", "td/omen_hit", "td/omen_sig"],
  seraphine: ["td/seraphine_attack", "", "td/seraphine_sig"],
  vorrhal: ["td/vorrhal_attack", "", "td/vorrhal_sig"],
  chronarch: ["td/chronarch_attack", "", "td/chronarch_sig"],
  doug: ["td/doug_attack", "td/doug_hit", ""],
  bev: ["td/bev_attack", "", ""],
  phil: ["td/phil_attack", "", ""],
  rita: ["td/rita_attack", "", ""],
  earl: ["td/earl_attack", "", ""],
  tess: ["td/tess_attack", "td/tess_hit", ""],
  skye: ["td/skye_attack", "", ""],
  ollie: ["td/ollie_attack", "td/ollie_hit", ""],
  juniper: ["td/juniper_attack", "", ""],
  ferro: ["td/ferro_attack", "", ""],
  dot: ["td/dot_attack", "td/dot_hit", ""],
  ozzie: ["td/ozzie_attack", "", ""],
  silva: ["td/silva_attack", "td/silva_hit", ""],
  marlo: ["td/marlo_attack", "", ""],
  quill: ["td/quill_attack", "", ""],
  kindle: ["td/kindle_attack", "td/kindle_hit", ""],
  dash: ["td/dash_attack", "td/dash_hit", ""],
  nightjar: ["td/nightjar_attack", "", ""],
  seren: ["td/seren_attack", "td/seren_hit", "td/seren_sig"],
  grund: ["td/grund_attack", "td/grund_hit", "td/grund_sig"],
  vespera: ["td/vespera_attack", "td/vespera_hit", "td/vespera_sig"],
  torvik: ["td/torvik_attack", "", "td/torvik_sig"],
  liora: ["td/liora_attack", "", "td/liora_sig"],
  tessar: ["td/tessar_attack", "", "td/tessar_sig"],
  nocturne: ["td/nocturne_attack", "td/nocturne_hit", "td/nocturne_sig"],
  solenne: ["td/solenne_attack", "", "td/solenne_sig"],
  kairo: ["td/kairo_attack", "", "td/kairo_sig"],
  mirelle: ["td/mirelle_attack", "td/mirelle_hit", "td/mirelle_sig"],
  pyrrhos: ["td/pyrrhos_attack", "", "td/pyrrhos_sig"],
  sylvara: ["td/sylvara_attack", "", "td/sylvara_sig"],
  channel: ["td/channel_attack", "", "td/channel_sig"],
  crownless: ["td/crownless_attack", "", ""],
  mirrorsaint: ["td/mirrorsaint_attack", "td/mirrorsaint_hit", "td/mirrorsaint_sig"],
  reverb: ["td/reverb_attack", "", "td/reverb_sig"],
  foldedmoon: ["td/foldedmoon_attack", "td/foldedmoon_hit", "td/foldedmoon_sig"],
  solvane: ["td/solvane_attack", "", "td/solvane_sig"],
  marisol: ["td/marisol_attack", "", "td/marisol_sig"],
  hrimgard: ["td/hrimgard_attack", "td/hrimgard_hit", "td/hrimgard_sig"],
  anima: ["td/anima_attack", "", "td/anima_sig"],
  requiem: ["td/requiem_attack", "", "td/requiem_sig"],
  lumina: ["td/lumina_attack", "", "td/lumina_sig"],
  kaelith: ["td/kaelith_attack", "", "td/kaelith_sig"],
  orrisa: ["td/orrisa_attack", "", "td/orrisa_sig"],
  zephyrine: ["td/zephyrine_attack", "", "td/zephyrine_sig"],
  ordo: ["td/ordo_attack", "", "td/ordo_sig"],
  magmor: ["td/magmor_attack", "td/magmor_hit", "td/magmor_sig"],
  pelagra: ["td/pelagra_attack", "", "td/pelagra_sig"],
  gaiadon: ["td/gaiadon_attack", "td/gaiadon_hit", "td/gaiadon_sig"],
  umbrael: ["td/umbrael_attack", "td/umbrael_hit", "td/umbrael_sig"],
  vitae: ["td/vitae_attack", "", ""],
  aeon: ["td/aeon_attack", "", ""],
  omnis: ["td/omnis_attack", "", "td/omnis_sig"],
  aurore: ["td/aurore_attack", "", "td/aurore_sig"],
  gus: ["td/gus_attack", "td/gus_hit", ""],
  marge: ["td/marge_attack", "", ""],
  rowan: ["td/rowan_attack", "", ""],
  cleo: ["td/cleo_attack", "td/cleo_hit", ""],
  halcyon: ["td/halcyon_attack", "td/halcyon_hit", ""],
  wren: ["td/wren_attack", "td/wren_hit", ""],
  brann: ["td/brann_attack", "", "td/brann_sig"],
  isolde: ["td/isolde_attack", "", "td/isolde_sig"],
  thalor: ["td/thalor_attack", "td/thalor_hit", "td/thalor_sig"],
  nyx: ["td/nyx_attack", "td/nyx_hit", "td/nyx_sig"],
  hollow: ["td/hollow_attack", "", "td/hollow_sig"],
  cipher: ["td/cipher_attack", "td/cipher_hit", "td/cipher_sig"],
  astraea: ["td/astraea_attack", "", ""],
  veyra: ["td/veyra_attack", "", "td/veyra_sig"],
  caelum: ["td/caelum_attack", "td/caelum_hit", "td/caelum_sig"],
  mnemos: ["td/mnemos_attack", "", ""],
  ferrum: ["td/ferrum_attack", "", "td/ferrum_sig"],
  zephra: ["td/zephra_attack", "", "td/zephra_sig"],
  nihil: ["td/nihil_attack", "", "td/nihil_sig"],
  riftling: ["td/riftling_attack", "td/riftling_hit", "td/riftling_sig"],
  seam: ["td/seam_attack", "td/seam_hit", "td/seam_sig"],
  vael: ["td/vael_attack", "td/vael_hit", "td/vael_sig"],
  kharon: ["td/kharon_attack", "", "td/kharon_sig"],
  axiom: ["td/axiom_attack", "td/axiom_hit", "td/axiom_sig"],
};
// the CC BY sources some of these files are made from (the rest are CC0 or public domain)
AF.SOUND_CREDITS = null; // every unit sound is synthesized for the game (tools/sfx_design), nothing to credit
const ROLE = { attack: 0, hit: 1, sig: 2 }, TARGET = { attack: 0.02, hit: 0.016, sig: 0.0325 };
const MAX = 1, FADE = 0.25; // no unit sound runs past a second; longer ones fade out over the last quarter
const SOFT = { rapid: 0.75, beam: 0.6, orbit: 0.6, field: 0.7, hole: 0.7 };
const bufs = {}, rms = {}, loading = {}, last = {};
let voices = 0;
const ctx = () => (AF.sfx && AF.sfx.ctx ? AF.sfx.ctx() : null);
function load(f) {
  if (bufs[f] || loading[f]) return;
  const c = ctx(); if (!c) return;
  loading[f] = fetch(`sfx/${f}.ogg`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))).then(a => c.ac.decodeAudioData(a)).then(b => {
    let s = 0, n = 0;
    const end = Math.min(b.length, Math.round(b.sampleRate * MAX));
    for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < end; i++) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > 0.01) { s += v * v; n++; } } }
    rms[f] = n ? Math.sqrt(s / n) : 0.15; bufs[f] = b;
  }).catch(() => { /* this unit keeps the generic sound */ });
}
const file = (k, role) => { const e = U[k]; return e ? e[ROLE[role]] : ""; };
// the Defense sounds that aren't a unit's: three kills (a quick run climbs in pitch) and a farm's payout
const KILLS = ["td/td_kill_1", "td/td_kill_2", "td/td_kill_3"], PAYOUT = "td/farm_payout";
// play a loaded file at a role's level (rate: pitch); false when it can't (not loaded yet: it starts loading)
function out(f, role, rate = 1, soft = 1) {
  const c = f && ctx(); if (!c) return false;
  const b = bufs[f]; if (!b) { load(f); return false; }
  const src = c.ac.createBufferSource(), g = c.ac.createGain(), now = c.ac.currentTime;
  src.buffer = b; src.playbackRate.value = rate;
  g.gain.setValueAtTime(Math.min(0.65, (TARGET[role] * soft) / (rms[f] || 0.15)), now);
  src.connect(g); g.connect(c.master); src.start(now);
  voices++; src.onended = () => { voices--; };
  return true;
}
AF.usfx = {
  // fetch and decode a team's sounds (at the start of a match)
  prep(keys) { for (const k of keys) (U[k] || []).forEach(f => { if (f) load(f); }); KILLS.forEach(load); load(PAYOUT); },
  // a kill, the i-th in a quick run: the three take turns, a quarter tone higher each up to ten
  kill: i => voices < 12 && out(KILLS[(i || 0) % KILLS.length], "hit", Math.pow(2, Math.min(10, i || 0) / 24) * (1 + (Math.random() * 2 - 1) * 0.02), 0.8),
  // a farm paying out: its own sound, or the shared one
  payout: k => out(file(k, "attack"), "attack", 1, 0.9) || out(PAYOUT, "attack", 1, 0.9),
  has: (k, role) => !!file(k, role),
  ready: (k, role) => { const f = file(k, role); return !!(f && bufs[f]); },
  // play unit k's sound for a role (kind: its attack mechanic, for the quieter ones); false when it can't
  play(k, role, kind) {
    const f = file(k, role), c = f && ctx(); if (!c) return false;
    const b = bufs[f]; if (!b) { load(f); return false; }
    // two copies of one unit firing together sound once, and past ten at a time the rest are skipped
    const key = k + role, now = c.ac.currentTime;
    if (role !== "sig" && (now - (last[key] || -9) < 0.045 || voices >= 10)) return true;
    last[key] = now;
    const src = c.ac.createBufferSource(), g = c.ac.createGain();
    src.buffer = b; src.playbackRate.value = role === "sig" ? 1 : 1 + (Math.random() * 2 - 1) * 0.05;
    const v = Math.min(0.65, (TARGET[role] * (role === "attack" ? SOFT[kind] || 1 : 1)) / (rms[f] || 0.15));
    g.gain.setValueAtTime(v, now);
    src.connect(g); g.connect(c.master); src.start(now);
    if (b.duration / src.playbackRate.value > MAX) { g.gain.setValueAtTime(v, now + MAX - FADE); g.gain.linearRampToValueAtTime(0.0001, now + MAX); src.stop(now + MAX + 0.02); }
    voices++; src.onended = () => { voices--; };
    return true;
  },
};
})();
