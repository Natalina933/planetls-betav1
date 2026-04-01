import { Badge } from "@/components/ui/Badge";
import {
  deriveRequestWorkflowStatus,
  getRequestWorkflowMeta,
  type RequestWorkflowStatus,
} from "@/app/lib/requestStatus";

type RequestStatusBadgeProps = {
  status?: RequestWorkflowStatus | null;
  workflowStatus?: string | null;
  serviceRequestStatus?: string | null;
  recipientStatus?: string | null;
  quoteStatus?: string | null;
  missionStatus?: string | null;
  hasMission?: boolean;
  className?: string;
};

export function RequestStatusBadge({
  status,
  workflowStatus,
  serviceRequestStatus,
  recipientStatus,
  quoteStatus,
  missionStatus,
  hasMission = false,
  className,
}: RequestStatusBadgeProps) {
  const resolvedStatus =
    status ??
    deriveRequestWorkflowStatus({
      workflowStatus,
      serviceRequestStatus,
      recipientStatus,
      quoteStatus,
      missionStatus,
      hasMission,
    });
  const meta = getRequestWorkflowMeta(resolvedStatus);

  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

export default RequestStatusBadge;
