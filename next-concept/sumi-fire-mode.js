import {createGroundSkill} from './sumi-ground-skills.js?v=ground-skills-20261104';
import * as THREE from './assets/vendor/three-r186/three.module.min.js';

const ELEMENTS = ['fire','lightning','ice'];
const ELEMENT_STYLE = {
  fire:{label:'불',body:[.91,.16,.065],tip:[1,.48,.25]},
  lightning:{label:'번개',body:[1,.61,.025],tip:[1,.97,.35]},
  ice:{label:'얼음',body:[.21,.66,.94],tip:[.78,.95,1]},
};
const FIRE_DURATION = 30, SEED_REFILL = 5, FIRE_THRESHOLD = 61;

// Actual pickups own this state. Growth previews never unlock or refill it.
export function createFireState(random=Math.random) {
  let element='fire',castSerial=0;
  const chooseElement=()=>{element=ELEMENTS[Math.min(2,Math.max(0,Math.floor(random()*3)))];};
  let unlocked=false, remaining=0, total=0, tint=0, breath=0, cooldown=0, ending=false, resetReady=false;
  return {
    collect(count) {
      if(ending||resetReady||count<=total)return;
      total=count;
      if(!unlocked&&count>=FIRE_THRESHOLD){chooseElement();unlocked=true;remaining=FIRE_DURATION;}
      else if(unlocked)remaining=Math.min(FIRE_DURATION,remaining+SEED_REFILL);
    },
    setCollectionDebug(count) {
      count=Math.max(0,Math.floor(Number(count)||0));
      if(count===total)return;
      total=count;unlocked=count>=FIRE_THRESHOLD;remaining=unlocked?FIRE_DURATION:0;
      if(unlocked)chooseElement();
      tint=unlocked?1:0;breath=0;cooldown=0;ending=false;resetReady=false;
    },
    click() {
      if(remaining<=0)return false;
      if(cooldown<=0){breath=element==='fire'?1:element==='lightning'?1.8:2.8;cooldown=element==='fire'?.85:breath;castSerial++;}
      return true;
    },
    update(dt) {
      dt=Math.max(0,dt);
      const wasCharged=remaining>0;
      remaining=Math.max(0,remaining-dt);
      if(wasCharged&&!remaining)ending=true;
      cooldown=Math.max(0,cooldown-dt);
      breath=Math.max(0,breath-dt);
      if(!remaining)breath=0;
      // No gradual yellowing during the countdown: only a quick exit transition.
      tint=THREE.MathUtils.clamp(tint+(remaining>0?dt/.3:-dt/.22),0,1);
      if(ending&&tint===0){
        ending=false;unlocked=false;total=Math.max(0,total-FIRE_THRESHOLD);breath=0;cooldown=0;resetReady=true;
      }
    },
    consumeCycleReset(){if(!resetReady)return null;resetReady=false;return total;},
    get castSerial(){return castSerial;},
    get element(){return element;},
    get ending(){return ending;},
    clearBreath(){breath=0;cooldown=0;},
    get unlocked(){return unlocked;},get total(){return total;},
    get remaining(){return remaining;},get ratio(){return remaining/FIRE_DURATION;},
    get tint(){return tint;},get breath(){return breath;},
  };
}

