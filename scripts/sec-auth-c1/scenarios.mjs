import { setTimeout as delay } from 'node:timers/promises';
import { diagnostic, HarnessError } from './lifecycle.mjs';

export const id=(prefix,n)=>`${prefix}0000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const ids={owner:id(1,1),otherOwner:id(1,2),concierge:id(2,1),otherConcierge:id(2,2),
  provider:id(3,1),otherProvider:id(3,2),admin:id(4,1),superAdmin:id(4,2),suspended:id(4,3),demoted:id(4,4),
  mission:id(7,1),standalone:id(7,2),foreign:id(7,3),unknownProperty:id(7,4),badOwner:id(7,5),badProperty:id(7,6),reservation:id(6,1)};
const quote=s=>`'${s.replaceAll("'","''")}'`;
export const create=(op,actor=ids.concierge,mission=ids.mission,provider=ids.provider,body='{}',principal=actor)=>
  `SELECT public.create_mission_provider_assignment('${principal}','${actor}','${mission}','${provider}','${id('f',op)}',${quote(body)}::jsonb);`;
export function session(role,actor,text,commit=false) {
  if(!['authenticated','anon','service_role'].includes(role)||!/^[a-f0-9-]{36}$/.test(actor)) throw new Error('Synthetic identity required');
  return `BEGIN; SET LOCAL ROLE ${role}; SELECT set_config('request.jwt.claim.sub','${actor}',true);\n${text}\n${commit?'COMMIT':'ROLLBACK'};`;
}
export async function runScenarios({sql,openSession,log,read,checkInterrupted=()=>{}}) {
  const admin=async text=>(await sql(text));
  const server=async text=>(await sql(session('service_role',ids.concierge,text,true),'harness_server'));
  const client=async (actor,text,commit=false)=>(await sql(session('authenticated',actor,text,commit),'harness_client'));
  const ok=async (condition,label)=>(await admin(`SELECT harness.assert_true(${condition},${quote(label)});`));
  const refused=async (text,state='42501')=>(await server(`SELECT harness.expect_error(${quote(text)},'${state}');`));
  const check=async(name,fn)=>{
    checkInterrupted();log({scenario:name,status:'RUNNING'});
    try{await fn();checkInterrupted();log({scenario:name,status:'PASS'});}
    catch(error){log({scenario:name,status:'FAIL',error:diagnostic(error)});throw error;}
  };
  const count=async ()=>(await sql("SELECT (SELECT count(*) FROM provider_interventions)||':'||(SELECT count(*) FROM mission_provider_assignments)||':'||(SELECT count(*) FROM mission_events)||':'||(SELECT count(*) FROM provider_alerts);"));
  const parsed=text=>JSON.parse(text.trim().split('\n').at(-1));
  const observeBlock=async(blocked,blocker)=>{
    const deadline=Date.now()+8000;
    while(Date.now()<deadline){
      checkInterrupted();
      if((await sql(`SELECT EXISTS(SELECT 1 FROM pg_stat_activity b,pg_stat_activity a
        WHERE b.application_name='${blocked}' AND a.application_name='${blocker}' AND a.pid<>b.pid
          AND b.wait_event_type='Lock' AND a.pid=ANY(pg_blocking_pids(b.pid)));`)).trim()==='t') return;
      await delay(50);
    }
    throw new HarnessError(`No proven blocking relationship: ${blocked}/${blocker}`);
  };
  const settled=promise=>promise.then(value=>({ok:true,value}),error=>({ok:false,error}));
  const withRestoration=async(body,restore)=>{
    let primary;
    try{return await body();}catch(error){primary=error;throw error;}
    finally{
      try{await restore();}catch(error){
        if(!primary)throw error;
        primary.diagnostic={...primary.diagnostic,restorationFailure:diagnostic(error)};
        try{log({phase:'restoration-failed',error:diagnostic(error),primary:diagnostic(primary)});}catch{/* Original error still wins. */}
      }
    }
  };
  const initialize=async(s,app,role)=>{
    const pid=Number((await s.send(`SET application_name='${app}'; SET ROLE ${role}; SELECT pg_backend_pid();`)).trim());
    if(!Number.isInteger(pid)||pid<=0)throw new HarnessError('Session was not exercised');return pid;
  };
  let first;
  await check('rights-negative-and-no-writes',async ()=>{
    const before=(await count());
    for(const actor of [ids.owner,ids.provider,ids.suspended,ids.demoted,id(4,99)]) (await refused(create(1,actor)));
    (await refused(create(1,ids.concierge,ids.foreign)));
    (await refused(create(1,ids.admin,ids.mission,ids.provider,'{}',ids.owner)));
    (await refused(create(1,ids.concierge,ids.mission,ids.suspended)));
    if(before!==(await count()))throw Error('Writes after refusal');
    for(const role of ['anon','authenticated']) (await sql(session(role,ids.provider,
      `SELECT harness.expect_error(${quote(create(1))},'42501');
       SELECT harness.expect_error('SELECT * FROM public.mission_provider_assignments','42501');`),'harness_client'));
    (await client(ids.provider,`SELECT set_config('request.jwt.claim.role','service_role',true);
      SELECT harness.expect_error(${quote(create(1))},'42501');`));
  });
  await check('create-replay-and-multiple-interventions',async ()=>{
    first=parsed((await server(create(1))));const before=(await count());const replay=parsed((await server(create(1))));
    if(!replay.replayed||replay.intervention.id!==first.intervention.id||before!==(await count()))throw Error('Idempotence');
    (await refused(create(1,ids.concierge,ids.mission,ids.provider,'{"title":"Different"}'),'22023'));
    (await server(create(2,ids.admin)));(await server(create(3,ids.superAdmin)));(await server(create(4,ids.concierge,ids.standalone)));
    (await ok(`(SELECT count(*)=3 FROM mission_provider_assignments WHERE mission_id='${ids.mission}')`,'multiple interventions'));
  });
  await check('scope-and-legitimate-concierge-changes',async ()=>{
    (await refused(create(5,ids.concierge,ids.badOwner),'23514'));(await refused(create(6,ids.concierge,ids.badProperty),'23514'));
    (await client(ids.owner,`SELECT harness.expect_error('UPDATE public.reservations SET owner_profile_id=''${ids.otherOwner}'' WHERE id=''${ids.reservation}''','23514');
      SELECT harness.expect_error('UPDATE public.reservations SET property_id=''${id(5,2)}'' WHERE id=''${ids.reservation}''','23514');
      WITH changed AS (UPDATE public.reservations SET concierge_profile_id='${ids.otherConcierge}',owner_notes='Notes autorisées'
        WHERE id='${ids.reservation}' AND concierge_profile_id='${ids.concierge}' RETURNING concierge_profile_id,owner_notes)
      SELECT harness.assert_true(count(*)=1 AND coalesce(bool_and(concierge_profile_id='${ids.otherConcierge}' AND owner_notes='Notes autorisées'),false),'one legitimate concierge update') FROM changed;
      SELECT harness.assert_true((SELECT concierge_profile_id='${ids.otherConcierge}' FROM reservations WHERE id='${ids.reservation}'),'concierge observed before rollback');`));
    // Above transaction rolled back deliberately; prove retained business path.
    (await admin(`BEGIN;
      WITH changed AS (UPDATE missions SET concierge_profile_id='${ids.otherConcierge}' WHERE id='${ids.mission}' AND concierge_profile_id='${ids.concierge}' RETURNING id)
        SELECT harness.assert_true(count(*)=1,'one mission concierge update') FROM changed;
      WITH changed AS (UPDATE reservations SET concierge_profile_id='${ids.otherConcierge}' WHERE id='${ids.reservation}' AND concierge_profile_id='${ids.concierge}' RETURNING id)
        SELECT harness.assert_true(count(*)=1,'one reservation concierge update') FROM changed;
      SELECT harness.assert_true((SELECT concierge_profile_id='${ids.otherConcierge}' FROM missions WHERE id='${ids.mission}')
        AND (SELECT concierge_profile_id='${ids.otherConcierge}' FROM reservations WHERE id='${ids.reservation}'),'both transferred values observed');
      SELECT harness.assert_true((SELECT count(*)=3 FROM mission_provider_assignments WHERE mission_id='${ids.mission}'),'transfer retains assignments'); ROLLBACK;`));
    (await server(create(7,ids.concierge,ids.unknownProperty)));
    (await admin(`BEGIN;
      WITH changed AS (UPDATE reservations SET property_id='${id(5,1)}' WHERE id='${id(6,3)}' AND property_id IS NULL RETURNING id)
        SELECT harness.assert_true(count(*)=1,'unknown property actually filled') FROM changed;
      SELECT harness.assert_true((SELECT property_id='${id(5,1)}' FROM reservations WHERE id='${id(6,3)}'),'new property observed');
      SELECT harness.assert_true((SELECT reservation_property_id IS NULL FROM mission_provider_assignments WHERE operation_id='${id('f',7)}'),'unknown snapshot unchanged'); ROLLBACK;`));
    (await admin(`BEGIN;
      WITH changed AS (UPDATE missions SET owner_profile_id='${ids.owner}' WHERE id='${ids.foreign}' AND owner_profile_id='${ids.otherOwner}' RETURNING id)
        SELECT harness.assert_true(count(*)=1,'unassigned mission modified') FROM changed;
      WITH changed AS (UPDATE reservations SET owner_profile_id='${ids.owner}' WHERE id='${id(6,2)}' AND owner_profile_id='${ids.otherOwner}' RETURNING id)
        SELECT harness.assert_true(count(*)=1,'unassigned reservation modified') FROM changed; ROLLBACK;`));
  });
  await check('immutability-unique-and-delete',async ()=>{
    const a=first.assignment.id, i=first.intervention.id;
    (await admin(`BEGIN;
      SELECT harness.expect_error('UPDATE mission_provider_assignments SET provider_profile_id=''${ids.otherProvider}'' WHERE id=''${a}''','23514');
      SELECT harness.expect_error('UPDATE mission_provider_assignments SET mission_id=''${ids.standalone}'' WHERE id=''${a}''','23514');
      SELECT harness.expect_error('DELETE FROM mission_provider_assignments WHERE id=''${a}''','23514');
      SELECT harness.expect_error('DELETE FROM provider_interventions WHERE id=''${i}''','23503');
      SELECT harness.expect_error('DELETE FROM missions WHERE id=''${ids.mission}''','23503');
      SELECT harness.expect_error('DELETE FROM profiles WHERE id=''${ids.provider}''','23503');
      SELECT harness.expect_error('DELETE FROM reservations WHERE id=''${ids.reservation}''','23503,23514');
      SELECT harness.expect_error('UPDATE provider_interventions SET provider_profile_id=''${ids.otherProvider}'' WHERE id=''${i}''','23514');
      SELECT harness.expect_error('UPDATE missions SET reservation_id=NULL WHERE id=''${ids.mission}''','23514');
      SELECT harness.expect_error('INSERT INTO mission_provider_assignments SELECT * FROM mission_provider_assignments WHERE id=''${a}''','23505');
      SELECT harness.expect_error('INSERT INTO mission_provider_assignments SELECT (jsonb_populate_record(NULL::mission_provider_assignments,to_jsonb(t)||jsonb_build_object(''id'',''${id('e',1)}'',''operation_id'',''${id('e',2)}''))).* FROM mission_provider_assignments t WHERE id=''${a}''','23505');
      WITH inserted AS (INSERT INTO provider_interventions
        SELECT (jsonb_populate_record(NULL::provider_interventions,to_jsonb(t)||jsonb_build_object('id','${id('e',3)}'))).*
        FROM provider_interventions t WHERE id='${i}' RETURNING id)
        SELECT harness.assert_true(count(*)=1,'independent intervention for operation uniqueness') FROM inserted;
      SELECT harness.expect_error('INSERT INTO mission_provider_assignments SELECT (jsonb_populate_record(NULL::mission_provider_assignments,
        to_jsonb(t)||jsonb_build_object(''id'',''${id('e',4)}'',''provider_intervention_id'',''${id('e',3)}''))).*
        FROM mission_provider_assignments t WHERE id=''${a}''','23505');
      ROLLBACK;`));
    (await client(ids.provider,`DELETE FROM provider_interventions WHERE id='${id(8,1)}';
      SELECT harness.assert_true(NOT EXISTS(SELECT 1 FROM provider_interventions WHERE id='${id(8,1)}'),'autonomous delete');`));
  });
  await check('forged-metadata-is-not-provenance',async ()=>{
    (await ok(`NOT EXISTS(SELECT 1 FROM mission_provider_assignments WHERE mission_id='${ids.foreign}' AND provider_profile_id='${ids.provider}')`,'foreign mission initially unauthorized'));
    (await client(ids.provider,`WITH changed AS (UPDATE provider_interventions
      SET metadata='{"mission_id":"${ids.foreign}","forged":true}' WHERE id='${id(8,1)}'
      RETURNING id,metadata)
      SELECT harness.assert_true(count(*)=1 AND coalesce(bool_and(id='${id(8,1)}'
        AND metadata->>'mission_id'='${ids.foreign}' AND metadata->>'forged'='true'),false),'forged UPDATE truly exercised') FROM changed;
      SELECT harness.assert_true((SELECT metadata->>'forged'='true' FROM provider_interventions WHERE id='${id(8,1)}'),'visible before commit');`,true));
    (await ok(`(SELECT metadata->>'forged'='true' FROM provider_interventions WHERE id='${id(8,1)}')`,'forgery committed only in disposable database'));
    (await ok(`NOT EXISTS(SELECT 1 FROM mission_provider_assignments WHERE provider_intervention_id='${id(8,1)}')`,'no forged assignment'));
    (await ok(`NOT EXISTS(SELECT 1 FROM mission_provider_assignments WHERE mission_id='${ids.foreign}' AND provider_profile_id='${ids.provider}')`,'no new foreign mission right'));
    (await client(ids.provider,`SELECT harness.expect_error(${quote(create(99,ids.provider,ids.foreign))},'42501');
      SELECT harness.expect_error('SELECT * FROM mission_provider_assignments','42501');`));
    (await admin(read('scripts/sec-auth-c1/permissions.sql')));
    (await refused(`INSERT INTO mission_provider_assignments(mission_id) VALUES('${ids.foreign}');`));
  });
  await check('atomic-failure-after-last-write',async ()=>{
    const before=(await count()),history=(await admin(read('scripts/sec-auth-c1/history.sql')));
    (await admin(`CREATE FUNCTION harness.fail_alert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure' USING ERRCODE='P0001'; END $$;
      CREATE TRIGGER zz_c1d_fail_alert AFTER INSERT ON public.provider_alerts FOR EACH ROW EXECUTE FUNCTION harness.fail_alert();`));
    await withRestoration(async()=>{
      await refused(create(8),'P0001');
      if(before!==await count()||history!==await admin(read('scripts/sec-auth-c1/history.sql')))throw new HarnessError('Partial transaction','integrity');
    },()=>admin('DROP TRIGGER zz_c1d_fail_alert ON public.provider_alerts; DROP FUNCTION harness.fail_alert();'));
    // Definitive full history comparison also covers updates of mission metadata.
    (await server(create(8)));
  });
  await check('owner-inheritance-and-unexpected-default-acl',async ()=>{
    const m2=read('supabase/migrations/20261112121000_mission_provider_assignment_functions.sql');
    const preflight=m2.match(/DO \$preflight\$[\s\S]*?\$preflight\$;/)?.[0];
    const acl=m2.match(/DO \$acl\$[\s\S]*?\$acl\$;/)?.[0];
    if(!preflight||!acl)throw Error('Missing preflight');
    (await admin(`BEGIN; ALTER FUNCTION public.guard_mission_provider_assignment() OWNER TO authenticated;
      SELECT harness.expect_error(${quote(preflight)},'42501'); ROLLBACK;`));
    (await admin(`BEGIN; GRANT service_role TO authenticated;
      SELECT harness.expect_error(${quote(preflight)},'42501'); ROLLBACK;`));
    (await admin(`BEGIN; GRANT EXECUTE ON FUNCTION public.assert_mission_assignment_actor(uuid,uuid,uuid) TO PUBLIC;
      SELECT harness.expect_error(${quote(acl)},'42501'); ROLLBACK;`));
  });
  await check('real-concurrent-idempotency',async()=>{
    const a=await openSession(),b=await openSession();
    try{
      const pidA=await initialize(a,'c1d-create-a','service_role'),pidB=await initialize(b,'c1d-create-b','service_role');
      if(pidA===pidB)throw new HarnessError('Sessions must be distinct');
      const firstResult=parsed(await a.send('BEGIN;'+create(20)));
      // A reste en transaction. B attend réellement A; COMMIT est la barrière.
      const pending=settled(b.send('BEGIN;'+create(20)+'COMMIT;'));
      await observeBlock('c1d-create-b','c1d-create-a');
      await a.send('COMMIT;');const second=await pending;
      if(!second.ok)throw second.error;
      const replay=parsed(second.value);
      if(firstResult.replayed!==false||replay.replayed!==true||typeof firstResult.intervention?.id!=='string'
        ||firstResult.intervention.id!==replay.intervention?.id)throw new HarnessError('Both concurrent RPC outcomes required');
      await ok(`(SELECT count(*)=1 FROM mission_provider_assignments WHERE operation_id='${id('f',20)}')`,'one concurrent assignment');
    }finally{await Promise.all([a.close(),b.close()]);}
  });
  await check('expected-lock-timeout',async()=>{
    const a=await openSession(),b=await openSession();
    try{
      await initialize(a,'c1d-timeout-a','service_role');await initialize(b,'c1d-timeout-b','service_role');
      await a.send('BEGIN;'+create(30));
      const result=await settled(b.send("BEGIN;SET LOCAL lock_timeout='500ms';"+create(30)));
      if(result.ok||diagnostic(result.error).sqlstate!=='55P03')throw new HarnessError('Expected lock timeout 55P03, not contention success');
      log({phase:'expected-timeout',sqlstate:'55P03',error:diagnostic(result.error)});
      await a.send('ROLLBACK;');await server(create(30));
    }finally{await Promise.all([a.close(),b.close()]);}
  });
  await check('synthetic-deadlock-and-complete-retry',async()=>{
    const a=await openSession('postgres'),b=await openSession('postgres');
    try{
      const pidA=await initialize(a,'c1d-dead-a','postgres'),pidB=await initialize(b,'c1d-dead-b','postgres');
      if(pidA===pidB)throw new HarnessError('Distinct deadlock sessions required');
      await a.send(`BEGIN;SELECT id FROM profiles WHERE id='${ids.owner}' FOR UPDATE;`);
      await b.send(`BEGIN;SELECT id FROM profiles WHERE id='${ids.otherOwner}' FOR UPDATE;`);
      const firstWait=settled(a.send(`SELECT id FROM profiles WHERE id='${ids.otherOwner}' FOR UPDATE;`));
      await observeBlock('c1d-dead-a','c1d-dead-b');
      const secondWait=settled(b.send(`SELECT id FROM profiles WHERE id='${ids.owner}' FOR UPDATE;`));
      const results=await Promise.all([firstWait,secondWait]);
      if(results.filter(r=>!r.ok).length!==1||!results.some(r=>!r.ok&&diagnostic(r.error).sqlstate==='40P01'))throw new HarnessError('Synthetic cycle must produce 40P01');
      if(results[0].ok)await a.send('COMMIT;');if(results[1].ok)await b.send('COMMIT;');
      log({phase:'synthetic-deadlock',error:diagnostic(results.find(r=>!r.ok).error)});
      await admin(`BEGIN;SELECT id FROM profiles WHERE id IN('${ids.owner}','${ids.otherOwner}') ORDER BY id FOR UPDATE;COMMIT;`);
      await server(create(20));
    }finally{await Promise.all([a.close(),b.close()]);}
  });
  await check('terminal-revocation-and-current-rights',async ()=>{
    const revoke=`SELECT public.revoke_mission_provider_assignment('${ids.concierge}','${ids.concierge}','${first.assignment.id}','Révocation synthétique');`;
    (await server(revoke));(await server(revoke));(await refused(create(1),'55000'));
    (await admin(`SELECT harness.expect_error('UPDATE mission_provider_assignments SET state=''active'' WHERE id=''${first.assignment.id}''','23514');`));
    (await admin(`UPDATE profiles SET status='suspended' WHERE id='${ids.concierge}';`));
    await withRestoration(()=>refused(create(21)),()=>admin(`UPDATE profiles SET status='active' WHERE id='${ids.concierge}';`));
    (await admin(`UPDATE profiles SET role='owner' WHERE id='${ids.admin}';`));
    await withRestoration(()=>refused(create(22,ids.admin)),()=>admin(`UPDATE profiles SET role='admin' WHERE id='${ids.admin}';`));
    (await ok(`EXISTS(SELECT 1 FROM mission_provider_assignments WHERE id='${first.assignment.id}' AND state='revoked')`,'history retained'));
    (await ok(`EXISTS(SELECT 1 FROM invoices WHERE invoice_number='C1D-HISTORY')`,'historical invoice retained'));
  });
}
