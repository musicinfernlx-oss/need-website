/* NEED V12 — guided matching and photographic product inspiration. Client-side fallback, optional secure AI. */
(function(){
'use strict';
const PRODUCT_IMAGES={
 laptop:['photo-1496181133206-80ce9b88a853','photo-1517336714731-489689fd1ca8','photo-1531297484001-80022131f5a1'],
 phone:['photo-1511707171634-5f897ff02aa9','photo-1592750475338-74b7b21085ab','photo-1512499617640-c74ae3a79d37'],
 audio:['photo-1505740420928-5e560c06d30e','photo-1546435770-a3e426bf472b','photo-1484704849700-f032a568e944'],
 reno:['photo-1600607687920-4e2a09cf159d','photo-1600585154340-be6161a56a0c','photo-1600607687939-ce8a6c25118c'],
 repairs:['photo-1504307651254-35680f356dfd','photo-1600585152915-d208bec867a1','photo-1530124566582-a618bc2615dc'],
 bikes:['photo-1571068316344-75bc76f77890','photo-1558618666-fcd25c85cd64','photo-1485965120184-e220f721d03e'],
 fashion:['photo-1542291026-7eec264c27ff','photo-1525966222134-fcfa99b8ae77','photo-1600185365483-26d7a4cc7519'],
 trips:['photo-1476514525535-07fb3b4ae5f1','photo-1488646953014-85cb44e25828','photo-1500534623283-312aade485b7']
};
const RULES=[
 {id:'home',group:'repairs',priority:'Roof maintenance',weights:[['katto',8],['roof',8],['roofing',7],['tile roof',9],['tiilikatto',9]]},
 {id:'home',group:'repairs',priority:'Painting',weights:[['maalaus',9],['maala',7],['painting',9],['painter',7],['paint my',7]]},
 {id:'home',group:'repairs',priority:'Plumbing',weights:[['plumbing',8],['putki',8],['vesivahinko',7],['water leak',8]]},
 {id:'home',group:'reno',priority:'Modern look',weights:[['renovation',7],['remont',8],['bathroom',8],['kylpyhuone',9],['keittiö',8],['kitchen',7],['interior',6],['sisustus',7]]},
 {id:'tech',group:'audio',priority:'Studio & music',weights:[['headphone',9],['headset',9],['kuulok',9],['earbud',8],['headphones',9],['speaker',7],['audio',7],['microphone',7]]},
 {id:'tech',group:'phone',priority:'Camera',weights:[['puhelin',9],['iphone',9],['android',9],['smartphone',9],['phone',7]]},
 {id:'style',group:'bikes',priority:'City commuting',weights:[['electric bike',9],['e-bike',9],['sähköpyör',10],['bicycle',8],['polkupyör',9],['bike',7],['pyörä',7]]},
 {id:'style',group:'fashion',priority:'Everyday comfort',weights:[['sneaker',9],['shoe',9],['kenkä',9],['kengät',9],['fashion',7],['vaate',7]]},
 {id:'travel',group:'trips',priority:'Relaxing escape',weights:[['loma',9],['holiday',9],['vacation',9],['travel',8],['matka',8],['flight',8],['hotelli',8],['hotel',8],['trip',7],['resort',8]]},
 {id:'tech',group:'laptop',priority:'Work & everyday',weights:[['laptop',9],['kannettava',9],['tietokone',9],['computer',9],['macbook',9],['notebook',8],['gaming pc',7]]}
];
const priorityRules=[
 {words:['gaming','pelaam','pelikone','peliläppäri','game'],priority:'Gaming'},
 {words:['editing','video edit','3d','render','music production','musiikinteko','tuotanto','creative','design'],priority:'Creative production'},
 {words:['opiskelu','study','school','koulu','student'],priority:'Study'},
 {words:['camera','valokuva','kuvaus','photography'],priority:'Camera'},
 {words:['battery','akku','batter'],priority:'Battery'},
 {words:['mountain','maasto','trail','metsä'],priority:'Off-road'},
 {words:['touring','retki','long distance'],priority:'Long journeys'},
 {words:['family','perhe','lapset','children'],priority:'Family-friendly'},
 {words:['adventure','seikkailu','hike','vaellus'],priority:'Adventure'},
 {words:['city','kaupunki','weekend','viikonloppu'],priority:'City discovery'},
 {words:['budget','edullin','halpa','cheap','affordable'],priority:'Budget control'}
];
const currency=new Intl.NumberFormat('en-IE');
const imgUrl=id=>'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w=780&q=78';
function photoFor(group,index){const options=PRODUCT_IMAGES[group]||PRODUCT_IMAGES.laptop;return imgUrl(options[Math.abs(index)%options.length])}
function analyze(text){
 const raw=String(text||'').trim().slice(0,2000),s=raw.toLocaleLowerCase();
 if(!s)return null;
 let best=null;
 for(const r of RULES){let score=0;for(const [term,weight] of r.weights)if(s.includes(term))score+=weight;if(score>0&&(!best||score>best.score))best={...r,score}}
 if(!best)best={id:'tech',group:'laptop',priority:'Work & everyday',score:0};
 let priority=best.priority;
 for(const rule of priorityRules){
   if(rule.words.some(w=>s.includes(w))){priority=rule.priority;break}
 }
 const nums=Array.from(s.matchAll(/(\d[\d\s,.]{0,9})\s*(€|eur|euro|euros|euroa|\$|usd)/g)).map(x=>Number(x[1].replace(/\s/g,'').replace(',','.'))).filter(n=>Number.isFinite(n)&&n>0);
 const budget=nums.length?Math.round(nums[0]):null;
 const urgency=/urgent|asap|kiire|heti|quickly|mahdollisimman pian/.test(s)?'As soon as possible':/next month|ensi kuussa|kuukauden sisällä/.test(s)?'Within 1 month':'Flexible';
 const features=[];
 const keyFeatures=[['battery','Long battery life'],['akku','Long battery life'],['kevyt','Lightweight'],['lightweight','Lightweight'],['silent','Quiet'],['hiljain','Quiet'],['camera','Camera'],['kuvaus','Camera'],['game','Gaming'],['pelaam','Gaming'],['ram','RAM'],['näyttö','Display'],['screen','Display'],['color','Color'],['väri','Color'],['waterproof','Waterproofing'],['vedenerist','Waterproofing'],['sävy','Finish preferences'],['fast','Quick delivery']];
 for(const [k,v] of keyFeatures)if(s.includes(k)&&!features.includes(v))features.push(v);
 return {text:raw,category:best.id,group:best.group,priority,confidence:best.score>10?'strong':best.score>0?'moderate':'exploratory',budget,urgency,features:features.slice(0,5)};
}
const state={analysis:null,notes:'',lastSource:null};
function setAnalysis(result){state.analysis=result;state.lastSource=result?.text||'';renderInsights()}
function renderInsights(){
 const slot=document.getElementById('v12Insight');if(!slot)return;
 const a=state.analysis;
 if(!a){slot.hidden=true;return}
 slot.hidden=false;
 const names={tech:'Technology',home:'Home & services',style:'Mobility & style',travel:'Travel & experiences'};
 const snippets=[];
 snippets.push('<span class="v12-pill">✦ '+escape(names[a.category])+'</span>');
 if(a.budget)snippets.push('<span class="v12-pill">Budget about €'+escape(currency.format(a.budget))+'</span>');
 if(a.urgency!=='Flexible')snippets.push('<span class="v12-pill">'+escape(a.urgency)+'</span>');
 for(const f of a.features)snippets.push('<span class="v12-pill">'+escape(f)+'</span>');
 slot.innerHTML='<div class="v12-insight-top"><strong>✦ NEED Smart Match</strong><span>On-device guidance</span></div><p>We found a likely direction for your request. Refine the suggestions below or create your own NEED.</p><div class="v12-pills">'+snippets.join('')+'</div><p class="v12-disclaimer">No live inventory or seller prices. Suggestions are illustrative until live product feeds and AI services are connected.</p>';
}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const helper={
 photoFor,analyze,setAnalysis,
 get current(){return state.analysis},
 get intro(){return state.lastSource},
 fallback:(img)=>{
  img.hidden=true;const parent=img.closest('.v12-product-photo');if(parent)parent.classList.add('v12-fallback')
 },
 rank(item,priority,analysis){
   let score=Number((item.tags||[]).includes(priority))*6;
   if(!analysis)return score;
   const text=(item.name+' '+item.desc+' '+(item.features||[]).join(' ')).toLowerCase();
   for(const feat of analysis.features)if(text.includes(feat.toLowerCase().replace('long ','').replace(' preferences','')))score+=2;
   if(analysis.budget){
    const numbers=String(item.budget||'').match(/[\d,]+/g)||[];
    const low=Number((numbers[0]||'0').replace(',',''));
    if(low&&analysis.budget>=low)score+=1;
    if(low&&analysis.budget<low)score-=2;
   }
   return score;
 },
 prepareDraft(name,desc,priority){
   const a=state.analysis;
   if(!a)return 'I am looking for '+name.toLowerCase()+'. '+desc+' My main priority is '+priority+'. Please suggest options that suit my needs.';
   return 'My original request: '+a.text+'\n\nSuggested direction: '+name+'. '+desc+'\n\nMy main priority: '+priority+
      (a.budget?'\nApproximate budget: €'+currency.format(a.budget):'')+
      (a.features.length?'\nImportant features: '+a.features.join(', '):'')+
      (a.urgency!=='Flexible'?'\nTimeline: '+a.urgency:'')+
      '\n\nPlease propose suitable options. This is not a confirmed order.';
 }
};
window.NEED_V12=helper;
window.addEventListener('DOMContentLoaded',()=>{
  const hero=document.getElementById('needText');
  hero?.addEventListener('input',()=>{if(state.analysis&&hero.value.trim()!==state.lastSource){state.analysis=null;renderInsights()}});
  const browse=document.getElementById('v12BrowseButton');
  browse?.addEventListener('click',()=>{
    const text=hero?.value||'';
    if(text.trim().length<6){hero.focus();return}
    const analysis=analyze(text);setAnalysis(analysis);
    window.NEED_GUIDE?.applyAnalysis?.(analysis);
  });
  document.getElementById('v12PhotoError')?.addEventListener('error',()=>{});
});
})();