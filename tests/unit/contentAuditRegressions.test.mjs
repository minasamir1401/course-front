import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(file,mocks={}) {
  const source=fs.readFileSync(new URL(file,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  const dependencies=name=>name in mocks ? mocks[name] : name.endsWith('.css') ? {} : require(name);
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(dependencies,module,module.exports);
  return module.exports;
}
const {processHtml}=load('../../src/components/HtmlRenderer.tsx',{'../lib/sanitize':{sanitizeHtml:x=>x},'../lib/utils':{resolveMediaUrl:x=>x}});
test('fractions inside explicit math render once with no nested delimiters or KaTeX error',()=>{
 for(const html of [
   String.raw`\(x=\ln(18/5)\)`,
   String.raw`$x=\ln(18/5)$`,
   String.raw`\[x=\ln(18/5)\]`,
   String.raw`\(x=(\ln(\(\frac{18}{5}))\)`,
   String.raw`x=(\ln(\(\frac{18}{5}))\)`,
   String.raw`\(A(t) = 800(1.15)^t, approximately 1399mg\)`,
   String.raw`$A(t) = 800(0.85)^t, approximately 418mg$`
 ]) {
   const rendered=processHtml(html); assert.match(rendered,/katex/); assert.doesNotMatch(rendered,/katex-error/); assert.doesNotMatch(rendered,/\\\(/);
 }
 assert.match(processHtml('Fraction 4/5'),/katex/);
});
test('HTML attributes and images remain intact while math renders',()=>{
 const html=processHtml('<img src="/uploads/image.webp" data-number="18/5" loading="lazy">','eager');
 assert.match(html,/data-number="18\/5"/); assert.match(html,/loading="eager"/); assert.match(html,/srcset=/); assert.doesNotMatch(html,/loading="lazy"/);
});
test('both new exam save hooks publish standalone and nested questions',async()=>{
 for(const role of ['super-admin','school-admin']) {
  let submitted;
  const api={API_URL:'http://localhost/api',apiFetch:async(_url,init)=>{submitted=JSON.parse(init.body);return Response.json({exam:{id:'created'}});}};
  const editing=load('../../src/lib/examEditingPayload.ts');
  const {useExamSubmit}=load('../../src/app/'+role+'/exams/new/hooks/useExamSubmit.ts',{'@/lib/api':api,'@/lib/examEditingPayload':editing,'@/lib/moduleCreationWorkflow':{buildCreatedModulePortalHref:()=>null}});
  const old=globalThis.localStorage;globalThis.localStorage={getItem:()=> 'cookie_auth'};
  try {
   await useExamSubmit({examData:{title:'Standalone',duration:60,passingScore:0,grades:['Grade'],subjects:['Math']},modules:[],standaloneQuestions:[{text:'Question one',id:'q-one'}],manualSubmitRef:{current:false},autoSaveGenerationRef:{current:0},autoSaveTimerRef:{current:null},autoSaveWriteQueueRef:{current:Promise.resolve()},createdIdRef:{current:null},setIsLoading:()=>{},showToast:message=>{if(message?.includes('Failed'))throw Error(message);},language:'en',router:{push:()=>{}},moduleMode:false}).handleSubmit({preventDefault:()=>{}});
   assert.equal(submitted.questions.length,1);assert.equal(submitted.questions[0].text,'Question one');assert.equal(submitted.status,'PUBLISHED');
  } finally { if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old; }
 }
});
test('upload proxy streams before upstream finishes and does not cache 404s',async t=>{
 const helpers=load('../../src/lib/apiProxy.ts');
 const route=load('../../src/app/uploads/[...path]/route.ts',{'@/lib/apiProxy':helpers});
 const req=new Request('http://localhost/uploads/test.webp');req.nextUrl=new URL(req.url);
 let controller; const body=new ReadableStream({start(c){controller=c;c.enqueue(new Uint8Array([1,2]));}});
 t.mock.method(globalThis,'fetch',async()=>new Response(body,{headers:{'content-type':'image/webp'}}));
 const res=await route.GET(req,{params:Promise.resolve({path:['test.webp']})});
 const reader=res.body.getReader();assert.deepEqual((await reader.read()).value,new Uint8Array([1,2]));controller.close();await reader.read();
 globalThis.fetch=async()=>new Response('missing',{status:404}); const missing=await route.GET(req,{params:Promise.resolve({path:['missing']})});assert.equal(missing.headers.get('Cache-Control'),'no-store');await missing.text();
 globalThis.fetch=async()=>new Response(null,{status:304});const conditional=await route.GET(req,{params:Promise.resolve({path:['test.webp']})});assert.equal(conditional.status,304);assert.equal(conditional.body,null);
});