export function createFireMode(camera,head,beak,chick,materials,{reducedMotion=false}={}) {
  const state=createFireState();
  const ground=createGroundSkill({reducedMotion});let seenCast=0;
  const layer=document.createElement('div');layer.className='sumi-fire-layer';layer.setAttribute('aria-hidden','true');
  const flame=document.createElement('canvas');flame.className='sumi-dragon-breath';flame.width=640;flame.height=320;flame.hidden=true;
  const gauge=document.createElement('div');gauge.className='sumi-fire-gauge';gauge.hidden=true;
  const fill=document.createElement('i'),time=document.createElement('span');
  gauge.append(fill,time);layer.append(flame,gauge);document.body.append(layer);
  const ctx=flame.getContext('2d'),mouth=new THREE.Vector3(),front=new THREE.Vector3(),top=new THREE.Vector3();
  const colors=Object.values(materials).map(material=>({material,base:material.uniforms.uColor.value.clone(),tip:material.uniforms.uTip.value.clone()}));
  const bodyTint=new THREE.Vector3(),tipTint=new THREE.Vector3();
  let active=true,lastTint=-1,lastSecond=-1,lastHost=null,lastElement=null;
  const project=p=>{p.project(camera);return p;};
  // Fixed canvas, three flame skins and sixteen deterministic embers. No per-click resources.
  function paintFire(age) {
    ctx.clearRect(0,0,640,320);
    const attack=THREE.MathUtils.smoothstep(age,0,.13),fade=1-THREE.MathUtils.smoothstep(age,.58,1);
    const length=(reducedMotion?330:490)*attack, strength=attack*fade;
    ctx.save();ctx.translate(16,160);
    for(let skin=0;skin<3;skin++){
      const scale=[1,.74,.43][skin],end=length*(1-skin*.12);
      const gradient=ctx.createLinearGradient(0,0,Math.max(1,end),0);
      const palette=[['#ffe090','#ff8b25','#e84316'],['#fff3ae','#ffbf42','#ff6920'],['#fff9d9','#ffe78b','#ffbe44']][skin];
      gradient.addColorStop(0,palette[0]);gradient.addColorStop(.52,palette[1]);gradient.addColorStop(1,palette[2]);
      ctx.fillStyle=gradient;ctx.globalAlpha=strength*[.72,.86,.95][skin];ctx.beginPath();ctx.moveTo(0,-3);
      for(let i=1;i<=36;i++){
        const u=i/36,x=end*u,w=(5+70*Math.sin(Math.PI*u*.86))*scale;
        const flow=reducedMotion?0:Math.sin(u*22-age*24+skin)*8*Math.sin(u*Math.PI);
        ctx.lineTo(x,-w*(.58+.30*Math.sin(u*30-age*19+skin)**2)+flow);
      }
      ctx.lineTo(end+16*scale,0);
      for(let i=36;i>=1;i--){
        const u=i/36,x=end*u,w=(5+70*Math.sin(Math.PI*u*.86))*scale;
        const flow=reducedMotion?0:Math.sin(u*22-age*24+skin)*8*Math.sin(u*Math.PI);
        ctx.lineTo(x,w*(.58+.30*Math.sin(u*27-age*21+skin)**2)+flow);
      }
      ctx.lineTo(0,3);ctx.closePath();ctx.fill();
    }
    if(!reducedMotion)for(let i=0;i<16;i++){
      const travel=(age*1.6+i*.061)%1,x=length*(.18+travel*.87),y=Math.sin(i*9.17)*travel*96;
      ctx.globalAlpha=strength*(1-travel)*.8;ctx.fillStyle=i%2?'#ffd96c':'#ff922e';
      ctx.beginPath();ctx.ellipse(x,y,2+travel*3,1+travel*2,-.3,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function captureCast(width,height) {
    seenCast=state.castSerial;
    if(state.element==='fire'){ground.clear();return;}
    chick.updateWorldMatrix(true,true);
    project(chick.localToWorld(top.set(0,0,0)));
    project(head.localToWorld(mouth.set(0,0,0)));
    project(head.localToWorld(front.set(0,0,1)));
    ground.trigger(state.element,(top.x+1)*width/2,(1-top.y)*height/2,
      (front.x-mouth.x)*width/2,-(front.y-mouth.y)*height/2,
      document.querySelector('.project-dialog[open]')||document.body,width,height);
  }
  function cast(){
    if(!active)return false;
    const accepted=state.click();
    if(accepted&&seenCast!==state.castSerial)captureCast(window.innerWidth,window.innerHeight);
    return accepted;
  }
  function update(dt,width,height) {
    if(!active)return;
    state.update(dt);
    if(lastElement!==state.element){
      lastElement=state.element;lastTint=-1;lastSecond=-1;
      layer.dataset.element=state.element;
      bodyTint.fromArray(ELEMENT_STYLE[state.element].body);tipTint.fromArray(ELEMENT_STYLE[state.element].tip);
    }
    if(lastTint!==state.tint){
      colors.forEach(({material,base,tip})=>{
        material.uniforms.uColor.value.copy(base).lerp(bodyTint,state.tint);
        material.uniforms.uTip.value.copy(tip).lerp(tipTint,state.tint);
      });lastTint=state.tint;
    }
    const host=document.querySelector('.project-dialog[open]')||document.body;
    if(host!==lastHost){host.append(layer);lastHost=host;state.clearBreath();ground.clear();}
    if(host!==document.body){const r=host.getBoundingClientRect();layer.style.clipPath=`inset(${Math.max(0,r.top)}px ${Math.max(0,width-r.right)}px ${Math.max(0,height-r.bottom)}px ${Math.max(0,r.left)}px)`;}
    else layer.style.clipPath='';
    head.updateWorldMatrix(true,false);
    project(chick.localToWorld(top.set(0,0,0)));
    const gx=(top.x+1)*width/2,gy=(1-top.y)*height/2;
    gauge.hidden=state.remaining<=0||top.z < -1||top.z>1||gx<0||gx>width||gy<24||gy>height;
    if(!gauge.hidden){
      gauge.style.left=`${THREE.MathUtils.clamp(gx,40,Math.max(40,width-104))}px`;gauge.style.top=`${gy+24}px`;
      fill.style.transform=`scaleX(${state.ratio})`;
      const second=Math.ceil(state.remaining);if(second!==lastSecond){time.textContent=`${ELEMENT_STYLE[state.element].label} · ${second}s`;lastSecond=second;}
    }
    if(state.breath>0&&seenCast!==state.castSerial)captureCast(width,height);
    if(state.breath<=0)ground.clear();
    ground.update(dt,host,width,height);
    flame.hidden=state.element!=='fire'||state.breath<=0||gx<0||gx>width||gy<0||gy>height;
    if(!flame.hidden){
      project(beak.localToWorld(mouth.set(0,0,.045)));
      project(head.localToWorld(front.set(0,0,.6)));
      const x=(mouth.x+1)*width/2,y=(1-mouth.y)*height/2;
      const dx=(front.x-mouth.x)*width/2,dy=-(front.y-mouth.y)*height/2;
      const angle=Math.atan2(dy,dx),scale=Math.min(1,width/760);
      flame.style.left=`${x}px`;flame.style.top=`${y}px`;
      flame.style.transform=`translate(-16px,-160px) rotate(${angle}rad) scale(${scale})`;
      paintFire(1-state.breath);
    }
  }
  return {
    state,update,cast,
    setActive(value){active=value;layer.hidden=!value;if(!value){state.clearBreath();ground.clear();}},
    dispose(){colors.forEach(({material,base,tip})=>{material.uniforms.uColor.value.copy(base);material.uniforms.uTip.value.copy(tip);});ground.dispose();layer.remove();},
  };
}
