import test from 'node:test';
import assert from 'node:assert/strict';
import { runConcurrency } from '../../scripts/provider-solicitations-e2a/concurrency.mjs';
function fixture({blocked=true,duplicate=false}={}) {
  const events=[];let opened=0,resolveWait;
  const io={ now:(()=>{let n=0;return()=>n++;})(), timeoutMs:4, sleep:async()=>{},
    sql:async s=>{events.push(s.includes('pg_blocking_pids')?'barrier':s.includes('concurrent final state')?'assert':'seed');if(s.includes('pg_blocking_pids'))return blocked?'t':'f';if(s.includes('Concurrence synthétique'))return JSON.stringify({result:{solicitation_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}});return '';},
    openSession:async()=>{const index=++opened;events.push('open'+index);return {send:async s=>{if(s.includes('pg_backend_pid'))return String(duplicate?1:index);if(s.includes('expect_error')){events.push('waiting');return new Promise(resolve=>{resolveWait=resolve;});}if(s==='COMMIT;'){events.push('commit'+index);if(index===1&&resolveWait)resolveWait('');return '';}events.push('respond');return JSON.stringify({result:{status:'interested',version:2}});},close:async()=>events.push('close'+index)};}};
  return {io,events};
}
test('two distinct sessions prove blocking before commit and assert final state',async()=>{
  const {io,events}=fixture();await runConcurrency(io);
  assert.ok(events.indexOf('waiting')<events.indexOf('barrier'));assert.ok(events.indexOf('barrier')<events.indexOf('commit1'));assert.ok(events.includes('assert'));
});
test('missing contention or duplicate session fails before committing',async()=>{
  for(const option of [{blocked:false},{duplicate:true}]){const {io,events}=fixture(option);await assert.rejects(runConcurrency(io));assert.ok(!events.includes('commit1'));}
});
