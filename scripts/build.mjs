import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const projects = await read('content/projects.json');
const cialo = await read('content/cialo-assets.json');
const retreat = await read('content/retreat-2027.json');
const cleanWordmark = await read('content/cialo-wordmark.json');
const presentation = await read('content/presentation.json');
const milkplexity = await read('content/milkplexity-assets.json');
const milkAsset = slug => milkplexity.find(item => item.slug === slug);
const asset = slug => cialo.find(item => item.slug === slug);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const origin = 'https://ianmilkowski-eng.github.io/portfolio/';
const arrow = '<span aria-hidden="true">↗</span>';
const image = (item, prefix = '', options = {}) => {
  const variants = item.variants || [];
  const src = variants.at(-1)?.src || item.src;
  return `<img src="${prefix}${esc(src)}"${variants.length ? ` srcset="${variants.map(v => `${prefix}${esc(v.src)} ${v.width}w`).join(', ')}" sizes="${options.sizes || '(max-width: 680px) 92vw, (max-width: 1100px) 46vw, 31vw'}"` : ''} width="${item.width}" height="${item.height}" alt="${esc(options.alt ?? item.alt)}" loading="${options.eager ? 'eager' : 'lazy'}" decoding="async"${options.eager ? ' fetchpriority="high"' : ''}${options.extra || ''}>`;
};
const art = (item, prefix, caption, classes = '', eager = false) => `<figure class="art ${classes}"><a class="art-link" href="${prefix}${item.src}" data-lightbox data-caption="${esc(caption)}" aria-label="Enlarge: ${esc(item.alt)}">${image(item, prefix, {eager, sizes:'(max-width: 680px) 92vw, 80vw'})}<span class="enlarge" aria-hidden="true">Expand ${arrow}</span></a><figcaption>${esc(caption)}</figcaption></figure>`;

