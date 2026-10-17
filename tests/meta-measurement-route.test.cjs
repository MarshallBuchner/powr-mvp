const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
function route(send) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync('app/api/marketing/complete/route.ts','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
  }).outputText;
  vm.runInNewContext(js, {exports, require: name => name === 'next/server' ? {NextRequest,NextResponse} : {
    MEASUREMENT_COOKIE:'powr_meta_completion',
    verifyMeasurementReceipt: value => value === 'valid-proof' ? {id:'event-1'} : null,
    sendAssessmentCompletion:send,
  }, process:{env:{}}, console});
  return exports.POST;
}
function request({origin='https://trainwithpowr.com',cookie='valid-proof',eventId='event-1'}={}) {
  return new NextRequest('https://trainwithpowr.com/api/marketing/complete',{
    method:'POST', headers:{origin,cookie:`powr_meta_completion=${cookie}`,'content-type':'application/json',
      'x-forwarded-for':'192.0.2.1','user-agent':'test browser'},body:JSON.stringify({eventId}),
  });
}
test('completion endpoint rejects cross-origin, forged and mismatched proof without sending',async()=>{
  let sent=0; const post=route(async()=>{sent++;return true;});
  assert.equal((await post(request({origin:'https://attacker.example'}))).status,403);
  assert.equal((await post(request({cookie:'forged'}))).status,200);
  assert.equal((await post(request({eventId:'different'}))).status,200);
  assert.equal(sent,0);
});
test('successful delivery clears narrow HttpOnly proof; failures retain it for stable-ID retry',async()=>{
  const failed=await route(async()=>false)(request());
  assert.equal(failed.status,503); assert.equal(failed.headers.get('set-cookie'),null);
  const success=await route(async(receipt,input)=>{
    assert.deepEqual(JSON.parse(JSON.stringify(receipt)),{id:'event-1'});
    assert.deepEqual(JSON.parse(JSON.stringify(input)),{ip:'192.0.2.1',userAgent:'test browser'});return true;
  })(request());
  assert.equal(success.status,200);
  assert.match(success.headers.get('set-cookie'),/Path=\/api\/marketing\/complete/);
  assert.match(success.headers.get('set-cookie'),/HttpOnly/);
  assert.match(success.headers.get('set-cookie'),/Max-Age=0/);
});
