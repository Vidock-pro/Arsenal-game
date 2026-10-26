import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function mount(){
 const nodes=new Map(),events={},timers=[];
 const get=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',dataset:{},style:{},parentElement:{},setAttribute(k,v){this[k]=v},classList:{add(){},remove(){}}});return nodes.get(id);};
 const context=vm.createContext({structuredClone,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:get,getElementById:get,addEventListener(name,fn){events[name]=fn}},window:{addEventListener(){}},setInterval(fn){timers.push(fn)},setTimeout(){},clearTimeout(){}});
 vm.runInContext(fs.readFileSync(new URL('dist/engine.js',root),'utf8').replaceAll('export ','')+'\n'+fs.readFileSync(new URL('dist/app.js',root),'utf8').split('\n').slice(1).join('\n'),context);
 return {get,context,events,timers};
}
test('Production renders all 19 national cards and filters without missing imagery',()=>{
 for(const country of ['fr','us','de','su']){
  const ui=mount();vm.runInContext(`state=newGame('${country}');view='production';shell();`,ui.context);
  const html=ui.get('#content').innerHTML;
  assert.equal((html.match(/<article class="production-card/g)||[]).length,19);
  assert.ok(!html.includes('undefined'));assert.ok(!html.includes('NaN'));
  assert.ok(fs.existsSync(new URL(`dist/assets/production-${country}.png`,root)));
  assert.equal(ui.get('toggle-uniform').disabled,true);
  vm.runInContext("state.levels.cotton=1;shell();",ui.context);
  assert.equal(ui.get('toggle-uniform').disabled,false);assert.equal(ui.get('toggle-support').disabled,true);
  ui.events.click({target:{closest:()=>({dataset:{productionFilter:'Aviation'}})}});
  assert.equal((ui.get('#content').innerHTML.match(/<article class="production-card/g)||[]).length,3);
  assert.ok(ui.get('#content').innerHTML.includes('Bombardier'));
  vm.runInContext("view='storage';shell();",ui.context);assert.ok(!ui.get('#content').innerHTML.includes('undefined'));
 }
});
test('A completed first item refreshes the production prerequisites',()=>{
 const ui=mount();vm.runInContext("state=newGame('fr');state.levels.cotton=1;state.levels.wood=1;state.resources.cotton=4;state.resources.coal=2;view='production';shell();act(state,'toggle','uniform');last=Date.now()-8100;",ui.context);
 ui.timers[0]();assert.equal(ui.get('toggle-support').disabled,false);assert.ok(ui.get('made-uniform').textContent.startsWith('1 '));
});
