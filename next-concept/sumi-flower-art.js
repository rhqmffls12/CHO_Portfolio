import * as THREE from './assets/vendor/three-r186/three.module.min.js';

// Small illustrated cups, viewed obliquely: rear petals, elliptical opening,
// then the front lip. No photographic shading or face-on radial rosette.
const PALETTES = [
  ['#FFC531','#F29522','#FFDF67'], ['#FF7156','#D84145','#FFAC79'],
  ['#EA58A2','#B73579','#FF9DCC'], ['#558FF2','#365CC2','#95C8FF'],
  ['#A977EB','#7442B4','#D6AEFF'], ['#37C5AC','#168C85','#86E9CC'],
];
function map(draw) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
  const c=canvas.getContext('2d');c.scale(1.5,1.5);draw(c);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;
}
function ellipse(c,x,y,rx,ry,rotation,color) {
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fill();
}
function stem(c,short=false) {
  c.strokeStyle='#477645';c.lineWidth=5;c.lineCap='round';
  c.beginPath();c.moveTo(63,short?70:53);c.quadraticCurveTo(70,83,65,113);c.stroke();
  ellipse(c,51,90,17,7,.65,'#57A45B');ellipse(c,77,99,15,6,-.75,'#39814E');
}
function flower(c,type,palette,withStem=true,opening=1) {
  const [main,shade,light]=PALETTES[palette];
  if(withStem)stem(c);
  c.save();c.translate(64,withStem?51:64);c.rotate(-.12);
  c.scale(opening,opening);
  if(type===0) { // open poppy, cupped rather than a front-facing disc
    ellipse(c,-22,-9,19,24,-.65,main);ellipse(c,0,-19,20,25,.1,main);ellipse(c,23,-8,19,23,.7,main);
    ellipse(c,0,7,34,13,0,light);
    c.strokeStyle=shade;c.lineWidth=2.6;
    for(const [x,y] of [[-13,-11],[0,-17],[12,-10]]){c.beginPath();c.moveTo(x*.35,8);c.lineTo(x,y);c.stroke();ellipse(c,x,y,2.5,3,0,shade);}
    ellipse(c,-17,15,20,10,.25,shade);ellipse(c,15,16,21,10,-.25,main);
  } else if(type===1) { // tulip: pointed rear petals, rounded front bowl
    c.fillStyle=light;c.beginPath();c.moveTo(-28,4);c.lineTo(-22,-30);c.lineTo(-5,-15);c.lineTo(5,-35);c.lineTo(19,-13);c.lineTo(31,-25);c.lineTo(28,8);c.closePath();c.fill();
    c.fillStyle=main;c.beginPath();c.moveTo(-29,-7);c.bezierCurveTo(-8,-3,8,13,29,-5);c.bezierCurveTo(30,37,-27,41,-29,-7);c.fill();
    c.fillStyle=shade;c.beginPath();c.moveTo(4,27);c.quadraticCurveTo(24,20,29,-5);c.quadraticCurveTo(36,23,4,27);c.fill();
  } else if(type===2) { // daisy with a visibly foreshortened petal plane
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;ellipse(c,Math.cos(a)*24,Math.sin(a)*13-4,15,7,a*.45, i<5?main:light);}
    ellipse(c,0,-3,15,9,0,'#F5B42D');ellipse(c,-3,-6,9,4,0,'#FFE77D');
    ellipse(c,0,14,19,6,0,shade);
  } else { // bell: drooping cap with elliptical open hem
    c.fillStyle=main;c.beginPath();c.moveTo(-27,12);c.bezierCurveTo(-13,-1,-23,-30,0,-31);c.bezierCurveTo(26,-31,17,0,30,13);c.quadraticCurveTo(0,27,-27,12);c.fill();
    ellipse(c,1,13,28,10,.03,shade);ellipse(c,1,10,20,5,.03,light);
    c.strokeStyle='#F4BC35';c.lineWidth=3;c.beginPath();c.moveTo(0,10);c.lineTo(0,25);c.stroke();ellipse(c,0,26,4,3,0,'#FFD65B');
  }
  c.restore();
}

