"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";

import { Button, ButtonLink } from "@/components/ui";
import styles from "./OwnerConciergesPage.module.scss";
import type { SortMode, ViewMode } from "./conciergeSearchTypes";
import {
  createConciergeComparator,
  getActiveSearchSummary,
} from "./conciergeSearchUtils";
import { buildOwnerSearchReturnTo, restoreSelectedConcierges } from "@/features/owner-concierges/lib/searchNavigation";
import { isSearchPoint, resolveSearchMapCenter } from "@/features/owner-concierges/lib/geography";
import { useOwnerConciergeSearch } from "./useOwnerConciergeSearch";
import {
  buildOwnerConciergeSearchParams,
  getOwnerConciergeMapFeedback,
  getOwnerSearchWarningMessage,
  hasOwnerConciergeSearchCriteria,
  normalizeOwnerServiceSelections,
  normalizeOwnerServiceFamilies,
  preserveTouchedOwnerConciergeFilters,
  toggleOwnerConciergeValue,
  type OwnerConciergeSearchFilters,
} from "./searchHelpers";
import { getOwnerCitySuggestions } from "./locationSuggestions";
import { upsertOwnerConciergeSearchAlert } from "../searchAlerts";
import { ResultsGrid, ResultsHeader, RequestPanel, SearchFilters } from "@/features/owner-concierges/components";
import { ConciergeAvatar } from "@/features/owner-concierges/components/ConciergeAvatar";
import { CONCIERGE_PROPERTY_TYPES } from "@/features/shared/data/propertyTypes";
import type { RequestWorkflowStatus } from "@/app/lib/requestStatus";
import { normalizeStayNeed, type NeedKey } from "@/app/api/_shared/stayNeeds";
import {
  buildServiceRequestBrief,
  getServiceRequestBriefDefaults,
  inferRequestTypeFromCollaboration,
} from "@/app/lib/serviceRequestBrief";
import type { RequestFormState } from "@/features/owner-concierges/types";
import {
  buildOwnerConciergeSearchDefaults,
  buildOwnerRequestFormDefaults,
  getOwnerProfilePreferences,
} from "@/features/owner-preferences/profilePreferences";
import { focusFirstModalElement, trapFocusInModal } from "../modalAccessibility";
import { resolvePlanetLSIndividualRequestServices } from "@/app/lib/planetlsServiceSearchResolution";
import { resolvePlanetLSServiceSlug } from "@/app/lib/planetlsServiceMatching";
import { normalizeConciergeCategories } from "@/features/owner-concierges/lib/searchNormalization";
import {
  PLANETLS_SERVICE_FAMILIES,
  PLANETLS_SERVICE_TARGET,
} from "@/app/lib/planetlsServiceCatalogTarget";
import {
  GUEST_CHECKIN_CHECKOUT_BUNDLE,
  getGuestCheckinCheckoutRequestMetadata,
  isGuestCheckinCheckoutOperationalSlug,
  replaceGuestCheckinCheckoutServices,
  toggleGuestCheckinCheckoutSelection,
} from "@/app/lib/guestCheckinCheckout";

const SearchMap = dynamic(() => import("@/app/components/MapWithList/MapWithList"), {
  ssr: false,
});

const initialFilters: OwnerConciergeSearchFilters = {
  professionalType: "all",
  region: "",
  city: "",
  selectedCategories: [],
  selectedServiceFamilies: [],
  selectedServices: [],
  propertyType: "",
  budgetMax: "",
  radiusKm: "20",
  proOnly: false,
};

const initialRequestForm: RequestFormState = {
  requestType: "durable",
  ownerGoal: "find_concierge",
  collaborationType: "partial_management",
  frequency: "unknown",
  estimatedDuration: "",
  responsibilityLevel: "shared",
  title: "",
  description: "",
  housingId: "",
  propertyName: "",
  propertyAddress: "",
  propertyType: "",
  sleepingCapacity: "",
  propertyConstraints: "",
  city: "",
  postalCode: "",
  desiredDate: "",
  budgetMax: "",
  currency: "EUR",
  urgency: false,
};

const SEARCH_URL_KEYS = [
  "type",
  "geographic",
  "region",
  "city",
  "postalCode",
  "categories",
  "serviceFamilies",
  "services",
  "service",
  "propertyType",
  "budgetMax",
  "radiusKm",
  "proOnly",
] as const;

type OwnerServiceRequestRecipient = {
  id: string;
  concierge_profile_id?: string | null;
  status?: string | null;
  concierge_name?: string | null;
  concierge_avatar_url?: string | null;
  quote_id?: string | null;
  quote_status?: string | null;
};

type OwnerServiceRequestRow = {
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
  created_at?: string | null;
  mission_id?: string | null;
  selected_concierge_profile_id?: string | null;
  selected_concierge_name?: string | null;
  selected_concierge_avatar_url?: string | null;
  recipients?: OwnerServiceRequestRecipient[];
};

type OwnerRequestsPayload = {
  items?: OwnerServiceRequestRow[];
  error?: string;
};

type CurrentOwnerProfilePayload = {
  availability_hours?: string | null;
  city?: string | null;
  location?: string | null;
  service_area?: string | null;
};

type StaySearchContext = {
  reservationId: string;
  stayNeed: NeedKey;
  stayNeedLabel: string;
  propertyLabel: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
};

