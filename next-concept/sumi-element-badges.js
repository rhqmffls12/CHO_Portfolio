// Element badges under the chick switch: a small translucent row of fire, lightning, ice and a
// hidden fourth (dark, shown as "?"). Each starts locked. Transforming into an element (20 seeds)
// acquires it; an acquired element can then be summoned from its badge for only BADGE_COST seeds,
// and the seeds beyond that carry over into the next cycle (13 seeds: transform, keep 3).
//
// DOM only, no per-frame work: the scene reports its state when it changes (update()), and the
// row rewrites only the badges whose look changed. Acquired elements last for this page visit
// only: every load starts with all four locked again.
export const BADGE_COST = 10;
const ELEMENTS = ['fire', 'lightning', 'ice', 'dark'];
const NAMES = { fire: '불', lightning: '번개', ice: '얼음', dark: '어둠' };
const INTO = { fire: '불로', lightning: '번개로', ice: '얼음으로', dark: '어둠으로' };
// Locked badges keep the secret: no "element", no "transform", only the chick musing about seeds.
// Each hint points at the real clue, the colour of the first flower seed of a cycle (the head
// flower's colour picks what the chick turns into; sumi-fire-mode.js ELEMENT_BY_PALETTE).
const HINTS = {
  fire: '처음 먹는 씨앗이 빨간 꽃이면… 몸이 후끈후끈해질까? 삐약!',
  lightning: '노란 꽃 씨앗부터 먹으면 찌릿찌릿~ 할 것 같은 기분!',
  ice: '파란 꽃 씨앗으로 시작하면… 시원~해질지도 몰라!',
  dark: '보랏빛 꽃 씨앗엔 비밀이 숨어 있대… 쉿!',
};
const OLD_STORE = 'sumi-element-badges-v1';   // the first version kept them across visits
const RING = 2 * Math.PI * 16;   // the progress ring's circumference (r = 16 in a 36 box)
const ICONS = {
  fire: '<path d="M12.2 2.5c.9 3.2 4.6 5.3 4.6 9.9a4.8 4.8 0 0 1-9.6 0c0-2.1 1-3.6 2.1-4.6 0 2 .9 3.2 2.1 3.2-.1-3.1-.8-5.6.8-8.5z"/>',
  lightning: '<path d="M13.4 2.5 5.2 13.6h5.5l-1.1 7.9 8.2-11.2h-5.5z"/>',
  ice: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.6 4.8 12 6.6l2.4-1.8M9.6 19.2 12 17.4l2.4 1.8M4.6 10.3l2.6-.4.9-2.5M19.4 13.7l-2.6.4-.9 2.5M19.4 10.3l-2.6-.4-.9-2.5M4.6 13.7l2.6.4.9 2.5"/></g>',
  dark: '<path d="M15.2 3.4a8.8 8.8 0 1 0 5.6 14.9 7.1 7.1 0 0 1-5.6-14.9z"/>',
};

