'use client';

import React from 'react';
import styles from './page.module.scss'; // ✅ 'styles' au pluriel, convention React
import {
  DollarSign,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Zap,
} from 'lucide-react';

import { useCurrentUser } from '@/app/components/hooks/useCurrentUser';

import DashboardCard from '@/app/components/dashboard/concierge/DashboardCard';
import ProUpgradeCTA from '@/app/components/dashboard/concierge/ProUpgradeCTA';
import BaseFeaturesList from '@/app/components/dashboard/concierge/BaseFeaturesList';
import ProToolsSection from '@/app/components/dashboard/concierge/ProToolsSection';
import DashboardCalendar, {
  DashboardEvent,
} from '@/app/components/dashboard/calendar/DashboardCalendar';
import ProfileExperienceBadge from '@/app/components/ui/ProfileExperienceBadge/ProfileExperienceBadge';

type ExperienceLevel = 'debutant' | 'intermediaire' | 'experimente';

interface ConciergeUser {
  role?: string | null;
  firstName?: string | null;
  username?: string | null;
  experience_level?: ExperienceLevel | null;
  years_experience?: number | null;
}

const eventsDemo: DashboardEvent[] = [
  {
    title: 'Réservation J-1',
    start: new Date(Date.now() - 86400000),
    end: new Date(Date.now() - 79200000),
    bookingId: 'D1',
    type: 'booking',
  },
  {
    title: 'Check-in Propriété A',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    bookingId: 'C1',
    type: 'booking',
  },
  {
    title: 'Rappel Nettoyage',
    start: new Date(Date.now() + 172800000),
    end: new Date(Date.now() + 172800000 + 3600000),
    bookingId: 'R1',
    type: 'reminder',
  },
];

export default function ConciergeDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser() as {
    user: ConciergeUser | null;
    loading: boolean;
    isAuthenticated: boolean;
  };

  if (loading || !isAuthenticated) {
    return (
      <div className={styles.dashboardLoadingContainer}>
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="mt-4 text-lg text-gray-600">
          Chargement de votre espace concierge...
        </p>
      </div>
    );
  }

  const isPro = user?.role === 'concierge_pro';
  const displayName = user?.firstName || user?.username || 'Utilisateur';
  const experienceLevel = user?.experience_level ?? null;
  const yearsExperience = user?.years_experience ?? null;

  return (
    <div className={styles.conciergeDashboardPage}>
      <header className={styles.dashboardHeader}>
        <h1>
          <LayoutDashboard className={styles.headerIcon} size={32} />
          Tableau de Bord Conciergerie{' '}
          {isPro ? <Zap className="text-yellow-500" /> : null}
        </h1>

        <p className={styles.subtitle}>
          Bienvenue, {displayName}. Gérez l&apos;ensemble de vos propriétés et
          services.
        </p>

        <div className={styles.profileExperienceBadgeWrapper}>
          <ProfileExperienceBadge
            experienceLevel={experienceLevel}
            yearsExperience={yearsExperience}
            missionsCount={undefined}
            averageRating={undefined}
          />
        </div>
      </header>

      <div className={styles.dashboardGrid}>
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
          value={isPro ? '€ 14.5k' : 'Accès PRO'}
          icon={DollarSign}
          isLocked={!isPro}
          description={
            isPro
              ? 'Mois en cours (estimation).'
              : 'Statistiques avancées réservées aux comptes PRO.'
          }
        />
      </div>

      <section className={styles.dashboardSection}>
        <h2>Fonctionnalités & Outils</h2>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <BaseFeaturesList />
          {isPro ? <ProToolsSection /> : <ProUpgradeCTA />}
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <h2>Planification & Réservations</h2>
        <DashboardCalendar events={eventsDemo} title="" />
      </section>
    </div>
  );
}
