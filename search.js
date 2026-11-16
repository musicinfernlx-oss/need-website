/* NEED Search V16.1 — standalone results, real listings only */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const input=$('term'),status=$('status'),grid=$('products');
const params=new URLSearchParams(location.search),initial=(params.get('q')||'').trim().slice(0,2000);
input.value=initial;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function secureUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:''}catch{return ''}}
const stores=[
 ['Verkkokauppa.com',q=>'https://www.verkkokauppa.com/fi/search?query='+encodeURIComponent(q)],
 ['Google Shopping',q=>'https://www.google.com/search?tbm=shop&q='+encodeURIComponent(q)],
 ['eBay',q=>'https://www.ebay.com/sch/i.html?_nkw='+encodeURIComponent(q)],
 ['Etsy',q=>'https://www.etsy.com/search?q='+encodeURIComponent(q)]
];
function alternatives(q){return '<div class="shops">'+stores.map(([name,url])=>'<a href="'+esc(url(q))+'" target="_blank" rel="noopener noreferrer">Search '+esc(name)+' ↗</a>').join('')+'</div>'}
function note(title,message,q){
 grid.innerHTML='<div class="panel"><h2>'+esc(title)+'</h2><p>'+esc(message)+'</p>'+(q?alternatives(q):'')+'</div>';
}
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
 if(q.length<2){status.textContent='Enter at least two characters to search.';note('Start with your NEED','Search for a product in the field above.','');return}
 document.title=q.slice(0,80)+' — NEED search';
 status.textContent='Searching connected product sources…';
 grid.innerHTML='<div class="panel"><p>Looking for real products and current prices…</p></div>';
 try{
  const result=await fetchProducts(q);
  if(ticket!==searchNumber)return;
  if(!result.items.length){
   status.textContent='No verified product offers found for this search.';
   note('No verified offers available yet',result.connected?'No matching merchant offers are currently available in NEED. You can search these stores directly while more sources are connected.':'NEED does not currently have an active live retailer feed. We will not display invented product prices or placeholder offers. You can search the original stores below.',q);
   return;
  }
  status.textContent=result.items.length+' verified listing'+(result.items.length===1?'':'s')+' · Open a product to visit its seller';
  grid.innerHTML=result.items.map(p=>'<article class="product"><a target="_blank" rel="noopener noreferrer" href="'+esc(p.url)+'" aria-label="View '+esc(p.title)+' at '+esc(p.source)+'"><div class="picture">'+(p.image?'<img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.title)+'" onerror="this.remove()">':'<span class="missing">Product image unavailable</span>')+'</div><div class="details"><div class="store">'+esc(p.source)+(p.promoted?'<span class="sponsored">Sponsored</span>':'')+'</div><h2>'+esc(p.title)+'</h2><div class="price">'+esc(price(p))+'</div><div class="cta">View product ↗</div></div></a></article>').join('');
 }catch(e){if(ticket!==searchNumber)return;status.textContent='Product source unavailable.';note('Search is temporarily unavailable','You can still open the store searches below.',q)}
}
$('searchForm').addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();history.replaceState(null,'','search.html?q='+encodeURIComponent(q));run(q)});
if(initial)run(initial);else{status.textContent='Search for something you need.';note('Discover products','Type a product or describe what you need in the search field above.','')}
})();