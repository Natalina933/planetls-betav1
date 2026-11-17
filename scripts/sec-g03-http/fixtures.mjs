import { randomBytes, randomUUID } from 'node:crypto';

/** Account descriptions only; no Auth, SQL, Storage or file operation. */
export function accountPlan(identity) {
  const roles = { owner: 'owner', ownerB: 'owner', concierge: 'concierge', conciergeB: 'concierge', provider: 'provider', providerB: 'provider', stranger: 'provider', admin: 'admin' };
  return Object.fromEntries(Object.entries(roles).map(([name, role]) => [name, {
    email: `${name.toLowerCase()}.${identity.token}@example.invalid`, password: randomBytes(24).toString('base64url'), role
  }]));
}
/** GoTrue must supply the actual UUID; do not seed unrelated profile identifiers. */
export function bindAccount(plan, user) {
  if (!user || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(user.id) || user.email !== plan.email) throw new Error('Compte Auth synthétique incohérent.');
  return { ...plan, id: user.id };
}
export function fixturePlan(accounts) {
  for (const name of ['owner','ownerB','concierge','conciergeB','provider','providerB','stranger','admin']) {
    if (!accounts[name]?.id || !accounts[name].email.endsWith('@example.invalid')) throw new Error('Comptes synthétiques non liés.');
  }
  const ids = Object.fromEntries(['property','reservation','mission','otherMission','autonomousIntervention','linkedProfile'].map(key => [key, randomUUID()]));
  ids.seedProof = 'g03-seed-proof';
  return { ids, profiles: Object.values(accounts).map(account => ({ id: account.id, email: account.email, role: account.role, status: 'active' })),
    requirements: [
      'Deux missions différentes reliées à la même réservation et au propriétaire A.',
      'Propriétaire B et concierge B sans droits sur cette réservation.',
      'Intervention autonome du prestataire avec metadata.mission_id forgé sans affectation.',
      'Preuve privée réelle seedée par un acteur légitime sur otherMission.',
      'Profil lié au principal par email/marqueur reconnu, et profil non lié refusé.',
      'Suspension testée après connexion, puis restauration dans la base jetable seulement.'
    ] };
}
