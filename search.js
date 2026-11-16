/* NEED V17.2 — only priced, pictured products across all sources */
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
 const amount=Number(p.price);
 if(!url||!image||!p.title.trim()||p.price===null||p.price===undefined||p.price===''||!Number.isFinite(amount)||amount<0||!/^[A-Z]{3}$/.test(p.currency||''))return null;
 return {id:String(p.id||url),title:p.title.trim().slice(0,200),url,image,source:String(p.source||defaultSource||'Store').slice(0,100),price:amount,currency:p.currency,promoted:!!p.promoted,category:String(p.category||'').slice(0,120),description:String(p.description||p.summary||''),imageCredit:p.imageCredit||null,catalogOnly:!!p.catalogOnly};
}
function relevance(p,q){const terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>2);if(!terms.length)return 1;const t=(p.title+' '+p.category+' '+p.description).toLowerCase();return terms.reduce((n,w)=>n+(t.includes(w)?1:0),0)}
function understandNeed(query){
 const range=query.match(/(\d{1,6})\s*[-–]\s*(\d{1,6})\s*(?:€|eur|euroa?|eurolla)/i);
 const ceiling=query.match(/(?:alle|enintään|korkeintaan|maksimi|max|under|up to)\s*(\d{1,6})\s*(?:€|eur|euroa?)?/i);
 const inch=query.match(/(\d{2}(?:[.,]\d+)?)\s*(?:["″]|tuum\w*|inch(?:es)?)/i);
 const laptop=/läppäri|kannettav|laptop|notebook/i.test(query);
 let min=range?Number(range[1]):null,max=range?Number(range[2]):ceiling?Number(ceiling[1]):null;
 if(min!==null&&(!Number.isFinite(min)||min<0))min=null;
 if(max!==null&&(!Number.isFinite(max)||max<0))max=null;
 if(min!==null&&max!==null&&min>max)[min,max]=[max,min];
 let keywords=query
   .replace(/\d{1,6}\s*[-–]\s*\d{1,6}\s*(?:€|eur|euroa?|eurolla)/gi,' ')
   .replace(/(?:alle|enintään|korkeintaan|maksimi|max|under|up to)\s*\d{1,6}\s*(?:€|eur|euroa?)?/gi,' ')
   .replace(/\d{2}(?:[.,]\d+)?\s*(?:["″]|tuum\w*|inch(?:es)?)/gi,' ')
   .replace(/\b(?:haluan|ostaa|etsin|tarvitsen|noin|hyvän|hyvä|mahdollisimman|jossa|jolla|pitää|olla|minulle|sellaisen|hintaan|hinta|saisi|olla|the|buy|want|for|with|around)\b/gi,' ')
   .replace(/\s+/g,' ').trim();
 if(laptop)keywords=keywords.replace(/läppäri\w*|kannettav\w*|notebook\w*/gi,'laptop');
 return {keywords:(keywords||query).slice(0,200),min,max,laptop,inches:inch?Number(inch[1].replace(',','.')):null};
}
function matchesRequiredSpecs(p,need){
 const text=(p.title+' '+p.category+' '+p.description).toLowerCase();
 if(need.laptop&&!/laptop|notebook|kannettav|vivobook|ideapad|thinkpad|aspire|cyborg/.test(text))return false;
 if(need.inches!==null){
  const matches=[...text.matchAll(/(\d{2}(?:[.,]\d+)?)\s*(?:["″]|tuum\w*|inch(?:es)?)/gi)]
   .map(m=>Number(m[1].replace(',','.')));
  if(!matches.some(n=>Math.abs(n-need.inches)<=0.7))return false;
 }
 return true;
}

async function fetchProducts(q){
 const cfg=window.NEED_SUPABASE_CONFIG;
 if(!cfg?.url||!cfg?.anonKey||!window.supabase)return {items:[],connected:false};
 const client=window.supabase.createClient(cfg.url,cfg.anonKey);
 let items=[],connected=false;
 const need=understandNeed(q);
 const outcomes=await Promise.allSettled([
  client.from('merchant_products').select('id,title,summary,price,currency,product_url,image_url,seller_profiles!inner(business_name,status,subscription_status)').eq('active',true).eq('seller_profiles.status','approved').limit(200),
  client.rpc('need_index_search',{search_text:need.keywords,max_price:need.max,min_price:need.min,result_limit:80}),
  client.from('need_search_index').select('item_url,attributes').not('image_url','is',null).limit(500),
  client.from('product_sources').select('id',{count:'exact',head:true}).eq('enabled',true).eq('permission_verified',true)
 ]);
 const merchant=outcomes[0];
 if(merchant.status==='fulfilled'&&!merchant.value.error){
  connected=true;
  items.push(...(merchant.value.data||[]).map(p=>normalize({...p,source:p.seller_profiles?.business_name||'NEED merchant',promoted:p.seller_profiles?.subscription_status==='active'},'NEED merchant')).filter(Boolean));
 }
 const creditRows=outcomes[2]?.status==='fulfilled'&&!outcomes[3].value.error?outcomes[3].value.data||[]:[];
 const creditMap=new Map(creditRows.map(p=>[p.item_url,p.attributes]));
 const indexed=outcomes[1];
 if(indexed.status==='fulfilled'&&!indexed.value.error){
  connected=true;
  items.push(...(indexed.value.data||[]).map(p=>normalize({...p,source:p.source||'Indexed offer',image:p.image,url:p.url,category:p.category,description:p.description,price:p.price,promoted:p.promoted,imageCredit:creditMap.get(p.url)||null,catalogOnly:creditMap.get(p.url)?.catalog_only===true||/^Open (Food|Beauty|Products) Facts$/.test(p.source||'')},'Indexed offer')).filter(Boolean));
 }
 // An indexed search costs no per-query web-search API calls.
 // Only consult the live retailer endpoint when a verified source exists and index matches are sparse.
 const sources=outcomes[3];
 if(items.length<6&&sources?.status==='fulfilled'&&!sources.value.error&&Number(sources.value.count)>0){
  try{
   const live=await client.functions.invoke('product-search',{body:{query:need.keywords,maxPrice:need.max}});
   if(!live.error&&Array.isArray(live.data?.items)){
    connected=true;
    items.push(...live.data.items.map(p=>normalize({...p,promoted:false},p.source||'Live retailer')).filter(Boolean));
   }
  }catch(_){/* The local index remains available even when external shops fail. */}
 }
 const unique=[...new Map(items.map(p=>[p.url,p])).values()];
 return {items:unique.map(p=>({...p,score:relevance(p,need.keywords)}))
  .filter(p=>p.score>0&&matchesRequiredSpecs(p,need))
  .filter(p=>(need.max===null&&need.min===null)||(p.currency==='EUR'&&(need.max===null||p.price<=need.max)&&(need.min===null||p.price>=need.min)))
  .sort((a,b)=>(+b.promoted-+a.promoted)||(b.score-a.score)),connected};
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
   status.textContent='No matching products with both a price and an image were found.';
   grid.innerHTML='<div class="panel"><h2>No complete product offers yet</h2><p>NEED only displays products with both a price and a product photo. No matching products currently meet these requirements.</p></div>';
   return;
  }
  status.textContent=result.items.length+' matching products with a price and photo · Confirm the latest price with the seller';
  grid.innerHTML=result.items.map(p=>'<article class="product"><a target="_blank" rel="noopener noreferrer" href="'+esc(p.url)+'" aria-label="View '+esc(p.title)+' at '+esc(p.source)+'"><div class="picture">'+'<img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.title)+'" onerror="this.closest(\'article\')?.remove()">'+'</div><div class="details"><div class="store">'+(p.promoted?'<span class="sponsored">Sponsored</span>':p.catalogOnly?'PRODUCT INFORMATION':'NEED MATCH')+'</div><h2>'+esc(p.title)+'</h2><div class="price">'+esc(p.catalogOnly?'Price not listed':price(p))+'</div><div class="cta">'+(p.catalogOnly?'View product details ↗':'View product ↗')+'</div></div></a>'+(p.image&&p.imageCredit?.image_license&&secureUrl(p.imageCredit?.image_source_url)?'<div class="image-credit"><a target="_blank" rel="noopener noreferrer" href="'+esc(secureUrl(p.imageCredit.image_source_url))+'">Photo: '+esc(p.imageCredit.image_author||'Contributor')+' · '+esc(p.imageCredit.image_license)+(p.catalogOnly?' · Open catalog (not a store)':'')+'</a></div>':'')+'</article>').join('');
 }catch(e){if(ticket!==searchNumber)return;status.textContent='One or more NEED sources are unavailable.';note('Search temporarily unavailable','NEED could not retrieve matching offers. Please try again shortly.')}
}
if(initial)run(initial);else{status.textContent='Start from the homepage.';note('One search for everything','Use the single search field on the NEED homepage to search for products, services, or experiences.','')}
})();