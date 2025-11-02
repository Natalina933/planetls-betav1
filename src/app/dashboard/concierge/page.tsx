// src/app/dashboard/concierge/page.tsx
'use client';

import React from 'react';
import { useCurrentUser } from '@/app/components/hooks/useCurrentUser';
import { Loader2, Zap, LayoutDashboard, DollarSign, MessageSquare } from 'lucide-react';

// Composants Modulaires pour une meilleure lisibilité et maintenance
import DashboardCard from '@/app/components/dashboard/concierge/DashboardCard';
import ProUpgradeCTA from '@/app/components/dashboard/concierge/ProUpgradeCTA';
import BaseFeaturesList from '@/app/components/dashboard/concierge/BaseFeaturesList';
import ProToolsSection from '@/app/components/dashboard/concierge/ProToolsSection';

export default function ConciergeDashboardPage() {
    const { user, loading, isAuthenticated } = useCurrentUser();

    // ----------------------------------------------------
    // 1. Gestion des États de Chargement et d'Authentification
    // ----------------------------------------------------
    if (loading || !isAuthenticated) {
        // Style professionnel pour le chargement
        return (
            <div className="dashboard-loading-container">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="mt-4 text-lg text-gray-600">Chargement de votre espace concierge...</p>
            </div>
        );
    }

    // Le rôle commence par 'concierge' mais peut être 'concierge_pro'
    const isPro = user?.role === 'concierge_pro';
    const displayName = user?.firstName || user?.username || 'Utilisateur';

    return (
        <div className="concierge-dashboard-page">
            <header className="dashboard-header">
                <h1>
                    <LayoutDashboard className="header-icon" size={32} />
                    Tableau de Bord Conciergerie {isPro ? <Zap className="text-yellow-500" /> : ''}
                </h1>
                <p className="subtitle">
                    Bienvenue, **{displayName}**. Gérez l&apos;ensemble de vos propriétés et services.
                </p>
            </header>

            <div className="dashboard-grid">
                {/* ---------------------------------------------------- */}
                {/* 2. Affichage des Statistiques Clés (Mockup) */}
                {/* ---------------------------------------------------- */}
                <DashboardCard 
                    title="Réservations Actives"
                    value="12"
                    icon={Zap}
                    description="Total des séjours en cours."
                />
                <DashboardCard 
                    title="Demandes de Tâches"
                    value="3"
                    icon={MessageSquare}
                    description="Nouvelles demandes en attente."
                />
                <DashboardCard 
                    title="Revenu Potentiel"
                    value={isPro ? "€ 14.5k" : "Accès PRO"}
                    icon={DollarSign}
                    isLocked={!isPro}
                    description={isPro ? "Mois en cours (estimation)." : "Statistiques avancées."}
                />
            </div>

            <section className="dashboard-section">
                <h2>Fonctionnalités & Outils</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    
                    {/* Colonne 1 : Outils de Base */}
                    <BaseFeaturesList />

                    {/* Colonne 2 : Outils PRO (Conditionnel) */}
                    {isPro ? (
                        <ProToolsSection />
                    ) : (
                        <ProUpgradeCTA />
                    )}

                </div>
            </section>
        </div>
    );
}

// --------------------------------------------------------------------------------
// NOTE: Vous devez créer les fichiers pour les composants réutilisables ci-dessous.
// --------------------------------------------------------------------------------