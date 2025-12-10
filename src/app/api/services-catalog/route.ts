import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// Type pour la structure d'un service (à adapter selon votre DB)
interface ServiceCatalogBody {
    category: string;
    service: string;
    description: string;
}

// --- GET /api/services-catalog -> Liste de tous les services (Admin/Public) ---
export async function GET(req: NextRequest) {
    try {
        // Optionnel : vérification d'authentification si cette route est protégée
        // const token = await getToken({ req });
        // if (!token) { ... }

        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const serviceId = searchParams.get("id"); // ID pour un GET unique
        
        // Démarrage de la requête
        let queryBuilder = db
            .from("services_catalog")
            .select("*");

        if (serviceId) {
            // 🛑 CORRECTION 1 (Erreur 2345) : Conversion en Number.
            const numericId = Number(serviceId);
            if (isNaN(numericId)) {
                return NextResponse.json({ error: "ID de service invalide" }, { status: 400 });
            }
            // Application du filtre .eq() directement sur le queryBuilder
            // Ceci corrige l'erreur 2345.
            queryBuilder = queryBuilder.eq("id", numericId);
        }
        
        // 🛑 CORRECTION 2 (Erreur 2740) : Pour garantir le chaînage et le type de retour,
        // nous appliquons .order() sur le queryBuilder mis à jour.
        let executedQuery = queryBuilder.order("service", {
            ascending: true,
        });

        // Application de .maybeSingle() juste avant l'exécution si un ID a été passé
        if (serviceId) {
            executedQuery = executedQuery.maybeSingle();
        }

        const { data, error } = await executedQuery;

        if (error) {
            console.error("[GET /api/services-catalog] DB error:", error);
            return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error("[GET /api/services-catalog] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// --- POST /api/services-catalog -> Créer un nouveau service (Admin) ---
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req });
        const userId = typeof token?.sub === "string" ? token.sub : undefined;

        if (!userId) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        
        // Sécurité : Vérifiez que l'utilisateur a un rôle d'administrateur si nécessaire
        // if (token?.role !== 'admin') { ... }


        const body: ServiceCatalogBody = await req.json();

        if (!body.category || !body.service || !body.description) {
            return NextResponse.json(
                { error: "Catégorie, service et description requis" },
                { status: 400 }
            );
        }

        const { data, error } = await db
            .from("services_catalog")
            .insert({
                category: body.category,
                service: body.service,
                description: body.description,
                // Si vous avez un champ 'creator_id', ajoutez-le ici : creator_id: userId,
            })
            .select("*")
            .single();

        if (error) {
            console.error("[POST /api/services-catalog] DB error:", error);
            return NextResponse.json({ error: "Erreur DB lors de l'insertion" }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error("[POST /api/services-catalog] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}


// --- PATCH /api/services-catalog/{id} -> Mettre à jour un service (Admin) ---
export async function PATCH(req: NextRequest) {
    try {
        const token = await getToken({ req });
        const userId = typeof token?.sub === "string" ? token.sub : undefined;

        if (!userId) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        
        // Extraction de l'ID du chemin (Ex: /api/services-catalog/123)
        const urlParts = req.nextUrl.pathname.split('/');
        const serviceId = urlParts.pop(); 
        
        if (!serviceId) {
            return NextResponse.json({ error: "ID de service manquant" }, { status: 400 });
        }
        
        // 🛑 CORRECTION 3 (Erreur 2345) : Conversion explicite de string à number
        const numericId = Number(serviceId);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "ID de service invalide" }, { status: 400 });
        }

        const rawBody: Partial<ServiceCatalogBody> = await req.json();
        
        // Construction du payload de mise à jour
        const updatePayload: Partial<ServiceCatalogBody> = {};
        if (rawBody.category !== undefined) updatePayload.category = rawBody.category;
        if (rawBody.service !== undefined) updatePayload.service = rawBody.service;
        if (rawBody.description !== undefined) updatePayload.description = rawBody.description;

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: "Aucune donnée de mise à jour fournie" }, { status: 400 });
        }

        const { data, error } = await db
            .from("services_catalog")
            .update(updatePayload)
            // Correction appliquée ici : on utilise numericId
            .eq("id", numericId) 
            // Si le service catalog est par utilisateur, ajoutez un filtre de sécurité ici
            // .eq("creator_id", userId) 
            .select("*")
            .single();

        if (error) {
            console.error("[PATCH /api/services-catalog/{id}] DB error:", error);
            return NextResponse.json({ error: "Erreur DB lors de la mise à jour" }, { status: 500 });
        }
        
        if (!data) {
            // Cela peut arriver si l'ID n'existe pas ou si l'utilisateur n'est pas autorisé
             return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("[PATCH /api/services-catalog/{id}] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// --- DELETE /api/services-catalog/{id} -> Supprimer un service (Admin) ---
export async function DELETE(req: NextRequest) {
    try {
        const token = await getToken({ req });
        const userId = typeof token?.sub === "string" ? token.sub : undefined;

        if (!userId) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Extraction de l'ID du chemin (Ex: /api/services-catalog/123)
        const urlParts = req.nextUrl.pathname.split('/');
        const serviceId = urlParts.pop(); 

        if (!serviceId) {
            return NextResponse.json({ error: "ID de service manquant" }, { status: 400 });
        }

        // 🛑 CORRECTION 4 (Erreur 2345) : Conversion explicite de string à number
        const numericId = Number(serviceId);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "ID de service invalide" }, { status: 400 });
        }

        const { error, count } = await db
            .from("services_catalog")
            .delete({ count: 'exact' })
            // Correction appliquée ici : on utilise numericId
            .eq("id", numericId); 
            // Si le service catalog est par utilisateur, ajoutez un filtre de sécurité ici
            // .eq("creator_id", userId); 

        if (error) {
            console.error("[DELETE /api/services-catalog/{id}] DB error:", error);
            return NextResponse.json({ error: "Erreur DB lors de la suppression" }, { status: 500 });
        }

        if (count === 0) {
            return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ message: "Service supprimé avec succès" }, { status: 200 });
    } catch (err) {
        console.error("[DELETE /api/services-catalog/{id}] ERROR:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}