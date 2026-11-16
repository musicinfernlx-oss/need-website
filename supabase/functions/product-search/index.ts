// NEED Global Product Engine — server-side, verified store registry and eBay extension.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const ORIGIN="https://musicinfernlx-oss.github.io";
const HEAD={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Content-Type":"application/json","Cache-Control":"no-store"};
const reply=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:HEAD});
const clean=(v:any)=>String(v??"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
const https=(v:any)=>{try{const u=new URL(String(v));return u.protocol==="https:"&&!u.username&&!u.password?u.href:""}catch{return ""}};
type Shop={name:string;base_url:string;platform:string;country?:string|null};
async function shops():Promise<Shop[]>{
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!base||!key)throw Error("registry_key_missing");
 const url=new URL("/rest/v1/product_sources",base);
 url.searchParams.set("select","name,base_url,platform,country");
 url.searchParams.set("enabled","eq.true");
 url.searchParams.set("permission_verified","eq.true");
 url.searchParams.set("limit","48");
 const res=await fetch(url,{headers:{apikey:key,Authorization:"Bearer "+key},signal:AbortSignal.timeout(4500)});
 if(!res.ok)throw Error("registry_unavailable");
 const rows=await res.json();
 return Array.isArray(rows)?rows.filter(x=>x.platform==="woocommerce"&&https(x.base_url)).slice(0,48):[];
}
async function woo(shop:Shop,q:string){
 const base=new URL(shop.base_url);const u=new URL("/wp-json/wc/store/v1/products",base);
 u.searchParams.set("search",q.slice(0,90));u.searchParams.set("per_page","24");
 const r=await fetch(u,{headers:{Accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(6500)});
 if(!r.ok||!(r.headers.get("content-type")||"").includes("json"))return [];
 const rows=await r.json();if(!Array.isArray(rows))return [];
 return rows.slice(0,24).map((p:any)=>{
  const raw=Number(p.prices?.price),minor=Number(p.prices?.currency_minor_unit),currency=String(p.prices?.currency_code??"");
  const url=https(p.permalink),img=https(p.images?.[0]?.src);
  if(!url||new URL(url).hostname!==base.hostname||!p.name||!Number.isFinite(raw)||!Number.isInteger(minor)||minor<0||minor>4||!/^[A-Z]{3}$/.test(currency))return null;
  return {id:"woo-"+shop.name+"-"+p.id,kind:"external",title:clean(p.name).slice(0,170),description:clean(p.short_description).slice(0,300),source:shop.name,image:img,url,price:raw/10**minor,currency,availability:p.is_in_stock?"In stock":"Check with seller",promoted:false};
 }).filter(Boolean);
}
let token:{value:string;until:number}|null=null;
async function ebay(q:string,max:number|null){
 const id=Deno.env.get("EBAY_CLIENT_ID"),secret=Deno.env.get("EBAY_CLIENT_SECRET");
 if(!id||!secret)return [];
 if(!token||Date.now()>token.until){
  const r=await fetch("https://api.ebay.com/identity/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+btoa(id+":"+secret),"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"client_credentials",scope:"https://api.ebay.com/oauth/api_scope"}),signal:AbortSignal.timeout(6500)});
  if(!r.ok)return [];
  const j=await r.json();token={value:j.access_token,until:Date.now()+Math.max(60,(Number(j.expires_in)||7200)-120)*1000};
 }
 const params=new URLSearchParams({q,limit:"20"});
 const filters=["buyingOptions:{FIXED_PRICE}"];if(max!==null)filters.push("price:[.."+Math.floor(max)+"],priceCurrency:EUR");params.set("filter",filters.join(","));
 const r=await fetch("https://api.ebay.com/buy/browse/v1/item_summary/search?"+params,{headers:{Authorization:"Bearer "+token.value,"X-EBAY-C-MARKETPLACE-ID":"EBAY_DE"},signal:AbortSignal.timeout(6500)});
 if(!r.ok)return [];
 const j=await r.json();return (Array.isArray(j.itemSummaries)?j.itemSummaries:[]).map((p:any)=>{
  const price=Number(p.price?.value),url=https(p.itemWebUrl);
  return !p.title||!url||!Number.isFinite(price)||p.price?.currency!=="EUR"?null:{id:"ebay-"+p.itemId,kind:"external",title:clean(p.title).slice(0,170),description:clean(p.condition),source:"eBay",image:https(p.image?.imageUrl),url,price,currency:"EUR",promoted:false};
 }).filter(Boolean);
}

/* Optional world-wide discovery: Tavily licensed search API.
   Search result snippets are suggestions, not independently verified seller prices.
   We never attach unpaired photos or manufacture costs. */