export function createElementBadges({ onPick = () => false } = {}) {
  // a fresh start every load; anything the first version left in this browser is cleared
  try { localStorage.removeItem(OLD_STORE); } catch { /* storage unavailable: nothing to clear */ }
  const acquired = new Set();
  const row = document.createElement('div');
  row.className = 'sumi-element-badges';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', '병아리 뱃지');
  row.dataset.sumiControl = '';   // the chick ignores clicks here, and no effect copies it
  row.hidden = true;
  // one speech bubble for the row, shown under the badge the pointer or focus is on
  const tip = document.createElement('span');
  tip.className = 'sumi-badge-tip';
  tip.id = 'sumi-badge-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  let tipFor = null;
  function showTip(b) {
    tipFor = b;
    tip.textContent = b.dataset.tip || '';
    tip.hidden = false;
    // the bubble keeps to the row's right edge; its little tail points at the badge
    const tipBox = tip.getBoundingClientRect(), badgeBox = b.getBoundingClientRect();
    tip.style.setProperty('--tail', `${Math.round(badgeBox.left + badgeBox.width / 2 - tipBox.left)}px`);
    b.setAttribute('aria-describedby', tip.id);
  }
  function hideTip(b) { if (tipFor !== b) return; tipFor = null; tip.hidden = true; b.removeAttribute('aria-describedby'); }
  const badges = {};
  for (const element of ELEMENTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sumi-badge';
    b.dataset.element = element;
    b.innerHTML = `<svg class="sumi-badge-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16"/><circle class="sumi-badge-fill" cx="18" cy="18" r="16" stroke-dasharray="${RING.toFixed(2)}" stroke-dashoffset="${RING.toFixed(2)}"/></svg>`
      + `<svg class="sumi-badge-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${ICONS[element]}</svg>`
      + (element === 'dark' ? '<span class="sumi-badge-mystery" aria-hidden="true">?</span>' : '');
    b.addEventListener('click', () => {
      if (b.dataset.state === 'ready' && onPick(element)) return;
      // not yet: a small shake says so (the label tells why)
      b.classList.remove('is-denied'); void b.offsetWidth; b.classList.add('is-denied');
    });
    b.addEventListener('animationend', e => { if (e.animationName === 'sumi-badge-deny') b.classList.remove('is-denied'); if (e.animationName === 'sumi-badge-pop') b.classList.remove('is-new'); });
    b.addEventListener('pointerenter', () => showTip(b));
    b.addEventListener('focus', () => showTip(b));
    b.addEventListener('pointerleave', () => hideTip(b));
    b.addEventListener('blur', () => hideTip(b));
    row.append(b);
    badges[element] = { el: b, fill: b.querySelector('.sumi-badge-fill'), key: '' };
  }
  row.append(tip);
  document.body.append(row);

  let last = { seeds: 0, element: '', unlocked: false, busy: false };
  function render() {
    const { seeds, element: active, unlocked, busy } = last;
    for (const element of ELEMENTS) {
      const b = badges[element], owned = acquired.has(element);
      const state = unlocked ? (element === active ? 'active' : owned ? 'owned' : 'locked')
        : !owned ? 'locked' : busy || seeds < BADGE_COST ? 'owned' : 'ready';
      const progress = state === 'active' ? 1 : owned ? Math.min(1, seeds / BADGE_COST) : 0;
      const key = `${state}|${progress.toFixed(2)}`;
      if (key === b.key) continue;
      b.key = key;
      b.el.dataset.state = state;
      b.fill.setAttribute('stroke-dashoffset', (RING * (1 - progress)).toFixed(2));
      b.el.setAttribute('aria-disabled', String(state !== 'ready'));
      // locked: the chick's cute hint, the secret kept; once found, the plain facts
      const name = NAMES[element];
      const label = state === 'locked' ? HINTS[element]
        : state === 'active' ? `${name} 변신 중`
        : state === 'ready' ? `${INTO[element]} 변신 (씨앗 ${BADGE_COST}개 사용, ${seeds - BADGE_COST}개 남음)`
        : `${name}: 습득함. 씨앗 ${Math.min(seeds, BADGE_COST)}/${BADGE_COST}`;
      b.el.setAttribute('aria-label', label);
      b.el.dataset.tip = label;   // shown in the bubble (no native title: it would show twice)
      if (tipFor === b.el) tip.textContent = label;
    }
  }
  render();
  return {
    // state: {seeds, element, unlocked, busy} from the scene; transforming into an element acquires it
    update(state) {
      last = { seeds: state.seeds | 0, element: state.element || '', unlocked: Boolean(state.unlocked), busy: Boolean(state.busy) };
      if (last.unlocked && ELEMENTS.includes(last.element) && !acquired.has(last.element)) {
        acquired.add(last.element);
        badges[last.element].el.classList.add('is-new');   // a pop and a glow as it is acquired
      }
      render();
    },
    setVisible(value) { row.hidden = !value; },
    get acquired() { return [...acquired]; },
    get element() { return row; },
    dispose() { row.remove(); },
  };
}
