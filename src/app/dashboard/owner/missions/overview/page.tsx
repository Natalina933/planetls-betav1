"use client";

import SimpleOverviewWorkspace from "@/app/dashboard/_components/SimpleOverviewWorkspace";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
// 1. Importe le type GenericRecord depuis ton fichier partagé
import { buildOwnerMissionsCompletion, type GenericRecord } from "@/app/dashboard/shared"; 
import { useOwnerDashboardData } from "../../useOwnerDashboardData";

export default function OwnerMissionsOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { missions, conversations } = useOwnerDashboardData(isAuthenticated);

  // 2. On utilise GenericRecord[] au lieu de Mission[] ou any[]
  // Cela garantit que buildOwnerMissionsCompletion recevra exactement ce qu'il attend.
  const completionData = buildOwnerMissionsCompletion({
    missions: (missions || []) as GenericRecord[],
    conversations: (conversations || []) as GenericRecord[],
  });

  const PLANNING_HREF = "/dashboard/owner/planning";

  return (
    <SimpleOverviewWorkspace
      tone="owner"
      eyebrow="Pilotage"
      title="Missions"
      description="Synthèse de vos interventions, planning et messages."
      chips={["Synthèse", "Planning", "Alertes"]}
      actions={[
        { label: "Voir le planning", href: PLANNING_HREF, variant: "primary" },
        { label: "Messages", href: "/dashboard/owner/messages", variant: "secondary" },
      ]}
      completion={{
        ...completionData,
        title: "État d'avancement",
        description: "Suivez le pilotage de vos interventions.",
        actionLabel: "Accéder au planning",
        actionHref: PLANNING_HREF,
      }}
    />
  );
}