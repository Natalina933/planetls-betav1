import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSolicitationResponseResult } from "../features/provider-solicitations/response-result.ts";

const panel = readFileSync(new URL("../features/provider-solicitations/SolicitationsPanel.tsx", import.meta.url), "utf8");
const owner = readFileSync(new URL("../app/dashboard/owner/demandes/page.tsx", import.meta.url), "utf8");
const provider = readFileSync(new URL("../app/dashboard/provider/messages/page.tsx", import.meta.url), "utf8");

test("les deux espaces raccordent le suivi et le détail dépend des actions serveur", () => {
  assert.match(owner, /<SolicitationsPanel role="owner"/);
  assert.match(provider, /<SolicitationsPanel role="provider"/);
  assert.match(panel, /detail\.allowed_actions\.can_respond/);
  assert.match(panel, /maxLength=\{2000\}/);
});
test("la commande conserve sa clé et sa version pour la reprise et recharge après conflit", () => {
  assert.match(panel, /sessionStorage\.setItem\(storageKey, JSON\.stringify\(command\)\)/);
  assert.match(panel, /"Idempotency-Key": command\.key/);
  assert.match(panel, /expected_version: command\.expected_version/);
  assert.match(panel, /response\.status === 409[\s\S]*?await load\(\); await open\(command\.id\)/);
  assert.match(panel, /if \(lock\.current\) return/);
});
test("les états indisponible, vide, chargement et confirmation sont prévus", () => {
  for (const phrase of ["indisponible ou désactivé", "Aucune sollicitation", "Chargement des sollicitations", "Confirmer la réponse", "Erreur réseau"]) assert.ok(panel.includes(phrase));
  assert.match(panel, /role="alert"/);
  assert.match(panel, /htmlFor="solicitation-message"/);
});

test("une session expirée pendant l’envoi conserve la commande pour la reprise", () => {
  assert.match(panel, /if \(response\.status === 401\) \{\s*setError\("Votre session a expiré\. Reconnectez-vous, puis reprenez la même réponse\."\);\s*return;\s*\}/);
});

test("seul un accusé valide pour la commande envoyée libère la reprise", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const operation = "22222222-2222-4222-8222-222222222222";
  const receipt = { result: { solicitation_id: id, status: "interested", version: 2 }, operation_id: operation, replayed: false };

  assert.deepEqual(parseSolicitationResponseResult(receipt, id, "interested"), receipt);
  const replay = { ...receipt, replayed: true };
  assert.deepEqual(parseSolicitationResponseResult(replay, id, "interested"), replay);

  for (const invalid of [null, {}, { ...receipt, operation_id: "invalid" }, { ...receipt, replayed: undefined }, { ...receipt, result: { ...receipt.result, version: 1 } }]) {
    assert.equal(parseSolicitationResponseResult(invalid, id, "interested"), null);
  }
  assert.equal(parseSolicitationResponseResult(receipt, operation, "interested"), null);
  assert.equal(parseSolicitationResponseResult(receipt, id, "declined"), null);
  assert.match(panel, /if \(!parseSolicitationResponseResult\(data, command\.id, command\.status\)\) \{[^}]*return;\s*\}\s*sessionStorage\.removeItem\(storageKey\)/);
});
