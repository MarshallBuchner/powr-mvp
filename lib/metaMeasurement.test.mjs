import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueMeasurementReceipt, verifyMeasurementReceipt, sendAssessmentCompletion, POWR_DATASET_ID } from './metaMeasurement.ts';
import { armCompletionMeasurement, measureOpenedReport } from './metaMeasurementClient.ts';
const config = { enabled: true, token: 'local-only-test-token', now: 1800000000 };

test('receipt requires explicit adult consent and enabled credentials', () => {
  for (const input of [{adult:false,consent:true},{adult:true,consent:false}]) {
    assert.equal(issueMeasurementReceipt(input,config),null);
  }
  assert.equal(issueMeasurementReceipt({adult:true,consent:true},{...config,enabled:false}),null);
  assert.equal(issueMeasurementReceipt({adult:true,consent:true},{...config,token:''}),null);
  const proof=issueMeasurementReceipt({adult:true,consent:true,fbclid:'click_123'},config);
  assert.equal(verifyMeasurementReceipt(proof.value,config).id,proof.id);
  assert.equal(verifyMeasurementReceipt(proof.value,config).fbc,'fb.1.1800000000000.click_123');
  assert.equal(verifyMeasurementReceipt(proof.value+'x',config),null);
  assert.equal(verifyMeasurementReceipt(proof.value,{...config,token:'wrong'}),null);
  assert.equal(verifyMeasurementReceipt(proof.value,{...config,now:config.now+3601}),null);
  assert.equal(verifyMeasurementReceipt(proof.value,{...config,now:config.now-1}),null);
});

test('Meta receives only a generic event and matching signals for POWR',async()=>{
  const proof=issueMeasurementReceipt({adult:true,consent:true},config);
  const receipt=verifyMeasurementReceipt(proof.value,config);
  let sent;
  assert.equal(await sendAssessmentCompletion(receipt,{ip:'192.0.2.1',userAgent:'test browser'},{...config,fetcher:async(url,options)=>{
    sent={url,options,body:JSON.parse(options.body)};
    return Response.json({events_received:1});
  }}),true);
  assert.equal(sent.url,`https://graph.facebook.com/v25.0/${POWR_DATASET_ID}/events`);
  assert.deepEqual(Object.keys(sent.body),['data']);
  assert.deepEqual(sent.body.data,[{
    event_name:'AssessmentCompleted',event_time:config.now,event_id:proof.id,
    action_source:'website',event_source_url:'https://trainwithpowr.com/',
    user_data:{client_ip_address:'192.0.2.1',client_user_agent:'test browser'},
  }]);
  assert.equal(sent.options.headers.Authorization,`Bearer ${config.token}`);
  const never=async()=>{throw Error('must not call Meta');};
  assert.equal(await sendAssessmentCompletion(receipt,{ip:'bad',userAgent:'test'},{...config,fetcher:never}),false);
  assert.equal(await sendAssessmentCompletion(receipt,{ip:'192.0.2.1',userAgent:'test'},{...config,enabled:false,fetcher:never}),false);
  assert.equal(await sendAssessmentCompletion(receipt,{ip:'192.0.2.1',userAgent:'test'},{...config,fetcher:async()=>Response.json({error:'failure'},{status:500})}),false);
});

test('report measurement needs fresh same-session navigation proof, retries safely and deduplicates',async()=>{
  const values=new Map();
  globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const originalFetch=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++; assert.equal(url,'/api/marketing/complete');
    assert.deepEqual(JSON.parse(options.body),{eventId:'event-id'});
    assert.equal(options.referrerPolicy,'no-referrer');
    return Response.json({measured:true});
  };
  try {
    await measureOpenedReport('/r/view'); assert.equal(calls,0);
    armCompletionMeasurement(undefined,'/r/view');
    await measureOpenedReport('/r/view'); assert.equal(calls,0);
    armCompletionMeasurement('event-id','/r/sample');
    await measureOpenedReport('/r/sample'); assert.equal(calls,0);
    armCompletionMeasurement('event-id','/r/s/privateToken');
    await measureOpenedReport('/r/view'); assert.equal(calls,0);
    await Promise.all([measureOpenedReport('/r/s/privateToken'),measureOpenedReport('/r/s/privateToken')]);
    assert.equal(calls,1); assert.equal(values.size,0);
    await measureOpenedReport('/r/s/privateToken'); assert.equal(calls,1);
    armCompletionMeasurement('event-id','/r/view');
    globalThis.fetch=async()=>Response.json({measured:false},{status:503});
    await measureOpenedReport('/r/view'); assert.equal(values.size,1);
  } finally {globalThis.fetch=originalFetch;delete globalThis.sessionStorage;}
});
