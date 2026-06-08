"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageSquareText,
  PackageCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
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

const DAY_MS = 24 * 60 * 60 * 1000;

function getRealPartnerName(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed || null;
}

function getDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isWithinNextDays(value: string | null | undefined, days: number) {
  const date = getDateTime(value);
  if (!date) return false;
  const now = new Date();
  const max = new Date(now.getTime() + days * DAY_MS);
  return date >= now && date <= max;
}

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
      { label: "Logements", href: "/dashboard/owner/logements", badgeCount: draftCount },
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

  const todayMissions = useMemo(
    () =>
      ongoingMissions.filter((mission) => {
        const date = getDateTime(mission.scheduled_start);
        return date ? isSameLocalDay(date, new Date()) : false;
      }),
    [ongoingMissions],
  );

  const upcomingWeekMissions = useMemo(
    () => ongoingMissions.filter((mission) => isWithinNextDays(mission.scheduled_start, 7)),
    [ongoingMissions],
  );

  const stockRows = useMemo(
    () =>
      properties.map((property) => {
        const equipment = Array.isArray(property.infos?.equipements)
          ? property.infos.equipements.map((item) => item.trim()).filter(Boolean)
          : [];
        return {
          id: property.id,
          name: property.nom_logement || `Logement #${property.id}`,
          city: property.ville || "Ville à préciser",
          count: equipment.length,
          preview: equipment.slice(0, 3).join(", "),
          status: equipment.length > 0 ? "Renseigné" : "À compléter",
          href: `/dashboard/owner/logements/${property.id}`,
        };
      }),
    [properties],
  );

  const stockedHousingCount = stockRows.filter((item) => item.count > 0).length;
  const stockCoverage = properties.length > 0 ? Math.round((stockedHousingCount / properties.length) * 100) : 0;

  const partnerRows = useMemo(() => {
    const byPartner = new Map<
      string,
      {
        name: string;
        properties: Set<string>;
        missions: number;
        nextDate: string | null;
      }
    >();

    for (const mission of ongoingMissions) {
      const name = getRealPartnerName(mission.concierge_name);
      if (!name) continue;

      const property = properties.find((item) => String(item.id) === String(mission.property_id ?? ""));
      const propertyName = property?.nom_logement || property?.ville || "Logement à préciser";
      const current = byPartner.get(name) ?? {
        name,
        properties: new Set<string>(),
        missions: 0,
        nextDate: null,
      };
      current.properties.add(propertyName);
      current.missions += 1;
      if (mission.scheduled_start) {
        const nextTime = getDateTime(current.nextDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const missionTime = getDateTime(mission.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        if (missionTime < nextTime) current.nextDate = mission.scheduled_start;
      }
      byPartner.set(name, current);
    }

    return Array.from(byPartner.values()).map((item) => ({
      ...item,
      propertyList: Array.from(item.properties).slice(0, 3).join(", "),
    }));
  }, [ongoingMissions, properties]);

  const calendarRows = useMemo(
    () =>
      [...ongoingMissions]
        .filter((mission) => Boolean(mission.scheduled_start))
        .sort((left, right) => {
          const leftTime = getDateTime(left.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const rightTime = getDateTime(right.scheduled_start)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return leftTime - rightTime;
        })
        .slice(0, 5)
        .map((mission) => {
          const property = properties.find((item) => String(item.id) === String(mission.property_id ?? ""));
          return {
            id: mission.id,
            title: mission.title || "Mission à préciser",
            property: property?.nom_logement || property?.ville || "Logement à préciser",
            partner: getRealPartnerName(mission.concierge_name) || "Aucune conciergerie rattachée",
            date: formatDateValue(mission.scheduled_start, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            href: `/dashboard/owner/missions/${mission.id}`,
          };
        }),
    [ongoingMissions, properties],
  );

  const todayActionCards = useMemo(
    () => [
      {
        label: "Aujourd'hui",
        value: todayMissions.length,
        detail:
          todayMissions.length > 0
            ? `${todayMissions[0]?.title || "Mission"} à suivre maintenant.`
            : "Aucune mission datée aujourd'hui.",
        href: "/dashboard/owner/planning",
        cta: "Voir planning",
        icon: CalendarDays,
      },
      {
        label: "À répondre",
        value: unreadConversationCount,
        detail:
          unreadConversationCount > 0
            ? "Messages ou arbitrages en attente."
            : "Messagerie à jour.",
        href: "/dashboard/owner/messages",
        cta: "Messages",
        icon: MessageSquareText,
      },
      {
        label: "Équipements",
        value: properties.length > 0 ? `${stockedHousingCount}/${properties.length}` : "0",
        detail:
          properties.length === 0
            ? "Aucun logement à vérifier pour le moment."
            : stockedHousingCount === 0
              ? "Aucun équipement ou repère stock renseigné pour le moment."
              : stockCoverage < 100
                ? `${properties.length - stockedHousingCount} logement(s) à compléter.`
                : "Tous les logements ont des équipements renseignés.",
        href: "/dashboard/owner/stocks",
        cta: "Compléter",
        icon: PackageCheck,
      },
      {
        label: "Partenaires",
        value: partnerRows.length,
        detail:
          partnerRows.length > 0
            ? `${partnerRows[0].name} intervient sur ${partnerRows[0].propertyList}.`
            : "Aucun partenaire réel rattaché à vos missions pour le moment.",
        href: "/dashboard/owner/conciergerie/partenaires",
        cta: "Partenaires",
        icon: UsersRound,
      },
    ],
    [
      partnerRows,
      properties.length,
      stockCoverage,
      stockedHousingCount,
      todayMissions,
      unreadConversationCount,
    ],
  );

  const missionSnapshot = useMemo(
    () =>
      takeFirst(ongoingMissions, 3).map((mission) => ({
        id: mission.id,
        title: mission.title || "Mission à préciser",
        partner: getRealPartnerName(mission.concierge_name) || "Aucune conciergerie rattachée",
        date: formatDateValue(mission.scheduled_start, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        amount: formatEuroAmountLabel(mission.amount),
        href: `/dashboard/owner/missions/${mission.id}`,
      })),
    [ongoingMissions],
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
          label: "À faire aujourd'hui",
          value: `${todayMissions.length + unreadConversationCount + pendingInvoices.length}`,
          hint: `${todayMissions.length} mission(s), ${unreadConversationCount} message(s), ${pendingInvoices.length} facture(s)`,
          trend: todayMissions.length + unreadConversationCount + pendingInvoices.length > 0 ? "Action" : "Calme",
          progress: Math.min(100, (todayMissions.length + unreadConversationCount + pendingInvoices.length) * 20),
        },
        {
          label: "Équipements renseignés",
          value: properties.length > 0 ? `${stockedHousingCount}/${properties.length}` : "0",
          hint:
            properties.length === 0
              ? "Aucun logement suivi"
              : stockedHousingCount === 0
                ? "Aucun équipement ou stock renseigné"
                : `${properties.length - stockedHousingCount} logement(s) à compléter`,
          trend: properties.length === 0 || stockCoverage < 100 ? "À compléter" : "OK",
          progress: stockCoverage,
        },
        {
          label: "Partenaires actifs",
          value: `${partnerRows.length}`,
          hint:
            partnerRows.length > 0
              ? `${ongoingMissions.length} mission(s) ouverte(s)`
              : "Aucun partenaire rattaché",
          trend: partnerRows.length > 0 ? "En place" : "À relier",
          progress: properties.length > 0 ? Math.min(100, Math.round((partnerRows.length / properties.length) * 100)) : 0,
        },
        {
          label: "Planning 7 jours",
          value: `${upcomingWeekMissions.length}`,
          hint: `${ongoingMissions.length} opération(s) ouvertes`,
          trend: upcomingWeekMissions.length > 0 ? "À suivre" : "Libre",
          progress: Math.min(100, upcomingWeekMissions.length * 18),
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
      hideHeader
      profile={{
        name: user?.firstName || user?.username || OWNER_DASHBOARD_CONFIG.profileName,
        subtitle: loading ? "Chargement..." : `${properties.length} bien(s) suivi(s)`,
        badge: averageRating ? `${averageRating.toFixed(1)} / 5` : "Profil actif",
      }}
    >
      <FirstLoginOnboardingPopup path={onboardingPath} open={firstLoginOpen} onClose={handleCloseFirstLogin} />

      <section className={styles.sectionBlock} aria-labelledby="owner-focus-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Aujourd&apos;hui</span>
          <h2 id="owner-focus-title">À regarder en premier</h2>
        </div>
        <div className={styles.focusStrip}>
          {todayActionCards.map((card) => {
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

      <section className={styles.sectionBlock} aria-labelledby="owner-missions-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Missions</span>
          <h2 id="owner-missions-title">Premières missions à suivre</h2>
        </div>
        <div className={styles.missionSnapshotGrid}>
          {missionSnapshot.length > 0 ? (
            missionSnapshot.map((mission) => (
              <Link key={mission.id} href={mission.href} className={styles.missionSnapshotCard}>
                <span className={styles.missionSnapshotBadge}>En cours</span>
                <strong>{mission.title}</strong>
                <dl className={styles.missionFacts}>
                  <div>
                    <dt>Conciergerie</dt>
                    <dd>{mission.partner}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{mission.date}</dd>
                  </div>
                  <div>
                    <dt>Montant</dt>
                    <dd>{mission.amount}</dd>
                  </div>
                </dl>
              </Link>
            ))
          ) : (
            <Link href="/dashboard/owner/demandes" className={styles.missionEmptyCard}>
              <strong>Aucune mission ouverte</strong>
              <span>Créer une demande ou accepter un devis</span>
            </Link>
          )}
        </div>
      </section>

      <section className={`${styles.sectionBlock} ${styles.panelGrid}`} aria-label="Équipements et partenaires">
        <DashboardPanel title="Équipements et repères par logement">
          <AsyncState loading={loading} error={error}>
            <div className={styles.stockList}>
              {stockRows.slice(0, 5).map((item) => (
                <Link key={item.id} href={item.href} className={styles.stockRow}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.city}</span>
                  </div>
                  <div className={styles.stockStatus}>
                    <span>{item.count}</span>
                    <small>{item.status}</small>
                  </div>
                  <p>{item.preview || "Aucun équipement ou stock renseigné"}</p>
                </Link>
              ))}
              {stockRows.length === 0 ? (
                <Link href="/dashboard/owner/logements/create" className={styles.stockEmpty}>
                  Ajouter un logement pour suivre ses équipements
                </Link>
              ) : null}
            </div>
            <Link href="/dashboard/owner/stocks" className={styles.panelLink}>Ouvrir équipements et stocks</Link>
          </AsyncState>
        </DashboardPanel>

        <DashboardPanel title="Personnes qui travaillent avec moi">
          <AsyncState loading={loading} error={error}>
            <div className={styles.partnerList}>
              {partnerRows.slice(0, 4).map((partner) => (
                <Link key={partner.name} href="/dashboard/owner/conciergerie/partenaires" className={styles.partnerRow}>
                  <span className={styles.partnerAvatar}>{partner.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{partner.name}</strong>
                    <p>{partner.propertyList || "Logement à préciser"}</p>
                  </div>
                  <span className={styles.partnerCount}>{partner.missions}</span>
                </Link>
              ))}
              {partnerRows.length === 0 ? (
                <Link href="/dashboard/owner/concierges" className={styles.stockEmpty}>
                  Aucun partenaire rattaché, rechercher une conciergerie
                </Link>
              ) : null}
            </div>
          </AsyncState>
        </DashboardPanel>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-calendar-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Planning</span>
          <h2 id="owner-calendar-title">Missions en cours et à venir</h2>
        </div>
        <DashboardPanel title="Calendrier compact">
          <AsyncState loading={loading} error={error}>
            <div className={styles.calendarList}>
              {calendarRows.map((mission) => (
                <Link key={mission.id} href={mission.href} className={styles.calendarRow}>
                  <span className={styles.calendarDate}>{mission.date}</span>
                  <div>
                    <strong>{mission.title}</strong>
                    <p>{mission.property} · {mission.partner}</p>
                  </div>
                </Link>
              ))}
              {calendarRows.length === 0 ? (
                <Link href="/dashboard/owner/planning" className={styles.stockEmpty}>
                  Aucune mission planifiée, ouvrir le planning
                </Link>
              ) : null}
            </div>
          </AsyncState>
        </DashboardPanel>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="owner-priorities-title">
        <div className={styles.sectionLead}>
          <span className={styles.sectionEyebrow}>Actions</span>
          <h2 id="owner-priorities-title">À finaliser aujourd&apos;hui</h2>
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
