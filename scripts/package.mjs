import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
// Explicit public-file list: source, local notes, Git metadata, and originals
// elsewhere on the computer never enter the deploy directory.
for(const entry of ['index.html','assets','projects','sitemap.xml','robots.txt','_headers']){
  await cp(path.join(root,entry),path.join(out,entry),{recursive:true});
}
console.log('Prepared dist/ for the existing ianmilkowski Netlify project.');
