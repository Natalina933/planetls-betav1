import { expect, test, type Page } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

type SessionPayload = { user?: { id?: string } };
type MissionPayload = { id?: string; status?: string };
type InterventionPayload = {
  id?: string;
  provider_profile_id?: string;
  status?: string;
  title?: string;
  metadata?: Record<string, unknown> | null;
};
type InterventionListPayload = {
  items?: InterventionPayload[];
  summary?: { pending?: number; in_progress?: number; completed?: number };
};
type InvoicePayload = {
  id?: string;
  mission_id?: string | null;
  status?: string;
  total_amount?: number | null;
  metadata?: Record<string, unknown> | null;
};

async function profileId(page: Page) {
  const response = await page.request.get("/api/auth/session", {
    headers: { "Cache-Control": "no-store" },
  });
  expect(response.ok()).toBeTruthy();
  const session = (await response.json()) as SessionPayload;
  expect(session.user?.id).toBeTruthy();
  return session.user!.id!;
}

test("concierge → mission → intervention provider → preuve → facture", async ({ browser, request }) => {
  test.setTimeout(300_000);

  const providerContext = await browser.newContext();
  const providerPage = await providerContext.newPage();
  await loginWorkspace(providerPage, request, "provider");
  const providerProfileId = await profileId(providerPage);

  const conciergeContext = await browser.newContext();
  const conciergePage = await conciergeContext.newPage();
  await loginWorkspace(conciergePage, request, "concierge");
  const conciergeOrigin = new URL(conciergePage.url()).origin;
  const providerOrigin = new URL(providerPage.url()).origin;

  const marker = `[E2E] Intervention provider ${Date.now()}`;
  const missionResponse = await conciergePage.request.post("/api/missions", {
    headers: { Origin: conciergeOrigin },
    data: {
      title: marker,
      description: "Mission automatisée pour validation du parcours artisan.",
      service_id: 16,
      status: "to_schedule",
      priority: "normal",
      amount: 90,
      currency: "EUR",
      metadata: { source: "e2e_provider_transaction" },
    },
  });
  const missionBody = await missionResponse.text();
  expect(missionResponse.status(), missionBody).toBe(201);
  const mission = JSON.parse(missionBody) as MissionPayload;
  expect(mission.id).toBeTruthy();

  const createInterventionResponse = await conciergePage.request.post(
    `/api/missions/${mission.id}/provider-interventions`,
    {
      headers: { Origin: conciergeOrigin },
      data: {
        provider_profile_id: providerProfileId,
        title: marker,
        service_label: "Check-in / Check-out",
        description: "Contrôle et remise des clés.",
        priority: "normal",
        budget_amount: 90,
        location_label: "Paris 1er",
      },
    },
  );
  const createInterventionBody = await createInterventionResponse.text();
  expect(createInterventionResponse.status(), createInterventionBody).toBe(201);
  const intervention = JSON.parse(createInterventionBody) as InterventionPayload;
  expect(intervention.id).toBeTruthy();
  expect(intervention.provider_profile_id).toBe(providerProfileId);
  expect(intervention.status).toBe("pending");

  const providerListResponse = await providerPage.request.get("/api/provider/interventions", {
    headers: { "Cache-Control": "no-store" },
  });
  const providerListBody = await providerListResponse.text();
  expect(providerListResponse.ok(), providerListBody).toBeTruthy();
  const providerList = JSON.parse(providerListBody) as InterventionListPayload;
  const received = providerList.items?.find((item) => item.id === intervention.id);
  expect(received?.title).toBe(marker);
  expect(received?.status).toBe("pending");

  const startResponse = await providerPage.request.patch(`/api/provider/interventions/${intervention.id}`, {
    headers: { Origin: providerOrigin },
    data: { status: "in_progress" },
  });
  const startBody = await startResponse.text();
  expect(startResponse.ok(), startBody).toBeTruthy();
  expect((JSON.parse(startBody) as InterventionPayload).status).toBe("in_progress");

  const uploadResponse = await providerPage.request.post(`/api/missions/${mission.id}/files`, {
    headers: { Origin: providerOrigin },
    multipart: {
      file: {
        name: "preuve-intervention.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      },
      kind: "provider_evidence",
      label: "Preuve intervention E2E",
    },
  });
  const uploadBody = await uploadResponse.text();
  expect(uploadResponse.status(), uploadBody).toBe(201);
  const uploadedProof = JSON.parse(uploadBody) as {
    id?: string;
    kind?: string;
    source?: string;
    sha256?: string;
  };
  expect(uploadedProof.id).toBeTruthy();
  expect(uploadedProof.kind).toBe("provider_evidence");
  expect(uploadedProof.source).toBe("provider_intervention");
  expect(uploadedProof.sha256).toMatch(/^[0-9a-f]{64}$/);

  const downloadResponse = await providerPage.request.get(
    `/api/missions/${mission.id}/files/${uploadedProof.id}/download?format=json`,
  );
  const downloadBody = await downloadResponse.text();
  expect(downloadResponse.ok(), downloadBody).toBeTruthy();
  expect((JSON.parse(downloadBody) as { signed_url?: string }).signed_url).toMatch(/^https?:\/\//);

  const completeResponse = await providerPage.request.patch(`/api/provider/interventions/${intervention.id}`, {
    headers: { Origin: providerOrigin },
    data: {
      status: "completed",
      metadata: {
        ...(received?.metadata ?? {}),
        proof: {
          kind: "e2e_attestation",
          note: "Remise des clés vérifiée automatiquement.",
          recorded_at: new Date().toISOString(),
        },
      },
    },
  });
  const completeBody = await completeResponse.text();
  expect(completeResponse.ok(), completeBody).toBeTruthy();
  const completed = JSON.parse(completeBody) as InterventionPayload;
  expect(completed.status).toBe("completed");
  expect(completed.metadata?.proof).toBeTruthy();
  const createInvoiceResponse = await providerPage.request.post(
    `/api/provider/interventions/${intervention.id}/invoice`,
    { headers: { Origin: providerOrigin } },
  );
  const createInvoiceBody = await createInvoiceResponse.text();
  expect(createInvoiceResponse.status(), createInvoiceBody).toBe(201);
  const invoice = JSON.parse(createInvoiceBody) as InvoicePayload;
  expect(invoice.id).toBeTruthy();
  expect(invoice.status).toBe("issued");
  expect(invoice.mission_id).toBe(mission.id);
  expect(invoice.total_amount).toBe(90);

  const invoiceListResponse = await providerPage.request.get(
    `/api/invoices?providerInterventionId=${intervention.id}`,
    { headers: { "Cache-Control": "no-store" } },
  );
  const invoiceListBody = await invoiceListResponse.text();
  expect(invoiceListResponse.ok(), invoiceListBody).toBeTruthy();
  const linkedInvoice = (JSON.parse(invoiceListBody) as InvoicePayload[]).find(
    (item) => item.id === invoice.id,
  );
  expect(linkedInvoice?.status).toBe("issued");
  expect(linkedInvoice?.mission_id).toBe(mission.id);
  expect(linkedInvoice?.metadata?.provider_intervention_id).toBe(intervention.id);

  const conciergeListResponse = await conciergePage.request.get(
    `/api/missions/${mission.id}/provider-interventions`,
    { headers: { "Cache-Control": "no-store" } },
  );
  const conciergeListBody = await conciergeListResponse.text();
  expect(conciergeListResponse.ok(), conciergeListBody).toBeTruthy();
  const conciergeList = JSON.parse(conciergeListBody) as InterventionListPayload;
  const persisted = conciergeList.items?.find((item) => item.id === intervention.id);
  expect(persisted?.status).toBe("completed");
  expect(persisted?.metadata?.proof).toBeTruthy();

  await conciergeContext.close();
  await providerContext.close();
});
