import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdtempSync, openSync, appendFileSync, fsyncSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import { loadManifest, staticPlan, snapshotFiles } from './plan.mjs';
import { createIdentity, createArguments, assertOwnedContainer, database, localEndpoint } from '../sec-auth-c1/plan.mjs';
import { transport } from './transport.mjs';
import { createInterruption, diagnostic } from '../sec-auth-c1/lifecycle.mjs';
import { runAtomicity } from './atomicity.mjs';
import { runConcurrency, seedSolicitation } from './concurrency.mjs';
import { runBusinessAtomicity } from './business-atomicity.mjs';
import { campaignIdentity, campaignLabel, purposeLabel, recoverAndCleanup } from './recovery.mjs';

export function parseArguments(args) {
  if (!args.length || (args.length === 1 && args[0] === '--plan')) return { mode: 'plan' };
  const values = {};
  for (const arg of args) {
    if (arg === '--execute' && !values.execute) { values.execute = true; continue; }
    const match = /^--(authorize|image|context|daemon-id|profile|manifest-sha256)=(.+)$/.exec(arg);
    if (!match || Object.hasOwn(values, match[1])) throw Error('Unknown or duplicate argument');
    values[match[1]] = match[2];
  }
  if (!values.execute || values.authorize !== 'PFC-COL-E2B' || !/^sha256:[a-f0-9]{64}$/.test(values.image ?? '')
    || !/^[a-f0-9]{64}$/.test(values['manifest-sha256'] ?? '') || !/^\w[\w.-]*$/.test(values.context ?? '')
    || !/^\w[\w:-]*$/.test(values['daemon-id'] ?? '') || !['fresh','existing'].includes(values.profile)) throw Error('Explicit E2B authorization and pinned parameters required');
  return { ...values, mode: 'execute' };
}

