// Simulations en mémoire seulement. Aucun processus enfant réel, SQL ou Docker.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { inventory, globalVerdict, classify, HarnessError, createInterruption, diagnostic, sanitize } from './lifecycle.mjs';
import { transport } from './transport.mjs';
import { main } from './run.mjs';

const complete=Object.fromEntries(Object.keys(inventory()).map(k=>[k,'PASS']));
assert.equal(globalVerdict('PASS','PASS',false,complete),'PASS');
assert.equal(globalVerdict('PASS','FAIL',false,complete),'FAIL');
assert.equal(globalVerdict('FAIL','PASS',false,complete),'FAIL');
assert.equal(globalVerdict('BLOCKED','NOT RUN',false,inventory()),'BLOCKED');
assert.equal(globalVerdict('NOT RUN','NOT RUN',false,inventory()),'NOT RUN');
assert.equal(globalVerdict('PASS','PASS',true,complete),'FAIL');
assert.equal(globalVerdict('PASS','PASS',false,inventory()),'FAIL');
assert.equal(globalVerdict('PASS','PASS',false,{...complete,'existing-history':'NOT RUN'},['existing-history']),'PASS');
assert.equal(classify('migration',new HarnessError('changed','integrity')),'FAIL');
assert.equal(classify('migration',new Error('missing dependency')),'BLOCKED');
assert.equal(classify('scenarios',new Error('constraint broken')),'FAIL');
assert.equal(classify('isolation',new HarnessError('cancelled','interrupted')),'FAIL');
const terminalOutput=[],previousExit=process.exitCode;
await main(['--invalid'],{write:line=>terminalOutput.push(JSON.parse(line))});
assert.equal(process.exitCode,1);process.exitCode=previousExit;
assert.equal(terminalOutput.length,1);assert.equal(terminalOutput[0].global,'BLOCKED');
assert.ok(Object.values(terminalOutput[0].states).every(s=>s==='NOT RUN'));

let spawned=0;const children=[];
function fakeSpawn(_binary,_args){
  spawned++;const child=new EventEmitter();children.push(child);
  child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.stdin=new EventEmitter();
  child.stdout.setEncoding=child.stderr.setEncoding=function(){return this;};
  child.kill=()=>{child.killed=true;queueMicrotask(()=>child.emit('close',null,'SIGTERM'));return true;};
  child.stdin.end=input=>{
    if(input==='\\q\n'){queueMicrotask(()=>child.emit('close',0,null));return;}
    queueMicrotask(()=>{
      child.stdout.emit('data','partial output\n');
      if(input==='hold')return;
      if(input==='expected'){
        child.stderr.emit('data','NOTICE: C1D_PG {"sqlstate":"23514","message":"expected","context":"original context"}\n');
        child.emit('close',0,null);return;
      }
      child.stderr.emit('data','ERROR: 23514: original failure at character 17\nDETAIL: original detail\nHINT: original hint\nCONTEXT: original function\nLOCATION: function, source.c:1\n');
      child.emit('close',3,null);
    });
  };
  child.stdin.write=input=>{
    const marker=input.match(/\\echo (C1D_[a-f0-9]+)/)?.[1];assert.ok(marker);
    queueMicrotask(()=>{child.stdout.emit('data',`42\n${marker}\n`);
      queueMicrotask(()=>child.stderr.emit('data',`NOTICE: preserved before barrier\n${marker}\n`));});
  };
  return child;
}
const t=transport('synthetic',{}, {spawnImpl:fakeSpawn});t.pin('unix:///var/run/docker.sock');
const outputs=[];t.setReporter(v=>outputs.push(v));
await assert.rejects(t.call(['exec','psql'],'failure',{meta:{stage:'migration',migration:{number:71,path:'synthetic.sql'}}}),error=>{
  const d=diagnostic(error);assert.equal(d.sqlstate,'23514');assert.equal(d.position,'17');
  assert.equal(d.detail,'original detail');assert.equal(d.hint,'original hint');
  assert.match(d.context,/original function/);assert.match(d.stdout,/partial output/);
  assert.equal(d.migration.number,71);return true;
});
await t.call(['exec','psql'],'expected');
assert.equal(diagnostic({diagnostic:outputs.at(-1)}).expectedDiagnostics[0].sqlstate,'23514');
await assert.rejects(t.call(['exec','psql'],'hold',{timeout:5}),error=>{
  assert.match(diagnostic(error).stdout,/partial output/);assert.match(diagnostic(error).transportError,/deadline/);return true;
});
const events=new EventEmitter(),control=createInterruption(events,()=>t.cancelWork());
const work=t.call(['exec','psql'],'hold');const workFailed=assert.rejects(work);
events.emit('SIGTERM');await workFailed;assert.equal(control.signal,'SIGTERM');assert.throws(()=>control.check());
const cleaning=t.call(['synthetic-cleanup'],'hold',{cleanup:true});const cleanupChild=children.at(-1);
t.cancelWork();assert.notEqual(cleanupChild.killed,true);cleanupChild.emit('close',0,null);await cleaning;
control.dispose();assert.equal(events.listenerCount('SIGTERM'),0);
for(const signal of ['SIGINT','SIGTERM']){
  const emitter=new EventEmitter();let cancelled=0;const c=createInterruption(emitter,()=>cancelled++);
  emitter.emit(signal);emitter.emit(signal);assert.equal(cancelled,1);assert.equal(c.signal,signal);assert.throws(()=>c.check());c.dispose();
}
const s=await t.open(['exec','psql']);assert.equal((await s.send('synthetic input, not SQL')).trim(),'42');
assert.match(outputs.at(-1).stderr,/preserved before barrier/);await s.close();
t.setReporter(()=>{throw new Error('simulated disk error');});
await assert.rejects(t.call(['exec','psql'],'expected'),error=>{
  assert.match(error.diagnostic.stderr,/C1D_PG/);assert.equal(error.kind,'journal');return true;
});
const safe=JSON.stringify(sanitize({stderr:'password=do-not-log Bearer do-not-log postgres://u:do-not-log@local',
  value:'{"access_token":"do-not-log"}'}));
assert.ok(!safe.includes('do-not-log'));JSON.parse(safe);
const source=readFileSync(new URL('./run.mjs',import.meta.url),'utf8');
assert.equal((source.match(/phase:'terminal'/g)||[]).length,1);
assert.ok(source.indexOf("['container','rm','--force',identity.id]")<source.indexOf("phase:'terminal'"));
assert.ok(source.indexOf("state:'creation-pending'")<source.indexOf('call(createArguments'));
assert.ok(source.indexOf("state:'created'")<source.indexOf("call(['start',id])"));
console.log(`STATIC SIMULATION PASS: verdicts, SIGINT/SIGTERM, exact cleanup gates, dual-pipe diagnostics, cancellation (${spawned} fake children; 0 real processes).`);
console.log('No durable receipt or Docker cleanup actually exercised; PostgreSQL remains NOT RUN.');
