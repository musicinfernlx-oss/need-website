/* NEED V13 - unified buyer entry point, hybrid product discovery and seller portal */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>{try{const v=new URL(u);return v.protocol==='https:'?v.href:''}catch{return ''}};
const auth=()=>window.NEED_AUTH, client=()=>auth()?.getClient?.(), user=()=>auth()?.getUser?.();
const results=$('v13Results'),grid=$('v13Grid'),msg=$('v13Message'),source=$('v13Source');
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
  return '<article class="v13-product"><div class="v13-product-photo">'+(image?'<img src="'+esc(image)+'" loading="lazy" alt="'+esc(p.title)+'" onerror="this.style.display=\'none\'">':'<span>✦</span>')+'</div><div class="v13-product-body"><span class="v13-source">'+esc(p.source)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.description||'')+'</p><strong>'+esc(money(p))+'</strong><div class="v13-product-actions"><button type="button" data-compare="'+esc(p.id)+'" aria-pressed="'+active+'">'+(active?'✓ Comparing':'+ Compare')+'</button>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+(p.kind==='merchant'?'Visit store ↗':'View source ↗')+'</a>':'')+'</div></div></article>';
 }).join(''):'<p class="v13-empty">No matching catalog records from this source. The external shopping links below are always available.</p>';
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
async function merchants(q){
 if(!client())return [];
 const {data,error}=await client().from('merchant_products').select('id,title,summary,category,price,currency,product_url,image_url').eq('active',true).limit(100);
 if(error)throw Error(error.message);
 const needle=q.toLocaleLowerCase();
 return(data||[]).filter(p=>(p.title+' '+p.summary+' '+p.category).toLocaleLowerCase().includes(needle)).slice(0,18).map(p=>({id:'seller-'+p.id,kind:'merchant',title:p.title,source:'Approved NEED seller',description:p.summary,price:p.price,currency:p.currency,image:p.image_url,url:p.product_url}));
}
async function search(){
 const q=$('needText').value.trim();if(q.length<2){$('needText').focus();return}
 const kind=source.value,ticket=++searchId;
 $('v13SearchFor').textContent=q.slice(0,120);
 external(q);products=[];draw();results.hidden=false;results.scrollIntoView({behavior:'smooth',block:'start'});
 if(kind==='external'){info('Choose a store search below. NEED does not yet retrieve or verify the store’s inventory or prices.');return}
 info('Searching '+(kind==='books'?'book catalog':kind==='food'?'food catalog':'approved NEED sellers')+'…');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const found=kind==='books'?await books(q,ctrl.signal):kind==='food'?await food(q,ctrl.signal):await merchants(q);
  if(ticket!==searchId)return;
  products=found;draw();
  info(found.length+' catalog results. '+(kind==='seller'?'Seller listings require a connected NEED database.':'These are genuine catalog records, but not verified live store prices or stock.'));
 }catch(e){if(ticket!==searchId)return;info('Catalog unavailable: '+(e.name==='AbortError'?'request timed out':e.message)+'. Try an external store link.',true)}
 finally{clearTimeout(timer)}
}
$('v13Find').addEventListener('click',search);
source.addEventListener('change',search);
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
 const {error}=await client().from('seller_profiles').insert({id:user().id,business_name:name,status:'pending'});
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
