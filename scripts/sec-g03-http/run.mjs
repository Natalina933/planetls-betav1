import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadManifest } from './plan.mjs';
import { scenarios } from './scenarios.mjs';

export function main(args = process.argv.slice(2), write = console.log) {
  const manifest = loadManifest();
  if (args.length && !(args.length === 1 && args[0] === '--plan')) {
    throw new Error('EXÉCUTION BLOQUÉE : préparation uniquement ; aucun pilote Docker/bootstrap approuvé.');
  }
  const result = { mode: 'PREPARED ONLY', verdict: 'PARTIAL', manifest: manifest.digest, assets: manifest.assetsDigest,
    sourceCommit: manifest.sourceCommit, ports: manifest.ports, budget: manifest.budget,
    blockers: manifest.blockers, scenarios: scenarios.map(({ id, criterion }) => ({ id, criterion, status: 'NOT RUN' })),
    disclaimer: 'Aucune ressource créée ; Auth/HTTP/Storage et compatibilité réelle NON VÉRIFIÉS.' };
  write(JSON.stringify(result, null, 2)); return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
