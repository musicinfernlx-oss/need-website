/* NEED V13 - unified buyer entry point, hybrid product discovery and seller portal */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>{try{const v=new URL(u);return v.protocol==='https:'?v.href:''}catch{return ''}};
const auth=()=>window.NEED_AUTH, client=()=>auth()?.getClient?.(), user=()=>auth()?.getUser?.();
const results=$('v13Results'),grid=$('v13Grid'),msg=$('v13SearchMessage');
let products=[],compared=[],searchId=0,profile=null,activeNeeds=[];
function info(t,error=false){msg.textContent=t;msg.dataset.error=error?'true':''}
function money(v){return v.price==null?'Price not available':new Intl.NumberFormat('en-IE',{style:'currency',currency:v.currency||'EUR'}).format(Number(v.price))}
function external(q){
 const query=encodeURIComponent(q);
 const sources=[
  ['Google Shopping','Search merchants and current offers','https://www.google.com/search?tbm=shop&q='+query],
  ['eBay','Search independent marketplace listings','https://www.ebay.com/sch/i.html?_nkw='+query],
  ['Etsy','Explore handmade and unique finds','https://www.etsy.com/search?q='+query]
 ];
 $('v13External').innerHTML=sources.map(x=>'<a href="'+esc(x[2])+'" rel="noopener noreferrer" target="_blank"><span><strong>'+esc(x[0])+'</strong><small>'+esc(x[1])+'</small></span><b>↗</b></a>').join('');
}
function drawCompare(){
 const pane=$('v13Compare');pane.hidden=!compared.length;
 $('v13CompareCount').textContent=compared.length+'/3 selected';
 $('v13CompareRows').innerHTML=compared.map(x=>'<div class="v13-compare-row"><b>'+esc(x.title)+'</b><span>'+esc(money(x))+'</span><button type="button" data-remove="'+esc(x.id)+'" aria-label="Remove option">×</button></div>').join('');
}
function draw(){
 grid.innerHTML=products.length?products.map(p=>{
  const image=safe(p.image),url=safe(p.url),active=compared.some(x=>x.id===p.id);
  return '<article class="v13-product"><div class="v13-product-photo">'+(image?'<img src="'+esc(image)+'" loading="lazy" alt="'+esc(p.title)+'" onerror="this.style.display=\'none\'">':'<span>✦</span>')+'</div><div class="v13-product-body"><span class="v13-source">'+(p.promoted?'<span class="v13-sponsored">Sponsored · NEED partner</span> ':'')+esc(p.source)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.description||'')+'</p><strong>'+esc(money(p))+'</strong><div class="v13-product-actions"><button type="button" data-compare="'+esc(p.id)+'" aria-pressed="'+active+'">'+(active?'✓ Comparing':'+ Compare')+'</button>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+(p.kind==='merchant'?'Visit store ↗':'View source ↗')+'</a>':'')+'</div></div></article>';
 }).join(''):'<p class="v13-empty">No matching products in the connected catalogs yet. You can search other stores using the links below.</p>';
 drawCompare();
}
async function books(q,signal){
 const endpoint='https://openlibrary.org/search.json?'+new URLSearchParams({q,fields:'key,title,author_name,first_publish_year,cover_i',limit:'9'});
 const res=await fetch(endpoint,{signal});if(!res.ok)throw Error('Open Library unavailable');
 const data=await res.json();
 return(data.docs||[]).filter(d=>/^\/works\/OL\w+W$/.test(d.key||'')&&d.title).slice(0,9).map(d=>({id:'book-'+d.key,kind:'book',title:d.title,source:'Open Library · book catalog',description:[(d.author_name||[]).slice(0,2).join(', '),d.first_publish_year].filter(Boolean).join(' · '),image:d.cover_i?'https://covers.openlibrary.org/b/id/'+Number(d.cover_i)+'-M.jpg':'',url:'https://openlibrary.org'+d.key,price:null}));
}
async function food(q,signal){
 const endpoint='https://world.openfoodfacts.org/cgi/search.pl?'+new URLSearchParams({search_terms:q,search_simple:'1',action:'process',json:'1',page_size:'9',fields:'code,product_name,brands,image_front_small_url'});
 const res=await fetch(endpoint,{signal});if(!res.ok)throw Error('Food catalog unavailable');
 const data=await res.json();
 return(data.products||[]).filter(p=>p.code&&p.product_name).slice(0,9).map(p=>({id:'food-'+p.code,kind:'food',title:p.product_name,source:'Open Food Facts · product catalog',description:p.brands||'Community-created product record',image:p.image_front_small_url||'',url:'https://world.openfoodfacts.org/product/'+encodeURIComponent(p.code),price:null}));
}