// A shared illustrated vocabulary: the original leaves, cupped petals and flat fills.
// Draw only the current stage into one reusable texture; no growing texture cache.
function growthDrawing(c,stage,variant,sprout,buds) {
  const palette=Math.floor(variant/4),type=variant%4;
  const [main,shade,light]=PALETTES[palette];
  const line=(points,width=4,color='#43894B')=>{
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  };
  const leaf=(x,y,size,angle,bright=false)=>ellipse(c,x,y,size,size*.45,angle,bright?'#65C65B':'#43A94F');
  const bloom=(x,y,size)=>{c.save();c.translate(x-64*size,y-64*size);c.scale(size,size);flower(c,type,palette,false);c.restore();};
  const bud=(x,y,size=1)=>{
    ellipse(c,x,y,12*size,17*size,-.12,main);ellipse(c,x+4*size,y+2*size,5*size,14*size,.2,shade);
    ellipse(c,x-5*size,y+12*size,9*size,4*size,.55,'#4EAB54');ellipse(c,x+6*size,y+12*size,9*size,4*size,-.55,'#4EAB54');
  };
  if(stage===4){c.drawImage(sprout.image,0,0,128,128);return;}
  if(stage===8){c.drawImage(buds[palette].image,0,0,128,128);return;}
  if(stage<=6) {
    const top=stage<=2?83:stage<=4?69:49;
    line([[64,108],[62,87],[65,top]],4);
    leaf(stage===1?55:49,top+1,stage<=2?12:21,.5,true);
    if(stage>=2)leaf(77,top-7,stage===3?12:stage===2?12:21,-.5);
    if(stage>=5)leaf(52,80,16,.45,true);
    if(stage>=6)leaf(78,88,15,-.45);
    return;
  }
  if(stage<=15) {
    line([[64,109],[62,80],[64,stage===7?65:51]],4.5);
    leaf(50,89,16,.5,true);leaf(78,98,15,-.5);
    if(stage===7){bud(64,59,.65);return;}
    if(stage===9){bud(64,56,.85);bloom(64,53,.43);return;}
    if(stage>=11)leaf(79,75,17,-.6);
    if(stage>=12){
      if(stage===12){line([[63,95],[33,89],[27,77]],3);bud(27,73,.55);}
      else {line([[63,84],[40,69],[35,53]],3);bloom(34,48,.46);}
    }
    if(stage>=14){line([[64,87],[88,70],[94,58]],3);bloom(94,52,.42);}
    if(stage===15){leaf(38,79,18,.45,true);leaf(88,88,19,-.4);leaf(46,100,15,.2);}
    bloom(64,stage>=13?38:51,stage>=13?.66:.9);
    return;
  }
  // Compact little tree, never a realistic/heavy tree model.
  const wide=stage>=18,top=wide?30:stage===16?51:38;
  // Cycle finale: a visibly stout trunk beneath the same illustrated canopy.
  const trunkGrowth=stage===20?3:1;
  line([[64,110],[63,80],[65,top+6]],(stage>=18?7:5)*trunkGrowth,'#956846');
  line([[64,83],[43,64],[36,top+10]],4,'#956846');
  line([[64,77],[84,60],[91,top+10]],4,'#956846');
  leaf(37,top+10,wide?25:18,-.35,true);
  leaf(90,top+10,wide?25:18,.35);
  leaf(64,top-3,wide?25:19,-.1,true);
  if(stage>=17){leaf(47,top+28,23,.25);leaf(80,top+28,23,-.25,true);}
  if(stage>=18){leaf(27,top+27,15,.1);leaf(101,top+26,15,-.2,true);}
  if(stage>=19){
    const flowerGrowth=stage===20?1.5:1;
    bloom(40,39,.28*flowerGrowth);bloom(84,47,.3*flowerGrowth);bloom(66,24,.24*flowerGrowth);
  }
}
export function createFlowerArtwork() {
  const flowers=Array.from({length:24},(_,i)=>map(c=>flower(c,i%4,Math.floor(i/4))));
  const crowns=Array.from({length:24},(_,i)=>map(c=>flower(c,i%4,Math.floor(i/4),false)));
  const sprout=map(c=>{
    c.lineWidth=5;c.strokeStyle='#43894B';c.lineCap='round';c.beginPath();c.moveTo(64,99);c.quadraticCurveTo(61,79,65,65);c.stroke();
    ellipse(c,48,62,22,10,.5,'#65C65B');ellipse(c,80,53,23,11,-.5,'#43A94F');
  });
  const buds=PALETTES.map(([main,shade])=>map(c=>{
    c.strokeStyle='#43894B';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(64,102);c.lineTo(64,70);c.stroke();
    ellipse(c,64,57,16,23,-.12,main);ellipse(c,70,60,7,19,.2,shade);
    c.fillStyle='#4EAB54';c.beginPath();c.moveTo(45,66);c.lineTo(62,76);c.lineTo(81,66);c.lineTo(72,83);c.lineTo(58,84);c.closePath();c.fill();
  }));
  const seed=map(c=>{
    c.fillStyle='#FFCF43';c.strokeStyle='#B77A22';c.lineWidth=2;
    c.beginPath();c.moveTo(64,28);c.quadraticCurveTo(70,55,87,64);c.quadraticCurveTo(69,71,64,98);c.quadraticCurveTo(57,71,41,64);c.quadraticCurveTo(58,55,64,28);c.fill();c.stroke();
    ellipse(c,61,58,3,6,.3,'#FFF0AD');
  });
  // The elemental head marks (flame, bolt, ice crown) are drawn in-scene by sumi-element-fx.js.
  const growth=map(()=>{});
  growth.name='sumi-head-plant';
  function setGrowth(stage,variant=0) {
    const c=growth.image.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,192,192);c.scale(1.5,1.5);
    growthDrawing(c,Math.max(1,Math.min(20,stage)),((variant%24)+24)%24,sprout,buds);
    growth.needsUpdate=true;return growth;
  }
  function drawEventFlower(canvas,variant,visits,time=null){
    const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
    c.save();c.scale(canvas.width/128,canvas.height/128);
    flower(c,variant%4,Math.floor(variant/4),true,.72+Math.min(visits,3)*.12);
    // Three restrained glints distinguish event flowers without a badge or a halo.
    for(const [i,x,y] of [[0,22,35],[1,106,57],[2,88,17]]){
      const shimmer=time===null?.6:Math.pow((Math.sin(time*1.65+i*2.1)+1)/2,2);
      const radius=3.4+shimmer*4;
      c.globalAlpha=.20+shimmer*.68;c.fillStyle=i===1?'#E7F2BA':'#FFF6D5';
      c.beginPath();c.moveTo(x,y-radius);c.quadraticCurveTo(x+.7,y-.7,x+radius*.7,y);
      c.quadraticCurveTo(x+.7,y+.7,x,y+radius);c.quadraticCurveTo(x-.7,y+.7,x-radius*.7,y);
      c.quadraticCurveTo(x-.7,y-.7,x,y-radius);c.fill();
    }
    c.restore();
  }
  return {flowers,crowns,sprout,buds,seed,growth,setGrowth,drawEventFlower,dispose(){for(const t of [...flowers,...crowns,sprout,...buds,seed,growth])t.dispose();}};
}
