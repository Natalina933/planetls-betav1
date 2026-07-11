import { normalizeMissionStatus, type MissionPriority, type MissionStatus } from "./missionStatus.ts";

export type MissionObjectChecklistItem = {
  id?: string;
  label?: string;
  done?: boolean;
};

export type MissionObjectProofLink = {
  id?: string;
  label?: string;
  url?: string | null;
  kind?: string;
  storage_bucket?: string;
  storage_path?: string;
  created_at?: string;
};

export type MissionObjectProfile = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  company_name?: string | null;
  city?: string | null;
  role?: string | null;
};

export type MissionObjectDetail = {
  mission: {
    id: string;
    title?: string | null;
    description?: string | null;
    status?: MissionStatus | string | null;
    priority?: MissionPriority | string | null;
    amount?: number | null;
    scheduled_start?: string | null;
    scheduled_end?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  participants?: {
    owner?: MissionObjectProfile | null;
    concierge?: MissionObjectProfile | null;
  };
  property?: {
    id?: string | number;
    nom_logement?: string | null;
    ville?: string | null;
    adresse?: string | null;
  } | null;
  events?: Array<{ id: string; event_type: string; created_at: string; payload?: Record<string, unknown> | null }>;
  conversations?: Array<{
    id: string;
    subject?: string | null;
    last_message_preview?: string | null;
    last_message_at?: string | null;
  }>;
  quotes?: Array<{ id: string; quote_number?: string | null; status?: string | null; total_amount?: number | null }>;
  invoices?: Array<{
    id: string;
    invoice_number?: string | null;
    status?: string | null;
    total_amount?: number | null;
    balance_amount?: number | null;
    due_date?: string | null;
  }>;
  provider_interventions?: Array<{
    id: string;
    provider_profile_id?: string | null;
    title?: string | null;
    status?: string | null;
    priority?: string | null;
    scheduled_start?: string | null;
    scheduled_end?: string | null;
    budget_amount?: number | null;
  }>;
  providers?: MissionObjectProfile[];
  evidence?: {
    proof_links?: MissionObjectProofLink[];
    checklist?: MissionObjectChecklistItem[];
    signature?: unknown;
  };
};

export type MissionObjectCenter = {
  status: MissionStatus;
  completionRate: number;
  checklistRate: number;
  planningLabel: "Planifiee" | "A planifier";
  counts: {
    checklistDone: number;
    checklistTotal: number;
    documents: number;
    photos: number;
    history: number;
    signatures: number;
    comments: number;
    intervenants: number;
  };
  documents: MissionObjectProofLink[];
  photos: MissionObjectProofLink[];
  checklist: Required<Pick<MissionObjectChecklistItem, "id" | "label" | "done">>[];
  signatures: Array<{ role: "owner" | "concierge" | "mission"; name: string; signed_at?: string | null }>;
  intervenants: Array<{ id: string; role: string; name: string; status?: string | null; city?: string | null }>;
  comments: Array<{ id: string; subject: string; preview: string; date?: string | null }>;
};

const PHOTO_KINDS = new Set(["photo", "image", "picture"]);
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function profileName(profile?: MissionObjectProfile | null) {
  if (!profile) return "";
  return (
    profile.company_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username ||
    ""
  );
}

function isPhotoProof(proof: MissionObjectProofLink) {
  const kind = proof.kind?.trim().toLowerCase();
  if (kind && PHOTO_KINDS.has(kind)) return true;
  const target = `${proof.url ?? ""} ${proof.storage_path ?? ""}`.toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => target.includes(extension));
}

function normalizeChecklistItem(item: MissionObjectChecklistItem, index: number) {
  return {
    id: item.id || `checklist_${index}`,
    label: item.label || `Point de controle ${index + 1}`,
    done: Boolean(item.done),
  };
}

function normalizeSignature(role: "owner" | "concierge" | "mission", value: unknown) {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) return null;
  return {
    role,
    name,
    signed_at: typeof value.signed_at === "string" ? value.signed_at : null,
  };
}

export function buildMissionObjectCenter(detail: MissionObjectDetail): MissionObjectCenter {
  const status = normalizeMissionStatus(detail.mission.status);
  const metadata = isRecord(detail.mission.metadata) ? detail.mission.metadata : {};
  const proofLinks = Array.isArray(detail.evidence?.proof_links) ? detail.evidence.proof_links : [];
  const checklist = (Array.isArray(detail.evidence?.checklist) ? detail.evidence.checklist : []).map(normalizeChecklistItem);
  const checklistDone = checklist.filter((item) => item.done).length;
  const checklistRate = checklist.length > 0 ? Math.round((checklistDone / checklist.length) * 100) : 0;
  const photos = proofLinks.filter(isPhotoProof);
  const documents = proofLinks.filter((proof) => !isPhotoProof(proof));
  const ownerSignature = normalizeSignature("owner", metadata.owner_signature);
  const conciergeSignature = normalizeSignature("concierge", metadata.concierge_signature);
  const missionSignature = normalizeSignature("mission", detail.evidence?.signature);
  const signatures = [ownerSignature, conciergeSignature, missionSignature].filter(
    (signature): signature is NonNullable<typeof signature> => Boolean(signature),
  );
  const comments = (detail.conversations ?? [])
    .filter((conversation) => conversation.last_message_preview || conversation.subject)
    .map((conversation) => ({
      id: conversation.id,
      subject: conversation.subject || "Conversation mission",
      preview: conversation.last_message_preview || "Aucun message recent.",
      date: conversation.last_message_at,
    }));
  const intervenants = [
    detail.participants?.owner
      ? { id: detail.participants.owner.id || "owner", role: "Proprietaire", name: profileName(detail.participants.owner), city: detail.participants.owner.city }
      : null,
    detail.participants?.concierge
      ? {
          id: detail.participants.concierge.id || "concierge",
          role: "Conciergerie",
          name: profileName(detail.participants.concierge),
          city: detail.participants.concierge.city,
        }
      : null,
    ...(detail.provider_interventions ?? []).map((intervention) => {
      const provider = (detail.providers ?? []).find((entry) => entry.id === intervention.provider_profile_id);
      return {
        id: intervention.id,
        role: "Prestataire",
        name: profileName(provider) || intervention.title || "Prestataire a assigner",
        status: intervention.status,
        city: provider?.city,
      };
    }),
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry?.name));
  const completionSignals = [
    ["validated", "completed", "closed"].includes(status),
    Boolean(detail.mission.scheduled_start),
    checklist.length > 0 && checklistDone === checklist.length,
    proofLinks.length > 0,
    signatures.length > 0,
  ];
  const completionRate = Math.round((completionSignals.filter(Boolean).length / completionSignals.length) * 100);

  return {
    status,
    completionRate,
    checklistRate,
    planningLabel: detail.mission.scheduled_start ? "Planifiee" : "A planifier",
    counts: {
      checklistDone,
      checklistTotal: checklist.length,
      documents: documents.length,
      photos: photos.length,
      history: detail.events?.length ?? 0,
      signatures: signatures.length,
      comments: comments.length,
      intervenants: intervenants.length,
    },
    documents,
    photos,
    checklist,
    signatures,
    intervenants,
    comments,
  };
}
