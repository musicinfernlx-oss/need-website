(()=>{
'use strict';
const $=id=>document.getElementById(id);
const catalog={
 tech:{title:'Tech & electronics',tag:'Find your perfect setup',intro:'Pick what matters most. NEED will suggest useful directions and help you create a precise request.',groups:[
  {id:'laptop',name:'Laptops',icon:'💻',q:'What will you mainly do?',options:['Work & everyday','Gaming','Creative production','Study'],items:[
   {name:'Everyday ultrabook',type:'Light & portable',desc:'For everyday work, study and travel. Prioritize long battery life and a comfortable keyboard.',features:['Battery','Weight','Display'],tags:['Work & everyday','Study'],budget:'€700–1,400'},
   {name:'High-performance gaming laptop',type:'Performance focused',desc:'For demanding games. Prioritize GPU, cooling, high-refresh screen and upgrade options.',features:['Graphics','Cooling','High-refresh screen'],tags:['Gaming'],budget:'€1,200–2,500+'},
   {name:'Creative workstation laptop',type:'For creators',desc:'For video editing, 3D, design and music. Prioritize RAM, CPU, display accuracy and storage.',features:['RAM','CPU','Color display'],tags:['Creative production'],budget:'€1,400–3,000+'}
  ]},
  {id:'phone',name:'Smartphones',icon:'📱',q:'What matters most?',options:['Camera','Battery','Performance','Value'],items:[
   {name:'Camera-first phone',type:'Photo & video',desc:'Compare main camera, optical zoom, stabilization and video quality.',features:['Camera','Video','Zoom'],tags:['Camera'],budget:'€500–1,300'},
   {name:'All-day battery phone',type:'Practical',desc:'Prioritize battery capacity, charging, screen efficiency and software support.',features:['Battery','Charging','Updates'],tags:['Battery','Value'],budget:'€300–900'},
   {name:'Flagship performance phone',type:'Power user',desc:'Look for strong chip performance, smooth display and long software support.',features:['Chip','Display','Updates'],tags:['Performance'],budget:'€700–1,500'}
  ]},
  {id:'audio',name:'Audio & headphones',icon:'🎧',q:'Where will you use them?',options:['Commuting','Studio & music','Gaming','Sports'],items:[
   {name:'Noise-cancelling headphones',type:'Travel & focus',desc:'Prioritize comfortable fit, active noise cancellation, transparency mode and battery.',features:['Noise cancellation','Comfort','Battery'],tags:['Commuting'],budget:'€120–450'},
   {name:'Studio monitoring headphones',type:'Music production',desc:'Prioritize neutral sound, comfortable long sessions and wired monitoring.',features:['Neutral sound','Wired','Comfort'],tags:['Studio & music'],budget:'€90–400'},
   {name:'Low-latency gaming headset',type:'Immersive audio',desc:'Prioritize microphone quality, low latency and headset weight.',features:['Low latency','Microphone','Comfort'],tags:['Gaming'],budget:'€70–300'},
   {name:'Secure-fit sport earbuds',type:'Active lifestyle',desc:'Look for water resistance, stable fit and clear outdoor controls.',features:['Fit','Water resistance','Controls'],tags:['Sports'],budget:'€60–260'}
  ]}
 ]},
 home:{title:'Home & services',tag:'Turn a plan into a clear project',intro:'Explore typical projects, then create a request with practical details that help professionals understand the job.',groups:[
  {id:'reno',name:'Renovation',icon:'🏠',q:'What is your main priority?',options:['Modern look','Low maintenance','Budget control','Fast completion'],items:[
   {name:'Bathroom renovation',type:'Renovation project',desc:'Include room size, demolition, waterproofing, tiling, fixtures and project location.',features:['Size','Materials','Location'],tags:['Modern look','Low maintenance'],budget:'Quote required'},
   {name:'Kitchen update',type:'Interior project',desc:'Specify cabinetry, worktops, appliances, electrical work and installation schedule.',features:['Cabinets','Appliances','Timeline'],tags:['Modern look','Budget control'],budget:'Quote required'},
   {name:'Full interior refresh',type:'Painting & surfaces',desc:'Describe rooms, surface conditions, preferred finish and whether the property is occupied.',features:['Rooms','Surfaces','Schedule'],tags:['Budget control','Fast completion'],budget:'Quote required'}
  ]},
  {id:'repairs',name:'Repairs & maintenance',icon:'🛠️',q:'What kind of help?',options:['Painting','Roof maintenance','Plumbing','Electrical'],items:[
   {name:'Interior or exterior painting',type:'Painting service',desc:'Include surface area, existing coating, condition, access and preferred colors.',features:['Area','Condition','Color'],tags:['Painting'],budget:'Quote required'},
   {name:'Roof wash or coating',type:'Property maintenance',desc:'State roof material, approximate size, slope, access and condition.',features:['Roof type','Area','Access'],tags:['Roof maintenance'],budget:'Quote required'},
   {name:'Qualified home repair professional',type:'Professional service',desc:'Explain the fault and any urgency. Select a suitably licensed professional where required.',features:['Problem','Urgency','Location'],tags:['Plumbing','Electrical'],budget:'Quote required'}
  ]}
 ]},
 style:{title:'Mobility & style',tag:'Find a better fit',intro:'Choose a category and NEED will show you what to compare before requesting an offer.',groups:[
  {id:'bikes',name:'Bikes & mobility',icon:'🚲',q:'How will you use it?',options:['City commuting','Long journeys','Off-road','Everyday value'],items:[
   {name:'Commuter e-bike',type:'City mobility',desc:'Look at range, frame size, weight, motor support and theft protection.',features:['Range','Weight','Fit'],tags:['City commuting'],budget:'€1,200–3,500'},
   {name:'Touring bicycle',type:'Distance riding',desc:'Compare riding position, luggage mounts, gearing and maintenance needs.',features:['Comfort','Gears','Luggage'],tags:['Long journeys'],budget:'€700–2,500'},
   {name:'Trail mountain bike',type:'Adventure',desc:'Compare suspension, brakes, tire grip and terrain suitability.',features:['Suspension','Brakes','Terrain'],tags:['Off-road'],budget:'€800–3,000+'}
  ]},
  {id:'fashion',name:'Style & accessories',icon:'👟',q:'What matters most?',options:['Everyday comfort','Premium materials','Sport performance','Value'],items:[
   {name:'Everyday lifestyle sneakers',type:'Footwear',desc:'Prioritize correct fit, sole comfort and durable materials.',features:['Fit','Cushioning','Durability'],tags:['Everyday comfort','Value'],budget:'€60–220'},
   {name:'Premium wardrobe essential',type:'Style',desc:'Think material quality, versatile colors, sizing and long-term wear.',features:['Material','Fit','Versatility'],tags:['Premium materials'],budget:'€100–500'},
   {name:'Performance training shoes',type:'Active wear',desc:'Compare fit, support and suitability for the intended activity.',features:['Support','Grip','Fit'],tags:['Sport performance'],budget:'€80–250'}
  ]}
 ]},
 travel:{title:'Travel & experiences',tag:'Tell us your dream trip',intro:'Discover different travel directions and turn your plans into a clear holiday request.',groups:[
  {id:'trips',name:'Trips & holidays',icon:'✈️',q:'What kind of trip?',options:['Relaxing escape','City discovery','Adventure','Family-friendly'],items:[
   {name:'Relaxing beach getaway',type:'Resort holiday',desc:'Specify destination flexibility, travel dates, departure airport, accommodation and total budget.',features:['Dates','Departure','Hotel'],tags:['Relaxing escape'],budget:'Custom budget'},
   {name:'Curated city break',type:'Short trip',desc:'Describe cities you like, desired pace, cultural interests and hotel standard.',features:['City','Experiences','Stay'],tags:['City discovery'],budget:'Custom budget'},
   {name:'Active adventure itinerary',type:'Experience-led trip',desc:'Include activity difficulty, season, safety needs and local transportation.',features:['Activity','Season','Transfers'],tags:['Adventure'],budget:'Custom budget'},
   {name:'Family holiday package',type:'Family travel',desc:'Mention group size, children’s ages, travel dates and accessibility needs.',features:['Travelers','Dates','Facilities'],tags:['Family-friendly'],budget:'Custom budget'}
  ]}
 ]}
};
const panel=$('v11Panel'),openBusiness=$('v11Business'),businessBtn=$('v11BusinessBtn');
let state={category:'tech',group:'laptop',priority:'Work & everyday',query:''};
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let showAlternatives=false;
function scoredItems(){
 const g=group();
 return g.items.map((item,index)=>({item,index,score:item.tags.includes(state.priority)?2:0}))
 .sort((a,b)=>b.score-a.score||a.index-b.index);
}
function itemList(){return scoredItems().map(x=>x.item)}
function showCategory(id){
 if(!catalog[id])return;
 state.category=id;state.group=catalog[id].groups[0].id;state.priority=catalog[id].groups[0].options[0];state.query='';
 showAlternatives=false;
 render();panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'start'});
 document.querySelectorAll('.category-card').forEach(c=>c.classList.toggle('v11-selected',c.dataset.category===id));
}
function group(){return catalog[state.category].groups.find(g=>g.id===state.group)}
function render(){
 const c=catalog[state.category],g=group();
 const ranked=scoredItems(),matched=ranked.filter(x=>x.score>0),best=ranked[0];
 $('v11CategoryLabel').textContent=c.title;
 $('v11Title').textContent=c.tag;
 $('v11Intro').textContent=c.intro;
 $('v11CategoryNav').innerHTML=Object.entries(catalog).map(([id,cat])=>'<button type="button" class="v11-tab '+(state.category===id?'active':'')+'" data-v11-category="'+id+'" aria-pressed="'+(state.category===id)+'">'+safe(cat.title)+'</button>').join('');
 $('v11Subtypes').innerHTML=c.groups.map(x=>'<button type="button" class="v11-type '+(x.id===state.group?'active':'')+'" data-v11-group="'+x.id+'" aria-pressed="'+(x.id===state.group)+'">'+safe(x.name)+'</button>').join('');
 $('v11Question').textContent=g.q;
 $('v11Priorities').innerHTML=g.options.map(x=>'<button type="button" class="v11-priority '+(x===state.priority?'active':'')+'" data-v11-priority="'+safe(x)+'" aria-pressed="'+(x===state.priority)+'">'+safe(x)+'</button>').join('');
 const ordered=ranked.map(x=>x.item);
 const visible=showAlternatives?ordered:ordered.slice(0,1);
 $('v11SuggestionCount').textContent=matched.length?'Recommended for '+state.priority:'Explore your options';
 $('v11Suggestions').innerHTML=visible.map((it,i)=>{
 const isTop=i===0;
 return '<article class="v11-suggestion '+(isTop?'v11-best':'')+'"><div class="v11-sug-top"><div class="v11-icon" aria-hidden="true">'+(state.category==='tech'?'T':state.category==='home'?'H':state.category==='style'?'M':'E')+'</div><div><span class="v11-small">'+(isTop?'✦ BEST STARTING POINT':'ALTERNATIVE')+' · '+safe(it.type)+'</span><h3>'+safe(it.name)+'</h3></div></div><p>'+safe(it.desc)+'</p><div class="v11-feature-row">'+it.features.map(t=>'<span>'+safe(t)+'</span>').join('')+'</div><div class="v11-sug-bottom"><span class="v11-budget">'+safe(it.budget)+' <small>guide only</small></span><button type="button" class="v11-sug-btn" data-v11-choose="'+i+'">Request this ↗</button></div></article>';
 }).join('');
 const alternatives=$('v11Alternatives');
 if(alternatives){
  alternatives.hidden=ranked.length<2;
  alternatives.textContent=showAlternatives?'Show only recommended ↑':'See '+(ranked.length-1)+' other '+(ranked.length-1===1?'option':'options')+' ↓';
  alternatives.setAttribute('aria-expanded',String(showAlternatives));
 }
}
function startNeed(it){
 const c=catalog[state.category],g=group();
 const location=state.category==='home'?'Location: to be specified. ':'';
 const description='I am looking for '+it.name.toLowerCase()+'. '+it.desc+' My main priority is '+state.priority+'. '+location+'Please suggest options that suit my needs.';
 $('needText').value=description;
 // The existing NEED V10 wizard handles saving to local drafts or Supabase.
 $('createNeedBtn').click();
 const form=$('v8Dialog');
 if(form?.classList.contains('open')){
  const cat=$('v8Category');if(cat)cat.value=c.title;
  const budget=$('v8Budget');if(budget&&it.budget.includes('€'))budget.placeholder=it.budget+' (example range, not a quote)';
 }
 panel.hidden=true;
}
function suggestFromText(){
 const text=$('needText').value.toLowerCase().trim();
 if(!text){$('needText').focus();$('needText').placeholder='Describe your idea first, then tap Suggest options…';return;}
 let cat='tech',groupId='laptop',priority='Work & everyday';
 if(/renovat|remont|bathroom|kitchen|house|roof|paint|plumb|electrical|clean/.test(text)){cat='home';groupId=/roof|paint|plumb|electrical|repair|clean/.test(text)?'repairs':'reno';priority=groupId==='repairs'?(/roof/.test(text)?'Roof maintenance':/paint/.test(text)?'Painting':'Plumbing'):'Modern look'}
 else if(/trip|travel|flight|vacation|holiday|hotel|resort|getaway/.test(text)){cat='travel';groupId='trips';priority=/family|kid|children/.test(text)?'Family-friendly':/adventure|hike/.test(text)?'Adventure':'Relaxing escape'}
 else if(/bike|bicycle|scooter|sneaker|shoe|fashion|clothing|style/.test(text)){cat='style';groupId=/shoe|sneaker|fashion|clothing|style/.test(text)?'fashion':'bikes';priority=groupId==='fashion'?'Everyday comfort':'City commuting'}
 else if(/headphon|audio|speaker|music|studio|headset|earbud/.test(text)){cat='tech';groupId='audio';priority=/studio|music|production/.test(text)?'Studio & music':/gaming|game/.test(text)?'Gaming':'Commuting'}
 else if(/phone|smartphone|mobile|iphone|android/.test(text)){cat='tech';groupId='phone';priority=/photo|camera|video/.test(text)?'Camera':/battery/.test(text)?'Battery':'Performance'}
 else if(/gaming|game|gpu|graphics/.test(text)){cat='tech';groupId='laptop';priority='Gaming'}
 else if(/edit|design|music|render|production/.test(text)){cat='tech';groupId='laptop';priority='Creative production'}
 showCategory(cat);state.group=groupId;state.priority=priority;showAlternatives=false;render();
}
$('v11SuggestBtn')?.addEventListener('click',suggestFromText);
function genericNeed(){
 const c=catalog[state.category],g=group();
 $('needText').value='I need help finding '+g.name.toLowerCase()+'. My priority: '+state.priority+'. Please suggest relevant options.';
 $('createNeedBtn').click();
 const cat=$('v8Category');if(cat)cat.value=c.title;
 panel.hidden=true;
}
document.querySelectorAll('.category-card').forEach((card,i)=>{
 const id=['tech','home','style','travel'][i];card.dataset.category=id;
 const media=card.querySelector('.category-media');
 if(media){media.setAttribute('role','button');media.setAttribute('tabindex','0');media.setAttribute('aria-label','Explore '+catalog[id].title);
 media.addEventListener('click',()=>showCategory(id));
 media.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCategory(id)}})}
 const title=card.querySelector('h3');if(title)title.addEventListener('click',()=>showCategory(id));
 const action=card.querySelector('.cat-action');if(action){action.textContent='Explore & get ideas ↗';action.addEventListener('click',e=>{e.stopImmediatePropagation();showCategory(id)},true)}
});
panel.addEventListener('click',e=>{
 const cat=e.target.closest('[data-v11-category]');
 const grp=e.target.closest('[data-v11-group]');
 const pri=e.target.closest('[data-v11-priority]');
 const chosen=e.target.closest('[data-v11-choose]');
 if(cat)showCategory(cat.dataset.v11Category);
 if(grp){state.group=grp.dataset.v11Group;state.priority=group().options[0];showAlternatives=false;render()}
 if(pri){state.priority=pri.dataset.v11Priority;showAlternatives=false;render();}
 if(chosen){const it=itemList()[Number(chosen.dataset.v11Choose)];if(it)startNeed(it)}
});
$('v11Alternatives').addEventListener('click',()=>{showAlternatives=!showAlternatives;render()});
$('v11GenericNeed').addEventListener('click',genericNeed);
$('v11Close').addEventListener('click',()=>{panel.hidden=true;document.querySelectorAll('.category-card').forEach(c=>c.classList.remove('v11-selected'))});
function businessOpen(){openBusiness.hidden=false;document.body.style.overflow='hidden'}
function businessClose(){openBusiness.hidden=true;document.body.style.overflow=''}
if(businessBtn)businessBtn.addEventListener('click',businessOpen);
$('v11BusinessClose').addEventListener('click',businessClose);
openBusiness.addEventListener('click',e=>{if(e.target===openBusiness)businessClose()});
$('v11BusinessAccount').addEventListener('click',()=>{businessClose();document.getElementById('my-needs').scrollIntoView({behavior:'smooth'});$('v10AccountButton').click()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!openBusiness.hidden)businessClose()});
document.querySelectorAll('.idea').forEach((el,i)=>{
 const ids=['home','tech','travel'];el.classList.add('v11-clickable');el.setAttribute('tabindex','0');el.setAttribute('role','button');
 el.setAttribute('aria-label','Explore a request in '+catalog[ids[i]].title);
 el.addEventListener('click',()=>showCategory(ids[i]));
 el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCategory(ids[i])}});
});
})();