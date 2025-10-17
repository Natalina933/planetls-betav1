import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

// --- 1. Mappage Centralisé des Rôles (CORRIGÉ) ---
// Mappage: [Rôle de base DB] -> [Nom du dossier Next.js (EN)]
// Assurez-vous que la VALEUR (nom du dossier) correspond EXACTEMENT au nom de vos dossiers (ex: owner, concierge, provider).
const ROLE_FOLDER_MAP: Record<string, string> = {
    // Clé: Rôle dans la DB (sans _pro) | Valeur: Nom du dossier
    'proprietaire': 'owner',    // 💡 CORRECTION: Mappe proprietaire (DB) à owner (Dossier)
    'concierge': 'concierge',
    'conciergerie': 'concierge', // Gère 'conciergerie' et 'concierge' si besoin
    'artisan': 'provider',      // 💡 CORRECTION: Regroupe sous 'provider'
    'service': 'provider',      // 💡 CORRECTION: Regroupe sous 'provider'
    'fournisseur': 'provider',  // 💡 N'oubliez pas les autres rôles prestataires
    'admin': 'admin',
    'commercant': 'provider',   // Ex: 'commercant' doit aussi être un 'provider'
};

/**
 * Détermine le nom du dossier cible à partir du rôle du token.
 */
const getTargetRoleFolder = (token: JWT): string | null => {
    const role = (token.role as string)?.toLowerCase() ?? '';
    
    // Extrait le rôle de base (ex: 'conciergerie_pro' -> 'conciergerie')
    const dbBaseRole = role.split('_')[0]; 
    
    // Vérifie le mappage
    if (ROLE_FOLDER_MAP[dbBaseRole]) {
        return ROLE_FOLDER_MAP[dbBaseRole];
    }

    // Gestion des cas non mappés (ex: si le rôle est déjà 'owner' ou 'provider' dans la DB)
    if (['owner', 'provider'].includes(dbBaseRole)) {
        return dbBaseRole;
    }
    
    return null;
};


export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    
    // ----------------------------------------------------------------------
    // --- DÉBUT DU LOG DE DÉBOGAGE (Vérifie si le Middleware est atteint) ---
    // ----------------------------------------------------------------------
    console.log(`\n[MIDDLEWARE-START] Requête interceptée pour: ${url.pathname}`);

    const token = await getToken({ req });
    
    // 1. Non Authentifié
    if (!token) {
        if (!url.pathname.startsWith('/auth/login')) {
            console.log(`[MIDDLEWARE-LOG] : Non authentifié, redirection vers /auth/login.`);
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }
        return NextResponse.next();
    }

    // Récupération du nom de dossier cible basé sur le RÔLE (ex: 'owner')
    const folderName = getTargetRoleFolder(token);
    
    if (!folderName) {
        // Cela devrait être traité comme une erreur grave (rôle inconnu)
        console.error(`[MIDDLEWARE-LOG] : Rôle du token '${token.role}' non géré dans le mappage.`);
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    const targetDashboardPath = `/dashboard/${folderName}`; // Ex: /dashboard/owner

    // Affiche les informations clés
    console.log(`[MIDDLEWARE-LOG] Rôle du Token (DB): ${token.role}`);
    console.log(`[MIDDLEWARE-LOG] Nom du Dossier Cible: ${folderName}`);
    console.log(`[MIDDLEWARE-LOG] Chemin Cible: ${targetDashboardPath}`);
    

    // 2. Redirection Générique : /dashboard -> /dashboard/[role]
    if (url.pathname === "/dashboard") {
        console.log(`[MIDDLEWARE-LOG] : CAS 2: Redirection du chemin générique /dashboard vers ${targetDashboardPath}`);
        return NextResponse.redirect(new URL(targetDashboardPath, req.url), { status: 307 });
    }
    
    // 3. Protection d'Accès et Anti-Boucle
    if (url.pathname.startsWith("/dashboard/")) {
        
        // Extrait le nom du dossier directement après '/dashboard/' (méthode robuste)
        const pathRole = url.pathname.slice("/dashboard/".length).split('/')[0];

        // Comparaison entre le dossier demandé et le dossier requis par le rôle
        if (pathRole !== folderName) {
             console.log(`[MIDDLEWARE-LOG] : ERREUR: Utilisateur ${token.role} (Dossier ${folderName}) tente d'accéder à /dashboard/${pathRole}. Redirection vers ${targetDashboardPath}`);
             return NextResponse.redirect(new URL(targetDashboardPath, req.url), { status: 307 });
        }
        
        // Si le rôle correspond, on laisse passer
        console.log(`[MIDDLEWARE-LOG] : SUCCÈS: Rôle correct (${folderName}). Laisse passer.`);
    }
    
    return NextResponse.next();
}

// Le 'matcher' est correct et nécessaire.
export const config = {
    matcher: ["/dashboard", "/dashboard/:path*"], 
};