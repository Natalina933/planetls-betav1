export type OwnerCrmConversation = {
  id: string;
  counterpart_profile_id?: string | null;
  owner_profile_id?: string | null;
  counterpart_name?: string | null;
  subject?: string | null;
  status?: string | null;
  source?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  created_at?: string | null;
  unread_count?: number;
};

export type OwnerCrmProfile = {
  id?: string | null;
  profileId?: string | null;
  fullName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  company_name?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type OwnerCrmAsset = {
  id: string;
  owner_profile_id?: string | null;
  label?: string | null;
  status?: string | null;
  amount?: number | null;
  commission_amount?: number | null;
  date?: string | null;
};

export type OwnerCrmRecord = {
  id: string;
  name: string;
  city: string;
  email?: string | null;
  phone?: string | null;
  relationshipStatus: "actif" | "a_relancer" | "nouveau" | "dormant";
  healthScore: number;
  stats: {
    logements: number;
    revenus: number;
    commissions: number;
    contrats: number;
    devis: number;
    documents: number;
    incidents: number;
    conversations: number;
    unread: number;
  };
  preferences: string[];
  conversations: OwnerCrmConversation[];
  timeline: Array<{ id: string; label: string; date: string | null; kind: string }>;
};

type BuildOwnerCrmInput = {
  conversations?: OwnerCrmConversation[];
  profiles?: OwnerCrmProfile[];
  housings?: OwnerCrmAsset[];
  quotes?: OwnerCrmAsset[];
  invoices?: OwnerCrmAsset[];
  contracts?: OwnerCrmAsset[];
  documents?: OwnerCrmAsset[];
  incidents?: OwnerCrmAsset[];
  preferencesByOwnerId?: Record<string, string[]>;
};

function getProfileId(profile: OwnerCrmProfile) {
  return profile.id || profile.profileId || null;
}

function getProfileName(profile: OwnerCrmProfile) {
  return (
    profile.fullName ||
    profile.company_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username ||
    "Proprietaire"
  );
}

function getConversationOwnerId(conversation: OwnerCrmConversation) {
  return conversation.owner_profile_id || conversation.counterpart_profile_id || null;
}

function sumAmount(items: OwnerCrmAsset[], field: "amount" | "commission_amount") {
  return items.reduce((sum, item) => sum + (typeof item[field] === "number" ? item[field] ?? 0 : 0), 0);
}

function getRelationshipStatus(conversations: OwnerCrmConversation[]): OwnerCrmRecord["relationshipStatus"] {
  if (conversations.length === 0) return "nouveau";
  const latest = conversations
    .map((conversation) => conversation.last_message_at || conversation.created_at)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  if (!latest) return "nouveau";
  const ageDays = (Date.now() - latest) / (24 * 60 * 60 * 1000);
  if (ageDays <= 3) return "actif";
  if (ageDays <= 14) return "a_relancer";
  return "dormant";
}

function computeHealthScore(input: {
  conversations: OwnerCrmConversation[];
  housings: OwnerCrmAsset[];
  quotes: OwnerCrmAsset[];
  invoices: OwnerCrmAsset[];
  contracts: OwnerCrmAsset[];
  documents: OwnerCrmAsset[];
  incidents: OwnerCrmAsset[];
}) {
  const signals = [
    input.conversations.length > 0,
    input.housings.length > 0,
    input.quotes.length > 0,
    input.invoices.length > 0,
    input.contracts.length > 0,
    input.documents.length > 0,
    input.incidents.length === 0,
  ];
  return Math.round((signals.filter(Boolean).length / signals.length) * 100);
}

function timelineFromAssets(ownerId: string, input: BuildOwnerCrmInput, conversations: OwnerCrmConversation[]) {
  const assets: Array<{ id: string; label: string; date: string | null; kind: string }> = [
    ...conversations.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      label: conversation.subject || conversation.last_message_preview || "Conversation proprietaire",
      date: conversation.last_message_at || conversation.created_at || null,
      kind: "conversation",
    })),
    ...(input.housings ?? [])
      .filter((item) => item.owner_profile_id === ownerId)
      .map((item) => ({ id: `housing-${item.id}`, label: item.label || "Logement rattache", date: item.date ?? null, kind: "logement" })),
    ...(input.quotes ?? [])
      .filter((item) => item.owner_profile_id === ownerId)
      .map((item) => ({ id: `quote-${item.id}`, label: item.label || "Devis", date: item.date ?? null, kind: "devis" })),
    ...(input.invoices ?? [])
      .filter((item) => item.owner_profile_id === ownerId)
      .map((item) => ({ id: `invoice-${item.id}`, label: item.label || "Facture", date: item.date ?? null, kind: "revenu" })),
    ...(input.incidents ?? [])
      .filter((item) => item.owner_profile_id === ownerId)
      .map((item) => ({ id: `incident-${item.id}`, label: item.label || "Incident", date: item.date ?? null, kind: "incident" })),
  ];

  return assets.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).slice(0, 12);
}

