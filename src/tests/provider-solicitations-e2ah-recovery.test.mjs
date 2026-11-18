import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignIdentity, recoverAndCleanup, campaignLabel, purposeLabel } from '../../scripts/provider-solicitations-e2a/recovery.mjs';
const token='11111111-1111-4111-8111-111111111111', id='a'.repeat(64);
function fixture({known=false,ids=[id],states=[{Running:false,Status:'exited'}],invalid='',daemonDown=false,failRemove=false}={}) {
  const identity=campaignIdentity({token,id:known?id:null,created:known}), calls=[];let i=0;
  return {identity,calls,io:{identity,verifyDaemon:async()=>{if(daemonDown)throw Error('daemon unavailable');},call:async a=>{calls.push(a);if(a[1]==='ls')return ids.join('\n');if(a[1]==='rm'&&failRemove)throw Error('removal failed');return '';},inspect:async()=>{if(invalid)throw Error(invalid);return states[Math.min(i++,states.length-1)];}}};
}
test('new campaign identity is exact and invalid tokens are refused',()=>{
  assert.equal(campaignIdentity({token}).name,`planetls-provider-solicitations-${token}`);assert.throws(()=>campaignIdentity({token:'bad'}));
});
test('known stopped and recovered lost-response resources require exact identity filters before removal',async()=>{
  for(const known of [true,false]) {const f=fixture({known});const r=await recoverAndCleanup(f.io);assert.equal(r.status,'REMOVED');assert.deepEqual(f.calls.at(-1),['container','rm',id]);if(!known){const query=f.calls[0];assert.ok(query.includes(`label=${campaignLabel}=${token}`));assert.ok(query.includes(`label=${purposeLabel}=isolated-tests`));}}
});
test('empty, malformed or multiple candidates remain uncertain without deletion',async()=>{
  for(const ids of [[],['short'],[id,'b'.repeat(64)]]){const f=fixture({ids});assert.equal((await recoverAndCleanup(f.io)).status,'UNCERTAIN');assert.ok(!f.calls.some(a=>a[1]==='rm'));}
});
test('unavailable daemon, wrong labels, image or network never delete',async()=>{
  for(const option of [{daemonDown:true},{invalid:'wrong label'},{invalid:'wrong image'},{invalid:'wrong network'}]){const f=fixture(option);await assert.rejects(recoverAndCleanup(f.io));assert.ok(!f.calls.some(a=>a[1]==='rm'));}
});
test('running container must be stopped and confirmed twice before removal',async()=>{
  const f=fixture({known:true,states:[{Running:true,Status:'running'},{Running:false,Status:'exited'},{Running:false,Status:'exited'}]});
  assert.equal((await recoverAndCleanup(f.io)).status,'REMOVED');assert.deepEqual(f.calls,[['container','stop','--time','5',id],['container','rm',id]]);
});
test('unconfirmed stop or a restart refuses removal',async()=>{
  for(const states of [[{Running:true,Status:'running'}],[{Running:false,Status:'exited'},{Running:true,Status:'running'}],[{}]]){const f=fixture({known:true,states});assert.equal((await recoverAndCleanup(f.io)).status,'UNCERTAIN');assert.ok(!f.calls.some(a=>a[1]==='rm'));}
});
test('failed removal is surfaced and never widened to a global cleanup',async()=>{
  const f=fixture({known:true,failRemove:true});await assert.rejects(recoverAndCleanup(f.io));assert.deepEqual(f.calls,[['container','rm',id]]);
});