type ReservationContextPayload = {
  reservation?: {
    id: string;
    property_label?: string | null;
    check_in_at?: string | null;
    check_out_at?: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  error?: string;
};

const stayNeedLabels: Record<NeedKey, string> = {
  checkin: "Check-in",
  checkout: "Check-out",
  cleaning: "Ménage",
  linen: "Linge",
  courses: "Courses",
};

function formatStayPeriod(checkInAt: string | null, checkOutAt: string | null) {
  const formatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const format = (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : formatter.format(date);
  };
  const checkIn = format(checkInAt);
  const checkOut = format(checkOutAt);
  if (checkIn && checkOut) return `${checkIn} → ${checkOut}`;
  return checkIn ?? checkOut ?? null;
}

function parseSliderValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseSearchRadius(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

function formatResultsSummary(count: number, city: string) {
  if (count === 0) {
    return city.trim() ? `Aucun professionnel trouvé autour de ${city.trim()}` : "Aucun professionnel trouvé";
  }

  const professionLabel = count > 1 ? "professionnels trouvés" : "professionnel trouvé";
  const cityLabel = city.trim() ? ` autour de ${city.trim()}` : "";
  return `${count} ${professionLabel}${cityLabel}`;
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getOwnerRequestStatus(request: OwnerServiceRequestRow) {
  const workflowStatus = normalizeStatus(request.request_workflow_status ?? request.workflow_status);
  if (workflowStatus === "accepted" || workflowStatus === "archived") return "accepted";
  if (workflowStatus === "quote_sent" || workflowStatus === "in_discussion") return "discussion";
  if (workflowStatus === "viewed") return "viewed";
  if (workflowStatus === "sent") return "sent";
  if (workflowStatus === "declined") return "declined";
  if (workflowStatus === "expired") return "expired";
  if (workflowStatus === "new") return "draft";

  const status = normalizeStatus(request.status);
  if (request.mission_id || status === "accepted" || status === "mission_created") return "accepted";
  if (status === "quoted" || status === "quote_sent") return "discussion";
  if (status === "viewed" || status === "in_review") return "viewed";
  if (status === "declined" || status === "closed") return "declined";
  if (status === "expired" || status === "cancelled" || status === "canceled") return "expired";
  if (status === "draft" || status === "new") return "draft";
  return "sent";
}

function getQuoteCount(request: OwnerServiceRequestRow) {
  return (request.recipients ?? []).filter((recipient) => {
    const quoteStatus = normalizeStatus(recipient.quote_status);
    return Boolean(recipient.quote_id) || quoteStatus === "sent" || quoteStatus === "accepted" || quoteStatus === "quoted";
  }).length;
}

function getOwnerRequestActionLabel(request: OwnerServiceRequestRow) {
  const status = getOwnerRequestStatus(request);
  if (status === "draft") return "Compléter";
  if (status === "accepted") return request.mission_id ? "Voir la mission" : "Confier une mission";
  if (getQuoteCount(request) > 0) return "Comparer les devis";
  if (["sent", "viewed"].includes(status) && getQuoteCount(request) === 0) return "Relancer / alerte";
  if (status === "discussion") return "Suivre l'échange";
  if (status === "declined" || status === "expired") return "Reprendre";
  return "Suivre";
}

function buildOwnerRequestActionHref(request: OwnerServiceRequestRow) {
  const status = getOwnerRequestStatus(request);
  if (status === "accepted" && request.mission_id) {
    return `/dashboard/owner/missions/${encodeURIComponent(request.mission_id)}`;
  }
  if (status === "accepted") {
    return `/dashboard/owner/missions/voyageurs?request=${encodeURIComponent(request.id)}`;
  }
  if (getQuoteCount(request) > 0) {
    return `/dashboard/owner/devis?request=${encodeURIComponent(request.id)}`;
  }
  return `/dashboard/owner/demandes?request=${encodeURIComponent(request.id)}`;
}

export default function OwnerConciergesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<OwnerConciergeSearchFilters>(() => ({
    ...initialFilters,
    city: searchParams.get("city") ?? searchParams.get("postalCode") ?? "",
    radiusKm: searchParams.get("radiusKm") ?? "20",
  }));
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("available");
  const [consultedConciergeId, setConsultedConciergeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [requestComposerOpen, setRequestComposerOpen] = useState(false);
  const [selectedConciergeIds, setSelectedConciergeIds] = useState<string[]>([]);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [ownerRequests, setOwnerRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [, setOwnerRequestsLoading] = useState(true);
  const [openServiceSections, setOpenServiceSections] = useState<Record<string, boolean>>({});
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [lastSubmittedStatus, setLastSubmittedStatus] = useState<RequestWorkflowStatus | null>(null);
  const [lastSentSummary, setLastSentSummary] = useState<{
    title: string;
    city: string;
    recipients: string[];
  } | null>(null);
  const [profileRequestDefaults, setProfileRequestDefaults] = useState<Partial<RequestFormState>>({});
  const [profileSearchDefaults, setProfileSearchDefaults] = useState<Partial<OwnerConciergeSearchFilters>>({});
  const [profileDefaultsReady, setProfileDefaultsReady] = useState(false);
  const [stayContext, setStayContext] = useState<StaySearchContext | null>(null);
  const [stayContextLoading, setStayContextLoading] = useState(false);
  const [stayContextError, setStayContextError] = useState<string | null>(null);
  const { items, center: searchCenter, loading, error, warning, search, clear, setError } = useOwnerConciergeSearch();
  const hydratedFromUrlRef = useRef(false);
  const touchedFilterKeysRef = useRef(new Set<keyof OwnerConciergeSearchFilters>());
  const hydratedStayContextRef = useRef<string | null>(null);
  const requestPanelRef = useRef<HTMLElement | null>(null);
  const requestReturnFocusRef = useRef<HTMLElement | null>(null);
  const lastToastMessageRef = useRef<string | null>(null);

  const profileReturnTo = buildOwnerSearchReturnTo(filters, selectedConciergeIds, searchParams.toString());
  const selectedIdSet = useMemo(() => new Set(selectedConciergeIds), [selectedConciergeIds]);

  const selectedConcierges = useMemo(
    () => items.filter((item) => selectedIdSet.has(item.id)),
    [items, selectedIdSet],
  );

  const sortedItems = useMemo(() => {
    const ranked = [...items];
    ranked.sort(createConciergeComparator(sortMode));
    return ranked;
  }, [items, sortMode]);

  const catalogServicesByCategory = useMemo(
    () =>
      PLANETLS_SERVICE_FAMILIES.map((family) => ({
        category: family.label,
        services: PLANETLS_SERVICE_TARGET.filter(
          (entry) =>
            entry.family === family.slug &&
            !isGuestCheckinCheckoutOperationalSlug(entry.slug),
        ).map((entry) => entry.slug),
      })),
    [],
  );
  const propertyTypeOptions = useMemo(
    () => Array.from(CONCIERGE_PROPERTY_TYPES),
    [],
  );

  const activeSearchSummary = useMemo(() => getActiveSearchSummary(filters), [filters]);
  const hasSearchCriteria = useMemo(() => hasOwnerConciergeSearchCriteria(filters), [filters]);
  const reservationIdParam = searchParams.get("reservation_id")?.trim() ?? "";
  const stayNeedParam = normalizeStayNeed(searchParams.get("stay_need"));
  const isStaySearchMode = Boolean(reservationIdParam && stayNeedParam);
  const existingHousingRequest = useMemo(() => {
    if (!requestForm.housingId || requestForm.requestType === "renfort") return null;
    return (
      ownerRequests.find(
        (request) => request.request_type !== "renfort" && String(request.property_housing_id ?? "") === requestForm.housingId,
      ) ?? null
    );
  }, [ownerRequests, requestForm.housingId, requestForm.requestType]);
  const existingHousingRequestIsBlocking = Boolean(
    existingHousingRequest && getOwnerRequestStatus(existingHousingRequest) !== "draft",
  );
  const mapProfiles = useMemo(
    () =>
      sortedItems
        .filter(isSearchPoint)
        .map((item) => ({
          id: item.id,
          name: item.display_name,
          type: item.professional_type ?? "concierge",
          city: item.city || item.service_area || item.location || "",
          latitude: item.latitude as number,
          longitude: item.longitude as number,
          services: item.services,
        })),
    [sortedItems],
  );
  const mapCenter = resolveSearchMapCenter(searchCenter, mapProfiles);
  const appliedRadiusKm = parseSearchRadius(filters.radiusKm);
  const resultsSummary = formatResultsSummary(items.length, filters.city);
  const mapFeedback = getOwnerConciergeMapFeedback(items.length, loading, error);

  function updateFilters<Key extends keyof OwnerConciergeSearchFilters>(
    key: Key,
    value: OwnerConciergeSearchFilters[Key],
  ) {
    touchedFilterKeysRef.current.add(key);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function updateRequestForm<Key extends keyof RequestFormState>(
    key: Key,
    value: RequestFormState[Key],
  ) {
    setFeedback(null);
    setLastSentSummary(null);
    setRequestForm((prev) => {
      if (key === "ownerGoal") {
        const ownerGoal = value as RequestFormState["ownerGoal"];
        const defaults = getServiceRequestBriefDefaults(ownerGoal);
        return {
          ...prev,
          ownerGoal,
          collaborationType: defaults.collaborationType,
          requestType: inferRequestTypeFromCollaboration(defaults.collaborationType),
          frequency: defaults.frequency,
          responsibilityLevel: defaults.responsibilityLevel,
        };
      }

      if (key === "collaborationType") {
        const collaborationType = value as RequestFormState["collaborationType"];
        return {
          ...prev,
          collaborationType,
          requestType: inferRequestTypeFromCollaboration(collaborationType),
          frequency:
            collaborationType === "one_off"
              ? "once"
              : prev.frequency === "once"
                ? "unknown"
                : prev.frequency,
          responsibilityLevel:
            collaborationType === "full_management"
              ? "full"
              : collaborationType === "partial_management"
                ? "shared"
                : prev.responsibilityLevel,
        };
      }

      return { ...prev, [key]: value };
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfileDefaults() {
      try {
        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = (await response.json()) as CurrentOwnerProfilePayload;
        if (!response.ok || cancelled) return;

        const preferences = getOwnerProfilePreferences(payload.availability_hours);
        const requestDefaults = buildOwnerRequestFormDefaults(preferences);
        const searchDefaults = buildOwnerConciergeSearchDefaults(preferences);
        const profileCity =
          [payload.city, payload.location, payload.service_area]
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .find((value) => value.length > 0) ?? "";

        if (!cancelled) {
          setProfileRequestDefaults(requestDefaults);
          setProfileSearchDefaults({
            ...searchDefaults,
            city: profileCity,
            radiusKm: "20",
          });
        }
      } catch {
        // Owner defaults are a convenience layer and should never block the page.
      } finally {
        if (!cancelled) {
          setProfileDefaultsReady(true);
        }
      }
    }

    void loadProfileDefaults();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadOwnerRequests = useCallback(async () => {
    try {
      setOwnerRequestsLoading(true);
      const response = await fetch("/api/service-requests?limit=100", { cache: "no-store" });
      const payload = (await response.json()) as OwnerRequestsPayload;
      setOwnerRequests(response.ok && Array.isArray(payload.items) ? payload.items : []);
    } catch {
      setOwnerRequests([]);
    } finally {
      setOwnerRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOwnerRequests();
  }, [loadOwnerRequests]);

  useEffect(() => {
    let cancelled = false;

    async function loadStayContext() {
      if (!isStaySearchMode || !stayNeedParam) {
        setStayContext(null);
        setStayContextError(null);
        setStayContextLoading(false);
        return;
      }

      setStayContextLoading(true);
      setStayContextError(null);
      try {
        const response = await fetch(`/api/reservations/${encodeURIComponent(reservationIdParam)}`, { cache: "no-store" });
        const payload = (await response.json()) as ReservationContextPayload;
        if (!response.ok || !payload.reservation) {
          throw new Error(payload.error || "Impossible de charger ce séjour.");
        }

        const propertyLabel =
          payload.reservation.property_label ||
          (typeof payload.reservation.metadata?.property_label === "string" ? payload.reservation.metadata.property_label : null);

        if (!cancelled) {
          setStayContext({
            reservationId: payload.reservation.id,
            stayNeed: stayNeedParam,
            stayNeedLabel: stayNeedLabels[stayNeedParam],
            propertyLabel,
            checkInAt: payload.reservation.check_in_at ?? null,
            checkOutAt: payload.reservation.check_out_at ?? null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setStayContext(null);
          setStayContextError(err instanceof Error ? err.message : "Impossible de charger ce séjour.");
        }
      } finally {
        if (!cancelled) setStayContextLoading(false);
      }
    }

    void loadStayContext();
    return () => {
      cancelled = true;
    };
  }, [isStaySearchMode, reservationIdParam, stayNeedParam]);

  useEffect(() => {
    const queryValue = filters.city.trim();
    const looksLikePostalCode = /^\d{4,6}$/.test(queryValue);

    setRequestForm((prev) => ({
      ...prev,
      city: looksLikePostalCode ? "" : filters.city,
      postalCode: looksLikePostalCode ? queryValue : prev.postalCode,
    }));
  }, [filters.city]);

  useEffect(() => {
    if (!profileDefaultsReady) return;
    if (hydratedFromUrlRef.current) return;

    const baseRequestForm: RequestFormState = {
      ...initialRequestForm,
      ...profileRequestDefaults,
    };
    const baseFilters: OwnerConciergeSearchFilters = {
      ...initialFilters,
      ...profileSearchDefaults,
    };
    const nextFilters: OwnerConciergeSearchFilters = { ...baseFilters };
    const requestedType = searchParams.get("type");
    nextFilters.professionalType = isStaySearchMode ? "concierge"
      : requestedType === "concierge" || requestedType === "provider" ? requestedType : "all";
    if (searchParams.has("region")) {
      nextFilters.region = searchParams.get("region")?.trim() ?? "";
    }
    if (searchParams.has("city") || searchParams.has("postalCode")) {
      nextFilters.city = searchParams.get("city") ?? searchParams.get("postalCode") ?? "";
    }
    if (searchParams.has("categories")) {
      nextFilters.selectedCategories = normalizeConciergeCategories(
        (searchParams.get("categories") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
    }
    if (searchParams.has("serviceFamilies")) {
      nextFilters.selectedServiceFamilies = normalizeOwnerServiceFamilies(
        (searchParams.get("serviceFamilies") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
    }
    if (searchParams.has("services") || searchParams.has("service")) {
      const urlServices =
        searchParams.get("services") ?? searchParams.get("service") ?? "";
      nextFilters.selectedServices = normalizeOwnerServiceSelections(
        urlServices
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
    } else if (isStaySearchMode && stayNeedParam) {
      nextFilters.selectedServices = [stayNeedLabels[stayNeedParam]];
    }
    if (searchParams.has("propertyType")) {
      nextFilters.propertyType = searchParams.get("propertyType")?.trim() ?? "";
    }
    if (searchParams.has("budgetMax")) {
      nextFilters.budgetMax = searchParams.get("budgetMax")?.trim() ?? "";
    }
    if (searchParams.has("radiusKm")) {
      nextFilters.radiusKm = searchParams.get("radiusKm")?.trim() ?? "";
    } else if (nextFilters.city.trim()) {
      nextFilters.radiusKm = "20";
    }
    if (searchParams.has("proOnly")) {
      nextFilters.proOnly = searchParams.get("proOnly") === "1";
    }
    const hydratedFilters = preserveTouchedOwnerConciergeFilters(
      nextFilters,
      filters,
      touchedFilterKeysRef.current,
    );
    const hasExplicitUrlFilters = SEARCH_URL_KEYS.some((key) => searchParams.has(key));
    const urlRequestType = searchParams.get("requestType");
    const nextRequestType: RequestFormState["requestType"] = isStaySearchMode
      ? "ponctuel"
      : urlRequestType === "renfort" || urlRequestType === "durable"
        ? urlRequestType
        : baseRequestForm.requestType;
    const nextRequestForm: RequestFormState = {
      ...baseRequestForm,
      requestType: nextRequestType,
      ownerGoal:
        (isStaySearchMode ? "one_off_quote" : (searchParams.get("ownerGoal") as RequestFormState["ownerGoal"] | null)) ??
        baseRequestForm.ownerGoal,
      collaborationType:
        (isStaySearchMode ? "one_off" : (searchParams.get("collaborationType") as RequestFormState["collaborationType"] | null)) ??
        baseRequestForm.collaborationType,
      frequency:
        (isStaySearchMode ? "once" : (searchParams.get("frequency") as RequestFormState["frequency"] | null)) ??
        baseRequestForm.frequency,
      estimatedDuration: searchParams.get("estimatedDuration") ?? baseRequestForm.estimatedDuration,
      responsibilityLevel:
        (searchParams.get("responsibilityLevel") as RequestFormState["responsibilityLevel"] | null) ??
        baseRequestForm.responsibilityLevel,
      title: searchParams.get("requestTitle") ?? (isStaySearchMode && stayNeedParam ? stayNeedLabels[stayNeedParam] : baseRequestForm.title),
      description: searchParams.get("requestDescription") ?? baseRequestForm.description,
      housingId: searchParams.get("housingId") ?? "",
      propertyName: searchParams.get("propertyName") ?? "",
      propertyAddress: searchParams.get("propertyAddress") ?? "",
      propertyType: searchParams.get("propertyType") || baseRequestForm.propertyType,
      sleepingCapacity: searchParams.get("sleepingCapacity") ?? "",
      propertyConstraints: searchParams.get("propertyConstraints") ?? baseRequestForm.propertyConstraints,
      city: searchParams.get("city") ?? baseRequestForm.city,
      postalCode: searchParams.get("postalCode") ?? baseRequestForm.postalCode,
      budgetMax: searchParams.get("budgetMax") ?? "",
      currency: searchParams.get("requestCurrency") ?? "EUR",
    };
    const nextEditingAlertId = searchParams.get("alertId");
    const hasRequestPrefill = Boolean(
        nextRequestForm.title ||
        nextRequestForm.description ||
        nextRequestForm.housingId ||
        nextRequestForm.propertyName ||
        nextRequestForm.city ||
        nextRequestForm.postalCode ||
        nextRequestForm.budgetMax,
    );

    if (!hasExplicitUrlFilters && !hasOwnerConciergeSearchCriteria(hydratedFilters)) {
      hydratedFromUrlRef.current = true;
      setEditingAlertId(nextEditingAlertId);
      setFilters(hydratedFilters);
      setRequestForm(hasRequestPrefill ? nextRequestForm : baseRequestForm);
      return;
    }

    hydratedFromUrlRef.current = true;
    setEditingAlertId(nextEditingAlertId);
    setRequestForm(nextRequestForm);
    setFilters(hydratedFilters);
    setHasSubmittedSearch(true);
    void search(hydratedFilters).then((nextItems) => {
      setSelectedConciergeIds((previous) => searchParams.has("selectedConciergeIds")
        ? restoreSelectedConcierges(new URLSearchParams(searchParams.toString()), nextItems)
        : previous.filter((id) => nextItems.some((item) => item.id === id)));
    });
  }, [filters, isStaySearchMode, profileDefaultsReady, profileRequestDefaults, profileSearchDefaults, search, searchParams, stayNeedParam]);

  useEffect(() => {
    if (!stayContext) return;
    const hydrationKey = `${stayContext.reservationId}:${stayContext.stayNeed}`;
    if (hydratedStayContextRef.current === hydrationKey) return;
    hydratedStayContextRef.current = hydrationKey;

    const periodLabel = formatStayPeriod(stayContext.checkInAt, stayContext.checkOutAt);
    setRequestForm((prev) => ({
      ...prev,
      requestType: "ponctuel",
      ownerGoal: "one_off_quote",
      collaborationType: "one_off",
      frequency: "once",
      responsibilityLevel: "low",
      title: prev.title || stayContext.stayNeedLabel,
      propertyName: stayContext.propertyLabel ?? prev.propertyName,
      desiredDate: stayContext.checkInAt ? stayContext.checkInAt.slice(0, 10) : prev.desiredDate,
      description:
        prev.description ||
        [
          `Demande liée au séjour ${stayContext.reservationId}.`,
          stayContext.propertyLabel ? `Logement : ${stayContext.propertyLabel}.` : null,
          periodLabel ? `Dates : ${periodLabel}.` : null,
          `Prestation à pourvoir : ${stayContext.stayNeedLabel}.`,
        ]
          .filter(Boolean)
          .join("\n"),
    }));

    setFilters((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(stayContext.stayNeedLabel)
        ? prev.selectedServices
        : [stayContext.stayNeedLabel, ...prev.selectedServices],
    }));
  }, [stayContext]);

  useEffect(() => {
    if (!feedback || lastToastMessageRef.current === feedback) return;
    lastToastMessageRef.current = feedback;
    toast.success(feedback, {
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  }, [feedback]);

  useEffect(() => {
    if (!error || lastToastMessageRef.current === error) return;
    lastToastMessageRef.current = error;
    toast.error(error, {
      position: "top-right",
      autoClose: 4500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  }, [error]);

  function openRequestComposer() {
    requestReturnFocusRef.current =
      typeof document !== "undefined" && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setRequestComposerOpen(true);
  }

  function closeRequestComposer() {
    setRequestComposerOpen(false);
    window.setTimeout(() => requestReturnFocusRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!requestComposerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => focusFirstModalElement(requestPanelRef.current), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRequestComposer();
        return;
      }

      trapFocusInModal(event, requestPanelRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestComposerOpen]);

  function clearResults() {
    clear();
    setSelectedConciergeIds([]);
  }

  function toggleService(serviceLabel: string) {
    const service = resolvePlanetLSServiceSlug(serviceLabel) ?? serviceLabel;
    updateFilters(
      "selectedServices",
      service === GUEST_CHECKIN_CHECKOUT_BUNDLE
        ? toggleGuestCheckinCheckoutSelection(filters.selectedServices)
        : toggleOwnerConciergeValue(filters.selectedServices, service),
    );
  }

  function changeGuestCheckinCheckoutMode(
    mode: "arrival_departure" | "arrival_only" | "departure_only",
  ) {
    updateFilters(
      "selectedServices",
      replaceGuestCheckinCheckoutServices(filters.selectedServices, mode),
    );
  }

  function toggleServiceSection(category: string) {
    setOpenServiceSections((prev) => ({
      ...prev,
      [category]: !(prev[category] ?? true),
    }));
  }

  function resetFilters() {
    const baseRequestForm: RequestFormState = {
      ...initialRequestForm,
      ...profileRequestDefaults,
    };
    setFilters({
      ...initialFilters,
      ...profileSearchDefaults,
    });
    touchedFilterKeysRef.current.clear();
    setHasSubmittedSearch(false);
    setFeedback(null);
    setError(null);
    setRequestForm(baseRequestForm);
    setEditingAlertId(null);
    setLastSubmittedStatus(null);
    setLastSentSummary(null);
    lastToastMessageRef.current = null;
    clearResults();
    router.replace("/dashboard/owner/concierges");
  }

  function handleCreateAlert() {
    try {
      const result = upsertOwnerConciergeSearchAlert(editingAlertId, {
        city: /^\d{4,6}$/.test(filters.city.trim()) ? "" : filters.city,
        postalCode: /^\d{4,6}$/.test(filters.city.trim()) ? filters.city : "",
        budgetMax: filters.budgetMax,
        radiusKm: filters.radiusKm,
      });
      setFeedback(
        result.created
          ? editingAlertId
            ? "Alerte mise à jour. Vous la retrouverez dans vos alertes propriétaire."
            : "Alerte créée. Vous la retrouverez dans vos alertes propriétaire."
          : "Une alerte existe déjà pour cette ville. Vous la retrouverez dans vos alertes propriétaire.",
      );
      if (editingAlertId) {
        setEditingAlertId(result.alert.id);
        router.replace("/dashboard/owner/concierges");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'alerte.");
    }
  }

  function replaceSearchUrl(nextFilters: OwnerConciergeSearchFilters) {
    const params = new URLSearchParams(searchParams.toString());
    SEARCH_URL_KEYS.forEach((key) => params.delete(key));
    const nextSearchParams = buildOwnerConciergeSearchParams(nextFilters, {
      preserveEmptyServiceFamilies: touchedFilterKeysRef.current.has("selectedServiceFamilies") || searchParams.has("serviceFamilies"),
      preserveEmptyServices: touchedFilterKeysRef.current.has("selectedServices") || searchParams.has("services") || searchParams.has("service"),
      preserveEmptyCity: touchedFilterKeysRef.current.has("city") || searchParams.has("city") || searchParams.has("postalCode"),
      preserveEmptyRadius: touchedFilterKeysRef.current.has("radiusKm") || searchParams.has("radiusKm"),
    });
    nextSearchParams.forEach((value, key) => params.set(key, value));
    const query = params.toString();
    router.replace(`/dashboard/owner/concierges${query ? `?${query}` : ""}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setHasSubmittedSearch(true);
    setConsultedConciergeId(null);
    replaceSearchUrl(filters);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    void search(filters).then((nextItems) => {
      setSelectedConciergeIds((prev) => prev.filter((id) => nextItems.some((item) => item.id === id)));
    });
  }

  function toggleConciergeSelection(itemId: string) {
    if (items.find((item) => item.id === itemId)?.professional_type === "provider") return;
    setSelectedConciergeIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
    setFeedback(null);
    setLastSentSummary(null);
    setError(null);
  }

  async function handleSendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (existingHousingRequestIsBlocking && existingHousingRequest) {
      setError("Ce logement a déjà une demande. Complétez ou suivez la demande existante.");
      closeRequestComposer();
      router.push(`/dashboard/owner/demandes?request=${encodeURIComponent(existingHousingRequest.id)}`);
      return;
    }

    if (selectedConciergeIds.length === 0) {
      setError("Sélectionnez au moins un concierge avant d'envoyer une demande.");
      return;
    }

    if (!requestForm.title.trim()) {
      setError("Ajoutez un titre a votre demande.");
      return;
    }

    // Les filtres servent à la recherche ; seules les prestations
    // précises ou les groupes reconnus sont transmis à l'API.
    // Une catégorie ne sélectionne jamais toute une famille.
    const requestServiceResolution = resolvePlanetLSIndividualRequestServices(
      filters.selectedServices,
    );
    if (requestServiceResolution.services.length === 0) {
      setError(
        requestServiceResolution.unknownValues.length > 0
          ? `Ces filtres ne correspondent pas à une prestation du catalogue : ${requestServiceResolution.unknownValues.join(", ")}. Sélectionnez une prestation précise.`
          : "Précisez au moins une prestation individuelle dans le catalogue avant de finaliser votre demande.",
      );
      return;
    }

    try {
      setSubmittingRequest(true);
      setError(null);
      setFeedback(null);

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_type: requestForm.requestType,
            owner_goal: requestForm.ownerGoal,
            collaboration_type: requestForm.collaborationType,
            collaboration_frequency: requestForm.frequency,
            collaboration_duration: requestForm.estimatedDuration.trim() || null,
            responsibility_level: requestForm.responsibilityLevel,
            request_summary: buildServiceRequestBrief({
              ownerGoal: requestForm.ownerGoal,
              collaborationType: requestForm.collaborationType,
              frequency: requestForm.frequency,
              estimatedDuration: requestForm.estimatedDuration,
              responsibilityLevel: requestForm.responsibilityLevel,
              city: requestForm.city,
              propertyName: requestForm.propertyName,
              propertyAddress: requestForm.propertyAddress,
              propertyType: requestForm.propertyType,
              sleepingCapacity: requestForm.sleepingCapacity,
              propertyConstraints: requestForm.propertyConstraints,
              requestedServices: requestServiceResolution.entries.map((entry) => entry.label),
              desiredDate: requestForm.desiredDate,
              urgency: requestForm.urgency,
              description: requestForm.description,
            }).summary,
            housing_id: requestForm.housingId || null,
            property_name: requestForm.propertyName.trim() || null,
            property_address: requestForm.propertyAddress.trim() || null,
            property_type: requestForm.propertyType.trim() || null,
            sleeping_capacity: requestForm.sleepingCapacity.trim() || null,
            property_constraints: requestForm.propertyConstraints.trim() || null,
            title: requestForm.title.trim(),
            description: requestForm.description.trim(),
            requested_services: requestServiceResolution.services,
            ...(getGuestCheckinCheckoutRequestMetadata(
              requestServiceResolution.services,
            )
              ? {
                  service_modalities:
                    getGuestCheckinCheckoutRequestMetadata(
                      requestServiceResolution.services,
                    ),
                }
              : {}),
            region: filters.region?.trim() || null,
            city: requestForm.city.trim(),
            postal_code: requestForm.postalCode.trim(),
            desired_date: requestForm.desiredDate || null,
            radius_km: filters.radiusKm ? Number(filters.radiusKm) : null,
          urgency: requestForm.urgency,
          budget_max: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
          currency: requestForm.currency,
          recipient_ids: selectedConciergeIds,
          reservation_id: stayContext?.reservationId ?? null,
          stay_need: stayContext?.stayNeed ?? null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer votre demande.");
      }

      const recipientNames = selectedConcierges.map((item) => item.display_name);
      setFeedback(
        `Votre demande a bien été envoyée à ${selectedConciergeIds.length} concierge(s).`,
      );
      setLastSubmittedStatus("NEW");
      setLastSentSummary({
        title: requestForm.title.trim(),
        city: requestForm.city.trim(),
        recipients: recipientNames,
      });
      setSelectedConciergeIds([]);
      setRequestForm({
        ...initialRequestForm,
        ...profileRequestDefaults,
        city: /^\d{4,6}$/.test(filters.city.trim()) ? "" : filters.city,
        postalCode: /^\d{4,6}$/.test(filters.city.trim()) ? filters.city : "",
      });
      await loadOwnerRequests();
      closeRequestComposer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer votre demande.");
      requestPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmittingRequest(false);
    }
  }

  const filtersLabel = [filters.city.trim()].filter(Boolean).join(" · ");
  const warningMessage = warning ? getOwnerSearchWarningMessage(warning) : null;

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <ToastContainer newestOnTop position="top-right" />
        <SearchFilters
          styles={styles}
          filters={filters}
          propertyTypeOptions={propertyTypeOptions}
          loading={loading}
          viewMode={viewMode}
          isStaySearchMode={isStaySearchMode}
          stayNeedLabel={stayContext?.stayNeedLabel ?? (stayNeedParam ? stayNeedLabels[stayNeedParam] : null)}
          onSubmit={handleSubmit}
          onReset={resetFilters}
          onViewModeChange={setViewMode}
          onFilterChange={updateFilters}
          onToggleService={toggleService}
          getCitySuggestions={getOwnerCitySuggestions}
          parseSliderValue={parseSliderValue}
        />

        <nav className={styles.workspaceNavigation} aria-label="Accès aux résultats de recherche">
          <a href="#professional-results">Résultats · {items.length}</a>
          <a href="#professional-map">Voir la carte</a>
          <a href="#professional-selection">Ma sélection · {selectedConciergeIds.length}</a>
        </nav>
        <div className={styles.mobileSelectionBar} data-empty={selectedConciergeIds.length === 0}>
          <div className={styles.mobileSelectionCopy}>
            <a href="#professional-selection">Ma sélection · {selectedConciergeIds.length}</a>
          </div>
          <Button
            type="button"
            variant="primary"
            className={styles.primaryBtn}
            disabled={selectedConciergeIds.length === 0 || existingHousingRequestIsBlocking}
            onClick={openRequestComposer}
          >
            {isStaySearchMode ? "Demander cette prestation" : "Préparer ma demande"}
          </Button>
        </div>

        <div className={styles.contentLayout}>
          <div className={styles.resultsColumn} ref={resultsRef} id="professional-results" tabIndex={-1}>
            {isStaySearchMode ? (
              <section className={styles.staySearchContext} aria-label="Contexte de recherche lié au séjour">
                <div>
                  <p className={styles.eyebrow}>Séjour</p>
                  <h2>Trouver un professionnel pour ce séjour</h2>
                </div>
                {stayContextLoading ? <span className={styles.tagMuted}>Chargement du séjour...</span> : null}
                {stayContextError ? <span className={styles.tagMuted}>{stayContextError}</span> : null}
                {stayContext ? (
                  <div className={styles.stayContextFacts}>
                    {stayContext.propertyLabel ? <span>{stayContext.propertyLabel}</span> : null}
                    {formatStayPeriod(stayContext.checkInAt, stayContext.checkOutAt) ? (
                      <span>{formatStayPeriod(stayContext.checkInAt, stayContext.checkOutAt)}</span>
                    ) : null}
                    <span>{stayContext.stayNeedLabel}</span>
                  </div>
                ) : null}
                <div className={styles.stayCriteriaLine}>
                  <span>{filters.city.trim() || "Localisation à préciser"}</span>
                  <span>{filters.radiusKm.trim() ? `${filters.radiusKm.trim()} km` : "Rayon libre"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    Modifier les critères
                  </Button>
                </div>
              </section>
            ) : null}
            <ResultsHeader
              styles={styles}
              loading={loading}
              hasSubmittedSearch={hasSubmittedSearch}
              itemsCount={items.length}
              summary={resultsSummary}
              sortMode={sortMode}
              viewMode={viewMode}
              onSortModeChange={setSortMode}
              onViewModeChange={setViewMode}
            />
            {warning ? (
              <div className={styles.searchNotice} role="status">
                <p>{warningMessage}</p>
                {warningMessage !== warning ? <details><summary>Détails de localisation</summary><p>{warning}</p></details> : null}
              </div>
            ) : null}
            <ResultsGrid
              styles={styles}
              loading={loading}
              error={error}
              hasSubmittedSearch={hasSubmittedSearch}
              hasSearchCriteria={hasSearchCriteria}
              filtersLabel={filtersLabel}
              filters={filters}
              items={sortedItems}
              selectedIds={selectedIdSet}
              consultedId={consultedConciergeId}
              profileReturnTo={profileReturnTo}
              viewMode={viewMode}
              onToggleSelection={toggleConciergeSelection}
              onCreateAlert={handleCreateAlert}
              resultMode={isStaySearchMode ? "stay" : "standard"}
              stayActionLabel="Demander cette prestation"
            />
          </div>

          <aside className={styles.sidebar}>
            <section className={styles.mapPanel} id="professional-map" tabIndex={-1} aria-label="Carte des professionnels">
              <div className={styles.mapPanelHeader}>
                <div>
                  <p className={styles.eyebrow}>Carte</p>
                  <h2 className={styles.requestTitle}>Zone de recherche</h2>
                </div>
                <span className={styles.tagMuted}>
                  {filters.radiusKm.trim() ? `${filters.radiusKm.trim()} km` : "Rayon libre"}
                </span>
              </div>
              <div className={styles.mapFrame}>
                {!loading && !error && mapCenter && mapProfiles.length > 0 ? (
                  <SearchMap
                    center={mapCenter}
                    radiusKm={appliedRadiusKm}
                    selectedId={consultedConciergeId}
                    onSelect={setConsultedConciergeId}
                    profiles={mapProfiles}
                    profileReturnTo={profileReturnTo}
                    fitAllProfiles
                    ariaLabel="Carte des professionnels trouvés"
                  />
                ) : (
                  <div className={styles.mapEmpty} role={error ? "alert" : "status"}>
                    <strong>{mapFeedback.title}</strong>
                    <span>{mapFeedback.description}</span>
                  </div>
                )}
              </div>
            </section>
            <div className={styles.requestDock} id="professional-selection" tabIndex={-1} data-empty={selectedConciergeIds.length === 0}>
              <div className={styles.requestHeader}>
                <div>
                  <p className={styles.eyebrow}>Ma sélection</p>
                  <h2 className={styles.requestTitle}>Concierges sélectionnées</h2>
                </div>
                <span className={styles.selectionCount}>{selectedConciergeIds.length}</span>
              </div>
              {selectedConcierges.length > 0 ? <p className={styles.requestIntro}>
                {isStaySearchMode
                  ? "Sélectionnez la concierge à qui demander cette prestation."
                  : "Sélectionnez les concierges que vous souhaitez contacter."}
              </p> : null}
              {existingHousingRequestIsBlocking && existingHousingRequest ? (
                <div className={styles.existingRequestNotice} role="status">
                  <div>
                    <strong>Demande déjà ouverte</strong>
                    <span>{existingHousingRequest.property_name || requestForm.propertyName || "Logement sélectionné"}</span>
                  </div>
                  <ButtonLink
                    href={buildOwnerRequestActionHref(existingHousingRequest)}
                    variant="secondary"
                    className={styles.secondaryBtn}
                  >
                    {getOwnerRequestActionLabel(existingHousingRequest)}
                  </ButtonLink>
                </div>
              ) : null}
              <div className={styles.selectionPreview}>
                {selectedConcierges.length > 0 ? (
                  <div className={styles.selectionRows}>
                    {selectedConcierges.map((item) => (
                      <div key={item.id} className={styles.selectionRow}>
                        <ConciergeAvatar
                          src={item.avatar_url}
                          alt={item.display_name}
                          width={42}
                          height={42}
                          className={styles.selectionAvatar}
                        />
                        <div className={styles.selectionInfo}>
                          <strong>{item.display_name}</strong>
                          <span>{item.city || item.service_area || item.location || "Zone à préciser"}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={styles.selectionRemove}
                          onClick={() => toggleConciergeSelection(item.id)}
                          aria-label={`Retirer ${item.display_name} de la sélection`}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.selectionEmpty}>Sélectionnez une concierge dans les résultats pour préparer votre demande.</p>
                )}
              </div>
              <div className={styles.selectionActions}>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.primaryBtn}
                  disabled={selectedConciergeIds.length === 0 || existingHousingRequestIsBlocking}
                  onClick={openRequestComposer}
                >
                  {isStaySearchMode ? "Demander cette prestation" : "Préparer ma demande"}
                </Button>
                <ButtonLink href="/dashboard/owner/demandes" variant="secondary" className={styles.secondaryBtn}>
                  Mes demandes
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>

        {requestComposerOpen ? (
          <div className={styles.modalOverlay} onMouseDown={closeRequestComposer}>
            <section
              ref={requestPanelRef}
              className={styles.requestModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="owner-request-composer-title"
              tabIndex={-1}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.eyebrow}>Demande</p>
                  <h2 id="owner-request-composer-title" className={styles.requestTitle}>
                    {isStaySearchMode ? "Demander cette prestation" : "Préparer ma demande"}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.secondaryBtn}
                  onClick={closeRequestComposer}
                >
                  Fermer
                </Button>
              </div>
              {existingHousingRequestIsBlocking && existingHousingRequest ? (
                <div className={styles.existingRequestNotice} role="status">
                  <div>
                    <strong>Une demande existe déjà pour ce logement</strong>
                    <span>{existingHousingRequest.title}</span>
                  </div>
                  <ButtonLink
                    href={buildOwnerRequestActionHref(existingHousingRequest)}
                    variant="secondary"
                    className={styles.secondaryBtn}
                  >
                    {getOwnerRequestActionLabel(existingHousingRequest)}
                  </ButtonLink>
                </div>
              ) : null}
              <RequestPanel
                styles={styles}
                selectedConcierges={selectedConcierges}
                selectedServices={filters.selectedServices}
                selectedCategories={filters.selectedCategories}
                visibleServicesByCategory={catalogServicesByCategory}
                openServiceSections={openServiceSections}
                activeSearchSummary={activeSearchSummary}
                requestForm={requestForm}
                submittingRequest={submittingRequest}
                requestFeedback={feedback}
                requestError={error}
                lastSubmittedStatus={lastSubmittedStatus}
                lastSentSummary={lastSentSummary}
                stayContext={
                  stayContext
                    ? {
                        reservationId: stayContext.reservationId,
                        stayNeedLabel: stayContext.stayNeedLabel,
                        propertyLabel: stayContext.propertyLabel,
                        periodLabel: formatStayPeriod(stayContext.checkInAt, stayContext.checkOutAt),
                      }
                    : null
                }
                onSubmit={handleSendRequest}
                onRequestFormChange={updateRequestForm}
                onToggleService={toggleService}
                onCheckinCheckoutModeChange={changeGuestCheckinCheckoutMode}
                onToggleServiceSection={toggleServiceSection}
                getCitySuggestions={getOwnerCitySuggestions}
              />
            </section>
          </div>
        ) : null}

      </div>
    </section>
  );
}
