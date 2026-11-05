import { growthProgress } from './sumi-growth-stages.js?v=relaxed-garden-20261105';

// Local preview only by default; explicitly opt in with ?growthDebug=1 elsewhere.
export function createGrowthDebug({ onChange, onRelease, onElement = () => {} }) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
      new URLSearchParams(location.search).get('growthDebug') !== '1') return null;
  const panel=document.createElement('details');
  panel.className='sumi-growth-debug';panel.dataset.sumiControl='growth-debug';panel.open=true;
  panel.innerHTML=`<summary>GROWTH DEBUG <span>수집 테스트</span></summary>
    <div class="sumi-growth-debug-body">
      <div class="sumi-growth-debug-heading"><label for="sumi-growth-range">씨앗 수집 수</label><output for="sumi-growth-range" data-growth-total>0 / 20</output></div>
      <input id="sumi-growth-range" type="range" min="0" max="20" step="1" value="0" disabled aria-describedby="sumi-growth-info">
      <div class="sumi-growth-debug-marks" aria-hidden="true"><span>0</span><span>10</span><span>20</span></div>
      <p id="sumi-growth-info" data-growth-info>성장 전 · 기본 체형</p>
      <fieldset class="sumi-growth-debug-element" data-growth-element>
        <legend>변신 원소</legend>
        <label><input type="radio" name="sumi-growth-element" value="auto" checked disabled><span>꽃 색</span></label>
        <label><input type="radio" name="sumi-growth-element" value="fire" disabled><span>불</span></label>
        <label><input type="radio" name="sumi-growth-element" value="lightning" disabled><span>번개</span></label>
        <label><input type="radio" name="sumi-growth-element" value="ice" disabled><span>얼음</span></label>
        <label><input type="radio" name="sumi-growth-element" value="dark" disabled><span>어둠</span></label>
      </fieldset>
      <div class="sumi-growth-debug-bottom"><span data-growth-hint>병아리를 켜면 조절할 수 있습니다.</span><button type="button" data-growth-reset disabled>초기화</button></div>
    </div>`;
  document.body.append(panel);
  const range=panel.querySelector('#sumi-growth-range'),reset=panel.querySelector('[data-growth-reset]');
  const elements=[...panel.querySelectorAll('[name="sumi-growth-element"]')];
  function render(progress) {
    range.value=String(Math.min(20,progress.total));
    panel.querySelector('[data-growth-total]').textContent=`${progress.total} / 20`;
    const body=['기본 체형','통통 1단계','통통 2단계','통통 3단계'][progress.tier];
    const label=`${progress.stage} / 20 · ${progress.label} · ${body}`;
    panel.querySelector('[data-growth-info]').textContent=label;
    range.setAttribute('aria-valuetext',`씨앗 ${progress.total}개, ${label}`);
  }
  range.addEventListener('input',()=>{const progress=onChange(Number(range.value));if(progress)render(progress);});
  reset.addEventListener('click',()=>{const progress=onChange(0);if(progress)render(progress);});
  // The element choice applies to the next transformation; at 20 it replays it right away.
  panel.querySelector('[data-growth-element]').addEventListener('change',event=>{
    onElement(event.target.value);
    if(Number(range.value)>=20){onChange(0);const progress=onChange(20);if(progress)render(progress);}
  });
  panel.addEventListener('pointerleave',onRelease);
  panel.addEventListener('focusout',event=>{if(!panel.contains(event.relatedTarget))onRelease();});
  panel.addEventListener('toggle',()=>{if(!panel.open)onRelease();});
  render(growthProgress(0));
  return {render,
    sync({active,hidden}) {panel.hidden=hidden;range.disabled=reset.disabled=!active;for(const input of elements)input.disabled=!active;
      panel.querySelector('[data-growth-hint]').textContent=active?'실제 수집에 반영 · 20개에서 머리 꽃 색으로 변신 (보라는 어둠)':'병아리를 켜면 조절할 수 있습니다.';
      if(!active||hidden)onRelease();},
    dispose(){panel.remove();}
  };
}
