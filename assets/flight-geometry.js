// Preserve the original Netlify strip-to-grid choreography. All coordinates are
// derived from the real grid; the last pose is its untransformed layout.
export const clamp = (v,a,b) => Math.min(Math.max(v,a),b);
const mix = (a,b,t) => a+(b-a)*t;
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
export function flightProgress({width,height,scroll,heroBottom,gridY}) {
  const stripW=clamp(width*.24,300,380), anchor=heroBottom+stripW*.64;
  const pin=height*.54, start=anchor-pin, hold=height*.14;
  const distance=Math.max(gridY-height*.20-start-hold,height*1.2);
  return {stripW, p:scroll<start?0:clamp((scroll-start-hold)/distance,0,1), yBase:scroll<start?anchor-scroll:pin};
}
export function tilePose(c,i,{width,scroll,count,drift,gridX,gridY,gridW,gridH,stripW,p,yBase}) {
  // The five-card loop must wrap beyond both viewport edges, including rotation
  // and shadows. A count-only loop recycled cards while still visible on wide screens.
  const edge=stripW+26,total=Math.max(count*edge,width+2*edge),spacing=total/count;
  const x=((i*spacing-drift)%total+total)%total-edge;
  const delay=(c.y-gridY)/gridH*.20+(c.x-gridX)/gridW*.06;
  const k=ease(clamp((p-delay)/.74,0,1));
  const y=yBase+(x-width/2)*-.11-(c.hover||0)*12*(1-k);
  return {x:mix(x-(c.x+c.w/2),0,k),y:mix(y-(c.y-scroll+c.h/2),0,k)-Math.sin(k*Math.PI)*42,rotation:-11*(1-Math.min(k*1.35,1)),scale:mix(stripW/Math.max(c.w,c.h),1,k)};
}
