import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_PRICES,capacity,available,upgradeCost,COUNTRIES,PRODUCTS,researchTime,productTime,salePrice,hireCost,newGame,act,advance,RESOURCES,rate,validateSave,TECHS,PATENTS} from '../dist/engine.js';
function established(country){const s=newGame(country);s.credits=700;Object.assign(s.resources,{coal:70,wood:100,iron:90});s.levels.wood=1;s.levels.iron=1;return s;}

test('Each nation gets only its own 15 percent bonus',()=>{
 for(const id of Object.keys(COUNTRIES)){
  const s=established(id);act(s,'hire','coal');
  assert.ok(Math.abs(rate(s,RESOURCES[0])-.4*(id==='su'?1.15:1))<1e-10);
  assert.equal(researchTime(s,TECHS[0]),30/(id==='fr'?1.15:1));
  assert.equal(productTime(s,PRODUCTS[0]),12/(id==='us'?1.15:1));
  assert.equal(salePrice(s,PRODUCTS[0]),id==='de'?63:55);
  const gold=s.credits;s.resources.coal=1;act(s,'sell-resource','coal');assert.equal(s.credits,gold+1);
  s.tech=['steam','assembly','alloys','series'];assert.equal(salePrice(s,PRODUCTS[0]),Math.floor(55*1.25*(id==='de'?1.15:1)));
  assert.doesNotThrow(()=>validateSave(s));
 }
 const us=established('us'),de=established('de');act(us,'toggle','rifle');act(de,'toggle','rifle');advance(us,11);advance(de,11);assert.equal(us.lines[0].stock,1);assert.equal(de.lines[0].stock,0);
});
test('Production consumes ingredients, finishes and sale pays once',()=>{let s=established('fr');act(s,'toggle','rifle');advance(s,12);assert.equal(s.lines[0].stock,1);assert.equal(s.lines[0].made,1);assert.ok(s.resources.iron<90);act(s,'sell','rifle');assert.equal(s.credits,755);assert.equal(s.totalSold,1);assert.equal(act(s,'sell','rifle'),false);});
test('Blocked actions never spend funds',()=>{let s=established('fr');assert.equal(act(s,'research','series'),false);assert.equal(act(s,'patent','steam'),false);assert.equal(act(s,'upgrade','platinum'),false);assert.equal(s.credits,700);});
test('Research completion unlocks patents and passive income',()=>{let s=established('fr');act(s,'research','steam');advance(s,27);assert.ok(s.tech.includes('steam'));assert.ok(act(s,'patent','steam'));let c=s.credits;advance(s,60);assert.ok(Math.abs(s.credits-c-18)<1e-7);assert.equal(act(s,'patent','steam'),false);});
test('Offline calculation matches one-second simulation and caps at 8 hours',()=>{let a=established('de');act(a,'toggle','rifle');act(a,'research','steam');let b=structuredClone(a);advance(a,600);for(let i=0;i<600;i++)advance(b,1);assert.deepEqual(a,b);let c=established('fr');advance(c,999999);assert.equal(c.elapsed,28800);assert.ok(c.resources.wood<=5000);});
test('Pausing preserves in-flight work without consuming extra inputs',()=>{let s=established('fr');act(s,'toggle','rifle');advance(s,3);act(s,'toggle','rifle');advance(s,20);assert.equal(s.lines[0].remaining,9);act(s,'toggle','rifle');advance(s,9);assert.equal(s.lines[0].stock,1);});
test('Save validation rejects malformed and malicious data',()=>{let s=established('fr');assert.deepEqual(validateSave(JSON.stringify(s)),s);assert.throws(()=>validateSave('{}'));s.credits=-1;assert.throws(()=>validateSave(s));s=established('fr');s.tech=['steam','steam'];assert.throws(()=>validateSave(s));s=established('fr');s.country='<img>';assert.throws(()=>validateSave(s));s=established('fr');s.lines[0].remaining=Infinity;assert.throws(()=>validateSave(s));});
test('Complete progression is reachable, unlocks all production and patents',()=>{let s=established('fr');s.credits=1e11;for(const t of TECHS){assert.ok(act(s,'research',t.id));advance(s,200);}for(const p of PATENTS)assert.ok(act(s,'patent',p.id));for(const r of RESOURCES){act(s,'upgrade',r.id);s.resources[r.id]=1000;}for(const l of s.lines)act(s,'toggle',l.id);advance(s,200);assert.ok(s.lines.every(l=>l.made>0));assert.doesNotThrow(()=>validateSave(s));});


