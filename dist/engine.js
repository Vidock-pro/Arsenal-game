/** Arsenal: deterministic, browser-independent game rules. No dependencies. */
export const COUNTRIES={
 fr:{name:'France',motto:'L’ingéniosité au service de l’industrie',bonus:'Recherche +15 %',icon:'FR'},
 us:{name:'USA',motto:'La puissance des grandes manufactures',bonus:'Production +15 %',icon:'US'},
 de:{name:'Allemagne',motto:'La précision des ateliers',bonus:'Prix de vente des équipements +15 %',icon:'DE'},
 su:{name:'URSS',motto:'La force des grands complexes',bonus:'Récolte +15 %',icon:'SU'}
};
export const RESOURCE_RATE_GROWTH=5/(1.5*1.3);
export const RESOURCES=[
 ['coal','Charbon','Mine de charbon','Énergie consommée par les ateliers de production.'],
 ['cotton','Coton','Plantation de coton','Fibres pour les uniformes et le matériel de soutien.'],
 ['wood','Bois','Scierie','Caisses, matériel de soutien et crosses.'],
 ['copper','Cuivre','Mine de cuivre','Composants métalliques des équipements et véhicules.'],
 ['gunpowder','Poudre à canon','Dépôt de poudre','Approvisionnement des ateliers de munitions.'],
 ['iron','Minerai de fer','Carrière de fer','Pièces mécaniques pour armes, véhicules et avions.'],
 ['rubber','Caoutchouc','Concession d’hévéas','Pneus et joints des véhicules.'],
 ['shale','Schiste bitumineux','Carrière de schiste','Approvisionnement énergétique des véhicules légers.'],
 ['oil','Pétrole brut','Champ pétrolier','Carburants et lubrifiants pour les moteurs.'],
 ['manganese','Manganèse','Mine de manganèse','Alliages des half-tracks et des blindages.'],
 ['nickel','Nickel','Mine de nickel','Alliages avancés pour blindages et moteurs.'],
 ['bauxite','Bauxite','Carrière de bauxite','Métal léger destiné aux ateliers d’aviation.']
].map(([id,name,site,desc],i)=>({id,name,site,desc,tier:i,previous:i?['coal','cotton','wood','copper','gunpowder','iron','rubber','shale','oil','manganese','nickel'][i-1]:null,rate:.4*RESOURCE_RATE_GROWTH**i,cost:i?100*5**(i-1):90,icon:'◆'}));
export const TECHS=[
 {id:'steam',name:'Machines à vapeur',desc:'Récolte de toutes les ressources + 20 %.',cost:{coal:60,cotton:20},time:30,requires:[],x:404,y:274,w:275,h:111},
 {id:'assembly',name:'Chaîne de montage',desc:'Production 25 % plus rapide. Autorise les véhicules légers et camions.',cost:{coal:100,wood:60,iron:40,copper:20},time:50,requires:['steam'],x:398,y:485,w:285,h:111},
 {id:'alloys',name:'Alliages avancés',desc:'Autorise les blindés, après leurs étapes précédentes.',cost:{coal:150,iron:100,manganese:40,nickel:20},time:75,requires:['steam'],x:753,y:485,w:277,h:109},
 {id:'chemistry',name:'Chimie industrielle',desc:'Autorise les grenades, munitions de fusil et obus.',cost:{coal:80,gunpowder:50,copper:30},time:45,requires:['steam'],x:752,y:273,w:278,h:113},
 {id:'series',name:'Production en série',desc:'Prix de vente de tous les équipements + 25 %.',cost:{coal:180,wood:80,iron:120,copper:60},time:100,requires:['assembly','alloys'],x:402,y:700,w:274,h:109},
 {id:'logistics',name:'Transport motorisé',desc:'Récolte + 25 %. Capacité des stocks doublée.',cost:{coal:140,iron:80,rubber:40,oil:30},time:90,requires:['assembly','chemistry'],x:752,y:699,w:277,h:111}
];
// Recipes are abstract game units, not real manufacturing specifications.
export const PRODUCTS=[
 ['uniform','Uniforme','Équipement', {coal:2,cotton:4},8,null],
 ['support','Matériel de soutien','Équipement',{coal:3,cotton:6,wood:5},10,null],
 ['pistol_ammo','Munition de pistolet','Armement',{coal:4,copper:6,gunpowder:4},12,null],
 ['pistol','Pistolet','Armement',{coal:6,copper:5,iron:10},15,'steam'],
 ['grenade','Grenade','Armement',{coal:6,gunpowder:8,iron:8},18,'chemistry'],
 ['rifle_ammo','Munition de fusil','Armement',{coal:8,copper:12,gunpowder:10},22,'chemistry'],
 ['rifle','Fusil','Armement',{coal:10,wood:14,iron:22},26,'steam'],
 ['machine_gun','Mitrailleuse','Armement',{coal:16,wood:8,copper:12,iron:38},32,'series'],
 ['shell','Obus','Artillerie',{coal:20,copper:20,gunpowder:28,iron:30},38,'chemistry'],
 ['artillery','Canon d’artillerie','Artillerie',{coal:35,wood:20,copper:25,iron:75},45,'series'],
 ['jeep','Jeep','Véhicules',{coal:40,cotton:15,copper:30,iron:85,rubber:35,shale:30},55,'assembly'],
 ['truck','Camion','Véhicules',{coal:55,cotton:30,wood:45,copper:40,iron:120,rubber:55,oil:40},65,'assembly'],
 ['halftrack','Half-track','Véhicules',{coal:70,copper:55,iron:160,rubber:65,oil:55,manganese:30},75,'logistics'],
 ['light_tank','Char léger','Blindés',{coal:90,copper:65,iron:220,rubber:50,oil:75,manganese:60},90,'alloys'],
 ['medium_tank','Char moyen','Blindés',{coal:120,copper:80,iron:320,rubber:65,oil:100,manganese:90,nickel:50},110,'alloys'],
 ['heavy_tank','Char lourd','Blindés',{coal:160,copper:110,iron:450,rubber:80,oil:140,manganese:140,nickel:100},130,'alloys'],
 ['recon','Avion de reconnaissance','Aviation',{coal:180,cotton:60,wood:100,copper:120,rubber:60,oil:150,nickel:70,bauxite:160},150,'logistics'],
 ['fighter','Avion de chasse','Aviation',{coal:220,copper:150,iron:140,rubber:70,oil:200,nickel:120,bauxite:280},180,'series'],
 ['bomber','Bombardier','Aviation',{coal:300,copper:220,iron:220,rubber:100,oil:300,nickel:180,bauxite:450},220,'series']
].map(([id,name,kind,recipe,time,unlock],tier)=>({id,name,kind,recipe,time,unlock:unlock||'steam',tier,value:Math.ceil(Object.entries(recipe).reduce((sum,[id,n])=>sum+n*Math.ceil(1.5**RESOURCES.find(r=>r.id===id).tier),0)*(1.4+tier*.06))}));
export const PRODUCT_NAMES={
 fr:['Tenue française modèle 1935','Équipement de soutien français','Cartouches de pistolet françaises','Pistolet automatique 1935A','Grenade F1','Cartouches de fusil françaises','MAS 36','Hotchkiss modèle 1914','Obus français','Canon de 75 modèle 1897','Willys MB · Forces françaises libres','Renault AGK','M5 Half-track · Forces françaises libres','Hotchkiss H39','SOMUA S35','B1 bis','Potez 63.11','Dewoitine D.520','LeO 451'],
 us:['Tenue de campagne M1943','Équipement de soutien américain','Cartouches de pistolet américaines','Colt M1911A1','Grenade Mk 2','Cartouches de fusil américaines','M1 Garand','Browning M1919','Obus américain','Howitzer M2A1','Willys MB','GMC CCKW','M3 Half-track','M5A1 Stuart','M4 Sherman','M26 Pershing · 1945','Piper L-4 Grasshopper','P-51 Mustang','B-17 Flying Fortress'],
 de:['Tenue de campagne M1936','Équipement de soutien allemand','Cartouches de pistolet allemandes','Walther P38','Stielhandgranate 24','Cartouches de fusil allemandes','Karabiner 98k','MG 42','Obus allemand','LeFH 18','Volkswagen Kübelwagen','Opel Blitz','Sd.Kfz. 251','Panzer II','Panzer IV','Tiger I','Focke-Wulf Fw 189','Messerschmitt Bf 109','Heinkel He 111'],
 su:['Tenue Gymnastiorka et casque SSh-40','Équipement de soutien soviétique','Cartouches de pistolet soviétiques','Tokarev TT-33','Grenade F1','Cartouches de fusil soviétiques','Mosin-Nagant 1891/30','DP-27','Obus soviétique','ZiS-3','GAZ-67','ZiS-5','ZiS-42','T-70','T-34-85','IS-2','Polikarpov Po-2','Yakovlev Yak-3','Petlyakov Pe-2']
};
export const productName=(s,p)=>PRODUCT_NAMES[s.country][p.tier];
export function patentRequirements(s,p){
 const missing=[];
 if(!s.tech.includes(p.unlock))missing.push('Recherche : '+TECHS.find(t=>t.id===p.unlock).name);
 if(!s.patents.includes(p.id)&&p.tier&&s.lines.find(l=>l.id===PRODUCTS[p.tier-1].id).made<1)missing.push('Fabriquer : '+PRODUCTS[p.tier-1].name);
 return missing;
}
export function productionRequirements(s,p){
 const missing=patentRequirements(s,p);
 if(!s.patents.includes(p.id))missing.push('Acheter le brevet : '+p.name);
 const sites=Object.keys(p.recipe).filter(id=>!s.levels[id]).map(id=>RESOURCES.find(r=>r.id===id).name);
 if(sites.length)missing.push('Ouvrir : '+sites.join(', '));
 return missing;
}
export const productionUnlocked=(s,p)=>productionRequirements(s,p).length===0;
// One-time license fee: five base sale values, with a 75-gold minimum.
export const PATENTS=PRODUCTS.map(p=>({...p,cost:Math.max(75,Math.ceil(p.value*5))}));
const LEGACY_PATENT_COSTS={steam:250,assembly:500,alloys:650,chemistry:450,series:1000,logistics:900};
export function newGame(country,now=Date.now()){
 if(!COUNTRIES[country])throw Error('Pays invalide');
 return {version:6,factories:0,country,credits:0,resources:Object.fromEntries(RESOURCES.map(r=>[r.id,0])),levels:Object.fromEntries(RESOURCES.map(r=>[r.id,r.id==='coal'?1:0])),workers:Object.fromEntries(RESOURCES.map(r=>[r.id,[]])),tech:[],research:null,patents:[],lines:PRODUCTS.map(p=>({id:p.id,enabled:false,remaining:0,stock:0,made:0,factories:0,batch:0,licensed:false})),totalSold:0,lastSaved:now,elapsed:0};
}
export const MAX_FACTORIES=250;
export const factoryCost=s=>Math.ceil(1000*1.3**Math.floor(s.factories/5));
export const freeFactories=s=>s.factories-s.lines.reduce((n,l)=>n+Math.max(l.factories,l.batch),0);
export const productionBatch=(s,p,l)=>Math.max(0,Math.min(l.factories,9999-l.stock,...Object.entries(p.recipe).map(([id,n])=>Math.floor(s.resources[id]/n))));
export const capacity=(s,r=RESOURCES[0])=>Math.ceil(5000*RESOURCE_RATE_GROWTH**r.tier)*(s.tech.includes('logistics')?2:1);
export const HIRE_COST=25, WAGE=2, PAY_PERIOD=60;
// Round only the displayed/payable amount, not the exponential base.
export const hireCost=(s,r)=>Math.ceil(HIRE_COST*1.3**s.workers[r.id].length);
export const MARKET_PRICES=Object.fromEntries(RESOURCES.map(r=>[r.id,Math.ceil(1.5**r.tier)]));
export const available=(s,r)=>s.levels[r.id]>0||!r.previous||s.levels[r.previous]>0;
export const unlocked=(s,r)=>s.levels[r.id]>0&&available(s,r);
export const activeWorkers=(s,r)=>s.workers[r.id].filter(t=>t>1e-8).length;
export const rate=(s,r)=>unlocked(s,r)?r.rate*s.levels[r.id]*activeWorkers(s,r)*(s.country==='su'?1.15:1)*(s.tech.includes('steam')?1.2:1)*(s.tech.includes('logistics')?1.25:1):0;
export const upgradeCost=(s,r)=>Math.ceil(r.cost*1.65**s.levels[r.id]);
export const researchTime=(s,t)=>t.time/(s.country==='fr'?1.15:1);
export const productTime=(s,p)=>p.time/(s.country==='us'?1.15:1)/(s.tech.includes('assembly')?1.25:1);
export const salePrice=(s,p)=>Math.ceil(p.value*(s.country==='de'?1.15:1)*(s.tech.includes('series')?1.25:1));
export const affordable=(s,cost)=>Object.entries(cost).every(([k,v])=>s.resources[k]>=v);
export function advance(s,seconds){
 let left=Math.max(0,Math.min(28800,Number(seconds)||0));
 while(left>1e-8){
 // Each worker prepays a minute; an unpaid worker resumes only when funds exist.
 for(const r of RESOURCES)for(let i=0;i<s.workers[r.id].length;i++)if(s.workers[r.id][i]<=1e-8&&s.credits>=WAGE){s.credits-=WAGE;s.workers[r.id][i]=PAY_PERIOD;}
 const remaining=Object.values(s.workers).flat().filter(t=>t>1e-8);
 const dt=Math.min(1,left,...remaining);left-=dt;s.elapsed+=dt;
 for(const r of RESOURCES)s.resources[r.id]=Math.min(capacity(s,r),s.resources[r.id]+rate(s,r)*dt);
 for(const r of RESOURCES)s.workers[r.id]=s.workers[r.id].map(t=>Math.max(0,t-dt));
 if(s.research){s.research.remaining-=dt;if(s.research.remaining<=0){s.tech.push(s.research.id);s.research=null;}}
 for(const line of s.lines){
  const p=PRODUCTS.find(x=>x.id===line.id);if(!line.enabled)continue;
  let budget=dt;
  while(budget>1e-8){
   if(line.remaining<=1e-8){
    const batch=productionBatch(s,p,line);if(!batch||!productionUnlocked(s,p))break;
    for(const [id,n] of Object.entries(p.recipe))s.resources[id]-=n*batch;
    line.batch=batch;line.licensed=true;line.remaining=productTime(s,p);
   }
   const used=Math.min(budget,line.remaining);line.remaining-=used;budget-=used;
   if(line.remaining<=1e-8){line.remaining=0;line.stock+=line.batch;line.made+=line.batch;line.batch=0;if(!line.factories){line.enabled=false;break;}}
  }
 }

 }return s;
}
export function act(s,type,id){
 if(type==='buy-factory'){if(s.factories>=MAX_FACTORIES||s.credits<factoryCost(s))return false;s.credits-=factoryCost(s);s.factories++;return true;}
 if(type==='assign-factory'||type==='release-factory'){
  const l=s.lines.find(l=>l.id===id);if(!l)return false;
  if(type==='assign-factory'){if((freeFactories(s)<1&&l.factories>=l.batch)||!s.patents.includes(id))return false;l.factories++;}
  else {if(!l.factories)return false;l.factories--;if(!l.factories&&!l.remaining)l.enabled=false;}
  return true;
 }
 if(type==='harvest'){const r=RESOURCES.find(r=>r.id===id);if(!r||!unlocked(s,r)||s.resources[id]>=capacity(s,r))return false;s.resources[id]=Math.min(capacity(s,r),s.resources[id]+1);return true;}
 if(type==='upgrade'){const r=RESOURCES.find(r=>r.id===id);if(!r||!available(s,r)||s.levels[id]>=100||s.credits<upgradeCost(s,r))return false;s.credits-=upgradeCost(s,r);s.levels[id]++;return true;}
 if(type==='hire'){const r=RESOURCES.find(r=>r.id===id);if(!r||!unlocked(s,r)||s.workers[id].length>=100||s.credits<hireCost(s,r)+WAGE)return false;s.credits-=hireCost(s,r)+WAGE;s.workers[id].push(PAY_PERIOD);return true;}
 if(type==='dismiss'){const r=RESOURCES.find(r=>r.id===id);if(!r||!s.workers[id].length)return false;s.workers[id].pop();return true;}
 if(['sell-resource','sell-ten','sell-all'].includes(type)){const r=RESOURCES.find(r=>r.id===id);if(!r)return false;const amount=type==='sell-all'?Math.floor(s.resources[id]):type==='sell-ten'?10:1;if(amount<=0||s.resources[id]<amount)return false;s.resources[id]-=amount;s.credits+=amount*MARKET_PRICES[id];return true;}
 if(type==='research'){const t=TECHS.find(t=>t.id===id);if(!t||s.research||s.tech.includes(id)||!t.requires.every(k=>s.tech.includes(k))||!affordable(s,t.cost))return false;for(const [resource,amount] of Object.entries(t.cost))s.resources[resource]-=amount;s.research={id,remaining:researchTime(s,t)};return true;}
 if(type==='patent'){const p=PATENTS.find(p=>p.id===id);if(!p||patentRequirements(s,p).length||s.patents.includes(id)||s.credits<p.cost)return false;s.credits-=p.cost;s.patents.push(id);s.lines.find(l=>l.id===id).licensed=true;return true;}
 if(type==='toggle'){const l=s.lines.find(l=>l.id===id),p=PRODUCTS.find(p=>p.id===id);if(!l||(!l.enabled&&((!l.factories&&!l.batch)||(l.remaining<=0&&!productionUnlocked(s,p)))))return false;l.enabled=!l.enabled;return true;}
 if(type==='sell'){const l=s.lines.find(l=>l.id===id),p=PRODUCTS.find(p=>p.id===id);if(!l||!l.stock)return false;s.credits+=l.stock*salePrice(s,p);s.totalSold+=l.stock;l.stock=0;return true;}
 return false;
}
export function validateSave(raw){
 const s=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);
 const finite=(n,max=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
 const unique=a=>new Set(a).size===a.length;
 if(!s||![1,2,3,4,5,6].includes(s.version)||!COUNTRIES[s.country]||!finite(s.credits)||!finite(s.elapsed)||!finite(s.totalSold)||!finite(s.lastSaved,Date.now()+60000))throw Error('Sauvegarde invalide');
 // Migrate old five-resource saves without resetting existing sites or payroll.
 if(s.version<3){
  const legacy=['coal','wood','iron','platinum','rubber'];
  for(const id of legacy){
   if(!finite(s.resources?.[id],10000)||!Number.isInteger(s.levels?.[id])||!finite(s.levels[id],100))throw Error('Ressources invalides');
   if(s.version===2&&(!Array.isArray(s.workers?.[id])||s.workers[id].length>100||s.workers[id].some(t=>!finite(t,PAY_PERIOD))||(s.workers[id].length&&!s.levels[id])))throw Error('Ouvriers invalides');
  }
  const old=s.workers||{};s.credits+=s.resources.platinum*6;
  s.resources=Object.fromEntries(RESOURCES.map(r=>[r.id,s.resources[r.id]??0]));
  s.levels=Object.fromEntries(RESOURCES.map(r=>[r.id,s.levels[r.id]??0]));
  s.workers=Object.fromEntries(RESOURCES.map(r=>[r.id,s.version===1?[]:(old[r.id]??[])]));
  if(s.version===2)for(const time of old.platinum){if(s.workers.coal.length<100){s.workers.coal.push(time);s.levels.coal=Math.max(1,s.levels.coal);}else s.credits+=HIRE_COST+WAGE*time/PAY_PERIOD;}
  s.version=3;
 }
 for(const r of RESOURCES)if(!finite(s.resources?.[r.id],1e12)||!Number.isInteger(s.levels?.[r.id])||s.levels[r.id]<0||s.levels[r.id]>100)throw Error('Ressources invalides');
 for(const key of ['tech','patents'])if(!Array.isArray(s[key])||!unique(s[key])||s[key].some(id=>!(key==='patents'&&s.version>=5?PATENTS:TECHS).some(t=>t.id===id)))throw Error('Technologies invalides');
 if(s.tech.some(id=>!TECHS.find(t=>t.id===id).requires.every(k=>s.tech.includes(k)))||s.patents.some(id=>!s.tech.includes(s.version>=5?PRODUCTS.find(p=>p.id===id).unlock:id)))throw Error('Progression incohérente');
 if(s.research&&(!TECHS.some(t=>t.id===s.research.id)||s.tech.includes(s.research.id)||!finite(s.research.remaining,200)||!TECHS.find(t=>t.id===s.research.id).requires.every(k=>s.tech.includes(k))))throw Error('Recherche invalide');
 const legacyLines=s.version<4;
 if(!Array.isArray(s.lines)||s.lines.length!==(legacyLines?3:PRODUCTS.length)||!unique(s.lines.map(l=>l.id)))throw Error('Lignes invalides');
 for(const l of s.lines)if(!(legacyLines?['rifle','truck','tank'].includes(l.id):PRODUCTS.some(p=>p.id===l.id))||typeof l.enabled!=='boolean'||!finite(l.remaining,300)||!Number.isInteger(l.stock)||!finite(l.stock,9999)||!Number.isInteger(l.made)||!finite(l.made)||(!legacyLines&&typeof l.licensed!=='boolean'))throw Error('Production invalide');
 if(legacyLines){
  const old=Object.fromEntries(s.lines.map(l=>[l.id==='tank'?'medium_tank':l.id,l]));
  s.lines=PRODUCTS.map(p=>old[p.id]?{...old[p.id],id:p.id,licensed:true}:{id:p.id,enabled:false,remaining:0,stock:0,made:0,factories:0,batch:0,licensed:false});
  s.version=4;
 }
 if(s.version<5){
  // Refund obsolete royalty certificates once; keep every previously acquired line.
  s.credits+=s.patents.reduce((sum,id)=>sum+LEGACY_PATENT_COSTS[id],0);
  s.patents=s.lines.filter(l=>l.licensed||l.enabled||l.made>0||l.stock>0||l.remaining>0).map(l=>l.id);
  const grant=id=>{for(const parent of TECHS.find(t=>t.id===id).requires)grant(parent);if(!s.tech.includes(id))s.tech.push(id);};
  for(const id of s.patents)grant(PRODUCTS.find(p=>p.id===id).unlock);
  for(const l of s.lines)l.licensed=s.patents.includes(l.id);
  if(s.research&&s.tech.includes(s.research.id)){s.credits+=({steam:240,assembly:450,alloys:650,chemistry:400,series:1300,logistics:1000})[s.research.id];s.research=null;}
  s.version=5;
 }
 if(s.version<6){
  for(const l of s.lines){l.factories=l.licensed?1:0;l.batch=l.remaining>0?1:0;}
  s.factories=s.lines.reduce((n,l)=>n+l.factories,0);s.version=6;
 }
 if(!Number.isInteger(s.factories)||!finite(s.factories,MAX_FACTORIES)||s.lines.some(l=>!Number.isInteger(l.factories)||!finite(l.factories,MAX_FACTORIES)||!Number.isInteger(l.batch)||!finite(l.batch,MAX_FACTORIES)||(l.remaining>0)!==(l.batch>0)||l.stock+l.batch>9999||(l.factories>0&&!l.licensed)||(l.enabled&&!l.factories&&!l.batch))||freeFactories(s)<0)throw Error('Usines invalides');
 if(!finite(s.credits)||s.lines.some(l=>l.licensed!==s.patents.includes(l.id)||((l.enabled||l.remaining>0||l.made>0||l.stock>0)&&!l.licensed)))throw Error('Brevets incohérents');
 for(const r of RESOURCES){const crew=s.workers?.[r.id];if(!Array.isArray(crew)||crew.length>100||crew.some(t=>!finite(t,PAY_PERIOD))||(crew.length&&!unlocked(s,r)))throw Error('Ouvriers invalides');}
 return s;
}
