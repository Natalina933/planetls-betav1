"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { DashboardOperationalPage } from "@/components/dashboard";
import type {
  OperationalCadenceItem,
  OperationalDetailItem,
  OperationalDetailSection,
  OperationalMetric,
  OperationalRisk,
  OperationalTone,
} from "@/components/dashboard";
import type {
  DashboardWorkspaceAction,
  DashboardWorkspaceCard,
  DashboardWorkspaceDetailItem,
  DashboardWorkspaceDetailSection,
  DashboardWorkspaceMetric,
} from "./DashboardWorkspace";

type SimpleOverviewTone = "owner" | "concierge" | "provider";

type SimpleOverviewWorkspaceProps = {
  tone: SimpleOverviewTone;
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  actions?: DashboardWorkspaceAction[];
  completion: {
    title: string;
    description: string;
    percentage: number;
    completedCount: number;
    totalCount: number;
    missingItems: string[];
    actionLabel?: string;
    actionHref?: string;
  };
  metrics?: DashboardWorkspaceMetric[];
  cards?: DashboardWorkspaceCard[];
  detailSections?: DashboardWorkspaceDetailSection[];
  children?: React.ReactNode;
};

const RISK_ICONS: LucideIcon[] = [Gauge, CheckCircle2, AlertTriangle, ClipboardCheck];

function toOperationalTone(tone: SimpleOverviewTone): OperationalTone {
  return tone;
}

function getPrimaryActions(actions: DashboardWorkspaceAction[] = []) {
  return actions
    .filter((action): action is DashboardWorkspaceAction & { href: string } => Boolean(action.href))
    .map((action) => ({
      label: action.label,
      href: action.href,
    }));
}

function getCompletionAction(
  completion: SimpleOverviewWorkspaceProps["completion"],
  actions: DashboardWorkspaceAction[] = [],
) {
  if (completion.actionHref && completion.actionLabel) {
    return {
      label: completion.actionLabel,
      href: completion.actionHref,
    };
  }

  const firstLinkedAction = actions.find(
    (action): action is DashboardWorkspaceAction & { href: string } => Boolean(action.href),
  );

  if (!firstLinkedAction) return undefined;

  return {
    label: firstLinkedAction.label,
    href: firstLinkedAction.href,
  };
}

function getOperationalMetrics(
  metrics: DashboardWorkspaceMetric[] | undefined,
  completion: SimpleOverviewWorkspaceProps["completion"],
): OperationalMetric[] {
  if (metrics && metrics.length > 0) {
    return metrics.slice(0, 4).map((metric) => ({
      label: metric.label,
      value: metric.value,
      hint: metric.hint || "Indicateur de suivi",
      detailSectionId: metric.id,
    }));
  }

  const missingCount = completion.missingItems.length;

  return [
    {
      label: "Avancement",
      value: `${completion.percentage}%`,
      hint: "Progression de la categorie",
      detailSectionId: "completion",
    },
    {
      label: "Valides",
      value: `${completion.completedCount}/${completion.totalCount}`,
      hint: "Etapes completees",
      detailSectionId: "completion",
    },
    {
      label: "A finaliser",
      value: String(missingCount),
      hint: missingCount > 0 ? "Points restants" : "Categorie structuree",
      detailSectionId: "completion",
    },
    {
      label: "Statut",
      value: completion.percentage >= 100 ? "Pret" : "A suivre",
      hint: completion.percentage >= 100 ? "Base exploitable" : "Configuration a completer",
      detailSectionId: "completion",
    },
  ];
}

function getOperationalRisks(
  metrics: DashboardWorkspaceMetric[] | undefined,
  completion: SimpleOverviewWorkspaceProps["completion"],
): OperationalRisk[] {
  if (metrics && metrics.length > 0) {
    return metrics.slice(0, 4).map((metric, index) => ({
      label: metric.label,
      value: metric.value,
      hint: metric.hint || "Indicateur de suivi",
      icon: RISK_ICONS[index] ?? Gauge,
      tone: "info",
      detailSectionId: metric.id,
    }));
  }

  const missingCount = completion.missingItems.length;

  return [
    {
      label: "Progression",
      value: `${completion.percentage}%`,
      hint: "Niveau de preparation",
      icon: Gauge,
      tone: completion.percentage >= 100 ? "success" : "warning",
      detailSectionId: "completion",
    },
    {
      label: "Valides",
      value: `${completion.completedCount}/${completion.totalCount}`,
      hint: "Controles passes",
      icon: CheckCircle2,
      tone: completion.completedCount > 0 ? "success" : "info",
      detailSectionId: "completion",
    },
    {
      label: "Restants",
      value: missingCount,
      hint: missingCount > 0 ? "Actions a finaliser" : "Aucun blocage",
      icon: AlertTriangle,
      tone: missingCount > 0 ? "warning" : "success",
      detailSectionId: "completion",
    },
    {
      label: "Pilotage",
      value: completion.percentage >= 100 ? "OK" : "Priorite",
      hint: completion.title,
      icon: ClipboardCheck,
      tone: completion.percentage >= 100 ? "success" : "info",
      detailSectionId: "completion",
    },
  ];
}

