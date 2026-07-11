import assert from "node:assert/strict";
import test from "node:test";

import { buildOwnerCrmRecords } from "../app/lib/ownerCrm.ts";

test("buildOwnerCrmRecords consolidates owner CRM data", () => {
  const records = buildOwnerCrmRecords({
    profiles: [{ profileId: "owner-1", fullName: "Nathalie Charbonnel", city: "Nice" }],
    conversations: [
      {
        id: "conversation-1",
        counterpart_profile_id: "owner-1",
        counterpart_name: "Nathalie",
        subject: "Contrat saison 2026",
        last_message_preview: "Ok pour le devis.",
        last_message_at: new Date().toISOString(),
        unread_count: 2,
      },
    ],
    housings: [{ id: "housing-1", owner_profile_id: "owner-1", label: "Villa Palm", date: "2026-07-01" }],
    invoices: [
      {
        id: "invoice-1",
        owner_profile_id: "owner-1",
        label: "Facture juillet",
        amount: 2400,
        commission_amount: 480,
        date: "2026-07-10",
      },
    ],
    quotes: [{ id: "quote-1", owner_profile_id: "owner-1", label: "Devis pack premium", date: "2026-07-05" }],
    contracts: [{ id: "contract-1", owner_profile_id: "owner-1", label: "Mandat conciergerie" }],
    documents: [{ id: "document-1", owner_profile_id: "owner-1", label: "CNI proprietaire" }],
    incidents: [{ id: "incident-1", owner_profile_id: "owner-1", label: "Cle manquante", date: "2026-07-09" }],
    preferencesByOwnerId: { "owner-1": ["Reporting hebdomadaire", "Validation avant depense"] },
  });

  assert.equal(records.length, 1);
  assert.equal(records[0]?.name, "Nathalie Charbonnel");
  assert.equal(records[0]?.stats.logements, 1);
  assert.equal(records[0]?.stats.revenus, 2400);
  assert.equal(records[0]?.stats.commissions, 480);
  assert.equal(records[0]?.stats.devis, 1);
  assert.equal(records[0]?.stats.contrats, 1);
  assert.equal(records[0]?.stats.documents, 1);
  assert.equal(records[0]?.stats.incidents, 1);
  assert.equal(records[0]?.stats.conversations, 1);
  assert.equal(records[0]?.stats.unread, 2);
  assert.deepEqual(records[0]?.preferences, ["Reporting hebdomadaire", "Validation avant depense"]);
  assert.ok(records[0]?.timeline.some((event) => event.kind === "incident"));
});
