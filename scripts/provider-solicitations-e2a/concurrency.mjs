import { setTimeout as delay } from 'node:timers/promises';
const owner='10000000-0000-4000-8000-000000000001', provider='30000000-0000-4000-8000-000000000001';
const first='f0000000-0000-4000-8000-000000000010', second='f0000000-0000-4000-8000-000000000011';
const quote = s => `'${s.replaceAll("'","''")}'`;
export async function seedSolicitation(sql) {
  const seed = await sql(`SELECT public.create_provider_solicitation('${owner}','${owner}','f0000000-0000-4000-8000-000000000009',jsonb_build_object(
'provider_profile_id','${provider}','service_slug','cleaning_standard','service_label_snapshot','Ménage du logement','description','Concurrence synthétique',
'location',jsonb_build_object('kind','address','address','2 rue Test','city','Testville','postal_code','00000','country_code','FR'),
'location_declaration',jsonb_build_object('city','Testville','address','2 rue Test'),'reservation_id',NULL,'desired_at',NULL,
'location_label','2 rue Test','city','Testville','postal_code','00000','country_code','FR','latitude',0,'longitude',0,
'geocoded_at','2026-01-01T00:00:00Z','geocoding_source','synthetic','provider_declaration',
(SELECT jsonb_build_object('option',option,'availability_hours',availability_hours,'service_radius_km',service_radius_km,'latitude',latitude,'longitude',longitude) FROM public.profiles WHERE id='${provider}')));`);
  const result=JSON.parse(seed.trim().split('\n').at(-1)); const id=result.result?.solicitation_id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id ?? '')) throw Error('Invalid synthetic solicitation ID');
  return id;
}
export async function runConcurrency({sql,openSession,sleep=delay,now=()=>performance.now(),timeoutMs=8000,solicitationId}) {
  const id=solicitationId ?? await seedSolicitation(sql);
  const command=(key,status)=>`SELECT public.respond_provider_solicitation('${provider}','${provider}','${key}','${id}','${status}',NULL,1);`;
  let a,b,pending;
  try {
    a=await openSession(); b=await openSession();
    const pidA=Number((await a.send("SET application_name='sol_e2e_a'; SET ROLE service_role; SELECT pg_backend_pid(); BEGIN;")).trim());
    const pidB=Number((await b.send("SET application_name='sol_e2e_b'; SET ROLE service_role; SELECT pg_backend_pid(); BEGIN;")).trim());
    if (!Number.isInteger(pidA)||!Number.isInteger(pidB)||pidA<=0||pidA===pidB) throw Error('Independent sessions not proven');
    const response=JSON.parse((await a.send(command(first,'interested'))).trim().split('\n').at(-1));
    if(response.result?.status!=='interested'||response.result?.version!==2) throw Error('First response invalid');
    const replayAndConflict = command(first,'interested') + '\n'
      + `SELECT harness.expect_error(${quote(command(second,'declined'))},'55000');`;
    pending=b.send(replayAndConflict).then(value=>({ok:true,value}),error=>({ok:false,error}));
    const deadline=now()+timeoutMs; let blocked=false;
    while(now()<deadline) {
      const found=await sql(`SELECT EXISTS(SELECT 1 FROM pg_stat_activity b WHERE b.pid=${pidB} AND b.wait_event_type='Lock' AND ${pidA}=ANY(pg_blocking_pids(b.pid)));`);
      if(found.trim()==='t'){blocked=true;break;} await sleep(50);
    }
    if(!blocked) throw Error('Concurrency barrier timed out: lock contention not observed');
    await a.send('COMMIT;');
    const outcome=await pending;
    pending=null;
    if(!outcome.ok) throw outcome.error;
    const replay=JSON.parse(outcome.value.trim().split('\n')[0]);
    if(replay.replayed!==true || !response.operation_id || replay.operation_id!==response.operation_id
      || replay.result?.solicitation_id!==id || replay.result?.status!=='interested' || replay.result?.version!==2) {
      throw Error('Concurrent replay returned a different receipt');
    }
    await b.send('COMMIT;');
    await sql(`SELECT harness.assert_true((SELECT status='interested' AND version=2 FROM public.provider_solicitations WHERE id='${id}') AND (SELECT count(*)=2 FROM public.provider_solicitation_events WHERE solicitation_id='${id}') AND (SELECT count(*)=1 FROM public.provider_solicitation_events WHERE solicitation_id='${id}' AND version=2) AND (SELECT count(*)=2 FROM public.provider_solicitation_operations WHERE solicitation_id='${id}'),'concurrent final state');`);
  } finally {
    if(pending) pending.catch(()=>{});
    if(a) await a.close(); if(b) await b.close();
  }
}
