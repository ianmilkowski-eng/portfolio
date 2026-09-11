import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { flightProgress,tilePose } from '../assets/flight-geometry.js';

// Verify landing across both desktop grid layouts and back through the runway.
for(const width of [900,1024,1250,1440,1920]){
  const height=900,heroBottom=450,gridY=2450;
  const progress=[0,500,1100,1900,3200].map(scroll=>flightProgress({width,height,scroll,heroBottom,gridY}));
  assert.equal(progress[0].p,0);assert.equal(progress.at(-1).p,1);
  progress.forEach((p,i)=>{if(i)assert.ok(p.p>=progress[i-1].p);});
  for(let i=0;i<15;i++){
    const c={x:40+(i%4)*280,y:gridY+Math.floor(i/4)*280,w:264,h:264,hover:0};
    const ctx={...progress.at(-1),width,scroll:3200,count:15,drift:100,gridX:40,gridY,gridW:1120,gridH:1120};
    const pose=tilePose(c,i,ctx);
    assert.ok(Math.abs(pose.x)<1e-8 && Math.abs(pose.y)<1e-8);
    assert.ok(Math.abs(pose.rotation)<1e-8);assert.equal(pose.scale,1);
    for(const p of progress){const mid=tilePose(c,i,{...ctx,...p});Object.values(mid).forEach(v=>assert.ok(Number.isFinite(v)));}
  }
}

// Exercise the actual controller with a deterministic browser-shaped event loop.
const events=new Map(),queue=new Map();let nextId=1;
const eventTarget=()=>({addEventListener(name,fn){const list=events.get(this)||{};(list[name]??=[]).push(fn);events.set(this,list);}});
const fire=(el,name,data={})=>(events.get(el)?.[name]||[]).forEach(fn=>fn(data));
const classes=()=>{const set=new Set();return{add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v),toggle:(v,on)=>on?set.add(v):set.delete(v)}};
const body={classList:classes()};body.classList.add('static');
const tiles=Array.from({length:15},(_,i)=>Object.assign(eventTarget(),{offsetLeft:(i%4)*280,offsetTop:Math.floor(i/4)*280,offsetWidth:264,offsetHeight:264,style:{removeProperty(k){delete this[k]}},matches:()=>false}));
const context={console,Math,performance:{now:()=>100},innerWidth:1250,innerHeight:900,scrollY:0,flightProgress,tilePose,setTimeout:fn=>fn(),clearTimeout(){},requestAnimationFrame(fn){const id=nextId++;queue.set(id,fn);return id;},cancelAnimationFrame:id=>queue.delete(id)};
const grid=Object.assign(eventTarget(),{children:tiles,offsetWidth:1120,offsetHeight:1120,classList:classes(),getBoundingClientRect:()=>({left:40,top:(body.classList.contains('static')?850:2450)-context.scrollY})});
const hero={getBoundingClientRect:()=>({bottom:450-context.scrollY})};
const control=Object.assign(eventTarget(),{setAttribute(){},hidden:true});
const strip={classList:classes()};
const reduced=Object.assign(eventTarget(),{matches:false}),wide=Object.assign(eventTarget(),{matches:true});
context.matchMedia=q=>q.includes('reduce')?reduced:wide;
context.document=Object.assign(eventTarget(),{hidden:false,body,getElementById:()=>grid,querySelector:s=>s==='.hero'?hero:s==='[data-motion-toggle]'?control:s==='.m-strip'?strip:null});
context.window=Object.assign(eventTarget(),{dispatchEvent(){}});
const source=(await readFile(new URL('../assets/flight.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
vm.runInNewContext(source,context);
const step=()=>{const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(200));};
assert.equal(queue.size,1);step();assert.equal(queue.size,1,'drifting strip requests one frame');
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
console.log('PASS: 5 viewport geometries, exact landing, monotonic scroll, finite poses, pause/resume, reverse scrolling, idle/hidden cancellation, responsive and live reduced-motion changes.');
