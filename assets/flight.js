import { flightProgress, tilePose } from './flight-geometry.js';

const grid=document.getElementById('grid');
const hero=document.querySelector('.hero');
const tiles=[...grid.children];
const control=document.querySelector('[data-motion-toggle]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const wide=matchMedia('(min-width: 900px)');
const F={on:false,tiles:[],drift:0,frozenDrift:null,lastT:0,landed:false};
let raf=0,paused=false,hovered=false,keyboardMode=false;
function measure(){
  const sy=scrollY,gr=grid.getBoundingClientRect();
  F.heroBottom=hero.getBoundingClientRect().bottom+sy;
  F.gridY=gr.top+sy; F.gridX=gr.left;
  F.gridW=Math.max(grid.offsetWidth,1);F.gridH=Math.max(grid.offsetHeight,1);
  F.tiles=tiles.map(el=>({el,x:F.gridX+el.offsetLeft,y:F.gridY+el.offsetTop,w:el.offsetWidth,h:el.offsetHeight,hover:0,target:0}));
}
function clearFlight(){
  grid.classList.remove('flying');
  tiles.forEach(el=>el.style.removeProperty('transform'));
}
function wake(){if(F.on&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
function frame(t){
  raf=0;
  if(!F.on||document.hidden)return;
  const dt=Math.min((t-F.lastT)/1000,.05)||0; F.lastT=t;
  const state=flightProgress({width:innerWidth,height:innerHeight,scroll:scrollY,heroBottom:F.heroBottom,gridY:F.gridY});
  const {p,stripW,yBase}=state;
  if(p>=1){if(!F.landed){clearFlight();F.landed=true;}return;}
  if(F.landed){F.landed=false;grid.classList.add('flying');}
  const visible=yBase+stripW>0&&yBase-stripW<innerHeight;
  const canDrift=p<=.001&&!paused&&!hovered&&!document.querySelector('dialog[open]')&&visible;
  if(p<=.001){
    if(F.frozenDrift!==null){F.drift=F.frozenDrift;F.frozenDrift=null;}
    if(canDrift)F.drift+=dt*36;
  }else if(F.frozenDrift===null)F.frozenDrift=F.drift;
  const ctx={...F,...state,width:innerWidth,scroll:scrollY,count:F.tiles.length,drift:F.frozenDrift??F.drift};
  let easingHover=false;
  F.tiles.forEach((c,i)=>{
    c.hover+=(c.target-c.hover)*Math.min(dt*10,1);
    if(Math.abs(c.target-c.hover)>.005)easingHover=true;
    const pose=tilePose(c,i,ctx);
    c.el.style.transform=`translate3d(${pose.x.toFixed(2)}px,${pose.y.toFixed(2)}px,0) rotate(${pose.rotation.toFixed(3)}deg) scale(${pose.scale.toFixed(4)})`;
  });
  // Once settled, only scrolling or another real interaction requests a frame.
  if(canDrift||(!paused&&easingHover))wake();
}
function applyMode(){
  cancelAnimationFrame(raf);raf=0;
  F.on=wide.matches&&!reduced.matches&&!keyboardMode;
  document.body.classList.toggle('static',!F.on);
  clearFlight();
  if(F.on){grid.classList.add('flying');F.landed=false;measure();F.lastT=performance.now();wake();}
  control.hidden=reduced.matches;
}
control.addEventListener('click',()=>{
  paused=!paused;
  control.setAttribute('aria-pressed',String(paused));
  control.textContent=paused?'Play motion':'Pause motion';
  document.body.classList.toggle('motion-paused',paused);
  if(!paused&&keyboardMode){keyboardMode=false;applyMode();}else wake();
});
tiles.forEach(el=>{
  el.addEventListener('pointerenter',()=>{hovered=true;const c=F.tiles.find(t=>t.el===el);if(c)c.target=1;wake();});
  el.addEventListener('pointerleave',()=>{hovered=false;const c=F.tiles.find(t=>t.el===el);if(c)c.target=0;wake();});
});
// Keyboard visitors get stationary, fully visible project links.
grid.addEventListener('focusin',e=>{
  if(F.on&&!F.landed&&e.target.matches(':focus-visible')){
    keyboardMode=true;paused=true;control.textContent='Play motion';
    control.setAttribute('aria-pressed','true');document.body.classList.add('motion-paused');
    applyMode();e.target.scrollIntoView({block:'center'});
  }
});
window.addEventListener('scroll',wake,{passive:true});
window.addEventListener('portfolio:previewchange',()=>{F.lastT=performance.now();wake();});
let resizeTimer;
window.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);resizeTimer=setTimeout(applyMode,120);
},{passive:true});
reduced.addEventListener('change',applyMode);
wide.addEventListener('change',applyMode);
document.addEventListener('visibilitychange',()=>{
  document.body.classList.toggle('page-hidden',document.hidden);
  if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{F.lastT=performance.now();wake();}
});
window.addEventListener('load',()=>{if(F.on){measure();wake();}});
document.fonts?.ready.then(()=>{if(F.on){measure();wake();}});
const strip=document.querySelector('.m-strip');
if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting))).observe(strip);
}else strip.classList.add('in-view');
applyMode();
