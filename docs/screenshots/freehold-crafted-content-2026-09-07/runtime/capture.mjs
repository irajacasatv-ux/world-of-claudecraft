import fs from 'node:fs';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from '../scripts/browser_path.mjs';
import { enterOfflineGame, dismissEntryOverlays } from '../scripts/enter_offline_game.mjs';
import { suppressGpuNotice } from '../scripts/lib/gpu_notice_suppress.mjs';
const out='tmp/freehold-crafted-runtime-v6'; fs.mkdirSync(out,{recursive:true});
const ids=['weapon_rack','iron_brazier','patchwork_rug','hide_armchair','clockwork_lamp','glass_floor_lamp','chart_easel','jewel_floor_lamp','set_supper_table','glow_lantern'].map(id=>'freehold_'+id);
const patterns=['clockwork_lamp','chart_easel','jewel_floor_lamp'].map(id=>'pattern_freehold_'+id);
const record={fixture:'Stock offline development world. Ten output items directly granted for art inspection; skills set to50 and copper70000 for trainer previews. Exactly48 Marks granted, three patterns purchased through real Quartermaster buttons. No placement, production activation, hardware LOW or GLB approval claimed.',executionHarness:'Codex',command:'node tmp/freehold-crafted-runtime.mjs',captures:[],checks:[],errors:[]};
record.server='Temporary Vite config inherits project config, disables HMR/watch only to avoid filesystem-mutating tests reloading captures; no product configuration change.';
const browser=await puppeteer.launch({executablePath:BROWSER_PATH,headless:'new',protocolTimeout:240000,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],defaultViewport:{width:1600,height:900}});
console.log(browser.wsEndpoint());
try {
for(const mobile of [false,true]) {
 const variant=mobile?'mobile-landscape':'desktop',page=await browser.newPage();
 page.on('pageerror',e=>record.errors.push(variant+': '+e.message));
 if(mobile)await page.emulate({viewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'});
 await page.evaluateOnNewDocument(()=>{localStorage.setItem('locale','en');localStorage.setItem('woc_settings',JSON.stringify({graphicsPreset:1,graphicsDefaultApplied:true}));});
 await suppressGpuNotice(page);
 await page.goto('http://127.0.0.1:5185/'+(mobile?'mobile.html':''),{waitUntil:'networkidle0',timeout:120000});
 console.log('booting '+variant);
 if(!await enterOfflineGame(page,{charClass:'warrior',charName:'Alden',selectorTimeoutMs:90000,gameBootTimeoutMs:180000,settleMs:2000,mobilePreflightTimeoutMs:mobile?90000:100}))throw new Error('World boot failed');
 await page.waitForFunction(()=>document.body.classList.contains('game-active')&&getComputedStyle(document.querySelector('#start-screen')).display==='none',{timeout:180000});
 await dismissEntryOverlays(page);
 await page.evaluate(ids=>{const {sim:s}=window.__game,m=s.players.get(s.playerId);m.inventory.splice(0);m.copper=70000;for(const craft of ['weaponcrafting','armorcrafting','tailoring','leatherworking','engineering','alchemy','inscription','jewelcrafting','cooking','enchanting'])m.craftSkills[craft]=50;for(const id of ids)s.addItem(id,1);s.addItem('heroic_mark',48);const n=[...s.entities.values()].find(e=>e.templateId==='heroic_quartermaster');if(!n)throw new Error('Missing Quartermaster');s.player.pos={...n.pos,x:n.pos.x+1};s.player.prevPos={...s.player.pos};},ids);
 await page.waitForFunction(()=>{const g=window.__game;return g.renderer.isZoneReadyAt(g.sim.player.pos.x,g.sim.player.pos.z);},{timeout:180000});
 await dismissEntryOverlays(page);
 async function shot(name,selector){
  await page.waitForFunction(sel=>{const e=document.querySelector(sel);return e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;},{timeout:20000},selector);
  await page.waitForFunction(()=>!document.querySelector('#loading-screen')?.classList.contains('visible'),{timeout:180000});
  await page.evaluate(()=>document.fonts.ready); await new Promise(r=>setTimeout(r,300));
  const file=out+'/'+variant+'-'+name+'.png';
  const box=await page.$eval(selector,e=>{const r=e.getBoundingClientRect(),x=Math.max(0,r.x-8),y=Math.max(0,r.y-8);return{x,y,width:Math.max(1,Math.min(innerWidth,r.right+8)-x),height:Math.max(1,Math.min(innerHeight,r.bottom+8)-y)};});
  await page.screenshot({path:file,clip:box});
  const ui=await page.$eval(selector,e=>({text:e.innerText,rect:e.getBoundingClientRect().toJSON(),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0}))}));
  record.captures.push({variant,name,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),...ui});console.log('captured '+variant+'-'+name);
 }
 async function clickLive(selector){await page.$eval(selector,e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));const p=await page.$eval(selector,e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
 await page.evaluate(()=>{const g=window.__game;g.hud.openHeroicVendor([...g.sim.entities.values()].find(e=>e.templateId==='heroic_quartermaster').id);});
 for(const [i,id] of patterns.entries()) {
  const sel='[data-focus-key="buy:'+id+'"]';await page.$eval(sel,e=>e.scrollIntoView({block:'center',behavior:'instant'}));
  if(i===0)await shot('quartermaster-patterns','#vendor-window');
  if(i===0&&!mobile){await page.focus(sel);await page.keyboard.press('Enter');}else await clickLive(sel);
  await page.waitForSelector('#confirm-dialog [data-ok]',{visible:true});
  if(i===0&&!mobile){await page.keyboard.press('Enter');}else await clickLive('#confirm-dialog [data-ok]');
  await page.waitForFunction(id=>window.__game.sim.countItem(id)===1,{},id);
 }
 const bought=await page.evaluate(patterns=>{const s=window.__game.sim;return{enabled:s.cfg.freeholdsEnabled,marks:s.countItem('heroic_mark'),patterns:patterns.map(id=>[id,s.countItem(id)]),focus:document.activeElement?.getAttribute('data-focus-key')};},patterns);
 if(bought.marks!==0||bought.patterns.some(([,count])=>count!==1))throw new Error('Purchase mismatch');record.checks.push({variant,purchase:bought});
 await shot('quartermaster-after-purchase','#vendor-window');
 await page.evaluate(()=>{window.__game.hud.closeHeroicVendor();window.__game.hud.toggleBags();});
 await shot('bags-thirteen-icons','#bags');

 if(!mobile){
  const host=await page.$('#bags img[src$="/freehold_jewel_floor_lamp.webp"]');await host.hover();await shot('furnishing-tooltip','#tooltip');
  const patternHost=await page.$('#bags img[src$="/pattern_freehold_jewel_floor_lamp.webp"]');await patternHost.hover();await shot('pattern-tooltip','#tooltip');
 }
 await page.evaluate(()=>window.__game.hud.toggleBags());
 await page.evaluate(ids=>{const {sim:s,hud:h}=window.__game;const n=[...s.entities.values()].find(e=>e.templateId==='bursar_fernando');if(!n)throw new Error('Missing banker');s.player.pos={...n.pos};s.player.prevPos={...n.pos};s.rebucket(s.player);h.openBank();for(const id of ids){const slot=s.inventory.findIndex(x=>x.itemId===id);if(slot<0)throw new Error('Missing bank deposit '+id);s.bankDeposit(slot,1);}h.onInventoryChanged();},[...ids,...patterns]);
 await shot('bank-thirteen-icons','#bank-window');
 await page.evaluate(ids=>{const {sim:s,hud:h}=window.__game;for(let i=0;i<ids.length;i++)s.bankWithdraw(0,1);h.onInventoryChanged();h.closeBank();},[...ids,...patterns]);
 await page.evaluate(()=>{const {sim:s,hud:h}=window.__game;const n=s.entities.get(s.postOffice.mailboxIds[0]);if(!n)throw new Error('Missing mailbox');s.player.pos={...n.pos};s.player.prevPos={...n.pos};s.rebucket(s.player);h.openMailbox();});
 await clickLive('#mailbox-window [data-tab="send"]');
 await page.evaluate(patterns=>{for(const id of patterns)window.__game.hud.mailboxWindow.stageParcel(id);},patterns);
 await shot('mail-pattern-parcels','#mailbox-window');
 await page.evaluate(()=>{window.__game.hud.closeMailbox();if(getComputedStyle(document.querySelector('#bags')).display!=='none')window.__game.hud.toggleBags();});
 for(const state of ['affordable','locked','no-copper']){
  await page.evaluate(state=>{const {sim:s,hud:h}=window.__game,m=s.players.get(s.playerId);const st=s.stationPlacements.find(x=>x.type==='forge');const n=[...s.entities.values()].find(e=>e.templateId===st.masterNpcId);s.player.pos={...n.pos};s.player.prevPos={...n.pos};s.rebucket(s.player);m.knownRecipes.delete('recipe_freehold_weapon_rack');m.knownRecipes.delete('recipe_freehold_iron_brazier');m.craftSkills.weaponcrafting=state==='locked'?49:50;m.craftSkills.armorcrafting=state==='locked'?49:50;m.copper=state==='no-copper'?0:10000;h.openTrain(n.id);},state);
  await page.$eval('#train-window img[src$="/freehold_weapon_rack.webp"]',e=>e.closest('.train-row').scrollIntoView({block:'center',behavior:'instant'}));
  await shot('trainer-'+state,'#train-window');
 }
 await page.evaluate(()=>{window.__game.hud.closeTrain();window.__game.hud.reliquaryWindow.openWithPage('hearth_first_crafts');});

 for(const lang of ['en','zh_CN','zh_TW','ja_JP','ko_KR','ru_RU']) {
  await page.evaluate(async lang=>{const h=window.__game.hud;if(!await h.optionsHooks.changeLanguage(lang))throw new Error('Locale load failed '+lang);h.reliquaryWindow.openWithPage('hearth_first_crafts');if(new URL(location.href).searchParams.get('lang')!==lang)throw new Error('Locale route mismatch');const text=document.querySelector('#reliquary-window').innerText;if(lang!=='en'&&text.includes('First Hearth Crafts'))throw new Error('Hearth still English '+lang);},lang);
  await page.waitForFunction(()=>document.querySelectorAll('#reliquary-window .reliquary-cell--owned').length===10,{timeout:20000});
  await shot('hearth-'+lang,'#reliquary-window');
  if(mobile){await page.$eval('[data-focus-key="cell:item:freehold_glow_lantern"]',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await shot('hearth-lower-'+lang,'#reliquary-window');}
 }
 if(mobile){await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});await shot('portrait-orientation','#rotate-device');}
 await page.close();
}
for(const mobile of [false,true]) {
 const variant=mobile?'guide-mobile':'guide-desktop',page=await browser.newPage();await page.setViewport({width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:5185/wiki/reliquary?lang=en#reliquary-shelf-hearth',{waitUntil:'networkidle0',timeout:120000});await page.waitForSelector('#reliquary-hearth_first_crafts');
 const el=await page.$('#reliquary-hearth_first_crafts');await el.scrollIntoView();const file=out+'/'+variant+'.png';await el.screenshot({path:file});record.captures.push({variant,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),text:await el.evaluate(e=>e.innerText)});await page.close();console.log('captured '+variant);
}
}catch(e){record.errors.push(e.stack);throw e;}finally{await browser.close();fs.writeFileSync(out+'/manifest.json',JSON.stringify(record,null,2)+'\n');}
if(record.errors.length)process.exitCode=1;
