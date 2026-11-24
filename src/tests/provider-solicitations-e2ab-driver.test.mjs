import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { execute, parseArguments } from '../..//scripts/provider-solicitations-e2a/run.mjs';

const image = `sha256:${'a'.repeat(64)}`, digest = 'b'.repeat(64), container = 'c'.repeat(64);
const args = ['--execute','--authorize=PFC-COL-E2B',`--image=${image}`,'--context=desktop-linux','--daemon-id=local','--profile=fresh',`--manifest-sha256=${digest}`];
function fake({badImage=false,badNetwork=false,failSql=false,interrupt=false,notReady=false,failStart=false,failCleanup=false,hangInput=''}={}) {
  const calls=[]; let name,token; const events=new EventEmitter();
  const docker={ calls, pin(){}, cancelWork(){}, async cancelAndWait(){return {confirmed:true};}, async call(a,input) {
    calls.push(a);
    if(a[0]==='context') return JSON.stringify([{Endpoints:{docker:{Host:'npipe:////./pipe/dockerDesktopLinuxEngine'}}}]);
    if(a[0]==='info') return JSON.stringify({ID:'local',OSType:'linux',Swarm:{LocalNodeState:'inactive'}});
    if(a[0]==='image') return JSON.stringify([{Id:image,Os:'linux',Config:{Env:[badImage?'PG_MAJOR=16':'PG_MAJOR=17'],Entrypoint:['docker-entrypoint.sh'],Volumes:{'/var/lib/postgresql/data':{}}}}]);
    if(a[0]==='create') { name=a[a.indexOf('--name')+1]; token=a[a.indexOf('--label')+1].split('=')[1]; return container; }
    if(a[0]==='container' && a[1]==='inspect') return JSON.stringify([{Id:container,Name:`/${name}`,Image:image,Config:{User:'postgres',Labels:{'fr.planetls.sec-auth-c1.run':token,'fr.planetls.sec-auth-c1.purpose':'isolated-tests','fr.planetls.provider-solicitations-e2a.campaign':token,'fr.planetls.provider-solicitations-e2a.purpose':'isolated-tests'}},HostConfig:{NetworkMode:badNetwork?'bridge':'none',ReadonlyRootfs:true,CapDrop:['ALL'],SecurityOpt:['no-new-privileges'],Memory:1073741824,NanoCpus:2000000000,PidsLimit:128,Tmpfs:{'/var/lib/postgresql/data':'rw','/var/run/postgresql':'rw','/tmp':'rw'}},Mounts:[{Type:'tmpfs'}],NetworkSettings:{Ports:{},Networks:{none:{}}},State:{Running:false,Status:'exited'}}]);
    if(a[0]==='start' && failStart) throw Error('start failed');
    if(a[1]==='rm' && failCleanup) throw Error('cleanup failed');
    if(a[0]==='exec') {
      if(interrupt) events.emit('SIGINT');
      if(input==='SELECT 1;') { if(notReady) throw Error('not ready'); return '1'; }
      const migrationBatch = input?.includes('E2B_APPLIED ');
      if(hangInput && (input === hangInput || (hangInput === 'migration' && migrationBatch))) return new Promise(()=>{});
      if(migrationBatch) {
        return input.split('\n')
          .filter(line=>line.startsWith('\\echo E2B_APPLIED '))
          .map(line=>line.slice('\\echo '.length))
          .join('\n');
      }
      if(failSql) throw Error('SQL failed'); if(input?.includes('INSERT INTO harness.e2e_parent VALUES (1)')) throw Error('P0001'); if(input?.includes('INSERT INTO harness.e2e_log VALUES (2)')) throw Error('23503'); if(input?.includes('Concurrence synthétique')) return JSON.stringify({result:{solicitation_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}}); if(input?.includes("jsonb_build_object('row'")) return JSON.stringify({row:{status:'sent',version:1,response_message:null},operations:[{}],events:[{}]}); if(input?.includes('CREATE TRIGGER e2f_business_fault')) throw Error('P0E01 E2F_AFTER_UPDATE'); if(input?.includes('pg_blocking_pids')) return 't'; return ''; }
    return '';
  }, async open(){const n=calls.filter(x=>x[0]==='open').length;calls.push(['open']);return {send:async source=>source.includes('pg_backend_pid')?String(n+1):source.includes('respond_provider_solicitation')?JSON.stringify({replayed:source.includes('expect_error'),operation_id:'receipt',result:{solicitation_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',status:'interested',version:2}}):'',close:async()=>{}};}};
  return {docker,events,calls};
}
test('parameters require explicit E2B authorization and immutable values',()=>{
  assert.equal(parseArguments([]).mode,'plan'); assert.equal(parseArguments(args).mode,'execute');
  for(const bad of [args.filter(x=>!x.startsWith('--authorize')),args.map(x=>x.startsWith('--image')?'--image=postgres:17':x),[...args,'--cleanup=external'],[...args,'--profile=fresh']]) assert.throws(()=>parseArguments(bad));
});
test('start, readiness timeout and cleanup failure never pass and retain terminal journal',async()=>{
  for(const option of [{failStart:true},{notReady:true},{failCleanup:true}]) {
    const entries=[]; const f=fake(option);
    const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>new Proxy({}, {get:()=>'',getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true,value:''})}),manifest:()=>({digest,migrations:[]}),sleep:async()=>{},maxReadyAttempts:2,journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
    assert.notEqual(r.global,'PASS');assert.equal(entries.at(-1).event,'terminal');assert.equal(r.journal,'synthetic');
    if(option.notReady) assert.equal(f.calls.filter(a=>a[0]==='exec').length,2);
    if(option.failCleanup) assert.equal(r.cleanup,'FAIL');
  }
});
test('wrong manifest is refused before any Docker call',async()=>{
  const f=fake(); const r=await execute(parseArguments(args),f.docker,{events:f.events,manifest:()=>({digest:'wrong'})});
  assert.equal(r.global,'BLOCKED'); assert.equal(f.calls.length,0);
});
test('uncertain creation without ID reports the generated name and never deletes',async()=>{
  const f=fake();const original=f.docker.call;f.docker.call=async(a,...rest)=>{if(a[0]==='create')throw Error('lost response');return original(a,...rest);};
  const entries=[];const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>({}),manifest:()=>({digest,migrations:[]}),journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
  assert.equal(r.resource.status,'unknown: manual verification required');assert.match(r.resource.name,/^planetls-provider-solicitations-/);assert.ok(!f.calls.some(a=>a[1]==='rm'));assert.equal(entries.at(-1).resource.name,r.resource.name);assert.ok(entries.some(e=>e.event==='creation-pending' && e.resource.campaign));
});
test('lost create reply is reconciled using the recorded campaign and only exact stopped ID is removed',async()=>{
  const f=fake();const original=f.docker.call;f.docker.call=async(a,...rest)=>{if(a[0]==='create'){await original(a,...rest);throw Error('lost response');}if(a[0]==='container'&&a[1]==='ls'){f.calls.push(a);return container;}return original(a,...rest);};
  const entries=[];const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>({}),manifest:()=>({digest,migrations:[]}),journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
  assert.equal(r.recovery.status,'REMOVED');assert.equal(r.resource.id,container);assert.deepEqual(f.calls.filter(a=>a[1]==='rm'),[['container','rm',container]]);assert.ok(entries.findIndex(e=>e.event==='creation-pending')<entries.findIndex(e=>e.event==='terminal'));
});
test('incorrect image is refused before creation',async()=>{
  const f=fake({badImage:true});const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>({}),manifest:()=>({digest,migrations:[]})});
  assert.equal(r.global,'BLOCKED');assert.ok(!f.calls.some(a=>a[0]==='create'));
});
test('network mismatch never starts or deletes an unverified container',async()=>{
  const f=fake({badNetwork:true});const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>({}),manifest:()=>({digest,migrations:[]})});
  assert.equal(r.cleanup,'FAIL');assert.ok(!f.calls.some(a=>a[0]==='start'||a[1]==='rm'));
});
test('failure and interruption clean only the verified newly created ID',async()=>{
  for(const option of [{failSql:true},{interrupt:true}]) {
    const f=fake(option);const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>new Proxy({}, {get:()=>'',getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true,value:''})}),manifest:()=>({digest,migrations:[]})});
    assert.equal(r.global,'FAIL');assert.equal(r.cleanup,'PASS');assert.deepEqual(f.calls.filter(a=>a[1]==='rm'),[['container','rm',container]]);
  }
});
test('simulated sequential success stays BLOCKED and reports partial coverage',async()=>{
  const f=fake(), entries=[];const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>new Proxy({}, {get:()=>'',getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true,value:''})}),manifest:()=>({digest,migrations:[]}),journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
  assert.equal(r.global,'BLOCKED');assert.equal(r.sql,'PARTIAL');assert.equal(r.cleanup,'PASS');
  const create=f.calls.find(a=>a[0]==='create');assert.equal(create[create.indexOf('--network')+1],'none');
  assert.ok(!create.includes('--publish') && !create.includes('--volume') && create.includes('--pull=never'));
  assert.equal(f.calls.filter(a=>a[0]==='open').length,2);
  assert.ok(entries.some(e=>e.item==='synthetic-atomicity'));assert.ok(entries.some(e=>e.item==='business-atomicity'));assert.ok(entries.some(e=>e.item==='concurrency'));
});
test('unconfirmed cancellation prevents cleanup and preserves diagnostic',async()=>{
  const f=fake({failSql:true});f.docker.cancelAndWait=async()=>{throw Error('not confirmed');};
  const entries=[];const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>new Proxy({}, {get:()=>'',getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true,value:''})}),manifest:()=>({digest,migrations:[]}),journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
  assert.equal(r.global,'FAIL');assert.equal(r.cancellation,'unconfirmed');assert.equal(r.cleanup,'FAIL');assert.ok(r.resource.id);assert.ok(!f.calls.some(a=>a[1]==='rm'));assert.equal(entries.at(-1).cancellation,'unconfirmed');
});
test('global deadline cancels a stalled child and records the timeout',async()=>{
  const entries=[]; const f=fake(); let cancelled=0;
  f.docker.cancelWork=()=>{cancelled++;};
  f.docker.call=async()=>new Promise(()=>{});
  const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>({}),manifest:()=>({digest,migrations:[]}),globalTimeoutMs:20,journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
  assert.equal(r.global,'FAIL');assert.equal(r.timedOut,true);assert.ok(cancelled>=1);
  assert.equal(entries.at(-1).event,'terminal');assert.equal(entries.at(-1).timedOut,true);
});
test('timeouts during migration or assertions never produce PASS and preserve the stage',async()=>{
  for (const stage of ['migration','assertions']) {
    const f=fake({hangInput:stage});let cancels=0;f.docker.cancelWork=()=>{cancels++;};const entries=[];
    const files=new Proxy({}, {get:(_t,p)=>p==='fake-migration.sql'?'migration':p==='scripts/provider-solicitations-e2a/assertions.sql'?'assertions':'',getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true,value:''})});
    const r=await execute(parseArguments(args),f.docker,{events:f.events,snapshot:()=>files,manifest:()=>({digest,migrations:[{path:'fake-migration.sql'}]}),globalTimeoutMs:50,journalFactory:()=>({path:'synthetic',write:x=>entries.push(x),close(){}})});
    assert.equal(r.global,'FAIL');assert.equal(r.timedOut,true);assert.ok(cancels>0);assert.equal(r.stage,stage==='migration'?'fake-migration.sql':'assertions');assert.equal(entries.at(-1).timedOut,true);
  }
});
