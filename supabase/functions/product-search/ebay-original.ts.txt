// NEED real marketplace product adapter - eBay Browse API.
// Production credentials belong ONLY in Edge Function secrets.
// Credentials: EBAY_CLIENT_ID, EBAY_CLIENT_SECRET.
// Keep JWT verification enabled on the Edge Function if using authenticated access.
// For public search, limit abuse with an edge firewall / rate limiting proxy before launch.
const ORIGIN = "https://musicinfernlx-oss.github.io";
const headers = {
 "Access-Control-Allow-Origin":ORIGIN,
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
 "Content-Type":"application/json",
 "Cache-Control":"no-store"
};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const isStr=(x:unknown)=>typeof x==="string";
let storedToken:{value:string;until:number}|null=null;
async function getToken(){
 if(storedToken&&Date.now()<storedToken.until)return storedToken.value;
 const id=Deno.env.get("EBAY_CLIENT_ID");
 const secret=Deno.env.get("EBAY_CLIENT_SECRET");
 if(!id||!secret)throw new Error("provider_not_configured");
 const response=await fetch("https://api.ebay.com/identity/v1/oauth2/token",{
  method:"POST",
  headers:{"Authorization":"Basic "+btoa(id+":"+secret),"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"client_credentials",scope:"https://api.ebay.com/oauth/api_scope"})
 });
 if(!response.ok)throw new Error("provider_authorization_failed");
 const payload=await response.json();
 if(typeof payload.access_token!=="string")throw new Error("provider_token_missing");
 storedToken={value:payload.access_token,until:Date.now()+Math.max(60,(Number(payload.expires_in)||7200)-120)*1000};
 return storedToken.value;
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 const origin=req.headers.get("origin");
 if(origin&&origin!==ORIGIN)return reply({error:"Origin not allowed"},403);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),13000);
 try{
  const input=await req.json();
  if(!input||!isStr(input.query))return reply({error:"Invalid query"},400);
  const q=input.query.trim().slice(0,120);
  if(q.length<2)return reply({error:"Search query too short"},400);
  const max=Number.isFinite(input.maxPrice)?Number(input.maxPrice):null;
  if(max!==null&&(max<=0||max>1000000))return reply({error:"Invalid budget"},400);
  const token=await getToken();
  const params=new URLSearchParams({q,limit:"30",sort:"best_match"});
  const filters=["buyingOptions:{FIXED_PRICE}"];
  if(max!==null)filters.push("price:[.."+Math.floor(max)+"],priceCurrency:EUR");
  params.set("filter",filters.join(","));
  const api=await fetch("https://api.ebay.com/buy/browse/v1/item_summary/search?"+params.toString(),{
   headers:{"Authorization":"Bearer "+token,"X-EBAY-C-MARKETPLACE-ID":"EBAY_DE","Accept":"application/json"},
   signal:controller.signal
  });
  if(!api.ok){
   const status=api.status===429?429:502;
   return reply({error:status===429?"provider_rate_limited":"provider_request_failed"},status);
  }
  const json=await api.json();
  const listings=(Array.isArray(json.itemSummaries)?json.itemSummaries:[]).map((item:any)=>{
   const value=Number(item.price?.value);
   const currency=item.price?.currency;
   const page=item.itemWebUrl;
   if(!isStr(item.itemId)||!isStr(item.title)||!isStr(page)||!page.startsWith("https://")||!Number.isFinite(value)||value<0||currency!=="EUR")return null;
   if(max!==null&&value>max)return null;
   return {
    id:"ebay-"+item.itemId,title:item.title.slice(0,170),
    description:[item.condition,item.seller?.username?"Seller: "+item.seller.username:""].filter(Boolean).join(" · ").slice(0,300),
    category:"Retail product",source:"eBay · live listing",image:isStr(item.image?.imageUrl)?item.image.imageUrl:"",
    url:page,price:value,currency:"EUR",kind:"external",promoted:false,
    shipping: item.shippingOptions?.[0]?.shippingCost?.value ?? null,
    availability:"Check on seller website"
   };
  }).filter(Boolean);
  return reply({provider:"eBay Browse",marketplace:"EBAY_DE",items:listings,retrievedAt:new Date().toISOString(),disclaimer:"Seller price; shipping, VAT applicability, delivery to Finland and stock must be verified at the retailer."});
 }catch(e){
  return reply({error:e instanceof Error&&e.message==="provider_not_configured"?"provider_not_configured":"search_unavailable"},503);
 }finally{clearTimeout(timer)}
});
