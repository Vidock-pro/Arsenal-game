import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function mount(){
 const nodes=new Map(),events={},timers=[],timeouts=new Map();let time=0,nextTimeout=0;
 const get=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',dataset:{},style:{},parentElement:{},setAttribute(k,v){this[k]=v},classList:{add(){},remove(){}}});return nodes.get(id);};
 const context=vm.createContext({structuredClone,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:get,getElementById:get,addEventListener(name,fn){events[name]=fn}},window:{addEventListener(){}},setInterval(fn){timers.push(fn)},setTimeout(fn,delay){const id=++nextTimeout;timeouts.set(id,{fn,at:time+delay});return id},clearTimeout(id){timeouts.delete(id)}});
 vm.runInContext(fs.readFileSync(new URL('dist/engine.js',root),'utf8').replaceAll('export ','')+'\n'+fs.readFileSync(new URL('dist/app.js',root),'utf8').split('\n').slice(1).join('\n'),context);
 return {get,context,events,timers,elapse(ms){time+=ms;for(const [id,t] of timeouts)if(t.at<=time){timeouts.delete(id);t.fn();}}};
}
test('Production renders all 19 national cards and filters without missing imagery',()=>{
 for(const country of ['fr','us','de','su']){
  const ui=mount();vm.runInContext(`state=newGame('${country}');view='production';shell();`,ui.context);
  const html=ui.get('#content').innerHTML;
  assert.equal((html.match(/<article class="production-card/g)||[]).length,19);
  assert.ok(!html.includes('undefined'));assert.ok(!html.includes('NaN'));
  assert.ok(fs.existsSync(new URL(`dist/assets/production-${country}.png`,root)));
  assert.equal(ui.get('toggle-uniform').disabled,true);
  vm.runInContext("state.levels.cotton=1;state.tech=['steam'];state.credits=75;act(state,'patent','uniform');state.factories=1;act(state,'assign-factory','uniform');shell();",ui.context);
  assert.equal(ui.get('toggle-uniform').disabled,false);assert.equal(ui.get('toggle-support').disabled,true);
  ui.events.click({target:{closest:()=>({dataset:{productionFilter:'Aviation'}})}});
  assert.equal((ui.get('#content').innerHTML.match(/<article class="production-card/g)||[]).length,3);
  assert.ok(ui.get('#content').innerHTML.includes('Bombardier'));
  vm.runInContext("view='storage';shell();",ui.context);assert.ok(!ui.get('#content').innerHTML.includes('undefined'));
 }
});
test('A completed first item refreshes the production prerequisites',()=>{
 const ui=mount();vm.runInContext("state=newGame('fr');state.levels.cotton=1;state.levels.wood=1;state.resources.cotton=4;state.resources.coal=2;state.tech=['steam'];state.credits=1000;act(state,'patent','uniform');state.factories=1;act(state,'assign-factory','uniform');view='production';shell();act(state,'toggle','uniform');last=Date.now()-8100;",ui.context);
 ui.timers[0]();assert.equal(ui.get('toggle-support').disabled,true);vm.runInContext("view='patents';shell();",ui.context);assert.equal(ui.get('patent-support').disabled,false);assert.ok(ui.get('made-uniform').textContent.startsWith('1 '));
});

test('Patent catalog shows national images, research gates, affordability and acquisition',()=>{
 for(const country of ['fr','us','de','su']){
  const ui=mount();vm.runInContext(`state=newGame('${country}');view='patents';shell();`,ui.context);
  const html=ui.get('#content').innerHTML;assert.equal((html.match(/<article class="production-card/g)||[]).length,19);assert.ok(html.includes(`production-${country}.png`));assert.ok(!/undefined|NaN|redevances/.test(html));assert.equal(ui.get('patent-uniform').disabled,true);
  vm.runInContext("state.tech=['steam'];state.credits=74;updateNumbers();",ui.context);assert.equal(ui.get('patent-uniform').disabled,true);
  vm.runInContext('state.credits=75;updateNumbers();',ui.context);assert.equal(ui.get('patent-uniform').disabled,false);
  ui.events.click({target:{closest:()=>({dataset:{action:'patent',id:'uniform'}})}});assert.ok(ui.get('#content').innerHTML.includes('ACQUIS'));assert.equal(ui.get('total-income').textContent,'1 / 19');
 }
});

test('Research displays live material costs and enables with materials and no gold',()=>{
 const ui=mount();vm.runInContext("state=newGame('fr');view='research';shell();",ui.context);
 assert.ok(ui.get('#content').innerHTML.includes('Ressources nécessaires'));assert.ok(!ui.get('#content').innerHTML.includes('undefined'));assert.equal(ui.get('research-steam').disabled,true);assert.equal(ui.get('research-cost-steam-coal').textContent,'0 / 60');
 vm.runInContext('state.resources.coal=60;state.resources.cotton=20;updateNumbers();',ui.context);assert.equal(ui.get('research-steam').disabled,false);assert.equal(ui.get('research-cost-steam-coal')['data-missing'],'false');
 ui.events.click({target:{closest:()=>({dataset:{action:'research',id:'steam'}})}});assert.ok(ui.get('#content').innerHTML.includes('research-time'));assert.equal(ui.get('credits').textContent,'0 or');assert.equal(ui.get('research-assembly').disabled,true);
});

test('Research tree renders prerequisite links and click-pinned dossiers',()=>{
 const ui=mount();vm.runInContext("state=newGame('fr');view='research';shell();",ui.context);
 let html=ui.get('#content').innerHTML;assert.equal((html.match(/data-research-node=/g)||[]).length,6);assert.equal((html.match(/<path class=/g)||[]).length,7);assert.equal((html.match(/class="research-detail"/g)||[]).length,6);assert.ok(html.includes('aria-controls="research-detail-steam"'));
 ui.events.click({target:{closest:()=>({dataset:{researchNode:'chemistry'}})}});html=ui.get('#content').innerHTML;assert.equal((html.match(/data-pinned="true"/g)||[]).length,1);assert.ok(html.includes('aria-label="Chimie industrielle · VERROUILLÉ" aria-expanded="true"'));
 ui.events.click({target:{closest:()=>({dataset:{researchClose:'chemistry'}})}});assert.ok(!ui.get('#content').innerHTML.includes('data-pinned="true"'));
 vm.runInContext("state.tech=['steam'];state.research={id:'assembly',remaining:10};shell();",ui.context);html=ui.get('#content').innerHTML;assert.ok(html.includes('Machines à vapeur · VALIDÉ'));assert.ok(html.includes('Chaîne de montage · EN COURS'));assert.ok(html.includes('Chimie industrielle · ACCESSIBLE'));
});

test('Research hover opens only after one continuous second on the square',()=>{
 const ui=mount(),attrs={},square={isConnected:true,contains:x=>x===square,setAttribute(k,v){attrs[k]=v},closest:selector=>selector==='.research-square'?square:node};
 const node={contains:x=>x===square||x===node,setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]},getAttribute:()=> 'false',querySelector:()=>square};
 ui.events.pointerover({target:{closest:()=>null},relatedTarget:null});ui.elapse(2500);assert.equal(attrs['data-preview'],undefined);
 ui.events.pointerover({target:square,relatedTarget:null});ui.elapse(999);assert.equal(attrs['data-preview'],undefined);
 ui.events.pointerout({target:square,relatedTarget:node});ui.elapse(1);assert.equal(attrs['data-preview'],undefined);
 ui.events.pointerover({target:square,relatedTarget:node});ui.elapse(999);assert.equal(attrs['data-preview'],undefined);ui.elapse(1);assert.equal(attrs['data-preview'],'true');
 ui.events.pointerout({target:square,relatedTarget:node});assert.equal(attrs['data-preview'],'true');
 ui.events.pointerout({target:square,relatedTarget:null});assert.equal(attrs['data-preview'],undefined);assert.equal(attrs['aria-expanded'],'false');
});

test('Production displays factory purchase and allocation controls',()=>{
 const ui=mount();vm.runInContext("state=newGame('fr');view='production';state.tech=['steam'];state.credits=2000;state.levels.cotton=1;act(state,'patent','uniform');shell();",ui.context);
 assert.ok(ui.get('#content').innerHTML.includes('factory-icon'));assert.equal(ui.get('toggle-uniform').disabled,true);assert.equal(ui.get('assign-factory-uniform').disabled,true);
 ui.events.click({target:{closest:()=>({dataset:{action:'buy-factory'}})}});assert.equal(ui.get('assign-factory-uniform').disabled,false);
 ui.events.click({target:{closest:()=>({dataset:{action:'assign-factory',id:'uniform'}})}});assert.equal(ui.get('toggle-uniform').disabled,false);assert.equal(ui.get('factory-summary').textContent,'1 usines · 0 disponibles');
});
