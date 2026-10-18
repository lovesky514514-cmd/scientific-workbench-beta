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
