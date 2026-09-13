const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('../../../back/node_modules/typescript');
const crypto = require('node:crypto').webcrypto;
const source = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../../src/lib/offlineSync.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const userA={id:'alice',schoolId:'school-a',role:'TEACHER'};
const userB={id:'bob',schoolId:'school-b',role:'TEACHER'};
function harness({write=async()=>new Response('{}'),storage=new Map(),session=userA,failStorage=false}={}) {
  storage.set('school_admin_user', JSON.stringify(session)); storage.set('school_admin_token','cookie_auth');
  const sent=[],timers=[],events={};
  const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(failStorage)throw new Error('quota exceeded');storage.set(k,v)},removeItem:k=>storage.delete(k)};
  let currentSession=session;
  const fetch=async(url,init)=>{
    if(String(url).endsWith('/auth/session'))return Response.json({user:currentSession});
    sent.push({url,init}); return write(url,init);
  };
  const window={location:{origin:'https://lms.test',pathname:'/school-admin/courses'},addEventListener:(k,v)=>events[k]=v,fetch};
  const module={exports:{}};
  vm.runInNewContext(source,{module,exports:module.exports,console,window,localStorage,navigator:{onLine:true},fetch,Headers,Response,Request,URL,AbortSignal,crypto,atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length},clearTimeout:()=>{}});
  return {queue:module.exports.offlineSync,sent,storage,timers,exports:module.exports,setUser:user=>{currentSession=user;storage.set('school_admin_user',JSON.stringify(user))}};
}
const item=(body='A',method='PUT')=>({url:'https://lms.test/api/courses/1',method,headers:{'Content-Type':'application/json',Authorization:'Bearer cookie_auth'},body});
const ready=()=>new Promise(r=>setImmediate(r));
test('success of old revision must leave new unsent revision queued',async()=>{
  let finish,started; const began=new Promise(r=>started=r);
  const h=harness({write:()=>{started();return new Promise(r=>finish=r)}});await ready();
  await h.queue.enqueue(item('A'));const flushing=h.queue.flush();await began;
  await h.queue.enqueue(item('B'));finish(new Response('{}'));await flushing;
  assert.deepEqual(Array.from(h.queue.getPending(),e=>e.body),['B']);
});
for(const status of [400,403,409,422,429,500])test(`HTTP ${status} preserves queued work and exposes error`,async()=>{
 const h=harness({write:async()=>new Response('{}',{status,headers:{'Retry-After':'60'}})});await ready();await h.queue.enqueue(item());await h.queue.flush();
 assert.equal(h.queue.getPending().length,1);assert.ok(h.queue.getState().lastError);
 if(status===429)assert.ok(h.timers.some(t=>t.ms>=60000));
});
test('distinct POST operations are retained separately',async()=>{const h=harness();await ready();await h.queue.enqueue(item('first','POST'));await h.queue.enqueue(item('second','POST'));assert.deepEqual(Array.from(h.queue.getPending(),e=>e.body),['first','second']);});
test('distinct PATCH operations are not collapsed',async()=>{const h=harness();await ready();await h.queue.enqueue(item('{"title":"x"}','PATCH'));await h.queue.enqueue(item('{"grade":"y"}','PATCH'));assert.equal(h.queue.getPending().length,2);});
test('different current account cannot replay prior account work',async()=>{const h=harness();await ready();await h.queue.enqueue(item());h.setUser(userB);await h.queue.flush();assert.equal(h.sent.length,0);assert.equal(h.queue.getPending().length,1);assert.ok(h.queue.getState().lastError);});
test('queued writes carry atomic owner guard and never persist bearer credentials',async()=>{const h=harness();await ready();await h.queue.enqueue(item());await h.queue.flush();assert.equal(h.sent.length,1);const headers=new Headers(h.sent[0].init.headers);assert.equal(headers.get('X-Offline-User-Id'),'alice');assert.equal(headers.get('X-Offline-School-Id'),'school-a');assert.equal(headers.get('Authorization'),null);assert.equal(h.queue.getPending().length,0);});
test('unattributed legacy saves are retained without automatic replay',async()=>{const storage=new Map([['lms_offline_sync_queue',JSON.stringify([{...item(),id:'old',enqueuedAt:'2026-01-01',attempts:0}])]]);const h=harness({storage});await ready();await h.queue.flush();assert.equal(h.sent.length,0);assert.equal(h.queue.getPending().length,1);assert.ok(h.queue.getState().lastError);});
test('enqueue resolves only after storage is updated and reload keeps changes',async()=>{const h=harness();await ready();await h.queue.enqueue(item());const next=harness({storage:h.storage});await ready();assert.equal(next.queue.getPending().length,1);});
test('browser storage failure is visible and rejects durable enqueue',async()=>{const h=harness({failStorage:true});await ready();await assert.rejects(async()=>h.queue.enqueue(item()));assert.equal(h.queue.getPending().length,1);assert.ok(h.queue.getState().lastError);});
test('queued external origins are not replayed',async()=>{const h=harness();await ready();await h.queue.enqueue({...item(),url:'https://evil.invalid/api/courses/1'});await h.queue.flush();assert.equal(h.sent.length,0);assert.equal(h.queue.getPending().length,1);});
test('POST from ambiguous failed request requires review before any replay',async()=>{const h=harness();await ready();await h.queue.enqueue(item('create','POST'));await h.queue.flush();assert.equal(h.sent.length,0);assert.equal(h.queue.getPending().length,1);assert.ok(h.queue.getState().lastError);});
test('draft storage keys differ across accounts',async()=>{const h=harness();await ready();assert.equal(typeof h.queue.getDraftStorageKey,'function');const first=h.queue.getDraftStorageKey('course-1');h.setUser(userB);assert.notEqual(h.queue.getDraftStorageKey('course-1'),first);});
test('partial PUT updates at same URL preserve both bodies',async()=>{const h=harness();await ready();await h.queue.enqueue(item('{"name":"A"}'));await h.queue.enqueue(item('{"status":"SUSPENDED"}'));assert.deepEqual(Array.from(h.queue.getPending(),e=>e.body),['{"name":"A"}','{"status":"SUSPENDED"}']);});
test('reloaded queue replays chronological order rather than storage key order',async()=>{const entry=(id,body,time)=>({...item(body),id,enqueuedAt:time,attempts:0,owner:{userId:'alice',schoolId:'school-a'}});const storage=new Map([['lms_offline_sync_queue',JSON.stringify([entry('a','new','2026-09-07T00:00:02.000Z'),entry('z','old','2026-09-07T00:00:01.000Z')])]]);const h=harness({storage});await ready();await h.queue.flush();assert.deepEqual(h.sent.map(s=>s.init.body),['old','new']);});
test('a rejected earlier update prevents newer writes overtaking it',async()=>{const h=harness({write:async()=>new Response('{}',{status:409})});await ready();await h.queue.enqueue(item('old'));await h.queue.enqueue(item('new'));await h.queue.flush();assert.deepEqual(h.sent.map(s=>s.init.body),['old']);assert.equal(h.queue.getPending().length,2);});
test('a second tab does not resend an entry acknowledged by the first tab',async()=>{const first=harness();await ready();await first.queue.enqueue(item());const second=harness({storage:first.storage});await ready();await first.queue.flush();await second.queue.flush();assert.equal(second.sent.length,0);assert.equal(second.queue.getPending().length,0);});
test('explicit forceAll flush replays pending POST request after user confirmation',async()=>{const h=harness();await ready();await h.queue.enqueue(item('create','POST'));await h.queue.flush({forceAll:true});assert.equal(h.sent.length,1);assert.equal(h.queue.getPending().length,0);assert.equal(h.queue.getState().lastError,null);});

