import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
