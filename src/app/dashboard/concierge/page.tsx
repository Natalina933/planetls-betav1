'use client';

import { useCurrentUser } from '@/app/components/hooks/useCurrentUser';
import { Loader } from 'lucide-react';

export default function ConciergeDashboardPage() {
    const { user, loading, isAuthenticated } = useCurrentUser();

    if (loading || !isAuthenticated) {
        // Le middleware devrait gérer l'accès, mais c'est un bon fallback
        return (
            <main style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader className="animate-spin" size={32} />
                <p>Chargement du dashboard...</p>
            </main>
        );
    }

    // Détermine si l'utilisateur a un rôle PRO (ex: 'concierge_pro')
    const isPro = user?.role === 'concierge_pro';

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Tableau de Bord Conciergerie {isPro ? '✨ PRO' : 'Base'}</h1>
            <p>Bienvenue, {user?.username}. Gérez votre activité de conciergerie ici.</p>

            {/* -------------------------------------------------- */}
            {/* BLOC 1 : SERVICES DE BASE (ACCESSIBLES À TOUS) */}
            {/* -------------------------------------------------- */}
            <section style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '2rem' }}>
                <h2>Services Essentiels (Inclus)</h2>
                <ul>
                    <li>✅ Gestion des réservations standard</li>
                    <li>✅ Suivi des demandes de ménage</li>
                    <li>✅ Messagerie client de base</li>
                </ul>
            </section>
            
            {/* -------------------------------------------------- */}
            {/* BLOC 2 : FONCTIONNALITÉS PRO (CONDITIONNELLES) */}
            {/* -------------------------------------------------- */}
            {isPro ? (
                // --- VERSION PRO : Affiche les fonctionnalités payantes ---
                <section 
                    style={{ 
                        border: '2px solid #FFD700', 
                        padding: '1.5rem', 
                        marginTop: '2rem',
                        backgroundColor: '#FFFACD'
                    }}
                >
                    <h2>🚀 Outils Premium PRO (Actif)</h2>
                    <ul>
                        <li>📈 **Analyse de Performance Avancée** (Statistiques sur les revenus)</li>
                        <li>✉️ **Automatisation des Communications** (Emails et SMS)</li>
                        <li>⚙️ **Intégration d&apos;Outils Tiers** (Calendriers externes)</li>
                        {/* C'est ici que vous insérerez vos composants PRO */}
                    </ul>
                </section>
            ) : (
                // --- VERSION BASE : Affiche le CTA pour la mise à niveau ---
                <section 
                    style={{ 
                        border: '1px solid #FF6347', 
                        padding: '1.5rem', 
                        marginTop: '2rem',
                        backgroundColor: '#FFE4E1'
                    }}
                >
                    <h2>💰 Débloquez la Version PRO</h2>
                    <p>Passez au plan PRO pour accéder aux statistiques en temps réel et à l&apos;automatisation. Cela vous permettra d&apos;augmenter vos marges de 20% !</p>
                    {/* Le lien vers votre page Stripe/abonnement */}
                    <button onClick={() => window.location.href='/abonnement/concierge-pro'} style={{ padding: '10px 20px', backgroundColor: '#FF6347', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Voir l&apos;Offre PRO
                    </button>
                </section>
            )}
            
        </main>
    );
}