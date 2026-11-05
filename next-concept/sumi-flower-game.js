import * as THREE from './assets/vendor/three-r186/three.module.min.js';
import { createFlowerArtwork } from './sumi-flower-art.js?v=element-crest-20261105';
import { growthProgress, COLLECTION_GOAL } from './sumi-growth-stages.js?v=relaxed-garden-20261105';
import { createSeedCounter } from './sumi-seed-counter.js?v=relaxed-garden-20261105';

// A relaxed document garden, independent of the twenty-seed transformation goal.
const CAPACITY = 128, DWELL = .28, BLOOM_TIME = .42;
// Event flowers: four seconds from hover to seed release. The whole six-second timeline was
// compressed by 2/3 (charge, beats, springs, bloom), so the animation plays faster rather than
// being cut short: 3.72 s of charge plus a 0.28 s bloom.
const GIANT_CHARGE_TIME = 3.72, GIANT_BLOOM_TIME = .28;
const GIANT_BEATS = [.1, 1, 1.87, 2.67, 3.4];
const ASSIST_START = COLLECTION_GOAL - 2, REPLANT_INTERVAL = 10, REPLANT_BATCH = 2;
const FLOWER_SIZE = 34.4, FLOWER_HEAD_OFFSET = 14.4;
const FLOWER_SIZE_STEPS = [.8, 1, 1.2];
const GIANT_FLOWER_SIZE = 2;
const FEATURED_FLOWERS = new Set(['cinematic-workflow-toolkit','production-breakdown']);

