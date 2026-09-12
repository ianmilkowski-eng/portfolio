'use strict';

// Real project URLs and native details remain usable without JavaScript.
const form=document.getElementById('contactForm');
form.hidden=false;
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const fields=form.elements;
  const subject='Project inquiry from '+fields.namedItem('name').value.trim();
  const body=fields.namedItem('message').value.trim()+'\n\nReply to: '+fields.namedItem('email').value.trim();
  window.location.href='mailto:ianmilkowski@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
});

const preview=document.getElementById('project-preview');
const content=preview.querySelector('.preview-content');
let opener=null,version=0;
const notify=()=>window.dispatchEvent(new Event('portfolio:previewchange'));
if(typeof preview.showModal==='function'){
  document.querySelectorAll('[data-preview]').forEach(link=>{
    link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const template=document.getElementById('preview-'+link.dataset.preview);
      if(!template)return;
      event.preventDefault();version++;opener=link;
      content.replaceChildren(template.content.cloneNode(true));
      content.querySelectorAll('img').forEach(img=>img.loading='eager');
      preview.showModal();notify();
    });
  });
}
preview.querySelector('[data-preview-close]').addEventListener('click',()=>preview.close());
let backdropStart=false;
preview.addEventListener('pointerdown',event=>{backdropStart=event.target===preview;});
preview.addEventListener('click',event=>{if(backdropStart&&event.target===preview)preview.close();backdropStart=false;});
preview.addEventListener('close',()=>{version++;content.replaceChildren();opener?.focus({preventScroll:true});notify();});
content.addEventListener('click',event=>{
  const button=event.target.closest('[data-preview-src]');
  if(!button)return;
  const request=++version;
  const candidate=new Image();
  const status=content.querySelector('[data-preview-status]');
  status.textContent='Loading artwork…';
  candidate.onload=()=>{
    if(request!==version||!preview.open)return;
    const img=content.querySelector('[data-preview-image]');
    img.removeAttribute('srcset');img.removeAttribute('sizes');
    img.src=candidate.src;img.alt=button.dataset.previewAlt;
    img.width=candidate.naturalWidth;img.height=candidate.naturalHeight;
    content.querySelectorAll('[data-preview-src]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    status.textContent='';
  };
  candidate.onerror=()=>{if(request===version)status.textContent='This image could not load. Open the full project to try again.';};
  candidate.src=button.dataset.previewSrc;
});


// Fade artwork in only after its pixels are ready; no blank card snaps into view.
document.querySelectorAll('[data-flight] img,.m-card img').forEach(img=>{
  if(img.complete&&img.naturalWidth)return;
  img.classList.add('art-loading');
  const reveal=()=>{
    const decoded=typeof img.decode==='function'?img.decode():Promise.resolve();
    decoded.catch(()=>{}).then(()=>img.classList.remove('art-loading'));
  };
  img.addEventListener('load',reveal,{once:true});
  img.addEventListener('error',()=>img.classList.remove('art-loading'),{once:true});
});

// The main Ciało logo opens an enlarged, user-initiated animation. Its real link
// still leads to the project when JavaScript or native dialogs are unavailable.
const theater=document.getElementById('cialo-theater');
if(theater&&typeof theater.showModal==='function'){
  const screen=theater.querySelector('[data-cialo-screen]');
  let motionOpener=null,backdrop=false;
  document.querySelectorAll('[data-cialo-open]').forEach(link=>{
    link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();motionOpener=link;
      const player=document.createElement('iframe');
      player.title='Ciało animation — play, pause, replay, and scrub';
      player.src='assets/cialo/interactive/index.html?play=1';
      player.referrerPolicy='no-referrer';
      screen.replaceChildren(player);
      theater.showModal();notify();
    });
  });
  theater.querySelector('[data-cialo-close]').addEventListener('click',()=>theater.close());
  window.addEventListener('message',event=>{
    const player=screen.querySelector('iframe');
    if(theater.open&&event.origin===location.origin&&event.source===player?.contentWindow&&event.data==='cialo:close')theater.close();
  });
  theater.addEventListener('pointerdown',event=>{backdrop=event.target===theater;});
  theater.addEventListener('click',event=>{if(backdrop&&event.target===theater)theater.close();backdrop=false;});
  theater.addEventListener('close',()=>{screen.replaceChildren();motionOpener?.focus({preventScroll:true});notify();});
}
