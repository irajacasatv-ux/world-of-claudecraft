import fs from 'node:fs';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from '../scripts/browser_path.mjs';
const out='tmp/freehold-crafted-guide-prose';fs.mkdirSync(out,{recursive:true});
const b=await puppeteer.launch({executablePath:BROWSER_PATH,headless:'new'});const captures=[];
try{for(const width of [1440,390]){const p=await b.newPage();await p.setViewport({width,height:900});await p.goto('http://127.0.0.1:5185/wiki/reliquary?lang=en',{waitUntil:'networkidle0'});const e=await p.evaluateHandle(()=>[...document.querySelectorAll('p')].find(e=>e.textContent.startsWith('Every authored Reliquary page')));if(!e.asElement())throw new Error('Missing actual guide prose');await e.asElement().scrollIntoView();await p.evaluate(()=>document.fonts.ready);const file=out+'/catalog-prose-'+width+'.png';await e.asElement().screenshot({path:file});captures.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),width,text:await e.evaluate(e=>e.textContent)});await p.close();}}finally{await b.close();fs.writeFileSync(out+'/manifest.json',JSON.stringify({captures},null,2)+'\n');}