export async function execute(config, docker, { events = process, snapshot = snapshotFiles, manifest = loadManifest, sleep = delay, maxReadyAttempts = 15, journalFactory = createJournal, globalTimeoutMs = 1200000, cleanupTimeoutMs = 90000 } = {}) {
  const id = campaignIdentity(createIdentity()); const report = { global: 'BLOCKED', sql: 'NOT RUN', cleanup: 'NOT RUN', stage: 'manifest', completed: [], error: null, resource: null };
  let cancellationError = false;
  const cancel = () => { try { docker.cancelWork(); } catch { cancellationError = true; } };
  const interruption = createInterruption(events, cancel); let endpoint, daemon, journal, expired = false, cleanupDeadline;
  const deadline = performance.now() + globalTimeoutMs;
  const bounded = async (start, end, cancel) => {
    const remaining = end - performance.now();
    if (remaining <= 0) { cancel(); throw Error('GLOBAL_DEADLINE'); }
    let timer;
    try { return await Promise.race([Promise.resolve().then(start), new Promise((_, reject) => { timer = setTimeout(() => { cancel(); reject(Error('GLOBAL_DEADLINE')); }, remaining); })]); }
    finally { clearTimeout(timer); }
  };
  const call = (args, input, cleanup = false, timeout = 60000) => {
    if (!cleanup) interruption.check();
    const end = cleanup ? cleanupDeadline : deadline;
    return bounded(() => docker.call(args, input, { cleanup, timeout: Math.max(1, Math.min(timeout, end - performance.now())) }), end,
      () => { if (!cleanup) { expired = true; cancel(); } });
  };
  const record = (event, extra = {}) => journal.write({ at: new Date().toISOString(), event, stage: report.stage, ...extra });
  const verifyDaemon = async (cleanup = false, timeout = 60000) => {
    const contexts = JSON.parse(await call(['context','inspect',config.context], undefined, cleanup, timeout));
    if (contexts.length !== 1 || contexts[0].Endpoints?.docker?.Host !== endpoint) throw Error('Context changed');
    const current = JSON.parse(await call(['info','--format','{{json .}}'], undefined, cleanup, timeout));
    if (current.ID !== daemon || current.OSType !== 'linux' || current.Swarm?.LocalNodeState !== 'inactive') throw Error('Daemon changed');
  };
  const verify = async (cleanup = false, timeout = 60000) => {
    await verifyDaemon(cleanup,timeout);
    const containers = JSON.parse(await call(['container','inspect',id.id], undefined, cleanup, timeout));
    if (containers.length !== 1) throw Error('Ambiguous container');
    assertOwnedContainer(containers[0],id,config.image);
    if (containers[0].Config?.Labels?.[campaignLabel] !== id.token || containers[0].Config?.Labels?.[purposeLabel] !== 'isolated-tests') throw Error('Campaign labels mismatch');
    const h = containers[0].HostConfig;
    if (h.Memory !== 1073741824 || h.NanoCpus !== 2000000000 || h.PidsLimit !== 128
      || !h.Tmpfs?.['/var/run/postgresql'] || !h.Tmpfs?.['/tmp']) throw Error('Resource bounds or tmpfs missing');
    return containers[0].State;
  };
  const sql = async (source, timeout = 60000) => {
    await verify(false, timeout);
    return call(['exec','-i','--env','PGOPTIONS=-c statement_timeout=20000 -c lock_timeout=3000 -c idle_in_transaction_session_timeout=30000',id.id,
      'psql','-X','--no-password','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-h','/var/run/postgresql','-U','postgres','-d',database],source,false,timeout);
  };
  const applyMigrations = async (migrations, read) => {
    if (!migrations.length) return;
    report.stage = migrations[0].path;
    const markers = migrations.map(({path}) => `E2B_APPLIED ${path}`);
    const batch = migrations.map(({path}, index) =>
      `\\connect ${database}\n${read(path)}\n\\echo ${markers[index]}\n`).join('');
    const output = await sql(batch, 180000);
    const applied = output.split(/\r?\n/).filter(line => line.startsWith('E2B_APPLIED '));
    if (JSON.stringify(applied) !== JSON.stringify(markers)) throw Error('Incomplete migration evidence');
    for (const {path} of migrations) {
      report.stage = path;
      report.completed.push(path);
      record('completed', { item: path });
    }
  };
  const openSession = async () => {
    await verify();
    const child = await bounded(() => docker.open(['exec','-i','--env','PGOPTIONS=-c statement_timeout=60000 -c lock_timeout=45000 -c idle_in_transaction_session_timeout=90000',id.id,
      'psql','-X','--no-password','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-h','/var/run/postgresql','-U','postgres','-d',database]), deadline, () => { expired=true; cancel(); });
    return { send: source => bounded(() => child.send(source, { timeout: 75000 }), deadline, () => { expired=true; cancel(); }), close: () => bounded(() => child.close(), deadline, () => { expired=true; cancel(); }) };
  };
  try {
    journal = journalFactory(); report.journal = journal.path; record('start');
    parseArguments(['--execute', `--authorize=${config.authorize}`, `--image=${config.image}`, `--context=${config.context}`, `--daemon-id=${config['daemon-id']}`, `--profile=${config.profile}`, `--manifest-sha256=${config['manifest-sha256']}`]);
    const m = manifest();
    if (m.digest !== config['manifest-sha256']) throw Error('Manifest digest mismatch');
    const files = snapshot(m);
    if (performance.now() >= deadline) { expired = true; throw Error('GLOBAL_DEADLINE'); }
    const read = p => { if (!Object.hasOwn(files,p)) throw Error('Unpinned input'); return files[p]; };
    report.stage = 'host';
    const contexts = JSON.parse(await call(['context','inspect',config.context]));
    endpoint = contexts[0]?.Endpoints?.docker?.Host;
    if (contexts.length !== 1 || !localEndpoint(endpoint)) throw Error('Remote or unknown endpoint');
    docker.pin(endpoint);
    const info = JSON.parse(await call(['info','--format','{{json .}}'])); daemon = info.ID;
    if (daemon !== config['daemon-id'] || info.OSType !== 'linux' || info.Swarm?.LocalNodeState !== 'inactive') throw Error('Unapproved daemon');
    const images = JSON.parse(await call(['image','inspect',config.image])); const image = images[0];
    if (images.length !== 1 || image.Id !== config.image || image.Os !== 'linux' || !image.Config?.Env?.includes('PG_MAJOR=17')
      || image.Config?.Entrypoint?.length !== 1 || path.posix.basename(image.Config.Entrypoint[0]) !== 'docker-entrypoint.sh'
      || Object.keys(image.Config.Volumes ?? {}).some(p => p !== '/var/lib/postgresql/data')) throw Error('Unapproved image');
    report.stage = 'create';
    report.resource={name:id.name,campaign:id.token,image:config.image,context:config.context,daemon};
    record('creation-pending',{resource:report.resource});
    const createArgs=createArguments(id,config.image); createArgs.splice(1,0,'--label',`${campaignLabel}=${id.token}`,'--label',`${purposeLabel}=isolated-tests`);
    const container = (await call(createArgs)).trim();
    if (!/^[a-f0-9]{64}$/.test(container)) throw Error('Unknown creation ID: manual recovery required');
    id.id = container; id.created = true; report.resource = { ...report.resource, id:container };
    record('created', { resource: report.resource });
    await verify(); await call(['start',id.id]);
    report.stage = 'readiness'; let ready = false;
    for (let attempt = 0; attempt < maxReadyAttempts; attempt++) {
      interruption.check();
      try { ready = (await sql('SELECT 1;', 15000)).trim() === '1'; } catch { interruption.check(); }
      if (ready) break;
      if (attempt + 1 < maxReadyAttempts) await bounded(() => sleep(1000), deadline, () => { expired = true; cancel(); });
    }
    if (!ready) throw Error('PostgreSQL readiness deadline exceeded');
    record('ready');
    report.stage = 'foundation'; await sql(read('scripts/sec-auth-c1/foundation.sql')); report.completed.push('foundation'); record('completed', { item: 'foundation' });
    let before;
    if (config.profile === 'existing') {
      await applyMigrations(m.migrations.slice(0, -2), read);
      report.stage = 'fixtures'; await sql(read('scripts/provider-solicitations-e2a/fixtures.sql'));
      before = await sql(read('scripts/provider-solicitations-e2a/history.sql'));
      await applyMigrations(m.migrations.slice(-2), read);
    } else {
      await applyMigrations(m.migrations, read);
    }
    if (config.profile === 'existing' && before !== await sql(read('scripts/provider-solicitations-e2a/history.sql'))) throw Error('Existing synthetic data changed');
    if (config.profile === 'fresh') { report.stage = 'fixtures'; await sql(read('scripts/provider-solicitations-e2a/fixtures.sql')); }
    report.stage = 'assertions'; await sql(read('scripts/provider-solicitations-e2a/assertions.sql')); record('assertions_passed', { item: 'assertions.sql' }); await sql(read('scripts/provider-solicitations-e2a/scenarios.sql')); record('assertions_passed', { item: 'scenarios.sql' });
    report.stage = 'synthetic-atomicity'; await runAtomicity(sql); record('assertions_passed', { item: 'synthetic-atomicity' });
    report.stage = 'business-atomicity'; const solicitationId = await seedSolicitation(sql); await runBusinessAtomicity(sql, solicitationId); record('assertions_passed', { item: 'business-atomicity' });
    report.stage = 'concurrency'; await runConcurrency({sql,openSession,solicitationId}); record('assertions_passed', { item: 'concurrency' });
    if (performance.now() >= deadline) { expired = true; throw Error('GLOBAL_DEADLINE'); }
    report.sql = 'PARTIAL'; report.error = { message: 'Préparation non validée en conditions réelles ; aucun PASS PostgreSQL ne peut être émis.' };
  } catch (error) { if (performance.now() >= deadline || error.message === 'GLOBAL_DEADLINE') expired = true; const details=diagnostic(error); report.error = { message: expired ? 'Délai global dépassé ; des ressources peuvent nécessiter une vérification manuelle.' : 'Échec à cette étape ; consulter le statut, sans données SQL dans le journal.', sqlstate:details.sqlstate, exitCode:Number.isInteger(details.exitCode)?details.exitCode:null }; report.sql = report.stage === 'readiness' || report.stage === 'foundation' || report.completed.length ? 'FAIL' : 'NOT RUN'; }
  finally {
    cancel();
    cleanupDeadline = performance.now() + cleanupTimeoutMs;
    try { const cancellation=await bounded(() => docker.cancelAndWait(),cleanupDeadline,()=>{}); report.cancellation=cancellation.confirmed&&!cancellationError?'cli-closed':'unconfirmed'; }
    catch { report.cancellation='unconfirmed'; }
    if (report.stage !== 'manifest' && report.resource && report.cancellation==='cli-closed') {
      try {
        const recovery=await recoverAndCleanup({identity:id,call:a=>call(a,undefined,true),verifyDaemon:()=>verifyDaemon(true),inspect:()=>verify(true)});
        report.recovery=recovery; if(id.id) report.resource.id=id.id;
        report.cleanup=recovery.status==='REMOVED'?'PASS':'UNCERTAIN';
      } catch { if(id.id) report.resource.id=id.id; report.cleanup = 'FAIL'; report.cleanupError = { message: 'Réconciliation ou nettoyage incertain ; vérification manuelle nécessaire.' }; }
    }
    else if (id.created) { report.cleanup='FAIL'; report.cleanupError={message:'Processus non confirmé arrêté ; ressource potentiellement restante.'}; }
    if (!id.created && report.stage === 'create' && report.resource) report.resource.status = 'unknown: manual verification required';
    if (expired) { report.timedOut = true; report.global = 'FAIL'; }
    if (interruption.signal) { report.interrupted = interruption.signal; report.global = 'FAIL'; }
    else if (['FAIL','UNCERTAIN'].includes(report.cleanup) || report.sql === 'FAIL') report.global = 'FAIL';
    interruption.dispose();
    if (journal) { try { record('terminal', { global: report.global, sql: report.sql, cleanup: report.cleanup, recovery:report.recovery, cancellation:report.cancellation, error:report.error, exit_code: 1, timedOut: expired, resource: report.resource, interrupted: report.interrupted ?? null }); } catch { report.global = 'FAIL'; report.journalError = 'Journal indisponible ou incomplet'; } finally { try { journal.close(); } catch { report.global = 'FAIL'; report.journalError = 'Fermeture du journal impossible'; } } }
  }
  return report;
}
export function createJournal() {
  const dir = mkdtempSync(path.join(tmpdir(), 'planetls-solicitations-'));
  const file = path.join(dir, 'journal.jsonl'); const fd = openSync(file, 'wx', 0o600);
  return { path: file, write(value) { appendFileSync(fd, JSON.stringify(value)+'\n', 'utf8'); fsyncSync(fd); }, close() { closeSync(fd); } };
}
export async function main(args = process.argv.slice(2)) {
  const config = parseArguments(args);
  if (config.mode === 'plan') { console.log(JSON.stringify(staticPlan(),null,2)); return; }
  const report = await execute(config,transport(config.context,process.env));
  console.log(JSON.stringify(report)); process.exitCode = report.global === 'PASS' ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(diagnostic(error)); process.exitCode = 1; });
