export const campaignLabel='fr.planetls.provider-solicitations-e2a.campaign';
export const purposeLabel='fr.planetls.provider-solicitations-e2a.purpose';
export function campaignIdentity(identity) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(identity.token)) throw Error('Invalid campaign identity');
  identity.name=`planetls-provider-solicitations-${identity.token}`;return identity;
}
// Callers must bind all calls to the already verified local daemon and enforce a deadline.
export async function recoverAndCleanup({identity,call,verifyDaemon,inspect}) {
  await verifyDaemon();
  if (!identity.created) {
    const lines=(await call(['container','ls','--all','--no-trunc','--filter',`label=${campaignLabel}=${identity.token}`,'--filter',`label=${purposeLabel}=isolated-tests`,'--format','{{.ID}}'])).trim();
    const ids=lines ? lines.split(/\r?\n/) : [];
    if (ids.length !== 1 || !/^[a-f0-9]{64}$/.test(ids[0])) return {status:'UNCERTAIN',reason:ids.length>1?'ambiguous matches':'no unique verified match'};
    identity.id=ids[0];identity.created=true;
  }
  let state=await inspect();
  if (state.Running === true && state.Status === 'running') {
    await call(['container','stop','--time','5',identity.id]);
    state=await inspect();
  }
  if (state.Running !== false || !['created','exited'].includes(state.Status)) return {status:'UNCERTAIN',reason:'daemon did not confirm stopped'};
  // No force: a concurrent start makes removal fail rather than killing an unexpected process.
  const finalState=await inspect();
  if (finalState.Running !== false || !['created','exited'].includes(finalState.Status)) return {status:'UNCERTAIN',reason:'state changed before removal'};
  await call(['container','rm',identity.id]);
  return {status:'REMOVED',id:identity.id};
}
