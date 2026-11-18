import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { transport } from '../../scripts/provider-solicitations-e2a/transport.mjs';

test('cancellation waits for the exact spawned CLI close event',async()=>{
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new PassThrough();let kills=0;child.kill=()=>{kills++;return true;};
  const docker=transport('synthetic',{PATH:'synthetic'},{spawnImpl:()=>child});
  const running=docker.call(['context','inspect','synthetic'],undefined,{timeout:1000}).catch(()=>{});
  let confirmed=false;const closing=docker.cancelAndWait().then(()=>{confirmed=true;});await Promise.resolve();
  assert.equal(confirmed,false);assert.equal(kills,1);child.emit('close',null,'SIGTERM');await closing;await running;assert.equal(confirmed,true);
});