function simplify(t){return String(t||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9äöå ]/g,' ').replace(/\s+/g,' ').trim()}
const stop=new Set(['i','want','need','the','for','with','from','that','and','my','a','an','to','of','in','is','would','looking','about','around','under','below','over','above','buy','find','haluan','tarvitsen','etsin','joka','ja','tai','minulle','noin','alle','enintaan','maksimi','max','eur','euro','euros','euroa','price','budget','hinta','budjetti','good','best','paras','hyvä','€']);
function parseQuery(text){
 const raw=String(text||'').slice(0,2000),lower=raw.toLocaleLowerCase();
 const priced=[...lower.replace(/€\s*(\d[\d\s,.]{0,9})/g,'$1 €').matchAll(/(?:under|below|max|up to|enint[aä][aä]n|alle|korkeintaan|budget|budjetti|hintakatto)\s*(?:of|on|is|noin|about)?\s*(\d[\d\s,.]{0,9})\s*(?:€|eur|euro)?|(\d[\d\s,.]{0,9})\s*(?:€|eur|euroa)\s*(?:max|maximum|budget|budjetti)?/gi)]
 .map(m=>Number(String(m[1]||m[2]).replace(/[\s,.](?=\d{3}(?:\D|$))/g,'').replace(',','.')))
 .filter(n=>Number.isFinite(n)&&n>0);
 const budget=priced.length?priced[0]:null;
 const a=window.NEED_V12?.analyze(raw);
 const terms=simplify(raw.replace(/\d[\d\s,.]{0,9}\s*(?:€|eur|euroa|euro)/gi,' ')).split(' ').filter(x=>x.length>2&&!stop.has(x)&&!/^[0-9]+$/.test(x)).slice(0,16);
 return {raw,budget,terms,category:a?.category||null,features:a?.features||[]};
}
function relevance(p,criteria){
 const hay=simplify([p.title,p.description,p.category].join(' ')),name=simplify(p.title);
 let score=0,hits=0;
 for(const t of criteria.terms){
  const stem=t.length>5?t.slice(0,-1):t;
  if(hay.includes(t)||hay.includes(stem)){hits++;score+=(name.includes(t)||name.includes(stem))?5:2}
 }
 if(criteria.terms.length&&hits===0)return null;
 if(criteria.terms.length>2&&hits/criteria.terms.length<.2)return null;
 if(criteria.budget!=null && p.price!=null){
  if(p.currency!=='EUR')return null; // no FX guesses in strict price filtering
  if(Number(p.price)>criteria.budget)return null;
  score+=Math.min(5,Math.max(0,5-(criteria.budget-Number(p.price))/(criteria.budget||1)*5));
 }
 if(criteria.budget!=null&&p.price==null)return null; // unknown price must never claim in budget
 for(const feat of criteria.features){
  const t=simplify(feat).split(' ').filter(x=>x.length>3);
  if(t.some(x=>hay.includes(x)))score+=2;
 }
 return score;
}
function sortMatches(rows,criteria){
 return rows.map(p=>({...p,relevance:relevance(p,criteria)})).filter(p=>p.relevance!==null)
 .sort((a,b)=>(Number(b.promoted)-Number(a.promoted))||(b.relevance-a.relevance)||((a.price??Infinity)-(b.price??Infinity))||a.title.localeCompare(b.title));
}
async function merchants(){
 if(!client())return [];
 // seller_profiles are already RLS-filtered to approved merchants, even for anonymous visitors
 const {data,error}=await client().from('merchant_products')
 .select('id,title,summary,category,price,currency,product_url,image_url,seller_id,seller_profiles!inner(business_name,status,subscription_status)')
 .eq('active',true).eq('seller_profiles.status','approved').limit(200);
 if(error)throw Error(error.message);
 return(data||[]).map(p=>({id:'seller-'+p.id,kind:'merchant',title:p.title,source:p.seller_profiles?.business_name||'NEED merchant',description:p.summary,category:p.category,price:p.price,currency:p.currency,image:p.image_url,url:p.product_url,promoted:p.seller_profiles?.subscription_status==='active'}));
}
async function liveProducts(criteria){
 if(!client())return {items:[],status:'not_connected'};
 const text=criteria.terms.slice(0,8).map(t=>({kannettava:'laptop',tietokone:'computer',pelikannettava:'gaming laptop',kuulokkeet:'headphones',puhelin:'smartphone',sähköpyörä:'electric bike'}[t]||t)).join(' ').trim();
 if(text.length<2)return {items:[],status:'no_query'};
 const {data,error}=await client().functions.invoke('product-search',{body:{query:text,maxPrice:criteria.budget}});
 if(error)return {items:[],status:'unavailable'};
 if(!data||!Array.isArray(data.items))return {items:[],status:'unavailable'};
 return {items:data.items.map(p=>({...p,promoted:false,source:p.source||'eBay · live listing'})),status:'live',retrievedAt:data.retrievedAt};
}
async function search(){
 const q=$('needText').value.trim();if(q.length<2){$('needText').focus();return}
 const criteria=parseQuery(q),ticket=++searchId;
 $('v13SearchFor').textContent=q.slice(0,120);
 external(q);products=[];compared=[];draw();results.hidden=false;results.scrollIntoView({behavior:'smooth',block:'start'});
 const budgetNote=criteria.budget!=null?' · Budget ceiling '+new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(criteria.budget):'';
 $('v13Criteria').textContent=(criteria.features.length?'Priorities: '+criteria.features.join(', '):'Relevant matches first')+budgetNote;
 info('Checking available catalogs for matching products…');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const [merch,other,live]=await Promise.allSettled([
   merchants(),
   /\b(book|books|kirja|kirjat|novel|author)\b/i.test(q)?books(q,ctrl.signal):
   /\b(food|grocery|groceries|ruoka|elintarvik|milk|maito|coffee|kahvi)\b/i.test(q)?food(q,ctrl.signal):Promise.resolve([]),
   liveProducts(criteria)
  ]);
  if(ticket!==searchId)return;
  const listed=merch.status==='fulfilled'?sortMatches(merch.value,criteria):[];
  const publicRecords=other.status==='fulfilled'?sortMatches(other.value.map(p=>({...p,category:p.kind==='book'?'Books':'Groceries',promoted:false})),criteria):[];
  const liveData=live.status==='fulfilled'?live.value:{items:[],status:'unavailable'};
  const liveMatches=sortMatches(liveData.items,criteria);
  products=[...listed,...liveMatches,...publicRecords];
  draw();
  const sponsored=listed.filter(p=>p.promoted).length;
  const liveDetail=liveData.status==='live'?' · '+liveMatches.length+' live eBay listing(s)':' · live retail feed not connected';
  info(products.length?products.length+' matching catalog results'+(sponsored?' · '+sponsored+' paid NEED partner result(s) shown first, labeled Sponsored':'')+'.'+liveDetail+' Verify delivery, stock and total cost at seller.':'No suitable catalog matches yet.'+liveDetail+' Search independent stores below or create a NEED for sellers.'+
   (criteria.budget!=null?' We excluded catalog items over your €'+criteria.budget+' limit and entries without verified prices.':''));
  if(merch.status==='rejected'&&client())console.warn('Merchant catalog unavailable:',merch.reason);
 }catch(e){if(ticket!==searchId)return;info('Catalog search unavailable. External shopping links remain available.',true)}
 finally{clearTimeout(timer)}
}
$('v13Find').addEventListener('click',search);

