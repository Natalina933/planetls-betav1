import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { root, database, digestPattern, read, loadManifest, staticPlan, localEndpoint,
  cleanEnvironment, createIdentity, createArguments, assertOwnedContainer } from './plan.mjs';
import { runScenarios } from './scenarios.mjs';

export function parseArguments(args) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--plan')) return { mode: 'plan' };
  const values = {};
  for (const arg of args) {
    const match = arg.match(/^--(authorize|image|context|daemon-id|profile)=(.+)$/);
    if (arg === '--execute' && !values.execute) values.execute = true;
    else if (match && !Object.hasOwn(values, match[1])) values[match[1]] = match[2];
    else throw new Error(`Unknown or duplicate argument: ${arg}`);
  }
  if (!values.execute || values.authorize !== 'CONCIERGE-04B'
    || !digestPattern.test(values.image ?? '') || !/^[\w.-]+$/.test(values.context ?? '')
    || !/^[\w:-]+$/.test(values['daemon-id'] ?? '') || !['fresh','existing'].includes(values.profile)) {
    throw new Error('Execution requires explicit 04B authorization, local image ID, context, daemon ID and fresh/existing profile');
  }
  return { ...values, mode: 'execute' };
}
function processResult(result) {
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `Command exit ${result.status}`);
  return result.stdout;
}
export function transport(context, environment) {
  const env = cleanEnvironment(environment);
  let endpoint;
  const command = args => {
    if (args[0] === 'context') return ['--context', context, ...args];
    if (!endpoint) throw new Error('Daemon access before local endpoint validation');
    return ['--host', endpoint, ...args];
  };
  return {
    pin(local) {
      if (!localEndpoint(local) || (endpoint && endpoint !== local)) throw new Error('Invalid endpoint pin');
      endpoint = local;
    },
    sync(args, input) {
      return processResult(spawnSync('docker', command(args), {
        cwd: root, env, input, encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 8 * 1024 * 1024,
      }));
    },
    async(args, input) {
      return new Promise((resolve, reject) => {
        const child = spawn('docker', command(args), { cwd: root, env, windowsHide: true, stdio: ['pipe','pipe','pipe'] });
        let stdout = '', stderr = '';
        const timer = setTimeout(() => { child.kill(); reject(new Error('Docker exec deadline exceeded')); }, 30000);
        child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
        child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
        child.on('error', error => { clearTimeout(timer); reject(error); });
        child.on('close', status => {
          clearTimeout(timer);
          if (status === 0) resolve(stdout);
          else reject(new Error(stderr || `Exit ${status}`));
        });
        child.stdin.on('error', error => { clearTimeout(timer); reject(error); });
        child.stdin.end(input);
      });
    }
  };
}
const json = output => JSON.parse(output);
export function validateHost(config, docker) {
  // context inspect reads local metadata, before any daemon command is permitted.
  const contexts = json(docker.sync(['context','inspect',config.context]));
  if (contexts.length !== 1 || !localEndpoint(contexts[0].Endpoints?.docker?.Host)) throw new Error('Remote or unknown Docker endpoint refused');
  // Pin the validated local socket, so a later context edit cannot redirect I/O.
  docker.pin(contexts[0].Endpoints.docker.Host);
  const daemon = json(docker.sync(['info','--format','{{json .}}']));
  if (daemon.ID !== config['daemon-id'] || daemon.OSType !== 'linux'
    || daemon.Swarm?.LocalNodeState !== 'inactive') throw new Error('Unknown/nonlocal daemon or active swarm refused');
  const images = json(docker.sync(['image','inspect',config.image]));
  const image = images[0];
  if (images.length !== 1 || image.Id !== config.image || image.Os !== 'linux'
    || !image.Config?.Env?.includes('PG_MAJOR=17')
    || path.posix.basename(image.Config?.Entrypoint?.[0] ?? '') !== 'docker-entrypoint.sh'
    || image.Config?.Entrypoint?.length !== 1
    || Object.keys(image.Config?.Volumes ?? {}).some(volume => volume !== '/var/lib/postgresql/data')) {
    throw new Error('Image missing or not the explicitly approved PostgreSQL 17 image');
  }
  return daemon.ID;
}
export async function execute(config, docker) {
  const manifest = loadManifest();
  const identity = createIdentity();
  const daemonID = validateHost(config, docker);
  const logs = mkdtempSync(path.join(tmpdir(), 'planetls-concierge-04b-'));
  const log = record => appendFileSync(path.join(logs, 'journal.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`, 'utf8');
  const inspect = () => {
    const info = json(docker.sync(['container','inspect',identity.id]));
    if (info.length !== 1) throw new Error('Ambiguous container');
    assertOwnedContainer(info[0], identity, config.image);
    return info[0];
  };
  const verify = () => {
    const context = json(docker.sync(['context','inspect',config.context]));
    if (context.length !== 1 || !localEndpoint(context[0].Endpoints?.docker?.Host)) throw new Error('Context changed');
    const daemon = json(docker.sync(['info','--format','{{json .}}']));
    if (daemon.ID !== daemonID) throw new Error('Daemon changed');
    return inspect();
  };
  const sqlArguments = user => {
    if (!['postgres','harness_client','harness_server'].includes(user)) throw new Error('External SQL user refused');
    verify();
    return ['exec','-i', '--env', 'PGOPTIONS=-c statement_timeout=15000 -c lock_timeout=3000 -c idle_in_transaction_session_timeout=15000',
      identity.id, 'psql','-X','--no-password','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose',
      '-h','/var/run/postgresql','-U',user,'-d',database];
  };
  const sql = (source, user = 'postgres') => docker.sync(sqlArguments(user), source);
  const parallel = (source, user = 'harness_server') => docker.async(sqlArguments(user), source);
  try {
    // CREATE is exclusive: no reuse/start/remove by guessed name, and no --rm race.
    const id = docker.sync(createArguments(identity, config.image)).trim();
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Creation returned an invalid ID; no guessed cleanup');
    identity.id = id; identity.created = true;
    log({ phase: 'created', id, name: identity.name, image: config.image, profile: config.profile, daemonID });
    verify();
    docker.sync(['start', id]);
    const deadline = Date.now() + 45000;
    for (;;) {
      try { sql('SELECT 1;'); break; }
      catch (error) { if (Date.now() >= deadline) throw error; await delay(250); }
    }
    sql(read('scripts/concierge-04b/foundation.sql'));
    let seeded = false;
    let before;
    const fingerprint = () => sql("SELECT md5(string_agg(row_to_json(p)::text, '' ORDER BY id)) FROM public.profiles p;")
      + sql("SELECT md5(string_agg(row_to_json(m)::text, '' ORDER BY id)) FROM public.missions m;")
      + sql("SELECT md5(string_agg(row_to_json(i)::text, '' ORDER BY id)) FROM public.invoices i;");
    for (const item of manifest.migrations) {
      if (config.profile === 'existing' && item.kind === 'compatibility' && !seeded) {
        sql(read('scripts/concierge-04b/fixtures.sql')); seeded = true; before = fingerprint();
      }
      if (item.kind === 'operational-03b') sql(read('scripts/concierge-04b/preflight.sql'));
      log({ phase: 'migration-start', ...item });
      sql(read(item.path)); // psql ON_ERROR_STOP: first failure stops the campaign.
      sql(`INSERT INTO harness.migration_log(path,sha256) VALUES ('${item.path}','${item.sha256}');`);
      log({ phase: 'migration-applied', ...item });
    }
    if (!seeded) sql(read('scripts/concierge-04b/fixtures.sql'));
    if (before && before !== fingerprint()) throw new Error('Existing fixture history changed during migration tail');
    sql(read('scripts/concierge-04b/permissions.sql'));
    await runScenarios({ sql, parallel, log, read });
    log({ phase: 'passed', disclaimer: 'SQL-level only; not application HTTP or remote Supabase verification' });
  } catch (error) {
    log({ phase: 'failed', error: error.message }); throw error;
  } finally {
    if (identity.created) {
      // In-memory creation receipt only, rechecked against the same local daemon.
      // If verification fails, leave the resource untouched and report the ID.
      try { verify(); docker.sync(['container','rm','--force',identity.id]); log({ phase: 'removed', id: identity.id }); }
      catch (error) { log({ phase: 'cleanup-refused', id: identity.id, error: error.message }); throw error; }
    }
    console.log(`Execution journal: ${logs}`);
  }
}
export async function main(args = process.argv.slice(2)) {
  const config = parseArguments(args);
  if (config.mode === 'plan') { console.log(JSON.stringify(staticPlan(), null, 2)); return; }
  await execute(config, transport(config.context, process.env));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
