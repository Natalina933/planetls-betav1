import assert from "node:assert/strict";
import test from "node:test";

import { buildMissionObjectCenter } from "../app/lib/missionObjectCenter.ts";

test("buildMissionObjectCenter consolidates the rich mission object", () => {
  const center = buildMissionObjectCenter({
    mission: {
      id: "mission-1",
      status: "completed",
      priority: "urgent",
      scheduled_start: "2026-07-12T09:00:00.000Z",
      scheduled_end: "2026-07-12T11:00:00.000Z",
      metadata: {
        owner_signature: { name: "Nathalie", signed_at: "2026-07-12T12:00:00.000Z" },
      },
    },
    participants: {
      owner: { id: "owner-1", first_name: "Nathalie", last_name: "C." },
      concierge: { id: "concierge-1", company_name: "PlanetLS Concierge" },
    },
    evidence: {
      checklist: [
        { id: "arrival", label: "Arrivee verifiee", done: true },
        { id: "photos", label: "Photos ajoutees", done: false },
      ],
      proof_links: [
        { id: "proof-1", kind: "photo", label: "Salon", url: "https://example.test/salon.jpg" },
        { id: "proof-2", kind: "document", label: "Bon de passage", url: "https://example.test/bon.pdf" },
      ],
    },
    conversations: [
      {
        id: "conversation-1",
        subject: "Mission",
        last_message_preview: "Tout est pret.",
        last_message_at: "2026-07-12T12:10:00.000Z",
      },
    ],
    events: [{ id: "event-1", event_type: "mission_completed", created_at: "2026-07-12T12:00:00.000Z" }],
    providers: [{ id: "provider-1", company_name: "Artisan Pro", city: "Nice" }],
    provider_interventions: [
      {
        id: "intervention-1",
        provider_profile_id: "provider-1",
        title: "Maintenance clim",
        status: "scheduled",
        priority: "high",
        scheduled_start: "2026-07-12T13:00:00.000Z",
        budget_amount: 120,
      },
    ],
  });

  assert.equal(center.status, "completed");
  assert.equal(center.planningLabel, "Planifiee");
  assert.equal(center.checklistRate, 50);
  assert.equal(center.counts.photos, 1);
  assert.equal(center.counts.documents, 1);
  assert.equal(center.counts.signatures, 1);
  assert.equal(center.counts.comments, 1);
  assert.equal(center.counts.intervenants, 3);
  assert.equal(center.photos[0]?.label, "Salon");
  assert.equal(center.documents[0]?.label, "Bon de passage");
  assert.equal(center.intervenants[2]?.name, "Artisan Pro");
});
