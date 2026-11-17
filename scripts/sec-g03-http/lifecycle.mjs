const hex = /^[a-f0-9]{64}$/;
export function structuredLogger(write, clock = () => new Date().toISOString()) {
  let sequence = 0;
  return event => write(JSON.stringify(redact({ ...event, at: clock(), sequence: ++sequence })) + '\n');
}
export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, /secret|password|token|cookie|authorization|api.?key|serviceKey|anonKey|signed.?url/i.test(key) ? '[REDACTED]' : redact(item)]));
  return typeof value === 'string' ? value.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT]')
    .replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/g, '$1[REDACTED]@')
    .replace(/([?&]token=)[^\s&]+/g, '$1[REDACTED]') : value;
}
export function assertResource(info, resource, identity, daemonId) {
  if (!resource.createdByThisRun || daemonId !== identity.daemonId || info.id !== resource.id
    || info.name !== resource.name || info.labels?.[`${identity.label}.run`] !== identity.token
    || info.labels?.[`${identity.label}.purpose`] !== 'synthetic-integration') throw new Error('Identité de nettoyage incertaine.');
  if (resource.kind === 'container') {
    if (!hex.test(resource.id) || info.image !== resource.image || !info.internalNetworkOnly
      || info.privileged || info.hostMounts || info.unexpectedPorts) throw new Error('Isolation du conteneur invalide.');
  } else if (!['network', 'volume'].includes(resource.kind)) throw new Error('Type de ressource inconnu.');
  if (resource.kind === 'network' && info.internal !== true) throw new Error('Réseau non interne.');
}
/** Injectable transport only. No Docker CLI call is performed by this module. */
export async function cleanupOwned(receipt, transport) {
  if (receipt.state !== 'created' || !receipt.resources.length) throw new Error('Reçu incomplet.');
  if (new Set(receipt.resources.map(item => item.id)).size !== receipt.resources.length) throw new Error('Ressources dupliquées.');
  const daemonId = await transport.daemonId();
  // Verify the entire closed set first, including ownership by this invocation.
  for (const resource of receipt.resources) assertResource(await transport.inspect(resource), resource, receipt.identity, daemonId);
  for (const kind of ['container', 'volume', 'network']) for (const resource of receipt.resources.filter(item => item.kind === kind)) {
    assertResource(await transport.inspect(resource), resource, receipt.identity, await transport.daemonId());
    await transport.removeExact(resource);
    if (await transport.exists(resource)) throw new Error('Ressource encore présente après nettoyage.');
  }
  return { state: 'removed', cleanup: 'PASS' };
}
