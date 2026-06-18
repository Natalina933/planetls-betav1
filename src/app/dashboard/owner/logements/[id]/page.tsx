"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  FiAlertTriangle,
  FiBox,
  FiCamera,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiFileText,
  FiHome,
  FiRotateCcw,
  FiSave,
  FiSend,
  FiBarChart2,
} from "react-icons/fi";
import {
  Bath,
  BedDouble,
  CigaretteOff,
  ClipboardList,
  Clock,
  DoorOpen,
  Flame,
  Hotel,
  House,
  HousePlus,
  KeyRound,
  LampFloor,
  MapPinHouse,
  PawPrint,
  Phone,
  Plus,
  Ruler,
  ShieldCheck,
  ShowerHead,
  Sofa,
  SunMedium,
  Trash2,
  TreePine,
  UserRound,
  UsersRound,
  Waves,
  Warehouse,
  Wifi,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import styles from "../../../concierge/logements/[id]/FicheLogement.module.scss";
import type { ConciergeHousing, HousingBathroomInfo, HousingRow } from "@/types/housing";
import {
  buildHousingMutationPayload,
  HOUSING_PLATFORM_OPTIONS,
  HOUSING_PROPERTY_TYPE_OPTIONS,
  normalizeHousingRow,
} from "@/types/housing";
import {
  HOUSING_EQUIPMENT_CATALOG,
  HOUSING_EQUIPMENT_LABELS,
} from "@/app/lib/housingEquipmentCatalog";
import { createStockItemId, type HousingStockBed } from "@/app/lib/housingStock";

type OwnerHousingTab = "synthese" | "infos" | "demandes" | "documents" | "stocks" | "planning" | "litiges";

const BED_TYPE_OPTIONS = [
  "Lit simple",
  "Lit double",
  "Lit queen",
  "Lit king",
  "Canapé-lit",
  "Lit superposé",
  "Lit bébé",
  "Matelas d'appoint",
] as const;

const MATTRESS_SIZE_OPTIONS = [
  "80x190",
  "90x190",
  "90x200",
  "120x190",
  "140x190",
  "140x200",
  "160x200",
  "180x200",
  "Bébé 60x120",
  "Bébé 70x140",
] as const;

const BATHROOM_TYPE_OPTIONS = [
  { value: "Douche", label: "Douche", icon: ShowerHead },
  { value: "Baignoire", label: "Baignoire", icon: Bath },
  { value: "Douche et baignoire", label: "Les deux", icon: Bath },
] as const;

const HOUSEKEEPING_CHECKLIST_ITEMS = [
  "Changer les draps",
  "Préparer les serviettes",
  "Vider les poubelles",
  "Contrôler la cuisine",
  "Contrôler les salles de bain",
  "Réassort consommables",
  "Vérifier les extérieurs",
  "Fermer fenêtres et volets",
] as const;

function countStockBeds(beds: HousingStockBed[]) {
  return beds.reduce((total, bed) => total + (Number(bed.quantity) || 0), 0);
}

function StairsIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M4 19h4v-4h4v-4h4V7h4" />
      <path d="M4 15h4" />
      <path d="M8 11h4" />
      <path d="M12 7h4" />
    </svg>
  );
}

function getPropertyTypeIcon(propertyType: string) {
  const normalized = normalizeText(propertyType);
  if (normalized.includes("appartement")) return LampFloor;
  if (normalized.includes("studio")) return Sofa;
  if (normalized.includes("loft")) return Warehouse;
  if (normalized.includes("chalet")) return TreePine;
  if (normalized.includes("villa")) return HousePlus;
  if (normalized.includes("residence")) return Hotel;
  if (normalized.includes("maison")) return House;
  return DoorOpen;
}

function isBedroomStockRow(room: string) {
  return /^chambre( principale| \d+)?$/i.test(room.trim());
}

function createBedroomStockRow(index: number): HousingStockBed {
  return {
    id: createStockItemId("bedroom"),
    room: `Chambre ${index + 1}`,
    type: "Lit double",
    quantity: 1,
    mattressSize: "140x190",
    linenKit: "Drap housse + housse de couette + 2 taies",
    notes: "",
  };
}

function syncBedsWithBedroomCount(beds: HousingStockBed[], bedroomCount: number | null) {
  const targetCount = bedroomCount ?? 0;
  if (targetCount <= 0) return beds;

  const bedroomRows = beds.filter((bed) => isBedroomStockRow(bed.room));
  const otherRows = beds.filter((bed) => !isBedroomStockRow(bed.room));
  const syncedBedroomRows = Array.from({ length: targetCount }, (_, index) => ({
    ...(bedroomRows[index] ?? createBedroomStockRow(index)),
    room: `Chambre ${index + 1}`,
  }));

  return [...syncedBedroomRows, ...otherRows];
}

type MissionRow = {
  id: string;
  property_id: string | null;
  concierge_profile_id?: string | null;
  concierge_name?: string | null;
  concierge_avatar_url?: string | null;
  title: string;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
};

type HousingServiceRequestRow = {
  id: string;
  title: string;
  request_type?: string | null;
  status?: string | null;
  workflow_status?: string | null;
  request_workflow_status?: string | null;
  quote_workflow_status?: string | null;
  mission_workflow_status?: string | null;
  property_name?: string | null;
  property_housing_id?: string | null;
  city?: string | null;
  requested_services?: string[] | null;
  created_at?: string | null;
  selected_concierge_name?: string | null;
  recipients?: Array<{
    id: string;
    concierge_name?: string | null;
    status?: string | null;
    quote_id?: string | null;
    quote_status?: string | null;
  }>;
};

type InspectionSummary = {
  id: string;
  status: string;
};

type InspectionChecklistItem = {
  id: string;
  item_label: string;
  item_status: "ok" | "issue" | "na";
};

type InspectionMediaItem = {
  id: string;
  media_type: "photo" | "video";
  storage_path: string;
  created_at: string;
};

type LinkedConciergeProfile = {
  displayName: string;
  avatarUrl: string | null;
};

const tabs: Array<{ id: OwnerHousingTab; label: string; icon: React.ComponentType }> = [
  { id: "synthese", label: "Synthèse", icon: FiBarChart2 },
  { id: "infos", label: "Informations", icon: FiHome },
  { id: "demandes", label: "Demandes", icon: FiSend },
  { id: "documents", label: "Documents", icon: FiFileText },
  { id: "stocks", label: "Stocks et équipements", icon: FiBox },
  { id: "planning", label: "Planning", icon: FiCalendar },
  { id: "litiges", label: "Litige", icon: FiAlertTriangle },
];

const KNOWN_EQUIPMENT_LABELS = new Set(HOUSING_EQUIPMENT_LABELS);

function makeClientId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non planifié";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

function getMissionTime(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .trim();
}

function normalizeChecklistLine(value: string) {
  return normalizeText(value.replace(/^[-*•]\s*/, ""));
}

function isChecklistTaskChecked(checklist: string | undefined, task: string) {
  const normalizedTask = normalizeChecklistLine(task);
  return (checklist ?? "")
    .split("\n")
    .some((line) => normalizeChecklistLine(line) === normalizedTask);
}

function toggleChecklistTask(checklist: string | undefined, task: string, checked: boolean) {
  const normalizedTask = normalizeChecklistLine(task);
  const lines = (checklist ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const withoutTask = lines.filter((line) => normalizeChecklistLine(line) !== normalizedTask);
  return checked ? [...withoutTask, `- ${task}`].join("\n") : withoutTask.join("\n");
}

function getCustomChecklistTasks(checklist: string | undefined) {
  const defaultTasks = new Set(HOUSEKEEPING_CHECKLIST_ITEMS.map(normalizeChecklistLine));
  return (checklist ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, "").trim())
    .filter((line) => line && !defaultTasks.has(normalizeChecklistLine(line)));
}

function formatHousingStatus(value: string | null | undefined) {
  const clean = value?.trim();
  if (!clean) return "À préciser";

  const normalized = normalizeText(clean);
  if (normalized === "pret" || normalized === "prets" || normalized.startsWith("pret ")) return "Prêt";
  if (normalized.includes("menage")) return clean.replace(/menage/gi, "ménage");
  if (normalized.includes("arrivee")) return clean.replace(/arrivee/gi, "arrivée");
  if (normalized.includes("depart")) return clean.replace(/depart/gi, "départ");
  return clean;
}

function formatRequestStatus(value: string | null | undefined) {
  const normalized = normalizeText(value ?? "");
  if (!normalized || normalized === "new" || normalized === "draft") return "Brouillon";
  if (normalized === "sent") return "Envoyée";
  if (normalized === "viewed") return "Consultée";
  if (normalized === "in discussion" || normalized === "quote sent" || normalized === "quoted") return "En discussion";
  if (normalized === "accepted" || normalized === "archived") return "Acceptée";
  if (normalized === "declined") return "Refusée";
  if (normalized === "expired") return "Expirée";
  return value?.trim() || "À préciser";
}

function formatRequestType(value: string | null | undefined) {
  if (value === "renfort") return "Renfort";
  if (value === "durable") return "Collaboration durable";
  return "Besoin ponctuel";
}

function getRequestQuoteCount(request: HousingServiceRequestRow) {
  return (request.recipients ?? []).filter((recipient) => Boolean(recipient.quote_id) || recipient.quote_status === "quoted").length;
}

function getRequestConciergeLabel(request: HousingServiceRequestRow) {
  if (request.selected_concierge_name?.trim()) return request.selected_concierge_name.trim();
  const names = Array.from(
    new Set((request.recipients ?? []).map((recipient) => recipient.concierge_name?.trim()).filter(Boolean)),
  );
  if (names.length === 0) return "Aucune conciergerie contactée";
  return `${names.length} conciergerie${names.length > 1 ? "s" : ""} contactée${names.length > 1 ? "s" : ""}`;
}

function cleanProfileString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getProfileFullName(profile: Record<string, unknown>) {
  return (
    [cleanProfileString(profile.first_name), cleanProfileString(profile.last_name)].filter(Boolean).join(" ") ||
    cleanProfileString(profile.company_name) ||
    cleanProfileString(profile.username)
  );
}

