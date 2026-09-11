import { Badge } from "@/components/ui";
import { planningStatusLabels } from "./planningLabels";
import type { OwnerPlanningItem } from "./types";

export default function OwnerPlanningStatus({ status }: { status: OwnerPlanningItem["status"] }) {
  const variant = status === "urgent" ? "danger"
    : status === "a_faire" || status === "en_attente_validation" ? "warning" : "success";
  return <Badge variant={variant}>{planningStatusLabels[status]}</Badge>;
}