test('New game starts with only manual coal and empty treasury',()=>{
 const s=newGame('su');assert.equal(s.credits,0);assert.equal(s.levels.coal,1);
 advance(s,600);assert.ok(Object.values(s.resources).every(n=>n===0));
 assert.ok(act(s,'harvest','coal'));assert.equal(s.resources.coal,1);
 for(const id of ['wood','iron','platinum','rubber']){assert.equal(act(s,'harvest',id),false);assert.equal(act(s,'hire',id),false);}
});
test('Manual sales fund the first worker and new sites',()=>{
 const s=newGame('fr');for(let i=0;i<27;i++)act(s,'harvest','coal');
 assert.ok(act(s,'sell-all','coal'));assert.equal(s.credits,27);
 assert.ok(act(s,'hire','coal'));assert.equal(s.credits,0);
 advance(s,60);assert.ok(Math.abs(s.resources.coal-24)<1e-8);
 const stock=s.resources.coal;advance(s,60);assert.equal(s.resources.coal,stock);assert.equal(s.credits,0);
 assert.ok(act(s,'sell-ten','coal'));advance(s,1);assert.equal(s.credits,8);assert.ok(s.resources.coal>stock-10);
 s.credits=600;assert.equal(act(s,'upgrade','wood'),false);assert.ok(act(s,'upgrade','cotton'));assert.ok(act(s,'upgrade','wood'));assert.equal(s.credits,0);
 assert.ok(act(s,'harvest','wood'));assert.equal(s.resources.wood,1);assert.equal(rate(s,RESOURCES[1]),0);
});
test('Hiring, wages, dismissal and full stores cannot create unpaid labor',()=>{
 const s=newGame('fr');s.credits=26;assert.equal(act(s,'hire','coal'),false);assert.equal(s.credits,26);
 s.credits=100;act(s,'hire','coal');act(s,'hire','coal');assert.equal(s.credits,38);
 s.resources.coal=5000;advance(s,61);assert.equal(s.credits,34);assert.equal(s.resources.coal,5000);
 assert.equal(act(s,'harvest','coal'),false);act(s,'dismiss','coal');act(s,'dismiss','coal');
 advance(s,120);assert.equal(s.credits,34);assert.equal(act(s,'dismiss','coal'),false);
});
test('Market respects unit prices, whole units, and available inventory',()=>{
 const s=newGame('fr');s.resources.iron=10.5;
 assert.ok(act(s,'sell-ten','iron'));assert.equal(s.credits,10*MARKET_PRICES.iron);assert.equal(s.resources.iron,.5);
 assert.equal(act(s,'sell-all','iron'),false);assert.equal(act(s,'sell-resource','iron'),false);
 assert.equal(act(s,'sell-all','bad-id'),false);
 s.resources.nickel=3.5;assert.ok(act(s,'sell-all','nickel'));assert.equal(s.credits,10*MARKET_PRICES.iron+3*MARKET_PRICES.nickel);assert.equal(s.resources.nickel,.5);
});
test('Payroll is identical offline and in quarter-second updates',()=>{
 const a=newGame('fr');a.credits=45;act(a,'hire','coal');const b=structuredClone(a);
 advance(a,800);for(let i=0;i<3200;i++)advance(b,.25);
 assert.equal(a.credits,b.credits);assert.deepEqual(a.workers,b.workers);assert.ok(Math.abs(a.resources.coal-b.resources.coal)<1e-7);
});
test('Save migration preserves legacy assets and validates new payroll',()=>{
 const old=established('fr');old.version=1;old.resources.platinum=0;old.levels.platinum=0;delete old.workers;
 const migrated=validateSave(old);assert.equal(migrated.version,3);assert.equal(migrated.credits,700);assert.equal(migrated.resources.wood,100);assert.equal(rate(migrated,RESOURCES[0]),0);
 const s=newGame('fr');s.credits=100;act(s,'hire','coal');advance(s,12.25);assert.deepEqual(validateSave(s),s);
 for(const value of [-1,61,Infinity,'60']){const invalid=structuredClone(s);invalid.workers.coal=[value];assert.throws(()=>validateSave(invalid));}
 const invalid=structuredClone(s);invalid.workers.wood=[60];assert.throws(()=>validateSave(invalid));
 const missing=structuredClone(s);delete missing.workers;assert.throws(()=>validateSave(missing));
});


