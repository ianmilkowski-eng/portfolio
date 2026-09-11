import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { flightProgress,tilePose } from '../assets/flight-geometry.js';

// Verify varied editorial artwork lands exactly at every desktop width.
for(const width of [900,1024,1250,1440,1920]){
  const height=900,heroBottom=450,gridY=2450;
  const progress=[0,500,1100,1900,3200].map(scroll=>flightProgress({width,height,scroll,heroBottom,gridY}));
  assert.equal(progress[0].p,0);assert.equal(progress.at(-1).p,1);
  progress.forEach((p,i)=>{if(i)assert.ok(p.p>=progress[i-1].p);});
  const artwork=[[40,0,620,620],[40,850,1120,509],[40,1850,650,481],[580,2650,580,580],[40,3480,536,800]];
  for(let i=0;i<artwork.length;i++){
    const [x,y,w,h]=artwork[i],c={x,y:gridY+y,w,h,hover:0};
    const ctx={...progress.at(-1),width,scroll:3200,count:5,drift:100,gridX:40,gridY,gridW:1120,gridH:4300};
    const pose=tilePose(c,i,ctx);
    assert.ok(Math.abs(pose.x)<1e-8 && Math.abs(pose.y)<1e-8);
    assert.ok(Math.abs(pose.rotation)<1e-8);assert.equal(pose.scale,1);
    const start=tilePose(c,i,{...ctx,...progress[0]});
    assert.ok(Math.max(w,h)*start.scale<=progress[0].stripW+.001, 'Every aspect ratio fits the moving strip');
    for(const p of progress){const mid=tilePose(c,i,{...ctx,...p});Object.values(mid).forEach(v=>assert.ok(Number.isFinite(v)));}
  }
}

