import test from 'node:test';import assert from 'node:assert/strict';import worker from '../src/index.mjs';
test('unconfigured Worker remains closed',async()=>{const r=await worker.fetch(new Request('https://example.workers.dev/api/status'),{});assert.equal(r.status,503);assert.equal((await r.json()).ok,false)});
test('CORS approval',async()=>{const a=await worker.fetch(new Request('https://example.workers.dev/api/status',{method:'OPTIONS',headers:{Origin:'https://lovesky514514-cmd.github.io'}}),{});assert.equal(a.status,204);const b=await worker.fetch(new Request('https://example.workers.dev/api/status',{method:'OPTIONS',headers:{Origin:'https://evil.example'}}),{});assert.equal(b.status,403);});

test('admin static assets use canonical root paths instead of /index.html redirect',async()=>{
 const paths=[];
 const ASSETS={fetch:async request=>{
  const path=new URL(request.url).pathname;paths.push(path);
  if(path==='/index.html')return new Response(null,{status:308,headers:{Location:'/'}});
  return new Response(path==='/'?'<h1>发行管理</h1>':'asset',{status:200,headers:{'Content-Type':path==='/'?'text/html':'text/plain'}});
 }};
 for(const [input,expected] of [['/admin','/'],['/admin/','/'],['/admin/app.js','/app.js'],['/admin/style.css','/style.css']]){
  const response=await worker.fetch(new Request('https://example.workers.dev'+input),{ASSETS});
  assert.equal(response.status,200,input);
  assert.equal(paths.at(-1),expected,input);
 }
 const home=await worker.fetch(new Request('https://example.workers.dev/'),{ASSETS});
 assert.equal(home.status,404);
});

// A beta tester identity has no automatic expiration; the session token can still expire.
test('new invitations are perpetual and old expiresDays input is ignored',async()=>{
 const writes=[];
 const DB={prepare(sql){return{bind(...args){writes.push({sql,args});return{
  first:async()=>sql.startsWith('INSERT INTO rate_limits')?{hits:1}:sql.startsWith('INSERT INTO invitations')?{seq:1}:null,
  run:async()=>({meta:{changes:1}})
 };}}}};
 const env={DB,HMAC_PEPPER:'pepper-secret-'.repeat(5),ADMIN_TOKEN:'admin-secret-'.repeat(5)};
 const response=await worker.fetch(new Request('https://example.workers.dev/api/admin/invitations',{
  method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.ADMIN_TOKEN},
  body:JSON.stringify({applicationId:null,expiresDays:2})
 }),env);
 assert.equal(response.status,200);
 const result=await response.json();assert.equal(result.testerNumber.length,5);
 assert.match(result.testerNumber,/^001[A-Z]{2}$/);
 assert.equal(result.expiresAt,null);
 assert.ok(typeof result.inviteCode==='string'&&result.inviteCode.length>=32);
 const insert=writes.find(w=>w.sql.startsWith('INSERT INTO invitations'));
 assert.ok(insert);assert.equal(insert.args[3],null);
});

// The keypair and web session here are ephemeral synthetic fixtures. No real
// invitation, production session, signing Secret or tester record is embedded.
test('offline license requires a verified session and has a valid Ed25519 signature',async()=>{
 const keys=await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);
 const privateBytes=new Uint8Array(await crypto.subtle.exportKey('pkcs8',keys.privateKey));
 const publicBytes=new Uint8Array(await crypto.subtle.exportKey('raw',keys.publicKey));
 const session=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
 const DB={prepare(sql){return{bind(){return{first:async()=>sql.startsWith('INSERT INTO rate_limits')?{hits:1}:sql.startsWith('SELECT i.seq')?{seq:777,suffix:'ZZ'}:null}} ,first:async()=>sql.startsWith('SELECT * FROM release_settings')?{claims_open:1}:null}}};
 const env={DB,HMAC_PEPPER:'synthetic-test-pepper-'.repeat(3),LICENSE_KEY_ID:'ephemeral-test',LICENSE_ED25519_PKCS8_B64:Buffer.from(privateBytes).toString('base64')};
 const url='https://example.workers.dev/api/activation/license';
 assert.equal((await worker.fetch(new Request(url,{method:'POST'}),env)).status,401);
 const response=await worker.fetch(new Request(url,{method:'POST',headers:{Authorization:'Bearer '+session}}),env);
 assert.equal(response.status,200);
 const body=await response.json(),license=body.license;
 assert.equal(license.format,'swb-beta-license-v1');
 const decode=value=>Buffer.from(value.replace(/-/g,'+').replace(/_/g,'/'),'base64');
 const payload=decode(license.payload),signature=decode(license.signature);
 assert.equal(JSON.parse(payload).testerNumber,'777ZZ');
 assert.equal(JSON.parse(payload).scope,'desktop-beta');
 assert.equal(await crypto.subtle.verify('Ed25519',await crypto.subtle.importKey('raw',publicBytes,{name:'Ed25519'},false,['verify']),signature,payload),true);
 const altered=Buffer.from(JSON.stringify({...JSON.parse(payload),testerNumber:'999ZZ'}));
 assert.equal(await crypto.subtle.verify('Ed25519',keys.publicKey,signature,altered),false);
 const noKey={...env,LICENSE_ED25519_PKCS8_B64:undefined};
 assert.equal((await worker.fetch(new Request(url,{method:'POST',headers:{Authorization:'Bearer '+session}}),noKey)).status,503);
});

test('missing Turnstile cannot create a tester session or offline license',async()=>{
 const DB={prepare(sql){return{bind(){return{first:async()=>sql.startsWith('INSERT INTO rate_limits')?{hits:1}:null}},first:async()=>sql.startsWith('SELECT * FROM release_settings')?{claims_open:1}:null}}};
 const env={DB,HMAC_PEPPER:'synthetic-test-pepper-'.repeat(3),TURNSTILE_SECRET:'synthetic-test-secret'};
 const response=await worker.fetch(new Request('https://example.workers.dev/api/invite/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:'synthetic-not-a-real-invitation-code',turnstileToken:''})}),env);
 assert.equal(response.status,403);
});

test('wrong synthetic invitation is rejected after a synthetic Turnstile success',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({success:true,hostname:'example.test'}),{status:200,headers:{'Content-Type':'application/json'}}));
 const DB={prepare(sql){return{bind(){return{first:async()=>sql.startsWith('INSERT INTO rate_limits')?{hits:1}:null}},first:async()=>sql.startsWith('SELECT * FROM release_settings')?{claims_open:1}:null}}};
 const env={DB,HMAC_PEPPER:'synthetic-test-pepper-'.repeat(3),TURNSTILE_SECRET:'synthetic-test-secret',TURNSTILE_HOSTNAMES:'example.test'};
 const response=await worker.fetch(new Request('https://example.workers.dev/api/invite/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:'synthetic-not-a-real-invitation-code',turnstileToken:'synthetic-captcha'})}),env);
 assert.equal(response.status,401);
});
