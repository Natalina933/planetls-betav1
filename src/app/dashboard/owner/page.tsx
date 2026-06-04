"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Home, MessageSquareText, Receipt, Sparkles } from "lucide-react";
import { AsyncState } from "@/components/ui";
import { DashboardLayout, DashboardLoadingScreen, DashboardPanel } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import { takeFirst } from "../shared";
import type { DashboardUserIdentity } from "../shared";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import {
  FirstLoginOnboardingPopup,
  OnboardingPromptCard,
  DashboardOnboardingSummary,
  shouldShowDashboardReminder,
  shouldShowFirstLoginPopup,
  type OnboardingActionStatus,
  type OnboardingPath,
} from "@/features/onboarding-assistant";
import { getOwnerHousingStatusLabel, useOwnerDashboardData } from "./useOwnerDashboardData";
import {
  OWNER_DASHBOARD_CONFIG,
  OWNER_NAV_ITEMS,
  OWNER_QUICK_ACTIONS,
} from "@/features/owner-dashboard";
import styles from "./page.module.scss";

export default function OwnerDashboardPage() {
  const { user, loading: userLoading, isAuthenticated } = useCurrentUser() as {
    user: (DashboardUserIdentity & Pick<CurrentUser, "id" | "availability_hours" | "service_area" | "service_radius_km">) | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
  const {
    properties,
    loading,
    error,
    activeCount,
    draftCount,
    ongoingMissions,
    completedMissions,
    pendingInvoices,
    latestQuotes,
    latestInvoices,
    averageRating,
    unreadConversationCount,
    ownerActivationProgress,
  } = useOwnerDashboardData(isAuthenticated);

  const activityItems = [
    ...takeFirst(properties, 2).map((property) => ({
      id: `property-${property.id}`,
      title: property.nom_logement || "Logement sans nom",
      description: `${property.ville || "Ville non renseignée"} · ${getOwnerHousingStatusLabel(property.statut)}`,
      href: `/dashboard/owner/logements/${property.id}`,
      statusLabel: property.statut === "Actif - suivi en cours" ? "Actif" : "A finaliser",
      actionLabel: "Voir",
    })),
    ...takeFirst(ongoingMissions, 2).map((mission) => ({
      id: `mission-${mission.id}`,
      title: mission.title || "Mission sans titre",
      description: `${formatDateValue(mission.scheduled_start, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} · ${formatEuroAmountLabel(mission.amount)}`,
      href: "/dashboard/owner/planning",
      statusLabel: "Mission",
      actionLabel: "Suivre",
    })),
  ];
  const onboardingPath: OnboardingPath = "business+";
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const actionStatus = useMemo<Record<string, OnboardingActionStatus>>(() => ({
    "configure-packs": properties.length > 0 ? "done" : "todo",
    "set-pricing": latestQuotes.length > 0 ? "done" : "todo",
    "prepare-docs": latestInvoices.length > 0 ? "done" : "todo",
  }), [latestInvoices.length, latestQuotes.length, properties.length]);

  useEffect(() => {
    if (!user?.id) return;
    const seenFlag = window.localStorage.getItem(`owner-onboarding-first-login-seen:${user.id}`);
    const shouldOpen = shouldShowFirstLoginPopup({
      firstLogin: !seenFlag,
      completionState: "in_progress",
      actionStatus,
    });
    setFirstLoginOpen(shouldOpen);
  }, [actionStatus, user?.id]);

  const showDashboardReminder = shouldShowDashboardReminder(onboardingPath, {
    firstLogin: false,
    completionState: "in_progress",
    actionStatus,
  }) && !reminderDismissed;

  const ownerShortcuts = useMemo(
    () => [
      { label: "Annonces", href: "/dashboard/owner/logements", badgeCount: draftCount },
      { label: "Missions", href: "/dashboard/owner/planning", badgeCount: ongoingMissions.length },
      { label: "Factures", href: "/dashboard/owner/factures", badgeCount: pendingInvoices.length },
      { label: "Messages", href: "/dashboard/owner/messages", badgeCount: unreadConversationCount },
      { label: "Devis", href: "/dashboard/owner/devis", badgeCount: latestQuotes.length },
    ],
    [
      draftCount,
      latestQuotes.length,
      ongoingMissions.length,
      pendingInvoices.length,
      unreadConversationCount,
    ],
  );

  const ownerQuickActions = useMemo(
    () => [
      {
        ...OWNER_QUICK_ACTIONS[0],
        completed: properties.length > 0,
        completedLabel: "Terminé",
      },
      {
        ...OWNER_QUICK_ACTIONS[1],
        completed: unreadConversationCount > 0 || ongoingMissions.length > 0,
        completedLabel: "En place",
      },
      {
        ...OWNER_QUICK_ACTIONS[2],
        completed: ongoingMissions.length > 0,
        completedLabel: "Déjà lancé",
      },
    ],
    [ongoingMissions.length, properties.length, unreadConversationCount],
  );

  const priorityItems = useMemo(
    () => [
      {
        label: "Logements à finaliser",
        value: draftCount,
        detail:
          draftCount > 0
            ? "Des fiches restent incomplètes avant publication."
            : "Toutes les fiches actives sont exploitables.",
        href: "/dashboard/owner/logements",
        cta: draftCount > 0 ? "Finaliser les fiches" : "Voir les logements",
      },
      {
        label: "Messages non lus",
        value: unreadConversationCount,
        detail:
          unreadConversationCount > 0
            ? "Des réponses de conciergerie attendent votre arbitrage."
            : "La messagerie est à jour.",
        href: "/dashboard/owner/messages",
        cta: unreadConversationCount > 0 ? "Répondre" : "Ouvrir la messagerie",
      },
      {
        label: "Factures à surveiller",
        value: pendingInvoices.length,
        detail:
          pendingInvoices.length > 0
            ? "Des règlements ou validations doivent être traités."
            : "Aucun point financier urgent.",
        href: "/dashboard/owner/factures",
        cta: pendingInvoices.length > 0 ? "Vérifier les factures" : "Voir les finances",
      },
    ],
    [draftCount, pendingInvoices.length, unreadConversationCount],
  );

  const focusCards = useMemo(
    () => [
      {
        label: "Parc actif",
        value: `${activeCount}/${properties.length}`,
        detail: draftCount > 0 ? `${draftCount} fiche(s) encore à finaliser.` : "Tous les biens visibles sont exploitables.",
        href: "/dashboard/owner/logements",
        cta: "Piloter les annonces",
        icon: Home,
      },
      {
        label: "Relation conciergerie",
        value: `${unreadConversationCount}`,
        detail:
          unreadConversationCount > 0
            ? "Des retours terrain attendent un arbitrage."
            : "Aucun message en attente, coordination fluide.",
        href: "/dashboard/owner/messages",
        cta: "Ouvrir les messages",
        icon: MessageSquareText,
      },
      {
        label: "Zone finance",
        value: `${pendingInvoices.length}`,
        detail:
          pendingInvoices.length > 0
            ? "Des factures demandent une vérification rapide."
            : "La zone finance ne présente pas d'urgence.",
        href: "/dashboard/owner/factures",
        cta: "Vérifier les règlements",
        icon: Receipt,
      },
    ],
    [activeCount, draftCount, pendingInvoices.length, properties.length, unreadConversationCount],
  );

  const strategyNotes = useMemo(
    () => [
      {
        title: "Cap business",
        text:
          draftCount > 0
            ? "Finaliser les fiches manquantes reste le levier le plus rentable pour clarifier votre lecture du parc."
            : "Votre parc est suffisamment propre pour passer d'une logique de setup a une logique de performance.",
      },
      {
        title: "Cap relationnel",
        text:
          unreadConversationCount > 0
            ? "Les nouveaux messages meritent une revue rapide pour eviter les frictions de coordination avec la conciergerie."
            : "La communication avec la conciergerie est stable, vous pouvez vous concentrer sur les arbitrages plus structurants.",
      },
      {
        title: "Cap cash",
        text:
          pendingInvoices.length > 0
            ? "Traiter les factures en attente avant d'ouvrir de nouvelles demandes garde votre pilotage plus sain."
            : "Le cycle de reglement est sous controle, vous pouvez ouvrir le prochain chantier sans bruit financier.",
      },
    ],
    [draftCount, pendingInvoices.length, unreadConversationCount],
  );

  const handleCloseFirstLogin = () => {
    if (user?.id) {
      window.localStorage.setItem(`owner-onboarding-first-login-seen:${user.id}`, "1");
    }
    setFirstLoginOpen(false);
  };

  if (userLoading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace propriétaire..." />;
  }

  return (
    <DashboardLayout
      persona="owner"
      title={OWNER_DASHBOARD_CONFIG.title}
      subtitle={error || OWNER_DASHBOARD_CONFIG.defaultSubtitle}
      navTitle={OWNER_DASHBOARD_CONFIG.navTitle}
      navItems={OWNER_NAV_ITEMS}
      stats={[
        {
          label: "Logements actifs",
          value: `${activeCount}/${properties.length}`,
          hint: draftCount > 0 ? `${draftCount} fiche(s) à finaliser` : "Parc opérationnel",
          trend: draftCount > 0 ? "Setup" : "Stable",
        },
        {
          label: "Opérations ouvertes",
          value: `${ongoingMissions.length}`,
          hint: `${completedMissions.length} intervention(s) terminée(s)`,
          trend: ongoingMissions.length > 0 ? "A suivre" : "OK",
        },
        {
          label: "Factures à régler",
          value: `${pendingInvoices.length}`,
          hint: `${latestInvoices.length} facture(s) récente(s)`,
          trend: pendingInvoices.length > 0 ? "Priorite" : "OK",
        },
        {
          label: "Progression owner",
          value: `${ownerActivationProgress.percentage}%`,
          hint: `${ownerActivationProgress.completedCount}/${ownerActivationProgress.totalCount} jalons`,
          trend: ownerActivationProgress.percentage < 100 ? "A activer" : "OK",
        },
      ]}
      actions={ownerQuickActions}
      activity={activityItems}
      notifications={[
        {
          id: "n1",
          title:
            pendingInvoices.length > 0
              ? `${pendingInvoices.length} facture(s) en attente de vérification.`
              : "Aucune facture urgente.",
          level: pendingInvoices.length > 0 ? "warning" : "info",
          href: "/dashboard/owner/factures",
        },
        {
          id: "n2",
          title:
            unreadConversationCount > 0
              ? `${unreadConversationCount} nouveau(x) message(s) conciergerie.`
              : "Aucun nouveau message prioritaire.",
          level: unreadConversationCount > 0 ? "danger" : "info",
          href: "/dashboard/owner/messages",
        },
      ]}
      shortcuts={ownerShortcuts}
      showBottomNav={false}
      profile={{
        name: user?.firstName || user?.username || OWNER_DASHBOARD_CONFIG.profileName,
        subtitle: loading ? "Chargement..." : `${properties.length} bien(s) suivi(s)`,
        badge: averageRating ? `${averageRating.toFixed(1)} / 5` : "Profil actif",
      }}
    >
      <FirstLoginOnboardingPopup path={onboardingPath} open={firstLoginOpen} onClose={handleCloseFirstLogin} />

      <section className={styles.sectionBlock} aria-labelledby="owner-focus-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Lecture rapide</span>
          <h2 id="owner-focus-title">Vos leviers immédiats</h2>
          <p>Les trois zones à regarder en premier pour décider vite et garder un pilotage propre.</p>
        </div>
        <div className={styles.focusStrip}>
          {focusCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={styles.focusCard}>
                <div className={styles.focusTop}>
                  <span className={styles.focusIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.focusLabel}>{card.label}</span>
                </div>
                <strong className={styles.focusValue}>{card.value}</strong>
                <p className={styles.focusDetail}>{card.detail}</p>
                <Link href={card.href} className={styles.focusLink}>
                  {card.cta}
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-priorities-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Actions</span>
          <h2 id="owner-priorities-title">Ce qu'il faut finaliser aujourd'hui</h2>
          <p>Des actions concrètes, courtes et utiles pour faire avancer votre exploitation sans friction.</p>
        </div>
        <DashboardPanel title="Priorités du jour">
          <div className={styles.priorityGrid}>
            {priorityItems.map((item) => (
              <article key={item.label} className={styles.priorityCard}>
                <div className={styles.priorityHeader}>
                  <span className={styles.priorityValue}>{item.value}</span>
                  <span className={styles.priorityLabel}>{item.label}</span>
                </div>
                <p className={styles.priorityDetail}>{item.detail}</p>
                <Link href={item.href} className={styles.priorityLink}>
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </section>

      <section className={`${styles.sectionBlock} ${styles.panelGrid}`}>
        <DashboardPanel title="Vue d'ensemble">
          <AsyncState loading={loading} error={error}>
            <div className={styles.storyBlock}>
              <p>
                {activeCount} logement(s) actif(s) sur {properties.length}, avec {ongoingMissions.length} opération(s)
                ouverte(s) et {pendingInvoices.length} facture(s) à surveiller.
              </p>
              <p>
                {properties[0]
                  ? `Bien le plus récent : ${properties[0].nom_logement || "Logement sans nom"} à ${
                      properties[0].ville || "ville à préciser"
                    }.`
                  : "Aucun bien publié pour le moment."}
              </p>
              <Link href="/dashboard/owner/logements/overview">Ouvrir la vue synthèse des logements</Link>
            </div>
          </AsyncState>
        </DashboardPanel>

        <DashboardPanel title="Reporting de gestion">
          <AsyncState loading={loading} error={error}>
            <div className={styles.reportList}>
              <article className={styles.reportCard}>
                <span className={styles.reportLabel}>Dernière facture</span>
                <strong className={styles.reportValue}>
                  {latestInvoices[0]?.invoice_number || "Aucune facture recente"}
                </strong>
                <p>
                  {latestInvoices.length > 0
                    ? `Solde ${formatEuroAmountLabel(latestInvoices[0].balance_amount)}`
                    : "Aucun règlement récent consolidé."}
                </p>
              </article>
              <article className={styles.reportCard}>
                <span className={styles.reportLabel}>Dernier devis</span>
                <strong className={styles.reportValue}>
                  {latestQuotes[0]?.quote_number || "Aucun devis récent"}
                </strong>
                <p>
                  {latestQuotes.length > 0
                    ? `${formatEuroAmountLabel(latestQuotes[0].total_amount)} à arbitrer ou confirmer.`
                    : "Aucun devis récent dans votre espace."}
                </p>
              </article>
              <article className={styles.reportCard}>
                <span className={styles.reportLabel}>Intervention prioritaire</span>
                <strong className={styles.reportValue}>
                  {ongoingMissions[0]?.title || "Aucune intervention ouverte"}
                </strong>
                <p>
                  {ongoingMissions.length > 0
                    ? formatDateValue(ongoingMissions[0].scheduled_start, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Le planning est actuellement calme."}
                </p>
              </article>
            </div>
            <Link href="/dashboard/owner/factures">Ouvrir le suivi financier</Link>
          </AsyncState>
        </DashboardPanel>
      </section>

      <details className={styles.disclosureBlock}>
        <summary className={styles.disclosureSummary}>
          <div>
            <span className={styles.sectionEyebrow}>Analyses avancées</span>
            <strong>Ouvrir les éléments secondaires du cockpit</strong>
            <p>À consulter lorsque vous voulez creuser la stratégie, la progression ou le détail de fond.</p>
          </div>
        </summary>
        <div className={styles.disclosureContent}>
          <section className={styles.panelGrid}>
            <DashboardPanel title="Pilotage stratégique">
              <AsyncState loading={loading} error={error}>
                <div className={styles.noteList}>
                  {strategyNotes.map((note) => (
                    <article key={note.title} className={styles.noteCard}>
                      <div className={styles.noteTitleRow}>
                        <Sparkles size={15} />
                        <strong>{note.title}</strong>
                      </div>
                      <p>{note.text}</p>
                    </article>
                  ))}
                </div>
              </AsyncState>
            </DashboardPanel>

            <DashboardPanel title="Progression propriétaire">
              <AsyncState loading={loading} error={error}>
                <div className={styles.storyBlock}>
                  <p>
                    Parcours global: {ownerActivationProgress.completedCount}/{ownerActivationProgress.totalCount} jalons
                    validés ({ownerActivationProgress.percentage}%).
                  </p>
                  <p>
                    Jalons restants:{" "}
                    {ownerActivationProgress.missingItems.length > 0
                      ? ownerActivationProgress.missingItems.join(", ")
                      : "aucun, parcours complet."}
                  </p>
                  <Link href="/dashboard/owner/demandes">Continuer le parcours owner</Link>
                </div>
              </AsyncState>
            </DashboardPanel>
          </section>
        </div>
      </details>

      <details className={styles.disclosureBlock}>
        <summary className={styles.disclosureSummary}>
          <div>
            <span className={styles.sectionEyebrow}>Parcours & options</span>
            <strong>Parcours business+ et future logique business++</strong>
            <p>
              Cette zone peut rester plus basse dans la page et évoluer plus tard vers une couche
              premium, activable quand vous voudrez monétiser des optimisations avancées.
            </p>
          </div>
        </summary>
        <div className={styles.disclosureContent}>
          {showDashboardReminder ? (
            <OnboardingPromptCard path={onboardingPath} actionStatus={actionStatus} onDismiss={() => setReminderDismissed(true)} />
          ) : null}

          <DashboardOnboardingSummary
            role="owner"
            availabilityHours={user?.availability_hours}
            serviceArea={user?.service_area}
            serviceRadiusKm={user?.service_radius_km}
          />
        </div>
      </details>
    </DashboardLayout>
  );
}