// Exercise the actual controller with a deterministic browser-shaped event loop.
const events=new Map(),queue=new Map();let nextId=1;
const eventTarget=()=>({addEventListener(name,fn){const list=events.get(this)||{};(list[name]??=[]).push(fn);events.set(this,list);}});
const fire=(el,name,data={})=>(events.get(el)?.[name]||[]).forEach(fn=>fn(data));
const classes=()=>{const set=new Set();return{add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v),toggle:(v,on)=>on?set.add(v):set.delete(v)}};
const body={classList:classes()};body.classList.add('static');
const artwork=[[40,0,620,620],[40,850,1120,509],[40,1850,650,481],[580,2650,580,580],[40,3480,536,800]];
let extraHeight=0,resizeCallback;
const tiles=artwork.map(([left,y,width,height])=>Object.assign(eventTarget(),{style:{removeProperty(k){delete this[k]}},matches:()=>false,getBoundingClientRect:()=>({left,top:grid.getBoundingClientRect().top+y+(y>1000?extraHeight:0),width,height})}));
const context={console,Math,performance:{now:()=>100},innerWidth:1250,innerHeight:900,scrollY:0,flightProgress,tilePose,setTimeout:fn=>fn(),clearTimeout(){},requestAnimationFrame(fn){const id=nextId++;queue.set(id,fn);return id;},cancelAnimationFrame:id=>queue.delete(id)};
const grid=Object.assign(eventTarget(),{querySelectorAll:()=>tiles,offsetWidth:1120,offsetHeight:4300,classList:classes(),getBoundingClientRect:()=>({left:40,top:(body.classList.contains('static')?850:2450)-context.scrollY})});
const hero={getBoundingClientRect:()=>({bottom:450-context.scrollY})};
const control=Object.assign(eventTarget(),{setAttribute(){},hidden:true});
const strip={classList:classes()};
const reduced=Object.assign(eventTarget(),{matches:false}),wide=Object.assign(eventTarget(),{matches:true});
context.matchMedia=q=>q.includes('reduce')?reduced:wide;
context.document=Object.assign(eventTarget(),{hidden:false,body,getElementById:()=>grid,querySelector:s=>s==='.hero'?hero:s==='[data-motion-toggle]'?control:s==='.m-strip'?strip:null});
context.ResizeObserver=class {constructor(callback){resizeCallback=callback;} observe(){}};
context.window=Object.assign(eventTarget(),{dispatchEvent(){},ResizeObserver:context.ResizeObserver});
const source=(await readFile(new URL('../assets/flight.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
vm.runInNewContext(source,context);
const step=()=>{const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(200));};
assert.equal(queue.size,1);step();assert.equal(queue.size,1,'drifting strip requests one frame');
assert.deepEqual(Array.from(vm.runInNewContext('F.tiles.map(c=>[c.x,c.y,c.w,c.h])',context),row=>Array.from(row)),artwork.map(([x,y,w,h])=>[x,2450+y,w,h]),'Nested artwork uses actual document rectangles');
extraHeight=420;resizeCallback();step();step();
assert.equal(vm.runInNewContext('F.tiles[2].y',context),2450+1850+420,'Disclosure expansion refreshes downstream artwork positions');
fire(control,'click');step();assert.equal(queue.size,0,'paused strip stops');
fire(control,'click');step();assert.equal(queue.size,1,'resumed strip runs');
context.scrollY=3200;fire(context.window,'scroll');step();assert.equal(queue.size,0,'landed grid has no ongoing loop');
assert.ok(tiles.every(t=>!t.style.transform));
context.scrollY=100;fire(context.window,'scroll');step();assert.equal(queue.size,1,'scrolling back wakes the strip');
context.document.hidden=true;fire(context.document,'visibilitychange');assert.equal(queue.size,0,'hidden tabs cancel frames');
context.document.hidden=false;fire(context.document,'visibilitychange');assert.equal(queue.size,1);
reduced.matches=true;fire(reduced,'change');assert.equal(queue.size,0);assert.ok(body.classList.contains('static'));assert.ok(tiles.every(t=>!t.style.transform));
reduced.matches=false;fire(reduced,'change');assert.equal(queue.size,1);assert.ok(!body.classList.contains('static'));
wide.matches=false;fire(wide,'change');assert.equal(queue.size,0);assert.ok(body.classList.contains('static'));
wide.matches=true;fire(wide,'change');assert.equal(queue.size,1);assert.ok(!body.classList.contains('static'));
console.log('PASS: 5 viewport geometries, exact landing, monotonic scroll, finite poses, nested layout measurement, disclosure resizing, pause/resume, reverse scrolling, idle/hidden cancellation, responsive and live reduced-motion changes.');

// A lazily loaded iframe can expose a different frame timestamp origin.
// Exercise the real player, including pause/resume, without a canvas renderer.
const playerQueue=new Map(),playerElements=new Map();let playerId=0;
for(const id of ['stage','artwork','fallback','toggle','restart','progress','time','status']) {
  playerElements.set(id,Object.assign(eventTarget(),{clientWidth:500,clientHeight:300,hidden:false,value:'0',setAttribute(){}}));
}
const playerDocument=Object.assign(eventTarget(),{hidden:false,getElementById:id=>playerElements.get(id)});
const playerMotion=Object.assign(eventTarget(),{matches:false});
let lastRendered;
class FakeEffect {
  async load(){this.loaded=true;}
  resize(){} render(t){lastRendered=t;} pause(){} dispose(){}
}
const playerContext={Math,String,Number,document:playerDocument,window:eventTarget(),matchMedia:()=>playerMotion,devicePixelRatio:1,
  performance:{now:()=>90000},CialoHologram:FakeEffect,ResizeObserver:class{observe(){} disconnect(){}},
  requestAnimationFrame(fn){const id=++playerId;playerQueue.set(id,fn);return id;},cancelAnimationFrame:id=>playerQueue.delete(id)};
vm.runInNewContext(await readFile(new URL('../assets/cialo/interactive/player.js',import.meta.url),'utf8'),playerContext);
const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
const playerStep=t=>{const callbacks=[...playerQueue.values()];playerQueue.clear();callbacks.forEach(fn=>fn(t));};
fire(playerElements.get('toggle'),'click');await settle();
playerStep(1000);assert.equal(lastRendered,0,'The iframe starts at zero even with a different performance clock');
playerStep(2100);assert.equal(lastRendered,1.1);
fire(playerElements.get('toggle'),'click');assert.equal(playerQueue.size,0,'Player pause cancels the frame');
fire(playerElements.get('toggle'),'click');await settle();playerStep(5000);assert.equal(lastRendered,1.1,'Resume preserves playback position');
playerStep(8500);assert.equal(lastRendered,4.4);assert.equal(playerQueue.size,0);
assert.equal(playerElements.get('time').textContent,'4.4 / 4.4 s');
console.log('PASS: lazy iframe clock origin, player pause/resume, duration clamping, and playback completion.');
