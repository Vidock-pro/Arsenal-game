/** Arsenal: deterministic, browser-independent game rules. No dependencies. */
export const COUNTRIES={
 fr:{name:'France',motto:'L’ingéniosité au service de l’industrie',bonus:'Recherche +15 %',icon:'FR',units:['Fusil MAS 36','Camion de ravitaillement','Char B1 bis']},
 us:{name:'USA',motto:'La puissance des grandes manufactures',bonus:'Production +15 %',icon:'US',units:['Fusil américain','Camion de ravitaillement','Char américain']},
 de:{name:'Allemagne',motto:'La précision des ateliers',bonus:'Prix de vente des équipements +15 %',icon:'DE',units:['Fusil Karabiner 98k','Camion de ravitaillement','Panzer IV']},
 su:{name:'URSS',motto:'La force des grands complexes',bonus:'Récolte +15 %',icon:'SU',units:['Fusil Mosin-Nagant','Camion de ravitaillement','Char T-34']}
};
export const RESOURCE_RATE_GROWTH=5/(1.5*1.3);
export const RESOURCES=[
 ['coal','Charbon','Mine de charbon','Énergie des ateliers et des futures transformations.'],
 ['cotton','Coton','Plantation de coton','Fibres destinées aux tissus et aux uniformes.'],
 ['wood','Bois','Scierie','Caisses, matériel de soutien et crosses.'],
 ['copper','Cuivre','Mine de cuivre','Composants métalliques et futurs équipements électriques.'],
 ['gunpowder','Poudre à canon','Dépôt de poudre','Approvisionnement destiné aux futures munitions.'],
 ['iron','Minerai de fer','Carrière de fer','Pièces mécaniques et futurs aciers industriels.'],
 ['rubber','Caoutchouc','Concession d’hévéas','Pneus et joints des futurs véhicules.'],
 ['shale','Schiste bitumineux','Carrière de schiste','Matière destinée à la future filière des carburants.'],
 ['oil','Pétrole brut','Champ pétrolier','Carburants et lubrifiants pour les moteurs.'],
 ['manganese','Manganèse','Mine de manganèse','Aciers renforcés pour les futurs blindages.'],
 ['nickel','Nickel','Mine de nickel','Alliages avancés pour blindages et moteurs.'],
 ['bauxite','Bauxite','Carrière de bauxite','Aluminium destiné à la future aviation.']
].map(([id,name,site,desc],i)=>({id,name,site,desc,tier:i,previous:i?['coal','cotton','wood','copper','gunpowder','iron','rubber','shale','oil','manganese','nickel'][i-1]:null,rate:.4*RESOURCE_RATE_GROWTH**i,cost:i?100*5**(i-1):90,icon:'◆'}));
export const TECHS=[
 {id:'steam',name:'Machines à vapeur',desc:'Récolte de toutes les ressources + 20 %.',cost:240,time:30,requires:[],x:404,y:274,w:275,h:111},
 {id:'assembly',name:'Chaîne de montage',desc:'Production 25 % plus rapide. Débloque les camions.',cost:450,time:50,requires:['steam'],x:398,y:485,w:285,h:111},
 {id:'alloys',name:'Alliages avancés',desc:'Débloque les blindés.',cost:650,time:75,requires:['steam'],x:753,y:485,w:277,h:109},
 {id:'chemistry',name:'Chimie industrielle',desc:'Prépare les procédés chimiques et les brevets industriels.',cost:400,time:45,requires:['steam'],x:752,y:273,w:278,h:113},
 {id:'series',name:'Production en série',desc:'Prix de vente de tous les équipements + 25 %.',cost:1300,time:100,requires:['assembly','alloys'],x:402,y:700,w:274,h:109},
 {id:'logistics',name:'Transport motorisé',desc:'Récolte + 25 %. Capacité des stocks doublée.',cost:1000,time:90,requires:['assembly','chemistry'],x:752,y:699,w:277,h:111}
];
export const PRODUCTS=[
 {id:'rifle',kind:'Armement individuel',recipe:{wood:8,iron:12,coal:5},time:12,value:55,unlock:null},
 {id:'truck',kind:'Logistique',recipe:{iron:40,wood:15,rubber:12,coal:20},time:30,value:240,unlock:'assembly'},
 {id:'tank',kind:'Blindés',recipe:{iron:100,coal:60,rubber:25,nickel:8},time:60,value:680,unlock:'alloys'}
];
export const PATENTS=[
 {id:'steam',name:'Moteur à vapeur',cost:250,income:0.3},
 {id:'assembly',name:'Procédé d’assemblage',cost:500,income:0.6},
 {id:'alloys',name:'Acier allié',cost:650,income:0.9},
 {id:'chemistry',name:'Vulcanisation',cost:450,income:0.5},
 {id:'series',name:'Pièces standardisées',cost:1000,income:1.5},
 {id:'logistics',name:'Transmission mécanique',cost:900,income:1.2}
];
export function newGame(country,now=Date.now()){
 if(!COUNTRIES[country])throw Error('Pays invalide');
 return {version:3,country,credits:0,resources:Object.fromEntries(RESOURCES.map(r=>[r.id,0])),levels:Object.fromEntries(RESOURCES.map(r=>[r.id,r.id==='coal'?1:0])),workers:Object.fromEntries(RESOURCES.map(r=>[r.id,[]])),tech:[],research:null,patents:[],lines:PRODUCTS.map(p=>({id:p.id,enabled:false,remaining:0,stock:0,made:0})),totalSold:0,lastSaved:now,elapsed:0};
}
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
 s.credits+=PATENTS.filter(p=>s.patents.includes(p.id)).reduce((a,p)=>a+p.income,0)*dt;
 if(s.research){s.research.remaining-=dt;if(s.research.remaining<=0){s.tech.push(s.research.id);s.research=null;}}
 for(const line of s.lines){const p=PRODUCTS.find(x=>x.id===line.id);if(!line.enabled||(p.unlock&&!s.tech.includes(p.unlock)))continue;
 if(line.remaining<=0){if(line.stock>=9999||!affordable(s,p.recipe))continue;for(const [k,v]of Object.entries(p.recipe))s.resources[k]-=v;line.remaining=productTime(s,p);}
 line.remaining-=dt;if(line.remaining<=1e-8){line.remaining=0;line.stock++;line.made++;}
 }
 }return s;
}
export function act(s,type,id){
 if(type==='harvest'){const r=RESOURCES.find(r=>r.id===id);if(!r||!unlocked(s,r)||s.resources[id]>=capacity(s,r))return false;s.resources[id]=Math.min(capacity(s,r),s.resources[id]+1);return true;}
 if(type==='upgrade'){const r=RESOURCES.find(r=>r.id===id);if(!r||!available(s,r)||s.levels[id]>=100||s.credits<upgradeCost(s,r))return false;s.credits-=upgradeCost(s,r);s.levels[id]++;return true;}
 if(type==='hire'){const r=RESOURCES.find(r=>r.id===id);if(!r||!unlocked(s,r)||s.workers[id].length>=100||s.credits<hireCost(s,r)+WAGE)return false;s.credits-=hireCost(s,r)+WAGE;s.workers[id].push(PAY_PERIOD);return true;}
 if(type==='dismiss'){const r=RESOURCES.find(r=>r.id===id);if(!r||!s.workers[id].length)return false;s.workers[id].pop();return true;}
 if(['sell-resource','sell-ten','sell-all'].includes(type)){const r=RESOURCES.find(r=>r.id===id);if(!r)return false;const amount=type==='sell-all'?Math.floor(s.resources[id]):type==='sell-ten'?10:1;if(amount<=0||s.resources[id]<amount)return false;s.resources[id]-=amount;s.credits+=amount*MARKET_PRICES[id];return true;}
 if(type==='research'){const t=TECHS.find(t=>t.id===id);if(!t||s.research||s.tech.includes(id)||!t.requires.every(k=>s.tech.includes(k))||s.credits<t.cost)return false;s.credits-=t.cost;s.research={id,remaining:researchTime(s,t)};return true;}
 if(type==='patent'){const p=PATENTS.find(p=>p.id===id);if(!p||!s.tech.includes(id)||s.patents.includes(id)||s.credits<p.cost)return false;s.credits-=p.cost;s.patents.push(id);return true;}
 if(type==='toggle'){const l=s.lines.find(l=>l.id===id),p=PRODUCTS.find(p=>p.id===id);if(!l||(p.unlock&&!s.tech.includes(p.unlock)))return false;l.enabled=!l.enabled;return true;}
 if(type==='sell'){const l=s.lines.find(l=>l.id===id),p=PRODUCTS.find(p=>p.id===id);if(!l||!l.stock)return false;s.credits+=l.stock*salePrice(s,p);s.totalSold+=l.stock;l.stock=0;return true;}
 return false;
}
export function validateSave(raw){
 const s=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);
 const finite=(n,max=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
 const unique=a=>new Set(a).size===a.length;
 if(!s||![1,2,3].includes(s.version)||!COUNTRIES[s.country]||!finite(s.credits)||!finite(s.elapsed)||!finite(s.totalSold)||!finite(s.lastSaved,Date.now()+60000))throw Error('Sauvegarde invalide');
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
 for(const key of ['tech','patents'])if(!Array.isArray(s[key])||!unique(s[key])||s[key].some(id=>!TECHS.some(t=>t.id===id)))throw Error('Technologies invalides');
 if(s.tech.some(id=>!TECHS.find(t=>t.id===id).requires.every(k=>s.tech.includes(k)))||s.patents.some(id=>!s.tech.includes(id)))throw Error('Progression incohérente');
 if(s.research&&(!TECHS.some(t=>t.id===s.research.id)||s.tech.includes(s.research.id)||!finite(s.research.remaining,200)||!TECHS.find(t=>t.id===s.research.id).requires.every(k=>s.tech.includes(k))))throw Error('Recherche invalide');
 if(!Array.isArray(s.lines)||s.lines.length!==3||!unique(s.lines.map(l=>l.id)))throw Error('Lignes invalides');
 for(const l of s.lines)if(!PRODUCTS.some(p=>p.id===l.id)||typeof l.enabled!=='boolean'||!finite(l.remaining,120)||!Number.isInteger(l.stock)||!finite(l.stock,9999)||!Number.isInteger(l.made)||!finite(l.made))throw Error('Production invalide');
 for(const r of RESOURCES){const crew=s.workers?.[r.id];if(!Array.isArray(crew)||crew.length>100||crew.some(t=>!finite(t,PAY_PERIOD))||(crew.length&&!unlocked(s,r)))throw Error('Ouvriers invalides');}
 return s;
}
