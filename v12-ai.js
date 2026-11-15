/* NEED V12: optional real AI refinement. Never puts API secrets in the browser. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const button=$('v12AiBtn'),output=$('v12AiResponse'),mode=$('v12AiMode');
if(!button||!output)return;
const auth=window.NEED_AUTH;
const getClient=()=>auth?.getClient?.();
const getUser=()=>auth?.getUser?.();
const available=()=>Boolean(getClient()&&getUser());
function describe(){
 mode.textContent=available()?'Secure AI available when function is deployed':'Smart browser suggestions active';
}
describe();
button.addEventListener('click',async()=>{
 const text=($('needText')?.value||window.NEED_V12?.intro||'').trim();
 if(text.length<10){
  output.textContent='Describe your request on the homepage first (at least 10 characters). Then tap the suggestions button and try AI analysis again.';
  return;
 }
 const client=getClient(),user=getUser();
 if(!client){
  const result=window.NEED_V12?.analyze(text);
  output.textContent='AI service is not connected yet. The on-device guide is available now.\n\n'+
   (result?'Detected category: '+result.category+'. Focus: '+result.priority+
   (result.features.length?'. Important features: '+result.features.join(', '):'')+'.':'');
  return;
 }
 if(!user){
  output.textContent='To use the secure AI assistant, sign in first using My account. You can continue using the smart local suggestions without an account.';
  return;
 }
 button.disabled=true;button.textContent='Analyzing…';output.textContent='Reading your request securely…';
 try{
  const {data,error}=await client.functions.invoke('need-assist',{body:{need:text}});
  if(error)throw error;
  if(!data||typeof data.summary!=='string')throw new Error('Unexpected response from AI service.');
  const points=Array.isArray(data.questions)?data.questions.filter(x=>typeof x==='string').slice(0,3):[];
  output.textContent='✦ AI insight\n'+data.summary.trim().slice(0,1000)+
   (points.length?'\n\nTo narrow it down:\n'+points.map((x,i)=>(i+1)+'. '+x).join('\n'):'');
  if(data.category&&data.group){
   const analysis=window.NEED_V12?.analyze(text);
   if(analysis&&['tech','home','style','travel'].includes(data.category)){
    analysis.category=data.category;
    analysis.group=String(data.group).slice(0,40);
    if(typeof data.priority==='string')analysis.priority=data.priority.slice(0,80);
    window.NEED_V12?.setAnalysis(analysis);
    window.NEED_GUIDE?.applyAnalysis(analysis);
   }
  }
  mode.textContent='AI-powered guidance';
 }catch(e){
  output.textContent='The secure AI service is not ready or could not respond: '+(e.message||'Please try again.')+
   '\n\nYou can still use the on-device suggestions.';
 }finally{button.disabled=false;button.textContent='✦ Analyze with AI'}
});
})();