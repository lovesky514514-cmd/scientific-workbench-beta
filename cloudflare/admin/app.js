(()=>{
'use strict';const $=id=>document.getElementById(id);let token='',oneTime='';
const show=(id,value)=>$(id).textContent=String(value??'');
const cell=value=>{const t=document.createElement('td');t.textContent=String(value??'');return t;};
const btn=(label,action,danger=false)=>{const b=document.createElement('button');b.textContent=label;b.className=danger?'danger':'secondary';b.type='button';b.addEventListener('click',action);return b;};
const stamp=t=>t?new Date(t*1000).toLocaleString('zh-CN'):'—';
async function api(path,method='GET',data){
const res=await fetch(path,{method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store',credentials:'omit'});
let json;try{json=await res.json()}catch{throw Error('后台响应不可用')}
if(!res.ok||!json?.ok)throw Error(json?.message||'操作失败');return json;
}
async function refresh(){
const r=await api('/api/admin/state'),s=r.release;
for(const [field,key] of [['version','version'],['url','url'],['sha256','sha256'],['extraction','extractionCode'],['notes','notes']])$(field).value=s[key]||'';
$('applications').checked=s.applicationsOpen;$('claims').checked=s.claimsOpen;$('published').checked=s.published;
const apps=$('app-list');apps.replaceChildren();
for(const a of r.applications){const tr=document.createElement('tr');[a.id,a.email,a.status].forEach(v=>tr.append(cell(v)));
const action=cell('');if(a.status==='pending'){action.append(btn('关联签发',()=>{$('application-id').value=a.id;$('application-id').focus()}));action.append(btn('拒绝',()=>perform(async()=>{if(confirm('拒绝该申请？'))await api('/api/admin/applications/reject','POST',{id:a.id})}),true));}
action.append(btn('删除邮箱',()=>perform(async()=>{if(confirm('永久删除此邮箱记录？'))await api('/api/admin/applications/delete','POST',{id:a.id})}),true));tr.append(action);apps.append(tr);}
const testers=$('tester-list');testers.replaceChildren();
for(const i of r.invitations){const tr=document.createElement('tr');[i.testerNumber,i.expires_at?'至 '+stamp(i.expires_at):'长期有效',i.revoked_at?'已撤销':'已签发'].forEach(v=>tr.append(cell(v)));
const action=cell('');if(!i.revoked_at)action.append(btn('撤销',()=>perform(async()=>{if(confirm('撤销 '+i.testerNumber+'？'))await api('/api/admin/invitations/revoke','POST',{testerNumber:i.testerNumber})}),true));tr.append(action);testers.append(tr);}
$('feedback').replaceChildren();for(const f of r.feedback){const p=document.createElement('p');p.textContent='FB-'+f.id+' #'+f.tester_seq+' '+f.title+' — '+f.details;$('feedback').append(p);}
$('management').hidden=false;
}
async function perform(action){try{await action();await refresh()}catch(e){alert(e.message)}}
$('auth').addEventListener('submit',async e=>{e.preventDefault();token=$('token').value.trim();$('token').value='';try{await refresh();show('auth-message','已连接（此页面有效）')}catch(e){token='';$('management').hidden=true;show('auth-message',e.message)}});
$('release').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/release','POST',{
version:$('version').value,url:$('url').value,sha256:$('sha256').value,extractionCode:$('extraction').value,notes:$('notes').value,
applicationsOpen:$('applications').checked,claimsOpen:$('claims').checked,published:$('published').checked});
show('release-message','已保存');}catch(err){show('release-message',err.message)}});
$('issue').addEventListener('submit',async e=>{e.preventDefault();show('issue-message','');show('issued-secret','');$('issued').hidden=true;oneTime='';
try{const input=$('application-id').value.trim();const r=await api('/api/admin/invitations','POST',{applicationId:input?Number(input):null});
oneTime=r.inviteCode;show('issued-number',r.testerNumber+' · '+(r.expiresAt?stamp(r.expiresAt):'长期有效'));show('issued-secret',oneTime);$('issued').hidden=false;show('issue-message','仅显示一次，请私下交付');await refresh();}catch(err){show('issue-message',err.message)}});
$('copy').addEventListener('click',async()=>{if(oneTime)try{await navigator.clipboard.writeText(oneTime)}catch{show('issue-message','复制失败，请手动复制')}});
$('refresh').addEventListener('click',()=>perform(async()=>{}));
$('cleanup').addEventListener('click',()=>perform(()=>api('/api/admin/cleanup','POST',{})));
})();