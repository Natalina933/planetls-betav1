import { mkdtempSync, openSync, appendFileSync, fsyncSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { database, digestPattern, read, loadManifest, staticPlan, localEndpoint,
  createIdentity, createArguments, assertOwnedContainer } from './plan.mjs';
import { transport } from './transport.mjs';
import { runScenarios } from './scenarios.mjs';
import { inventory, createInterruption, durableJson, diagnostic, sanitize, HarnessError, classify, globalVerdict, startupFailure } from './lifecycle.mjs';
export { transport } from './transport.mjs';

export function parseArguments(args) {
  if(args.length===0||(args.length===1&&args[0]==='--plan'))return {mode:'plan'};
  const values={};
  for(const arg of args){
    const match=arg.match(/^--(authorize|image|context|daemon-id|profile|manifest-sha256)=(.+)$/);
    if(arg==='--execute'&&!values.execute)values.execute=true;
    else if(match&&!Object.hasOwn(values,match[1]))values[match[1]]=match[2];
    else throw new HarnessError(`Unknown or duplicate argument: ${arg}`,'dependency');
  }
  if(!values.execute||values.authorize!=='SEC-AUTH-C1D'||!digestPattern.test(values.image??'')
    ||!/^[a-f0-9]{64}$/.test(values['manifest-sha256']??'')||!/^\w[\w.-]*$/.test(values.context??'')
    ||!/^\w[\w:-]*$/.test(values['daemon-id']??'')||!['fresh','existing'].includes(values.profile)) {
    throw new HarnessError('Explicit C1D authorization, manifest, local context/daemon/image and profile required','dependency');
  }
  return {...values,mode:'execute'};
}
export async function validateHost(config,docker,call) {
  const contexts=JSON.parse(await call(['context','inspect',config.context]));
  if(contexts.length!==1||!localEndpoint(contexts[0].Endpoints?.docker?.Host))throw new HarnessError('Unknown/remote endpoint','dependency');
  docker.pin(contexts[0].Endpoints.docker.Host);
  const daemon=JSON.parse(await call(['info','--format','{{json .}}']));
  if(daemon.ID!==config['daemon-id']||daemon.OSType!=='linux'||daemon.Swarm?.LocalNodeState!=='inactive')throw new HarnessError('Unknown daemon','dependency');
  const rows=JSON.parse(await call(['image','inspect',config.image])),image=rows[0];
  if(rows.length!==1||image.Id!==config.image||image.Os!=='linux'||!image.Config?.Env?.includes('PG_MAJOR=17')
    ||path.posix.basename(image.Config?.Entrypoint?.[0]??'')!=='docker-entrypoint.sh'||image.Config.Entrypoint.length!==1
    ||Object.keys(image.Config?.Volumes??{}).some(p=>p!=='/var/lib/postgresql/data'))throw new HarnessError('Unapproved image','dependency');
  return {id:daemon.ID,endpoint:docker.endpoint};
}
export async function execute(config,docker) {
  const identity=createIdentity(),states=inventory();
  let stage='manifest',migration=null,sqlResult='NOT RUN',cleanup='NOT RUN',primary=null,cleanupError=null;
  let manifest,host,logs,fd,receipt,journalError=null,terminalWritten=false;
  const interruption=createInterruption(process,()=>docker.cancelWork());
  const emit=record=>{
    if(record.scenario&&record.status){
      if(!Object.hasOwn(states,record.scenario))throw new HarnessError('Unknown scenario','assertion');
      states[record.scenario]=record.status;
    }
    if(fd===undefined)return;
    try{appendFileSync(fd,JSON.stringify(sanitize({at:new Date().toISOString(),...record}))+'\n','utf8');fsyncSync(fd);}
    catch(error){journalError??=diagnostic(error);throw error;}
  };
  const call=(args,input,options={})=>{if(!options.cleanup)interruption.check();return docker.call(args,input,{...options,meta:{stage,migration,...options.meta}});};
  const verify=async(cleaning=false)=>{
    const options={cleanup:cleaning};
    const contexts=JSON.parse(await call(['context','inspect',config.context],undefined,options));
    if(contexts.length!==1||contexts[0].Endpoints?.docker?.Host!==host.endpoint)throw new HarnessError('Context changed','dependency');
    const daemon=JSON.parse(await call(['info','--format','{{json .}}'],undefined,options));
    if(daemon.ID!==host.id||daemon.OSType!=='linux'||daemon.Swarm?.LocalNodeState!=='inactive')throw new HarnessError('Daemon changed','dependency');
    const rows=JSON.parse(await call(['container','inspect',identity.id],undefined,options));
    if(rows.length!==1)throw new HarnessError('Ambiguous resource','dependency');
    assertOwnedContainer(rows[0],identity,config.image);
  };
  const args=async user=>{
    if(!['postgres','harness_client','harness_server'].includes(user))throw new HarnessError('Unknown synthetic user','dependency');
    interruption.check();await verify();
    return ['exec','-i','--env','PGOPTIONS=-c statement_timeout=20000 -c lock_timeout=15000 -c idle_in_transaction_session_timeout=30000',
      identity.id,'psql','-X','--no-password','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose',
      '-h','/var/run/postgresql','-U',user,'-d',database];
  };
  const sql=async(source,user='postgres')=>call(await args(user),source);
  const openSession=async(user='harness_server')=>{const command=await args(user);interruption.check();return docker.open(command,{meta:{stage,migration}});};
  const fingerprint=()=>sql(read('scripts/sec-auth-c1/history.sql'));
  try {
    logs=mkdtempSync(path.join(tmpdir(),'planetls-sec-auth-c1-'));
    fd=openSync(path.join(logs,'journal.jsonl'),'wx',0o600);
    receipt=path.join(logs,'creation-receipt.json');emit({phase:'inventory',states});
    manifest=loadManifest();
    if(manifest.digest!==config['manifest-sha256'])throw new HarnessError('Manifest not approved','dependency');
    docker.setReporter(record=>emit(record));
    stage='isolation';host=await validateHost(config,docker,call);
    const receiptData={version:1,identity:{...identity},context:config.context,daemon:host.id,endpoint:host.endpoint,
      image:config.image,manifest:manifest.digest,profile:config.profile};
    durableJson(receipt,{...receiptData,state:'creation-pending'});interruption.check();
    const id=(await call(createArguments(identity,config.image))).trim();
    if(!/^[a-f0-9]{64}$/.test(id))throw new HarnessError('Unknown creation ID; manual recovery only','dependency');
    identity.id=id;identity.created=true;
    durableJson(receipt,{...receiptData,identity:{...identity},state:'created'});
    emit({phase:'created',id,name:identity.name,image:config.image});await verify();await call(['start',id]);
    const deadline=Date.now()+45000;
    for(;;){try{await sql('SELECT 1;');break;}catch(error){interruption.check();if(Date.now()>=deadline)throw error;await delay(100);}}
    stage='foundation';await sql(read('scripts/sec-auth-c1/foundation.sql'));
    emit({scenario:'application',status:'RUNNING'});let before;
    for(const item of manifest.migrations){
      if(config.profile==='existing'&&item.kind==='c1a'&&before===undefined){stage='fixtures';await sql(read('scripts/sec-auth-c1/fixtures.sql'));before=await fingerprint();}
      stage='migration';migration={number:item.number,path:item.path,sha256:item.sha256};
      emit({phase:'migration-start',...migration});await sql(read(item.path));
      await sql(`INSERT INTO harness.migration_log(path,sha256) VALUES ('${item.path}','${item.sha256}');`);
      emit({phase:'migration-applied',...migration});
    }
    emit({scenario:'application',status:'PASS'});migration=null;
    if(before!==undefined){
      stage='integrity';emit({scenario:'existing-history',status:'RUNNING'});
      if(before!==await fingerprint())throw new HarnessError('Existing history changed during C1A','integrity');
      emit({scenario:'existing-history',status:'PASS'});
    }else{emit({scenario:'existing-history',status:'NOT RUN',reason:'not applicable to fresh profile'});}
    if(config.profile==='fresh'){stage='fixtures';await sql(read('scripts/sec-auth-c1/fixtures.sql'));}
    stage='permissions';emit({scenario:'permissions',status:'RUNNING'});await sql(read('scripts/sec-auth-c1/permissions.sql'));
    emit({scenario:'permissions',status:'PASS'});stage='scenarios';
    await runScenarios({sql,openSession,log:emit,read,checkInterrupted:()=>interruption.check()});
    interruption.check();sqlResult='PASS';
  }catch(error){
    primary=diagnostic(error);sqlResult=classify(stage,interruption.signal?new HarnessError('Interrupted','interrupted'):error);
    for(const [name,status] of Object.entries(states))if(status==='RUNNING')states[name]=sqlResult;
    try{emit({phase:'sql-result',status:sqlResult,stage,migration,error:primary,states});}catch{/* Console terminal remains authoritative on journal failure. */}
  }finally{
    docker.cancelWork();
    if(identity.created){
      cleanup='RUNNING';
      try{
        await verify(true);await call(['container','rm','--force',identity.id],undefined,{cleanup:true});cleanup='PASS';
        durableJson(receipt,{version:1,state:'removed',identity:{...identity},context:config.context,
          daemon:host.id,endpoint:host.endpoint,image:config.image,manifest:manifest.digest});
      }catch(error){cleanup='FAIL';cleanupError=diagnostic(error);}
    }
    const global=journalError?'FAIL':globalVerdict(sqlResult,cleanup,!!interruption.signal,states,config.profile==='fresh'?['existing-history']:[]);
    const terminal={phase:'terminal',global,sql:sqlResult,cleanup,states,primary,cleanupError,journalError,
      interrupted:interruption.signal,recovery:identity.created?{id:identity.id,name:identity.name,receipt}:null,
      disclaimer:'SQL only; PostgreSQL execution is not HTTP/Supabase/P0 validation'};
    try{emit(terminal);terminalWritten=true;}catch{terminal.global='FAIL';terminal.journalError=journalError;}
    if(fd!==undefined){try{closeSync(fd);}catch(error){terminal.global='FAIL';terminal.journalError=diagnostic(error);}}
    interruption.dispose();
    if(terminal.global!=='PASS')process.exitCode=1;
    return {...terminal,journalWritten:terminalWritten,journalDirectory:logs};
  }
}
export async function main(args=process.argv.slice(2),{write=console.log}={}){
  let result;
  try{
    const config=parseArguments(args);
    if(config.mode==='plan'){write(JSON.stringify(staticPlan(),null,2));return;}
    result=await execute(config,transport(config.context,process.env));
  }catch(error){result=startupFailure(error);process.exitCode=1;}
  write(JSON.stringify(sanitize(result)));return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  main().catch(error=>{console.error(diagnostic(error));process.exitCode=1;});
}
