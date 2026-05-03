import { NextRequest } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { isUuidLike } from "@/app/api/inspections/shared";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatAmount = (value: number | null | undefined, currency = "EUR"): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

// Legacy Supabase typing is incomplete on new dispute tables.
const dbAny = asLooseSupabaseClient(db);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return new Response("Non authentifie", { status: 401 });
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return new Response("Identifiant litige invalide", { status: 400 });
    }

    const url = new URL(req.url);
    const autoPrint = url.searchParams.get("print") === "1";

    const { data: dispute, error: disputeError } = await dbAny
      .from("damage_disputes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (disputeError || !dispute) {
      return new Response("Litige introuvable", { status: 404 });
    }

    if (
      !isAdmin &&
      userId !== dispute.owner_profile_id &&
      userId !== dispute.concierge_profile_id
    ) {
      return new Response("Acces refuse", { status: 403 });
    }

    const [housingResp, ownerResp, conciergeResp, linksResp] = await Promise.all([
      dbAny
        .from("housing")
        .select("id, nom_logement, adresse, ville")
        .eq("id", dispute.housing_id)
        .maybeSingle(),
      dbAny
        .from("profiles")
        .select("id, first_name, last_name, company_name, email, phone")
        .eq("id", dispute.owner_profile_id)
        .maybeSingle(),
      dbAny
        .from("profiles")
        .select("id, first_name, last_name, company_name, email, phone")
        .eq("id", dispute.concierge_profile_id)
        .maybeSingle(),
      dbAny
        .from("dispute_evidence_links")
        .select("id, media_id, checklist_item_id, comment, created_at")
        .eq("dispute_id", id),
    ]);

    const links = Array.isArray(linksResp.data) ? linksResp.data : [];
    const mediaIds = Array.from(
      new Set(
        links
          .map((row: { media_id?: string | null }) => row.media_id)
          .filter((value: unknown): value is string => typeof value === "string" && value.length > 0),
      ),
    );
    const checklistIds = Array.from(
      new Set(
        links
          .map((row: { checklist_item_id?: string | null }) => row.checklist_item_id)
          .filter((value: unknown): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    const [mediaResp, checklistResp] = await Promise.all([
      dbAny
        .from("inspection_media")
        .select("id, media_type, storage_bucket, storage_path, captured_at_server, sha256")
        .in("id", mediaIds.length > 0 ? mediaIds : ["00000000-0000-0000-0000-000000000000"]),
      dbAny
        .from("checkout_checklist_items")
        .select("id, item_label, item_status, notes")
        .in("id", checklistIds.length > 0 ? checklistIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const mediaById = new Map<string, {
      id: string;
      media_type: string;
      storage_bucket?: string;
      storage_path?: string;
      captured_at_server?: string;
      sha256?: string;
    }>();

    (mediaResp.data ?? []).forEach(
      (row: {
        id: string;
        media_type: string;
        storage_bucket?: string;
        storage_path?: string;
        captured_at_server?: string;
        sha256?: string;
      }) => {
        mediaById.set(row.id, row);
      },
    );

    const checklistById = new Map<string, { id: string; item_label: string; item_status: string; notes?: string }>();
    (checklistResp.data ?? []).forEach(
      (row: { id: string; item_label: string; item_status: string; notes?: string }) => {
        checklistById.set(row.id, row);
      },
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

    const evidenceRows = links
      .map((link: { media_id?: string | null; checklist_item_id?: string | null; comment?: string | null; created_at?: string | null }) => {
        const media = link.media_id ? mediaById.get(link.media_id) : null;
        const checklist = link.checklist_item_id ? checklistById.get(link.checklist_item_id) : null;

        const mediaUrl =
          media && supabaseUrl && media.storage_bucket && media.storage_path
            ? `${supabaseUrl}/storage/v1/object/public/${media.storage_bucket}/${media.storage_path}`
            : null;

        return `
          <tr>
            <td>${media ? escapeHtml(media.media_type.toUpperCase()) : "-"}</td>
            <td>${checklist ? escapeHtml(checklist.item_label) : "-"}</td>
            <td>${checklist ? escapeHtml(checklist.item_status) : "-"}</td>
            <td>${media?.captured_at_server ? escapeHtml(formatDateTime(media.captured_at_server)) : "-"}</td>
            <td>${media?.sha256 ? escapeHtml(media.sha256) : "-"}</td>
            <td>${mediaUrl ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noreferrer">Ouvrir</a>` : "-"}</td>
            <td>${link.comment ? escapeHtml(link.comment) : ""}</td>
          </tr>
        `;
      })
      .join("");

    const ownerName =
      ownerResp.data?.company_name ||
      `${ownerResp.data?.first_name ?? ""} ${ownerResp.data?.last_name ?? ""}`.trim() ||
      "Proprietaire";

    const conciergeName =
      conciergeResp.data?.company_name ||
      `${conciergeResp.data?.first_name ?? ""} ${conciergeResp.data?.last_name ?? ""}`.trim() ||
      "Concierge";

    const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Dossier litige ${escapeHtml(dispute.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    .doc { max-width: 980px; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
    .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; background: #f8fafc; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
    h1, h2, h3 { margin: 0 0 8px; }
    p { margin: 0 0 8px; }
    .meta { font-size: 13px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #f1f5f9; text-align: left; }
    .footer { margin-top: 18px; font-size: 11px; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <main class="doc">
    <section class="top">
      <div>
        <h1>Dossier de litige</h1>
        <div class="meta">
          <div><strong>ID litige:</strong> ${escapeHtml(dispute.id)}</div>
          <div><strong>Type:</strong> ${escapeHtml(dispute.dispute_type)}</div>
          <div><strong>Statut:</strong> ${escapeHtml(dispute.status)}</div>
          <div><strong>Ouvert le:</strong> ${escapeHtml(formatDateTime(dispute.opened_at))}</div>
          <div><strong>Montant estime:</strong> ${escapeHtml(formatAmount(dispute.estimated_amount, dispute.currency))}</div>
        </div>
      </div>
      <div class="box meta">
        <div><strong>Logement:</strong> ${escapeHtml(housingResp.data?.nom_logement || "-")}</div>
        <div><strong>Adresse:</strong> ${escapeHtml([housingResp.data?.adresse, housingResp.data?.ville].filter(Boolean).join(", ") || "-")}</div>
      </div>
    </section>

    <section class="grid">
      <div class="box meta">
        <h3>Proprietaire</h3>
        <div>${escapeHtml(ownerName)}</div>
        <div>${escapeHtml(ownerResp.data?.email || "")}</div>
        <div>${escapeHtml(ownerResp.data?.phone || "")}</div>
      </div>
      <div class="box meta">
        <h3>Concierge</h3>
        <div>${escapeHtml(conciergeName)}</div>
        <div>${escapeHtml(conciergeResp.data?.email || "")}</div>
        <div>${escapeHtml(conciergeResp.data?.phone || "")}</div>
      </div>
    </section>

    <section class="box" style="margin-top: 12px;">
      <h3>Objet</h3>
      <p><strong>${escapeHtml(dispute.title || "Litige")}</strong></p>
      <p>${escapeHtml(dispute.description || "Aucune description")}</p>
    </section>

    <section class="box" style="margin-top: 12px;">
      <h3>Preuves associees (${links.length})</h3>
      <table>
        <thead>
          <tr>
            <th>Media</th>
            <th>Checklist</th>
            <th>Statut item</th>
            <th>Date preuve</th>
            <th>Hash SHA-256</th>
            <th>Lien</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          ${evidenceRows || "<tr><td colspan=\"7\">Aucune preuve liee.</td></tr>"}
        </tbody>
      </table>
    </section>

    <footer class="footer">
      Dossier genere le ${escapeHtml(formatDateTime(new Date().toISOString()))}.
      Ce document peut etre imprime en PDF.
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
    console.error("[GET /api/disputes/:id/export] ERROR:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
