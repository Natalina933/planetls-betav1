type MissionRow = {
  id: string;
  title: string | null;
  priority: string | null;
  status: string | null;
};

type ConversationRow = {
  id: string;
  counterpart_name: string | null;
  last_message_at: string | null;
};

type HousingRow = {
  id: number;
  statut: string | null;
  nom?: string | null;
};

type CurrentProfile = {
  city?: string | null;
  service_area?: string | null;
  hourly_rate?: number | null;
  monthly_rate?: number | null;
  role?: string | null;
};

type WorkspaceTone = "default" | "warning" | "success";

export type AlertItem = {
  title: string;
  meta: string;
  description: string;
  href: string;
  actionLabel: string;
  tone?: WorkspaceTone;
};

export function olderThanThreeDays(value: string | null) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time > 3 * 24 * 60 * 60 * 1000;
}

export function buildUrgentMissionAlerts(urgentMissions: MissionRow[]): AlertItem[] {
  return urgentMissions.slice(0, 5).map((mission) => ({
    title: mission.title || "Mission urgente",
    meta: mission.status || "Statut non renseigné",
    description: "Intervention prioritaire à confirmer ou traiter rapidement.",
    href: "/dashboard/concierge/profile?tab=missions",
    actionLabel: "Traiter la mission",
    tone: "warning",
  }));
}

export function buildStalledConversationAlerts(stalledConversations: ConversationRow[]): AlertItem[] {
  return stalledConversations.slice(0, 5).map((conversation) => ({
    title: conversation.counterpart_name || "Propriétaire",
    meta: conversation.last_message_at ? "Plus de 3 jours sans réponse" : "Aucune date récente",
    description: "Une relance rapide peut aider à garder la relation commerciale active.",
    href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
    actionLabel: "Relancer",
    tone: "warning",
  }));
}

export function buildDraftHousingAlerts(draftHousings: HousingRow[]): AlertItem[] {
  return draftHousings.slice(0, 5).map((housing) => ({
    title: housing.nom || `Logement #${housing.id}`,
    meta: housing.statut || "brouillon",
    description: "Compléter les informations ou activer ce bien pour ne pas freiner l'acquisition.",
    href: `/dashboard/concierge/logements/${housing.id}`,
    actionLabel: "Finaliser la fiche",
  }));
}

export function buildProfileSetupAlerts(profile: CurrentProfile | null): AlertItem[] {
  const items: AlertItem[] = [];

  if (!profile?.city && !profile?.service_area) {
    items.push({
      title: "Zone d'intervention incomplète",
      meta: "Optimisation",
      description:
        "Sans zone claire, votre profil est moins rassurant et moins visible dans les parcours propriétaires.",
      href: "/dashboard/concierge/profile?tab=fiche",
      actionLabel: "Compléter ma fiche",
      tone: "warning",
    });
  }

  if (typeof profile?.hourly_rate !== "number" && typeof profile?.monthly_rate !== "number") {
    items.push({
      title: "Aucun repère tarifaire",
      meta: "Optimisation",
      description:
        "Définir au moins un tarif de base aide à convertir plus vite les propriétaires et clarifie votre offre.",
      href: "/dashboard/concierge/profile?tab=tarifs",
      actionLabel: "Configurer mes tarifs",
      tone: "warning",
    });
  }

  if (profile?.role !== "concierge_pro") {
    items.push({
      title: "Badge PRO non actif",
      meta: "Levier premium",
      description:
        "Le statut PRO renforce la confiance et augmente votre valeur perçue dans les recherches propriétaires.",
      href: "/abonnement/concierge-pro",
      actionLabel: "Voir l'offre PRO",
    });
  }

  return items;
}

