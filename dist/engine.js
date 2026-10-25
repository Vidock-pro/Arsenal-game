/** Arsenal: deterministic, browser-independent game rules. No dependencies. */
export const COUNTRIES={
 fr:{name:'France',motto:'L’ingéniosité au service de l’industrie',bonus:'Recherche 20 % plus rapide',icon:'FR',units:['Fusil MAS 36','Camion de ravitaillement','Char B1 bis']},
 de:{name:'Allemagne',motto:'La précision des ateliers',bonus:'Production 15 % plus rapide',icon:'DE',units:['Fusil Karabiner 98k','Camion de ravitaillement','Panzer IV']},
 su:{name:'URSS',motto:'La force des grands complexes',bonus:'Récolte de ressources + 20 %',icon:'SU',units:['Fusil Mosin-Nagant','Camion de ravitaillement','Char T-34']}
};
export const RESOURCES=[
 {id:'coal',name:'Charbon',site:'Mine de Saintes',desc:'Le combustible de vos ateliers.',rate:0.4,cost:90,icon:'◆',x:296,y:214,w:309,h:237},
 {id:'wood',name:'Bois',site:'Exploitation forestière',desc:'Des charpentes aux caisses de transport.',rate:0.55,cost:80,icon:'▰',x:633,y:214,w:301,h:237},
 {id:'iron',name:'Minerai de fer',site:'Carrière industrielle',desc:'La matière première de votre arsenal.',rate:0.35,cost:110,icon:'⬡',x:966,y:214,w:301,h:237},
 {id:'platinum',name:'Platine',site:'Gisement profond',desc:'Un métal rare pour les techniques avancées.',rate:0.08,cost:260,tech:'alloys',icon:'◇',x:298,y:631,w:306,h:229},
 {id:'rubber',name:'Caoutchouc',site:'Concession d’hévéas',desc:'Indispensable à la production de véhicules.',rate:0.2,cost:180,tech:'chemistry',icon:'◉',x:634,y:632,w:300,h:228}
];
export const TECHS=[
 {id:'steam',name:'Machines à vapeur',desc:'Récolte de toutes les ressources + 20 %.',cost:240,time:30,requires:[],x:404,y:274,w:275,h:111},
 {id:'assembly',name:'Chaîne de montage',desc:'Production 25 % plus rapide. Débloque les camions.',cost:450,time:50,requires:['steam'],x:398,y:485,w:285,h:111},
 {id:'alloys',name:'Alliages avancés',desc:'Débloque le platine et les blindés.',cost:650,time:75,requires:['steam'],x:753,y:485,w:277,h:109},
 {id:'chemistry',name:'Chimie industrielle',desc:'Débloque l’exploitation du caoutchouc.',cost:400,time:45,requires:['steam'],x:752,y:273,w:278,h:113},
 {id:'series',name:'Production en série',desc:'Prix de vente de tous les équipements + 25 %.',cost:1300,time:100,requires:['assembly','alloys'],x:402,y:700,w:274,h:109},
 {id:'logistics',name:'Transport motorisé',desc:'Récolte + 25 %. Capacité des stocks doublée.',cost:1000,time:90,requires:['assembly','chemistry'],x:752,y:699,w:277,h:111}
];
export const PRODUCTS=[
 {id:'rifle',kind:'Armement individuel',recipe:{wood:8,iron:12,coal:5},time:12,value:55,unlock:null},
 {id:'truck',kind:'Logistique',recipe:{iron:40,wood:15,rubber:12,coal:20},time:30,value:240,unlock:'assembly'},
 {id:'tank',kind:'Blindés',recipe:{iron:100,coal:60,rubber:25,platinum:8},time:60,value:680,unlock:'alloys'}
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
 return {version:1,country,credits:700,resources:{coal:70,wood:100,iron:90,platinum:0,rubber:0},levels:{coal:1,wood:1,iron:1,platinum:0,rubber:0},tech:[],research:null,patents:[],lines:PRODUCTS.map(p=>({id:p.id,enabled:false,remaining:0,stock:0,made:0})),totalSold:0,lastSaved:now,elapsed:0};
}
export const capacity=s=>s.tech.includes('logistics')?10000:5000;
export const unlocked=(s,r)=>!r.tech||s.tech.includes(r.tech);
export const rate=(s,r)=>unlocked(s,r)?r.rate*s.levels[r.id]*(s.country==='su'?1.2:1)*(s.tech.includes('steam')?1.2:1)*(s.tech.includes('logistics')?1.25:1):0;
export const upgradeCost=(s,r)=>Math.floor(r.cost*1.65**s.levels[r.id]);
export const researchTime=(s,t)=>t.time/(s.country==='fr'?1.2:1);
export const productTime=(s,p)=>p.time/(s.country==='de'?1.15:1)/(s.tech.includes('assembly')?1.25:1);
export const salePrice=(s,p)=>Math.floor(p.value*(s.tech.includes('series')?1.25:1));
export const affordable=(s,cost)=>Object.entries(cost).every(([k,v])=>s.resources[k]>=v);
export function advance(s,seconds){
 let left=Math.max(0,Math.min(28800,Number(seconds)||0));
 while(left>1e-8){const dt=Math.min(1,left);left-=dt;s.elapsed+=dt;
 for(const r of RESOURCES)s.resources[r.id]=Math.min(capacity(s),s.resources[r.id]+rate(s,r)*dt);
 s.credits+=PATENTS.filter(p=>s.patents.includes(p.id)).reduce((a,p)=>a+p.income,0)*dt;
 if(s.research){s.research.remaining-=dt;if(s.research.remaining<=0){s.tech.push(s.research.id);s.research=null;}}
 for(const line of s.lines){const p=PRODUCTS.find(x=>x.id===line.id);if(!line.enabled||(p.unlock&&!s.tech.includes(p.unlock)))continue;
 if(line.remaining<=0){if(line.stock>=9999||!affordable(s,p.recipe))continue;for(const [k,v]of Object.entries(p.recipe))s.resources[k]-=v;line.remaining=productTime(s,p);}
 line.remaining-=dt;if(line.remaining<=1e-8){line.remaining=0;line.stock++;line.made++;}
 }
 }return s;
}
export function act(s,type,id){
 if(type==='harvest'){const r=RESOURCES.find(r=>r.id===id);if(!r||!unlocked(s,r))return false;s.resources[id]=Math.min(capacity(s),s.resources[id]+5);return true;}
 if(type==='upgrade'){const r=RESOURCES.find(r=>r.id===id);if(!r||!unlocked(s,r)||s.credits<upgradeCost(s,r))return false;s.credits-=upgradeCost(s,r);s.levels[id]++;return true;}
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
 if(!s||s.version!==1||!COUNTRIES[s.country]||!finite(s.credits)||!finite(s.elapsed)||!finite(s.totalSold)||!finite(s.lastSaved,Date.now()+60000))throw Error('Sauvegarde invalide');
 for(const r of RESOURCES)if(!finite(s.resources?.[r.id],10000)||!Number.isInteger(s.levels?.[r.id])||s.levels[r.id]<0||s.levels[r.id]>100)throw Error('Ressources invalides');
 for(const key of ['tech','patents'])if(!Array.isArray(s[key])||!unique(s[key])||s[key].some(id=>!TECHS.some(t=>t.id===id)))throw Error('Technologies invalides');
 if(s.tech.some(id=>!TECHS.find(t=>t.id===id).requires.every(k=>s.tech.includes(k)))||s.patents.some(id=>!s.tech.includes(id)))throw Error('Progression incohérente');
 if(s.research&&(!TECHS.some(t=>t.id===s.research.id)||s.tech.includes(s.research.id)||!finite(s.research.remaining,200)||!TECHS.find(t=>t.id===s.research.id).requires.every(k=>s.tech.includes(k))))throw Error('Recherche invalide');
 if(!Array.isArray(s.lines)||s.lines.length!==3||!unique(s.lines.map(l=>l.id)))throw Error('Lignes invalides');
 for(const l of s.lines)if(!PRODUCTS.some(p=>p.id===l.id)||typeof l.enabled!=='boolean'||!finite(l.remaining,120)||!Number.isInteger(l.stock)||!finite(l.stock,9999)||!Number.isInteger(l.made)||!finite(l.made))throw Error('Production invalide');
 return s;
}