$('v13CloseResults').addEventListener('click',()=>{results.hidden=true});
grid.addEventListener('click',e=>{
 const b=e.target.closest('button[data-compare]');if(!b)return;
 const item=products.find(x=>x.id===b.dataset.compare);if(!item)return;
 if(compared.some(x=>x.id===item.id))compared=compared.filter(x=>x.id!==item.id);
 else if(compared.length<3)compared.push(item);
 else{info('Choose up to three options to compare. Remove one first.',true);return}
 draw();
});
$('v13Compare').addEventListener('click',e=>{const b=e.target.closest('button[data-remove]');if(b){compared=compared.filter(x=>x.id!==b.dataset.remove);draw()}});
$('v13PublishCTA').addEventListener('click',()=>{
 $('my-needs').scrollIntoView({behavior:'smooth',block:'start'});
 $('v13PublishHint').textContent='Open or create a NEED below, then choose Publish to share it with approved sellers once your account is connected.';
});
function decorateCards(items,isSignedIn){
 document.querySelectorAll('#myNeedsList .v8-request').forEach((card,i)=>{
  const d=items[i];if(!d)return;
  const controls=card.querySelector('.v8-actions');if(!controls)return;
  const button=document.createElement('button');
  button.type='button';button.className='v8-btn-lite';
  button.textContent=d.status==='published'?'Unpublish':'Publish to sellers';
  button.addEventListener('click',()=>publish(d));
  controls.prepend(button);
  const offers=document.createElement('button');offers.type='button';offers.className='v8-btn-lite';offers.textContent='View offers';
  offers.addEventListener('click',()=>viewOffers(d));controls.append(offers);
 });
}
async function publish(d){
 if(!client()||!user()){alert('Connect Supabase and sign in before publishing requests. Local drafts are never public.');return}
 if(!/^[0-9a-f-]{36}$/i.test(d.id)){alert('This is a local draft. Create a new NEED while signed in to publish it.');return}
 const next=d.status==='published'?'draft':'published';
 if(next==='published'&&!confirm('Publish this request for approved sellers to see and respond to?'))return;
 const {error}=await client().from('needs').update({status:next}).eq('id',d.id).eq('user_id',user().id);
 if(error){alert('Could not change publication status: '+error.message);return}
 await window.NEED_AUTH?.refreshNeeds?.();
}
async function viewOffers(d){
 const modal=$('v13OffersDialog');modal.hidden=false;document.body.style.overflow='hidden';
 $('v13OffersTitle').textContent=d.description.slice(0,90);
 const list=$('v13OfferList');list.textContent='Loading private offers…';
 if(!client()||!user()||!/^[0-9a-f-]{36}$/i.test(d.id)){list.textContent='No live offers. Connect your account and publish a request to receive offers from approved sellers.';return}
 const {data,error}=await client().from('seller_offers').select('id,title,description,price,currency,product_url,created_at').eq('need_id',d.id).order('created_at',{ascending:false});
 if(error){list.textContent='Could not retrieve offers: '+error.message;return}
 list.innerHTML=(data||[]).length?(data||[]).map(o=>'<article class="v13-offer"><strong>'+esc(o.title)+'</strong><p>'+esc(o.description)+'</p><span>'+esc(money(o))+'</span>'+(safe(o.product_url)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safe(o.product_url))+'">View seller details ↗</a>':'')+'</article>').join(''):'No offers yet. Approved NEED sellers may respond to a published request.';
}
$('v13OffersClose').addEventListener('click',()=>{$('v13OffersDialog').hidden=true;document.body.style.overflow=''});
const sellerModal=$('v13SellerDialog'),sellerStatus=$('v13SellerStatus');
function closeSeller(){sellerModal.hidden=true;document.body.style.overflow=''}
async function openSeller(){
 sellerModal.hidden=false;document.body.style.overflow='hidden';
 if(!client()||!user()){sellerStatus.textContent='Seller portal requires Supabase and a signed-in account. The design is ready, but seller registrations are not live yet.';return}
 sellerStatus.textContent='Checking your business profile…';
 const {data,error}=await client().from('seller_profiles').select('id,business_name,status').eq('id',user().id).maybeSingle();
 if(error){sellerStatus.textContent='Could not load seller profile: '+error.message;return}
 sellerStatus.textContent=data?'Business: '+data.business_name+' · '+data.status+'. '+(data.status==='approved'?'You can now see published requests below.':'Approval is required before making offers.'):'Register a business below. Accounts require manual approval.';
 $('v13SellerForm').hidden=Boolean(data);
 $('v13SellerFeatures').hidden=!(data&&data.status==='approved');
 if(data?.status==='approved')loadSellerNeeds();
}
async function loadSellerNeeds(){
 const list=$('v13SellerNeeds');list.textContent='Loading public buyer requests…';
 const {data,error}=await client().from('needs').select('id,description,category,budget,location,timeline').eq('status','published').limit(30);
 if(error){list.textContent='Cannot load buyer requests: '+error.message;return}
 list.innerHTML=(data||[]).length?(data||[]).map(d=>'<article class="v13-offer"><strong>'+esc(d.description.slice(0,110))+'</strong><p>'+esc(d.category)+' · '+esc(d.location||'Location not specified')+'</p><button type="button" data-need="'+esc(d.id)+'" class="v13-offer-action">Respond with an offer ↗</button></article>').join(''):'No published buyer requests currently available.';
}
$('v13SellerNeeds').addEventListener('click',e=>{
 const b=e.target.closest('button[data-need]');if(!b)return;
 $('v13OfferForm').hidden=false;$('v13OfferNeedId').value=b.dataset.need;$('v13OfferTitle').focus();
});
$('v13SellerForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client()||!user())return;
 const name=$('v13BusinessName').value.trim();if(name.length<2)return;
 const {error}=await client().from('seller_profiles').insert({id:user().id,business_name:name});
 if(error){sellerStatus.textContent='Could not register: '+error.message;return}
 sellerStatus.textContent='Registration submitted. Business approval is pending.';$('v13SellerForm').hidden=true;
});
$('v13OfferForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!client()||!user())return;
 const cost=Number($('v13OfferPrice').value);
 if(!Number.isFinite(cost)||cost<0)return;
 const record={need_id:$('v13OfferNeedId').value,seller_id:user().id,title:$('v13OfferTitle').value.trim(),description:$('v13OfferDescription').value.trim(),price:cost,currency:'EUR'};
 const {error}=await client().from('seller_offers').insert(record);
 $('v13OfferResponse').textContent=error?'Offer not submitted: '+error.message:'Offer sent to buyer.';
 if(!error)$('v13OfferForm').reset();
});
$('v13SellerOpen').addEventListener('click',openSeller);
$('v13SellerClose').addEventListener('click',closeSeller);
$('v13SellerDialog').addEventListener('click',e=>{if(e.target===sellerModal)closeSeller()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!sellerModal.hidden)closeSeller();if(!$('v13OffersDialog').hidden){$('v13OffersDialog').hidden=true;document.body.style.overflow=''}}});
window.NEED_MARKET={decorateCards,search};
if(!client()){
 try{
  const drafts=JSON.parse(localStorage.getItem('need_v8_requests')||'[]');
  if(Array.isArray(drafts))decorateCards(drafts,false);
 }catch(e){}
}
})();
