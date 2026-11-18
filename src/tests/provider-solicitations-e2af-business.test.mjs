import test from 'node:test';
import assert from 'node:assert/strict';
import { runBusinessAtomicity } from '../../scripts/provider-solicitations-e2a/business-atomicity.mjs';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const initial=JSON.stringify({row:{status:'sent',version:1,response_message:null},operations:[{}],events:[{}]});
test('fault after RPC update requires marker, identical state and removed trigger',async()=>{
  const calls=[];await runBusinessAtomicity(async s=>{calls.push(s);if(s.includes('CREATE TRIGGER'))throw Error('P0E01 E2F_AFTER_UPDATE');if(s.includes("jsonb_build_object('row'"))return initial;return '';},id);
  assert.equal(calls.length,4);assert.match(calls[1],/AFTER UPDATE ON public.provider_solicitations/);assert.match(calls[1],/WHEN \(NEW\.id =/);assert.match(calls[1],/SET search_path=pg_catalog/);assert.match(calls[1],/respond_provider_solicitation/);assert.match(calls[3],/instrumentation removed/);
});
test('instrumentation failure or changed state is rejected',async()=>{
  await assert.rejects(runBusinessAtomicity(async s=>{if(s.includes("jsonb_build_object('row'"))return initial;if(s.includes('CREATE TRIGGER'))throw Error('42501 permission denied');return '';},id),/42501/);
  let n=0;await assert.rejects(runBusinessAtomicity(async s=>{if(s.includes("jsonb_build_object('row'"))return ++n===1?initial:'{}';if(s.includes('CREATE TRIGGER'))throw Error('P0E01 E2F_AFTER_UPDATE');return '';},id),/state changed/);
});
