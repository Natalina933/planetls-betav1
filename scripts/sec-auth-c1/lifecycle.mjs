import { openSync, writeFileSync, fsyncSync, closeSync, renameSync } from 'node:fs';

export const SCENARIOS = [
  'application', 'existing-history', 'permissions', 'rights-negative-and-no-writes',
  'create-replay-and-multiple-interventions', 'scope-and-legitimate-concierge-changes',
  'immutability-unique-and-delete', 'forged-metadata-is-not-provenance',
  'atomic-failure-after-last-write', 'owner-inheritance-and-unexpected-default-acl',
  'real-concurrent-idempotency', 'expected-lock-timeout',
  'synthetic-deadlock-and-complete-retry', 'terminal-revocation-and-current-rights',
];
export function redact(value) {
  return String(value ?? '').replace(/(password\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(["']?(?:password|access_token|refresh_token|api[_-]?key|secret)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~-]+/gi, '$1[REDACTED]')
    .replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s]+@/gi, '$1[REDACTED]@');
}
export function sanitize(value) {
  if(typeof value==='string')return redact(value);
  if(Array.isArray(value))return value.map(sanitize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,sanitize(v)]));
  return value;
}
export function diagnostic(error) {
  const source = error?.diagnostic ?? {};
  const stderr = redact(source.stderr);
  const found = [...stderr.matchAll(/(?:ERROR|FATAL):\s+([0-9A-Z]{5}):\s*([^\n]*)/g)].at(-1);
  const expected=[];
  for(const match of stderr.matchAll(/C1D_PG (\{[^\n]*\})/g)){
    try{expected.push(JSON.parse(match[1]));}catch{/* Raw stderr remains available. */}
  }
  return { ...source, message: redact(error?.message ?? source.message),
    stdout: redact(source.stdout), stderr,
    sqlstate: source.sqlstate ?? found?.[1] ?? null, expectedDiagnostics:expected,
    pgMessage: found?.[2] ?? null,
    detail: stderr.match(/DETAIL:\s*([^\n]*)/)?.[1] ?? null,
    hint: stderr.match(/HINT:\s*([^\n]*)/)?.[1] ?? null,
    context: stderr.match(/CONTEXT:\s*([\s\S]*)/)?.[1] ?? null,
    location: stderr.match(/LOCATION:\s*([^\n]*)/)?.[1] ?? null,
    position: stderr.match(/(?:at character|POSITION:)\s*(\d+)/i)?.[1] ?? null };
}
export class HarnessError extends Error {
  constructor(message, kind='assertion', details={}) { super(message); this.kind=kind; this.diagnostic=details; }
}
export function classify(stage,error) {
  if(error?.kind==='integrity'||error?.kind==='interrupted') return 'FAIL';
  return ['integrity','permissions','scenarios'].includes(stage)?'FAIL':'BLOCKED';
}
export function globalVerdict(sql,cleanup,interrupted,states,notApplicable=[]) {
  if(interrupted||cleanup==='FAIL'||sql==='FAIL'||Object.values(states).includes('FAIL')) return 'FAIL';
  if(sql==='BLOCKED'||Object.values(states).includes('BLOCKED')) return 'BLOCKED';
  if(sql==='PASS'&&cleanup!=='PASS')return 'FAIL';
  if(sql==='PASS'&&cleanup==='PASS')return SCENARIOS.every(name=>states[name]==='PASS'
    ||(notApplicable.includes(name)&&states[name]==='NOT RUN'))?'PASS':'FAIL';
  return 'NOT RUN';
}
export function inventory() { return Object.fromEntries(SCENARIOS.map(name=>[name,'NOT RUN'])); }
export function startupFailure(error){return {phase:'terminal',global:'BLOCKED',sql:'NOT RUN',cleanup:'NOT RUN',states:inventory(),primary:diagnostic(error)};}
export function createInterruption(events,cancel=()=>{}) {
  let signal=null;
  const handler=value=>{ if(!signal) {signal=value;cancel(value);} };
  const int=()=>handler('SIGINT'),term=()=>handler('SIGTERM');
  events.on('SIGINT',int); events.on('SIGTERM',term);
  return { get signal(){return signal;}, check(){if(signal)throw new HarnessError(`Interrupted: ${signal}`,'interrupted');},
    dispose(){events.removeListener('SIGINT',int);events.removeListener('SIGTERM',term);} };
}
// Écriture exclusive, fsync du fichier, remplacement atomique dans le même dossier.
// La durabilité du répertoire/ACL Windows dépend encore du système hôte.
export function durableJson(file,value) {
  const temp=file+'.pending'; let fd;
  try { fd=openSync(temp,'wx',0o600);writeFileSync(fd,JSON.stringify(value,null,2)+'\n','utf8');fsyncSync(fd); }
  finally {if(fd!==undefined)closeSync(fd);}
  renameSync(temp,file);
}
