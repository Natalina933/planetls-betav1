/** Read model only: these references can later link to the contractual workflow. */
export type PendingHousingCollaboration = {
  id: string;
  status: "pending_handover" | "active";
  owner: { id: string; name: string };
  concierge: { id: string; name: string };
  housing: { id: number; name: string };
  quote: { id: string; number: string | null };
  request: { id: string; title: string } | null;
  contractId?: string | null;
  missionId: string | null;
};

export const PENDING_COLLABORATION_LABEL = "En attente de contractualisation";
