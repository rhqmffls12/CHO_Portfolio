import {COLLECTION_GOAL} from './sumi-growth-stages.js?v=relaxed-garden-20261105';
import {createElementFx} from './sumi-element-fx.js?v=transform-no-dialog-20261106';
import {createMediaFx} from './sumi-media-fx.js?v=thumb-fx-20261105';
import {createTextFx} from './sumi-text-fx.js?v=p1-play-20261106';
import {createMinigame,createMinigameDebug,GAME_CONFIG} from './sumi-minigame.js?v=p1-play2-20261106';
import * as THREE from './assets/vendor/three-r186/three.module.min.js';

// dark is the special element: only a purple head flower (or the debug panel) gives it; the random
// fallback never picks it.
const ELEMENTS = ['fire','lightning','ice','dark'];
// The head flower's colour decides the element. Palettes (sumi-flower-art.js): 0 yellow/orange,
// 1 coral red, 2 pink, 3 blue, 4 purple, 5 teal.
const ELEMENT_BY_PALETTE = ['lightning','fire','fire','ice','dark','ice'];
export function elementForFlower(variant){return ELEMENT_BY_PALETTE[Math.floor((((variant|0)%24)+24)%24/4)]??null;}
const FIRE_DURATION = 30, SEED_REFILL = 5, FIRE_THRESHOLD = COLLECTION_GOAL;

// Actual pickups own this state. Growth previews never unlock or refill it.
export function createFireState(random=Math.random) {
  let element='fire',prefer=null;
  // a preferred element (the head flower's colour, or a debug choice) wins; otherwise a random roll
  const chooseElement=()=>{const p=prefer?.();element=ELEMENTS.includes(p)?p:ELEMENTS[Math.min(2,Math.max(0,Math.floor(random()*3)))];};
  // breath: 1 while a fire charge lasts (the skills are always on; it only opens the beak).
  // carry: seeds kept for the next cycle (a badge summon spends only its cost; 20 seeds spend all).
  let unlocked=false, remaining=0, total=0, tint=0, breath=0, ending=false, resetReady=false, carry=0;
  return {
    collect(count) {
      if(ending||resetReady||count<=total)return;
      total=count;
      if(!unlocked&&count>=FIRE_THRESHOLD){chooseElement();unlocked=true;remaining=FIRE_DURATION;carry=0;}
      else if(unlocked)remaining=Math.min(FIRE_DURATION,remaining+SEED_REFILL);
    },
    // An acquired element's badge (sumi-element-badges.js): transform into `next` for `cost` seeds
    // instead of the full goal; the rest carry into the next cycle (13 seeds: transform, keep 3).
    unlockWith(next,cost) {
      if(unlocked||ending||resetReady||!ELEMENTS.includes(next)||total<cost)return false;
      element=next;unlocked=true;remaining=FIRE_DURATION;carry=total-cost;
      return true;
    },
    setCollectionDebug(count) {
      count=Math.max(0,Math.floor(Number(count)||0));
      if(count===total)return;
      total=count;unlocked=count>=FIRE_THRESHOLD;remaining=unlocked?FIRE_DURATION:0;carry=0;
      if(unlocked)chooseElement();
      tint=unlocked?1:0;breath=0;ending=false;resetReady=false;
    },
    // A click while charged no longer casts anything; it reports the charge so the page steers the chick.
    click() {
      return remaining>0;
    },
    update(dt) {
      dt=Math.max(0,dt);
      const wasCharged=remaining>0;
      remaining=Math.max(0,remaining-dt);
      if(wasCharged&&!remaining)ending=true;
      breath=remaining>0&&element==='fire'?1:0;
      // No gradual yellowing during the countdown: only a quick exit transition.
      tint=THREE.MathUtils.clamp(tint+(remaining>0?dt/.3:-dt/.22),0,1);
      // the next cycle starts from the carried seeds: 0 after 20 seeds, the rest after a badge summon
      if(ending&&tint===0){
        ending=false;unlocked=false;total=carry;carry=0;breath=0;resetReady=true;
      }
    },
    // the carried seed count once the element has ended (the garden is replanted with it), else null
    consumeCycleReset(){if(!resetReady)return null;resetReady=false;return total;},
    setPreference(fn){prefer=fn;},
    get element(){return element;},
    get ending(){return ending;},
    clearBreath(){breath=0;},
    get unlocked(){return unlocked;},get total(){return total;},
    get remaining(){return remaining;},get ratio(){return remaining/FIRE_DURATION;},
    get tint(){return tint;},get breath(){return breath;},
  };
}

