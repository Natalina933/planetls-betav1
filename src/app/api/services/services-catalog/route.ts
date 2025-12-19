// src/app/api/services/services-catalog/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// Type pour le body de la requête
interface ServiceCatalogBody {
    category: string;
    service: string;
    description?: string | null;
}

// --- GET /api/services-catalog -> Liste de tous les services ---
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const serviceId = searchParams.get("id");
        
        if (serviceId) {
            // GET d'un service spécifique
            const numericId = Number(serviceId);
            if (isNaN(numericId)) {
                return NextResponse.json({ error: "ID de service invalide" }, { status: 400 });
            }
            
            const { data, error } = await db
                .from("services_catalog")
                .select("*")
                .eq("id", numericId)
                .maybeSingle();

            if (error) {
                console.error("[GET /api/services-catalog] DB error:", error);
                return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
            }

            if (!data) {
                return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
            }

            return NextResponse.json(data);
        }

        // GET de tous les services
        const { data, error } = await db
            .from("services_catalog")
            .select("*")
            .order("service", { ascending: true });

        if (error) {
            console.error("[GET /api/services/services-catalog] DB error:", error);
            return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error("[GET /api/services/services-catalog] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// --- POST /api/services-catalog -> Créer un nouveau service ---
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req });
        const userId = typeof token?.sub === "string" ? token.sub : undefined;

        if (!userId) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        
        // Sécurité : Vérifiez le rôle admin si nécessaire
        // if (token?.role !== 'admin') {
        //     return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        // }

        const body: ServiceCatalogBody = await req.json();

        // Validation : category et service sont requis
        if (!body.category || !body.service) {
            return NextResponse.json(
                { error: "Catégorie et service requis" },
                { status: 400 }
            );
        }

        const { data, error } = await db
            .from("services_catalog")
            .insert({
                category: body.category,
                service: body.service,
                description: body.description || null,
            })
            .select("*")
            .single();

        if (error) {
            console.error("[POST /api/services-catalog] DB error:", error);
            return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error("[POST /api/services-catalog] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// --- PATCH /api/services-catalog -> Mettre à jour un service ---
export async function PATCH(req: NextRequest) {
    try {
        const token = await getToken({ req });
        const userId = typeof token?.sub === "string" ? token.sub : undefined;

        if (!userId) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        
        // Récupérer l'ID depuis les query params
        const url = new URL(req.url);
        const serviceId = url.searchParams.get("id");
        
        if (!serviceId) {
            return NextResponse.json({ error: "ID de service manquant" }, { status: 400 });
        }
        
        const numericId = Number(serviceId);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "ID de service invalide" }, { status: 400 });
        }

        const rawBody: Partial<ServiceCatalogBody> = await req.json();
        
        // Construction du payload
        const updatePayload: Partial<ServiceCatalogBody> = {};
        
        if (rawBody.category !== undefined) {
            updatePayload.category = rawBody.category;
        }
        if (rawBody.service !== undefined) {
            updatePayload.service = rawBody.service;
        }
        if (rawBody.description !== undefined) {
            updatePayload.description = rawBody.description;
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
        }

        const { data, error } = await db
            .from("services_catalog")
            .update(updatePayload)
            .eq("id", numericId)
            .select("*")
            .single();

        if (error) {
            console.error("[PATCH /api/services-catalog] DB error:", error);
            return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
        }
        
        if (!data) {
            return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("[PATCH /api/services-catalog] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// --- DELETE /api/services-catalog -> Supprimer un service ---
export async function DELETE(req: NextRequest) {
    try {
        const token = await getToken({ req });
        const userId = typeof token?.sub === "string" ? token.sub : undefined;

        if (!userId) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Récupérer l'ID depuis les query params
        const url = new URL(req.url);
        const serviceId = url.searchParams.get("id");

        if (!serviceId) {
            return NextResponse.json({ error: "ID de service manquant" }, { status: 400 });
        }

        const numericId = Number(serviceId);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "ID de service invalide" }, { status: 400 });
        }

        const { error, count } = await db
            .from("services_catalog")
            .delete({ count: 'exact' })
            .eq("id", numericId);

        if (error) {
            console.error("[DELETE /api/services-catalog] DB error:", error);
            return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
        }

        if (count === 0) {
            return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ message: "Service supprimé avec succès" }, { status: 200 });
    } catch (err) {
        console.error("[DELETE /api/services-catalog] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}