/* Ciało / Holographic assembly v2. No framework, WebGL, video or external dependency.
 * render(time) is deterministic. Geometry is reconstructed only for temporary VFX.
 * The settled logo is composited from the approved original pixels.
 */
(() => {
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x);};
  const gauss=(x,s)=>Math.exp(-(x*x)/(s*s));
  const buffer=(w=1696,h=736)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  const makePath=points=>{const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
  class CialoHologram {
    constructor(canvas,{assetBase='./assets/',geometry=window.CIALO_HOLOGRAM_GEOMETRY}={}) {
      this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.base=assetBase;this.geometry=geometry;
      this.duration=4.4;this.frameId=0;this.disposed=false;this.time=0;
      this.outline=makePath(geometry.outline);
      this.nodes=geometry.nodes;
      this.edges=geometry.edges.map(([a,b])=>({a:this.nodes[a],b:this.nodes[b]}));
      this.faces=geometry.faces.map((ids,i)=>{
        const n=ids.map(id=>this.nodes[id]);
        return {path:makePath(n),arrival:n.reduce((s,p)=>s+p[2],0)/3,seed:(Math.sin(i*73.13)*413.84)%1,x:n.reduce((s,p)=>s+p[0],0)/3,y:n.reduce((s,p)=>s+p[1],0)/3};
      });
      this.motion=matchMedia('(prefers-reduced-motion:reduce)');
      this.motionChanged=()=>{if(this.motion.matches){this.pause();this.render(this.duration);}};
      this.motion.addEventListener('change',this.motionChanged);
      this.hide=()=>{if(document.hidden){this.pause();this.render(this.duration);}};
      document.addEventListener('visibilitychange',this.hide);
    }
    async load() {
      const names=['wordmark.webp','endorsement.webp'];
      const images=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
        const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Artwork unavailable: '+name));image.src=this.base+name;
      })));
      if(this.disposed)return this;
      [this.source,this.endorsement]=images;
      // Soft colour-aware mattes avoid the rectangular boundaries of a spatial crop.
      // Mesh and ivory share complementary alpha; additive recomposition preserves RGB.
      const original=buffer(),hard=buffer(),soft=buffer();
      let x=original.getContext('2d',{willReadFrequently:true});x.drawImage(this.source,0,0);
      const pixels=x.getImageData(0,0,1696,736);
      x=hard.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fill(this.outline);
      const edge=x.getImageData(0,0,1696,736).data;
      x=soft.getContext('2d',{willReadFrequently:true});x.filter='blur(24px)';x.drawImage(hard,0,0);x.filter='none';
      const feather=x.getImageData(0,0,1696,736).data;
      this.mesh=buffer();this.ivory=buffer();
      const meshPixels=new ImageData(new Uint8ClampedArray(pixels.data),1696,736),ivoryPixels=new ImageData(new Uint8ClampedArray(pixels.data),1696,736);
      for(let i=0;i<pixels.data.length;i+=4){
        const red=pixels.data[i],blue=pixels.data[i+2],warmth=(red-blue)/Math.max(1,red);
        const weight=Math.max(edge[i+3]/255,Math.min(1,feather[i+3]/255*2.8)*smooth(.30,.68,warmth));
        const alpha=Math.round(weight*255);meshPixels.data[i+3]=alpha;ivoryPixels.data[i+3]=255-alpha;
      }
      this.mesh.getContext('2d').putImageData(meshPixels,0,0);this.ivory.getContext('2d').putImageData(ivoryPixels,0,0);
      this.meshGlow=buffer();x=this.meshGlow.getContext('2d');x.filter='blur(12px)';x.drawImage(this.mesh,0,0);x.filter='none';
      this.light=buffer();this.detail=buffer();this.material=buffer();this.maskBuffer=buffer();
      this.loaded=true;return this;
    }
    resize(width,height){this.canvas.width=Math.round(width);this.canvas.height=Math.round(height);if(this.loaded)this.render(this.time);}
    pause(){cancelAnimationFrame(this.frameId);this.frameId=0;return this;}
    play({speed=1,onFrame,onComplete}={}) {
      this.pause();if(this.disposed||!this.loaded)return this;
      if(this.motion.matches){this.render(this.duration);onComplete?.();return this;}
      const origin=performance.now();
      const tick=now=>{
        const t=(now-origin)*.001*speed;this.render(Math.min(t,this.duration));onFrame?.(this.time);
        if(t<this.duration&&!this.disposed)this.frameId=requestAnimationFrame(tick);else{this.frameId=0;onComplete?.();}
      };this.frameId=requestAnimationFrame(tick);return this;
    }
    dispose(){this.pause();this.disposed=true;this.motion.removeEventListener('change',this.motionChanged);document.removeEventListener('visibilitychange',this.hide);}
    _wave(d,t) {
      // One outward surge, followed by a weaker return through the connected network.
      return gauss(d-(t-1.62)*.64,.085)*(1-smooth(2.95,3.3,t)) + .48*gauss(d-(1-(t-2.74)*1.06),.06)*smooth(2.6,2.78,t)*(1-smooth(3.65,4.0,t));
    }
    _geometry(t) {
      const x=this.detail.getContext('2d');x.clearRect(0,0,1696,736);x.lineCap='round';x.lineJoin='round';
      const handoff=1-smooth(1.48,2.12,t),remain=1-smooth(3.7,4.05,t);
      // Recessed wire plane supplies shallow depth without changing the front silhouette.
      if(t>.12&&t<1.8) {
        x.save();x.translate(6,-5);x.strokeStyle=`rgba(241,112,35,${.13*smooth(.12,.55,t)*(1-smooth(1.0,1.7,t))})`;x.lineWidth=.7;
        for(const e of this.edges){if(t<.20+Math.min(e.a[2],e.b[2])*.88)continue;x.beginPath();x.moveTo(e.a[0],e.a[1]);x.lineTo(e.b[0],e.b[1]);x.stroke();}x.restore();
      }
      for(const e of this.edges) {
        const a=e.a[2]<e.b[2]?e.a:e.b,b=a===e.a?e.b:e.a;
        const start=.22+a[2]*.87;
        const p=smooth(start,start+.19,t);if(p<=0)continue;
        const d=(a[2]+b[2])*.5,wave=this._wave(d,t);
        const alpha=(.72*handoff+.85*wave)*remain;
        if(alpha<.004)continue;
        const endX=a[0]+(b[0]-a[0])*p,endY=a[1]+(b[1]-a[1])*p;
        x.strokeStyle=`rgba(255,${Math.round(153+wave*75)},${Math.round(62+wave*126)},${Math.min(.95,alpha)})`;
        x.lineWidth=1.22+wave*.9;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(endX,endY);x.stroke();
        if(p<.98){x.fillStyle='rgba(255,235,181,.94)';x.beginPath();x.arc(endX,endY,1.35,0,Math.PI*2);x.fill();}
      }
      for(const n of this.nodes) {
        const start=.16+n[2]*.86,arrival=smooth(start,start+.075,t);
        const wave=this._wave(n[2],t);
        const seed=gauss(t-start,.065);
        const alpha=(arrival*.40*handoff+seed*.75+wave*.8)*remain;
        if(alpha<.018)continue;
        const radius=1.1+seed*1.35+wave*.7;
        const glow=x.createRadialGradient(n[0],n[1],0,n[0],n[1],9+wave*5);
        glow.addColorStop(0,`rgba(255,148,52,${Math.min(.4,alpha*.35)})`);glow.addColorStop(1,'rgba(255,80,0,0)');
        x.fillStyle=glow;x.fillRect(n[0]-15,n[1]-15,30,30);
        x.fillStyle=`rgba(255,235,185,${Math.min(.98,alpha)})`;x.beginPath();x.arc(n[0],n[1],radius,0,Math.PI*2);x.fill();
      }
      // Projector-like scan slices are clipped to the measured glyph, never the page.
      const projection=smooth(.23,.48,t)*(1-smooth(1.58,1.91,t));
      if(projection>.001) {
        x.save();x.clip(this.outline);
        const y=675-((t-.26)/1.43)*610;
        const gradient=x.createLinearGradient(0,y-24,0,y+8);gradient.addColorStop(0,'rgba(255,147,55,0)');gradient.addColorStop(.82,`rgba(255,182,80,${.28*projection})`);gradient.addColorStop(.92,`rgba(255,245,204,${.86*projection})`);gradient.addColorStop(1,'rgba(255,128,32,0)');
        x.fillStyle=gradient;x.fillRect(975,y-24,335,32);
        x.strokeStyle=`rgba(255,181,90,${.09*projection})`;x.lineWidth=.55;
        for(let line=80;line<665;line+=5){x.beginPath();x.moveTo(975,line);x.lineTo(1307,line);x.stroke();}
        x.restore();
      }
      return this.detail;
    }
    _facets(t) {
      const m=this.material.getContext('2d'),a=this.maskBuffer.getContext('2d');
      m.clearRect(0,0,1696,736);a.clearRect(0,0,1696,736);
      for(const f of this.faces) {
        const start=.72+f.arrival*.69+Math.abs(f.seed)*.09;
        const on=smooth(start,start+.25,t);if(on<=0)continue;
        const flash=gauss(t-start-.13,.12);
        a.fillStyle=`rgba(255,255,255,${on})`;a.fill(f.path);
        m.fillStyle=`rgba(255,${Math.round(120+Math.abs(f.seed)*80)},${Math.round(35+Math.abs(f.seed)*45)},${(.075+.20*flash)*on})`;m.fill(f.path);
      }
      a.globalCompositeOperation='source-in';a.drawImage(this.mesh,0,0);a.globalCompositeOperation='source-over';
      m.globalCompositeOperation='destination-over';m.drawImage(this.maskBuffer,0,0);m.globalCompositeOperation='source-over';
      return this.material;
    }
    _letters(t) {
      const x=this.light.getContext('2d');x.clearRect(0,0,1696,736);x.drawImage(this.ivory,0,0);
      const radius=40+smooth(1.35,2.60,t)*1900;
      const mask=x.createRadialGradient(1130,385,Math.max(0,radius-250),1130,385,radius);
      mask.addColorStop(0,`rgba(255,255,255,${smooth(1.30,1.60,t)})`);mask.addColorStop(1,'rgba(255,255,255,0)');
      x.globalCompositeOperation='destination-in';x.fillStyle=mask;x.fillRect(0,0,1696,736);x.globalCompositeOperation='source-over';
      return this.light;
    }
    render(t) {
      if(!this.loaded||this.disposed)return;
      this.time=Math.max(0,t);const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
      c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.fillStyle='#000';c.fillRect(0,0,w,h);
      const screenWidth=Math.min(w*.80,h*1.55),settledScale=screenWidth/1696;
      const ew=Math.max(720,Math.min(1080,220/settledScale)),eh=ew*112/816;
      const totalHeight=736+22+eh;
      const pullback=smooth(1.08,2.44,t),scale=settledScale*(1.24-.24*pullback);
      const settledLeft=(w-screenWidth)/2,settledTop=(h-totalHeight*settledScale)/2;
      const closeLeft=w/2-1138*scale,closeTop=h/2-372*scale;
      const left=closeLeft*(1-pullback)+settledLeft*pullback,top=closeTop*(1-pullback)+settledTop*pullback;
      c.setTransform(scale,0,0,scale,left,top);
      if(t>=4.05) {c.drawImage(this.source,0,0);c.drawImage(this.endorsement,(1696-ew)/2,758,ew,eh);return;}
      // Energy remains local: two decaying lobes from the construction surge.
      const afterglow=.80*gauss(t-1.82,.17)+.42*Math.exp(-Math.max(0,t-2.04)*1.3)*smooth(1.83,2.08,t)*(1-smooth(3.8,4.05,t));
      if(afterglow>.001){c.globalCompositeOperation='screen';c.globalAlpha=afterglow;c.drawImage(this.meshGlow,0,0);c.globalCompositeOperation='source-over';c.globalAlpha=1;}
      const material=this._facets(t);
      c.globalAlpha=1-smooth(1.8,2.18,t);c.drawImage(material,0,0);c.globalAlpha=1;
      c.globalAlpha=smooth(1.43,2.12,t);c.drawImage(this.mesh,0,0);c.globalAlpha=1;
      // Short afterimage of the wire surface, followed by energy returning down the stem.
      const detail=this._geometry(t);
      c.globalCompositeOperation='screen';
      if(t>1.65&&t<3.55){c.globalAlpha=.15*gauss(t-2.04,.6);c.drawImage(detail,2,-2);c.globalAlpha=1;}
      c.drawImage(detail,0,0);c.globalCompositeOperation='source-over';
      c.globalCompositeOperation='lighter';c.drawImage(this._letters(t),0,0);c.globalCompositeOperation='source-over';
      const endorsement=smooth(2.38,2.92,t);
      c.globalAlpha=endorsement;c.drawImage(this.endorsement,(1696-ew)/2,758+(1-endorsement)*5,ew,eh);c.globalAlpha=1;
    }
  }
  window.CialoHologram=CialoHologram;
})();
