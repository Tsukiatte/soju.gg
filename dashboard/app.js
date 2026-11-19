/* The Lab Report: renders data.json (written every 2 hours by studio/dashboard.py) into the page
   and runs the motion: sliding layers, glints, the chat in the phone, parallax, reveals. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('no-motion');
  const hero = $('#hero');
  let DATA = null, META = null, chatToken = 0;

  // ---------- helpers ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, d = 0) => (n == null ? '–' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const pct = (n) => (n == null ? '–' : Math.round(n) + '%');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(/\s/g, ' ');
  const when = (iso) => {
    const d = new Date(iso), now = new Date();
    const same = d.toDateString() === now.toDateString();
    const yest = new Date(now - 864e5).toDateString() === d.toDateString();
    return (same ? 'today ' : yest ? 'yesterday ' : d.toLocaleDateString([], { weekday: 'short' }) + ' ') + time(iso);
  };
  const countdown = (iso) => {
    const ms = new Date(iso) - Date.now();
    if (ms < -25 * 60e3) return 'should be up';
    if (ms <= 0) return 'going up now';
    const m = Math.round(ms / 60e3), h = Math.floor(m / 60);
    return 'in ' + (h ? h + ' h ' : '') + (m % 60) + ' min';
  };
  const P = {
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    comment: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    save: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    follow: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    stay: '<path d="M6 2h12M6 22h12M7 2v4a5 5 0 0 0 10 0V2M7 22v-4a5 5 0 0 1 10 0v4"/>',
  };
  const ic = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name]}</svg>`;
  const KIND = { screen: 'on-screen illusion', sound: 'sound illusion', body: 'try it with your body' };
  const KIND_LONG = { screen: 'on-screen illusion', sound: 'sound · headphones on', body: 'try it with your body' };
  const one = (n, a, b) => (n === 1 ? a : b);
  const article = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

  // ---------- data ----------
  async function load(first) {
    const [d, m] = await Promise.all([
      fetch('data.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()),
      META ? Promise.resolve(META) : fetch('art/hero.json').then((r) => r.json()),
    ]);
    META = m;
    if (!first && DATA && DATA.updated === d.updated) return;
    DATA = d;
    render(d, first);
  }

  function render(d, first) {
    hero.style.setProperty('--pw', META.photo_w);
    hero.style.setProperty('--ph', META.plate_h);
    hero.style.setProperty('--rw', META.rail_w);
    hero.style.setProperty('--rh', META.rail_h);
    $('#live').innerHTML = `<i aria-hidden="true"></i><span>Live</span><span class="when">updated ${time(d.updated)}</span>`;
    if (first) { splitTitle(); }
    placeGlints();
    renderChips(d);
    renderNumbers(d);
    renderReels(d);
    renderChart(d);
    renderNotes(d);
    renderNext(d);
    renderDash(d);
    $('#updated').textContent = `Updated ${when(d.updated)}. Numbers come from Instagram's official API and refresh every 2 hours.`;
    observeReveals();
    startChat(d);
  }

  // ---------- hero ----------
  function splitTitle() {
    let i = 0;
    document.querySelectorAll('.title .line').forEach((line) => {
      const text = line.textContent;
      line.innerHTML = [...text].map((c) => (c === ' ' ? '<span class="sp"></span>' : `<span class="ch" style="--i:${i++}" aria-hidden="true">${esc(c)}</span>`)).join('');
    });
  }

  function placeGlints() {
    const H = hero.getBoundingClientRect().height, s = H / 1500;
    const pw = META.photo_w, tile = 2 * pw * s;
    const pairs = Math.ceil((innerWidth + tile) / tile) + 1;
    let html = '';
    for (let k = 0; k < pairs; k++) {
      for (const g of META.glints) {
        const xo = (k * 2 * pw + (g.x / 100) * pw) * s;
        const xm = (k * 2 * pw + 2 * pw - (g.x / 100) * pw) * s;
        for (const x of [xo, xm]) html += `<i class="glint" style="left:${x.toFixed(1)}px;top:${g.y}%;animation-delay:${(-g.d - (k % 3) * .7).toFixed(2)}s"></i>`;
      }
    }
    $('#glints').innerHTML = html;
  }

  function renderChips(d) {
    const back = $('#chips-back'), front = $('#chips-front');
    if (innerWidth <= 900) { back.innerHTML = front.innerHTML = ''; return; }
    const r = hero.getBoundingClientRect(), H = r.height, W = r.width;
    const pw = H * .6 * 9 / 19, cx = W / 2, gap = Math.max(36, (W - pw) / 2 * .12);
    const solid = d.reels.filter((x) => x.hold_pct != null && (x.reach || 0) >= 300);
    const avgStay = solid.length ? solid.reduce((a, x) => a + x.hold_pct, 0) / solid.length : null;
    const chip = (icon, color, big, small, style, delay) =>
      `<div class="chip" style="${style};--c:${color};animation-delay:${(-delay * 1.3).toFixed(1)}s,${(1.1 + delay * .18).toFixed(2)}s">
        <span class="ic">${ic(icon)}</span><span><b>${big}</b><span>${small}</span></span></div>`;
    back.innerHTML =
      chip('eye', '#dbe8ff', fmt(d.totals.views), 'views so far', `right:${(W - (cx - pw / 2 - gap)).toFixed(0)}px;top:${(H * .40).toFixed(0)}px`, 0) +
      chip('users', '#d5f6ef', fmt(d.totals.reach), 'accounts reached', `left:${(cx + pw / 2 + gap).toFixed(0)}px;top:${(H * .33).toFixed(0)}px`, 1) +
      chip('stay', '#ffe9a8', pct(avgStay), 'stay past 3 seconds', `right:${(W - (cx - pw / 2 - gap * 1.9)).toFixed(0)}px;top:${(H * .6).toFixed(0)}px`, 2);
    front.innerHTML =
      chip('heart', '#ffd6e4', fmt(d.totals.likes), 'likes', `left:${(cx + pw / 2 + gap * 1.9).toFixed(0)}px;top:${(H * .55).toFixed(0)}px`, 3);
  }

  // the chat: a lab bot reports each reel, newest first
  function scenes(d) {
    return d.reels.slice().reverse().filter((r) => r.reach != null).map((r) => {
      const m = [];
      if (r.cover) m.push({ k: 'pic', src: r.cover });
      m.push({ k: 'in', html: `<b>#${r.n} ${esc(r.topic)}</b><br>went up ${esc(when(r.posted_at))}` });
      m.push({ k: 'in', html: `${fmt(r.reach)} people have seen it` });
      m.push({ k: 'out', html: 'did they stay?' });
      if (r.hold_pct != null) m.push({ k: 'in', html: `${pct(r.hold_pct)} stayed past 3 seconds${r.watch_pct != null ? `, and watched ${r.watch_pct}% of it` : ''}` });
      const h = r.hold_pct ?? 0;
      m.push({ k: 'out', html: h >= 60 ? 'that’s huge' : h >= 52 ? 'nice!!' : h >= 45 ? 'not bad' : 'the start needs work' });
      m.push({ k: 'receipt', html: 'Read' });
      return m;
    });
  }
  function bubble(t, m) {
    const el = document.createElement('div');
    if (m.k === 'typing') { el.className = 'typing'; el.innerHTML = '<i></i><i></i><i></i>'; }
    else if (m.k === 'receipt') { el.className = 'receipt'; el.textContent = m.html; }
    else if (m.k === 'pic') { el.className = 'msg in pic'; el.innerHTML = `<img src="${esc(m.src)}" alt="">`; }
    else { el.className = 'msg ' + m.k; el.innerHTML = m.html; }
    t.appendChild(el);
    return el;
  }
  async function startChat(d) {
    const token = ++chatToken, t = $('#thread'), list = scenes(d);
    if (!list.length) return;
    t.innerHTML = '';
    if (reduce) { list[0].forEach((m) => bubble(t, m)); return; }
    await wait(1500);
    for (let i = 0; token === chatToken; i++) {
      for (const m of list[i % list.length]) {
        if (token !== chatToken) return;
        if (m.k === 'in' || m.k === 'pic') {
          const typing = bubble(t, { k: 'typing' });
          await wait(650 + Math.random() * 450);
          typing.remove();
        } else {
          await wait(m.k === 'receipt' ? 450 : 1000);
        }
        if (token !== chatToken) return;
        bubble(t, m);
        await wait(m.k === 'pic' ? 600 : 380);
      }
      await wait(3400);
      t.classList.add('clearing');
      await wait(480);
      t.innerHTML = '';
      t.classList.remove('clearing');
    }
  }

  // ---------- sections ----------
  function renderNumbers(d) {
    const t = d.totals, rot = [-2, 2.5, -1.5, 3, -2.5, 1.5, -1];
    const st = (cls, icon, val, label, note, i, dec = 0) => `
      <li class="sticker ${cls}" style="--r:${rot[i % rot.length]}deg" data-reveal>
        ${ic(icon, 'ic')}<b data-count="${val ?? ''}" data-dec="${dec}">${fmt(val, dec)}</b><span>${label}</span>${note ? `<small>${note}</small>` : ''}</li>`;
    $('#numbers').innerHTML = `
      <div class="hero-fig" data-reveal><span class="big" data-count="${t.views}">${fmt(t.views)}</span>
        <span class="lbl">views across ${d.reels.length} reels</span></div>
      <ul class="stickers">
        ${st('sky', 'users', t.reach, 'Accounts reached', 'added up across reels', 0)}
        ${st('gold', 'heart', t.likes, one(t.likes, 'Like', 'Likes'), '', 1)}
        ${st('mint', 'clock', t.watch_hours, one(t.watch_hours, 'Hour watched', 'Hours watched'), '', 2, 1)}
        ${st('pink', 'send', t.shares, one(t.shares, 'Share', 'Shares'), '', 3)}
        ${st('', 'save', t.saves, one(t.saves, 'Save', 'Saves'), '', 4)}
        ${st('sky', 'comment', t.comments, one(t.comments, 'Comment', 'Comments'), '', 5)}
        ${st('gold', 'follow', d.account.followers, one(d.account.followers, 'Follower', 'Followers'), '', 6)}
      </ul>`;
  }

  function renderReels(d) {
    const rot = [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1, -2.6, 2];
    $('#polaroids').innerHTML = d.reels.slice().reverse().map((r, i) => {
      const tag = r.best ? '<span class="tag pick">★ lab pick</span>' : (r.age_h < 6 ? '<span class="tag new">being tested</span>' : '');
      const label = `Reel ${r.n}, ${r.topic}: ${fmt(r.reach)} reached, ${pct(r.hold_pct)} stayed past 3 seconds, ${pct(r.watch_pct)} watched. Opens on Instagram.`;
      return `
      <a class="pol" href="${esc(r.url)}" target="_blank" rel="noopener" style="--r:${rot[i % rot.length]}deg" data-reveal aria-label="${esc(label)}">
        <span class="ph">${r.cover ? `<img src="${esc(r.cover)}" alt="" loading="lazy" width="270" height="480">` : ''}${tag}</span>
        <span class="cap"><b>#${r.n} ${esc(r.topic)}</b><i>${esc(KIND[r.type] || '')} · ${esc(when(r.posted_at))}</i></span>
        <span class="meter stay" style="--w:${r.hold_pct ?? 0}%"><span>Stayed past 3 s</span><b>${pct(r.hold_pct)}</b><span class="track"><i></i></span></span>
        <span class="meter watch" style="--w:${r.watch_pct ?? 0}%"><span>Share watched</span><b>${pct(r.watch_pct)}</b><span class="track"><i></i></span></span>
        <span class="counts">
          <span>${ic('users')}${fmt(r.reach)}</span><span>${ic('eye')}${fmt(r.views)}</span><span>${ic('heart')}${fmt(r.likes)}</span>
          <span>${ic('comment')}${fmt(r.comments)}</span><span>${ic('send')}${fmt(r.shares)}</span><span>${ic('save')}${fmt(r.saves)}</span>
        </span>
        <span class="score"><span>Lab score</span><b>${r.score != null ? r.score.toFixed(2) : 'after 6 h'}</b></span>
      </a>`;
    }).join('');
  }

  function renderChart(d) {
    const rows = d.reels.filter((r) => r.hold_pct != null);
    const maxH = Math.max(...rows.map((r) => r.hold_pct)), maxW = Math.max(...rows.map((r) => r.watch_pct ?? 0));
    const bar = (r, v, color, name, isMax) => {
      const tip = `<b>#${r.n} ${esc(r.topic)}</b><br>${name}: <b>${pct(v)}</b><br>${fmt(r.reach)} reached${r.age_h < 6 ? ' · still being tested' : ''}`;
      return `<span class="bar" tabindex="0" style="--c:${color};--w:${v ?? 0}%" data-tip="${esc(tip)}" aria-label="${esc(`#${r.n} ${r.topic}, ${name}: ${pct(v)}`)}">${isMax ? `<span class="val">${pct(v)}</span>` : ''}</span>`;
    };
    $('#chart').innerHTML = `
      <figcaption><h3>Stayed past 3 seconds, and share of each reel watched</h3>
        <p class="desc">Everyone who has seen each reel so far. Reels under 6 hours old are still being tested, so their bars can still move.</p></figcaption>
      <div class="legend"><span><i style="--c:var(--blue)"></i>Stayed past 3 s</span><span><i style="--c:var(--orange)"></i>Share of reel watched</span></div>
      <div class="bars">${rows.map((r) => `
        <div class="brow"><span class="bl">#${r.n} ${esc(r.topic)}<small>${fmt(r.reach)} reached</small></span>
          <div class="plot">${bar(r, r.hold_pct, 'var(--blue)', 'Stayed past 3 s', r.hold_pct === maxH)}${bar(r, r.watch_pct, 'var(--orange)', 'Share watched', r.watch_pct === maxW)}</div>
        </div>`).join('')}</div>
      <div class="axis"><span></span><div class="ticks"><span style="left:0">0%</span><span style="left:25%">25%</span><span style="left:50%">50%</span><span style="left:75%">75%</span><span style="left:100%">100%</span></div></div>
      <details class="table-view"><summary>See as a table</summary><div class="tablewrap"><table>
        <thead><tr><th>Reel</th><th>Reached</th><th>Views</th><th>Stayed past 3 s</th><th>Share watched</th><th>Avg watch</th><th>Lab score</th></tr></thead>
        <tbody>${d.reels.map((r) => `<tr><td>#${r.n} ${esc(r.topic)}</td><td>${fmt(r.reach)}</td><td>${fmt(r.views)}</td><td>${pct(r.hold_pct)}</td><td>${pct(r.watch_pct)}</td><td>${r.avg_watch_s != null ? r.avg_watch_s.toFixed(1) + ' s' : '–'}</td><td>${r.score != null ? r.score.toFixed(2) : '–'}</td></tr>`).join('')}</tbody>
      </table></div></details>`;
  }

  function renderNotes(d) {
    const rot = [-1.2, 1, -.6, 1.4, -1];
    const icon = { good: 'trend', info: 'info', watch: 'eye' };
    $('#notes').innerHTML = d.notes.map((n, i) =>
      `<li class="note ${esc(n.tone)}" style="--r:${rot[i % rot.length]}deg" data-reveal>${ic(icon[n.tone] || 'info')}<p>${esc(n.text)}</p></li>`).join('');
  }

  function renderNext(d) {
    $('#tickets').innerHTML = d.upcoming.map((u, i) => `
      <li class="ticket" data-reveal>
        <span class="thumb">${u.cover ? `<img src="${esc(u.cover)}" alt="" loading="lazy" width="270" height="480">` : ''}</span>
        <div>
          <p class="when"><b>about ${esc(time(u.eta))}</b><span data-eta="${esc(u.eta)}">${countdown(u.eta)}</span></p>
          <h3>#${d.reels.length + i + 1} ${esc(u.topic)}</h3>
          <p class="hook">${esc(u.hook)}</p>
          <p class="does">${esc(u.does)}</p>
          <span class="kind ${esc(u.type)}">${esc(KIND_LONG[u.type] || u.type)}</span>
        </div>
      </li>`).join('');
    const nb = d.next_build;
    $('#nextbuild').innerHTML = nb ? `After these, the next one built is <b>${article(nb.label)} ${esc(nb.label)}</b>: ${esc(nb.reason)}.` : '';
  }

  // ---------- the dashboard view ----------
  let SORT = { key: 'n', dir: -1 };
  const avgOf = (rows, k) => (rows.length ? rows.reduce((a, r) => a + (r[k] || 0), 0) / rows.length : null);
  const COLS = [
    { key: 'n', label: 'Reel', get: (r) => r.n, cell: (r) => `<span class="rname">#${r.n} ${esc(r.topic)}</span><span class="rtype">${esc(KIND[r.type] || '')}</span>` },
    { key: 'posted_at', label: 'Posted', get: (r) => r.posted_at, cell: (r) => esc(when(r.posted_at).replace(/^today /, '')) },
    { key: 'reach', label: 'Reached', get: (r) => r.reach, cell: (r) => fmt(r.reach) },
    { key: 'views', label: 'Views', get: (r) => r.views, cell: (r) => fmt(r.views) },
    { key: 'vpp', label: 'Views per person', get: (r) => (r.reach ? r.views / r.reach : null), cell: (r) => (r.reach ? (r.views / r.reach).toFixed(2) : '–') },
    { key: 'hold_pct', label: 'Stayed past 3 s', get: (r) => r.hold_pct, cell: (r) => meterCell('stay', r.hold_pct) },
    { key: 'watch_pct', label: 'Share watched', get: (r) => r.watch_pct, cell: (r) => meterCell('watch', r.watch_pct) },
    { key: 'avg_watch_s', label: 'Avg watch', get: (r) => r.avg_watch_s, cell: (r) => (r.avg_watch_s != null ? r.avg_watch_s.toFixed(1) + ' s' : '–') },
    { key: 'likes', label: 'Likes', get: (r) => r.likes, cell: (r) => fmt(r.likes) },
    { key: 'comments', label: 'Comments', get: (r) => r.comments, cell: (r) => fmt(r.comments) },
    { key: 'shares', label: 'Shares', get: (r) => r.shares, cell: (r) => fmt(r.shares) },
    { key: 'saves', label: 'Saves', get: (r) => r.saves, cell: (r) => fmt(r.saves) },
    { key: 'score', label: 'Lab score', get: (r) => r.score, cell: (r) => (r.score != null ? r.score.toFixed(2) : '–') },
    { key: 'trend', label: 'Reach so far', cell: (r) => spark(r) },
    { key: 'link', label: '', cell: (r) => `<a class="go" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="Watch reel ${r.n} on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>` },
  ];
  function meterCell(kind, v) {
    return `<span class="mini-meter ${kind}"><i><b style="width:${v ?? 0}%"></b></i>${pct(v)}</span>`;
  }
  function spark(r) {
    const pts = (r.history || []).filter((p) => p.h != null && p.reach != null);
    if (!pts.length) return '–';
    const W = 72, H = 26, mh = Math.max(...pts.map((p) => p.h)) || 1, mr = Math.max(...pts.map((p) => p.reach)) || 1;
    const all = [[3, H - 3], ...pts.map((p) => [3 + (p.h / mh) * (W - 8), H - 3 - (p.reach / mr) * (H - 7)])];
    const d = all.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
    const e = all[all.length - 1];
    const label = `Reach over time: ${pts.map((p) => `${fmt(p.reach)} at ${p.h} h`).join(', ')}`;
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><path d="${d}"/><circle cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="3.5"/></svg>`;
  }
  function tableBody(d) {
    const col = COLS.find((c) => c.key === SORT.key) || COLS[0];
    const rows = d.reels.slice().sort((a, b) => {
      const x = col.get(a), y = col.get(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x > y ? 1 : x < y ? -1 : 0) * SORT.dir;
    });
    return rows.map((r) => `<tr>${COLS.map((c) => `<td>${c.cell(r)}</td>`).join('')}</tr>`).join('');
  }
  function tableHead() {
    return COLS.map((c) => {
      if (!c.get) return `<th scope="col">${c.label ? `<span class="th-l">${c.label}</span>` : '<span class="sr">Link</span>'}</th>`;
      const sort = SORT.key === c.key ? ` aria-sort="${SORT.dir > 0 ? 'ascending' : 'descending'}"` : '';
      return `<th scope="col"${sort}><button type="button" data-sort="${c.key}">${c.label}</button></th>`;
    }).join('');
  }
  function barsHTML(rows, series, max) {
    return rows.map((r) => `
      <div class="brow"><span class="bl">#${r.n} ${esc(r.topic)}<small>${fmt(r.reach)} reached</small></span>
        <div class="plot">${series.map((s) => {
          const v = s.get(r), isMax = v != null && v === max[s.key];
          const tip = `<b>#${r.n} ${esc(r.topic)}</b><br>${s.name}: <b>${s.fmt(v)}</b>${r.age_h < 6 ? '<br>still being tested' : ''}`;
          return `<span class="bar" tabindex="0" style="--c:${s.color};--w:${s.width(v)}%" data-tip="${esc(tip)}" aria-label="${esc(`#${r.n} ${r.topic}, ${s.name}: ${s.fmt(v)}`)}">${isMax ? `<span class="val">${s.fmt(v)}</span>` : ''}</span>`;
        }).join('')}</div>
      </div>`).join('');
  }
  function renderDash(d) {
    const t = d.totals, R = d.reels;
    const solid = R.filter((r) => r.hold_pct != null && (r.reach || 0) >= 300);
    $('#dash-sub').textContent = `@pixel.knows · updated ${when(d.updated)} · refreshes every 2 hours`;
    // kpi(icon, label, value, decimals, suffix, sub, extra class, text shown instead of a number)
    const kpi = (icon, label, val, dec, suf, sub, cls = '', text = null) => `
      <div class="kpi ${cls}"><div class="k-label">${ic(icon)}${label}</div>
        <div class="k-value"${val != null && text == null ? ` data-count="${val}" data-dec="${dec}" data-suffix="${suf}"` : ''}>${text != null ? text : val != null ? fmt(val, dec) + suf : '–'}</div>${sub ? `<div class="k-sub">${sub}</div>` : ''}</div>`;
    const stay = avgOf(solid, 'hold_pct'), watch = avgOf(solid, 'watch_pct'), avgw = avgOf(solid, 'avg_watch_s');
    const subSolid = 'average, reels with 300+ viewers';
    const next = d.upcoming[0];
    // by type
    const types = ['screen', 'sound', 'body'].map((k) => {
      const rs = R.filter((r) => r.type === k), sol = rs.filter((r) => (r.reach || 0) >= 300 && r.hold_pct != null);
      return { k, n: rs.length, reach: avgOf(rs, 'reach'), stay: avgOf(sol, 'hold_pct'), watch: avgOf(sol, 'watch_pct') };
    }).filter((x) => x.n);
    const sw = [
      { key: 'hold', name: 'Stayed past 3 s', color: 'var(--blue)', get: (r) => r.hold_pct, fmt: pct, width: (v) => v ?? 0 },
      { key: 'watch', name: 'Share watched', color: 'var(--orange)', get: (r) => r.watch_pct, fmt: pct, width: (v) => v ?? 0 },
    ];
    const maxReach = Math.max(...R.map((r) => r.reach || 0)) || 1;
    // a clean axis: the smallest round step that covers the largest bar (plus room for its label) in 5 steps or fewer
    const step = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 25000, 50000, 100000].find((s) => Math.ceil(maxReach * 1.1 / s) <= 5) || 100000;
    const axisMax = step * Math.ceil(maxReach * 1.1 / step);
    const ticks = [];
    for (let v = 0; v <= axisMax; v += step) ticks.push(v);
    const rr = [{ key: 'reach', name: 'Reached', color: '#6250d6', get: (r) => r.reach, fmt: (v) => fmt(v), width: (v) => ((v || 0) / axisMax) * 100 }];
    const withHold = R.filter((r) => r.hold_pct != null);
    $('#dash-body').innerHTML = `
      <div class="kpis">
        ${kpi('eye', 'Views', t.views, 0, '', `across ${R.length} reels`, 'hero-kpi')}
        ${kpi('users', 'Accounts reached', t.reach, 0, '', 'added up across reels')}
        ${kpi('stay', 'Stayed past 3 s', stay != null ? Math.round(stay) : null, 0, '%', subSolid)}
        ${kpi('eye', 'Share watched', watch != null ? Math.round(watch) : null, 0, '%', subSolid)}
        ${kpi('clock', 'Avg watch time', avgw, 1, ' s', subSolid)}
        ${kpi('clock', 'Hours watched', t.watch_hours, 1, '', 'all reels together')}
        ${kpi('heart', one(t.likes, 'Like', 'Likes'), t.likes, 0, '', '')}
        ${kpi('comment', one(t.comments, 'Comment', 'Comments'), t.comments, 0, '', '')}
        ${kpi('send', one(t.shares, 'Share', 'Shares'), t.shares, 0, '', '')}
        ${kpi('save', one(t.saves, 'Save', 'Saves'), t.saves, 0, '', '')}
        ${kpi('follow', one(d.account.followers, 'Follower', 'Followers'), d.account.followers, 0, '', next ? esc(`next reel about ${time(next.eta)}`) : '')}
      </div>
      <div class="dgrid">
        <section class="dcard two-thirds" aria-labelledby="dc-sw">
          <h3 id="dc-sw">Stayed past 3 seconds, and share of each reel watched</h3>
          <p class="desc">Higher is better for both. Reels under 6 hours old are still being tested.</p>
          <div class="legend"><span><i style="--c:var(--blue)"></i>Stayed past 3 s</span><span><i style="--c:var(--orange)"></i>Share of reel watched</span></div>
          <div class="bars">${barsHTML(withHold, sw, { hold: Math.max(...withHold.map((r) => r.hold_pct)), watch: Math.max(...withHold.map((r) => r.watch_pct ?? 0)) })}</div>
          <div class="axis"><span></span><div class="ticks"><span style="left:0">0%</span><span style="left:25%">25%</span><span style="left:50%">50%</span><span style="left:75%">75%</span><span style="left:100%">100%</span></div></div>
        </section>
        <section class="dcard third" aria-labelledby="dc-type">
          <h3 id="dc-type">By kind of reel</h3>
          <p class="desc">Averages. Stayed and watched count reels with 300+ viewers.</p>
          <div class="dtable-wrap"><table class="dtable">
            <thead><tr><th scope="col">Kind</th><th scope="col">Reels</th><th scope="col">Avg reached</th></tr></thead>
            <tbody>${types.map((x) => `<tr><td><span class="rname">${esc(KIND[x.k])}</span></td><td>${x.n}</td><td>${fmt(x.reach)}</td></tr>
              <tr><td colspan="3" style="text-align:left">${meterCell('stay', x.stay)} <span class="muted">stayed</span>&nbsp;&nbsp; ${meterCell('watch', x.watch)} <span class="muted">watched</span></td></tr>`).join('')}</tbody>
          </table></div>
        </section>
        <section class="dcard half" aria-labelledby="dc-reach">
          <h3 id="dc-reach">Accounts reached, by reel</h3>
          <p class="desc">Each reel's test push from Instagram so far.</p>
          <div class="bars nogrid"><div class="gridx">${ticks.map((v) => `<i style="left:${(v / axisMax) * 100}%"></i>`).join('')}</div>${barsHTML(R, rr, { reach: maxReach })}</div>
          <div class="axis"><span></span><div class="ticks">${ticks.map((v) => `<span style="left:${(v / axisMax) * 100}%">${fmt(v)}</span>`).join('')}</div></div>
        </section>
        <section class="dcard half" aria-labelledby="dc-next">
          <h3 id="dc-next">Coming up</h3>
          <p class="desc">Posted about every 2 hours, in the order the analysis picked.</p>
          <ul class="dlist">${d.upcoming.map((u, i) => `
            <li><span class="thumb-s">${u.cover ? `<img src="${esc(u.cover)}" alt="" loading="lazy">` : ''}</span>
              <span><span class="when">about ${esc(time(u.eta))} · <span data-eta="${esc(u.eta)}">${countdown(u.eta)}</span></span>
              #${R.length + i + 1} ${esc(u.topic)} <span class="muted">· ${esc(u.hook)}</span><br><span class="pill-k ${esc(u.type)}">${esc(KIND_LONG[u.type] || u.type)}</span></span></li>`).join('')}
          </ul>
          ${d.next_build ? `<p class="foot-note">After these, the next one built is ${article(d.next_build.label)} ${esc(d.next_build.label)}: ${esc(d.next_build.reason)}.</p>` : ''}
        </section>
        <section class="dcard" aria-labelledby="dc-all">
          <h3 id="dc-all">Every reel</h3>
          <p class="desc">Select a column to sort. "Reach so far" traces each reel's reach from the moment it went up.</p>
          <div class="dtable-wrap"><table class="dtable" id="dtable">
            <thead><tr>${tableHead()}</tr></thead><tbody>${tableBody(d)}</tbody>
          </table></div>
        </section>
        <section class="dcard" aria-labelledby="dc-notes">
          <h3 id="dc-notes">What the numbers say</h3>
          <ul class="dlist">${d.notes.map((n) => `<li><span class="tone ${esc(n.tone)}">${ic({ good: 'trend', info: 'info', watch: 'eye' }[n.tone] || 'info')}</span><span>${esc(n.text)}</span></li>`).join('')}</ul>
          <p class="foot-note">Stayed past 3 s is 100% minus Instagram's skip rate. Share watched is the average watch time divided by the reel's length. The lab score compares each reel with the reels posted around it at the same age: 40% stayed past 3 s, 40% share watched, 20% reach. 1.00 is typical.</p>
        </section>
      </div>`;
    if (!dash.hidden) dash.querySelectorAll('[data-count]').forEach(countUp);
  }

  const dash = $('#dash');
  let lastFocus = null, closeTimer = 0;
  function openDash() {
    if (dash.classList.contains('open')) return;
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    dash.hidden = false;
    document.documentElement.classList.add('dash-open');
    $('#top').inert = true;
    $('main').inert = true;
    requestAnimationFrame(() => requestAnimationFrame(() => dash.classList.add('open')));
    setTimeout(() => $('.dash-close', dash).focus({ preventScroll: true }), 80);
    dash.querySelectorAll('[data-count]').forEach(countUp);
    if (location.hash !== '#dashboard') history.replaceState(null, '', '#dashboard');
  }
  function closeDash() {
    if (dash.hidden) return;
    dash.classList.remove('open');
    document.documentElement.classList.remove('dash-open');
    $('#top').inert = false;
    $('main').inert = false;
    tip.hidden = true;
    closeTimer = setTimeout(() => { dash.hidden = true; }, reduce ? 0 : 450);
    if (location.hash === '#dashboard') history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-dash]')) { e.preventDefault(); openDash(); return; }
    if (e.target.closest('[data-close-dash]')) { closeDash(); return; }
    const s = e.target.closest('#dtable th button[data-sort]');
    if (s && DATA) {
      const k = s.dataset.sort;
      SORT = { key: k, dir: SORT.key === k ? -SORT.dir : -1 };            // a new column starts highest first
      $('#dtable thead tr').innerHTML = tableHead();
      $('#dtable tbody').innerHTML = tableBody(DATA);
      const again = $(`#dtable th button[data-sort="${k}"]`);
      if (again) again.focus();
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dash.hidden) closeDash(); });
  addEventListener('hashchange', () => { if (location.hash === '#dashboard') openDash(); else closeDash(); });

  // ---------- motion ----------
  let io;
  function observeReveals() {
    if (reduce || !('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in'));
      return;
    }
    io = io || new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        if (e.target.matches('[data-count]')) countUp(e.target);
        io.unobserve(e.target);
      }
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el, i) => {
      el.style.transitionDelay = (el.closest('.stickers, .notes, .tickets, .steps') ? (i % 7) * 70 : 0) + 'ms';
      io.observe(el);
    });
  }
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    if (!isFinite(end) || el.dataset.done) return;
    el.dataset.done = 1;
    const t0 = performance.now(), dur = 1300;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(end * e, dec) + (el.dataset.suffix || '');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // tooltips on the chart's bars (pointer and keyboard)
  const tip = $('#tip');
  function showTip(el, x, y) {
    tip.innerHTML = el.dataset.tip;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    const left = Math.min(innerWidth - r.width - 12, Math.max(12, x + 14));
    const top = y - r.height - 12 < 8 ? y + 18 : y - r.height - 12;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest && e.target.closest('.bar');
    if (b) showTip(b, e.clientX, e.clientY); else if (!tip.hidden && !document.activeElement?.matches?.('.bar')) tip.hidden = true;
  });
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('.bar')) { const r = e.target.getBoundingClientRect(); showTip(e.target, r.right, r.top); }
  });
  document.addEventListener('focusout', (e) => { if (e.target.matches('.bar')) tip.hidden = true; });

  // parallax: the pointer tilts the layers apart; scrolling separates them
  let tx = 0, ty = 0, mx = 0, my = 0, heroVisible = true;
  if (!reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; });
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
    const frame = () => {
      if (heroVisible) {
        mx += (tx - mx) * .06;
        my += (ty - my) * .06;
        hero.style.setProperty('--mx', mx.toFixed(3));
        hero.style.setProperty('--my', my.toFixed(3));
        hero.style.setProperty('--sy', Math.min(1, Math.max(0, scrollY / hero.offsetHeight)).toFixed(3));
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  const top = $('#top');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (DATA && META) { placeGlints(); renderChips(DATA); } }, 150);
  });
  setInterval(() => document.querySelectorAll('[data-eta]').forEach((el) => { el.textContent = countdown(el.dataset.eta); }), 30e3);
  setInterval(() => load(false).catch(() => {}), 10 * 60e3);

  load(true).then(() => { if (location.hash === '#dashboard') openDash(); }).catch((e) => {
    $('#updated').textContent = 'The numbers could not be loaded right now. Try again in a minute.';
    console.error(e);
  });
})();
