// Bounded Canvas2D ground skills. Positions are captured once in document coordinates.
export function createGroundSkill({reducedMotion=false}={}) {
  const canvas=document.createElement('canvas');canvas.className='sumi-ground-skill';
  canvas.width=900;canvas.height=720;canvas.hidden=true;canvas.setAttribute('aria-hidden','true');
  const layer=document.createElement('div');layer.className='sumi-ground-layer';layer.setAttribute('aria-hidden','true');layer.append(canvas);
  const c=canvas.getContext('2d'),points=[];
  let host=null,kind=null,age=0,duration=0,originX=0,originY=0,scale=1,viewWidth=0,viewHeight=0;
  const scroll=()=>window.scrollY+(host&&host!==document.body?host.scrollTop:0);
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=(v,a,b)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  function polygon(vertices,color,alpha=1){
    c.fillStyle=color;c.globalAlpha=alpha;c.beginPath();vertices.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
  }
  function ring(x,y,r,color,alpha){
    c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=1.8;c.beginPath();c.ellipse(x,y,r,r*.3,0,0,Math.PI*2);c.stroke();
  }
  function glow(x,y,r,color,alpha){
    c.save();c.translate(x,y);c.scale(1,.32);c.globalAlpha=alpha;
    const g=c.createRadialGradient(0,0,1,0,0,r);g.addColorStop(0,color);g.addColorStop(1,'#ffffff00');
    c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();
  }
  function lightning(){
    for(const p of points){
      const t=age-p.delay;if(t<0)continue;
      const arrival=reducedMotion?1:smooth(t,0,.13),fade=1-smooth(t,.35,1.1);
      if(t<.13)ring(p.x,p.y,12+arrival*14,'#B5DDF2',.35);
      const opacity=arrival*fade;
      const jitter=reducedMotion?0:Math.sin(t*17+p.seed)*3;
      for(const [width,color,a] of [[16,'#83BCE7',.17],[6,'#F4CE54',.85],[2,'#FFFADE',1]]){
        c.globalAlpha=opacity*a;c.lineWidth=width;c.strokeStyle=color;c.lineJoin='round';c.beginPath();
        for(let j=0;j<=12;j++){
          const u=j/12*arrival,x=p.x+Math.sin(j*2.71+p.seed)*(1-u)*19+jitter*Math.sin(u*Math.PI);
          const y=p.y-p.height*(1-u);
          j?c.lineTo(x,y):c.moveTo(x,y);
        }
        c.stroke();
      }
      if(t>=.12){
        const hit=t-.12,life=1-smooth(hit,.3,1.05);
        glow(p.x,p.y,62,'#D7EDFF',life*.6);
        ring(p.x,p.y,18+Math.min(hit/.4,1)*64,'#A9D9FC',life*.75);
        for(let j=0;j<5;j++){
          const angle=p.seed+j*1.256,r=25+j%2*13;
          c.globalAlpha=life*.7;c.strokeStyle='#F9DF8F';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y);
          c.lineTo(p.x+Math.cos(angle)*r*.55,p.y+Math.sin(angle)*r*.2);
          c.lineTo(p.x+Math.cos(angle+.2)*r,p.y+Math.sin(angle+.2)*r*.32);c.stroke();
        }
        if(!reducedMotion)for(let j=0;j<8;j++){
          const a=j*.785+p.seed,r=hit*(80+j*8),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r*.35-Math.sin(clamp(hit/.7)*Math.PI)*24;
          c.globalAlpha=Math.max(0,1-hit/.7)*.85;c.fillStyle=j%2?'#E6F6FF':'#FFE797';c.fillRect(x,y,2.3,3.5);
        }
      }
    }
  }
  function ice(){
    // Draw back to front, so neighboring pillars overlap like planted objects.
    for(const p of points){
      const t=age-p.delay;if(t<0)continue;
      const fade=1-smooth(t,1.65,2.25),u=clamp((t-.09)/.32);
      const rise=reducedMotion?1:1+2.25*(u-1)**3+1.25*(u-1)**2;
      const h=p.height*Math.max(0,rise),w=p.width;
      glow(p.x,p.y,48,'#75CEE8',fade*.35);
      ring(p.x,p.y,12+smooth(t,0,.5)*45,'#A9E6F4',fade*.65);
      // Ground cracks open before the crystal erupts.
      for(let j=0;j<4;j++){
        const a=p.seed+j*1.57,r=(20+j*3)*smooth(t,0,.15);
        c.globalAlpha=fade*.7;c.strokeStyle='#78B6CB';c.lineWidth=1.2;c.beginPath();c.moveTo(p.x,p.y);
        c.lineTo(p.x+Math.cos(a)*r*.5,p.y+Math.sin(a)*r*.16);
        c.lineTo(p.x+Math.cos(a+.25)*r,p.y+Math.sin(a+.25)*r*.32);c.stroke();
      }
      if(h>0){
        const x=p.x,y=p.y;
        polygon([[x-w*.55,y-5],[x-w*.72,y-h*.62],[x+w*.03,y-h],[x+w*.42,y-h*.7],[x+w*.55,y-5],[x,y+8]],'#61ACD0',fade*.95);
        polygon([[x+w*.03,y-h],[x+w*.42,y-h*.7],[x+w*.55,y-5],[x,y+8],[x-w*.06,y-h*.67]],'#B8EDFA',fade*.96);
        polygon([[x+w*.03,y-h],[x-w*.06,y-h*.67],[x-w*.72,y-h*.62]],'#E8FBFF',fade);
        c.globalAlpha=fade*.85;c.strokeStyle='#EEFCFF';c.lineWidth=1.6;c.beginPath();c.moveTo(x+w*.03,y-h);c.lineTo(x-w*.06,y-h*.67);c.lineTo(x,y+8);c.stroke();
        // Small planted satellites strengthen the jagged ice-rock silhouette.
        polygon([[x+w*.3,y],[x+w*.58,y-h*.34],[x+w*.89,y-h*.21],[x+w*.7,y+3]],'#8DD4EB',fade*.85);
      }
      if(!reducedMotion&&t<.75)for(let j=0;j<6;j++){
        const life=clamp((t-.08)/.65),a=j*1.047+p.seed;
        const x=p.x+Math.cos(a)*life*65,y=p.y+Math.sin(a)*life*23-Math.sin(life*Math.PI)*(25+j*3);
        polygon([[x-3,y],[x,y-7],[x+4,y],[x,y+3]],'#DDF9FF',(1-life)*fade*.8);
      }
    }
  }
  function clear(){kind=null;canvas.hidden=true;points.length=0;c.clearRect(0,0,900,720);}
  return {
    canvas,
    trigger(element,x,y,dx,dy,currentHost,width,height){
      host=currentHost;host.append(layer);kind=element;age=0;duration=element==='lightning'?1.8:2.8;
      viewWidth=width;viewHeight=height;originX=x+window.scrollX;originY=y+scroll();scale=Math.min(1,width/760);
      points.length=0;
      const direction=Math.atan2(dy,dx),seed=Math.random()*Math.PI*2;
      const count=reducedMotion?3:element==='lightning'?6:5;
      for(let i=0;i<count;i++){
        let px,py;
        if(element==='lightning'){
          const a=seed+i/count*Math.PI*2,r=120+Math.random()*80;
          px=450+Math.cos(a)*r;py=470+Math.sin(a)*r*.48;
        }else{
          const distance=65+i*57,side=(i%2?1:-1)*(15+Math.random()*24);
          px=450+Math.cos(direction)*distance-Math.sin(direction)*side;
          py=470+Math.sin(direction)*distance*.65+Math.cos(direction)*side*.5;
        }
        points.push({x:px,y:py,height:element==='lightning'?210+Math.random()*100:115+Math.random()*85+i*10,
          width:28+Math.random()*16,delay:reducedMotion?0:i*(element==='lightning'?.105:.13),seed:seed+i*2.31});
      }
      if(element==='ice')points.sort((a,b)=>a.y-b.y);
      canvas.dataset.element=element;canvas.hidden=false;
    },
    update(dt,currentHost,width,height){
      if(!kind)return;
      if(host!==currentHost||width!==viewWidth||height!==viewHeight){clear();return;}
      age+=Math.max(0,dt);if(age>=duration){clear();return;}
      canvas.style.left=`${originX-window.scrollX}px`;canvas.style.top=`${originY-scroll()}px`;
      canvas.style.transform=`scale(${scale}) translate(-450px,-470px)`;
      if(host!==document.body){const r=host.getBoundingClientRect();
        layer.style.clipPath=`inset(${Math.max(0,r.top)}px ${Math.max(0,width-r.right)}px ${Math.max(0,height-r.bottom)}px ${Math.max(0,r.left)}px)`;
      }
      else layer.style.clipPath='';
      c.clearRect(0,0,900,720);kind==='lightning'?lightning():ice();
    },
    clear,dispose(){clear();layer.remove();}
  };
}
