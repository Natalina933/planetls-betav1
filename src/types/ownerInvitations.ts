export const OWNER_INVITATION_STATUSES = [
  "sent",
  "viewed",
  "accepted",
  "expired",
  "relanced",
  "cancelled",
] as const;

export type OwnerInvitationStatus = (typeof OWNER_INVITATION_STATUSES)[number];

export type OwnerInvitationTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface OwnerInvitationContext {
  housingId: string | null;
  quoteId: string | null;
  missionId: string | null;
  ownerNameHint: string | null;
}

export interface OwnerInvitationRecord {
  id: string;
  conciergeProfileId: string;
  housingId: string | null;
  invitedEmail: string;
  invitedEmailNormalized: string;
  invitedOwnerName: string | null;
  personalNote: string | null;
  status: OwnerInvitationStatus;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  expiresAt: string | null;
  relaunchCount: number;
  relancedAt: string | null;
  cancelledAt: string | null;
  claimedOwnerProfileId: string | null;
  lastEventAt: string | null;
  context: OwnerInvitationContext;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerInvitationListItem extends OwnerInvitationRecord {
  conciergeLabel: string | null;
  housingLabel: string | null;
}

export interface CreateOwnerInvitationPayload {
  housingId: string;
  email: string;
  ownerNameHint?: string;
  personalNote?: string;
  quoteId?: string | null;
  missionId?: string | null;
}

export const OWNER_INVITATION_STATUS_META: Record<
  OwnerInvitationStatus,
  {
    label: string;
    description: string;
    tone: OwnerInvitationTone;
  }
> = {
  sent: {
    label: "Envoyée",
    description: "Invitation envoyée. Le propriétaire n'a pas encore ouvert son lien.",
    tone: "info",
  },
  viewed: {
    label: "Vue",
    description: "Le propriétaire a consulté l'invitation, sans finaliser son inscription pour le moment.",
    tone: "warning",
  },
  accepted: {
    label: "Acceptée",
    description: "Le compte propriétaire est créé et relié au concierge.",
    tone: "success",
  },
  expired: {
    label: "Expirée",
    description: "Le lien n'est plus valide. Une relance permet de régénérer un accès sécurisé.",
    tone: "danger",
  },
  relanced: {
    label: "Relancée",
    description: "Une nouvelle invitation a été renvoyée avec un lien actualisé.",
    tone: "info",
  },
  cancelled: {
    label: "Annulée",
    description: "L'invitation a été désactivée et ne peut plus être utilisée.",
    tone: "neutral",
  },
};

export function normalizeInvitationStatus(value: unknown): OwnerInvitationStatus {
  if (typeof value !== "string") return "sent";
  if ((OWNER_INVITATION_STATUSES as readonly string[]).includes(value)) {
    return value as OwnerInvitationStatus;
  }
  return "sent";
}

export function normalizeInvitationEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidInvitationEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeInvitationEmail(value));
}

export function getInvitationLastActivity(
  invitation: Pick<OwnerInvitationRecord, "acceptedAt" | "relancedAt" | "viewedAt" | "sentAt" | "updatedAt">,
) {
  return (
    invitation.acceptedAt ||
    invitation.relancedAt ||
    invitation.viewedAt ||
    invitation.sentAt ||
    invitation.updatedAt
  );
}