export function buildOwnerCrmRecords(input: BuildOwnerCrmInput): OwnerCrmRecord[] {
  const profiles = input.profiles ?? [];
  const conversations = input.conversations ?? [];
  const ownerIds = new Set<string>();
  profiles.forEach((profile) => {
    const profileId = getProfileId(profile);
    if (profileId) ownerIds.add(profileId);
  });
  conversations.forEach((conversation) => {
    const ownerId = getConversationOwnerId(conversation);
    if (ownerId) ownerIds.add(ownerId);
  });

  return Array.from(ownerIds)
    .map((ownerId) => {
      const profile = profiles.find((entry) => getProfileId(entry) === ownerId);
      const ownerConversations = conversations.filter((conversation) => getConversationOwnerId(conversation) === ownerId);
      const ownerHousings = (input.housings ?? []).filter((item) => item.owner_profile_id === ownerId);
      const ownerQuotes = (input.quotes ?? []).filter((item) => item.owner_profile_id === ownerId);
      const ownerInvoices = (input.invoices ?? []).filter((item) => item.owner_profile_id === ownerId);
      const ownerContracts = (input.contracts ?? []).filter((item) => item.owner_profile_id === ownerId);
      const ownerDocuments = (input.documents ?? []).filter((item) => item.owner_profile_id === ownerId);
      const ownerIncidents = (input.incidents ?? []).filter((item) => item.owner_profile_id === ownerId);
      const fallbackName = ownerConversations[0]?.counterpart_name || "Proprietaire";

      return {
        id: ownerId,
        name: profile ? getProfileName(profile) : fallbackName,
        city: profile?.city || "Ville a renseigner",
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
        relationshipStatus: getRelationshipStatus(ownerConversations),
        healthScore: computeHealthScore({
          conversations: ownerConversations,
          housings: ownerHousings,
          quotes: ownerQuotes,
          invoices: ownerInvoices,
          contracts: ownerContracts,
          documents: ownerDocuments,
          incidents: ownerIncidents,
        }),
        stats: {
          logements: ownerHousings.length,
          revenus: sumAmount(ownerInvoices, "amount"),
          commissions: sumAmount(ownerInvoices, "commission_amount"),
          contrats: ownerContracts.length,
          devis: ownerQuotes.length,
          documents: ownerDocuments.length,
          incidents: ownerIncidents.length,
          conversations: ownerConversations.length,
          unread: ownerConversations.reduce((sum, conversation) => sum + (conversation.unread_count ?? 0), 0),
        },
        preferences: input.preferencesByOwnerId?.[ownerId] ?? [],
        conversations: ownerConversations,
        timeline: timelineFromAssets(ownerId, input, ownerConversations),
      };
    })
    .sort((a, b) => b.healthScore - a.healthScore || a.name.localeCompare(b.name));
}