export function createFlowerGame(scene, camera, { head, reducedMotion = false, random = Math.random,
  onBloom = () => {}, onCollect = () => {}, onReward = () => {}, onEvolution = () => {}, onGrowthChange = () => {} } = {}) {
  const art = createFlowerArtwork();
  // Flowers belong to document layout, not the fixed WebGL camera layer.
  const pageFlowers=document.createElement('div');
  pageFlowers.setAttribute('aria-hidden','true');pageFlowers.dataset.sumiPageFlowers='';
  Object.assign(pageFlowers.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'0',zIndex:'14',pointerEvents:'none'});
  document.body.append(pageFlowers);
  function flowerElement(seed=false) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
    canvas.dataset.sumiItem=seed?'seed':'flower';
    Object.assign(canvas.style,{position:'absolute',width:seed?'24px':`${FLOWER_SIZE}px`,height:seed?'24px':`${FLOWER_SIZE}px`,maxWidth:'none',pointerEvents:'none',transformOrigin:seed?'50% 50%':'50% 86%',display:'none'});
    if(seed)canvas.getContext('2d').drawImage(art.seed.image,0,0);
    pageFlowers.append(canvas);return canvas;
  }
  const group = new THREE.Group();group.name='sumi-flower-garden';scene.add(group);
  // Animation records only; neither flowers nor seeds are WebGL objects.
  const makeSprite = map => ({material:{map,opacity:0,rotation:0},position:new THREE.Vector3(),scale:new THREE.Vector3(),center:new THREE.Vector2(),visible:false});
  const items=[];
  const makeItem=()=>{const i=items.length;return {
    flower:makeSprite(art.flowers[i%24]),element:flowerElement(),seed:makeSprite(art.seed),seedElement:flowerElement(true),position:new THREE.Vector3(),
    state:'empty',age:0,dwell:0,life:0,offscreen:0,phase:random()*Math.PI*2,variant:i%24,anchor:null,initialId:null,
  };};
  const crown = new THREE.Sprite(new THREE.SpriteMaterial({map:art.growth,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,opacity:0}));
  crown.name='sumi-flower-reward';crown.position.set(.015,.155,.015);crown.center.set(.5,.14);crown.scale.setScalar(.26);crown.visible=false;
  crown.renderOrder=4;
  head.add(crown);
  const seedCounter=createSeedCounter(camera,head,crown,{reducedMotion});
  let actualCollections=0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const projected=new THREE.Vector3(), butterflyScreen=new THREE.Vector3(), chickScreen=new THREE.Vector3();
  let width=1,height=1,elapsed=0,scrollQuiet=1,lastScroll=window.scrollY;
  let anchors=[],active=true,targetItem=null,collected=0,totalCollected=0,growthStage=0,growthAge=0,growthVariant=0,disposed=false;
  // While the chick is transformed the garden is put away entirely (see setSuspended).
  let suspended=false;
  let planted=false,nextReplant=Infinity,gardenClock=0;
  let surface=null,renderScroll=window.scrollY;
  const initialCollected=new Set();
  const isFeatured=node=>FEATURED_FLOWERS.has(node.dataset.openWork);
  function panelVisible(node) {
    const panel=node.closest('.card-info-panel');if(!panel)return true;
    const style=getComputedStyle(panel),r=panel.getBoundingClientRect(),footer=node.getBoundingClientRect();
    return !node.closest('[hidden]')&&style.visibility!=='hidden'&&Number(style.opacity)>.1&&r.height>40&&footer.bottom<=r.bottom+2;
  }

  function screen(world, out=projected) {
    out.copy(world).project(camera);out.set((out.x+1)*width/2,(1-out.y)*height/2,out.z);return out;
  }
  function shuffled(list) {
    const copy=[...list];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  function textAnchors(selector,count,region) {
    // Round-robin across text blocks, not a random cluster on a single heading.
    const nodes=shuffled(document.querySelectorAll(selector)),result=[];
    for(let slot=0;slot<3&&result.length<count;slot++)for(const node of nodes){
      result.push({node,region,slot,fx:[.18,.78,.48][slot]+(random()-.5)*.08,fy:0,dx:0,dy:2});
      if(result.length===count)break;
    }
    return result;
  }
  function planGarden() {
    const visuals=[...document.querySelectorAll('.work-card-visual')];
    if(visuals.length<2||!document.querySelector('.career-entry h4'))return null;
    const work=[];
    const featured=visuals.filter(isFeatured),ordinary=shuffled(visuals.filter(node=>!isFeatured(node)));
    // Three ordinary blooms total across the two featured top ledges.
    for(let slot=0;slot<3;slot++){
      const node=featured[slot%featured.length];
      work.push({node,region:'work',slot,fx:slot===2?.65+random()*.20:.18+random()*.24,fy:0,dx:0,dy:-1});
    }
    const toolkit=featured.find(node=>node.dataset.openWork==='cinematic-workflow-toolkit');
    const toolkitEvent={node:toolkit,region:'work',slot:3,giant:true,fx:.91,fy:1,dx:0,dy:-2};
    work.push(toolkitEvent);
    for(let slot=0;slot<2;slot++)work.push({...toolkitEvent,slot:4+slot,giant:false,reserveFor:toolkitEvent});
    // Only two ordinary thumbnails in the entire collection have a flower.
    ordinary.slice(0,2).forEach(node=>work.push({node,region:'work',slot:0,fx:.87+random()*.06,fy:1,dx:0,dy:-2}));
    // Preserve ten hidden description-card flowers independently of thumbnail density.
    for(const visual of ordinary.slice(0,10)){
      const node=visual.closest('.work-card')?.querySelector('.work-card-footer');
      if(node)work.push({node,region:'work',hiddenPanel:true,slot:0,fx:.38+random()*.38,fy:1,dx:0,dy:-3});
    }
    // Each detail page gets a stable random allocation, sampled once per visit session.
    const details=visuals.flatMap(node=>{
      const count=Math.floor(random()*6);
      return Array.from({length:count},(_,slot)=>({node:null,region:'detail',projectId:node.dataset.openWork,
        pick:(slot+random()*.6)/Math.max(1,count),fx:.18+random()*.65,fy:0,dx:0,dy:0}));
    });
    // Eight visible hero flowers: seven ordinary rewards plus one three-seed event.
    const hero=textAnchors('.hero-title-line,.hero-bottomline p,.hero-specs > div,.reel-overlay-panel h2',8,'hero');
    const heroCandidates=hero.filter(anchor=>!anchor.node.matches('.reel-overlay-panel h2'));
    const heroGiant=heroCandidates[Math.floor(random()*heroCandidates.length)];
    if(!heroGiant)return null;
    // Keep the reel focal point ordinary; place the event on one of two title ledges.
    const titleLedges=[
      {node:document.querySelector('.hero-title-line:first-child strong.hero-title-word'),fx:.30+random()*.40},
      {node:document.querySelector('.hero-title-line:nth-child(3) strong.hero-title-word'),fx:.60+random()*.10},
    ].filter(ledge=>ledge.node);
    if(!titleLedges.length)return null;
    const ledge=titleLedges[Math.floor(random()*titleLedges.length)];
    Object.assign(heroGiant,{...ledge,giant:true,fy:.10,dx:0,dy:0});
    const heroFocal=hero.find(anchor=>anchor!==heroGiant);
    Object.assign(heroFocal,{node:document.querySelector('.hero'),fx:.64+random()*.04,fy:.52+random()*.06,dx:0,dy:0});
    for(let slot=0;slot<2;slot++)hero.push({...heroGiant,slot:slot+3,giant:false,reserveFor:heroGiant});
    const plan=[
      ...hero,
      ...work,
      ...textAnchors('.career-entry h4,.career-role h5',2,'career'),
      ...[0].map(slot=>({node:document.querySelector('.toolkit-field'),region:'career',floating:true,slot,phase:random()*Math.PI*2,fx:.5,fy:.5,dx:0,dy:0})),
      ...details,
      ...textAnchors('#about h2,#about > p',3,'ending'),
    ];
    // Reassign the removed toolkit/ending rewards to one surprise three-seed event.
    const surpriseCandidates=plan.filter(anchor=>!anchor.giant&&!anchor.reserveFor&&!anchor.floating
      &&anchor!==heroFocal&&anchor.region!=='work');
    const surprise=surpriseCandidates[Math.floor(random()*surpriseCandidates.length)];
    if(!surprise)return null;
    Object.assign(surprise,{giant:true,surpriseEvent:true});
    for(let slot=0;slot<2;slot++)plan.push({...surprise,slot:slot+3,giant:false,reserveFor:surprise});
    return plan.length<=CAPACITY?plan:null;
  }
  function anchorPoint(anchor) {
    resolveAnchor(anchor);
    if(!anchor.node)return {x:-1000,y:-1000};
    const r=anchor.node.getBoundingClientRect();
    let fx=anchor.fx,fy=anchor.fy;
    if(anchor.floating&&!anchor.frozen){
      const t=reducedMotion?0:elapsed*.22;
      fx=.5+Math.sin(t+anchor.phase)*.27;
      fy=.5+Math.sin(t*.73+anchor.phase*1.7)*.23;
    }
    return {x:r.left+r.width*fx+anchor.dx,y:r.top+r.height*fy+anchor.dy};
  }
  function resolveAnchor(anchor){
    if(!anchor?.projectId)return;
    if(!surface||surface.dataset.activeWork!==anchor.projectId){anchor.node=null;return;}
    if(!anchor.node?.isConnected){
      const choices=[...surface.querySelectorAll('.dialog-copy h2,.case-step h3,.technical-notes h4,.dialog-detail p')];
      anchor.node=choices[Math.floor(anchor.pick*choices.length)]||surface.querySelector('.dialog-copy');
    }
  }
  function syncSurface(){
    surface=document.querySelector('.project-dialog[open]');
    const host=surface||document.body;
    if(pageFlowers.parentElement!==host)host.append(pageFlowers);
    pageFlowers.style.position=surface?'fixed':'absolute';
    pageFlowers.style.height=surface?'100%':'0';
    if(surface){const r=surface.getBoundingClientRect();pageFlowers.style.clipPath=`inset(${Math.max(0,r.top)}px ${Math.max(0,width-r.right)}px ${Math.max(0,height-r.bottom)}px ${Math.max(0,r.left)}px)`;}
    else pageFlowers.style.clipPath='';
    renderScroll=surface?0:window.scrollY;
    seedCounter.setHost(host);
  }
  function groundAt(x,y,out) {
    ray.setFromCamera(ndc.set(x/width*2-1,1-y/height*2),camera);
    return ray.ray.intersectPlane(plane,out);
  }
  function plant(item,anchor,initialId=null) {
    const {x,y}=anchorPoint(anchor);if(anchor.node)groundAt(x,y,item.position);
    Object.assign(item,{state:anchor.reserveFor?'reserved':'flower',age:0,life:0,dwell:0,offscreen:0,anchor,initialId,variant:Math.floor(random()*24),size:anchor.giant?GIANT_FLOWER_SIZE:FLOWER_SIZE_STEPS[Math.floor(random()*FLOWER_SIZE_STEPS.length)],charge:0,beat:-1,beatAge:1,artTime:-Infinity,seedFan:null});
    item.element.dataset.flowerSize=String(item.size);
    item.element.dataset.flowerEvent=anchor.giant?'large':'normal';item.element.dataset.flowerCharge='0';
    item.seed.visible=false;item.flower.material.map=art.flowers[item.variant];item.flower.center.set(.5,.14);
    const ctx=item.element.getContext('2d');ctx.clearRect(0,0,192,192);ctx.drawImage(art.flowers[item.variant].image,0,0);
    if(anchor.giant)art.drawEventFlower(item.element,item.variant,0);
    item.flower.position.copy(item.position);item.seed.position.copy(item.position);
  }
  function fillGarden() {
    if(!planted){
      const plan=planGarden();if(!plan)return;
      anchors=plan;while(items.length<Math.min(CAPACITY,plan.length+REPLANT_BATCH))items.push(makeItem());anchors.forEach((anchor,id)=>plant(items[id],anchor,id));planted=true;return;
    }
    if(actualCollections<ASSIST_START||gardenClock<nextReplant)return;
    // One batch per interval, never a catch-up burst after a delayed frame.
    nextReplant=gardenClock+REPLANT_INTERVAL;
    const detailAnchors=surface?[...surface.querySelectorAll('.dialog-copy h2,.case-step h3,.technical-notes h4,.dialog-detail p,.dialog-copy')]
      .map(node=>({node,projectId:surface.dataset.activeWork,region:'detail',pick:.5,fx:.5,fy:0,dx:0,dy:2})):[];
    const visible=shuffled([...anchors,...detailAnchors].filter(anchor=>!anchor.reserveFor&&anchor.region!=='work'&&anchorVisible(anchor))
      .flatMap(anchor=>[anchor,...[.22,.5,.78].map(fx=>({...anchor,fx:fx+(random()-.5)*.08}))]));
    const inView=anchor=>{const p=anchorPoint(anchor);return p.x>24&&p.x<width-24&&p.y>50&&p.y<height-24;};
    const choices=[...visible.filter(inView),...visible.filter(anchor=>!inView(anchor))];
    const usedNodes=new Set();
    for(let n=0;n<REPLANT_BATCH;n++){
      let item=items.find(item=>item.state==='empty');
      if(!item&&items.length<CAPACITY){item=makeItem();items.push(item);}
      if(!item)break;
      const separated=anchor=>{
        const p=anchorPoint(anchor);
        return !items.some(other=>other.state!=='empty'&&other.anchor&&anchorVisible(other.anchor)&&Math.hypot(p.x-anchorPoint(other.anchor).x,p.y-anchorPoint(other.anchor).y)<60);
      };
      const anchor=choices.find(a=>!usedNodes.has(a.node)&&separated(a))||choices.find(separated);
      if(!anchor)break;
      usedNodes.add(anchor.node);
      plant(item,{...anchor,giant:false,fx:Math.max(.1,Math.min(.9,anchor.fx+(random()-.5)*.12))});
    }
  }

  function anchorVisible(anchor) {
    resolveAnchor(anchor);
    if(surface ? anchor?.projectId!==surface.dataset.activeWork : Boolean(anchor?.projectId))return false;
    const node=anchor?.node;if(!node?.isConnected||node.closest('[hidden]'))return false;
    if(anchor.hiddenPanel&&!panelVisible(node))return false;
    const r=node.getBoundingClientRect();return r.width>1&&r.height>1;
  }
  function itemPoint(item){
    const p=anchorPoint(item.anchor);
    if(item.state==='seed'&&item.seedFan){
      const t=reducedMotion?1:Math.min(1,item.age/.5),ease=1-(1-t)**3;
      p.x+=item.seedFan.x*ease;p.y+=-FLOWER_HEAD_OFFSET*GIANT_FLOWER_SIZE*(1-ease)+item.seedFan.y*ease-(reducedMotion?0:Math.sin(t*Math.PI)*16);
    }
    return p;
  }
  function releaseSeeds(item){
    const rewards=item.anchor.giant?[item,...items.filter(other=>other.state==='reserved'&&other.anchor.reserveFor===item.anchor)]:[item];
    rewards.forEach((reward,index)=>{
      reward.state='seed';reward.age=0;reward.dwell=0;reward.flower.visible=false;reward.seed.visible=true;
      reward.variant=item.variant;
      reward.seedFan=item.anchor.giant?{x:(index-1)*48,y:index===1?8:0}:null;
    });
  }
  function collect(item, chickPosition, beakPosition) {
    if(item.state!=='seed')return;
    if(item.initialId!==null){
      if(initialCollected.has(item.initialId))return;
      initialCollected.add(item.initialId);

    }
    item.state='collecting';item.age=0;item.dwell=0;
    const previousTier=growthProgress(totalCollected).tier;
    item.pickup={x:parseFloat(item.seedElement.style.left),y:parseFloat(item.seedElement.style.top)};
    item.destination=beakPosition?beakPosition.clone():chickPosition.clone().add(new THREE.Vector3(0,.30,0));
    if(targetItem===item)targetItem=null;
    const cycle=Math.floor(totalCollected/20);
    totalCollected++;collected=growthProgress(totalCollected).stage;growthStage=collected;growthAge=0;
    seedCounter.show(++actualCollections,{evolution:growthProgress(totalCollected).tier>previousTier});
    if(actualCollections>=ASSIST_START&&!Number.isFinite(nextReplant))nextReplant=gardenClock+REPLANT_INTERVAL;
    // Keep a coherent flower family within a cycle, vary the next cycle gently.
    if(growthStage===1)growthVariant=(item.variant+cycle*5)%24;
    art.setGrowth(growthStage,growthVariant);
    crown.visible=true;onCollect(item.position,actualCollections);
    if(growthStage===10||growthStage===20)onReward();
    if(growthProgress(totalCollected).tier>previousTier)onEvolution(growthProgress(totalCollected).tier);
    onGrowthChange(growthProgress(totalCollected));
  }
  function setGrowthPreview(value) {
    const progress=growthProgress(Math.max(0,Number(value)||0));
    totalCollected=progress.total;collected=progress.stage;growthStage=progress.stage;growthAge=1;
    if(growthStage)art.setGrowth(growthStage,growthVariant);
    crown.visible=active&&growthStage>0;crown.material.opacity=growthStage?1:0;
    onEvolution(progress.tier);onGrowthChange(progress);
    return progress;
  }
  function restoreCollection(value) {
    fillGarden();
    if(!planted)return growthProgress(totalCollected);
    const count=Math.max(0,Math.floor(Number(value)||0));
    // Rebuild the tour for debug changes and the next collection cycle.
    // Consume reserved reward IDs before their parent, never leave orphaned rewards.
    const order=anchors.map((anchor,id)=>({anchor,id})).sort((a,b)=>
      (a.anchor.giant?2:a.anchor.reserveFor?1:0)-(b.anchor.giant?2:b.anchor.reserveFor?1:0));
    initialCollected.clear();targetItem=null;
    for(const item of items){item.state='empty';item.element.style.display='none';item.seedElement.style.display='none';item.flower.visible=false;item.seed.visible=false;}
    order.forEach(({anchor,id},index)=>{
      const item=items[id];
      if(index<count){
        initialCollected.add(id);item.initialId=id;item.anchor=anchor;item.state='empty';
        item.flower.visible=false;item.seed.visible=false;
      }else plant(item,anchor,id);
      item.element.style.display='none';item.seedElement.style.display='none';
    });
    actualCollections=count;
    nextReplant=count>=ASSIST_START?gardenClock+REPLANT_INTERVAL:Infinity;
    const progress=setGrowthPreview(count);
    seedCounter.show(count);
    return progress;
  }
  function update(dt, context) {
    if(disposed||!active||suspended)return;
    width=context.width;height=context.height;elapsed+=dt;gardenClock+=Math.max(0,context.clockDt??dt);
    syncSurface();
    const scrolled=context.scrollY!==lastScroll;
    scrollQuiet=scrolled?0:scrollQuiet+dt;lastScroll=context.scrollY;
    fillGarden();
    screen(context.butterfly,butterflyScreen);screen(context.chickPosition,chickScreen);
    const unit=(camera.top-camera.bottom)/(camera.zoom*Math.max(1,height));
    if(growthStage>0) {
      growthAge+=dt;
      crown.visible=true;crown.material.opacity=reducedMotion?1:THREE.MathUtils.smoothstep(growthAge,0,.18);
      const pop=reducedMotion?1:1+Math.sin(Math.min(growthAge/.45,1)*Math.PI)*.08;
      crown.scale.setScalar((growthStage<=6?.26:growthStage<=10?.30:growthStage<=15?.34:growthStage===20?.4256:.38)*pop);
    }
    for(const item of items) {
      if(item.state==='empty'||item.state==='reserved')continue;
      // Filtering/collapsing only hides a fixed slot; never retire or replace it.
      if(item.state!=='collecting'&&!anchorVisible(item.anchor)) {
        item.element.style.display=item.seedElement.style.display='none';item.dwell=0;
        if(targetItem===item)targetItem=null;
        continue;
      }
      item.age+=dt;item.life+=dt;
      if((item.state==='flower'||item.state==='bloom'||item.state==='seed')&&item.anchor) {
        const p=itemPoint(item);
        item.element.style.left=`${p.x+window.scrollX}px`;item.element.style.top=`${p.y+renderScroll}px`;
        item.seedElement.style.left=`${p.x+window.scrollX}px`;item.seedElement.style.top=`${p.y+renderScroll}px`;
        // Only the collision/seed handoff uses a camera-to-ground conversion.
        groundAt(p.x,p.y,item.position);item.flower.position.copy(item.position);
      }
      const pageFlower=(item.state==='flower'||item.state==='bloom'||item.state==='seed')&&item.anchor;
      const p=pageFlower?{...itemPoint(item),z:0}:screen(item.position);
      const bounds=surface?.getBoundingClientRect();
      const onscreen=p.z>-1&&p.z<1&&p.x>25&&p.x<width-25&&p.y>80&&p.y<height-25&&
        (!bounds||(p.x>bounds.left+20&&p.x<bounds.right-20&&p.y>bounds.top+35&&p.y<bounds.bottom-12));
      item.offscreen=onscreen?0:item.offscreen+dt;
      if(item.state==='flower') {
        const distance=Math.hypot(p.x-butterflyScreen.x,p.y-FLOWER_HEAD_OFFSET*item.size-butterflyScreen.y);
        const eligible=onscreen&&scrollQuiet>.18&&context.pointerActive;
        const near=eligible&&distance<28*item.size;
        if(item.anchor.giant){
          // Use the actual cursor so butterfly easing/idle flight cannot interrupt a hold.
          const hoverDistance=Math.hypot(p.x-(context.pointerX??butterflyScreen.x),p.y-FLOWER_HEAD_OFFSET*item.size-(context.pointerY??butterflyScreen.y));
          const held=eligible&&hoverDistance<28*item.size;
          item.charge=held?Math.min(GIANT_CHARGE_TIME,item.charge+dt):Math.max(0,item.charge-dt*2);
          const progress=item.charge/GIANT_CHARGE_TIME;
          const beat=GIANT_BEATS.filter(time=>item.charge>=time).length-1;
          item.beatAge+=dt;
          if(beat!==item.beat){
            if(beat>item.beat&&held){
              item.beatAge=0;
              const origin=new THREE.Vector3();groundAt(p.x,p.y-FLOWER_HEAD_OFFSET*item.size,origin);
              onBloom(origin,height,.22+beat*.13);
            }
            item.beat=beat;
            item.artTime=-Infinity;
          }
          if(onscreen&&elapsed-item.artTime>=.09&&(!reducedMotion||item.artTime===-Infinity)){
            art.drawEventFlower(item.element,item.variant,progress*3,reducedMotion?null:elapsed+item.phase);
            item.artTime=elapsed;
          }
          item.element.dataset.flowerCharge=progress.toFixed(3);
          const amplitude=.12+Math.max(0,beat)*.065;
          const phase=Math.min(1,item.beatAge/(.48-Math.max(0,beat)*.027));
          // Brief squash, tall spring, then a damped recoil; feet stay on the edge.
          const spring=reducedMotion?0:Math.sin(phase*Math.PI*3)*Math.pow(1-phase,1.5);
          const base=unit*FLOWER_SIZE*item.size*(1+progress*.14);
          item.flower.scale.set(base*(1+spring*amplitude*.55),base*(1-spring*amplitude),1);
          const breeze=(Math.sin(elapsed*1.575+item.phase)*.104+Math.sin(elapsed*2.745+item.phase*.7)*.024)
            *(1-THREE.MathUtils.smoothstep(item.charge,0,.4));
          item.flower.material.rotation=reducedMotion?0:breeze+Math.sin(phase*Math.PI*4)*amplitude*.18*(1-phase);
          item.flower.material.opacity=.92;item.flower.visible=true;
          if(held&&item.charge>=GIANT_CHARGE_TIME){item.state='bloom';item.age=0;}
        }else{
          item.dwell=near?item.dwell+dt:Math.max(0,item.dwell-dt*2);
          const progress=Math.min(1,item.dwell/DWELL),appear=item.anchor?.hiddenPanel?1:THREE.MathUtils.smoothstep(item.age,0,.65);
          item.flower.visible=true;item.flower.material.opacity=appear*.92;
          item.flower.scale.setScalar(unit*FLOWER_SIZE*item.size*(1+progress*.16));
          item.flower.material.rotation=reducedMotion?0:Math.sin(elapsed*2+item.phase)*.025*progress;
          if(item.dwell>=DWELL){
            if(item.anchor.floating){const r=item.anchor.node.getBoundingClientRect();item.anchor.fx=(p.x-r.left)/r.width;item.anchor.fy=(p.y-r.top)/r.height;item.anchor.frozen=true;}
            item.state='bloom';item.age=0;onBloom(item.position,height);
          }
        }
      } else if(item.state==='bloom') {
        const t=Math.min(1,item.age/(item.anchor.giant?GIANT_BLOOM_TIME:BLOOM_TIME));
        item.flower.scale.setScalar(unit*FLOWER_SIZE*item.size*(1+(reducedMotion?0:item.anchor.giant?.55:.25)*Math.sin(t*Math.PI)));
        item.flower.material.opacity=.92*(1-THREE.MathUtils.smoothstep(t,.22,1));
        if(t>=1){
          if(item.anchor.giant){const origin=new THREE.Vector3();groundAt(p.x,p.y-FLOWER_HEAD_OFFSET*item.size,origin);onBloom(origin,height,1.35);}
          releaseSeeds(item);
        }
      } else if(item.state==='seed') {
        const t=Math.min(1,item.age/.4),bounce=reducedMotion?0:Math.abs(Math.sin(t*Math.PI*2))*(1-t)*10;
        item.seed.position.copy(item.position).addScaledVector(camera.up,unit*bounce);
        item.seed.scale.setScalar(unit*24);item.seed.material.opacity=THREE.MathUtils.smoothstep(item.age,0,.12)*.94;
        item.seed.material.rotation=reducedMotion?0:Math.sin(elapsed*1.8+item.phase)*.12;
        item.seedElement.style.transform=`translate(-50%, calc(-50% - ${bounce}px)) rotate(${item.seed.material.rotation}rad)`;
        // Seeds persist until collected, including while exploring another section.
        if(onscreen&&context.canCollect&&item.age>.42&&Math.hypot(item.position.x-context.chickPosition.x,item.position.z-context.chickPosition.z)<.22)collect(item,context.chickPosition,context.beakPosition);
      } else if(item.state==='collecting') {
        const t=Math.min(1,item.age/.32),ease=1-(1-t)**3;
        const end=screen(context.beakPosition||item.destination);
        item.seedElement.style.left=`${THREE.MathUtils.lerp(item.pickup.x,end.x+window.scrollX,ease)}px`;
        item.seedElement.style.top=`${THREE.MathUtils.lerp(item.pickup.y,end.y+renderScroll,ease)}px`;
        item.seedElement.style.transform=`translate(-50%, -50%) scale(${1-t*.75})`;
        item.seed.scale.setScalar(unit*24*(1-t*.75));item.seed.material.opacity=.94*(1-t);
        if(t>=1){item.state='empty';item.seed.visible=false;}
      }
      const showFlower=item.state==='flower'||item.state==='bloom';
      item.element.style.display=showFlower?'block':'none';
      item.element.style.opacity=String(item.flower.material.opacity);
      item.seedElement.style.display=item.seed.visible?'block':'none';
      item.seedElement.style.opacity=String(item.seed.material.opacity);
      item.element.style.transform=`translate(-50%, -86%) rotate(${item.flower.material.rotation}rad) scale(${item.flower.scale.x/(unit*FLOWER_SIZE)}, ${item.flower.scale.y/(unit*FLOWER_SIZE)})`;
      // Keep bloom math shared, but never render a duplicate camera-layer flower.
      item.flower.visible=false;
    }
    // Only a short local detour; never run across the portfolio to fetch a seed.
    if(!context.canSeek||scrollQuiet<.18)targetItem=null;
    else {
      if(targetItem?.state!=='seed'||!anchorVisible(targetItem.anchor))targetItem=null;
      if(targetItem&&targetItem.position.distanceTo(context.chickPosition)>2.8)targetItem=null;
      if(!targetItem){let nearest=1.8;for(const item of items){
        if(item.state!=='seed'||item.age<.42||!anchorVisible(item.anchor))continue;
        const p=itemPoint(item);if(p.x<0||p.x>width||p.y<height*.12||p.y>height*.93)continue;
        const d=item.position.distanceTo(context.chickPosition);
        if(d<nearest){nearest=d;targetItem=item;}
      }}
    }
  }
  // While an element is charged the in-scene crest (sumi-element-fx.js) takes the crown's place:
  // a shader flame, a crackling bolt or a 3D ice crown. Otherwise the growth plant shows.
  function updateFireCrown(burning) {
    if(disposed)return;
    if(burning||suspended){crown.visible=false;return;}
    if(crown.material.map!==art.growth)crown.material.map=art.growth;
    crown.material.rotation=0;
    crown.visible=active&&growthStage>0;
    const pop=reducedMotion?1:1+Math.sin(Math.min(growthAge/.45,1)*Math.PI)*.08;
    crown.scale.setScalar((growthStage<=6?.26:growthStage<=10?.30:growthStage<=15?.34:growthStage===20?.4256:.38)*pop);
  }
  function setActive(value) {
    active=value;group.visible=value;pageFlowers.style.display=value&&!suspended?'block':'none';crown.visible=value&&growthStage>0;
    seedCounter.setActive(value&&!suspended);
    if(!value){targetItem=null;for(const item of items)item.dwell=0;}
  }
  // While the chick is transformed nothing of the garden runs: flowers and seeds leave the page
  // (one display switch on their layer), the butterfly no longer blooms flowers into seeds, the
  // chick has no seed to seek or eat, the click counter stays hidden and update() returns at
  // once. Waking only shows the layer again; the caller replants the garden from the start.
  function setSuspended(value) {
    if(suspended===value||disposed)return;
    suspended=value;
    targetItem=null;
    for(const item of items)item.dwell=0;
    pageFlowers.style.display=active&&!value?'block':'none';
    seedCounter.setActive(active&&!value);
  }
  return {
    setSuspended,
    get suspended(){return suspended;},
    // the head flower's variant (palette = floor(variant / 4)); it chooses the element
    get growthVariant(){return growthVariant;},
    showCount(){if(active&&!disposed&&!suspended)seedCounter.show(actualCollections);},
    updateFireCrown,
    updateFeedback(dt,width,height){if(!suspended)seedCounter.update(dt,width,height);},
    resetCycle(count=0){return restoreCollection(count);},
    setCollectionDebug(value){return restoreCollection(Math.min(COLLECTION_GOAL,Math.max(0,Number(value)||0)));},setGrowthPreview,get progress(){return growthProgress(totalCollected);},
    update,setActive,get target(){return targetItem?.position||null;},
    dispose(){if(disposed)return;disposed=true;seedCounter.dispose();pageFlowers.remove();scene.remove(group);head.remove(crown);
      crown.material.dispose();art.dispose();},
  };
}