function mergeOwnerProfileFallback(housing: ConciergeHousing, profile: unknown): ConciergeHousing {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return housing;

  const record = profile as Record<string, unknown>;
  const profileCity = cleanProfileString(record.city);
  const profileAddress = [cleanProfileString(record.street_address), profileCity].filter(Boolean).join(", ");

  return {
    ...housing,
    owner: {
      ...housing.owner,
      fullName: housing.owner.fullName || getProfileFullName(record),
      email: housing.owner.email || cleanProfileString(record.email),
      phone: housing.owner.phone || cleanProfileString(record.phone),
      address: housing.owner.address || profileAddress,
      city: housing.owner.city || profileCity,
      companyName: housing.owner.companyName || cleanProfileString(record.company_name),
    },
  };
}

function toggleStringInList(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function getHousingCapacityValue(housing: ConciergeHousing) {
  return housing.characteristics.guestCapacity ?? housing.characteristics.capacite ?? null;
}

function formatCapacityLabel(value: number | null | undefined, fallback = "Ã€ complÃ©ter") {
  if (value == null) return fallback;
  return `${value} personne${value > 1 ? "s" : ""}`;
}

function validateOwnerHousingDraft(logement: ConciergeHousing | null) {
  if (!logement) return "Logement introuvable.";
  if (!(logement.nom_logement ?? "").trim()) return "Le nom du logement est obligatoire.";
  if (!(logement.locationInfo.addressLine1 ?? "").trim()) return "L'adresse du logement est obligatoire.";
  if (!(logement.locationInfo.city ?? "").trim()) return "La ville du logement est obligatoire.";
  if (!(logement.characteristics.propertyType ?? "").trim()) return "Le type de bien est obligatoire.";
  if (!(logement.owner.fullName ?? "").trim()) return "Le nom du propriétaire est obligatoire.";
  if (logement.owner.email && !logement.owner.email.includes("@")) {
    return "L'email propriétaire semble invalide.";
  }

  const invalidMetric = [
    logement.characteristics.surfaceSqm,
    logement.characteristics.bedroomCount,
    logement.characteristics.bathroomCount,
    logement.characteristics.bedCount,
    logement.characteristics.guestCapacity,
    logement.characteristics.keyCount,
  ].some((value) => value !== null && value !== undefined && value < 0);

  return invalidMetric ? "Certaines valeurs numériques sont invalides." : null;
}

export default function OwnerHousingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [logement, setLogement] = useState<ConciergeHousing | null>(null);
  const [draft, setDraft] = useState<ConciergeHousing | null>(null);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [serviceRequests, setServiceRequests] = useState<HousingServiceRequestRow[]>([]);
  const [linkedConciergeProfile, setLinkedConciergeProfile] = useState<LinkedConciergeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<OwnerHousingTab>("synthese");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [newHousekeepingTask, setNewHousekeepingTask] = useState("");

  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<string | null>(null);
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionChecklistItem[]>([]);
  const [inspectionMedia, setInspectionMedia] = useState<InspectionMediaItem[]>([]);
  const [disputeType, setDisputeType] = useState<"damage" | "missing_item" | "cleaning" | "other">("damage");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedChecklistItemIds, setSelectedChecklistItemIds] = useState<string[]>([]);
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const loadInspectionDetails = useCallback(async (nextInspectionId: string) => {
    const detailRes = await fetch(`/api/inspections/${nextInspectionId}`, { cache: "no-store" });
    if (!detailRes.ok) {
      throw new Error("Impossible de charger l'inspection.");
    }

    const payload = (await detailRes.json()) as {
      inspection?: { id?: string; status?: string };
      checklist?: InspectionChecklistItem[];
      media?: InspectionMediaItem[];
    };

    const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
    const media = Array.isArray(payload.media) ? payload.media : [];
    setInspectionId(nextInspectionId);
    setInspectionStatus(payload.inspection?.status ?? null);
    setInspectionChecklist(checklist);
    setInspectionMedia(media);
    setSelectedChecklistItemIds(checklist.filter((item) => item.item_status === "issue").map((item) => item.id));
    setSelectedMediaIds(media.map((item) => item.id));
  }, []);

  const loadLatestInspection = useCallback(async (housingId: string) => {
    const inspectionsRes = await fetch(`/api/inspections?housingId=${housingId}&limit=1`, {
      cache: "no-store",
    });

    if (!inspectionsRes.ok) return;

    const inspections = (await inspectionsRes.json()) as InspectionSummary[];
    const latest = Array.isArray(inspections) && inspections.length > 0 ? inspections[0] : null;

    if (!latest?.id) {
      setInspectionId(null);
      setInspectionStatus(null);
      setInspectionChecklist([]);
      setInspectionMedia([]);
      setSelectedMediaIds([]);
      setSelectedChecklistItemIds([]);
      return;
    }

    await loadInspectionDetails(latest.id);
  }, [loadInspectionDetails]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [housingResponse, missionsResponse, requestsResponse, profileResponse] = await Promise.all([
          fetch(`/api/housing/${id}`, { cache: "no-store" }),
          fetch("/api/missions?scope=owner&limit=200", { cache: "no-store" }),
          fetch("/api/service-requests?limit=100", { cache: "no-store" }),
          fetch("/api/profiles/current", { cache: "no-store" }).catch(() => null),
        ]);

        const housingPayload = await housingResponse.json();
        const missionsPayload = await missionsResponse.json();
        const requestsPayload = await requestsResponse.json().catch(() => ({}));
        const profilePayload =
          profileResponse && profileResponse.ok ? await profileResponse.json().catch(() => null) : null;

        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Logement introuvable");
        }

        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger le planning lié");
        }

        const normalized = mergeOwnerProfileFallback(normalizeHousingRow(housingPayload as HousingRow), profilePayload);
        setLogement(normalized);
        setDraft(normalized);
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setServiceRequests(requestsResponse.ok && Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
        await loadLatestInspection(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id, loadLatestInspection]);

  useEffect(() => {
    if (disputeDescription.trim()) return;
    const issueItems = inspectionChecklist.filter((item) => item.item_status === "issue");
    const details = [
      "Litige ouvert suite à l'inspection de départ voyageur.",
      issueItems.length > 0 ? `Anomalies constatées: ${issueItems.map((item) => item.item_label).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (details) {
      setDisputeDescription(details);
    }
  }, [inspectionChecklist, disputeDescription]);

  useEffect(() => {
    if (!disputeError && !disputeSuccess && !success) return;
    const timeout = window.setTimeout(() => {
      setDisputeError(null);
      setDisputeSuccess(null);
      setSuccess("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [disputeError, disputeSuccess, success]);

  useEffect(() => {
    const conciergeProfileId = draft?.owner.managerProfileId;
    if (!conciergeProfileId) {
      setLinkedConciergeProfile(null);
      return;
    }

    let cancelled = false;

    async function loadLinkedConciergeProfile() {
      try {
        const response = await fetch(`/api/profiles/public/${conciergeProfileId}`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload?.profile) {
          if (!cancelled) setLinkedConciergeProfile(null);
          return;
        }

        if (!cancelled) {
          setLinkedConciergeProfile({
            displayName:
              typeof payload.profile.display_name === "string" && payload.profile.display_name.trim()
                ? payload.profile.display_name.trim()
                : "Concierge",
            avatarUrl:
              typeof payload.profile.avatar_url === "string" && payload.profile.avatar_url.trim()
                ? payload.profile.avatar_url.trim()
                : typeof payload.profile.image === "string" && payload.profile.image.trim()
                  ? payload.profile.image.trim()
                  : null,
          });
        }
      } catch {
        if (!cancelled) setLinkedConciergeProfile(null);
      }
    }

    void loadLinkedConciergeProfile();

    return () => {
      cancelled = true;
    };
  }, [draft?.owner.managerProfileId]);

  const relatedMissions = useMemo(
    () => missions.filter((mission) => String(mission.property_id ?? "") === String(id)),
    [id, missions],
  );
  const relatedServiceRequests = useMemo(() => {
    const housingName = normalizeText(draft?.nom_logement ?? "");
    return serviceRequests.filter((request) => {
      if (String(request.property_housing_id ?? "") === String(id)) return true;
      return Boolean(housingName && normalizeText(request.property_name ?? "") === housingName);
    });
  }, [draft?.nom_logement, id, serviceRequests]);
  const requestStats = useMemo(() => {
    const active = relatedServiceRequests.filter((request) =>
      ["Brouillon", "Envoyée", "Consultée", "En discussion"].includes(
        formatRequestStatus(request.request_workflow_status ?? request.workflow_status ?? request.status),
      ),
    ).length;
    const accepted = relatedServiceRequests.filter(
      (request) => formatRequestStatus(request.request_workflow_status ?? request.workflow_status ?? request.status) === "Acceptée",
    ).length;
    const quotes = relatedServiceRequests.reduce((total, request) => total + getRequestQuoteCount(request), 0);
    return { active, accepted, quotes };
  }, [relatedServiceRequests]);
  const acceptedRequestConciergeName = useMemo(() => {
    const acceptedRequest = relatedServiceRequests.find((request) => request.selected_concierge_name?.trim());
    return acceptedRequest?.selected_concierge_name?.trim() || null;
  }, [relatedServiceRequests]);
  const primaryHousingRequest = useMemo(
    () =>
      relatedServiceRequests.find((request) => request.selected_concierge_name?.trim()) ??
      relatedServiceRequests.find((request) => getRequestQuoteCount(request) > 0) ??
      relatedServiceRequests[0] ??
      null,
    [relatedServiceRequests],
  );
  const quotedHousingRequest = useMemo(
    () => relatedServiceRequests.find((request) => getRequestQuoteCount(request) > 0) ?? null,
    [relatedServiceRequests],
  );

  const planningEvents = useMemo(() => draft?.timeline ?? [], [draft]);
  const documents = useMemo(() => draft?.documentsList ?? [], [draft]);
  const equipments = useMemo(() => draft?.characteristics.amenities ?? [], [draft]);
  const customEquipments = useMemo(
    () => equipments.filter((item) => !KNOWN_EQUIPMENT_LABELS.has(item)),
    [equipments],
  );
  const housingPhotos = useMemo(
    () => draft?.characteristics.photos ?? (draft?.photo_principale ? [draft.photo_principale] : []),
    [draft],
  );
  const activeGalleryPhoto = housingPhotos[galleryIndex] ?? housingPhotos[0] ?? null;
  const issueChecklistItems = useMemo(
    () => inspectionChecklist.filter((item) => item.item_status === "issue"),
    [inspectionChecklist],
  );

  const buildMediaPreviewUrl = (storagePath: string) => {
    if (!supabasePublicUrl || !storagePath) return null;
    return `${supabasePublicUrl}/storage/v1/object/public/inspection-evidence/${storagePath}`;
  };

  function applyDraftUpdate(updater: (current: ConciergeHousing) => ConciergeHousing) {
    setDraft((current) => (current ? updater(current) : current));
  }

  function updateCharacteristic<K extends keyof ConciergeHousing["characteristics"]>(
    field: K,
    value: ConciergeHousing["characteristics"][K],
  ) {
    applyDraftUpdate((current) => ({
      ...current,
      characteristics: {
        ...current.characteristics,
        [field]: value,
      },
    }));
  }

  function updateStockBed(index: number, field: keyof HousingStockBed, value: string) {
    applyDraftUpdate((current) => {
      const beds = current.stockManagement.beds.map((bed, bedIndex) =>
          bedIndex === index
            ? {
                ...bed,
                [field]: field === "quantity" ? Number(value) || 0 : value,
              }
            : bed,
      );

      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          bedCount: countStockBeds(beds),
        },
        stockManagement: {
          ...current.stockManagement,
          beds,
        },
      };
    });
  }

  function addStockBed() {
    applyDraftUpdate((current) => {
      const beds = [
        ...current.stockManagement.beds,
        {
          id: createStockItemId("bed"),
          room:
            current.characteristics.bedroomCount && current.characteristics.bedroomCount > 1
              ? `Chambre ${current.stockManagement.beds.length + 1}`
              : "Chambre principale",
          type: "Lit double",
          quantity: 1,
          mattressSize: "140x190",
          linenKit: "Drap housse + housse de couette + 2 taies",
          notes: "",
        },
      ];

      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          bedCount: countStockBeds(beds),
        },
        stockManagement: {
          ...current.stockManagement,
          beds,
        },
      };
    });
  }

  function removeStockBed(index: number) {
    applyDraftUpdate((current) => {
      const beds = current.stockManagement.beds.filter((_, bedIndex) => bedIndex !== index);

      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          bedCount: countStockBeds(beds),
        },
        stockManagement: {
          ...current.stockManagement,
          beds,
        },
      };
    });
  }

  function updateBathroom(index: number, field: keyof HousingBathroomInfo, value: string) {
    applyDraftUpdate((current) => {
      const bathrooms = current.characteristics.bathrooms.map((bathroom, bathroomIndex) =>
        bathroomIndex === index
          ? {
              ...bathroom,
              [field]: value,
            }
          : bathroom,
      );

      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          bathrooms,
          bathroomCount: bathrooms.length,
          bathroomType: bathrooms.length === 1 ? bathrooms[0]?.type : "",
          bathroomNotes: bathrooms.length === 1 ? bathrooms[0]?.notes : "",
        },
      };
    });
  }

  function addBathroom() {
    applyDraftUpdate((current) => {
      const bathrooms = [
        ...current.characteristics.bathrooms,
        {
          id: createStockItemId("bathroom"),
          name: `Salle de bain ${current.characteristics.bathrooms.length + 1}`,
          type: "Douche",
          notes: "",
        },
      ];

      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          bathrooms,
          bathroomCount: bathrooms.length,
          bathroomType: bathrooms.length === 1 ? bathrooms[0].type : "",
          bathroomNotes: bathrooms.length === 1 ? bathrooms[0].notes : "",
        },
      };
    });
  }

  function removeBathroom(index: number) {
    applyDraftUpdate((current) => {
      const bathrooms = current.characteristics.bathrooms.filter((_, bathroomIndex) => bathroomIndex !== index);

      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          bathrooms,
          bathroomCount: bathrooms.length,
          bathroomType: bathrooms.length === 1 ? bathrooms[0]?.type : "",
          bathroomNotes: bathrooms.length === 1 ? bathrooms[0]?.notes : "",
        },
      };
    });
  }

  function togglePlatformSelection(platform: string, checked: boolean) {
    applyDraftUpdate((current) => {
      const currentPlatforms = current.characteristics.platforms?.length
        ? current.characteristics.platforms
        : current.plateforme
          ? [current.plateforme]
          : [];
      const platforms = checked
        ? Array.from(new Set([...currentPlatforms, platform]))
        : currentPlatforms.filter((item) => item !== platform);

      return {
        ...current,
        plateforme: platforms[0] ?? "",
        characteristics: {
          ...current.characteristics,
          platforms,
        },
      };
    });
  }

  function addHousekeepingTask() {
    const task = newHousekeepingTask.trim();
    if (!task) return;

    applyDraftUpdate((current) => ({
      ...current,
      services: {
        ...current.services,
        checklist: toggleChecklistTask(current.services.checklist, task, true),
      },
    }));
    setNewHousekeepingTask("");
  }

  function toggleEquipment(equipment: string) {
    if (!editing) return;

    applyDraftUpdate((current) => {
      const amenities = toggleStringInList(current.characteristics.amenities ?? [], equipment);
      return {
        ...current,
        characteristics: {
          ...current.characteristics,
          amenities,
          equipements: amenities,
        },
      };
    });
  }

  useEffect(() => {
    setGalleryIndex((current) => {
      if (housingPhotos.length === 0) return 0;
      return Math.min(current, housingPhotos.length - 1);
    });
  }, [housingPhotos.length]);

  function moveGallery(direction: -1 | 1) {
    if (housingPhotos.length <= 1) return;
    setGalleryIndex((current) => (current + direction + housingPhotos.length) % housingPhotos.length);
  }

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tabs.some((item) => item.id === tab)) {
      setActiveTab(tab as OwnerHousingTab);
    }
  }, [searchParams]);

  async function uploadHousingPhotos(files: FileList | null, options?: { setAsProfile?: boolean }) {
    if (!files || files.length === 0 || !draft) return;
    const filesToUpload = options?.setAsProfile ? Array.from(files).slice(0, 1) : Array.from(files);

    try {
      setPhotoUploading(true);
      setError("");

      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("housingId", String(id));

        const response = await fetch("/api/housing/photos", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || typeof payload?.url !== "string") {
          throw new Error(typeof payload?.error === "string" ? payload.error : "Upload photo impossible.");
        }

        uploadedUrls.push(payload.url);
      }

      const currentPhotos = draft.characteristics.photos ?? [];
      const nextPhotos = options?.setAsProfile
        ? [...uploadedUrls, ...currentPhotos.filter((photo) => !uploadedUrls.includes(photo))]
        : [...currentPhotos, ...uploadedUrls];
      const nextPrimary = options?.setAsProfile
        ? uploadedUrls[0] || draft.photo_principale
        : draft.photo_principale || nextPhotos[0] || null;
      const nextDraft: ConciergeHousing = {
        ...draft,
        photo_principale: nextPrimary,
        characteristics: {
          ...draft.characteristics,
          photos: nextPhotos,
        },
      };

      setDraft(nextDraft);

      const saveResponse = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHousingMutationPayload(nextDraft)),
      });
      const savePayload = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) {
        throw new Error(
          typeof savePayload?.error === "string" ? savePayload.error : "Photo ajoutée, mais sauvegarde impossible.",
        );
      }

      const normalized = normalizeHousingRow(savePayload as HousingRow);
      setLogement(normalized);
      setDraft(normalized);
      setSuccess("Galerie mise à jour.");

      if (options?.setAsProfile) {
        setGalleryIndex(0);
      } else if (uploadedUrls.length > 0) {
        setGalleryIndex(housingPhotos.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload des photos.");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function setPrimaryHousingPhoto(targetUrl: string) {
    if (!draft) return;

    const currentPhotos = draft.characteristics.photos ?? [];
    const nextPhotos = currentPhotos.includes(targetUrl) ? currentPhotos : [...currentPhotos, targetUrl];
    const nextDraft: ConciergeHousing = {
      ...draft,
      photo_principale: targetUrl,
      characteristics: {
        ...draft.characteristics,
        photos: nextPhotos,
      },
    };

    setDraft(nextDraft);

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHousingMutationPayload(nextDraft)),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Mise à jour photo impossible.");
      }

      const normalized = normalizeHousingRow(payload as HousingRow);
      setLogement(normalized);
      setDraft(normalized);
      setSuccess("Photo profil mise à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour photo impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function clearPrimaryHousingPhoto() {
    if (!draft) return;

    const nextDraft: ConciergeHousing = {
      ...draft,
      photo_principale: null,
      characteristics: {
        ...draft.characteristics,
        photos: draft.characteristics.photos ?? [],
      },
    };

    setDraft(nextDraft);

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHousingMutationPayload(nextDraft)),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Retrait photo profil impossible.");
      }

      const normalized = normalizeHousingRow(payload as HousingRow);
      setLogement(normalized);
      setDraft(normalized);
      setSuccess("Photo profil retirée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retrait photo profil impossible.");
    } finally {
      setSaving(false);
    }
  }

  function addDraftDocument() {
    applyDraftUpdate((current) => ({
      ...current,
      documentsList: [
        ...current.documentsList,
        {
          id: makeClientId("doc"),
          name: "",
          type: "other",
          url: "",
          uploadedAt: new Date().toISOString(),
          status: "draft",
        },
      ],
    }));
  }

  function updateDraftDocument(index: number, field: "name" | "type" | "url", value: string) {
    applyDraftUpdate((current) => ({
      ...current,
      documentsList: current.documentsList.map((doc, itemIndex) =>
        itemIndex === index ? { ...doc, [field]: value } : doc,
      ),
    }));
  }

  function removeDraftDocument(index: number) {
    applyDraftUpdate((current) => ({
      ...current,
      documentsList: current.documentsList.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addPlanningEvent() {
    applyDraftUpdate((current) => ({
      ...current,
      timeline: [
        ...current.timeline,
        {
          id: makeClientId("timeline"),
          title: "",
          description: "",
          date: new Date().toISOString(),
          type: "note",
          status: "planned",
          actor: "Propriétaire",
          source: "owner-dashboard",
        },
      ],
    }));
  }

  function updatePlanningEvent(index: number, field: "title" | "description" | "date", value: string) {
    applyDraftUpdate((current) => ({
      ...current,
      timeline: current.timeline.map((event, itemIndex) =>
        itemIndex === index ? { ...event, [field]: value } : event,
      ),
    }));
  }

  function removePlanningEvent(index: number) {
    applyDraftUpdate((current) => ({
      ...current,
      timeline: current.timeline.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveHousingChanges() {
    const validationError = validateOwnerHousingDraft(draft);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    if (!draft) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/housing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHousingMutationPayload(draft)),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Mise à jour impossible.");
      }

      const normalized = normalizeHousingRow(payload as HousingRow);
      setLogement(normalized);
      setDraft(normalized);
      setEditing(false);
      setSuccess("Informations du logement mises à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdition() {
    setDraft(logement);
    setEditing(false);
    setError("");
    setSuccess("");
  }

  async function openDisputeFromInspection() {
    if (!inspectionId) {
      setDisputeError("Aucune inspection disponible pour ce logement.");
      return;
    }

    if (selectedMediaIds.length === 0 && selectedChecklistItemIds.length === 0) {
      setDisputeError("Sélectionnez au moins une preuve (média ou checklist).");
      return;
    }

    try {
      setDisputeBusy(true);
      setDisputeError(null);
      setDisputeSuccess(null);

      const amountValue = estimatedAmount.trim().length > 0 ? Number(estimatedAmount) : null;
      if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) {
        throw new Error("Montant estimé invalide.");
      }

      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionId,
          disputeType,
          title: `Litige - ${draft?.nom_logement || "Logement"}`,
          description: disputeDescription.trim() || null,
          estimatedAmount: amountValue,
          currency: "EUR",
          evidence: {
            mediaIds: selectedMediaIds,
            checklistItemIds: selectedChecklistItemIds,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Ouverture litige impossible.");
      }

      await loadInspectionDetails(inspectionId);
      setDisputeSuccess("Litige ouvert avec succès.");
    } catch (err) {
      setDisputeError(err instanceof Error ? err.message : "Erreur ouverture litige.");
    } finally {
      setDisputeBusy(false);
    }
  }

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error && !draft) return <div className={styles.error}>{error}</div>;
  if (!draft) return <div className={styles.error}>Erreur</div>;

  const planningCount = planningEvents.length;
  const equipmentCount = equipments.length;
  const statusLabel = formatHousingStatus(draft.statut);
  const selectedPlatforms = draft.characteristics.platforms?.length
    ? draft.characteristics.platforms
    : draft.plateforme
      ? [draft.plateforme]
      : [];
  const PropertyTypeIcon = getPropertyTypeIcon(draft.characteristics.propertyType);
  const customHousekeepingTasks = getCustomChecklistTasks(draft.services.checklist);
  const housekeepingTasks = [...HOUSEKEEPING_CHECKLIST_ITEMS, ...customHousekeepingTasks];
  const housekeepingCheckedCount = housekeepingTasks.filter((task) =>
    isChecklistTaskChecked(draft.services.checklist, task),
  ).length;
  const missionWithConcierge = relatedMissions.find((mission) => mission.concierge_profile_id);
  const upcomingMission =
    [...relatedMissions]
      .filter((mission) => getMissionTime(mission.scheduled_start) >= Date.now())
      .sort((first, second) => getMissionTime(first.scheduled_start) - getMissionTime(second.scheduled_start))[0] ??
    null;
  const conciergeDisplay = {
    name:
      missionWithConcierge?.concierge_name ||
      (draft.owner.managerProfileId ? "Concierge du devis signé" : "Concierge à confirmer"),
    avatarUrl: missionWithConcierge?.concierge_avatar_url ?? null,
    subtitle: missionWithConcierge
      ? upcomingMission
        ? `Prochaine mission : ${formatDate(upcomingMission.scheduled_start)}`
        : "Première mission à planifier"
      : draft.owner.managerProfileId
        ? "Concierge rattaché au devis signé"
        : "Aucune mission concierge rattachée pour le moment",
  };
  const resolvedConciergeName =
    missionWithConcierge?.concierge_name ||
    acceptedRequestConciergeName ||
    linkedConciergeProfile?.displayName ||
    conciergeDisplay.name;
  const resolvedConciergeAvatarUrl =
    missionWithConcierge?.concierge_avatar_url ?? linkedConciergeProfile?.avatarUrl ?? conciergeDisplay.avatarUrl;
  const resolvedConciergeSubtitle = missionWithConcierge
    ? conciergeDisplay.subtitle
    : acceptedRequestConciergeName || linkedConciergeProfile?.displayName
      ? "Concierge accepté pour ce logement"
      : conciergeDisplay.subtitle;
  const conciergeRelationshipLabel = missionWithConcierge
    ? "Mission planifiée"
    : acceptedRequestConciergeName || linkedConciergeProfile?.displayName
      ? "Conciergerie confirmée"
      : relatedServiceRequests.length > 0
        ? "Rattachement en cours"
        : "Aucune conciergerie liée";
  const conciergeActionLabel = missionWithConcierge
    ? "Suivre la conciergerie et ses demandes"
    : acceptedRequestConciergeName || linkedConciergeProfile?.displayName
      ? "Voir la conciergerie et les demandes liées"
      : relatedServiceRequests.length > 0
        ? "Relancer ou finaliser le rattachement"
        : "Créer une demande pour trouver une conciergerie";
  const conciergeInsights = [
    `${relatedServiceRequests.length} demande${relatedServiceRequests.length > 1 ? "s" : ""}`,
    `${requestStats.quotes} devis`,
    `${requestStats.accepted} validation${requestStats.accepted > 1 ? "s" : ""}`,
  ];
  const sharedOwnerContact = [
    { label: "Nom partagé", value: draft.owner.fullName || "À compléter", icon: UserRound },
    { label: "Téléphone", value: draft.owner.phone || draft.owner.secondaryPhone || "À compléter", icon: Phone },
    { label: "Adresse", value: draft.owner.address || "À compléter", icon: MapPinHouse },
  ];
  const priorityFacts = [
    {
      label: "Adresse",
      value: [draft.locationInfo.addressLine1, draft.locationInfo.postalCode, draft.locationInfo.city]
        .filter(Boolean)
        .join(", ") || "À compléter",
      icon: MapPinHouse,
    },
    { label: "Accès", value: draft.locationInfo.accessCode || "À compléter", icon: KeyRound },
    { label: "Wi-Fi", value: draft.characteristics.wifiInfo || "À compléter", icon: Wifi },
    { label: "Clés", value: draft.characteristics.keyCount != null ? `${draft.characteristics.keyCount}` : "À compléter", icon: KeyRound },
  ];
  const housingCapacity = getHousingCapacityValue(draft);
  const housingFacts = [
    { label: "Type", value: draft.characteristics.propertyType || "À compléter", icon: PropertyTypeIcon },
    { label: "Capacité maximale", value: formatCapacityLabel(housingCapacity), icon: UsersRound },
    { label: "Chambres", value: draft.characteristics.bedroomCount != null ? `${draft.characteristics.bedroomCount}` : "À compléter", icon: DoorOpen },
    { label: "Lits", value: draft.characteristics.bedCount != null ? `${draft.characteristics.bedCount}` : "À compléter", icon: BedDouble },
  ];
  const housingMetrics = [
    {
      label: "Surface",
      icon: Ruler,
      value: draft.characteristics.surfaceSqm ?? "",
      suffix: "m²",
      field: "surfaceSqm" as const,
    },
    {
      label: "Capacité maximale",
      icon: UsersRound,
      value: housingCapacity ?? "",
      field: "guestCapacity" as const,
    },
    {
      label: "Chambres",
      icon: DoorOpen,
      value: draft.characteristics.bedroomCount ?? "",
      field: "bedroomCount" as const,
    },
    {
      label: "Clés",
      icon: KeyRound,
      value: draft.characteristics.keyCount ?? "",
      field: "keyCount" as const,
    },
  ];
  const fieldChecks: Array<{
    field: "terrace" | "stairs" | "pool" | "petsAllowed" | "nonSmoking" | "barbecue";
    label: string;
    icon: ComponentType<{ size?: number; className?: string }>;
  }> = [
    { field: "terrace", label: "Terrasse", icon: SunMedium },
    { field: "stairs", label: "Escaliers", icon: StairsIcon },
    { field: "pool", label: "Piscine", icon: Waves },
    { field: "petsAllowed", label: "Animaux acceptés", icon: PawPrint },
    { field: "nonSmoking", label: "Non fumeur", icon: CigaretteOff },
    { field: "barbecue", label: "Barbecue", icon: Flame },
  ];
  const ownerRequestHref = {
    pathname: "/dashboard/owner/demandes",
    query: {
      source: "logement",
      propertyId: String(id),
      propertyName: draft.nom_logement ?? "",
      city: draft.locationInfo.city ?? draft.ville ?? "",
    },
  };
  const activeRequestHref = primaryHousingRequest
    ? `/dashboard/owner/demandes?request=${encodeURIComponent(primaryHousingRequest.id)}`
    : null;
  const quoteRequestHref = quotedHousingRequest
    ? `/dashboard/owner/devis?request=${encodeURIComponent(quotedHousingRequest.id)}`
    : null;
  return (
    <div className={styles.ficheLogement}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.heroIdentity}>
            <div className={styles.housingAvatarWrap}>
              <Avatar
                src={draft.photo_principale}
                name={draft.nom_logement ?? "Logement"}
                alt={`Avatar du logement ${draft.nom_logement ?? ""}`}
                size="lg"
                className={styles.housingAvatar}
              />
              {editing ? (
                <>
                  <label className={styles.housingCameraButton}>
                    <FiCamera />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => void uploadHousingPhotos(event.target.files, { setAsProfile: true })}
                    />
                  </label>
                </>
              ) : null}
            </div>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Parc immobilier</p>
              <h1>{draft.nom_logement}</h1>
              <p>
                {draft.locationInfo.addressLine1}, {draft.locationInfo.city}
              </p>
              <div className={styles.heroMeta}>
                <span className={styles.metaPill}>{draft.characteristics.propertyType || "Bien"}</span>
                <span className={styles.metaPill}>
                  {formatCapacityLabel(housingCapacity, "Capacité maximale à préciser")}
                </span>
                <span className={styles.metaPill}>
                  {draft.characteristics.bedroomCount || "Chambres à préciser"}
                </span>
                <span className={styles.metaPill}>
                  {housingPhotos.length} photo{housingPhotos.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.headerConciergeCard}>
            <Avatar
              src={resolvedConciergeAvatarUrl}
              name={resolvedConciergeName}
              alt={`Avatar de ${resolvedConciergeName}`}
              size="md"
              className={styles.headerConciergeAvatar}
            />
            <div>
              <span>Concierge du logement</span>
              <strong>{resolvedConciergeName}</strong>
              <small>{resolvedConciergeSubtitle}</small>
              <div className={styles.headerConciergeMeta}>
                <span>{conciergeRelationshipLabel}</span>
                {conciergeInsights.map((insight) => (
                  <span key={insight}>{insight}</span>
                ))}
              </div>
              <small>{conciergeActionLabel}</small>
              <div className={styles.headerConciergeActions}>
                <Link className={styles.smallInlineButton} href={ownerRequestHref}>
                  {relatedServiceRequests.length > 0 ? "Suivre les demandes" : "Faire une demande"}
                </Link>
                {activeRequestHref ? (
                  <Link className={styles.ghostInlineButton} href={activeRequestHref}>
                    Voir la demande active
                  </Link>
                ) : null}
                {quoteRequestHref ? (
                  <Link className={styles.ghostInlineButton} href={quoteRequestHref}>
                    Voir les devis
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.cancelBtn} href="/dashboard/owner/logements">
              Retour aux logements
            </Link>
            {!editing ? (
              <button className={styles.editBtn} type="button" onClick={() => setEditing(true)}>
                Modifier
              </button>
            ) : (
              <>
                <button className={styles.cancelBtn} type="button" onClick={cancelEdition}>
                  <FiRotateCcw /> Annuler
                </button>
                <button className={styles.saveBtn} type="button" onClick={saveHousingChanges} disabled={saving}>
                  <FiSave /> {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </>
            )}
          </div>
        </div>

        {photoUploading ? <p className={styles.feedbackSuccess}>Upload des photos en cours...</p> : null}

        {error ? <p className={styles.feedbackError}>{error}</p> : null}
        {success ? <p className={styles.feedbackSuccess}>{success}</p> : null}

      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "synthese" ? (
          <div className={styles.sectionStack}>
            <p className={styles.sectionTitle}>Tableau de bord du logement</p>
            <div className={styles.heroStats}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Statut</p>
                <strong className={styles.statValue}>{statusLabel}</strong>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Capacité maximale</p>
                <strong className={styles.statValue}>
                  {formatCapacityLabel(housingCapacity, "À préciser")}
                </strong>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Équipements</p>
                <strong className={styles.statValue}>{equipmentCount}</strong>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Planning</p>
                <strong className={styles.statValue}>{planningCount + relatedMissions.length}</strong>
              </div>
            </div>
            <div className={styles.summaryMediaInfoLayout}>
            <div id="photos" className={`${styles.panel} ${styles.quickGalleryPanel}`}>
              <div className={styles.quickGalleryTopline}>
                <div>
                  <p className={styles.sectionTitle}>Galerie rapide</p>
                </div>
                {editing ? (
                  <label className={styles.quickGalleryUpload}>
                    <FiCamera />
                    {photoUploading ? "Upload..." : "Ajouter des images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) => void uploadHousingPhotos(event.target.files)}
                    />
                  </label>
                ) : null}
              </div>
              {!activeGalleryPhoto ? (
                <p>Aucune photo du logement pour le moment.</p>
              ) : (
                <div className={styles.quickGallery}>
                  <div className={styles.quickGalleryFrame}>
                    <button
                      className={styles.quickGalleryNav}
                      type="button"
                      onClick={() => moveGallery(-1)}
                      disabled={housingPhotos.length <= 1}
                      aria-label="Photo précédente"
                    >
                      <FiChevronLeft />
                    </button>
                    <div className={styles.quickGalleryImageWrap}>
                      <Image
                        src={activeGalleryPhoto}
                        alt={`Photo ${galleryIndex + 1} du logement`}
                        className={styles.quickGalleryImage}
                        width={800}
                        height={600}
                        unoptimized
                      />
                      <span className={styles.quickGalleryCounter}>
                        {galleryIndex + 1}/{housingPhotos.length}
                      </span>
                      {activeGalleryPhoto === draft.photo_principale ? (
                        <span className={styles.quickGalleryBadge}>Profil</span>
                      ) : null}
                      {editing ? (
                        activeGalleryPhoto === draft.photo_principale ? (
                          <button
                            className={styles.quickGalleryProfileButton}
                            type="button"
                            onClick={() => void clearPrimaryHousingPhoto()}
                          >
                            Retirer profil
                          </button>
                        ) : (
                          <button
                            className={styles.quickGalleryProfileButton}
                            type="button"
                            onClick={() => void setPrimaryHousingPhoto(activeGalleryPhoto)}
                          >
                            Définir profil
                          </button>
                        )
                      ) : null}
                    </div>
                    <button
                      className={styles.quickGalleryNav}
                      type="button"
                      onClick={() => moveGallery(1)}
                      disabled={housingPhotos.length <= 1}
                      aria-label="Photo suivante"
                    >
                      <FiChevronRight />
                    </button>
                  </div>

                  {housingPhotos.length > 1 ? (
                    <div className={styles.quickGalleryThumbs} aria-label="Photos du logement">
                      {housingPhotos.map((photo, index) => (
                        <button
                          className={`${styles.quickGalleryThumb} ${
                            index === galleryIndex ? styles.quickGalleryThumbActive : ""
                          }`}
                          key={`${photo}-${index}`}
                          type="button"
                          onClick={() => setGalleryIndex(index)}
                          aria-label={`Afficher la photo ${index + 1}`}
                        >
                          <Image
                            src={photo}
                            alt=""
                            className={styles.quickGalleryThumbImage}
                            width={160}
                            height={120}
                            unoptimized
                          />
                          {photo === draft.photo_principale ? <span>Profil</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <section className={`${styles.conciergeInfoGrid} ${styles.summaryInfoGrid}`}>
              <article className={styles.conciergeInfoCard}>
                <p className={`${styles.sectionTitle} ${styles.summaryCardTitle}`}>
                  <DoorOpen size={16} />
                  Logement
                </p>
                <div className={styles.infoTileGrid}>
                  {housingFacts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div className={styles.infoTile} key={item.label}>
                        <span>
                          <Icon size={14} />
                          {item.label}
                        </span>
                        <strong>{item.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </article>
              <article className={styles.conciergeInfoCard}>
                <p className={`${styles.sectionTitle} ${styles.summaryCardTitle}`}>
                  <KeyRound size={16} />
                  À connaître
                </p>
                <div className={styles.infoTileGrid}>
                  {priorityFacts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div className={styles.infoTile} key={item.label}>
                        <span>
                          <Icon size={14} />
                          {item.label}
                        </span>
                        <strong>{item.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </article>
              <article className={styles.conciergeInfoCard}>
                <p className={`${styles.sectionTitle} ${styles.summaryCardTitle}`}>
                  <UserRound size={16} />
                  Contact partagé
                </p>
                <div className={styles.infoTileGrid}>
                  {sharedOwnerContact.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div className={styles.infoTile} key={item.label}>
                        <span>
                          <Icon size={14} />
                          {item.label}
                        </span>
                        <strong>{item.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>
            </div>
          </div>
        ) : null}

        {activeTab === "infos" ? (
          <div id="informations" className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Informations du logement</p>
              </div>
              {!editing ? (
                <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Modifier cet onglet
                </button>
              ) : (
                <span className={styles.tabEditBadge}>
                  <FiEdit2 /> {"\u00c9dition active"}
                </span>
              )}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.fullField}>
                <div className={styles.priorityPanel}>
                  <div className={styles.priorityGrid}>
                    <label className={styles.priorityMainField}>
                      <span>Nom du logement</span>
                      <input
                        value={draft.nom_logement ?? ""}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({ ...current, nom_logement: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      <span>
                        <StairsIcon size={15} />
                        Étage
                      </span>
                      <input
                        value={draft.locationInfo.floor}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            locationInfo: {
                              ...current.locationInfo,
                              floor: event.target.value,
                            },
                          }))
                        }
                        placeholder="RDC, 2e, villa..."
                      />
                    </label>
                  </div>

                  <div className={styles.propertyTypePicker}>
                    <span>
                      <PropertyTypeIcon size={15} />
                      Type de bien
                    </span>
                    <div>
                      {HOUSING_PROPERTY_TYPE_OPTIONS.map((option) => {
                        const Icon = getPropertyTypeIcon(option);
                        const active = draft.characteristics.propertyType === option;
                        return (
                          <button
                            className={`${styles.propertyTypeOption} ${active ? styles.propertyTypeOptionActive : ""}`}
                            type="button"
                            key={option}
                            disabled={!editing}
                            onClick={() =>
                              applyDraftUpdate((current) => ({
                                ...current,
                                characteristics: {
                                  ...current.characteristics,
                                  propertyType: option,
                                  categorie: option,
                                },
                              }))
                            }
                          >
                            <Icon size={17} />
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.priorityAddressGrid}>
                    <label className={styles.priorityAddressMain}>
                      <span>
                        <MapPinHouse size={15} />
                        Adresse
                      </span>
                      <input
                        value={draft.locationInfo.addressLine1}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            adresse: event.target.value,
                            locationInfo: {
                              ...current.locationInfo,
                              addressLine1: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Complément</span>
                      <input
                        value={draft.locationInfo.addressLine2}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            locationInfo: {
                              ...current.locationInfo,
                              addressLine2: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Code postal</span>
                      <input
                        value={draft.locationInfo.postalCode}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            locationInfo: {
                              ...current.locationInfo,
                              postalCode: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Ville</span>
                      <input
                        value={draft.locationInfo.city}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            ville: event.target.value,
                            locationInfo: {
                              ...current.locationInfo,
                              city: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className={styles.platformPicker}>
                    <span>Plateformes</span>
                    <div>
                      {HOUSING_PLATFORM_OPTIONS.map((option) => {
                        const checked = selectedPlatforms.includes(option);
                        return (
                          <label
                            className={`${styles.platformCheck} ${checked ? styles.platformCheckActive : ""}`}
                            key={option}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!editing}
                              onChange={(event) => togglePlatformSelection(option, event.target.checked)}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.fullField}>
                <div className={`${styles.terrainSections} ${styles.terrainSectionsCompact}`}>
                  <section className={styles.terrainCard}>
                    <div className={styles.terrainCardHeader}>
                      <span className={styles.terrainIcon}>
                        <MapPinHouse size={20} />
                      </span>
                      <div>
                        <p>Accès et logistique terrain</p>
                        <small>Codes, clés, Wi‑Fi et consignes d&apos;entrée.</small>
                      </div>
                    </div>
                    <div className={styles.terrainFieldGrid}>
                      <label className={styles.terrainFieldWithIcon}>
                        <span>
                          <KeyRound size={15} />
                          Code d&apos;accès
                        </span>
                        <input
                          value={draft.locationInfo.accessCode}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              locationInfo: {
                                ...current.locationInfo,
                                accessCode: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.terrainFieldWithIcon}>
                        <span>
                          <Wifi size={15} />
                          Wi‑Fi / box
                        </span>
                        <input
                          value={draft.characteristics.wifiInfo}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              characteristics: {
                                ...current.characteristics,
                                wifiInfo: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.terrainFieldWide}>
                        <span>Instructions d&apos;entrée</span>
                        <textarea
                          value={draft.locationInfo.entryInstructions}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              locationInfo: {
                                ...current.locationInfo,
                                entryInstructions: event.target.value,
                              },
                            }))
                          }
                          placeholder="Boîte à clés, ascenseur, portail, stationnement, repères sur place..."
                        />
                      </label>
                    </div>
                  </section>
                </div>
              </div>
              <div className={styles.fullField}>
                <div className={styles.metricIconGrid}>
                  {housingMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <label className={styles.metricIconField} key={metric.label}>
                        <span>
                          <Icon size={17} />
                          {metric.label}
                        </span>
                        <div className={styles.metricInputWrap}>
                          <input
                            type="number"
                            min={0}
                            value={metric.value}
                            disabled={!editing}
                            onChange={(event) => {
                              const nextValue = toNullableNumber(event.target.value);
                              applyDraftUpdate((current) => {
                                const nextBeds =
                                  metric.field === "bedroomCount"
                                    ? syncBedsWithBedroomCount(current.stockManagement.beds, nextValue)
                                    : current.stockManagement.beds;

                                return {
                                  ...current,
                                  characteristics: {
                                    ...current.characteristics,
                                    [metric.field]: nextValue,
                                    ...(metric.field === "surfaceSqm" ? { superficie: nextValue } : {}),
                                    ...(metric.field === "guestCapacity" ? { capacite: nextValue } : {}),
                                    ...(metric.field === "bedroomCount" ? { nb_chambres: nextValue } : {}),
                                    ...(metric.field === "bedroomCount" ? { bedCount: countStockBeds(nextBeds) } : {}),
                                  },
                                  stockManagement: {
                                    ...current.stockManagement,
                                    beds: nextBeds,
                                  },
                                };
                              });
                            }}
                          />
                          {metric.suffix ? <small>{metric.suffix}</small> : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className={styles.fullField}>
                <div className={styles.bathroomInventoryPanel}>
                  <div className={styles.bedInventoryHeader}>
                    <div>
                      <p>
                        <Bath size={18} />
                        Salles de bain
                      </p>
                      <span>Ajoutez chaque salle de bain avec douche, baignoire ou les deux.</span>
                    </div>
                    {editing ? (
                      <button type="button" className={styles.smallInlineButton} onClick={addBathroom}>
                        Ajouter une salle de bain
                      </button>
                    ) : null}
                  </div>
                  {draft.characteristics.bathrooms.length === 0 ? (
                    <p className={styles.emptyInlineText}>Aucune salle de bain détaillée.</p>
                  ) : (
                    <div className={styles.bathroomRows}>
                      {draft.characteristics.bathrooms.map((bathroom, index) => (
                        <div className={styles.bathroomRow} key={bathroom.id}>
                          <label>
                            <span>Nom</span>
                            <input
                              value={bathroom.name}
                              disabled={!editing}
                              onChange={(event) => updateBathroom(index, "name", event.target.value)}
                              placeholder={`Salle de bain ${index + 1}`}
                            />
                          </label>
                          <div className={styles.bathroomTypeChoices}>
                            {BATHROOM_TYPE_OPTIONS.map((option) => {
                              const Icon = option.icon;
                              const active = bathroom.type === option.value;
                              return (
                                <button
                                  className={`${styles.iconChoice} ${active ? styles.iconChoiceActive : ""}`}
                                  type="button"
                                  key={option.value}
                                  disabled={!editing}
                                  onClick={() => updateBathroom(index, "type", option.value)}
                                >
                                  <Icon size={18} />
                                  <span>{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <label>
                            <span>Détail utile</span>
                            <input
                              value={bathroom.notes}
                              disabled={!editing}
                              onChange={(event) => updateBathroom(index, "notes", event.target.value)}
                              placeholder="Douche italienne, baignoire à l'étage, tapis antidérapant..."
                            />
                          </label>
                          {editing ? (
                            <button type="button" className={styles.iconDangerButton} onClick={() => removeBathroom(index)} aria-label="Supprimer cette salle de bain">
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.fullField}>
                <div className={styles.bedInventoryPanel}>
                  <div className={styles.bedInventoryHeader}>
                    <div>
                      <p>
                        <BedDouble size={18} />
                        Chambres et couchages réels
                      </p>
                      <span>La capacité maximale indique les personnes autorisées. Ici, détaillez les lits et canapés-lits pour préparer le linge.</span>
                    </div>
                    {editing ? (
                      <button type="button" className={styles.smallInlineButton} onClick={addStockBed}>
                        Ajouter un couchage
                      </button>
                    ) : null}
                  </div>
                  {draft.stockManagement.beds.length === 0 ? (
                    <p className={styles.emptyInlineText}>Aucun couchage détaillé pour les draps.</p>
                  ) : (
                    <div className={styles.bedRows}>
                      {draft.stockManagement.beds.map((bed, index) => (
                        <div className={styles.bedRow} key={bed.id}>
                          <label>
                            <span>Chambre / zone</span>
                            <input value={bed.room} disabled={!editing} onChange={(event) => updateStockBed(index, "room", event.target.value)} />
                          </label>
                          <label>
                            <span>Type de couchage</span>
                            <select value={bed.type} disabled={!editing} onChange={(event) => updateStockBed(index, "type", event.target.value)}>
                              {BED_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>Qté</span>
                            <input type="number" min="0" value={bed.quantity} disabled={!editing} onChange={(event) => updateStockBed(index, "quantity", event.target.value)} />
                          </label>
                          <label>
                            <span>Taille matelas</span>
                            <select value={bed.mattressSize} disabled={!editing} onChange={(event) => updateStockBed(index, "mattressSize", event.target.value)}>
                              <option value="">À préciser</option>
                              {MATTRESS_SIZE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.bedLinenField}>
                            <span>Linge à prévoir</span>
                            <input value={bed.linenKit} disabled={!editing} onChange={(event) => updateStockBed(index, "linenKit", event.target.value)} />
                          </label>
                          {editing ? (
                            <button type="button" className={styles.iconDangerButton} onClick={() => removeStockBed(index)} aria-label="Supprimer ce lit">
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.fullField}>
                <div className={styles.inlineCheckPanel}>
                  {fieldChecks.map(({ field, label, icon: Icon }) => (
                    <label
                      className={`${styles.equipmentCheck} ${
                        draft.characteristics[field] ? styles.equipmentCheckActive : ""
                      }`}
                      key={field}
                    >
                      <input
                        type="checkbox"
                        checked={draft.characteristics[field]}
                        disabled={!editing}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            characteristics: {
                              ...current.characteristics,
                              [field]: event.target.checked,
                            },
                          }))
                        }
                      />
                      <Icon size={16} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {draft.characteristics.terrace || draft.characteristics.stairs || draft.characteristics.pool || draft.characteristics.petsAllowed || draft.characteristics.barbecue ? (
                <div className={styles.fullField}>
                  <div className={styles.conditionalDetailsGrid}>
                    {draft.characteristics.terrace ? (
                      <div className={styles.detailCard}>
                        <p>
                          <SunMedium size={17} />
                          Terrasse
                        </p>
                        <label>
                          <span>Surface</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.characteristics.terraceSurfaceSqm ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("terraceSurfaceSqm", toNullableNumber(event.target.value))}
                            placeholder="m²"
                          />
                        </label>
                        <label>
                          <span>Notes</span>
                          <input
                            value={draft.characteristics.terraceNotes ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("terraceNotes", event.target.value)}
                            placeholder="Salon extérieur, accès, rangement coussins..."
                          />
                        </label>
                      </div>
                    ) : null}
                    {draft.characteristics.stairs ? (
                      <div className={styles.detailCard}>
                        <p>
                          <StairsIcon size={17} />
                          Escaliers
                        </p>
                        <label>
                          <span>Étages à monter</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.characteristics.stairsFloorCount ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("stairsFloorCount", toNullableNumber(event.target.value))}
                            placeholder="Ex. 2"
                          />
                        </label>
                        <label>
                          <span>Accès</span>
                          <input
                            value={draft.characteristics.stairsNotes ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("stairsNotes", event.target.value)}
                            placeholder="Ascenseur absent, escalier étroit, valises..."
                          />
                        </label>
                      </div>
                    ) : null}
                    {draft.characteristics.pool ? (
                      <div className={styles.detailCard}>
                        <p>
                          <Waves size={17} />
                          Piscine
                        </p>
                        <label>
                          <span>Consignes piscine</span>
                          <input
                            value={draft.characteristics.poolNotes ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("poolNotes", event.target.value)}
                            placeholder="Local technique, bâche, contrôle chlore..."
                          />
                        </label>
                      </div>
                    ) : null}
                    {draft.characteristics.petsAllowed ? (
                      <div className={styles.detailCard}>
                        <p>
                          <PawPrint size={17} />
                          Animaux
                        </p>
                        <label>
                          <span>Conditions</span>
                          <input
                            value={draft.characteristics.petsNotes ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("petsNotes", event.target.value)}
                            placeholder="Taille acceptée, zones interdites, nettoyage..."
                          />
                        </label>
                      </div>
                    ) : null}
                    {draft.characteristics.barbecue ? (
                      <div className={styles.detailCard}>
                        <p>
                          <Flame size={17} />
                          Barbecue
                        </p>
                        <label>
                          <span>Type et rangement</span>
                          <input
                            value={draft.characteristics.barbecueType ?? ""}
                            disabled={!editing}
                            onChange={(event) => updateCharacteristic("barbecueType", event.target.value)}
                            placeholder="Gaz, charbon, plancha, bouteille..."
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className={styles.fullField}>
                <div className={styles.terrainSections}>
                  <section className={styles.terrainCard}>
                    <div className={styles.terrainCardHeader}>
                      <span className={styles.terrainIcon}>
                        <ClipboardList size={20} />
                      </span>
                      <div>
                        <p>Préparation et exploitation</p>
                        <small>Ménage, remise en place et consignes de mission.</small>
                      </div>
                    </div>
                    <div className={styles.terrainFieldGrid}>
                      <label className={styles.terrainFieldWithIcon}>
                        <span>
                          <Clock size={15} />
                          Temps de ménage
                        </span>
                        <input
                          value={draft.services.temps ?? ""}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              services: {
                                ...current.services,
                                temps: event.target.value,
                              },
                            }))
                          }
                          placeholder="Ex. 2 h 30"
                        />
                      </label>
                      <div className={`${styles.terrainFieldWide} ${styles.housekeepingChecklistPanel}`}>
                        <div className={styles.housekeepingChecklistHeader}>
                          <div>
                            <span>
                              <ClipboardList size={16} />
                              Checklist ménage
                            </span>
                            <small>Remise en place et contrôles avant arrivée.</small>
                          </div>
                          <strong>
                            {housekeepingCheckedCount}/{housekeepingTasks.length}
                          </strong>
                        </div>
                        <div className={styles.housekeepingQuickChecks}>
                          {housekeepingTasks.map((task) => {
                            const checked = isChecklistTaskChecked(draft.services.checklist, task);
                            return (
                              <label
                                className={`${styles.housekeepingCheck} ${checked ? styles.housekeepingCheckActive : ""}`}
                                key={task}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!editing}
                                  onChange={(event) =>
                                    applyDraftUpdate((current) => ({
                                      ...current,
                                      services: {
                                        ...current.services,
                                        checklist: toggleChecklistTask(
                                          current.services.checklist,
                                          task,
                                          event.target.checked,
                                        ),
                                      },
                                    }))
                                  }
                                />
                                <span>{task}</span>
                              </label>
                            );
                          })}
                        </div>
                        {editing ? (
                          <div className={styles.housekeepingAddRow}>
                            <input
                              value={newHousekeepingTask}
                              onChange={(event) => setNewHousekeepingTask(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addHousekeepingTask();
                                }
                              }}
                              placeholder="Ajouter un point : kit nettoyage, kit arrivée..."
                            />
                            <button type="button" onClick={addHousekeepingTask} disabled={!newHousekeepingTask.trim()}>
                              <Plus size={15} />
                              Ajouter
                            </button>
                          </div>
                        ) : null}
                        <label className={styles.housekeepingNotesField}>
                          <span>Notes et ordre de passage</span>
                          <textarea
                            value={draft.services.checklist ?? ""}
                            disabled={!editing}
                            onChange={(event) =>
                              applyDraftUpdate((current) => ({
                                ...current,
                                services: {
                                  ...current.services,
                                  checklist: event.target.value,
                                },
                              }))
                            }
                            placeholder="Ajoutez les consignes précises, l'ordre de passage ou les détails propres au logement..."
                          />
                        </label>
                      </div>
                      <label className={styles.terrainFieldWide}>
                        <span>Consignes pour la conciergerie</span>
                        <textarea
                          value={draft.services.instructions ?? ""}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              services: {
                                ...current.services,
                                instructions: event.target.value,
                              },
                            }))
                          }
                          placeholder="Ordre de passage, priorités, habitudes propriétaire, consignes spécifiques..."
                        />
                      </label>
                      <label className={styles.terrainFieldWide}>
                        <span>
                          <ShieldCheck size={15} />
                          Points de vigilance
                        </span>
                        <textarea
                          value={draft.services.housekeepingNotes}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              services: {
                                ...current.services,
                                housekeepingNotes: event.target.value,
                              },
                            }))
                          }
                          placeholder="Objets fragiles, tâches fréquentes, zones à contrôler, oublis voyageurs..."
                        />
                      </label>
                    </div>
                  </section>

                  <section className={styles.terrainCard}>
                    <div className={styles.terrainCardHeader}>
                      <span className={styles.terrainIcon}>
                        <UserRound size={20} />
                      </span>
                      <div>
                        <p>Informations partagées</p>
                        <small>Coordonnées propriétaire et description utile au concierge.</small>
                      </div>
                    </div>
                    <div className={styles.terrainFieldGrid}>
                      <label>
                        <span>Propriétaire</span>
                        <input
                          value={draft.owner.fullName}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              owner: {
                                ...current.owner,
                                fullName: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.terrainFieldWithIcon}>
                        <span>
                          <Phone size={15} />
                          Téléphone
                        </span>
                        <input
                          value={draft.owner.phone}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              owner: {
                                ...current.owner,
                                phone: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.terrainFieldWide}>
                        <span>Adresse propriétaire</span>
                        <input
                          value={draft.owner.address}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              owner: {
                                ...current.owner,
                                address: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.terrainFieldWide}>
                        <span>Description du logement</span>
                        <textarea
                          value={draft.characteristics.description ?? ""}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              characteristics: {
                                ...current.characteristics,
                                description: event.target.value,
                              },
                            }))
                          }
                          placeholder="Ambiance, particularités, informations utiles à connaître avant mission..."
                        />
                      </label>
                      <label className={styles.terrainFieldWide}>
                        <span>Note propriétaire à partager</span>
                        <textarea
                          value={draft.services.internalNotes}
                          disabled={!editing}
                          onChange={(event) =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              services: {
                                ...current.services,
                                internalNotes: event.target.value,
                              },
                            }))
                          }
                          placeholder="Message ou précision que le concierge peut consulter."
                        />
                      </label>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "demandes" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Demandes du logement</p>
                <strong className={styles.inspectionStatus}>
                  {relatedServiceRequests.length} demande{relatedServiceRequests.length > 1 ? "s" : ""} liée
                  {relatedServiceRequests.length > 1 ? "s" : ""} à {draft.nom_logement || "ce logement"}.
                </strong>
              </div>
              <Link className={styles.tabEditButton} href="/dashboard/owner/demandes">
                <FiSend /> Voir toutes les demandes
              </Link>
            </div>

            <div className={styles.requestsSummaryGrid}>
              <div className={styles.requestMetricCard}>
                <span>Total</span>
                <strong>{relatedServiceRequests.length}</strong>
              </div>
              <div className={styles.requestMetricCard}>
                <span>En cours</span>
                <strong>{requestStats.active}</strong>
              </div>
              <div className={styles.requestMetricCard}>
                <span>Devis</span>
                <strong>{requestStats.quotes}</strong>
              </div>
              <div className={styles.requestMetricCard}>
                <span>Validées</span>
                <strong>{requestStats.accepted}</strong>
              </div>
            </div>

            {relatedServiceRequests.length ? (
              <div className={styles.housingRequestGrid}>
                {relatedServiceRequests.map((request) => {
                  const status = formatRequestStatus(
                    request.request_workflow_status ?? request.workflow_status ?? request.status,
                  );
                  const services = (request.requested_services ?? []).slice(0, 3);
                  const quoteCount = getRequestQuoteCount(request);

                  return (
                    <article className={styles.housingRequestCard} key={request.id}>
                      <div className={styles.housingRequestCardHeader}>
                        <div>
                          <span>{formatRequestType(request.request_type)}</span>
                          <h3>{request.title}</h3>
                        </div>
                        <strong>{status}</strong>
                      </div>
                      <div className={styles.housingRequestFacts}>
                        <span>{getRequestConciergeLabel(request)}</span>
                        <span>{quoteCount} devis</span>
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                      {services.length ? (
                        <div className={styles.housingRequestChips}>
                          {services.map((service) => (
                            <span key={service}>{service}</span>
                          ))}
                        </div>
                      ) : null}
                      <Link className={styles.smallInlineButton} href={ownerRequestHref}>
                        Ouvrir les demandes
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.panel}>
                <p>Aucune demande n&apos;est encore liée à ce logement.</p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "documents" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Documents du logement</p>
                <strong className={styles.inspectionStatus}>
                  Contrats, guides d&apos;accueil, notices et documents utiles transmis aux intervenants.
                </strong>
              </div>
              {!editing ? (
                <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Modifier cet onglet
                </button>
              ) : (
                <span className={styles.tabEditBadge}>
                  <FiEdit2 /> {"\u00c9dition active"}
                </span>
              )}
            </div>
            {editing ? (
              <button className={styles.editBtn} type="button" onClick={addDraftDocument}>
                Ajouter un document
              </button>
            ) : null}
            {!documents.length ? (
              <div className={styles.panel}>
                <p>Aucun document rattaché à ce logement pour le moment.</p>
              </div>
            ) : (
              <div className={styles.formGrid}>
                {documents.map((doc, index) => (
                  <div className={styles.panel} key={doc.id}>
                    <label className={styles.field}>
                      <span>Nom</span>
                      <input
                        value={doc.name}
                        disabled={!editing}
                        onChange={(event) => updateDraftDocument(index, "name", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Type</span>
                      <input
                        value={doc.type}
                        disabled={!editing}
                        onChange={(event) => updateDraftDocument(index, "type", event.target.value)}
                      />
                    </label>
                    <label className={styles.fullField}>
                      <span>URL</span>
                      <input
                        value={doc.url}
                        disabled={!editing}
                        onChange={(event) => updateDraftDocument(index, "url", event.target.value)}
                      />
                    </label>
                    {editing ? (
                      <button className={styles.cancelBtn} type="button" onClick={() => removeDraftDocument(index)}>
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "stocks" ? (
          <div id="stocks" className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Stocks et équipements</p>
                <strong className={styles.inspectionStatus}>
                  {equipmentCount} équipement{equipmentCount > 1 ? "s" : ""} sélectionné
                  {equipmentCount > 1 ? "s" : ""} pour ce logement.
                </strong>
              </div>
              {!editing ? (
                <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Modifier cet onglet
                </button>
              ) : (
                <span className={styles.tabEditBadge}>
                  <FiEdit2 /> {"\u00c9dition active"}
                </span>
              )}
            </div>
            <div className={styles.equipmentCatalog}>
              {HOUSING_EQUIPMENT_CATALOG.map((category) => (
                <section className={styles.equipmentCategory} key={category.title}>
                  <div className={styles.equipmentCategoryHeader}>
                    <h3>{category.title}</h3>
                    <span>
                      {category.subcategories.reduce(
                        (total, subcategory) =>
                          total + subcategory.items.filter((item) => equipments.includes(item)).length,
                        0,
                      )}
                    </span>
                  </div>

                  <div className={styles.equipmentSubcategoryGrid}>
                    {category.subcategories.map((subcategory) => (
                      <div className={styles.equipmentSubcategory} key={subcategory.title}>
                        <p>{subcategory.title}</p>
                        <div className={styles.equipmentChecklist}>
                          {subcategory.items.map((item) => {
                            const checked = equipments.includes(item);
                            return (
                              <label
                                className={`${styles.equipmentCheck} ${checked ? styles.equipmentCheckActive : ""}`}
                                key={item}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!editing}
                                  onChange={() => toggleEquipment(item)}
                                />
                                <span>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {customEquipments.length ? (
              <div className={styles.panel}>
                <p className={styles.sectionTitle}>Hors catalogue</p>
                <div className={styles.equipmentChipList}>
                  {customEquipments.map((item) => (
                    <span className={styles.equipmentChip} key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {!equipments.length ? (
              <div className={styles.panel}>
                <p>Aucun équipement n&apos;est renseigné pour ce logement.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "planning" ? (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionTitle}>Planning du logement</p>
                <strong className={styles.inspectionStatus}>
                  Arrivées, départs, interventions et événements liés à ce logement.
                </strong>
              </div>
              <div className={styles.inspectionActions}>
                {!editing ? (
                  <button className={styles.tabEditButton} type="button" onClick={() => setEditing(true)}>
                    <FiEdit2 /> Modifier cet onglet
                  </button>
                ) : (
                  <>
                    <span className={styles.tabEditBadge}>
                      <FiEdit2 /> {"\u00c9dition active"}
                    </span>
                    <button className={styles.editBtn} type="button" onClick={addPlanningEvent}>
                      Ajouter un élément
                    </button>
                  </>
                )}
              </div>
            </div>
            {!planningEvents.length ? (
              <div className={styles.panel}>
                <p>Aucun événement embarqué sur ce logement.</p>
              </div>
            ) : (
              <div className={styles.formGrid}>
                {planningEvents.map((event, index) => (
                  <div className={styles.panel} key={event.id}>
                    <label className={styles.field}>
                      <span>Titre</span>
                      <input
                        value={event.title}
                        disabled={!editing}
                        onChange={(item) => updatePlanningEvent(index, "title", item.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Date</span>
                      <input
                        type="datetime-local"
                        value={event.date ? event.date.slice(0, 16) : ""}
                        disabled={!editing}
                        onChange={(item) => updatePlanningEvent(index, "date", item.target.value)}
                      />
                    </label>
                    <label className={styles.fullField}>
                      <span>Description</span>
                      <textarea
                        value={event.description}
                        disabled={!editing}
                        onChange={(item) => updatePlanningEvent(index, "description", item.target.value)}
                      />
                    </label>
                    {editing ? (
                      <button className={styles.cancelBtn} type="button" onClick={() => removePlanningEvent(index)}>
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <p className={styles.sectionTitle}>Missions liées</p>
            {relatedMissions.length ? (
              <div className={styles.list}>
                {relatedMissions.map((mission) => (
                  <div className={styles.listItem} key={mission.id}>
                    <strong>{mission.title}</strong>
                    <p>
                      {mission.status || "Statut inconnu"} | {formatDate(mission.scheduled_start)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.panel}>
                <p>Aucune mission n&apos;est encore liée à ce logement.</p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "litiges" ? (
          <div className={styles.sectionStack}>
            <div className={styles.inspectionPanel}>
              <div className={styles.inspectionHeader}>
                <p className={styles.statLabel}>Litige voyageur</p>
                <strong className={styles.inspectionStatus}>
                  {inspectionStatus ? `Inspection: ${inspectionStatus}` : "Aucune inspection disponible"}
                </strong>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Type de litige</span>
                  <select
                    value={disputeType}
                    onChange={(event) =>
                      setDisputeType(event.target.value as "damage" | "missing_item" | "cleaning" | "other")
                    }
                    disabled={disputeBusy || !inspectionId}
                  >
                    <option value="damage">Dégât</option>
                    <option value="missing_item">Objet manquant</option>
                    <option value="cleaning">Ménage non conforme</option>
                    <option value="other">Autre</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Montant estimé (EUR)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedAmount}
                    onChange={(event) => setEstimatedAmount(event.target.value)}
                    placeholder="280.00"
                    disabled={disputeBusy || !inspectionId}
                  />
                </label>

                <label className={styles.fullField}>
                  <span>Description</span>
                  <textarea
                    value={disputeDescription}
                    onChange={(event) => setDisputeDescription(event.target.value)}
                    placeholder="Précisez les dégâts et le contexte."
                    disabled={disputeBusy || !inspectionId}
                  />
                </label>
              </div>

              <div className={styles.sectionStack}>
                <p className={styles.sectionTitle}>Preuves sélectionnées</p>

                <div className={styles.panel}>
                  <strong>Checklist anomalies</strong>
                  {issueChecklistItems.length === 0 ? (
                    <p>Aucune anomalie checklist sur l&apos;inspection.</p>
                  ) : (
                    <div className={styles.list}>
                      {issueChecklistItems.map((item) => (
                        <label key={item.id} className={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={selectedChecklistItemIds.includes(item.id)}
                            onChange={() =>
                              setSelectedChecklistItemIds((prev) => toggleStringInList(prev, item.id))
                            }
                            disabled={disputeBusy}
                          />
                          <span>{item.item_label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.panel}>
                  <strong>Médias de preuve</strong>
                  {inspectionMedia.length === 0 ? (
                    <p>Aucun média lié à l&apos;inspection.</p>
                  ) : (
                    <div className={styles.mediaList}>
                      {inspectionMedia.map((media) => (
                        <label key={media.id} className={styles.mediaRow}>
                          <div className={styles.mediaPreviewWrap}>
                            {media.media_type === "photo" && buildMediaPreviewUrl(media.storage_path) ? (
                              <Image
                                src={buildMediaPreviewUrl(media.storage_path) ?? ""}
                                alt={`Preuve ${media.id}`}
                                className={styles.mediaThumb}
                                width={800}
                                height={600}
                                unoptimized
                              />
                            ) : null}
                            {media.media_type === "video" && buildMediaPreviewUrl(media.storage_path) ? (
                              <video
                                className={styles.mediaThumb}
                                src={buildMediaPreviewUrl(media.storage_path) ?? ""}
                                controls
                                preload="metadata"
                              />
                            ) : null}
                            <span>
                              {media.media_type.toUpperCase()} - {formatDate(media.created_at)}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedMediaIds.includes(media.id)}
                            onChange={() => setSelectedMediaIds((prev) => toggleStringInList(prev, media.id))}
                            disabled={disputeBusy}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.inspectionActions}>
                <button
                  className={styles.saveBtn}
                  type="button"
                  onClick={openDisputeFromInspection}
                  disabled={disputeBusy || !inspectionId}
                >
                  Ouvrir un litige
                </button>
              </div>

              {disputeError ? <p className={styles.feedbackError}>{disputeError}</p> : null}
              {disputeSuccess ? <p className={styles.feedbackSuccess}>{disputeSuccess}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
