// Vérifications statiques seulement: aucun transport, SQL, Docker ou test métier.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadManifest, root, read, sha, localEndpoint, cleanEnvironment, createIdentity, createArguments, assertOwnedContainer } from './plan.mjs';
import { parseArguments } from './run.mjs';
import { ids, id, create } from './scenarios.mjs';
import { SCENARIOS } from './lifecycle.mjs';
const manifest=loadManifest();
assert.equal(manifest.migrations.length,73);
assert.equal(manifest.migrations.filter(m=>m.kind==='historical').length,71);
assert.equal(parseArguments([]).mode,'plan');
assert.throws(()=>parseArguments(['--execute']));
assert.throws(()=>parseArguments(['--skip-failed']));
const command=['--execute','--authorize=SEC-AUTH-C1D','--context=desktop-linux','--daemon-id=synthetic',
 '--image=sha256:'+'a'.repeat(64),'--manifest-sha256='+'b'.repeat(64),'--profile=fresh'];
assert.equal(parseArguments(command).mode,'execute');
assert.throws(()=>parseArguments([...command,'--execute']));
assert.throws(()=>cleanEnvironment({PGHOST:'unexpected'}));
assert.equal(localEndpoint('tcp://remote:2375'),false);
assert.equal(localEndpoint('npipe:////./pipe/dockerDesktopLinuxEngine'),true);
assert.throws(()=>createArguments(createIdentity(),'postgres:17'));
const args=createArguments(createIdentity(),'sha256:'+'a'.repeat(64));
for(const a of ['--pull=never','--network','none','--read-only','--cap-drop','ALL','--tmpfs'])assert.ok(args.includes(a));
for(const a of ['--publish','-p','--volume','-v','--mount','--volumes-from'])assert.ok(!args.includes(a));
assert.throws(()=>assertOwnedContainer({},createIdentity(),'sha256:'+'a'.repeat(64)));
const identity={...createIdentity(),created:true,id:'c'.repeat(64)};
const image='sha256:'+'a'.repeat(64);
const valid={Id:identity.id,Name:'/'+identity.name,Image:image,
 Config:{User:'postgres',Labels:{'fr.planetls.sec-auth-c1.run':identity.token,'fr.planetls.sec-auth-c1.purpose':'isolated-tests'}},
 HostConfig:{NetworkMode:'none',ReadonlyRootfs:true,Privileged:false,CapDrop:['ALL'],SecurityOpt:['no-new-privileges'],
 Tmpfs:{'/var/lib/postgresql/data':'rw'}},Mounts:[],NetworkSettings:{Ports:{},Networks:{none:{}}}};
assertOwnedContainer(valid,identity,image);
for(const mutate of [v=>{v.Id='d'.repeat(64);},v=>{v.HostConfig.NetworkMode='host';},
 v=>{v.HostConfig.Binds=['sensitive:/data'];},v=>{v.HostConfig.PortBindings={'5432/tcp':[{}]};},
 v=>{v.Mounts=[{Type:'volume'}];},v=>{v.Config.User='root';},v=>{v.HostConfig.Privileged=true;}]){
 const invalid=structuredClone(valid);mutate(invalid);assert.throws(()=>assertOwnedContainer(invalid,identity,image));
}
const fixture=read('scripts/sec-auth-c1/fixtures.sql');
assert.equal((fixture.match(/@example\.invalid/g)||[]).length,10);
for(const value of Object.values(ids))assert.match(value,/^[0-9a-f]{8}-0000-4000-8000-[0-9a-f]{12}$/);
assert.equal(id('f',1),'f0000000-0000-4000-8000-000000000001');
assert.ok(create(1).includes(ids.concierge));
assert.ok(!fixture.includes('INSERT INTO public.mission_provider_assignments'));
const scenarioSource=read('scripts/sec-auth-c1/scenarios.mjs');
const declared=[...scenarioSource.matchAll(/await check\('([^']+)'/g)].map(m=>m[1]);
assert.deepEqual(declared,SCENARIOS.filter(name=>!['application','existing-history','permissions'].includes(name)));
assert.ok(scenarioSource.includes('pg_blocking_pids'));
assert.ok(!scenarioSource.includes('pg_sleep(6)'));
assert.ok(scenarioSource.includes('forged UPDATE truly exercised'));
assert.ok(scenarioSource.includes('visible before commit\');`,true'));
assert.ok(read('scripts/sec-auth-c1/permissions.sql').includes("ARRAY['search_path=pg_catalog'],false)"));
assert.ok(read('scripts/sec-auth-c1/foundation.sql').includes('GET STACKED DIAGNOSTICS'));
assert.ok(read('scripts/sec-auth-c1/foundation.sql').includes('RAISE; -- Préserve'));
for(const item of manifest.assets){
 const b=readFileSync(path.join(root,item.path));
 assert.ok(!(b[0]===239&&b[1]===187&&b[2]===191));
 const s=new TextDecoder('utf-8',{fatal:true}).decode(b);
 assert.ok(!s.includes('\uFFFD'));
 assert.ok(s.endsWith('\n'));
 assert.ok(!s.split(/\r?\n/).some(l=>/[\t ]+$/.test(l)));
 if(item.path.endsWith('.sql')) {
   const code=s.replace(/--[^\n]*/g,'').replace(/'(?:''|[^'])*'/g,"''");
   const tags=code.match(/\$(?:[a-z_]+)?\$/g)||[];
   for(let i=0;i<tags.length;i+=2)assert.equal(tags[i],tags[i+1]);
   let n=0;for(const c of code){if(c==='(')n++;if(c===')')n--;assert.ok(n>=0);}assert.equal(n,0);
 }
}
// Références disponibles localement seulement, sans fetch ni substitution.
for(const d of JSON.parse(read('scripts/sec-auth-c1/divergences.json'))){
 const bytes=execFileSync('git',['show',`${d.reference.commit}:${d.path}`],{cwd:root,maxBuffer:1000000});
 const reference=d.reference.variant==='CRLF'?Buffer.from(bytes.toString('utf8').replace(/\r?\n/g,'\r\n')):bytes;
 assert.equal(sha(reference),d.expected);
 const current=readFileSync(path.join(root,d.path));assert.equal(sha(current),d.actual);
 assert.equal(current.toString('utf8').replace(/\r\n/g,'\n')===bytes.toString('utf8').replace(/\r\n/g,'\n'),d.reference.textEqual);
}
assert.equal(readdirSync(path.join(root,'scripts/sec-auth-c1')).length,manifest.assets.length+1);
console.log(`STATIC PASS: manifest, ${manifest.migrations.length} hashes, ${manifest.assets.length} assets, 5 divergence proofs, fixture/guard contracts.`);
console.log(`Manifest SHA256: ${manifest.digest}`);
console.log('PostgreSQL scenarios: NOT RUN. No Docker transport invoked.');