function shell({title, description, route = '', body, theme = '', socialImage = 'assets/cialo/wordmark-endorsed.png', socialAlt = 'Ciało brand identity by Ian Milkowski'}) {
  const prefix = route ? '../../' : '';
  const og = socialImage;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#0a0a0a">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; frame-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${origin}${route}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${origin}${route}"><meta property="og:image" content="${origin}${og}"><meta property="og:image:alt" content="${esc(socialAlt)}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}assets/site.css"><link rel="stylesheet" href="${prefix}assets/editorial.css"><script src="${prefix}assets/site.js" defer></script><script src="${prefix}assets/motion.js" defer></script>
</head><body class="${theme}">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-nav wrap"><a class="signature" href="${prefix || './'}" aria-label="Ian Milkowski, home">IM<span aria-hidden="true">.</span></a><nav aria-label="Main navigation"><a href="${prefix}#work">Work</a><a href="${prefix}#about">About</a><a href="${prefix}#contact">Contact ${arrow}</a></nav></header>
<main id="main">${body}</main>
<footer class="site-footer wrap"><a class="signature" href="${prefix || './'}">IM<span aria-hidden="true">.</span></a><p>© 2026 Ian Milkowski</p><a href="https://linkedin.com/in/ian-milkowski" rel="noopener noreferrer" target="_blank">LinkedIn ${arrow}<span class="sr-only"> (opens a new tab)</span></a><a href="#main">Back to top ↑</a></footer>
<dialog id="image-viewer" aria-labelledby="viewer-title"><div class="viewer-toolbar"><p id="viewer-title">Artwork</p><button type="button" data-viewer-close autofocus>Close <span aria-hidden="true">×</span></button></div><img data-viewer-image alt=""><p data-viewer-caption></p><div class="viewer-nav"><button type="button" data-viewer-prev>Previous image</button><span data-viewer-count></span><button type="button" data-viewer-next>Next image</button></div></dialog>
</body></html>\n`;
}

function contact(prefix = '') {
  return `<section class="contact-block wrap" id="contact"><div><p class="eyebrow">Projects & opportunities</p><h2>Have a project<br><em>or a role in mind?</em></h2><p>Tell me what you’re working on. I’m interested in creative collaborations, brand projects, and opportunities to join a team.</p></div><div class="contact-links"><a class="text-link" href="mailto:ianmilkowski@gmail.com">ianmilkowski@gmail.com ${arrow}</a><a href="https://linkedin.com/in/ian-milkowski" target="_blank" rel="noopener noreferrer">Connect on LinkedIn ${arrow}<span class="sr-only"> (opens a new tab)</span></a><a href="tel:9084338907">908.433.8907</a></div></section>`;
}

function homepage() {
  const categories = [...new Map(projects.map(p => [p.category.id, p.category])).values()];
  const cards = projects.map((p, i) => {
    const isRetreat = p.slug === 'training-room-fitness-retreat';
    const cover = isRetreat ? retreat : p.image;
    const direction = presentation[p.slug] || { size: 'small' };
    return `<article class="project-card" data-project data-reveal data-size="${direction.size}" data-offset="${Boolean(direction.offset)}" data-category="${p.category.id}"><a class="project-image" href="projects/${p.slug}/" aria-label="View ${esc(p.title)}">${image(cover,'',{sizes:'(max-width: 680px) 92vw, 52vw'})}<span class="project-index" aria-hidden="true">${String(i + 3).padStart(2, '0')}</span><span class="project-open" aria-hidden="true">${arrow}</span></a><div class="project-card-copy"><p class="personal-note">${esc(direction.note || p.category.label)}</p><div class="project-meta"><span>${esc(p.category.label)}</span><span>${isRetreat ? '2027 edition' : esc(p.year)}</span></div><h3><a href="projects/${p.slug}/">${esc(p.title)}</a></h3><p class="project-summary">${isRetreat ? 'Branding for my dad’s fitness retreat in Nosara, Costa Rica. The 2027 identity brings together retro lettering, coastal color, and hibiscus flowers.' : esc(p.description)}</p><a class="project-detail" href="projects/${p.slug}/">View project <span aria-hidden="true">→</span><span class="sr-only">: ${esc(p.title)}</span></a></div></article>`;
  }).join('\n');
  return shell({title:'Ian Milkowski | Creative Portfolio',description:'Brand identity, event graphics, and media by Ian Milkowski. Explore Ciało, Milkplexity, The Training Room, and artwork for businesses, teams, and causes.',body:`
<section class="hero wrap"><div class="hero-copy"><p class="eyebrow">Ian Milkowski / Creative portfolio</p><h1 class="name">Ian<br>Milkowski<span>.</span></h1><div class="hero-intro"><p class="hero-services">Brand identity, event graphics,<br>and media with a personal connection.</p><p>For the businesses I’ve built, the teams I play on, and the people I work with.</p><a class="text-link" href="#work">Take a look around <span aria-hidden="true">↓</span></a></div></div><div class="hero-artboard"><div class="hero-stage" aria-label="A composition of selected artwork"><p class="artboard-label" aria-hidden="true">A few pieces from my world</p><a class="floating-art float-podcast" href="projects/behind-the-venue/" aria-label="Explore Behind The Venue, the podcast I hosted at Iowa">${image(projects.find(p=>p.slug==='behind-the-venue').image,'',{sizes:'(max-width: 680px) 38vw, 19vw',alt:''})}<span aria-hidden="true">Iowa, 2022</span></a><a class="floating-art float-retreat" href="projects/training-room-fitness-retreat/" aria-label="Explore my dad’s Training Room fitness retreat">${image(retreat,'',{eager:true,sizes:'(max-width: 680px) 62vw, 32vw',alt:''})}<span aria-hidden="true">Nosara, 2027</span></a><a class="floating-art float-fuming" href="projects/fuming-takes/" aria-label="Explore the Fuming Takes sports podcast identity">${image(projects.find(p=>p.slug==='fuming-takes').image,'',{sizes:'(max-width: 680px) 43vw, 22vw',alt:''})}<span aria-hidden="true">Fuming Takes</span></a><span class="artboard-cross cross-one" aria-hidden="true">+</span><span class="artboard-cross cross-two" aria-hidden="true">+</span></div><div class="artboard-footer"><p>Selected artwork <span aria-hidden="true">↖</span></p><button type="button" class="motion-toggle" data-motion-toggle hidden aria-pressed="false">Pause motion</button></div></div></section>
<section id="work" class="work-section wrap" aria-labelledby="work-heading"><div class="section-heading"><div><p class="eyebrow">01 / The work</p><h2 id="work-heading">Selected work<span class="heading-mark" aria-hidden="true">/</span></h2></div><p>A closer look at the identities,<br>artwork, and stories behind them.</p></div>
<article class="featured-project" data-reveal><a class="feature-art" href="projects/cialo/" aria-label="Explore the Ciało brand identity">${image(cleanWordmark,'',{sizes:'(max-width: 680px) 92vw, 85vw'})}<span class="feature-detail" aria-hidden="true">${image(asset('symbol-wireframe'),'',{sizes:'18vw',alt:''})}</span><span class="feature-note">Personal brand identity · 2026</span><span class="feature-arrow" aria-hidden="true">↗</span></a><div class="featured-caption"><div><p class="eyebrow">01 / My own brand</p><h3><a href="projects/cialo/">Ciało</a></h3></div><p>My own identity, built around a sculptural ł. A wordmark, an icon, five color studies, and the original animation.</p><a class="text-link" href="projects/cialo/">Explore the identity ${arrow}</a></div></article>
<article class="milk-feature" data-reveal><div class="milk-feature-art"><a href="projects/milkplexity/" aria-label="Explore the Milkplexity main identity">${image(milkAsset('main-logo'),'',{sizes:'(max-width: 680px) 92vw, 55vw'})}</a></div><div class="milk-feature-copy"><p class="eyebrow">02 / Milkplexity</p><h3>A different side<br><em>of my own work.</em></h3><p>The main Milkplexity identity and Milkplexity Learn. A familiar pouring-glass symbol, expressed in cyan, white, and rounded lettering.</p><a class="text-link" href="projects/milkplexity/">Explore Milkplexity ${arrow}</a></div><a class="milk-feature-learn" href="projects/milkplexity/#learn" aria-label="Explore the Milkplexity Learn artwork">${image(milkAsset('learn'),'',{sizes:'(max-width: 680px) 38vw, 18vw',alt:''})}<span>Milkplexity Learn <span aria-hidden="true">↗</span></span></a></article>
<div class="collection-heading"><h2>The project archive</h2><p>From a first business to the next idea.</p></div>
<div class="filter-row" data-filters hidden><div class="filter-buttons" role="group" aria-label="Filter projects"><button type="button" data-filter="all" aria-pressed="true">All work</button>${categories.map(c=>`<button type="button" data-filter="${c.id}" aria-pressed="false">${esc(c.label)}</button>`).join('')}</div><p class="filter-status" data-filter-status role="status" aria-live="polite">${projects.length} projects</p></div>
<div class="project-grid">${cards}</div></section>
<section class="about-section wrap" id="about" data-reveal><div><p class="eyebrow">A little about the work</p><p class="about-signature">Ian M.</p></div><div><h2>A lot of this<br><em>starts close to home.</em></h2><p>I’ve made artwork for a podcast I hosted, a business I ran, the teams I play on, and my dad’s fitness retreat. Alongside that personal work, I create identities and graphics for businesses, media, and charity events.</p><div class="personal-details"><p><span>First business</span>A hauling logo featuring our actual work truck, printed on crew shirts.</p><p><span>Behind the microphone</span>Cover art for the podcast I hosted at the University of Iowa.</p><p><span>A family project</span>The visual identity for my dad’s fitness retreat in Nosara.</p></div><p class="process-note">I work with Photoshop, AI generation, and creative direction. Each project includes its tools and context.</p></div></section>
${contact()}`});
}

function cialoPage() {
  const prefix = '../../';
  const colors = ['amber','gold','pink','green','violet'];
  const mainColor = asset('color-amber');
  return shell({title:'Ciało — Brand Identity | Ian Milkowski',description:'The Ciało personal brand identity: sculptural lettering, luminous color studies, and an interactive animated logo.',route:'projects/cialo/',theme:'cialo',body:`
<header class="project-header wrap"><a class="back-link" href="../../#work">← All work</a><div class="project-heading"><div><p class="eyebrow">Personal brand identity · 2026</p><h1>Ciało<span>.</span></h1></div><p class="project-deck">A symbol with strength.<br>An identity with energy.</p></div><nav class="chapter-nav" aria-label="Project chapters"><a href="#identity">Identity</a><a href="#symbol">The symbol</a><a href="#motion">In motion</a><a href="#color">Color studies</a></nav></header>
<div class="wrap hero-art" id="identity">${art(cleanWordmark,prefix,'The Ciało wordmark. Pearlescent lettering meets a glowing amber symbol.','wordmark-art',true)}</div>
<section class="project-story wrap" data-reveal><p class="eyebrow">01 / The identity</p><div><h2>Built around<br><em>a distinctive character.</em></h2><p>My own brand identity, expressed through a wordmark, an app icon, and a family of color and motion studies. The sculptural ł gives Ciało its signature: a strong silhouette with light, depth, and detail.</p></div></section>
<section class="wrap project-section" data-reveal id="symbol"><div class="section-heading"><div><p class="eyebrow">02 / The symbol</p><h2>One form. Three expressions.</h2></div><p>Silhouette, sculptural detail,<br>and a network of light.</p></div><div class="symbol-grid">${art(asset('symbol-flat'),prefix,'01 — Flat silhouette')}${art(asset('symbol-faceted'),prefix,'02 — Faceted form')}${art(asset('symbol-wireframe'),prefix,'03 — Illuminated wireframe')}</div></section>
<section class="wrap project-section" data-reveal id="motion"><div class="section-heading"><div><p class="eyebrow">03 / In motion</p><h2>An identity that moves.</h2></div><p>Play the original animation<br>and explore its movement.</p></div><div class="motion-stage"><iframe src="../../assets/cialo/interactive/index.html" title="Ciało interactive logo animation with playback controls" loading="lazy" referrerpolicy="no-referrer"></iframe></div><details class="motion-fallback"><summary>Video version & original files</summary><video controls playsinline preload="none" poster="../../assets/cialo/wordmark-endorsed-960.webp" aria-label="Ciało logo animation"><source src="../../assets/cialo/motion.mp4" type="video/mp4"><a href="../../assets/cialo/motion.mp4">Watch the Ciało animation</a></video><div class="download-links"><a href="../../assets/cialo/motion.mp4" download>Download video ↓</a><a href="../../assets/cialo/motion.gif" download>Download original GIF ↓</a></div></details></section>
<section class="wrap project-section" data-reveal id="color"><div class="section-heading"><div><p class="eyebrow">04 / Color studies</p><h2>Same character.<br>Different energy.</h2></div><p>Explore five expressions<br>of the Ciało identity.</p></div><div class="color-explorer"><a href="${prefix}${mainColor.src}" class="color-stage" data-lightbox data-color-link data-caption="Ciało — Amber"><img src="${prefix}${mainColor.variants.at(-1).src}" width="1254" height="1254" loading="lazy" decoding="async" alt="${mainColor.alt}" data-color-image><span class="enlarge" aria-hidden="true">Expand ${arrow}</span></a><div class="color-panel"><p class="eyebrow">Choose an expression</p><h3 data-color-label role="status" aria-live="polite">Amber</h3><div class="color-controls" data-color-controls hidden role="group" aria-label="Choose the Ciało color">${colors.map((name,i)=>`<button type="button" class="color-option color-${name}" data-color="${name}" data-image="${prefix}${asset('color-'+name).variants.at(-1).src}" data-original="${prefix}${asset('color-'+name).src}" data-alt="${asset('color-'+name).alt}" data-label="${name[0].toUpperCase()+name.slice(1)}" aria-pressed="${i===0}"><span class="swatch" aria-hidden="true"></span>${name[0].toUpperCase()+name.slice(1)}</button>`).join('')}</div><p>The same pearlescent wordmark and wireframe symbol, from warm amber to electric violet.</p></div></div><details class="color-studies"><summary>View every color study</summary><div class="study-grid">${colors.map(name=>art(asset('color-'+name),prefix,`${name[0].toUpperCase()+name.slice(1)} color study`)).join('')}</div></details></section>
<section class="wrap project-section" data-reveal><div class="section-heading"><div><p class="eyebrow">05 / Across formats</p><h2>From icon to signature.</h2></div></div><div class="application-grid">${art(asset('app-icon'),prefix,'The standalone app icon.','icon-art')}${art(asset('wordmark-endorsed'),prefix,'The full wordmark with the Milkplexity endorsement.','endorsement-art')}</div><details class="source-export"><summary>Original transparent header export</summary>${art(asset('wordmark'),prefix,'The original transparent header export. The main presentation uses the clean wordmark supplied with the animation.','wordmark-art')}</details></section>
<section class="next-project wrap"><p class="eyebrow">Next project</p><a href="../training-room-fitness-retreat/"><h2>The Training Room</h2>${arrow}</a><p>A Costa Rica fitness retreat, and a family connection.</p></section>${contact()}`});
}

function milkplexityPage() {
  const prefix = '../../';
  const main = milkAsset('main-logo');
  const learn = milkAsset('learn');
  const icon = milkAsset('icon');
  return shell({
    title: 'Milkplexity — Brand Identity | Ian Milkowski',
    description: 'The Milkplexity main identity and Milkplexity Learn artwork. A pouring-glass symbol, rounded lettering, and a cyan-and-white palette.',
    route: 'projects/milkplexity/',
    theme: 'milkplexity',
    socialImage: main.src,
    socialAlt: main.alt,
    body: `
<header class="project-header wrap"><a class="back-link" href="../../#work">← All work</a><div class="project-heading"><div><p class="eyebrow">My own projects / Brand identity</p><h1 class="standard-title">Milkplexity<span>.</span></h1></div><p class="project-deck">A little personality.<br>A very recognizable pour.</p></div><nav class="chapter-nav" aria-label="Project chapters"><a href="#main-identity">Main identity</a><a href="#milk-icon">The icon</a><a href="#learn">Milkplexity Learn</a><a href="#brand-family">Related work</a></nav></header>
<div class="wrap milk-main" id="main-identity">${art(main,prefix,main.caption,'milk-main-art',true)}</div>
<section class="project-story wrap" data-reveal><p class="eyebrow">01 / The main identity</p><div><h2>A name with<br><em>its own visual language.</em></h2><p>The main Milkplexity logo puts the pouring-glass symbol beside a rounded wordmark. White and cyan keep the two parts connected; the milk forms the AI lettering underneath the glass.</p></div></section>
<section class="wrap project-section milk-icon-section" id="milk-icon" data-reveal>${art(icon,prefix,icon.caption,'milk-icon-art')}<div class="milk-icon-copy"><p class="eyebrow">02 / The standalone mark</p><h2>The same idea.<br><em>Without the wordmark.</em></h2><p>The pouring glass carries the identity on its own. A simple silhouette, bright cyan edges, and the milk-formed lettering keep it connected to the full logo.</p><div class="icon-scale-study" aria-label="Icon at three display sizes"><figure>${image(icon,prefix,{sizes:'40px',alt:''})}<figcaption>40 px</figcaption></figure><figure>${image(icon,prefix,{sizes:'72px',alt:''})}<figcaption>72 px</figcaption></figure><figure>${image(icon,prefix,{sizes:'112px',alt:''})}<figcaption>112 px</figcaption></figure></div></div></section>
<section class="wrap project-section milk-learn-section" id="learn" data-reveal><div class="milk-learn-copy"><p class="eyebrow">03 / Milkplexity Learn</p><h2>A related identity.<br><em>Its own expression.</em></h2><p>The Learn artwork brings the symbol and wordmark into a vertical composition. The brighter edges and dimensional lettering give it a different presence while keeping the same cyan-and-white palette.</p><a class="text-link" href="${prefix}${learn.src}" data-lightbox data-caption="${esc(learn.caption)}">Look closer ${arrow}</a></div>${art(learn,prefix,learn.caption,'milk-learn-art')}</section>
${milkplexity.filter(item=>!['main-logo','icon','learn'].includes(item.slug)).length ? `<section class="wrap project-section" data-reveal><div class="section-heading"><h2>More from Milkplexity</h2></div><div class="additional-gallery">${milkplexity.filter(item=>!['main-logo','icon','learn'].includes(item.slug)).map(item=>art(item,prefix,item.caption || item.alt)).join('')}</div></section>` : ''}
<section class="next-project wrap" id="brand-family"><p class="eyebrow">Related identity</p><a href="../cialo/"><h2>Ciało</h2>${arrow}</a><p>The amber identity with the “Powered by Milkplexity” endorsement.</p></section>${contact()}`
  });
}

function projectPage(p,index) {
  const prefix = '../../';
  const isRetreat = p.slug === 'training-room-fitness-retreat';
  const next = projects[(index + 1) % projects.length];
  const body = `<header class="project-header wrap"><a class="back-link" href="../../#work">← All work</a><div class="project-heading"><div><p class="eyebrow">${esc(p.category.label)} · ${isRetreat ? '2027 edition' : esc(p.year)}</p><h1 class="standard-title">${esc(p.title)}</h1></div></div><div class="project-facts"><div><span>Discipline</span><p>${esc(p.category.label)}</p></div><div><span>Tools & process${isRetreat ? ' · earlier work' : ''}</span><p>${esc(p.toolsLabel)}</p></div></div></header>
<div class="wrap hero-art">${art(isRetreat?retreat:p.image,prefix,isRetreat?'2027 retreat identity — Nosara, Costa Rica.':p.title,'project-main-art',true)}</div>
<section class="project-story wrap" data-reveal><p class="eyebrow">The project</p><div><h2>${isRetreat?'A family connection.<br><em>A coastal identity.</em>':'Behind the artwork.'}</h2><p>${isRetreat?'The Training Room is my dad’s fitness retreat in Nosara, Costa Rica. This 2027 edition pairs turquoise lettering with layered sunset colors and hibiscus flowers.':esc(p.description)}</p></div></section>
${p.gallery?.length ? `<section class="wrap project-section" data-reveal><div class="section-heading"><h2>Project gallery</h2></div><div class="additional-gallery">${p.gallery.map(item=>art(item,prefix,item.caption || item.alt)).join('')}</div></section>` : ''}
${isRetreat?`<section class="wrap project-section" data-reveal><div class="section-heading"><div><p class="eyebrow">Earlier work · ${esc(p.year)}</p><h2>The previous edition.</h2></div></div><div class="previous-edition">${art(p.image,prefix,'Earlier Training Room promotional artwork, preserved in full.')}<div><p>${esc(p.description)}</p><p class="tools-note">${esc(p.toolsLabel)}</p></div></div></section>`:''}
<section class="next-project wrap"><p class="eyebrow">Next project</p><a href="../${next.slug}/"><h2>${esc(next.title)}</h2>${arrow}</a></section>${contact()}`;
  return shell({title:`${p.title} | Ian Milkowski`,description:isRetreat?'Brand identity for The Training Room, my dad’s fitness retreat in Nosara, Costa Rica. Explore the 2027 artwork and earlier edition.':p.description,route:`projects/${p.slug}/`,socialImage:(isRetreat?retreat:p.image).src,socialAlt:(isRetreat?retreat:p.image).alt,body});
}

const pages = [{file:'index.html',html:homepage()},{file:'projects/cialo/index.html',html:cialoPage()},{file:'projects/milkplexity/index.html',html:milkplexityPage()},...projects.map((p,i)=>({file:`projects/${p.slug}/index.html`,html:projectPage(p,i)}))];
for (const {file,html} of pages) { await mkdir(path.dirname(path.join(root,file)),{recursive:true}); await writeFile(path.join(root,file),html); }
const routes = ['', 'projects/cialo/', 'projects/milkplexity/', ...projects.map(p=>`projects/${p.slug}/`)];
await writeFile(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${origin}${route}</loc></url>`).join('')}</urlset>\n`);
await writeFile(path.join(root,'.nojekyll'),'');
console.log(`Built ${pages.length} static pages. No runtime dependencies.`);
