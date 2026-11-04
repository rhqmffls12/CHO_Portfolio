const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// A quiet waiting spot in the detail dialog's lower-right margin.
export function mediaPerch(stage,dialog,width,height,time=0,reducedMotion=false){
  const right=Math.min(width,dialog.right),bottom=Math.min(height,dialog.bottom);
  const left=Math.max(0,dialog.left),top=Math.max(0,dialog.top);
  const sideGap=right-stage.right;
  const x=sideGap>=80?stage.right+sideGap*.5:right-44;
  const y=sideGap>=80?bottom-82:Math.min(bottom-46,stage.bottom+48);
  return {x:clamp(x+(reducedMotion?0:Math.sin(time*.8)*3),left+28,right-28),
    y:clamp(y+(reducedMotion?0:Math.sin(time*1.15)*4),top+36,bottom-32)};
}
