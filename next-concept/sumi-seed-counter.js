import {COLLECTION_GOAL} from './sumi-growth-stages.js?v=relaxed-garden-20261105';
import * as THREE from './assets/vendor/three-r186/three.module.min.js';

// One reusable, screen-facing label; no texture allocation per pickup.
export function createSeedCounter(camera,head,crown,{reducedMotion=false}={}) {
  const label=document.createElement('span');
  label.className='sumi-seed-counter';label.dataset.sumiSeedCounter='';
  label.setAttribute('aria-hidden','true');label.hidden=true;document.body.append(label);
  const point=new THREE.Vector3();
  let age=Infinity,active=true,evolution=false;
  const smooth=THREE.MathUtils.smoothstep,lerp=THREE.MathUtils.lerp;
  // Match the body's .14s anticipation / .34s expansion / .84s settle.
  const evolutionKeys=[[0,.72,.72,0],[.14,.86,.62,3],[.34,1.24,1.18,-32],
    [.50,.95,1.04,-26],[.65,1.04,.98,-29],[.84,1,1,-28]];
  function evolutionPose(time){
    for(let i=1;i<evolutionKeys.length;i++){
      const a=evolutionKeys[i-1],b=evolutionKeys[i];
      if(time<=b[0]){const t=smooth(time,a[0],b[0]);return a.slice(1).map((v,j)=>lerp(v,b[j+1],t));}
    }
    return [1,1,-28];
  }
  function projectedY(object,width,height) {
    object.getWorldPosition(point).project(camera);
    return {x:(point.x+1)*width/2,y:(1-point.y)*height/2,z:point.z};
  }
  return {
    setHost(host){if(label.parentElement!==host)host.append(label);},
    show(total,{evolution:grow=false}={}){
      label.textContent=`${total}/${COLLECTION_GOAL}`;evolution=grow;
      label.dataset.emphasis=grow?'evolution':'normal';age=0;
    },
    update(dt,width,height){
      if(!active)return;
      age+=dt;
      if(age>=(evolution?1.9:1.35)){label.hidden=true;return;}
      const h=projectedY(head,width,height);
      let y=h.y-34;
      if(crown.visible){
        const c=projectedY(crown,width,height);
        const pixels=height*camera.zoom/(camera.top-camera.bottom);
        y=Math.min(y,c.y-crown.scale.y*(1-crown.center.y)*pixels-10);
      }
      if(h.z < -1||h.z > 1||h.x < 0||h.x > width||y < 0||y > height){label.hidden=true;return;}
      const rise=smooth(age,0,.22),settle=smooth(age,.22,.4),fall=smooth(age,.8,1.35);
      let offset=reducedMotion?0:-16*rise+3*settle+21*fall;
      let scaleX=reducedMotion?1:lerp(.9,1.05,rise)-.05*settle,scaleY=scaleX;
      let opacity=.84*smooth(age,0,.09)*(1-fall);
      if(evolution){
        const fade=smooth(age,1.2,1.9),pose=evolutionPose(age);
        [scaleX,scaleY]=reducedMotion?[1,1]:pose;
        offset=reducedMotion?0:pose[2]+30*fade;
        opacity=.98*smooth(age,0,.08)*(1-fade);
      }
      const margin=evolution?68:32;
      const x=Math.max(margin,Math.min(width-margin,h.x)),top=Math.max(evolution?48:12,y+offset);
      if(label.parentElement.matches('.project-dialog')){
        const r=label.parentElement.getBoundingClientRect();
        if(x<r.left+30||x>r.right-30||top<r.top+24||top>r.bottom){label.hidden=true;return;}
      }
      const hit=document.elementFromPoint(x,top);
      label.dataset.theme=hit?.closest('.hero,#capabilities,.work-card-visual,video,iframe')?'dark':'light';
      label.style.left=`${x}px`;label.style.top=`${top}px`;
      label.style.opacity=String(opacity);
      label.style.transform=`translate(-50%, -100%) scale(${scaleX},${scaleY})`;
      label.hidden=false;
    },
    setActive(value){active=value;if(!value)label.hidden=true;},
    dispose(){label.remove();},
  };
}