// Owns the elemental state, the small countdown gauge and the in-scene effects (sumi-element-fx.js).
// The unlock edge plays the transformation and the end edge the dissipation; in between the
// element's skill runs continuously. `aim` (the butterfly's position) steers the fire breath.
export function createFireMode(camera,head,beak,chick,{reducedMotion=false,scene,renderer=null,furUniforms,lowPower=false,aim=null,preferElement=null}={}) {
  const state=createFireState();
  state.setPreference(preferElement);
  // the transformation burst also glitches / heat-hazes / refracts the media on screen
  const mediaFx=createMediaFx({reducedMotion});
  // large text sways / glitches / refracts from the burst until the element ends
  const textFx=createTextFx();
  // the element minigame (MVP: lightning) and its local tuning panel; no game on touch devices
  const game=createMinigame({enabled:!reducedMotion&&!matchMedia('(pointer: coarse)').matches});
  const gameDebug=createMinigameDebug({onRestart:()=>game.restart()});
  // ice pillars rising behind the steps (world position, until when) for the minigame
  const pillars=[];
  const fx=createElementFx(scene,camera,{reducedMotion,lowPower,furUniforms,head,renderer,onBurst:element=>mediaFx.play(element),
    blinkSpeed:element=>GAME_CONFIG.elements[element]?.blinkSpeed||1,   // per-element move speed (minigame panel)
    onIcePillar:(base,life)=>{if(document.querySelector('.project-dialog[open]'))return;pillars.push({x:base.x,z:base.z,until:performance.now()/1000+life});if(pillars.length>40)pillars.shift();}});
  const layer=document.createElement('div');layer.className='sumi-fire-layer';layer.setAttribute('aria-hidden','true');
  const gauge=document.createElement('div');gauge.className='sumi-fire-gauge';gauge.hidden=true;
  const fill=document.createElement('i');
  gauge.append(fill);layer.append(gauge);document.body.append(layer);
  const top=new THREE.Vector3(),q=new THREE.Quaternion(),_dash=new THREE.Vector3(),dashFrom=new THREE.Vector3(),dashTo=new THREE.Vector3();
  // the minigame follows a quick attack frame by frame (see the update)
  let dashId=0,dashPrev=null;
  const g={mouth:new THREE.Vector3(),forward:new THREE.Vector3(),foot:new THREE.Vector3(),body:new THREE.Vector3(),
    element:'fire',charged:false,unlocked:false,ending:false,tint:0,aim};
  let active=true,wasUnlocked=false,wasEnding=false,lastHost=null;
  // While the element lasts, its media burst also plays on a single thumbnail as the pointer enters
  // it (page cards, a dialog's gallery), once per entry; dark has no media burst.
  const charged=()=>active&&state.remaining>0&&!state.ending&&fx.wipe>.5&&mediaFx.supports(state.element);
  const onThumbHover=e=>{
    const thumb=e.target?.closest?.('.work-card-visual, .dialog-gallery button');
    if(!thumb||(e.relatedTarget&&thumb.contains(e.relatedTarget))||!charged())return;
    mediaFx.playOn(state.element,thumb);
  };
  document.addEventListener('pointerover',onThumbHover,{passive:true});
  // While transformed, the page's own buttons are locked: project cards (hover still opens the card
  // and plays its thumbnail; only the click into the dialog is stopped), the hero reel's play
  // button, the scroll arrow, the filter and collapse/expand buttons and the contact icons. The
  // press still sends the chick (its pointerdown). The chick's switch, badges, the debug panels and
  // an open dialog stay usable.
  const LOCKED='.work-card,.hero-video-toggle,.hero-scroll-cue,.filter-chip,.card-details-option,.contact-icon-link';
  const onLockedClick=e=>{
    if(state.remaining<=0)return;
    const t=e.target;
    if(!t?.closest?.(LOCKED)||t.closest('[data-sumi-control],.sumi-game-debug,.sumi-growth-debug,.project-dialog'))return;
    e.preventDefault();e.stopPropagation();
  };
  window.addEventListener('click',onLockedClick,true);
  let lockShown=false;
  // The page reacts while the element lasts: plain fixed layers under the chick canvas tint and
  // scorch / frost / charge the screen edges, and a strike flash lights the page for lightning.
  // Per frame only their opacity changes; the hero video and section headings recolour from a
  // data attribute on <html>, set once per element change (sumi-chick.css).
  const veil=['edge','tone','flash'].map(kind=>{
    const v=document.createElement('div');v.className=`sumi-veil sumi-veil-${kind}`;v.setAttribute('aria-hidden','true');v.dataset.element='';
    document.body.append(v);return v;
  });
  let veilElement='',veilAmount=0,veilFlash=0;
  function setVeil(element,amount,flash){
    if(element!==veilElement){
      veilElement=element;for(const v of veil)v.dataset.element=element;
      if(element)document.documentElement.dataset.sumiElement=element;else delete document.documentElement.dataset.sumiElement;
    }
    if(Math.abs(amount-veilAmount)>.01||(amount===0&&veilAmount!==0)){veilAmount=amount;veil[0].style.opacity=veil[1].style.opacity=amount.toFixed(2);}
    if(Math.abs(flash-veilFlash)>.01||(flash===0&&veilFlash!==0)){veilFlash=flash;veil[2].style.opacity=flash.toFixed(2);}
  }
  const project=p=>{p.project(camera);return p;};
  // World-space anchors for the effects, read from the posed chick.
  function sample(){
    chick.updateWorldMatrix(true,true);
    beak.localToWorld(g.mouth.set(0,0,.045));
    head.getWorldQuaternion(q);g.forward.set(0,0,1).applyQuaternion(q).normalize();
    chick.getWorldPosition(g.foot);g.foot.y=0;
    if(aim){
      // Aim at the butterfly, kept roughly level so a breath never shoots straight up.
      const dx=aim.x-g.mouth.x,dz=aim.z-g.mouth.z,flat=Math.hypot(dx,dz);
      if(flat>.15)g.forward.set(dx/flat,THREE.MathUtils.clamp((aim.y-g.mouth.y)/flat,-.35,.25),dz/flat).normalize();
    }
    g.body.copy(g.foot).setY(.32);
    g.element=state.element;g.charged=state.remaining>0;
    g.unlocked=state.unlocked;g.ending=state.ending;g.tint=state.tint;
    return g;
  }
  // Clicks while charged no longer fire a skill; the page still uses the answer to steer the chick.
  function cast(){
    return active&&state.click();
  }
  // Dark: boxes that keep some brightness through the darkness or glow at their edges, in
  // viewport px.
  //  - Page: each work thumbnail keeps 20 % and has the rim. While a card is opened (hover, focus,
  //    EXPAND) its whole outline, info panel included, gets a hairline rim that grows in with the
  //    panel. The full-bleed hero video keeps 20 % too (shown black-and-white, sumi-chick.css),
  //    without a rim, which would only frame the screen.
  //  - Dialog: the close button (in the pinned header) and the stage keep 50 %, the stage has the
  //    rim; gallery thumbnails keep 20 % with the rim while wholly inside their scrolling strip.
  // Rects are read each frame from a clean layout; the box pool is reused, so nothing is allocated
  // per frame.
  const DARK_BOXES=32,CARD_RIM=.45;
  const glowBoxes=Array.from({length:DARK_BOXES},()=>({left:0,top:0,right:0,bottom:0,radius:0,keep:0,rim:0,seed:0,free:false})),glowSet=[],glowRadius=new WeakMap();
  let glowKey='',glowList=[];
  function glowTargets(host){
    if(host===document.body){
      const list=[],hero=document.querySelector('.hero-video-frame');
      if(hero)list.push({el:hero,keep:.2,rim:0,seed:99});
      document.querySelectorAll('.work-card').forEach((card,i)=>{
        const visual=card.querySelector('.work-card-visual');if(!visual)return;
        list.push({el:visual,keep:.2,rim:1,seed:i*2},{el:card,visual,keep:0,rim:CARD_RIM,seed:i*2+1});
      });
      return list;
    }
    const list=[];
    const close=host.querySelector('.dialog-close'),stage=host.querySelector('.dialog-stage');
    if(close)list.push({el:close,keep:.5,rim:0,seed:0,free:true});
    if(stage)list.push({el:stage,keep:.5,rim:1,seed:1});
    host.querySelectorAll('.dialog-gallery button').forEach((el,i)=>list.push({el,keep:.2,rim:1,seed:2+i,strip:true}));
    return list;
  }
  function darkGlow(host,width,height){
    const page=host===document.body,key=page?'page':`dialog:${host.dataset.activeWork||''}`;
    if(key!==glowKey||glowList.some(t=>!t.el.isConnected)){glowKey=key;glowList=glowTargets(host);}
    glowSet.length=0;
    for(const t of glowList){
      if(glowSet.length>=DARK_BOXES)break;
      const r=t.el.getBoundingClientRect();
      if(r.width<8||r.height<8||r.bottom<-24||r.top>height+24||r.right<-24||r.left>width+24)continue;
      let rim=t.rim;
      if(t.visual){
        // a card's outline only while its info panel is out, fading in as the panel opens
        const open=Math.min(1,Math.max(0,(r.height-t.visual.getBoundingClientRect().height-8)/40));
        if(open<.02)continue;
        rim*=open;
      }
      if(t.strip){const s=t.el.parentElement.getBoundingClientRect();if(r.left<s.left-1||r.right>s.right+1)continue;}
      let radius=glowRadius.get(t.el);
      if(radius===undefined){radius=parseFloat(getComputedStyle(t.el).borderTopLeftRadius)||0;glowRadius.set(t.el,radius);}
      const b=glowBoxes[glowSet.length];
      b.left=r.left;b.top=r.top;b.right=r.right;b.bottom=r.bottom;b.radius=Math.min(radius,r.width/2,r.height/2);
      b.keep=t.keep;b.rim=rim;b.seed=t.seed;b.free=Boolean(t.free);
      glowSet.push(b);
    }
    // a dialog's pinned header hides what scrolls under it: no edge glows there either
    const header=page?null:host.querySelector('.dialog-header');
    fx.setDarkGlow(glowSet,width,height,header?header.getBoundingClientRect().bottom:0);
  }
  function update(dt,width,height) {
    if(!active)return;
    state.update(dt);
    sample();
    if(state.unlocked&&!wasUnlocked)fx.transform(state.element,g);
    if(state.ending&&!wasEnding)fx.dissipate(state.element,g);
    wasUnlocked=state.unlocked;wasEnding=state.ending;
    layer.dataset.element=state.element;
    const host=document.querySelector('.project-dialog[open]')||document.body;
    if(host!==lastHost){
      const switched=lastHost!==null;
      // the gauge and the page veil live on the current surface (a modal dialog sits above body)
      host.append(layer);for(const v of veil)host.append(v);lastHost=host;state.clearBreath();fx.clear();fx.setSurface(host);
      // effects belong to the old surface and are cleared; a transformed chick then arrives on
      // the new one (a project dialog opening or closing) in its element's way
      if(switched&&state.remaining>0)fx.arrive(state.element,g.foot);
    }
    let clip='';
    if(host!==document.body){const r=host.getBoundingClientRect();clip=`inset(${Math.max(0,r.top)}px ${Math.max(0,width-r.right)}px ${Math.max(0,height-r.bottom)}px ${Math.max(0,r.left)}px)`;}
    if(layer.style.clipPath!==clip){layer.style.clipPath=clip;for(const v of veil)v.style.clipPath=clip;}
    // the darkness's own canvas takes the same clip (it appears on first use, so checked each frame)
    const darkCanvas=fx.darkCanvas;if(darkCanvas&&darkCanvas.style.clipPath!==clip)darkCanvas.style.clipPath=clip;
    project(top.copy(g.foot));
    const gx=(top.x+1)*width/2,gy=(1-top.y)*height/2;
    gauge.hidden=state.remaining<=0||top.z < -1||top.z>1||gx<0||gx>width||gy<24||gy>height;
    if(!gauge.hidden){
      // the bar alone shows the time left; no text label
      gauge.style.left=`${THREE.MathUtils.clamp(gx,40,Math.max(40,width-40))}px`;gauge.style.top=`${gy+24}px`;
      fill.style.transform=`scaleX(${state.ratio})`;
    }
    // dark: card and thumbnail edges glow in the darkness (drawn by the darkness pass itself,
    // which renders inside fx.update, so the boxes are read first and match this frame's scroll)
    if(fx.darkness>.001)darkGlow(host,width,height);
    fx.update(dt,g);
    // the minigame: a round per charge; the clock runs once the transformation has played and
    // keeps running in a project dialog (a dialog only opens while transformed when the chick
    // transformed inside one, and then it teleports out)
    // fire: the breath, from the mouth toward the butterfly, while it is on (never from a dialog)
    let breath=null;
    if(state.element==='fire'&&state.breath>0&&!fx.transforming&&!fx.blinking&&host===document.body&&aim){
      project(_dash.copy(g.mouth));const fx0=(_dash.x+1)*width/2,fy0=(1-_dash.y)*height/2;
      project(_dash.copy(aim));breath={from:{x:fx0,y:fy0},to:{x:(_dash.x+1)*width/2,y:(1-_dash.y)*height/2}};
    }
    // ice: the live walking pillars on screen; dark: where the chick is and its coat
    const nowS=performance.now()/1000;
    while(pillars.length&&pillars[0].until<nowS)pillars.shift();
    const icePillars=state.element==='ice'&&host===document.body?pillars.filter(p=>p.until>nowS).map(p=>{project(_dash.set(p.x,.05,p.z));return {x:(_dash.x+1)*width/2,y:(1-_dash.y)*height/2};}):null;
    project(_dash.copy(g.body));
    const chick={x:(_dash.x+1)*width/2,y:(1-_dash.y)*height/2};
    game.update(dt,{element:state.element,charged:state.remaining>0&&!state.ending,timeLeft:state.remaining,playing:!fx.transforming&&fx.wipe>.5,dialog:host!==document.body,breath,pillars:icePillars,chick,coat:fx.darkCoat});
    if(state.remaining>0)gameDebug?.showElement(state.element);
    // dark: the head orb shows the colour to break next
    fx.setOrbCue(game.cue);
    if((state.remaining>0)!==lockShown){lockShown=state.remaining>0;document.documentElement.classList.toggle('sumi-transform-lock',lockShown);}
    // A quick attack on the page sweeps the mobs along the straight line of the move (start to
    // landing, at body height where the bolt is drawn), stretch by stretch as the chick really
    // advances: its progress is its position along that line, ignoring the bolt's zigzag. Moves
    // inside a dialog never touch the page's mobs.
    if(fx.blinking&&state.element==='lightning'&&host===document.body){
      const ex=dashTo.x-dashFrom.x,ez=dashTo.z-dashFrom.z,len2=ex*ex+ez*ez||1;
      const t=THREE.MathUtils.clamp(((fx.blinkPos.x-dashFrom.x)*ex+(fx.blinkPos.z-dashFrom.z)*ez)/len2,0,1);
      project(_dash.set(dashFrom.x+ex*t,.3,dashFrom.z+ez*t));
      const cur={x:(_dash.x+1)*width/2,y:(1-_dash.y)*height/2,id:dashId};
      if(dashPrev&&dashPrev.id===dashId)game.sweep(dashPrev,cur,dashId);
      dashPrev=cur;
    } else dashPrev=null;
    // large text: from the burst (the coat starts to change) until the element starts to end;
    // dark's thin rims instead come and go with the darkness itself
    const dark=state.element==='dark'&&fx.darkness>.001;
    textFx.update(dark?'dark':fx.wipe>.05&&!state.ending&&state.remaining>0?state.element:'',host,fx.darkness);
    // the veil follows the coat (wipe), on the page and in project dialogs alike
    const amount=fx.wipe,element=amount>.001?state.element:'';
    // page flash: lightning strikes and the fire meteor's impact
    setVeil(element,amount,element==='lightning'||element==='fire'?Math.min(1,fx.pageFlash):0);
  }
  return {
    state,update,cast,
    footstep(position){if(active&&state.remaining>0&&!fx.transforming)fx.footstep(state.element,position);},
    get pose(){return fx.pose;},
    get transforming(){return fx.transforming;},
    get breathing(){return state.breath>0&&!fx.transforming&&!fx.blinking;},
    // A click while charged sends the chick to `dest` (the spot under the butterfly) in the
    // element's own way; false while transforming, mid-move or on the short cooldown after one.
    blink(dest){if(!active||state.remaining<=0)return false;sample();dashFrom.copy(g.foot);const moved=fx.blink(state.element,g.foot,dest);if(moved){dashId++;dashTo.set(dest.x,0,dest.z);}return moved;},
    get game(){return game;},
    get blinking(){return fx.blinking;},
    get darkness(){return fx.darkness;},
    // dark's coat, 'white' or 'black': it swaps at every move while the chick is hidden
    get darkCoat(){return fx.darkCoat;},
    get orbCue(){return fx.orbCue;},
    // the transformed chick's walking speed multiplier, per element (minigame panel); 1 otherwise
    get walkScale(){return state.remaining>0?(GAME_CONFIG.elements[state.element]?.walk||1):1;},
    get darknessPass(){return fx.darknessPass;},
    pourIntoInk(emitters,cam){fx.pourIntoInk(emitters,cam);},
    get blinkPos(){return fx.blinkPos;},
    setActive(value){active=value;layer.hidden=!value;fx.setVisible(value);gameDebug?.setVisible(value);if(!value){game.stop();state.clearBreath();fx.clear();mediaFx.stop();textFx.clear();setVeil('',0,0);lastHost=null;}},
    get mediaFx(){return mediaFx;},
    get textFx(){return textFx;},
    dispose(){game.dispose();gameDebug?.dispose();document.removeEventListener('pointerover',onThumbHover);window.removeEventListener('click',onLockedClick,true);document.documentElement.classList.remove('sumi-transform-lock');fx.dispose();mediaFx.dispose();textFx.dispose();layer.remove();setVeil('',0,0);for(const v of veil)v.remove();},
  };
}