function inferNeed(text:string){
 const minmax=text.match(/(\d[\d\s]{2,5})\s*[-–]\s*(\d[\d\s]{2,5})\s*(?:€|eur|euro)/i);
 const ceiling=text.match(/(?:alle|enintään|max|under|up to)\s*(\d[\d\s]{2,6})\s*(?:€|eur|euro)?/i);
 const inches=text.match(/(\d{2}(?:[.,]\d)?)\s*(?:"|″|tuum|inch)/i);
 const laptop=/läppäri|kannettava|laptop|notebook/i.test(text);
 let key=text.replace(/\b(?:haluan|ostaa|etsin|tarvitsen|noin|mielellään|hyvä|laadukas|laadukkaan|want|buy|looking for|please)\b/gi," ")
  .replace(/\d[\d\s]{2,5}\s*[-–]\s*\d[\d\s]{2,5}\s*(€|eur|euro)/gi," ")
  .replace(/(?:alle|enintään|max|under|up to)\s*\d[\d\s]{2,6}\s*(€|eur|euro)?/gi," ").replace(/\s+/g," ").trim();
 if(laptop){key="laptop notebook "+(inches?inches[1]+' inch ':'')+' '+key.replace(/läppäri|kannettava|laptop|notebook/gi,"");}
 const maxPrice=minmax?Number(minmax[2].replace(/\s/g,"")):ceiling?Number(ceiling[1].replace(/\s/g,"")):null;
 const minPrice=minmax?Number(minmax[1].replace(/\s/g,"")):null;
 return {key:key.slice(0,110)||text,minPrice,maxPrice,minimumInches:inches?Number(inches[1].replace(',','.')):null};
}
function snippetPrice(text:string){
 // A single unambiguous euro amount in a result snippet; no guessing from ranges.
 const matches=[...text.matchAll(/(?:€\s*(\d{2,5}(?:[.,]\d{2})?)|(\d{2,5}(?:[.,]\d{2})?)\s*(?:€|EUR)\b)/gi)].map(m=>Number((m[1]||m[2]).replace(',','.'))).filter(n=>Number.isFinite(n)&&n>0);
 return matches.length===1?matches[0]:null;
}
async function webDiscover(original:string):Promise<any[]>{
 const key=Deno.env.get("TAVILY_API_KEY");
 if(!key)return [];
 const need=inferNeed(original);
 const searchTerm=(need.key+" buy product price € shop").slice(0,200);
 const r=await fetch("https://api.tavily.com/search",{
  method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
  body:JSON.stringify({query:searchTerm,search_depth:"basic",topic:"general",max_results:20,
   include_answer:false,include_images:false,include_raw_content:false}),
  signal:AbortSignal.timeout(11000)
 });
 if(!r.ok)throw Error("web_search_"+r.status);
 const data=await r.json();
 if(!Array.isArray(data.results))return [];
 const ignore=/wikipedia\.org|youtube\.com|facebook\.com|pinterest\.|reddit\.com|tiktok\.com|instagram\.com|medium\.com|news\.|blog\./i;
 return data.results.map((r:any,i:number)=>{
  const url=https(r.url);if(!url)return null;
  const host=new URL(url).hostname;
  if(ignore.test(host)||!r.title)return null;
  const title=clean(r.title).replace(/\s*[|–-]\s*[^|–-]{2,40}$/,"").slice(0,170);
  const description=clean(r.content).slice(0,300);
  const price=snippetPrice(description+" "+title);
  const terms=need.key.toLowerCase().split(/\s+/).filter((t:string)=>t.length>3);
  if(terms.length&&!terms.some((w:string)=>(title+" "+description).toLowerCase().includes(w)))return null;
  if(need.maxPrice!==null && price!==null && price>need.maxPrice)return null;
  if(need.minPrice!==null && price!==null && price<need.minPrice)return null;
  return {id:"web-"+i+"-"+host,kind:"external",title,description,source:host,
   image:"",url,price,currency:"EUR",promoted:false,priceStatus:price===null?"not_found":"search_snippet_unverified",
   checkedAt:new Date().toISOString()};
 }).filter(Boolean);
}

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:HEAD});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==ORIGIN)return reply({error:"Origin not allowed"},403);
 let body:any;try{body=await req.json()}catch{return reply({error:"Invalid JSON"},400)}
 const q=String(body?.query??"").trim().replace(/\s+/g," ").slice(0,110);
 if(q.length<2)return reply({error:"Query too short"},400);
 const max=body?.maxPrice===null||body?.maxPrice===undefined?null:Number(body.maxPrice);
 if(max!==null&&(!Number.isFinite(max)||max<=0||max>1000000))return reply({error:"Invalid maxPrice"},400);
 try{
  const sourceList=await shops();
  // Query in controlled batches to avoid flooding independent retailers.
  const results:PromiseSettledResult<any[]>[]=[];
  for(let i=0;i<sourceList.length;i+=8){
   const batch=await Promise.allSettled(sourceList.slice(i,i+8).map(s=>woo(s,q)));
   results.push(...batch);
  }
  results.push(...await Promise.allSettled([ebay(q,max),webDiscover(q)]));
  const all=results.flatMap(x=>x.status==="fulfilled"?x.value:[]);
  const seen=new Set(),products=[];
  for(const p of all){if(seen.has(p.url)||max!==null&&p.price!==null&&(p.currency!=="EUR"||p.price>max))continue;seen.add(p.url);products.push(p)}
  const terms=q.toLocaleLowerCase().split(/\s+/).filter((w:string)=>w.length>2);
  const rank=(p:any)=>terms.reduce((n:number,t:string)=>n+(String(p.title).toLocaleLowerCase().includes(t)?4:0)+(String(p.description).toLocaleLowerCase().includes(t)?1:0),0);
  products.sort((a:any,b:any)=>rank(b)-rank(a)||((a.price??Infinity)-(b.price??Infinity)));
  return reply({items:products.slice(0,100),status:"live",sourcesChecked:sourceList.length+(Deno.env.get("EBAY_CLIENT_ID")?1:0)+(Deno.env.get("TAVILY_API_KEY")?1:0),webSearchConfigured:Boolean(Deno.env.get("TAVILY_API_KEY")),retrievedAt:new Date().toISOString()});
 }catch(e){console.error("NEED Global Search:",String(e));return reply({error:"search_unavailable",items:[],status:"unavailable"},503)}
});
