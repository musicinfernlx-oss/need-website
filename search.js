/* NEED V16.3 — single homepage search, results only */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const status=$('status'),grid=$('products');
const params=new URLSearchParams(location.search),initial=(params.get('q')||'').trim().slice(0,2000);
$('queryLabel').textContent=initial?'You searched for: “'+initial+'”':'No search entered';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function secureUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:''}catch{return ''}}
function note(title,message){grid.innerHTML='<div class="panel"><h2>'+esc(title)+'</h2><p>'+esc(message)+'</p></div>';}
function price(p){
 const value=Number(p.price);
 if(p.price===null||p.price===undefined||p.price===''||!Number.isFinite(value)||value<0)return 'Price not provided';
 try{return new Intl.NumberFormat('en-IE',{style:'currency',currency:/^[A-Z]{3}$/.test(p.currency||'EUR')?p.currency:'EUR'}).format(value)}catch{return 'Price not provided'}
}
function normalize(p,defaultSource){
 if(!p||typeof p.title!=='string')return null;
 const url=secureUrl(p.url||p.product_url),image=secureUrl(p.image||p.image_url);
 if(!url||!p.title.trim())return null;
 return {id:String(p.id||url),title:p.title.trim().slice(0,200),url,image,source:String(p.source||defaultSource||'Store').slice(0,100),price:p.price??null,currency:p.currency||'EUR',promoted:!!p.promoted,description:String(p.description||p.summary||'')};
}
function relevance(p,q){const terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>2);if(!terms.length)return 1;const t=(p.title+' '+p.description).toLowerCase();return terms.reduce((n,w)=>n+(t.includes(w)?1:0),0)}
async function fetchProducts(q){
 const cfg=window.NEED_SUPABASE_CONFIG;
 if(!cfg?.url||!cfg?.anonKey||!window.supabase)return {items:[],connected:false};
 const client=window.supabase.createClient(cfg.url,cfg.anonKey);
 let items=[],connected=false;
 const outcomes=await Promise.allSettled([
  client.from('merchant_products').select('id,title,summary,price,currency,product_url,image_url,seller_profiles!inner(business_name,status,subscription_status)').eq('active',true).eq('seller_profiles.status','approved').limit(200),
  client.functions.invoke('product-search',{body:{query:q}})
 ]);
 const merchant=outcomes[0];
 if(merchant.status==='fulfilled'&&!merchant.value.error){
  connected=true;
  items.push(...(merchant.value.data||[]).map(p=>normalize({...p,source:p.seller_profiles?.business_name||'NEED merchant',promoted:p.seller_profiles?.subscription_status==='active'},'NEED merchant')).filter(Boolean));
 }
 const live=outcomes[1];
 if(live.status==='fulfilled'&&!live.value.error&&Array.isArray(live.value.data?.items)){
  connected=true;
  items.push(...live.value.data.items.map(p=>normalize({...p,promoted:false},p.source||'Live retailer')).filter(Boolean));
 }
 const unique=[...new Map(items.map(p=>[p.url,p])).values()];
 return {items:unique.map(p=>({...p,score:relevance(p,q)})).filter(p=>p.score>0).sort((a,b)=>(+b.promoted-+a.promoted)||(b.score-a.score)),connected};
}
let searchNumber=0;
async function run(q){
 const ticket=++searchNumber;
 if(q.length<2){status.textContent='Start from the NEED homepage.';note('One search for everything','Describe what you need using the single search field on the NEED homepage.','');return}
 document.title=q.slice(0,80)+' — NEED search';
 status.textContent='Searching available NEED sources for products and services…';
 grid.innerHTML='<div class="panel"><p>Finding available matches for your NEED…</p></div>';
 try{
  const result=await fetchProducts(q);
  if(ticket!==searchNumber)return;
  if(!result.items.length){
   status.textContent='No verified listings found for your NEED yet.';
   grid.innerHTML='<div class="panel"><h2>No matching offers yet</h2><p>NEED has not found verified products or services for this search. More real sources are being connected.</p></div>';
   return;
  }
  status.textContent=result.items.length+' verified matching offer'+(result.items.length===1?'':'s')+' · Select an offer to visit its provider';
  grid.innerHTML=result.items.map(p=>'<article class="product"><a target="_blank" rel="noopener noreferrer" href="'+esc(p.url)+'" aria-label="View '+esc(p.title)+' at '+esc(p.source)+'"><div class="picture">'+(p.image?'<img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.title)+'" onerror="this.remove()">':'<span class="missing">Product image unavailable</span>')+'</div><div class="details"><div class="store">'+(p.promoted?'<span class="sponsored">Sponsored</span>':'NEED MATCH')+'</div><h2>'+esc(p.title)+'</h2><div class="price">'+esc(price(p))+'</div><div class="cta">View product ↗</div></div></a></article>').join('');
 }catch(e){if(ticket!==searchNumber)return;status.textContent='One or more NEED sources are unavailable.';note('Search temporarily unavailable','NEED could not retrieve matching offers. Please try again shortly.')}
}
if(initial)run(initial);else{status.textContent='Start from the homepage.';note('One search for everything','Use the single search field on the NEED homepage to search for products, services, or experiences.','')}
})();