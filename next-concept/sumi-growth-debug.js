import { growthProgress } from './sumi-growth-stages.js?v=hidden-garden-20261104';

// Local preview only by default; explicitly opt in with ?growthDebug=1 elsewhere.
export function createGrowthDebug({ onChange, onRelease }) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
      new URLSearchParams(location.search).get('growthDebug') !== '1') return null;
  const panel=document.createElement('details');
  panel.className='sumi-growth-debug';panel.dataset.sumiControl='growth-debug';panel.open=true;
  panel.innerHTML=`<summary>GROWTH DEBUG <span>수집 테스트</span></summary>
    <div class="sumi-growth-debug-body">
      <div class="sumi-growth-debug-heading"><label for="sumi-growth-range">씨앗 수집 수</label><output for="sumi-growth-range" data-growth-total>0 / 61</output></div>
      <input id="sumi-growth-range" type="range" min="0" max="61" step="1" value="0" disabled aria-describedby="sumi-growth-info">
      <div class="sumi-growth-debug-marks" aria-hidden="true"><span>0</span><span>20</span><span>40</span><span>61</span></div>
      <p id="sumi-growth-info" data-growth-info>성장 전 · 기본 체형</p>
      <div class="sumi-growth-debug-bottom"><span data-growth-hint>병아리를 켜면 조절할 수 있습니다.</span><button type="button" data-growth-reset disabled>초기화</button></div>
    </div>`;
  document.body.append(panel);
  const range=panel.querySelector('input'),reset=panel.querySelector('[data-growth-reset]');
  function render(progress) {
    range.value=String(Math.min(61,progress.total));
    panel.querySelector('[data-growth-total]').textContent=`${progress.total} / 61`;
    const body=['기본 체형','통통 1단계','통통 2단계','통통 3단계'][progress.tier];
    const label=`${progress.stage} / 20 · ${progress.label} · ${body}`;
    panel.querySelector('[data-growth-info]').textContent=label;
    range.setAttribute('aria-valuetext',`씨앗 ${progress.total}개, ${label}`);
  }
  range.addEventListener('input',()=>{const progress=onChange(Number(range.value));if(progress)render(progress);});
  reset.addEventListener('click',()=>{const progress=onChange(0);if(progress)render(progress);});
  panel.addEventListener('pointerleave',onRelease);
  panel.addEventListener('focusout',event=>{if(!panel.contains(event.relatedTarget))onRelease();});
  panel.addEventListener('toggle',()=>{if(!panel.open)onRelease();});
  render(growthProgress(0));
  return {render,
    sync({active,hidden}) {panel.hidden=hidden;range.disabled=reset.disabled=!active;
      panel.querySelector('[data-growth-hint]').textContent=active?'실제 수집에 반영 · 61개에서 불·번개·얼음 랜덤 변신':'병아리를 켜면 조절할 수 있습니다.';
      if(!active||hidden)onRelease();},
    dispose(){panel.remove();}
  };
}
