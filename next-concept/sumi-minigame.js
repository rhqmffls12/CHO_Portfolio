// Element minigame, MVP (MINIGAME-PLAN.md §9): all four elements, no effects. While the chick is
// one of those elements, page icons are let loose as "mobs" and the visitor clears them as fast as
// possible in the element's way:
//  - lightning: a quick attack hits every mob near the straight line of the move (fireMode hands
//    over the stretch covered each frame), large ones may need more hits
//  - fire: holding the breath on a mob heats it; it burns up after its tier's exposure time, and
//    heat cools slowly while the breath is off it (the meteor move does nothing)
//  - ice: the crystal pillars rising behind the steps freeze a mob they touch: it stops for a
//    moment, then moves on and can't be frozen again for a while; it breaks on its tier's last
//    freeze (a move's pillars do nothing)
//  - dark: mobs are black or white (the largest ones keep switching); the chick breaks one of its
//    own colour by touching it, in alternating order (black, white, black... or the other way
//    round), shown by the orb above its head; the chick's colour turns over with every move
//  - mobs: card tool logos and level-1 toolkit icons (small), level-2/3 toolkit icons and the
//    mail / Slack icons (medium), level-4 toolkit icons (large); a few of each per round
//  - they live at page positions (like the flowers), each roaming within ±roam screen heights of
//    where it came out, and bounce at the edges; off-screen mobs are counted in the HUD
//  - the clock starts once the transformation has played; no project dialog opens while the chick
//    is transformed (one it transformed inside closes as it teleports out to the page)
//  - clear: time recorded among this browser's top 3 for the element; out of time: no record
// Positions are kept in script (page coordinates); the DOM is only written, never measured per
// frame, so hit tests are plain arithmetic. Off for touch devices and reduced motion.
export const GAME_CONFIG = {
  size: [28, 40, 56],          // px, drawn size per tier (small, medium, large)
  turn: [1.5, 3],              // s between gentle direction changes
  showHits: false,             // debug: draw the hit areas (the tuning panel turns it on)
  ready: 1.8,                  // s of "3 2 1" after the transformation: mobs out and still, the clock waits
  autoScroll: true,            // at the start, scroll smoothly to where most mobs are (when they are out of view)
  // walls every mob bounces off, in every mode: the sides keep this share of the window width
  // free; the top sits this far above the hero's eyebrow line; the bottom runs through the second
  // line of the closing title ("Build the systems behind it.")
  walls: { side: 0.115, top: 50, bottom: 0.75 },
  elements: {
    lightning: {
      count: [8, 4, 3],        // mobs per round
      speed: [80, 110, 170],   // px/s at a 1440 px wide window (scales with the width)
      rate: [2.5, 3, 3.5],     // speed multiplier from 0 s, 10 s, 15 s
      hitR: [30, 40, 50],      // px: each mob's hit radius (its body circle)
      roam: 1.5,               // screen heights above and below a mob's starting point
      walk: 1.7,                    // the transformed chick's walking speed multiplier
      blinkSpeed: 1,              // the move (teleport) speed multiplier: >1 faster
      hits: [1, 1, 1],         // quick attacks needed
      polish: true,            // the finished play UI: start banner, HUD with a time bar, hit effects, combos, result card
      reach: 60,               // px beyond a mob's radius that still counts as on the path
    },
    fire: {
      count: [8, 4, 2],
      speed: [250, 200, 150],
      rate: [1, 1, 1],
      hitR: [20, 30, 50],
      roam: 1.5,
      walk: 1,                    // the transformed chick's walking speed multiplier
      blinkSpeed: 1,              // the move (teleport) speed multiplier: >1 faster
      expose: [0.2, 0.4, 0.7],    // s of breath needed
      polish: true,               // the finished play UI (heat gauge on the ring)
      decay: 0.6,                 // s of heat lost per second off the breath
      length: 500,                // px: the breath's reach from the mouth (about the visible flame)
      width: 300,                 // px: its width at the far end (it starts 24 px wide at the mouth)
    },
    ice: {
      count: [6, 3, 2],
      speed: [180, 110, 110],
      rate: [1, 1, 1],
      hitR: [30, 40, 50],
      roam: 1.5,
      walk: 1.3,                    // the transformed chick's walking speed multiplier
      blinkSpeed: 1.5,              // the move (teleport) speed multiplier: >1 faster
      freezes: [1, 2, 2],         // freezes until it breaks
      polish: true,               // the finished play UI (a ring per freeze; frozen / not yet freezable on the ring)
      freezeTime: 0.9,            // s a frozen mob stands still
      immune: 1.3,                // s after thawing before it can freeze again
      pillarR: 70,                // px: a pillar's reach around its base
    },
    dark: {
      count: [5, 3, 1],
      speed: [100, 140, 180],
      rate: [1, 1, 1],
      size: [28, 40, 84],         // px, drawn size here: the large one (the last to break) is 1.5x the shared size
      hitR: [15, 20, 50],
      roam: 1.5,
      walk: 1,                    // the transformed chick's walking speed multiplier
      blinkSpeed: 1,              // the move (teleport) speed multiplier: >1 faster
      touchR: 45,                 // px: the chick's reach around its body
      polish: true,               // the finished play UI (rings in the mob's colour, the big one locked till last, next colour in the HUD)
      flicker: 1.2,               // s between a large mob's colour changes (small and medium keep theirs)
    },
  },
};
const ELEMENTS = Object.keys(GAME_CONFIG.elements);   // the elements that have a game
const STORE = 'sumi-minigame-records-v1';
const TIER_NAME = ['small', 'medium', 'large'];
const RING_PAD = 7;   // px the polished target ring stands out around the icon
// the visible area without scrollbars (innerWidth counts the scrollbar: drawings and bounds would be off by its width)
const viewW = () => document.documentElement.clientWidth || innerWidth, viewH = () => document.documentElement.clientHeight || innerHeight;