test('Hiring scales per site while salaries stay fixed',()=>{
 const s=newGame('fr');s.credits=1000;const coal=RESOURCES[0],wood=RESOURCES[1];
 for(const price of [25,33,43,55]){assert.equal(hireCost(s,coal),price);const before=s.credits;assert.ok(act(s,'hire','coal'));assert.equal(before-s.credits,price+2);}
 assert.equal(hireCost(s,wood),25);
 const before=s.credits;advance(s,61);assert.equal(before-s.credits,8);
 const saved=validateSave(s);assert.equal(hireCost(saved,coal),hireCost(s,coal));
 act(s,'dismiss','coal');assert.equal(hireCost(s,coal),55);
 s.credits=56;const crew=structuredClone(s.workers.coal);assert.equal(act(s,'hire','coal'),false);assert.equal(s.credits,56);assert.deepEqual(s.workers.coal,crew);
 s.credits=57;assert.ok(act(s,'hire','coal'));assert.equal(s.credits,0);
});


test('All twelve sites open in order with x5 costs, x1.5 prices and x1.3 gross funding times',()=>{
 assert.deepEqual(RESOURCES.map(r=>r.id),['coal','cotton','wood','copper','gunpowder','iron','rubber','shale','oil','manganese','nickel','bauxite']);
 const s=newGame('fr');s.credits=1e11;let lastTime=null;
 for(let i=1;i<RESOURCES.length;i++){
  const r=RESOURCES[i],previous=RESOURCES[i-1];
  for(const later of RESOURCES.slice(i+1))assert.equal(available(s,later),false);
  assert.equal(r.cost,100*5**(i-1));assert.equal(MARKET_PRICES[r.id]/MARKET_PRICES[previous.id],1.5);
  const time=r.cost/(previous.rate*MARKET_PRICES[previous.id]);
  if(lastTime!==null)assert.ok(Math.abs(time/lastTime-1.3)<1e-10);lastTime=time;
  assert.ok(act(s,'upgrade',r.id));assert.ok(act(s,'harvest',r.id));assert.equal(s.resources[r.id],1);
  assert.ok(act(s,'hire',r.id));assert.ok(rate(s,r)>0);
  assert.ok(capacity(s,r)/r.rate>=12500);
 }
 assert.deepEqual(validateSave(s),s);
});
test('Version 2 migration retains workers, converts platinum, and preserves accessible legacy sites',()=>{
 const old=newGame('fr');old.version=2;old.credits=10;
 old.resources={coal:12,wood:30,iron:40,rubber:5,platinum:7};
 old.levels={coal:1,wood:2,iron:1,rubber:1,platinum:1};
 old.workers={coal:[40],wood:[25],iron:[],rubber:[],platinum:[12]};
 const s=validateSave(old);assert.equal(s.version,3);assert.equal(s.credits,52);assert.equal(s.resources.cotton,0);assert.equal(s.resources.wood,30);
 assert.deepEqual(s.workers.coal,[40,12]);assert.deepEqual(s.workers.wood,[25]);assert.ok(act(s,'harvest','wood'));
 assert.equal('platinum' in s.resources,false);assert.deepEqual(validateSave(s),s);
 old.resources.platinum=-1;assert.throws(()=>validateSave(old));
});
test('Fractional resource sales preserve value and late-game capacity survives save/load',()=>{
 const s=newGame('us');s.resources.cotton=1;act(s,'sell-resource','cotton');assert.equal(s.credits,1.5);
 const r=RESOURCES.at(-1);s.levels[r.id]=1;s.workers[r.id]=[60];s.credits=100;
 advance(s,60);assert.ok(s.resources.bauxite>10000);assert.ok(s.resources.bauxite<capacity(s,r));assert.deepEqual(validateSave(s),s);
});
