/* Cloudflare Worker private beta API. No credentials or download links in public source.
   Fail closed until D1, Turnstile, and secrets are configured. */
import {SITE_ORIGIN,testerLabel,normalizeTesterNumber,suffixLetters,validateRelease,validEmail,cleanFeedback} from './core.mjs';
class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
const stop=(status,message)=>{throw new ApiError(status,message);};
const sec=()=>Math.floor(Date.now()/1000);
const ok=(data={})=>({ok:true,...data});
const randomBytes=n=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return b;};
const randomToken=()=>Array.from(randomBytes(32),x=>x.toString(16).padStart(2,'0')).join('');
function randomSuffix(){for(;;){try{return suffixLetters(randomBytes(16));}catch{/* retry */}}}
const originFor=env=>env.PUBLIC_ORIGIN||SITE_ORIGIN;
const baseHeaders=()=>({'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-site','Vary':'Origin'});
function headers(request,env){
 const out={...baseHeaders(),'Content-Type':'application/json; charset=utf-8'},origin=request.headers.get('Origin');
 if(origin==originFor(env)||origin===new URL(request.url).origin){
  out['Access-Control-Allow-Origin']=origin;out['Access-Control-Allow-Headers']='Content-Type, Authorization';
  out['Access-Control-Allow-Methods']='GET, POST, OPTIONS';out['Access-Control-Max-Age']='600';
 }
 return out;
}
const response=(req,env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(req,env)});
function requireOrigin(req,env){
 const origin=req.headers.get('Origin');
 if(origin&&origin!==originFor(env)&&origin!==new URL(req.url).origin)stop(403,'请求来源不允许');
}
async function readBody(req,limit=8192){
 if(Number(req.headers.get('Content-Length')||0)>limit)stop(413,'请求内容过长');
 if(!(req.headers.get('Content-Type')||'').toLowerCase().includes('application/json'))stop(415,'请求格式错误');
 const str=await req.text();if(str.length>limit)stop(413,'请求内容过长');
 let data;try{data=JSON.parse(str)}catch{stop(400,'请求格式错误')}
 if(!data||typeof data!=='object'||Array.isArray(data))stop(400,'请求格式错误');
 return data;
}
async function hmac(secret,type,value){
 if(!secret||secret.length<32)stop(503,'服务未配置');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const buf=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(type+':'+value));
 return Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');
}
async function sameSecret(a,b){
 if(!a||!b||typeof a!=='string'||typeof b!=='string')return false;
 const enc=new TextEncoder();
 const [aa,bb]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(a)),crypto.subtle.digest('SHA-256',enc.encode(b))]);
 let diff=0;const x=new Uint8Array(aa),y=new Uint8Array(bb);
 for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
 return diff===0;
}
async function rate(req,env,name,limit,duration=600){
 const ip=req.headers.get('CF-Connecting-IP')||'unknown',key=await hmac(env.HMAC_PEPPER,'rate',name+':'+ip);
 const bucket=Math.floor(sec()/duration);
 const row=await env.DB.prepare('INSERT INTO rate_limits(key,bucket,hits,expires_at) VALUES(?,?,1,?) ON CONFLICT(key,bucket) DO UPDATE SET hits=hits+1 RETURNING hits')
 .bind(key,bucket,(bucket+1)*duration).first();
 if(!row||row.hits>limit)stop(429,'操作太频繁，请稍后再试');
}
async function turnstile(req,env,value){
 if(typeof value!=='string'||!value||value.length>2048||!env.TURNSTILE_SECRET)stop(403,'人机验证未通过');
 const hosts=String(env.TURNSTILE_HOSTNAMES||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(!hosts.length)stop(503,'验证服务尚未配置');
 const form=new FormData();form.set('secret',env.TURNSTILE_SECRET);form.set('response',value);
 const ip=req.headers.get('CF-Connecting-IP');if(ip)form.set('remoteip',ip);
 let verified;
 try{const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form,signal:AbortSignal.timeout(8000)});
 verified=res.ok?await res.json():null;}catch{stop(503,'人机验证服务暂不可用');}
 if(!verified?.success||!hosts.includes(verified.hostname))stop(403,'人机验证未通过');
}
function bearer(req){const m=/^Bearer (\S+)$/i.exec(req.headers.get('Authorization')||'');return m?m[1]:'';}
async function admin(req,env){
 if(!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<40)stop(503,'管理员权限尚未配置');
 if(!(await sameSecret(bearer(req),env.ADMIN_TOKEN)))stop(401,'管理员授权失败');
}
async function releaseSettings(env){
 const row=await env.DB.prepare('SELECT * FROM release_settings WHERE id=1').first();
 if(!row)stop(503,'数据库尚未初始化');return row;
}
async function tester(req,env){
 const token=bearer(req);if(!/^[a-f0-9]{64}$/.test(token))stop(401,'邀请码会话已过期或撤销');
 const digest=await hmac(env.HMAC_PEPPER,'session',token);
 const row=await env.DB.prepare('SELECT i.seq,i.suffix FROM tester_sessions s INNER JOIN invitations i ON i.seq=s.tester_seq WHERE s.token_hmac=? AND s.expires_at>? AND i.revoked_at IS NULL AND (i.expires_at IS NULL OR i.expires_at>?)')
 .bind(digest,sec(),sec()).first();
 if(!row)stop(401,'邀请码会话已过期或撤销');
 const settings=await releaseSettings(env);if(settings.claims_open!==1)stop(403,'领取暂未开放');
 return{...row,settings};
}
async function handle(req,env,path){
 const method=req.method.toUpperCase();requireOrigin(req,env);
 if(!env.DB||!env.HMAC_PEPPER||env.HMAC_PEPPER.length<32)stop(503,'服务尚未配置');
 if(method==='GET'&&path==='/api/status'){
  const s=await releaseSettings(env);
  return ok({applicationsOpen:s.applications_open===1,claimsOpen:s.claims_open===1,published:s.published===1,version:s.published===1?s.version:''});
 }
 if(method==='POST'&&path==='/api/applications'){
  await rate(req,env,'apply',5);const body=await readBody(req),s=await releaseSettings(env);
  if(s.applications_open!==1)stop(403,'申请暂未开放');
  if(body.consent!==true||!validEmail(body.email)||body.website)stop(400,'邮箱或同意信息不符合要求');
  await turnstile(req,env,body.turnstileToken);
  const email=body.email.trim().toLowerCase(),now=sec();
  await env.DB.prepare("INSERT OR IGNORE INTO applications(email,status,consent_at,created_at,updated_at) VALUES(?,'pending',?,?,?)")
   .bind(email,now,now,now).run();
  return ok({message:'申请已接收；如符合要求将由管理员人工联系。'});
 }
 if(method==='POST'&&path==='/api/invite/verify'){
  await rate(req,env,'invite',8);const body=await readBody(req),s=await releaseSettings(env);
  if(s.claims_open!==1)stop(403,'领取暂未开放');
  if(typeof body.code!=='string'||body.code.length<20||body.code.length>128)stop(401,'邀请码无效或已过期');
  await turnstile(req,env,body.turnstileToken);
  const digest=await hmac(env.HMAC_PEPPER,'invite',body.code.trim());
  const found=await env.DB.prepare('SELECT seq,suffix FROM invitations WHERE code_hmac=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?)')
   .bind(digest,sec()).first();
  if(!found)stop(401,'邀请码无效或已过期');
  const token=randomToken(),hash=await hmac(env.HMAC_PEPPER,'session',token);
  await env.DB.prepare('INSERT INTO tester_sessions(token_hmac,tester_seq,expires_at,created_at) VALUES(?,?,?,?)')
   .bind(hash,found.seq,sec()+3600,sec()).run();
  return ok({token,testerNumber:testerLabel(found.seq,found.suffix)});
 }
 if(method==='GET'&&path==='/api/me'){
  const {seq,suffix,settings:s}=await tester(req,env);
  const release=s.published===1&&s.download_url&&s.sha256?{
   version:s.version,url:s.download_url,sha256:s.sha256,extractionCode:s.extraction_code,notes:s.notes}:null;
  return ok({testerNumber:testerLabel(seq,suffix),release});
 }
 if(method==='POST'&&path==='/api/feedback'){
  await rate(req,env,'feedback',15,3600);const {seq}=await tester(req,env);
  const data=cleanFeedback(await readBody(req,6000));
  const result=await env.DB.prepare('INSERT INTO feedback(tester_seq,kind,severity,title,details,error_code,version,created_at) VALUES(?,?,?,?,?,?,?,?)')
   .bind(seq,data.kind,data.severity,data.title,data.details,data.errorCode,data.version,sec()).run();
  return ok({reportId:'FB-'+String(result.meta?.last_row_id||'').padStart(6,'0')});
 }
 if(path.startsWith('/api/admin/')){
  await rate(req,env,'admin',50);await admin(req,env);
  if(method==='GET'&&path==='/api/admin/state'){
   const s=await releaseSettings(env);
   const apps=await env.DB.prepare('SELECT id,email,status,created_at FROM applications ORDER BY id DESC LIMIT 100').all();
   const codes=await env.DB.prepare('SELECT seq,suffix,application_id,created_at,expires_at,revoked_at FROM invitations ORDER BY seq DESC LIMIT 100').all();
   const feedback=await env.DB.prepare('SELECT id,tester_seq,kind,severity,title,details,error_code,version,created_at FROM feedback ORDER BY id DESC LIMIT 50').all();
   return ok({release:{version:s.version,url:s.download_url,sha256:s.sha256,extractionCode:s.extraction_code,notes:s.notes,
    applicationsOpen:s.applications_open===1,claimsOpen:s.claims_open===1,published:s.published===1},
    applications:apps.results,invitations:codes.results.map(i=>({...i,testerNumber:testerLabel(i.seq,i.suffix)})),feedback:feedback.results});
  }
  if(method==='POST'&&path==='/api/admin/release'){
   const v=validateRelease(await readBody(req));
   await env.DB.prepare('UPDATE release_settings SET version=?,download_url=?,sha256=?,extraction_code=?,notes=?,applications_open=?,claims_open=?,published=?,updated_at=? WHERE id=1')
    .bind(v.version,v.url,v.sha256,v.extractionCode,v.notes,Number(v.applicationsOpen),Number(v.claimsOpen),Number(v.published),sec()).run();
   return ok({message:'发行设置已保存（实际开放仍受后端权限控制）'});
  }
  if(method==='POST'&&path==='/api/admin/invitations'){
   const body=await readBody(req),days=body.expiresDays===undefined?30:Number(body.expiresDays);
   if(!Number.isInteger(days)||days<1||days>365)stop(400,'有效期必须为 1–365 天');
   const applicationId=body.applicationId===undefined||body.applicationId===null||body.applicationId===''?null:Number(body.applicationId);
   if(applicationId!==null&&(!Number.isSafeInteger(applicationId)||applicationId<1))stop(400,'申请编号无效');
   if(applicationId!==null){
    const found=await env.DB.prepare("SELECT id FROM applications WHERE id=? AND status='pending'").bind(applicationId).first();
    if(!found)stop(409,'关联申请不存在或不再等待审核');
   }
   const issued='SWB-'+randomToken(),digest=await hmac(env.HMAC_PEPPER,'invite',issued),expires=sec()+days*86400,suffix=randomSuffix();
   let seq;
   try{
    const insert=env.DB.prepare("INSERT INTO invitations(suffix,code_hmac,application_id,expires_at,created_at) SELECT ?,?,?,?,? WHERE (? IS NULL OR EXISTS(SELECT 1 FROM applications WHERE id=? AND status='pending')) RETURNING seq")
     .bind(suffix,digest,applicationId,expires,sec(),applicationId,applicationId);
    if(applicationId===null){seq=(await insert.first())?.seq;}
    else{
     const batch=await env.DB.batch([insert,env.DB.prepare("UPDATE applications SET status='approved',updated_at=? WHERE id=? AND status='pending'").bind(sec(),applicationId)]);
     seq=batch[0]?.results?.[0]?.seq;if(batch[1]?.meta?.changes!==1)stop(409,'该申请状态已改变');
    }
   }catch(e){if(e instanceof ApiError)throw e;stop(409,'签发失败，可能达到 999 名额或申请状态冲突');}
   if(!seq)stop(503,'数据库未返回签发编号');
   return ok({testerNumber:testerLabel(seq,suffix),inviteCode:issued,expiresAt:expires,message:'签发成功；邀请码仅显示一次，请私下发送。'});
  }
  if(method==='POST'&&path==='/api/admin/invitations/revoke'){
   const id=normalizeTesterNumber((await readBody(req)).testerNumber);if(!id)stop(400,'测试号格式必须为 001SJ');
   const row=await env.DB.prepare('UPDATE invitations SET revoked_at=? WHERE seq=? AND suffix=? AND revoked_at IS NULL')
    .bind(sec(),Number(id.slice(0,3)),id.slice(3)).run();
   if(row.meta?.changes!==1)stop(404,'编号不存在或已撤销');
   await env.DB.prepare('DELETE FROM tester_sessions WHERE tester_seq=?').bind(Number(id.slice(0,3))).run();
   return ok({message:'已撤销资格，相关会话失效'});
  }
  if(method==='POST'&&path==='/api/admin/applications/reject'){
   const id=Number((await readBody(req)).id);if(!Number.isSafeInteger(id)||id<1)stop(400,'申请编号无效');
   const row=await env.DB.prepare("UPDATE applications SET status='rejected',updated_at=? WHERE id=? AND status='pending'").bind(sec(),id).run();
   if(row.meta?.changes!==1)stop(409,'申请不存在或不是待审状态');
   return ok({message:'已拒绝申请'});
  }
  if(method==='POST'&&path==='/api/admin/applications/delete'){
   const id=Number((await readBody(req)).id);if(!Number.isSafeInteger(id)||id<1)stop(400,'申请编号无效');
   const row=await env.DB.prepare('DELETE FROM applications WHERE id=?').bind(id).run();
   if(row.meta?.changes!==1)stop(404,'申请不存在');
   return ok({message:'申请邮箱已删除（测试号匿名历史保留）'});
  }
  if(method==='POST'&&path==='/api/admin/cleanup'){
   const now=sec();await env.DB.batch([
    env.DB.prepare('DELETE FROM tester_sessions WHERE expires_at<?').bind(now),
    env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now)]);
   return ok({message:'已清理过期会话和临时限流记录'});
  }
 }
 stop(404,'接口不存在');
}
export default{
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(['/admin','/admin/','/admin/app.js','/admin/style.css'].includes(path)){
   if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:baseHeaders()});
   if(!env.ASSETS)return new Response('Assets unavailable',{status:503,headers:baseHeaders()});
   const url=new URL(request.url);url.pathname=path==='/admin'||path==='/admin/'?'/':'/'+path.split('/').pop();
   const asset=await env.ASSETS.fetch(new Request(url,request)),h=new Headers(asset.headers);
   for(const [k,v] of Object.entries(baseHeaders()))h.set(k,v);
   h.set('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
   return new Response(asset.body,{status:asset.status,headers:h});
  }
  if(!path.startsWith('/api/'))return new Response('Not Found',{status:404,headers:baseHeaders()});
  if(request.method==='OPTIONS'){
   const origin=request.headers.get('Origin'),allowed=origin===originFor(env)||origin===new URL(request.url).origin;
   return new Response(null,{status:allowed?204:403,headers:headers(request,env)});
  }
  try{return response(request,env,await handle(request,env,path));}
  catch(e){return e instanceof ApiError?response(request,env,{ok:false,message:e.message},e.status):
   response(request,env,{ok:false,message:'服务暂时不可用，请联系管理员'},503);}
 }
};