// Records are kept per element and per settings: a round's times only rank against rounds played
// with the same mob counts, speeds, hit sizes and rules (the walls and the size shared by every
// element too), so tuning never leaves an easier setting's time on top. The key is a short hash.
function settingsKey(element) {
  const { polish, ...rules } = GAME_CONFIG.elements[element];
  const text = JSON.stringify([rules, GAME_CONFIG.size, GAME_CONFIG.walls]);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${element}@${(h >>> 0).toString(36)}`;
}
function loadRecords() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; } }
function saveRecords(r) { try { localStorage.setItem(STORE, JSON.stringify(r)); } catch { /* kept for this visit only */ } }
const shuffle = list => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };

// candidate icons per tier
function candidates() {
  const imgs = sel => [...document.querySelectorAll(sel)].filter(i => i.currentSrc || i.src);
  const small = [...imgs('.card-tool-logos img'), ...imgs('.tool-orb[data-priority="1"] img')];
  const medium = [...imgs('.tool-orb[data-priority="2"] img, .tool-orb[data-priority="3"] img'), ...imgs('.contact-icon-link img')];
  const large = imgs('.tool-orb[data-priority="4"] img');
  return [small, medium, large];
}

// fire: is a mob (centre px, py, radius r) within the breath's cone, apex at the mouth, 24 px wide
// there and `width` wide at `length`?
function inBreath(px, py, r, b, E) {
  const dx = b.to.x - b.from.x, dy = b.to.y - b.from.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const qx = px - b.from.x, qy = py - b.from.y, t = qx * ux + qy * uy;
  if (t < -r || t > E.length + r) return false;
  const half = 12 + (E.width / 2 - 12) * Math.max(0, Math.min(1, t / E.length));
  return Math.abs(qx * uy - qy * ux) <= half + r;
}

export function createMinigame({ enabled = true } = {}) {
  const C = GAME_CONFIG;
  const layer = document.createElement('div');
  layer.className = 'sumi-game-layer';
  layer.setAttribute('aria-hidden', 'true');
  const hud = document.createElement('div');
  hud.className = 'sumi-game-hud';
  hud.setAttribute('role', 'status');
  hud.hidden = true;
  // the finished play UI (elements with `polish`): a HUD with the count, the time and a bar for the
  // time left, a start banner and a result card; hit and break effects go in `layer`
  const play = document.createElement('div');
  play.className = 'sumi-play';   // not aria-hidden: it holds the quit button
  play.innerHTML = '<div class="sumi-play-hud" hidden><span class="sumi-play-icon"></span><span class="sumi-play-count"><b></b><small></small></span><span class="sumi-play-coat" hidden>병아리<i></i></span><span class="sumi-play-next" hidden>다음<i></i></span><span class="sumi-play-time"></span><button class="sumi-play-quit" type="button" data-sumi-control="game-quit" title="사냥 그만하기 (Esc)">그만하기</button><i class="sumi-play-bar"><i></i></i></div>'
    + '<div class="sumi-play-banner" hidden><strong></strong><span></span><em></em></div><div class="sumi-play-left" hidden><b></b><span>마리 남음!</span></div><div class="sumi-play-result" hidden></div>';
  const pHud = play.querySelector('.sumi-play-hud'), pIcon = pHud.querySelector('.sumi-play-icon'), pLeft = pHud.querySelector('b'), pTotal = pHud.querySelector('small'), pTime = pHud.querySelector('.sumi-play-time'), pBar = pHud.querySelector('.sumi-play-bar i');
  const pNext = pHud.querySelector('.sumi-play-next'), pNextDot = pNext.querySelector('i'), pCoat = pHud.querySelector('.sumi-play-coat'), pCoatDot = pCoat.querySelector('i');
  const pQuit = pHud.querySelector('.sumi-play-quit'), pCount = play.querySelector('.sumi-play-banner em');
  const pBanner = play.querySelector('.sumi-play-banner'), pResult = play.querySelector('.sumi-play-result'), pLeftPop = play.querySelector('.sumi-play-left');
  let leftTimer = 0;
  // in the middle of the screen on every break: "N마리 남음!" (the last three in red)
  function leftPop(n, big = String(n), small = '마리 남음!') {
    pBanner.hidden = true;
    pLeftPop.querySelector('b').textContent = big;
    pLeftPop.querySelector('span').textContent = small;
    pLeftPop.classList.toggle('is-few', n <= 3);
    pLeftPop.hidden = false; pLeftPop.classList.remove('is-on'); void pLeftPop.offsetWidth; pLeftPop.classList.add('is-on');
    clearTimeout(leftTimer); leftTimer = setTimeout(() => { pLeftPop.hidden = true; }, 900);
  }
  // the start banner's one line on how to play, per element
  const HOWTO = {
    lightning: n => `순간이동으로 가로질러 잡아라 · ${n}마리`,
    fire: n => `불길을 쏘여 동그라미 게이지를 채워라 · ${n}마리`,
    ice: n => `얼음 기둥으로 동그라미를 하나씩 깨라 · ${n}마리`,
    dark: () => '머리 위 색과 같은 몹을 번갈아 잡아라 · 큰 몹은 마지막',
  };
  const ICON = { lightning: '⚡', fire: '🔥', ice: '❄', dark: '●' }, NAME = { lightning: '번개', fire: '불', ice: '얼음', dark: '어둠' };
  let startLeft = 0, bannerTimer = 0, resultTimer = 0, combo = { id: -1, n: 0, el: null };
  document.body.append(layer, hud, play);
  const polished = el => Boolean(C.elements[el]?.polish);
  // the start banner: the title and how to play, held through the ready countdown
  function banner(title, sub) {
    pBanner.querySelector('strong').textContent = title; pBanner.querySelector('span').textContent = sub; pCount.textContent = '';
    pBanner.hidden = false; pBanner.classList.remove('is-on'); void pBanner.offsetWidth; pBanner.classList.add('is-on');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { pBanner.hidden = true; }, Math.max(1500, C.ready * 1000 + 400));
  }
  // a blocked touch (dark: the wrong colour or out of order or locked; ice: not freezable yet): the
  // ring flashes red and a small cross pops above the mob, at most every 0.6 s per mob
  function nope(m, y) {
    if (round.clock < (m.nopeAt || 0)) return;
    m.nopeAt = round.clock + 0.6;
    if (m.ring) { m.ring.classList.remove('is-nope'); void m.ring.offsetWidth; m.ring.classList.add('is-nope'); }
    const x = document.createElement('div');
    x.className = 'sumi-nope'; x.textContent = '\u2715';
    x.style.left = `${m.x.toFixed(1)}px`; x.style.top = `${(y - (m.ringD || 40) / 2 - 4).toFixed(1)}px`;
    layer.append(x); setTimeout(() => x.remove(), 600);
  }
  // at the start: scroll smoothly so most mobs are in view (the median one in the middle), unless they are
  function scrollToMobs() {
    if (!C.autoScroll || !round.mobs.length) return;
    const ys = round.mobs.map(m => m.y).sort((a, b) => a - b), mid = ys[Math.floor(ys.length / 2)], H = viewH();
    if (Math.abs(mid - (scrollY + H / 2)) < H * 0.3) return;
    scrollTo({ top: Math.max(0, mid - H * 0.5), behavior: 'smooth' });
  }
  // quit: the visitor ends the round (button or Esc); no record, and no new round this charge
  function quit() { if (round) { finish(''); leftPop(99, '그만!', '사냥을 마쳤어요'); } }
  pQuit.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); quit(); });
  const onKey = e => { if (e.key === 'Escape' && round && !e.defaultPrevented) quit(); };
  addEventListener('keydown', onKey);
  // a mob broken, at a viewport point: a flash, eight rays and its picture popping
  function burst(m, x, y) {
    const fx = document.createElement('div');
    fx.className = `sumi-burst sumi-burst-${round.element}`;
    fx.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    const pic = document.createElement('img'); pic.src = m.el.src; pic.alt = ''; pic.style.width = pic.style.height = m.el.style.width;
    fx.append(pic);
    for (let i = 0; i < 8; i++) { const ray = document.createElement('i'); ray.style.rotate = `${i * 45 + Math.random() * 20}deg`; fx.append(ray); }
    layer.append(fx);
    setTimeout(() => fx.remove(), 650);
  }
  // breaks in the same move: "2연속!" and up, where the last one broke
  function comboText(n, x, y) {
    if (!combo.el) { combo.el = document.createElement('div'); combo.el.className = 'sumi-combo'; layer.append(combo.el); }
    const el = combo.el;
    el.textContent = `${n}연속!`;
    el.style.left = `${x.toFixed(1)}px`; el.style.top = `${y.toFixed(1)}px`;   // not transform: its pop animates scale
    el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');
    clearTimeout(el.timer); el.timer = setTimeout(() => { el.remove(); if (combo.el === el) combo.el = null; }, 900);
  }
  // a hit that does not break yet (more hits needed): a white flash and a shake
  function hitFlash(m) { m.el.classList.remove('is-hit'); void m.el.offsetWidth; m.el.classList.add('is-hit'); }
  function showResult(key, result, t, rank, best, left) {
    const list = records[key] || [];
    const rows = list.map((v, i) => `<li${result === 'clear' && i === rank - 1 ? ' class="is-now"' : ''}><span>${i + 1}위</span><b>${v.toFixed(1)}초</b></li>`).join('');
    pResult.className = `sumi-play-result is-${result}`;
    pResult.innerHTML = result === 'clear'
      ? `<strong>클리어!</strong><p class="sumi-play-big">${t.toFixed(1)}<small>초</small></p><p class="sumi-play-tag">${best ? '새 기록!' : rank ? `내 기록 ${rank}위` : '기록 밖'}</p>${rows ? `<ol>${rows}</ol>` : ''}`
      : `<strong>아깝다!</strong><p class="sumi-play-big">${left}<small>마리 남음</small></p><p class="sumi-play-tag">다음엔 잡을 수 있어</p>${rows ? `<ol>${rows}</ol>` : ''}`;
    pResult.hidden = false; pResult.classList.remove('is-on'); void pResult.offsetWidth; pResult.classList.add('is-on');
    clearTimeout(resultTimer); resultTimer = setTimeout(() => { pResult.hidden = true; }, 3800);
  }
  // the ring shows the element's rule: one band per hit (lightning) or freeze (ice) still needed, the
  // outer band cracking off as one is used; ice: frozen (filled) or not freezable yet (dashed, dim);
  // fire: a heat gauge round the ring; dark: the mob's colour, thicker when a touch breaks it now (the
  // orb's and the chick's colour too), and the big one dashed with a lock until it is the last
  function syncRing(m, E, fixedLeft, coat) {
    const el = round.element, ring = m.ring;
    const need = Math.max(1, el === 'lightning' ? E.hits[m.tier] - m.hits : el === 'ice' ? E.freezes[m.tier] - m.freezes : 1);
    if (need !== m.ringN) {
      const bands = [...ring.querySelectorAll('.sumi-ring-band:not(.is-crack)')];
      for (let i = bands.length - 1; i >= need; i--) { const b = bands[i]; b.classList.add('is-crack'); setTimeout(() => b.remove(), 420); }
      for (let i = bands.length; i < need; i++) { const b = document.createElement('i'); b.className = 'sumi-ring-band'; b.style.setProperty('--k', String(i)); ring.append(b); }
      m.ringN = need;
    }
    let state = '';
    if (el === 'ice') state = round.clock < m.frozenUntil ? 'frozen' : round.clock < m.immuneUntil ? 'immune' : '';
    else if (el === 'dark') {
      const locked = m.tier === 2 && fixedLeft;
      // 'next': it breaks on a touch now (the orb, the chick and the mob all alike)
      state = `${m.shownColor}${locked ? ' locked' : m.shownColor === round.next && m.shownColor === coat ? ' next' : ''}`;
    }
    if (state !== m.ringState) { m.ringState = state; ring.dataset.state = state; m.el.classList.toggle('is-frozen', state === 'frozen'); }
    if (el === 'fire') {
      const q = Math.min(1, m.heat / E.expose[m.tier]).toFixed(2);
      if (q !== m.ringP) { m.ringP = q; ring.style.setProperty('--p', q); ring.classList.toggle('is-hot', q > 0); }
    }
  }
  // the HUD each frame, under the site header: the count, the clock and the bar for the time left
  // (red and pulsing for the last 5 s); returns its bottom so the top pins sit below it
  function updatePlay(s) {
    const top = Math.max(10, (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) + 10);
    pHud.style.top = `${top}px`;
    pHud.hidden = false;
    pIcon.textContent = ICON[round.element];
    play.dataset.element = round.element;
    pNext.hidden = round.element !== 'dark';
    if (round.element === 'dark' && pNextDot.dataset.color !== round.next) pNextDot.dataset.color = round.next;
    pCoat.hidden = round.element !== 'dark' || !s.coat;
    if (!pCoat.hidden && pCoatDot.dataset.color !== s.coat) pCoatDot.dataset.color = s.coat;
    const left = String(round.mobs.length);
    if (pLeft.textContent !== left) { pLeft.textContent = left; pHud.classList.remove('is-tick'); void pHud.offsetWidth; pHud.classList.add('is-tick'); }
    pTotal.textContent = `/${round.total}`;
    pTime.textContent = round.clock < 0 ? '준비' : `${round.clock.toFixed(1)}초`;   // the countdown: not a negative clock
    const k = startLeft > 0 ? Math.max(0, Math.min(1, (s.timeLeft ?? startLeft) / startLeft)) : 1;
    pBar.style.transform = `scaleX(${k.toFixed(4)})`;
    pHud.classList.toggle('is-urgent', (s.timeLeft ?? 99) < 5);
    return pHud.getBoundingClientRect().bottom;
  }
  let round = null, records = loadRecords(), resultUntil = 0, lastHud = '', spent = false;   // spent: this charge already had its round
  // debug overlay: a canvas over the mobs
  let overlay = null, strokes = [], breath = null;
  function drawHits(s = {}) {
    if (!C.showHits || !round) { if (overlay) overlay.hidden = true; return; }
    if (!overlay) { overlay = document.createElement('canvas'); overlay.className = 'sumi-game-hits'; document.body.append(overlay); }
    overlay.hidden = false;
    const E = C.elements[round.element], dpr = Math.min(2, devicePixelRatio || 1), w = viewW(), h = viewH();
    if (overlay.width !== Math.round(w * dpr) || overlay.height !== Math.round(h * dpr)) { overlay.width = Math.round(w * dpr); overlay.height = Math.round(h * dpr); }
    const ctx = overlay.getContext('2d'), now = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    // the walls
    { const side = sideWalls(), sy0 = scrollY; ctx.strokeStyle = 'rgba(255, 40, 40, .85)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(side.left, 0); ctx.lineTo(side.left, h); ctx.moveTo(side.right, 0); ctx.lineTo(side.right, h);
      for (const y of [round.wall.top - sy0, round.wall.bottom - sy0]) if (y > 0 && y < h) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke(); ctx.setLineDash([]); }
    if (round.element === 'lightning') {
      // the move: a band as wide as twice the margin, fading over a second
      strokes = strokes.filter(k => now - k.t < 1000);
      for (const k of strokes) {
        const a = 1 - (now - k.t) / 1000;
        ctx.strokeStyle = `rgba(255, 210, 40, ${0.35 * a})`; ctx.lineWidth = E.reach * 2;
        ctx.beginPath(); ctx.moveTo(k.a.x, k.a.y); ctx.lineTo(k.b.x, k.b.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255, 120, 0, ${0.9 * a})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(k.a.x, k.a.y); ctx.lineTo(k.b.x, k.b.y); ctx.stroke();
      }
    } else if (round.element === 'fire' && breath) {
      // the breath's cone
      const b = breath, dx = b.to.x - b.from.x, dy = b.to.y - b.from.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      const ex = b.from.x + ux * E.length, ey = b.from.y + uy * E.length, nx = -uy, ny = ux, w0 = 12, w1 = E.width / 2;
      ctx.fillStyle = 'rgba(255, 110, 30, .28)'; ctx.strokeStyle = 'rgba(255, 80, 0, .9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.from.x + nx * w0, b.from.y + ny * w0); ctx.lineTo(ex + nx * w1, ey + ny * w1);
      ctx.lineTo(ex - nx * w1, ey - ny * w1); ctx.lineTo(b.from.x - nx * w0, b.from.y - ny * w0); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (round.element === 'ice' && s.pillars) {   // the walking pillars' reach
      ctx.strokeStyle = 'rgba(120, 220, 255, .9)'; ctx.fillStyle = 'rgba(120, 220, 255, .18)'; ctx.lineWidth = 1.5;
      for (const p of s.pillars) { ctx.beginPath(); ctx.arc(p.x, p.y, E.pillarR, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    if (round.element === 'dark' && s.chick) {   // the chick's reach, in its colour
      ctx.strokeStyle = s.coat === 'black' ? 'rgba(0, 0, 0, .9)' : 'rgba(255, 255, 255, .95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.chick.x, s.chick.y, E.touchR, 0, Math.PI * 2); ctx.stroke();
    }
    // each mob's body (its hit circle), with its progress
    const sy = scrollY;
    ctx.font = '600 11px Pretendard, sans-serif'; ctx.textAlign = 'center';
    for (const m of round.mobs) {
      const y = m.y - sy, r = E.hitR[m.tier];
      if (y < -r || y > h + r) continue;
      const touched = round.element === 'fire' ? m.heat > 0 : round.element === 'ice' ? m.freezes > 0 : m.hits > 0;
      ctx.strokeStyle = touched ? 'rgba(255, 60, 60, .95)' : 'rgba(40, 200, 255, .95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff';
      const nowS = round.clock;
      const label = round.element === 'fire' ? `${m.heat.toFixed(2)}/${E.expose[m.tier]}s`
        : round.element === 'ice' ? `${m.freezes}/${E.freezes[m.tier]}${nowS < m.frozenUntil ? ' 얼음' : nowS < m.immuneUntil ? ' 면역' : ''}`
        : round.element === 'dark' ? (m.shownColor === 'black' ? '검' : '흰') + (m.tier === 2 ? ' (바뀜)' : '')
        : `${m.hits}/${E.hits[m.tier]}`;
      ctx.fillText(label, m.x, y - r - 4);
    }
  }

  // a mob's drawn size: the element's own `size` if it has one, else the shared one
  function sizeOf(E, tier) { return (E.size || C.size)[tier]; }
  function source(img, tier, E) {
    // where the mob comes out: the icon itself, or (a card logo hidden in a closed panel) its card's thumbnail
    let r = img.getBoundingClientRect();
    if (r.width < 2) r = img.closest('.work-card')?.querySelector('.work-card-visual')?.getBoundingClientRect() || r;
    const x = r.width > 1 ? r.left + r.width / 2 : viewW() * (0.2 + Math.random() * 0.6);
    const y = (r.height > 1 ? r.top + r.height / 2 : viewH() * (0.3 + Math.random() * 0.4)) + scrollY;
    const side = sideWalls(), half = sizeOf(E, tier) / 2;
    return { img, tier, x: Math.min(side.right - half, Math.max(side.left + half, x)), y };
  }
  // the page's top and bottom walls (page coordinates), read once when the mobs come out
  function pageWalls(docH) {
    const sy = scrollY, eyebrow = document.querySelector('.hero .eyebrow, .hero-copy'), last = document.querySelector('#approach-title');
    const er = eyebrow?.getBoundingClientRect(), lr = last?.getBoundingClientRect();
    const top = er && er.height ? er.top + sy - C.walls.top : 80;
    const bottom = lr && lr.height ? lr.top + sy + lr.height * C.walls.bottom : docH - 10;
    return { top: Math.max(0, top), bottom: Math.max(top + 100, Math.min(docH, bottom)) };
  }
  // the side walls (viewport px), from the current window width
  function sideWalls() { const W = viewW(), m = W * C.walls.side; return { left: m, right: W - m }; }
  function start(element) {
    const E = C.elements[element], pools = candidates(), mobs = [];
    pools.forEach((pool, tier) => {
      // distinct pictures first, then repeats
      const seen = new Set(), unique = [], rest = [];
      for (const img of shuffle([...pool])) { const k = img.currentSrc || img.src; (seen.has(k) ? rest : unique).push(img); seen.add(k); }
      for (const img of [...unique, ...rest].slice(0, Math.max(0, E.count[tier] | 0))) mobs.push(source(img, tier, E));
    });
    const docH = document.documentElement.scrollHeight;
    const wall = pageWalls(docH);
    for (const m of mobs) {
      const el = document.createElement('img');
      el.className = `sumi-mob sumi-mob-${TIER_NAME[m.tier]}${polished(element) ? ` sumi-mob-live sumi-mob-live-${element}` : ''}`;
      el.style.animationDelay = `${(-Math.random() * 1.6).toFixed(2)}s`;   // the live wobble, out of step
      el.src = m.img.currentSrc || m.img.src;
      el.alt = '';
      el.style.width = el.style.height = `${sizeOf(E, m.tier)}px`;
      // the pin at the top or bottom edge while the mob is off screen: an arrow and the mob's picture
      const pin = document.createElement('span');
      pin.className = `sumi-mob-pin sumi-mob-pin-${TIER_NAME[m.tier]}`;
      pin.hidden = true;
      const pic = document.createElement('img'); pic.src = el.src; pic.alt = ''; pin.append(pic);
      m.pin = pin; m.pinDir = ''; m.id = mobs.indexOf(m);   // id: stable for the round (checks follow a mob by it)
      layer.append(el, pin);
      // polished: a ring a little larger than the icon, breathing, its rim shining now and then, marks the
      // target; syncRing shows the element's rule on it (hits or freezes left, heat, colour, lock)
      if (polished(element)) {
        const ring = document.createElement('div');
        ring.className = `sumi-mob-ring sumi-mob-ring-${element}`;
        if (element === 'fire') ring.innerHTML = '<b class="sumi-ring-heat"></b>';
        if (element === 'dark' && m.tier === 2) ring.innerHTML = '<b class="sumi-ring-lock">🔒</b>';
        const d = sizeOf(E, m.tier) + RING_PAD * 2;
        ring.style.width = ring.style.height = `${d}px`;
        ring.style.animationDelay = el.style.animationDelay;
        ring.style.visibility = 'hidden';
        m.ring = ring; m.ringD = d;
        layer.insertBefore(ring, el);
      }
      const a = Math.random() * Math.PI * 2;
      Object.assign(m, { el, dx: Math.cos(a), dy: Math.sin(a), turnAt: 0, hits: 0, heat: 0, shown: null, freezes: 0, frozenUntil: 0, immuneUntil: 0,
        color: m.tier < 2 ? (mobs.indexOf(m) % 2 ? 'white' : 'black') : '', phase: Math.random(), shownColor: '',
        yMin: 0, yMax: 0 });
      const r = sizeOf(E, m.tier) / 2;
      m.y = Math.min(wall.bottom - r, Math.max(wall.top + r, m.y));   // starts inside the walls
      m.yMin = Math.max(wall.top + r, m.y - E.roam * viewH()); m.yMax = Math.min(wall.bottom - r, m.y + E.roam * viewH());
      if (m.yMin > m.yMax) m.yMin = m.yMax = (m.yMin + m.yMax) / 2;
      m.img.style.visibility = 'hidden';   // the page's icon is out playing
    }
    // dark: the colour to break next, always black or white; the first is picked at the start
    round = { element, key: settingsKey(element), mobs, total: mobs.length, clock: -1, ready: 0, intro: false, next: Math.random() < 0.5 ? 'black' : 'white', wall };   // dark: the colour to break next ('' = either)
    resultUntil = 0;
  }
  function remove(m) { m.el.remove(); m.pin?.remove(); m.ring?.remove(); m.img.style.visibility = ''; }
  function finish(result) {
    if (!round) return;
    for (const m of round.mobs) remove(m);
    let text;
    if (result === 'clear') {
      const t = Math.round(round.clock * 10) / 10, list = records[round.key] || [];
      const best = list.length === 0 || t < list[0];
      list.push(t); list.sort((a, b) => a - b); records[round.key] = list.slice(0, 3); saveRecords(records);
      const rank = records[round.key].indexOf(t) + 1;
      text = `클리어 ${t.toFixed(1)}초 · ${best ? '새 기록!' : rank ? `내 기록 ${rank}위` : '기록 밖'}`;
    } else text = result === 'fail' ? `아깝다! 남은 몹 ${round.mobs.length}` : '';
    pHud.hidden = true; pBanner.hidden = true; pLeftPop.hidden = true;
    if (polished(round.element) && (result === 'clear' || result === 'fail')) {
      const t = Math.round(round.clock * 10) / 10, list = records[round.key] || [];
      const rank = result === 'clear' ? list.indexOf(t) + 1 : 0;
      showResult(round.key, result, t, rank, /새 기록/.test(text), round.mobs.length);
      hud.classList.add('is-quiet');
    } else hud.classList.remove('is-quiet');
    round = null; strokes = []; breath = null; if (overlay) overlay.hidden = true;
    if (text) { showHud(text); resultUntil = performance.now() + 4000; } else hud.hidden = true;
  }
  function showHud(text) { if (text !== lastHud) { lastHud = text; hud.textContent = text; } hud.hidden = false; }
  // dark: a mob's colour now (the largest switch every `flicker` s; the others keep theirs)
  function colorOf(m, E, t) { return m.tier < 2 ? m.color : (Math.floor(t / E.flicker + m.phase) % 2 ? 'white' : 'black'); }
  function speedFor(m, E) {
    const t = Math.max(0, round.clock);
    // the multiplier ramps smoothly: rate[0] at 0 s to rate[1] at 10 s to rate[2] at 15 s, then holds
    const [a, b, c] = E.rate, k = t < 10 ? a + (b - a) * t / 10 : t < 15 ? b + (c - b) * (t - 10) / 5 : c;
    return E.speed[m.tier] * (viewW() / 1440) * k;
  }

  return {
    // per frame from fireMode: s = {element, charged, playing (transformation done), dialog,
    // breath: {from, to} in viewport px while the fire breath is on (page only)}
    update(dt, s) {
      if (!enabled) return;
      if (!round) {
        if (resultUntil && performance.now() > resultUntil) { resultUntil = 0; hud.hidden = true; }
        if (!s.charged) spent = false;
        else if (!spent && ELEMENTS.includes(s.element) && !s.dialog) { spent = true; start(s.element); }
        return;
      }
      if (!s.charged || s.element !== round.element) { finish(round.mobs.length ? 'fail' : 'clear'); return; }
      // after the transformation: the ready countdown (mobs out and still, the banner with "3 2 1"),
      // then the clock starts with "시작!"
      if (round.clock < 0) {
        if (!s.playing) return;
        if (!round.intro) {
          round.intro = true;
          if (polished(round.element)) { play.dataset.element = round.element; banner(`${ICON[round.element]} ${NAME[round.element]} 사냥!`, HOWTO[round.element](round.total)); }
          scrollToMobs();
        }
        round.ready += dt;
        const n = String(Math.max(1, Math.ceil(C.ready - round.ready)));
        if (polished(round.element) && round.ready < C.ready && pCount.textContent !== n) { pCount.textContent = n; pCount.classList.remove('is-on'); void pCount.offsetWidth; pCount.classList.add('is-on'); }
        if (round.ready >= C.ready) {
          round.clock = 0;
          if (polished(round.element)) { startLeft = s.timeLeft || 0; if (C.ready > 0) leftPop(99, '시작!', ''); else pBanner.hidden = !pBanner.classList.contains('is-on'); }
        }
      }
      const live = round.clock >= 0;   // the countdown: mobs shown but still, nothing breaks
      if (live) round.clock += dt;
      const E = C.elements[round.element], now = performance.now() / 1000, H = viewH(), sy = scrollY, side = sideWalls();
      breath = round.element === 'fire' ? s.breath || null : null;
      let above = 0, below = 0;
      const fixedLeft = round.mobs.some(m => m.tier < 2);   // dark: the largest break only once these are gone
      const W = viewW(), pinTop = polished(round.element) ? updatePlay(s) + 12 : Math.max(12, (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) + 12);   // pins sit below the header (and the play HUD)
      const broken = [];   // polished: broken this frame, for the bursts and the count in the middle
      const kill = (m, y) => { if (E.polish) { burst(m, m.x, y); broken.push(m); } remove(m); return false; };
      round.mobs = round.mobs.filter(m => {
        if (live && now >= m.turnAt) {   // a gentle change of heading now and then
          const a = Math.atan2(m.dy, m.dx) + (Math.random() - 0.5) * 1.4;
          m.dx = Math.cos(a); m.dy = Math.sin(a);
          m.turnAt = now + C.turn[0] + Math.random() * (C.turn[1] - C.turn[0]);
        }
        const frozen = round.clock < m.frozenUntil, v = frozen || !live ? 0 : speedFor(m, E) * dt, r = sizeOf(E, m.tier) / 2;
        m.x += m.dx * v; m.y += m.dy * v;
        if (m.x < side.left + r) { m.x = side.left + r; m.dx = Math.abs(m.dx); } else if (m.x > side.right - r) { m.x = side.right - r; m.dx = -Math.abs(m.dx); }
        if (m.y < m.yMin) { m.y = m.yMin; m.dy = Math.abs(m.dy); } else if (m.y > m.yMax) { m.y = m.yMax; m.dy = -Math.abs(m.dy); }
        const y = m.y - sy;
        // fire: the breath heats what it covers; heat cools off it
        if (round.element === 'fire' && live) {
          if (breath && inBreath(m.x, y, E.hitR[m.tier], breath, E)) m.heat += dt;
          else m.heat = Math.max(0, m.heat - E.decay * dt);
          if (m.heat >= E.expose[m.tier]) return kill(m, y);
        }
        // ice: a walking pillar freezes a mob that isn't frozen or still thawing; the last freeze breaks it
        // (game time, not the wall clock); a pillar on a thawed mob that can't freeze yet shows a cross
        if (round.element === 'ice' && s.pillars && live) {
          const reach = E.pillarR + E.hitR[m.tier];
          if (s.pillars.some(p => Math.hypot(p.x - m.x, p.y - y) <= reach)) {
            if (round.clock >= m.immuneUntil) {
              if (++m.freezes >= E.freezes[m.tier]) return kill(m, y);
              m.frozenUntil = round.clock + E.freezeTime; m.immuneUntil = m.frozenUntil + E.immune;
            } else if (round.clock >= m.frozenUntil) nope(m, y);
          }
        }
        // dark: the chick breaks a small or medium mob of its own colour by touching it, in
        // alternating order; the largest (switching colour) can only go last, once the others are
        // gone, and then only when the orb, the chick and the mob all show the same colour; any
        // other touch pushes the mob away
        if (round.element === 'dark') {
          const col = colorOf(m, E, round.clock);
          if (col !== m.shownColor) { m.shownColor = col; for (const e of [m.el, m.pin]) { e.classList.toggle('is-black', col === 'black'); e.classList.toggle('is-white', col === 'white'); } }
          if (live && s.chick && Math.hypot(s.chick.x - m.x, s.chick.y - y) <= E.touchR + E.hitR[m.tier]) {
            const breaks = col === s.coat && round.next === col && (m.tier < 2 || !fixedLeft);
            if (breaks) { round.next = col === 'black' ? 'white' : 'black'; return kill(m, y); }
            const ax = m.x - s.chick.x, ay = y - s.chick.y, l = Math.hypot(ax, ay);
            if (l > 0.5) { m.dx = ax / l; m.dy = ay / l; } else { const a = Math.random() * Math.PI * 2; m.dx = Math.cos(a); m.dy = Math.sin(a); }
            nope(m, y);
          }
        }
        const show = y > -r && y < H + r;
        if (!show) { if (y < 0) above++; else below++; }
        if (show !== m.shown) { m.shown = show; m.el.style.visibility = show ? 'visible' : 'hidden'; if (m.ring) m.ring.style.visibility = m.el.style.visibility; }
        // placed with `translate`, not `transform`: the live wobble animates `rotate` and `scale`,
        // which CSS applies after `translate` but before `transform`, so a transform position would be
        // scaled and rotated around the screen corner and drift off the hit circle
        if (show) {
          m.el.style.translate = `${(m.x - r).toFixed(1)}px ${(y - r).toFixed(1)}px`;
          if (m.ring) { m.ring.style.translate = `${(m.x - m.ringD / 2).toFixed(1)}px ${(y - m.ringD / 2).toFixed(1)}px`; syncRing(m, E, fixedLeft, s.coat); }
        }
        // off screen: a pin at the top edge (below the header) or the bottom edge, at the mob's x
        const dir = show ? '' : y < 0 ? 'up' : 'down';
        if (dir !== m.pinDir) { m.pinDir = dir; m.pin.hidden = !dir; if (dir) m.pin.dataset.dir = dir; }
        if (dir) m.pin.style.transform = `translate3d(${Math.min(W - 24, Math.max(24, m.x)).toFixed(1)}px, ${(dir === 'up' ? pinTop : H - 12).toFixed(1)}px, 0)`;
        return true;
      });
      if (broken.length && round.mobs.length) leftPop(round.mobs.length);
      if (!round.mobs.length) { finish('clear'); return; }
      if (round.element === 'dark') {
        const fixed = round.mobs.filter(m => m.tier < 2);
        if (fixed.length && !fixed.some(m => m.color === round.next)) {
          // never a dead end: if no small or medium mob shows the colour due next, the one farthest
          // from the chick turns to that colour, so the order always keeps alternating
          const c = s.chick, far = fixed.reduce((a, m) => !c || Math.hypot(m.x - c.x, m.y - sy - c.y) > Math.hypot(a.x - c.x, a.y - sy - c.y) ? m : a);
          far.color = round.next; far.recolored = (far.recolored || 0) + 1;
        }
      }
      drawHits(s);
      const dot = c => c === 'black' ? '검' : '흰';
      const order = round.element === 'dark' ? ` · 병아리 ${dot(s.coat)} · 다음 ${dot(round.next)}` : '';
      hud.classList.toggle('is-quiet', polished(round.element));   // the play HUD shows it; the text stays for the checks
      showHud(`남은 몹 ${round.mobs.length}/${round.total} · ${round.clock.toFixed(1)}초${order}${above ? ` · ↑${above}` : ''}${below ? ` · ↓${below}` : ''}`);
    },
    // Lightning: a quick attack on the page, tested along the straight line of the move as the
    // chick really advances: every frame fireMode hands over the stretch covered (viewport px). A
    // mob near that stretch, at its position now, is hit, at most once per move (dashId).
    sweep(from, to, dashId) {
      if (!round || round.clock < 0 || round.element !== 'lightning') return 0;
      const E = C.elements.lightning, sy = scrollY, ex = to.x - from.x, ey = to.y - from.y, len2 = ex * ex + ey * ey;
      if (C.showHits) strokes.push({ a: { ...from }, b: { ...to }, t: performance.now() });
      let cleared = 0;
      round.mobs = round.mobs.filter(m => {
        if (m.lastDash === dashId) return true;
        const px = m.x, py = m.y - sy, t = len2 ? Math.max(0, Math.min(1, ((px - from.x) * ex + (py - from.y) * ey) / len2)) : 0;
        const d = Math.hypot(px - from.x - ex * t, py - from.y - ey * t);
        if (d > E.hitR[m.tier] + E.reach) return true;
        m.lastDash = dashId;
        if (++m.hits < E.hits[m.tier]) { if (E.polish) hitFlash(m); return true; }
        if (E.polish) {
          burst(m, px, py);
          if (combo.id !== dashId) combo = { id: dashId, n: 0, el: combo.el };
          if (++combo.n >= 2) comboText(combo.n, px, py - E.hitR[m.tier] - 10);
        }
        remove(m); cleared++;
        return false;
      });
      if (cleared && E.polish && round.mobs.length) leftPop(round.mobs.length);
      if (!round.mobs.length) finish('clear');
      return cleared;
    },
    // debug: end this round now; a new one starts at once if the element still lasts
    restart() { finish(''); spent = false; },
    get round() { return round ? { element: round.element, left: round.mobs.length, total: round.total, clock: round.clock, mobs: round.mobs.map(m => ({ id: m.id, tier: m.tier, x: m.x, y: m.y - scrollY, hits: m.hits, heat: m.heat, shown: m.shown, freezes: m.freezes, frozen: round.clock < m.frozenUntil, color: m.shownColor, dx: m.dx, dy: m.dy, recolored: m.recolored || 0 })), next: round.next, wall: round.wall } : null; },
    // dark: the colour to break next, for the orb above the chick's head; set from the start of the transform (null outside a dark round)
    get cue() { return round && round.element === 'dark' ? round.next : null; },
    // each element's top 3 for its current settings (older settings' lists stay stored, unshown)
    get records() { return Object.fromEntries(ELEMENTS.map(e => [e, records[settingsKey(e)]]).filter(([, l]) => l)); },
    get hud() { return hud.hidden ? '' : hud.textContent; },
    stop() { finish(''); },
    dispose() { finish(''); removeEventListener('keydown', onKey); clearTimeout(bannerTimer); clearTimeout(resultTimer); clearTimeout(leftTimer); layer.remove(); hud.remove(); play.remove(); overlay?.remove(); },
  };
}

// Tuning panel for the game (local or ?growthDebug=1 only): edits GAME_CONFIG live, one element at
// a time (a tab per element; it follows the element being played). Its test aids start on: hit
// areas shown, page text and projects not selectable, project cards not clickable.
const FIELDS = {
  common: [['몹 수 소', 'count', 0, 1], ['몹 수 중', 'count', 1, 1], ['몹 수 대', 'count', 2, 1],
    ['속도 소', 'speed', 0, 10], ['속도 중', 'speed', 1, 10], ['속도 대', 'speed', 2, 10],
    ['속도 배율 0초', 'rate', 0, 0.1], ['속도 배율 10초', 'rate', 1, 0.1], ['속도 배율 15초~', 'rate', 2, 0.1],
    ['몹 판정 반지름 소', 'hitR', 0, 2], ['몹 판정 반지름 중', 'hitR', 1, 2], ['몹 판정 반지름 대', 'hitR', 2, 2],
    ['이동 범위(화면 높이)', 'roam', null, 0.1],
    ['병아리 걷기 속도 배율', 'walk', null, 0.1], ['순간이동 속도 배율', 'blinkSpeed', null, 0.1]],
  lightning: [['타격 횟수 소', 'hits', 0, 1], ['타격 횟수 중', 'hits', 1, 1], ['타격 횟수 대', 'hits', 2, 1], ['판정 여유(px)', 'reach', null, 5]],
  fire: [['필요 노출 소(초)', 'expose', 0, 0.05], ['필요 노출 중(초)', 'expose', 1, 0.05], ['필요 노출 대(초)', 'expose', 2, 0.05],
    ['식는 속도(초/초)', 'decay', null, 0.1], ['브레스 길이(px)', 'length', null, 10], ['브레스 끝 폭(px)', 'width', null, 10]],
  ice: [['빙결 횟수 소', 'freezes', 0, 1], ['빙결 횟수 중', 'freezes', 1, 1], ['빙결 횟수 대', 'freezes', 2, 1],
    ['얼어 있는 시간(초)', 'freezeTime', null, 0.1], ['재빙결 불가 시간(초)', 'immune', null, 0.1], ['기둥 판정 반지름(px)', 'pillarR', null, 5]],
  dark: [['병아리 접촉 반지름(px)', 'touchR', null, 5], ['큰 몹 색 바뀜 간격(초)', 'flicker', null, 0.1], ['큰 몹 크기(px)', 'size', 2, 4]],
};
const LABEL = { lightning: '번개', fire: '불', ice: '얼음', dark: '어둠' };
const WALL_FIELDS = [['벽 좌우 여백(화면 폭 비율)', 'side', 0.005], ['벽 위: 히어로 위로(px)', 'top', 5], ['벽 아래: 마지막 제목 높이 비율', 'bottom', 0.05]];
export function createMinigameDebug({ onRestart } = {}) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('growthDebug') !== '1') return null;
  const C = GAME_CONFIG, html = document.documentElement, panel = document.createElement('details');
  panel.className = 'sumi-game-debug';
  panel.dataset.sumiControl = 'game-debug';
  panel.innerHTML = `<summary>미니게임 수치 <span>(MVP)</span></summary>
    <div class="sumi-game-debug-tabs">${ELEMENTS.map(e => `<button type="button" data-game-tab="${e}">${LABEL[e] || e}</button>`).join('')}</div>
    <div class="sumi-game-debug-body"></div>
    <p class="sumi-game-debug-note">몹 수·이동 범위는 다음 판부터, 나머지는 바로 적용됩니다.</p>
    <label class="sumi-game-debug-check"><input type="checkbox" data-game-hits checked> 판정 범위 보기</label>
    <label class="sumi-game-debug-check"><input type="checkbox" data-game-noselect checked> 텍스트 선택·드래그 막기</label>
    <label class="sumi-game-debug-check"><input type="checkbox" data-game-nodrag checked> 프로젝트 드래그 막기 (상세페이지 선택 포함)</label>
    <label class="sumi-game-debug-check"><input type="checkbox" data-game-nocards checked> 프로젝트 클릭(상세페이지 열기) 막기 (마우스 올림·썸네일 재생은 됨)</label>
    <button type="button" data-game-restart>지금 판 다시 시작</button>`;
  const body = panel.querySelector('.sumi-game-debug-body');
  let tab = ELEMENTS[0];
  function render() {
    const E = C.elements[tab];
    for (const b of panel.querySelectorAll('[data-game-tab]')) b.setAttribute('aria-pressed', String(b.dataset.gameTab === tab));
    body.innerHTML = '';
    const head = document.createElement('p'); head.className = 'sumi-game-debug-head'; head.textContent = '벽 (모든 원소 공통 · 위·아래는 다음 판부터)'; body.append(head, document.createElement('span'));
    for (const [label, key, step] of WALL_FIELDS) {
      const id = `sumi-game-wall-${key}`, l = document.createElement('label'), input = document.createElement('input');
      l.htmlFor = id; l.textContent = label;
      Object.assign(input, { id, type: 'number', step: String(step), value: String(C.walls[key]) });
      input.addEventListener('input', () => { const v = Number(input.value); if (Number.isFinite(v)) C.walls[key] = v; });
      body.append(l, input);
    }
    const head2 = document.createElement('p'); head2.className = 'sumi-game-debug-head'; head2.textContent = `${LABEL[tab] || tab} 수치`; body.append(head2, document.createElement('span'));
    for (const [label, key, i, step] of [...FIELDS.common, ...(FIELDS[tab] || [])]) {
      const id = `sumi-game-${tab}-${key}-${i ?? 'v'}`, l = document.createElement('label'), input = document.createElement('input');
      l.htmlFor = id; l.textContent = label;
      Object.assign(input, { id, type: 'number', step: String(step), value: String(i === null ? E[key] : E[key][i]) });
      input.addEventListener('input', () => { const v = Number(input.value); if (!Number.isFinite(v)) return; if (i === null) E[key] = v; else E[key][i] = v; });
      body.append(l, input);
    }
  }
  panel.addEventListener('click', e => { const t = e.target.closest('[data-game-tab]'); if (t) { tab = t.dataset.gameTab; render(); } });
  render();
  // test aids: on by default here
  const aids = { hits: v => { C.showHits = v; }, noselect: v => html.classList.toggle('sumi-game-noselect', v),
    nodrag: v => html.classList.toggle('sumi-game-nodrag', v), nocards: v => html.classList.toggle('sumi-game-nocards', v) };
  for (const [k, set] of Object.entries(aids)) { const box = panel.querySelector(`[data-game-${k}]`); set(box.checked); box.addEventListener('change', () => set(box.checked)); }
  panel.querySelector('[data-game-restart]').addEventListener('click', () => onRestart?.());
  const noDrag = e => {
    if (e.target.closest?.('.sumi-game-debug')) return;
    if (html.classList.contains('sumi-game-noselect') || (html.classList.contains('sumi-game-nodrag') && e.target.closest?.('.work-card, .project-dialog'))) e.preventDefault();
  };
  document.addEventListener('dragstart', noDrag);
  // project click aid: only the click is stopped (before the page's own handlers), so hovering still
  // opens the card and plays its thumbnail, and the chick still gets the press (pointerdown)
  const noCardClick = e => {
    if (html.classList.contains('sumi-game-nocards') && e.target.closest?.('.work-card') && !e.target.closest('.sumi-game-debug')) { e.preventDefault(); e.stopPropagation(); }
  };
  window.addEventListener('click', noCardClick, true);
  document.body.append(panel);
  return {
    setVisible(v) { panel.hidden = !v; },
    // follows the element being played, so its numbers are the ones shown
    showElement(e) { if (ELEMENTS.includes(e) && e !== tab) { tab = e; render(); } },
    get tab() { return tab; },
    dispose() { document.removeEventListener('dragstart', noDrag); window.removeEventListener('click', noCardClick, true); html.classList.remove('sumi-game-noselect', 'sumi-game-nodrag', 'sumi-game-nocards'); C.showHits = false; panel.remove(); },
  };
}
