(()=>{
'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='need_v8_requests';
const cfg=window.NEED_SUPABASE_CONFIG||{};
const ready=Boolean(cfg.url&&cfg.anonKey&&/^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(cfg.url)&&window.supabase?.createClient);
let api=null,user=null,items=[],step=0,mode='local',authBusy=false;
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))items=saved.filter(x=>x&&typeof x.description==='string').slice(0,60);}catch(e){}
if(ready){
 try{api=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});mode='cloud-guest';}
 catch(e){console.warn('NEED client not available',e)}
}
const fields={description:$('v8Description'),category:$('v8Category'),budget:$('v8Budget'),timeline:$('v8Timeline'),location:$('v8Location')};
const wizard=$('v8Dialog');
const categoryMap={tech:'Tech & electronics',home:'Home & services',style:'Mobility & style',travel:'Travel & experiences'};
const info=$('v10Info'),authModal=$('v10AuthModal'),authEmail=$('v10Email'),authMessage=$('v10AuthMessage');
function message(text,kind=''){info.textContent=text;info.dataset.kind=kind}
function authMessageSet(text,kind=''){authMessage.textContent=text;authMessage.dataset.kind=kind}
function saveLocal(){
 try{localStorage.setItem(storageKey,JSON.stringify(items))}
 catch(e){message('Local storage is unavailable; your drafts may disappear after refresh.','error')}
}
function convertRow(row){return {id:row.id,description:row.description,category:row.category,budget:row.budget||'',timeline:row.timeline,location:row.location||'',createdAt:row.created_at}}
function record(d){return {description:d.description,category:d.category,budget:d.budget,timeline:d.timeline,location:d.location}}
function updateMode(){
 const status=$('v10Mode'),account=$('v10AccountButton'),logout=$('v10Logout');
 if(user){mode='cloud';status.textContent='☁ Cloud sync active';account.textContent='My account';logout.hidden=false;message('Signed in as '+user.email+'. Your private requests sync across devices.');}
 else if(api){mode='cloud-guest';status.textContent='☁ Sign in to sync';account.textContent='Sign in';logout.hidden=true;message('Sign in to save new requests in your private cloud account. Local drafts remain on this device.');}
 else{mode='local';status.textContent='◦ Local demo';account.textContent='My account';logout.hidden=true;message('Cloud sync is not connected. Continue using local drafts or connect Supabase to enable real accounts.');}
 $('v10StorageCaption').textContent=user?'Private cloud drafts · only visible to this account':'Local drafts · saved only in this browser';
}
function card(d,idx){
 return '<article class="v8-request"><div class="v8-request-top"><span class="v8-chip">'+escapeHTML(d.category)+'</span><span class="v8-smallprint">Private draft</span></div><h3>'+escapeHTML(d.description.length>100?d.description.slice(0,100)+'…':d.description)+'</h3><p>'+escapeHTML(d.description.length>230?d.description.slice(0,230)+'…':d.description)+'</p><div class="v8-request-meta"><span>'+escapeHTML(d.budget||'Budget open')+'</span><span>'+escapeHTML(d.timeline)+'</span>'+(d.location?'<span>'+escapeHTML(d.location)+'</span>':'')+'</div><div class="v8-actions" style="margin-top:16px"><button class="v8-btn-lite" type="button" data-action="view" data-index="'+idx+'">View details</button><button class="v8-btn-lite" type="button" data-action="edit" data-index="'+idx+'">Edit</button><button class="v8-btn-lite" type="button" data-action="remove" data-index="'+idx+'">Remove</button></div></article>';
}
function render(){
 $('myNeedsList').innerHTML=items.length?items.map(card).join(''):'<div class="v8-empty">No NEEDs saved yet. Create your first request to see it here.</div>';
 $('myNeedCount').textContent=items.length+' saved draft'+(items.length===1?'':'s');
}
async function loadCloud(){
 if(!api||!user)return;
 message('Loading your private NEEDs…');
 const {data,error}=await api.from('needs').select('id,description,category,budget,timeline,location,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
 if(error){message('Could not load account drafts: '+error.message,'error');return}
 items=(data||[]).map(convertRow);render();updateMode();
}
function openAuth(){
 authModal.hidden=false;
 authMessageSet(api?(user?'Signed in as '+user.email:'Enter your email to receive a secure sign-in link.'):'Account sign-in needs a Supabase project connection. The site is currently in local demo mode.');
 $('v10AuthSubmit').disabled=!api||!!user;
 $('v10AuthSubmit').textContent=user?'Already signed in':'Email me a sign-in link';
 authEmail.disabled=!!user||!api;
 if(user)authEmail.value=user.email||'';
 document.body.style.overflow='hidden';
 if(api&&!user)authEmail.focus();
}
function closeAuth(){authModal.hidden=true;document.body.style.overflow=''}
function openWizard(preset='',category=''){
 step=0;
 fields.description.value=preset;
 fields.category.value=category||'Products & services';
 fields.budget.value=$('needBudget').value.trim();
 fields.timeline.value=$('needTimeline').value;
 fields.location.value='';
 wizard.classList.add('open');wizard.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';drawStep();fields.description.focus();
}
function closeWizard(){wizard.classList.remove('open');wizard.setAttribute('aria-hidden','true');document.body.style.overflow='';wizard.dataset.editing=''}
function getData(){return {description:fields.description.value.trim(),category:fields.category.value,budget:fields.budget.value.trim(),timeline:fields.timeline.value,location:fields.location.value.trim()}}
function drawStep(){
 document.querySelectorAll('.v8-panel').forEach((p,i)=>p.classList.toggle('active',i===step));
 document.querySelectorAll('#v8Progress span').forEach((p,i)=>p.classList.toggle('active',i<=step));
 $('v8Progress').setAttribute('aria-label','Step '+(step+1)+' of 3');
 $('v8Back').textContent=step===0?'Cancel':'← Back';
 $('v8Next').textContent=step===2?'Save my NEED ✓':'Continue →';
 $('v8Error').textContent='';
 if(step===2){const d=getData();$('v8Preview').textContent='REQUEST\n'+d.description+'\n\nCATEGORY\n'+d.category+'\n\nBUDGET\n'+(d.budget||'Not specified')+'\n\nTIMELINE\n'+d.timeline+'\n\nLOCATION\n'+(d.location||'Not specified')+'\n\nSTORAGE\n'+(user?'Private Supabase account':'Local browser demo')}
}
async function removeItem(idx){
 const d=items[idx];if(!d||!confirm('Remove this NEED?'))return;
 if(user){
  const {error}=await api.from('needs').delete().eq('id',d.id).eq('user_id',user.id);
  if(error){message('Delete failed: '+error.message,'error');return}
 }else if(api){message('Please sign in to manage cloud requests.','error');openAuth();return}
 items.splice(idx,1);if(!api)saveLocal();render();
}
$('myNeedsList').addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-action]');if(!btn)return;
 const idx=Number(btn.dataset.index);const d=items[idx];if(!d)return;
 if(btn.dataset.action==='remove')await removeItem(idx);
 else if(btn.dataset.action==='view'){
  $('v11DetailTitle').textContent=d.description.length>95?d.description.slice(0,95)+'…':d.description;
  $('v11DetailText').textContent=d.description;
  $('v11DetailCategory').textContent=d.category;
  $('v11DetailBudget').textContent=d.budget||'Not specified';
  $('v11DetailTimeline').textContent=d.timeline;
  $('v11DetailLocation').textContent=d.location||'Not specified';
  $('v11DetailModal').hidden=false;document.body.style.overflow='hidden';
  $('v11DetailEdit').onclick=()=>{ $('v11DetailModal').hidden=true;document.body.style.overflow='';openWizard(d.description,d.category);fields.budget.value=d.budget;fields.timeline.value=d.timeline;fields.location.value=d.location||'';wizard.dataset.editing=String(idx)};
 }
 else{openWizard(d.description,d.category);fields.budget.value=d.budget;fields.timeline.value=d.timeline;fields.location.value=d.location||'';wizard.dataset.editing=String(idx)}
});
$('createNeedBtn').addEventListener('click',()=>{wizard.dataset.editing='';openWizard($('needText').value.trim())});
$('newRequestBtn').addEventListener('click',()=>{wizard.dataset.editing='';openWizard('')});
document.querySelectorAll('.chip').forEach(chip=>chip.addEventListener('click',()=>{$('needText').value=chip.dataset.fill||'';$('needText').focus()}));
document.querySelectorAll('[data-quick-category]').forEach(btn=>btn.addEventListener('click',()=>{wizard.dataset.editing='';openWizard('',categoryMap[btn.dataset.quickCategory])}));
$('v8Back').addEventListener('click',()=>{if(step===0)closeWizard();else{step--;drawStep()}});
$('v8Next').addEventListener('click',async()=>{
 const d=getData();
 if(step===0&&d.description.length<10){$('v8Error').textContent='Please describe your need in at least 10 characters.';fields.description.focus();return}
 if(step<2){step++;drawStep();return}
 if(!user&&api){closeWizard();openAuth();authMessageSet('Sign in to save this NEED to your cloud account. Your description is still available on the homepage.', '');$('needText').value=d.description;return}
 $('v8Next').disabled=true;$('v8Error').textContent='';
 const editing=wizard.dataset.editing;
 try{
  if(user){
   let result;
   if(editing!==''&&items[Number(editing)]) result=await api.from('needs').update(record(d)).eq('id',items[Number(editing)].id).eq('user_id',user.id).select().single();
   else result=await api.from('needs').insert({...record(d),user_id:user.id}).select().single();
   if(result.error)throw result.error;
   await loadCloud();
  }else{
   const draft={...d,id:editing!==''&&items[Number(editing)]?.id||String(Date.now()),createdAt:new Date().toISOString()};
   if(editing!==''&&items[Number(editing)])items[Number(editing)]=draft;else items.unshift(draft);
   saveLocal();render();
  }
  closeWizard();$('my-needs').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){$('v8Error').textContent='Could not save: '+(e.message||'Please try again.')}
 finally{$('v8Next').disabled=false}
});
$('v8Close').addEventListener('click',closeWizard);
wizard.addEventListener('click',e=>{if(e.target===wizard)closeWizard()});
$('v11DetailClose').addEventListener('click',()=>{$('v11DetailModal').hidden=true;document.body.style.overflow=''});
$('v11DetailModal').addEventListener('click',e=>{if(e.target.id==='v11DetailModal'){$('v11DetailModal').hidden=true;document.body.style.overflow=''}});
$('v10AccountButton').addEventListener('click',openAuth);
$('v10AuthClose').addEventListener('click',closeAuth);
authModal.addEventListener('click',e=>{if(e.target===authModal)closeAuth()});
$('v10AuthForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!api||user||authBusy)return;
 const email=authEmail.value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){authMessageSet('Enter a valid email address.','error');return}
 authBusy=true;$('v10AuthSubmit').disabled=true;authMessageSet('Sending sign-in email…');
 try{
  const {error}=await api.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+window.location.pathname}});
  if(error)throw error;
  authMessageSet('Check your inbox for a secure sign-in link. Use this same browser when you return.','success');
 }catch(err){authMessageSet('Could not send link: '+err.message,'error');$('v10AuthSubmit').disabled=false}
 finally{authBusy=false}
});
$('v10Logout').addEventListener('click',async()=>{
 if(!api||!user)return;
 const {error}=await api.auth.signOut();if(error){message('Sign out failed: '+error.message,'error');return}
 user=null;items=[];render();updateMode();closeAuth();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(wizard.classList.contains('open'))closeWizard();else if(!authModal.hidden)closeAuth()}});
if(api){
 api.auth.onAuthStateChange((event,session)=>{
  // Defer all API queries out of the auth callback to avoid deadlocks.
  setTimeout(async()=>{
    const next=session?.user||null;
    if(next?.id!==user?.id){
      user=next;items=[];render();updateMode();
      if(user){closeAuth();await loadCloud();}
    }
  },0);
 });
 api.auth.getUser().then(async({data,error})=>{if(error){message('Authentication error: '+error.message,'error');return}
  if(data?.user?.id!==user?.id){user=data?.user||null;items=[];render();updateMode();if(user)await loadCloud()}
 }).catch(e=>message('Could not check your account: '+e.message,'error'));
}
updateMode();render();
})();