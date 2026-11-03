// Optional page-wide companion. It never owns page pointer events or changes layout.
const button = document.querySelector('[data-sumi-control]');
const canvas = document.querySelector('[data-sumi-canvas]');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const status = document.querySelector('[data-sumi-status]');
let enabled = finePointer.matches && !motion.matches;
let scene, loading, failed = false, pageAway = false;
let activity = '';

function suspended() {
  return document.hidden || pageAway || Boolean(document.querySelector('dialog[open]'));
}

function sync() {
  const active = enabled && !suspended() && !failed;
  button.hidden = Boolean(document.querySelector('dialog[open]'));
  button.setAttribute('aria-pressed', String(enabled && !failed));
  button.setAttribute('aria-busy', String(Boolean(loading)));
  button.dataset.state = failed ? 'error' : loading ? 'loading' : enabled ? 'on' : 'off';
  const label = failed ? '병아리를 불러오지 못했습니다. 다시 시도' : enabled ? '병아리 숨기기' : '병아리 켜기';
  button.setAttribute('aria-label', label);
  button.title = enabled && activity && !failed ? `${label} · ${activity}` : label;
  canvas.hidden = !active || !scene;
  scene?.setActive(active);
}

async function load() {
  if (scene || loading || !enabled || suspended()) return;
  failed = false;
  loading = import('./sumi-chick-scene.js?v=chewy-trail-20261103');
  sync();
  try {
    const { createSumiChick } = await loading;
    scene = createSumiChick(canvas, {
      onActivity(label) {
        activity = label;
        if (enabled) button.title = `병아리 숨기기 · ${label}`;
      },
    });
    canvas.dataset.ready = 'true';
  } catch (error) {
    failed = true;
    enabled = false;
    status.textContent = '병아리 효과를 불러오지 못했습니다. 포트폴리오는 계속 이용할 수 있습니다.';
    console.warn('Sumi companion unavailable:', error);
  } finally {
    loading = null;
    sync();
  }
}

button.addEventListener('click', () => {
  enabled = !enabled;
  failed = false;
  status.textContent = '';
  sync();
  void load();
});
document.addEventListener('visibilitychange', () => { sync(); void load(); });
document.addEventListener('portfolio:modalchange', () => { sync(); void load(); });
// Also handle native dialog.close(), including the image viewer, without changing app.js.
const dialogs = new MutationObserver(() => { sync(); void load(); });
document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
motion.addEventListener('change', () => {
  if (motion.matches) enabled = false;
  sync();
});
window.addEventListener('pagehide', event => {
  pageAway = true;
  sync();
  if (!event.persisted) { scene?.dispose(); scene = null; dialogs.disconnect(); }
});
window.addEventListener('pageshow', event => { pageAway = false; sync(); if (event.persisted) void load(); });
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  failed = true;
  enabled = false;
  button.disabled = true;
  sync();
  status.textContent = '병아리 효과가 일시 중지되었습니다.';
});
canvas.addEventListener('webglcontextrestored', () => {
  scene?.dispose();
  scene = null;
  failed = false;
  button.disabled = false;
  sync();
});

sync();
// Keep the portfolio's own initial rendering ahead of the optional WebGL download.
if ('requestIdleCallback' in window) requestIdleCallback(() => { void load(); }, { timeout: 1600 });
else setTimeout(() => { void load(); }, 600);
