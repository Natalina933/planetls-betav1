import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
};

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getUserId = async (req: NextRequest): Promise<string | null> => {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  return typeof token?.sub === "string" ? token.sub : null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response("Non authentifie", { status: 401 });
    }

    const { id } = await params;
    const url = new URL(req.url);
    const autoPrint = url.searchParams.get("print") === "1";

    const { data: quote, error: quoteError } = await db
      .from("quotes")
      .select(
        "id, quote_number, concierge_profile_id, owner_profile_id, mission_id, package_id, status, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, valid_until, notes, created_at, package:services_packages(id, name, description, category), quote_items(id, label, description, quantity, unit_price, line_total, sort_order)",
      )
      .eq("id", id)
      .single();

    if (quoteError || !quote) {
      return new Response("Devis introuvable", { status: 404 });
    }

    if (quote.concierge_profile_id !== userId && quote.owner_profile_id !== userId) {
      return new Response("Acces refuse", { status: 403 });
    }

    const [{ data: concierge }, { data: owner }] = await Promise.all([
      db
        .from("profiles")
        .select(
          "company_name, legal_form, first_name, last_name, email, phone, avatar_url, street_address, postal_code, city, country, siret, vat_number",
        )
        .eq("id", quote.concierge_profile_id)
        .maybeSingle(),
      quote.owner_profile_id
        ? db
            .from("profiles")
            .select(
              "company_name, first_name, last_name, email, phone, street_address, postal_code, city, country",
            )
            .eq("id", quote.owner_profile_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const conciergeName =
      concierge?.company_name ||
      `${concierge?.first_name ?? ""} ${concierge?.last_name ?? ""}`.trim() ||
      "Concierge";

    const ownerName =
      owner?.company_name ||
      `${owner?.first_name ?? ""} ${owner?.last_name ?? ""}`.trim() ||
      "Client";

    const conciergeAddress = [
      concierge?.street_address,
      [concierge?.postal_code, concierge?.city].filter(Boolean).join(" "),
      concierge?.country,
    ]
      .filter(Boolean)
      .join("<br/>");

    const ownerAddress = [
      owner?.street_address,
      [owner?.postal_code, owner?.city].filter(Boolean).join(" "),
      owner?.country,
    ]
      .filter(Boolean)
      .join("<br/>");

    const items = (quote.quote_items ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const vatMention = concierge?.vat_number
      ? `TVA intracommunautaire: ${escapeHtml(concierge.vat_number)}`
      : "TVA non applicable, art. 293 B du CGI";
    const packageHtml = quote.package
      ? `<section class="box" style="margin-top: 12px;"><h3>Pack rattache</h3><div>${escapeHtml(quote.package.name ?? "Pack")}</div><div class="muted">${quote.package.category ? escapeHtml(quote.package.category) : ""}${quote.package.description ? `<br/>${escapeHtml(quote.package.description)}` : ""}</div></section>`
      : "";

    const rowsHtml = items
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${item.description ? escapeHtml(item.description) : ""}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatCurrency(Number(item.unit_price ?? 0), quote.currency)}</td>
          <td class="num">${formatCurrency(Number(item.line_total ?? 0), quote.currency)}</td>
        </tr>
      `,
      )
      .join("");

    const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Devis ${escapeHtml(quote.quote_number)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    .doc { max-width: 900px; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
    .brand { display: grid; gap: 6px; }
    .brand h1 { margin: 0; font-size: 22px; }
    .muted { color: #475569; font-size: 12px; line-height: 1.4; }
    .logo { width: 88px; height: 88px; border-radius: 12px; object-fit: cover; border: 1px solid #cbd5e1; }
    .meta { text-align: right; font-size: 13px; }
    .addresses { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 18px; margin: 10px 0 18px; }
    .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; }
    .box h3 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #f1f5f9; text-align: left; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-left: auto; width: 320px; margin-top: 14px; }
    .totals td { font-size: 12px; }
    .totals .label { text-align: right; }
    .totals .grand td { font-size: 14px; font-weight: 700; background: #eff6ff; }
    .footer { margin-top: 18px; font-size: 11px; color: #475569; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <main class="doc">
    <section class="top">
      <div class="brand">
        ${concierge?.avatar_url ? `<img class="logo" src="${escapeHtml(concierge.avatar_url)}" alt="Logo"/>` : ""}
        <h1>${escapeHtml(conciergeName)}</h1>
        <div class="muted">
          ${concierge?.legal_form ? `${escapeHtml(concierge.legal_form)}<br/>` : ""}
          ${conciergeAddress}
          ${concierge?.siret ? `<br/>SIRET: ${escapeHtml(concierge.siret)}` : ""}
          <br/>${vatMention}
          ${concierge?.email ? `<br/>${escapeHtml(concierge.email)}` : ""}
          ${concierge?.phone ? `<br/>${escapeHtml(concierge.phone)}` : ""}
        </div>
      </div>
      <div class="meta">
        <h2 style="margin: 0 0 8px;">DEVIS</h2>
        <div><strong>N°:</strong> ${escapeHtml(quote.quote_number)}</div>
        <div><strong>Date:</strong> ${formatDate(quote.created_at)}</div>
        <div><strong>Valide jusqu'au:</strong> ${formatDate(quote.valid_until)}</div>
        <div><strong>Statut:</strong> ${escapeHtml(quote.status)}</div>
      </div>
    </section>

    <section class="addresses">
      <div class="box">
        <h3>Emetteur</h3>
        <div>${escapeHtml(conciergeName)}</div>
      </div>
      <div class="box">
        <h3>Destinataire</h3>
        <div>${escapeHtml(ownerName)}</div>
        <div class="muted">
          ${ownerAddress}
          ${owner?.email ? `<br/>${escapeHtml(owner.email)}` : ""}
          ${owner?.phone ? `<br/>${escapeHtml(owner.phone)}` : ""}
        </div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Prestation</th>
          <th>Description</th>
          <th class="num">Quantite</th>
          <th class="num">Prix unitaire</th>
          <th class="num">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <table class="totals">
      <tr><td class="label">Sous-total</td><td class="num">${formatCurrency(Number(quote.subtotal ?? 0), quote.currency)}</td></tr>
      <tr><td class="label">Remise</td><td class="num">-${formatCurrency(Number(quote.discount_amount ?? 0), quote.currency)}</td></tr>
      <tr><td class="label">TVA (${Number(quote.tax_rate ?? 0).toFixed(2)}%)</td><td class="num">${formatCurrency(Number(quote.tax_amount ?? 0), quote.currency)}</td></tr>
      <tr class="grand"><td class="label">Total TTC</td><td class="num">${formatCurrency(Number(quote.total_amount ?? 0), quote.currency)}</td></tr>
    </table>

    ${
      quote.notes
        ? `<section class="box" style="margin-top: 12px;"><h3>Notes</h3><div class="muted">${escapeHtml(quote.notes).replaceAll("\n", "<br/>")}</div></section>`
        : ""
    }
    ${packageHtml}

    <footer class="footer">
      Document numerote automatiquement. Ce devis est emis par ${escapeHtml(conciergeName)}.
      <br/>${vatMention}
    </footer>
  </main>
  ${autoPrint ? `<script>window.addEventListener('load', () => window.print());</script>` : ""}
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("[GET /api/quotes/:id/document] ERROR:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
