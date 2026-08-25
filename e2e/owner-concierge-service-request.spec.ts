import crypto from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

type SessionPayload = {
  user?: {
    id?: string;
  };
};

type CreatedRequestPayload = {
  request?: { id?: string; title?: string };
  recipients?: Array<{ id?: string; concierge_profile_id?: string; status?: string }>;
};
type PreparedQuotePayload = {
  quote?: { id?: string; status?: string };
};

type QuotePayload = {
  id?: string;
  status?: string;
  service_request_id?: string;
  service_request_recipient_id?: string;
};

type AcceptedQuotePayload = QuotePayload & {
  mission_id?: string | null;
  accepted_workflow?: { mission_id?: string | null; invoice_id?: string | null };
};
type InvoicePayload = {
  id?: string;
  quote_id?: string;
  mission_id?: string | null;
  status?: string;
};

type MissionPayload = {
  id?: string;
  status?: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
};
type ServiceRequestListItem = {
  id?: string;
  title?: string;
  recipient_id?: string;
  recipient_status?: string;
  recipients?: Array<{ id?: string; status?: string }>;
};

type ServiceRequestListPayload = {
  items?: ServiceRequestListItem[];
  scope?: "owner" | "concierge";
};

const e2eOrigin = new URL(
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? "3100"}`,
).origin;
const csrfHeaders = { Origin: e2eOrigin };

async function completeStripeTestCheckout(page: Page, checkoutUrl: string) {
  expect(checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  await page.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.getByLabel(/Card number|Numéro de carte/i).fill("4242424242424242");
  await page.getByLabel(/Expiration|Date d.expiration/i).fill("1234");
  await page.getByLabel(/CVC|Code de sécurité/i).fill("123");
  const cardholder = page.getByLabel(/Name on card|Nom du titulaire/i);
  if (await cardholder.count()) await cardholder.fill("PlanetLS Owner E2E");
  const postalCode = page.getByLabel(/ZIP|Postal|Code postal/i);
  if (await postalCode.count()) await postalCode.fill("75001");
  await page.getByRole("button", { name: /Pay|Payer/i }).click();
  await page.waitForURL("**/dashboard/owner/factures?payment=success**", {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await expect(page.getByText(/Paiement confirmé|Paiement synchronisé|Facture payée/i).first()).toBeVisible({
    timeout: 60_000,
  });
}

async function profileId(page: Page) {
  const response = await page.request.get("/api/auth/session", {
    headers: { "Cache-Control": "no-store" },
  });
  expect(response.ok(), `Session indisponible (${response.status()})`).toBeTruthy();

  const session = (await response.json()) as SessionPayload;
  expect(session.user?.id, "La session E2E doit exposer l'identifiant du profil").toBeTruthy();
  return session.user!.id!;
}

test("propriétaire → demande → devis accepté → mission et facture émises", async ({ browser, request }) => {
  test.setTimeout(240_000);

  const conciergeContext = await browser.newContext();
  const conciergePage = await conciergeContext.newPage();
  await loginWorkspace(conciergePage, request, "concierge");
  const conciergeProfileId = await profileId(conciergePage);

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await loginWorkspace(ownerPage, request, "owner");
  const ownerProfileId = await profileId(ownerPage);

  const marker = `[E2E] Demande propriétaire-concierge ${Date.now()}`;
  const createResponse = await ownerPage.request.post("/api/service-requests", {
    headers: csrfHeaders,
    data: {
      title: marker,
      description: "Validation automatisée du parcours transactionnel critique.",
      request_type: "ponctuel",
      requested_services: ["Check-in / Check-out"],
      city: "Paris",
      postal_code: "75001",
      urgency: false,
      budget_max: 120,
      recipient_ids: [conciergeProfileId],
    },
  });
  const createBody = await createResponse.text();
  expect(createResponse.status(), createBody).toBe(201);

  const created = JSON.parse(createBody) as CreatedRequestPayload;
  const requestId = created.request?.id;
  const recipient = created.recipients?.[0];
  expect(requestId).toBeTruthy();
  expect(created.request?.title).toBe(marker);
  expect(recipient?.id).toBeTruthy();
  expect(recipient?.concierge_profile_id).toBe(conciergeProfileId);
  expect(recipient?.status).toBe("sent");

  const conciergeListResponse = await conciergePage.request.get("/api/service-requests", {
    headers: { "Cache-Control": "no-store" },
  });
  const conciergeListBody = await conciergeListResponse.text();
  expect(conciergeListResponse.ok(), conciergeListBody).toBeTruthy();
  const conciergePayload = JSON.parse(conciergeListBody) as ServiceRequestListPayload;
  expect(conciergePayload.scope).toBe("concierge");
  const receivedRequest = conciergePayload.items?.find((item) => item.id === requestId);
  expect(receivedRequest?.title).toBe(marker);
  expect(receivedRequest?.recipient_id).toBe(recipient!.id);
  expect(receivedRequest?.recipient_status).toBe("sent");

  const response = await conciergePage.request.post(
    `/api/service-request-recipients/${recipient!.id}/respond`,
    {
      headers: csrfHeaders,
      data: {
        status: "interested",
        response_message: "Intérêt automatique du scénario E2E.",
      },
    },
  );
  const responseBody = await response.text();
  expect(response.ok(), responseBody).toBeTruthy();
  const prepareQuoteResponse = await conciergePage.request.post(
    `/api/service-request-recipients/${recipient!.id}/prepare-quote`,
    { data: {}, headers: csrfHeaders },
  );
  const prepareQuoteBody = await prepareQuoteResponse.text();
  expect([200, 201], prepareQuoteBody).toContain(prepareQuoteResponse.status());
  const preparedQuote = JSON.parse(prepareQuoteBody) as PreparedQuotePayload;
  const quoteId = preparedQuote.quote?.id;
  expect(quoteId).toBeTruthy();
  expect(preparedQuote.quote?.status).toBe("draft");

  const sendQuoteResponse = await conciergePage.request.patch(`/api/quotes/${quoteId}/status`, {
    headers: csrfHeaders,
    data: { status: "sent" },
  });
  const sendQuoteBody = await sendQuoteResponse.text();
  expect(sendQuoteResponse.ok(), sendQuoteBody).toBeTruthy();
  expect((JSON.parse(sendQuoteBody) as QuotePayload).status).toBe("sent");

  const ownerQuotesResponse = await ownerPage.request.get("/api/quotes", {
    headers: { "Cache-Control": "no-store" },
  });
  const ownerQuotesBody = await ownerQuotesResponse.text();
  expect(ownerQuotesResponse.ok(), ownerQuotesBody).toBeTruthy();
  const ownerQuotes = JSON.parse(ownerQuotesBody) as QuotePayload[];
  const receivedQuote = ownerQuotes.find((quote) => quote.id === quoteId);
  expect(receivedQuote?.status).toBe("sent");
  expect(receivedQuote?.service_request_id).toBe(requestId);
  expect(receivedQuote?.service_request_recipient_id).toBe(recipient!.id);

  const acceptQuoteResponse = await ownerPage.request.patch(`/api/quotes/${quoteId}/status`, {
    headers: csrfHeaders,
    data: { status: "accepted" },
  });
  const acceptQuoteBody = await acceptQuoteResponse.text();
  expect(acceptQuoteResponse.ok(), acceptQuoteBody).toBeTruthy();
  const acceptedQuote = JSON.parse(acceptQuoteBody) as AcceptedQuotePayload;
  expect(acceptedQuote.status).toBe("accepted");
  expect(acceptedQuote.mission_id).toBeTruthy();
  expect(acceptedQuote.accepted_workflow?.mission_id).toBe(acceptedQuote.mission_id);
  const invoiceId = acceptedQuote.accepted_workflow?.invoice_id;
  expect(invoiceId).toBeTruthy();

  const conciergeInvoicesResponse = await conciergePage.request.get(`/api/invoices?quoteId=${quoteId}`, {
    headers: { "Cache-Control": "no-store" },
  });
  const conciergeInvoicesBody = await conciergeInvoicesResponse.text();
  expect(conciergeInvoicesResponse.ok(), conciergeInvoicesBody).toBeTruthy();
  const conciergeInvoice = (JSON.parse(conciergeInvoicesBody) as InvoicePayload[]).find(
    (invoice) => invoice.id === invoiceId,
  );
  expect(conciergeInvoice?.status).toBe("draft");
  expect(conciergeInvoice?.quote_id).toBe(quoteId);
  expect(conciergeInvoice?.mission_id).toBe(acceptedQuote.mission_id);

  const issueInvoiceResponse = await conciergePage.request.patch(`/api/invoices/${invoiceId}/status`, {
    headers: csrfHeaders,
    data: { status: "issued" },
  });
  const issueInvoiceBody = await issueInvoiceResponse.text();
  expect(issueInvoiceResponse.ok(), issueInvoiceBody).toBeTruthy();
  expect((JSON.parse(issueInvoiceBody) as InvoicePayload).status).toBe("issued");

  const ownerInvoicesResponse = await ownerPage.request.get(`/api/invoices?quoteId=${quoteId}`, {
    headers: { "Cache-Control": "no-store" },
  });
  const ownerInvoicesBody = await ownerInvoicesResponse.text();
  expect(ownerInvoicesResponse.ok(), ownerInvoicesBody).toBeTruthy();
  const ownerInvoice = (JSON.parse(ownerInvoicesBody) as InvoicePayload[]).find(
    (invoice) => invoice.id === invoiceId,
  );
  expect(ownerInvoice?.status).toBe("issued");
  expect(ownerInvoice?.mission_id).toBe(acceptedQuote.mission_id);

  const checkoutResponse = await ownerPage.request.post(`/api/billing/invoices/${invoiceId}/checkout`, {
    headers: csrfHeaders,
  });
  const checkoutBody = await checkoutResponse.text();
  const stripeTestEnabled = process.env.E2E_STRIPE_SECRET_KEY?.startsWith("sk_test_") === true;
  if (stripeTestEnabled) {
    expect(checkoutResponse.ok(), checkoutBody).toBeTruthy();
    const checkout = JSON.parse(checkoutBody) as { id?: string; url?: string };
    expect(checkout.id).toMatch(/^cs_/);
    expect(checkout.url).toBeTruthy();
    await completeStripeTestCheckout(ownerPage, checkout.url!);
  } else {
    expect(checkoutResponse.status(), checkoutBody).toBe(503);
    expect(checkoutBody).toContain("Stripe n'est pas encore configure");

    const webhookSecret = "whsec_planetls_e2e_only";
    const webhookTimestamp = Math.floor(Date.now() / 1000);
    const stripeSessionId = `cs_test_planetls_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      id: `evt_planetls_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: stripeSessionId,
          mode: "payment",
          payment_status: "paid",
          metadata: { user_id: ownerProfileId, invoice_id: invoiceId },
        },
      },
    });
    const webhookSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${webhookTimestamp}.${webhookPayload}`)
      .digest("hex");
    const webhookResponse = await ownerPage.request.post("/api/billing/webhook", {
      data: webhookPayload,
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=${webhookTimestamp},v1=${webhookSignature}`,
      },
    });
    const webhookBody = await webhookResponse.text();
    expect(webhookResponse.ok(), webhookBody).toBeTruthy();
  }

  const paidInvoicesResponse = await ownerPage.request.get(`/api/invoices?quoteId=${quoteId}`, {
    headers: { "Cache-Control": "no-store" },
  });
  const paidInvoicesBody = await paidInvoicesResponse.text();
  expect(paidInvoicesResponse.ok(), paidInvoicesBody).toBeTruthy();
  const paidInvoice = (JSON.parse(paidInvoicesBody) as InvoicePayload[]).find(
    (invoice) => invoice.id === invoiceId,
  );
  expect(paidInvoice?.status).toBe("paid");

  const scheduledStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);
  const scheduleResponse = await conciergePage.request.patch(
    `/api/missions/${acceptedQuote.mission_id}`,
    {
      headers: csrfHeaders,
      data: {
        status: "scheduled",
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
      },
    },
  );
  const scheduleBody = await scheduleResponse.text();
  expect(scheduleResponse.ok(), scheduleBody).toBeTruthy();
  const scheduledMission = (JSON.parse(scheduleBody) as { mission?: MissionPayload }).mission;
  expect(scheduledMission?.status).toBe("scheduled");
  expect(Date.parse(scheduledMission?.scheduled_start ?? "")).toBe(scheduledStart.getTime());
  expect(Date.parse(scheduledMission?.scheduled_end ?? "")).toBe(scheduledEnd.getTime());

  const ownerMissionResponse = await ownerPage.request.get(`/api/missions/${acceptedQuote.mission_id}`);
  const ownerMissionBody = await ownerMissionResponse.text();
  expect(ownerMissionResponse.ok(), ownerMissionBody).toBeTruthy();
  const ownerMission = (JSON.parse(ownerMissionBody) as { mission?: MissionPayload }).mission;
  expect(ownerMission?.status).toBe("scheduled");
  expect(Date.parse(ownerMission?.scheduled_start ?? "")).toBe(scheduledStart.getTime());

  const ownerListResponse = await ownerPage.request.get("/api/service-requests", {
    headers: { "Cache-Control": "no-store" },
  });
  const ownerListBody = await ownerListResponse.text();
  expect(ownerListResponse.ok(), ownerListBody).toBeTruthy();
  const ownerPayload = JSON.parse(ownerListBody) as ServiceRequestListPayload;
  expect(ownerPayload.scope).toBe("owner");
  const persistedRequest = ownerPayload.items?.find((item) => item.id === requestId);
  expect(persistedRequest?.title).toBe(marker);
  expect(persistedRequest?.recipients?.[0]?.id).toBe(recipient!.id);
  expect(persistedRequest?.recipients?.[0]?.status).toBe("selected");

  await ownerContext.close();
  await conciergeContext.close();
});
