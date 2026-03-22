import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { normalizeOwnerFromProfile } from "@/types/housing";

const ALLOWED_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

function slugifyUsername(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limitValue = Number(url.searchParams.get("limit") ?? "12");
    const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 25) : 12;

    let query = db
      .from("profiles")
      .select("id, first_name, last_name, username, email, phone, city, company_name")
      .in("role", ["owner", "owner_pro"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(
        [
          `first_name.ilike.%${q}%`,
          `last_name.ilike.%${q}%`,
          `email.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
          `city.ilike.%${q}%`,
          `company_name.ilike.%${q}%`,
        ].join(","),
      );
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Impossible de rechercher les proprietaires." }, { status: 500 });
    }

    return NextResponse.json(
      (data ?? []).map((profile) => normalizeOwnerFromProfile(profile, userId)),
    );
  } catch (error) {
    console.error("[GET /api/profiles/housing/owners] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";

    if (!firstName && !lastName && !companyName) {
      return NextResponse.json({ error: "Renseignez un nom de proprietaire." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "L'email proprietaire est obligatoire." }, { status: 400 });
    }

    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || companyName;
    const generatedId = randomUUID();
    const usernameBase = slugifyUsername(displayName || email.split("@")[0] || "owner");
    const username = `${usernameBase}-${generatedId.slice(0, 6)}`;

    const { data: created, error } = await db
      .from("profiles")
      .insert({
        id: generatedId,
        username,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        city: city || null,
        company_name: companyName || null,
        role: "owner",
      })
      .select("id, first_name, last_name, username, email, phone, city, company_name")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Creation du proprietaire impossible." }, { status: 500 });
    }

    return NextResponse.json(normalizeOwnerFromProfile(created, userId), { status: 201 });
  } catch (error) {
    console.error("[POST /api/profiles/housing/owners] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
