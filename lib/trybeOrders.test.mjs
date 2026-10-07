import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportTrybeOrder, validTrybeVisitorId } from './trybeOrders.ts';
const vid = '12345678-1234-1234-1234-123456789abc';
const paid = { id:'cs_live_fixture',livemode:true,mode:'payment',payment_status:'paid',currency:'cad',amount_total:1900,metadata:{product:'powr_assessment_pack',trybe_vid:vid} };
const never = async()=>{throw new Error('must not transmit')};
test('ignores disabled, test, unpaid, free, wrong product/currency and missing attribution',async()=>{
 assert.equal(await reportTrybeOrder(paid, 100,{enabled:false,fetcher:never}),'disabled');
 for(const delta of [{livemode:false},{payment_status:'unpaid'},{payment_status:'no_payment_required'},{amount_total:0},{amount_total:-1},{currency:'usd'},{mode:'subscription'},{metadata:{product:'recruit',trybe_vid:vid}}]) assert.equal(await reportTrybeOrder({...paid,...delta},100,{enabled:true,fetcher:never}),'ineligible');
 assert.equal(await reportTrybeOrder({...paid,metadata:{product:'powr_assessment_pack'}},100,{enabled:true,fetcher:never}),'unattributed');
});
test('reports actual CAD amount, stable order ID and no customer data',async()=>{
 let body;
 const result=await reportTrybeOrder({...paid,amount_total:1500,customer_details:{email:'private@example.test'}},100,{enabled:true,apiKey:'test-key',fetcher:async(url,options)=>{assert.equal(url,'https://jointrybe.com/attribution/v1/orders');body=JSON.parse(options.body);return Response.json({success:true})}});
 assert.equal(result,'queued');assert.equal(body.value,15);assert.equal(body.orderId,paid.id);assert.equal(body.currency,'CAD');assert.equal(body.vid,vid);assert.equal(body.email,undefined);
});
test('duplicate is safe, transient or unrecognized errors require retry',async()=>{
 const run=(status,data)=>reportTrybeOrder(paid,100,{enabled:true,apiKey:'test-key',fetcher:async()=>Response.json(data,{status})});
 assert.equal(await run(409,{error:'Duplicate order'}),'duplicate');
 await assert.rejects(run(500,{error:'failure'}));await assert.rejects(run(409,{error:'other conflict'}));await assert.rejects(run(200,{success:false}));
 await assert.rejects(reportTrybeOrder(paid,100,{enabled:true,apiKey:'',fetcher:never}));
});
test('rejects malformed visitor identifiers',()=>{assert.equal(validTrybeVisitorId(vid),vid);assert.equal(validTrybeVisitorId('bad'),null);assert.equal(validTrybeVisitorId(null),null)});