function getCadence(
  chips: string[] | undefined,
  cards: DashboardWorkspaceCard[] | undefined,
  completion: SimpleOverviewWorkspaceProps["completion"],
): OperationalCadenceItem[] {
  const firstMissingItem = completion.missingItems[0];
  const firstCard = cards?.[0];
  const secondChip = chips?.[1];

  return [
    {
      label: "Maintenant",
      text: firstMissingItem
        ? `Finaliser : ${firstMissingItem}.`
        : `${completion.title} est pret pour une lecture rapide.`,
      icon: AlertTriangle,
    },
    {
      label: secondChip || "Cette semaine",
      text: firstCard?.text || "Verifier les indicateurs et traiter les points qui demandent une decision.",
      icon: ListChecks,
    },
    {
      label: "Avant publication",
      text: "Relire les actions, les donnees clefs et les elements en attente avant de basculer dans le detail.",
      icon: ArrowRight,
    },
  ];
}

function getDetailAction(
  item: DashboardWorkspaceDetailItem,
  fallbackAction?: { label: string; href: string },
) {
  if (item.href && item.actionLabel) {
    return {
      label: item.actionLabel,
      href: item.href,
    };
  }

  const firstLinkedAction = item.actions?.find(
    (action): action is DashboardWorkspaceAction & { href: string } => Boolean(action.href),
  );

  if (firstLinkedAction) {
    return {
      label: firstLinkedAction.label,
      href: firstLinkedAction.href,
    };
  }

  return fallbackAction;
}

function toDetailItem(
  item: DashboardWorkspaceDetailItem,
  fallbackAction?: { label: string; href: string },
): OperationalDetailItem {
  return {
    title: item.title,
    meta: item.meta || "A suivre",
    description:
      item.description ||
      (item.facts && item.facts.length > 0 ? item.facts.join(" · ") : "Element a verifier dans cette vue."),
    action: getDetailAction(item, fallbackAction),
  };
}

function getDetailSections(
  cards: DashboardWorkspaceCard[] | undefined,
  detailSections: DashboardWorkspaceDetailSection[] | undefined,
  completion: SimpleOverviewWorkspaceProps["completion"],
  fallbackAction?: { label: string; href: string },
): OperationalDetailSection[] {
  const sections: OperationalDetailSection[] = [];

  if (cards && cards.length > 0) {
    sections.push({
      id: "priorites",
      title: "Priorites du moment",
      description: "Actions et arbitrages a traiter avant d'entrer dans les vues detaillees.",
      emptyText: "Aucune priorite a afficher pour le moment.",
      items: cards.map((card) => {
        const firstAction = card.actions?.find(
          (action): action is DashboardWorkspaceAction & { href: string } => Boolean(action.href),
        );

        return {
          title: card.title,
          meta: card.notificationCount ? `${card.notificationCount} alerte(s)` : "Action",
          description: card.text,
          action: firstAction
            ? {
                label: firstAction.label,
                href: firstAction.href,
              }
            : fallbackAction,
        };
      }),
    });
  }

  if (detailSections && detailSections.length > 0) {
    sections.push(
      ...detailSections.map((section, index) => ({
        id: section.id || `detail-${index}`,
        title: section.title,
        description: section.description || "Elements a garder proches pour le pilotage.",
        emptyText: section.emptyText || "Aucun element a afficher pour le moment.",
        items: section.items.map((item) => toDetailItem(item, fallbackAction)),
      })),
    );
  }

  sections.push({
    id: "completion",
    title: completion.title,
    description: completion.description,
    emptyText: "Aucun point manquant pour le moment.",
    items: completion.missingItems.map((item) => ({
      title: item,
      meta: "A finaliser",
      description: "Point requis pour rendre cette categorie plus robuste et exploitable.",
      action: fallbackAction,
    })),
  });

  return sections;
}

export default function SimpleOverviewWorkspace({
  tone,
  eyebrow,
  title,
  description,
  chips,
  actions,
  completion,
  metrics,
  cards,
  detailSections,
  children,
}: SimpleOverviewWorkspaceProps) {
  const completionAction = getCompletionAction(completion, actions);
  const firstMissingItem = completion.missingItems[0];
  const isComplete = completion.percentage >= 100 || completion.missingItems.length === 0;

  return (
    <DashboardOperationalPage
      tone={toOperationalTone(tone)}
      badge={eyebrow}
      title={title}
      description={description}
      primaryActions={getPrimaryActions(actions)}
      metrics={getOperationalMetrics(metrics, completion)}
      focus={{
        title: "Priorite de configuration",
        status: isComplete ? "Pret" : "A completer",
        statusVariant: isComplete ? "success" : "warning",
        icon: isComplete ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />,
        heading: firstMissingItem || completion.title,
        description: firstMissingItem ? `Prochaine etape : ${firstMissingItem}.` : completion.description,
        action: completionAction,
      }}
      risks={getOperationalRisks(metrics, completion)}
      cadenceTitle="Cadence de pilotage"
      cadence={getCadence(chips, cards, completion)}
      detailsBadge="Details"
      detailsTitle="Configuration exploitable"
      detailsDescription="Cliquez sur un indicateur pour isoler les priorites, les points en attente ou les donnees utiles."
      detailSections={getDetailSections(cards, detailSections, completion, completionAction)}
    >
      {children}
    </DashboardOperationalPage>
  );
}
