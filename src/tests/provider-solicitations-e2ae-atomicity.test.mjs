import test from 'node:test';
import assert from 'node:assert/strict';
import { runAtomicity } from '../../scripts/provider-solicitations-e2a/atomicity.mjs';

test('synthetic fault and deferred commit both require an error and a subsequent rollback assertion', async () => {
  const calls=[];
  await runAtomicity(async source => { calls.push(source); if(source.includes('INSERT INTO harness.e2e_parent VALUES (1)')) throw Error('P0001'); if(source.includes('INSERT INTO harness.e2e_log VALUES (2)')) throw Error('23503'); });
  assert.equal(calls.length,5); assert.match(calls[1],/BEGIN;.*INSERT INTO harness.e2e_parent.*INSERT INTO harness.e2e_child.*COMMIT/s);
  assert.match(calls[2],/injection rollback/); assert.match(calls[3],/COMMIT/); assert.match(calls[4],/deferred commit rollback/);
});
test('missing or wrong error stops the scenario',async()=>{
  await assert.rejects(runAtomicity(async()=>{}),/Injected fault did not fail/);
  await assert.rejects(runAtomicity(async s=>{if(s.includes('INSERT INTO harness.e2e_parent VALUES (1)')) throw Error('unexpected');}),/unexpected/);
  await assert.rejects(runAtomicity(async s=>{if(s.includes('INSERT INTO harness.e2e_parent VALUES (1)')) throw Error('P0001');}),/Deferred constraint did not fail/);
});
