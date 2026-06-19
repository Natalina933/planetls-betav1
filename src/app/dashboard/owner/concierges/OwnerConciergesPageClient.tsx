"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  CheckCircle2,
  Clock3,
  FilePenLine,
  FileText,
  Handshake,
  MapPin,
  PartyPopper,
  Search as SearchIcon,
  Send,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import styles from "./OwnerConciergesPage.module.scss";
import type { ServiceCatalogItem, SortMode, ViewMode } from "./conciergeSearchTypes";
import {
  createConciergeComparator,
  getActiveSearchSummary,
  mergeSortedOptions,
} from "./conciergeSearchUtils";
import { useOwnerConciergeSearch } from "./useOwnerConciergeSearch";
import {
  buildOwnerConciergeFilterOptions,
  hasOwnerConciergeSearchCriteria,
  toggleOwnerConciergeValue,
  type OwnerConciergeSearchFilters,
} from "./searchHelpers";
import { getOwnerCitySuggestions } from "./locationSuggestions";
import { upsertOwnerConciergeSearchAlert } from "../searchAlerts";
import { ResultsGrid, ResultsHeader, RequestPanel, SearchFilters } from "@/features/owner-concierges/components";
import { ConciergeAvatar } from "@/features/owner-concierges/components/ConciergeAvatar";
import { OwnerJourneyRail } from "@/features/owner-dashboard";
import { CONCIERGE_PROPERTY_TYPES } from "@/features/shared/data/propertyTypes";
import type { RequestWorkflowStatus } from "@/app/lib/requestStatus";
import {
  buildServiceRequestBrief,
  getServiceRequestBriefDefaults,
  inferRequestTypeFromCollaboration,
} from "@/app/lib/serviceRequestBrief";
import type { RequestFormState } from "@/features/owner-concierges/types";
import { buildOwnerRequestFormDefaults, getOwnerProfilePreferences } from "@/features/owner-preferences/profilePreferences";
import { focusFirstModalElement, trapFocusInModal } from "../modalAccessibility";

const initialFilters: OwnerConciergeSearchFilters = {
  region: "",
  city: "",
  selectedCategories: [],
  selectedServices: [],
  propertyType: "",
  budgetMax: "",
  radiusKm: "",
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
};

function parseSliderValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

function formatOwnerRequestStatus(request: OwnerServiceRequestRow) {
  const status = getOwnerRequestStatus(request);
  if (status === "accepted") return "Devis accepté";
  if (status === "discussion") return "En discussion";
  if (status === "viewed") return "Consultée";
  if (status === "sent") return "Envoyée";
  if (status === "declined") return "Refusée";
  if (status === "expired") return "Expirée";
  return "Brouillon";
}

function getQuoteCount(request: OwnerServiceRequestRow) {
  return (request.recipients ?? []).filter((recipient) => {
    const quoteStatus = normalizeStatus(recipient.quote_status);
    return Boolean(recipient.quote_id) || quoteStatus === "sent" || quoteStatus === "accepted" || quoteStatus === "quoted";
  }).length;
}

function getAcceptedConcierge(request: OwnerServiceRequestRow) {
  const selectedRecipient = (request.recipients ?? []).find((recipient) => normalizeStatus(recipient.status) === "selected");
  return {
    id: request.selected_concierge_profile_id || selectedRecipient?.concierge_profile_id || null,
    name: request.selected_concierge_name || selectedRecipient?.concierge_name || "Concierge retenu",
    avatarUrl: request.selected_concierge_avatar_url || selectedRecipient?.concierge_avatar_url || null,
  };
}

function isRequestWaitingForReply(request: OwnerServiceRequestRow) {
  return ["sent", "viewed"].includes(getOwnerRequestStatus(request)) && getQuoteCount(request) === 0;
}

function getOwnerRequestActionLabel(request: OwnerServiceRequestRow) {
  const status = getOwnerRequestStatus(request);
  if (status === "draft") return "Compléter";
  if (status === "accepted") return request.mission_id ? "Voir la mission" : "Confier une mission";
  if (getQuoteCount(request) > 0) return "Comparer les devis";
  if (isRequestWaitingForReply(request)) return "Relancer / alerte";
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
  const [filters, setFilters] = useState<OwnerConciergeSearchFilters>(initialFilters);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("available");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [requestComposerOpen, setRequestComposerOpen] = useState(false);
  const [selectedConciergeIds, setSelectedConciergeIds] = useState<string[]>([]);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [ownerRequestsLoading, setOwnerRequestsLoading] = useState(true);
  const [openServiceSections, setOpenServiceSections] = useState<Record<string, boolean>>({});
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [lastSubmittedStatus, setLastSubmittedStatus] = useState<RequestWorkflowStatus | null>(null);
  const [lastSentSummary, setLastSentSummary] = useState<{
    title: string;
    city: string;
    recipients: string[];
  } | null>(null);
  const [profileRequestDefaults, setProfileRequestDefaults] = useState<Partial<RequestFormState>>({});
  const [profileDefaultsReady, setProfileDefaultsReady] = useState(false);
  const { items, loading, error, serverOptions, search, clear, setError } = useOwnerConciergeSearch();
  const hydratedFromUrlRef = useRef(false);
  const requestPanelRef = useRef<HTMLElement | null>(null);
  const requestReturnFocusRef = useRef<HTMLElement | null>(null);
  const lastToastMessageRef = useRef<string | null>(null);

  const selectedIdSet = useMemo(() => new Set(selectedConciergeIds), [selectedConciergeIds]);
  const stats = useMemo(
    () =>
      items.reduce(
        (accumulator, item) => ({
          totalPro: accumulator.totalPro + Number(item.is_pro),
          totalAvailable: accumulator.totalAvailable + Number(item.is_available_now === true),
        }),
        { totalPro: 0, totalAvailable: 0 },
      ),
    [items],
  );
  const clientOptions = useMemo(() => buildOwnerConciergeFilterOptions(items), [items]);

  const selectedConcierges = useMemo(
    () => items.filter((item) => selectedIdSet.has(item.id)),
    [items, selectedIdSet],
  );

  const sortedItems = useMemo(() => {
    const ranked = [...items];
    ranked.sort(createConciergeComparator(sortMode));
    return ranked;
  }, [items, sortMode]);

  const serviceOptions = useMemo(
    () => mergeSortedOptions(serverOptions.services, clientOptions.services),
    [clientOptions.services, serverOptions.services],
  );
  const catalogServicesByCategory = useMemo(() => {
    const groups = new Map<string, Set<string>>();

    serviceCatalog.forEach((item) => {
      const category = item.category.trim();
      const service = item.service.trim();

      if (!category || !service) return;
      if (!groups.has(category)) groups.set(category, new Set<string>());
      groups.get(category)?.add(service);
    });

    return Array.from(groups.entries())
      .map(([category, services]) => ({
        category,
        services: Array.from(services).sort((left, right) => left.localeCompare(right, "fr")),
      }))
      .sort((left, right) => left.category.localeCompare(right.category, "fr"));
  }, [serviceCatalog]);
  const categoriesByService = useMemo(() => {
    const nextMap = new Map<string, string>();
    serviceCatalog.forEach((item) => {
      nextMap.set(item.service, item.category);
    });
    return nextMap;
  }, [serviceCatalog]);
  const categoryOptions = useMemo(() => {
    if (catalogServicesByCategory.length > 0) {
      return catalogServicesByCategory.map((group) => group.category);
    }

    const serviceDerived = serviceOptions
      .map((service) => categoriesByService.get(service))
      .filter((value): value is string => Boolean(value));
    return mergeSortedOptions(serverOptions.categories, serviceDerived);
  }, [catalogServicesByCategory, categoriesByService, serverOptions.categories, serviceOptions]);
  const visibleServicesByCategory = useMemo(() => {
    if (catalogServicesByCategory.length > 0) {
      return filters.selectedCategories
        .map((category) => catalogServicesByCategory.find((group) => group.category === category))
        .filter(
          (
            group,
          ): group is {
            category: string;
            services: string[];
          } => Boolean(group),
        );
    }

    const allowedServices = new Set(serviceOptions);
    return filters.selectedCategories
      .map((category) => ({
        category,
        services: serviceCatalog
          .filter((item) => category === item.category && allowedServices.has(item.service))
          .map((item) => item.service)
          .sort((left, right) => left.localeCompare(right, "fr")),
      }))
      .filter((group) => group.services.length > 0);
  }, [catalogServicesByCategory, filters.selectedCategories, serviceCatalog, serviceOptions]);

  const propertyTypeOptions = useMemo(
    () => Array.from(CONCIERGE_PROPERTY_TYPES),
    [],
  );

  const activeSearchSummary = useMemo(() => getActiveSearchSummary(filters), [filters]);
  const hasSearchCriteria = useMemo(() => hasOwnerConciergeSearchCriteria(filters), [filters]);
  const requestFollowUp = useMemo(() => {
    const activeRequests = ownerRequests.filter((request) =>
      ["draft", "sent", "viewed", "discussion"].includes(getOwnerRequestStatus(request)),
    );
    const acceptedRequests = ownerRequests.filter((request) => getOwnerRequestStatus(request) === "accepted");
    const draftRequests = ownerRequests.filter((request) => getOwnerRequestStatus(request) === "draft");
    const unansweredRequests = ownerRequests.filter(isRequestWaitingForReply);
    const totalQuotes = ownerRequests.reduce((total, request) => total + getQuoteCount(request), 0);
    const latestRequests = [...ownerRequests]
      .sort((left, right) => new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime())
      .slice(0, 4);
    const nextRequest =
      [...ownerRequests]
        .filter((request) => !["declined", "expired"].includes(getOwnerRequestStatus(request)))
        .sort((left, right) => {
          const rank = (request: OwnerServiceRequestRow) => {
            const status = getOwnerRequestStatus(request);
            if (status === "draft") return 0;
            if (getQuoteCount(request) > 0 && status !== "accepted") return 1;
            if (isRequestWaitingForReply(request)) return 2;
            if (status === "accepted") return 3;
            return 4;
          };
          const rankDiff = rank(left) - rank(right);
          if (rankDiff !== 0) return rankDiff;
          return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime();
        })[0] ?? null;
    const acceptedRequest = acceptedRequests[0] ?? null;
    const acceptedConcierge = acceptedRequest ? getAcceptedConcierge(acceptedRequest) : null;

    return {
      activeRequests,
      acceptedRequests,
      draftRequests,
      unansweredRequests,
      totalQuotes,
      latestRequests,
      nextRequest,
      acceptedRequest,
      acceptedConcierge,
    };
  }, [ownerRequests]);
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

  function updateFilters<Key extends keyof OwnerConciergeSearchFilters>(
    key: Key,
    value: OwnerConciergeSearchFilters[Key],
  ) {
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

        const defaults = buildOwnerRequestFormDefaults(
          getOwnerProfilePreferences(payload.availability_hours),
        );

        if (!cancelled) {
          setProfileRequestDefaults(defaults);
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

  useEffect(() => {
    let cancelled = false;

    async function loadServiceCatalog() {
      try {
        const response = await fetch("/api/services/services-catalog", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as ServiceCatalogItem[];
        if (!cancelled) {
          setServiceCatalog(Array.isArray(payload) ? payload : []);
          if (Array.isArray(payload)) {
            setOpenServiceSections(
              payload.reduce<Record<string, boolean>>((acc, item) => {
                acc[item.category] = true;
                return acc;
              }, {}),
            );
          }
        }
      } catch {
        if (!cancelled) {
          setServiceCatalog([]);
        }
      }
    }

    void loadServiceCatalog();
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
    const nextFilters: OwnerConciergeSearchFilters = {
      region: searchParams.get("region") ?? "",
      city: searchParams.get("city") ?? searchParams.get("postalCode") ?? "",
      selectedCategories: (searchParams.get("categories") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      selectedServices: (searchParams.get("services") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      propertyType: searchParams.get("propertyType") ?? "",
      budgetMax: searchParams.get("budgetMax") ?? "",
      radiusKm: searchParams.get("radiusKm") ?? "",
      proOnly: searchParams.get("proOnly") === "1",
    };
    const nextRequestForm: RequestFormState = {
      ...baseRequestForm,
      requestType:
        searchParams.get("requestType") === "renfort" || searchParams.get("requestType") === "durable"
          ? (searchParams.get("requestType") as RequestFormState["requestType"])
          : baseRequestForm.requestType,
      ownerGoal:
        (searchParams.get("ownerGoal") as RequestFormState["ownerGoal"] | null) ??
        baseRequestForm.ownerGoal,
      collaborationType:
        (searchParams.get("collaborationType") as RequestFormState["collaborationType"] | null) ??
        baseRequestForm.collaborationType,
      frequency:
        (searchParams.get("frequency") as RequestFormState["frequency"] | null) ??
        baseRequestForm.frequency,
      estimatedDuration: searchParams.get("estimatedDuration") ?? baseRequestForm.estimatedDuration,
      responsibilityLevel:
        (searchParams.get("responsibilityLevel") as RequestFormState["responsibilityLevel"] | null) ??
        baseRequestForm.responsibilityLevel,
      title: searchParams.get("requestTitle") ?? "",
      description: searchParams.get("requestDescription") ?? baseRequestForm.description,
      housingId: searchParams.get("housingId") ?? "",
      propertyName: searchParams.get("propertyName") ?? "",
      propertyAddress: searchParams.get("propertyAddress") ?? "",
      propertyType: searchParams.get("propertyType") ?? baseRequestForm.propertyType,
      sleepingCapacity: searchParams.get("sleepingCapacity") ?? "",
      propertyConstraints: searchParams.get("propertyConstraints") ?? "",
      city: searchParams.get("city") ?? "",
      postalCode: searchParams.get("postalCode") ?? "",
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

    const hasUrlFilters = hasOwnerConciergeSearchCriteria(nextFilters);
    if (!hasUrlFilters) {
      hydratedFromUrlRef.current = true;
      setEditingAlertId(nextEditingAlertId);
      setRequestForm(hasRequestPrefill ? nextRequestForm : baseRequestForm);
      return;
    }

    hydratedFromUrlRef.current = true;
    setEditingAlertId(nextEditingAlertId);
    setRequestForm(nextRequestForm);
    setFilters(nextFilters);
    setHasSubmittedSearch(true);
    void search(nextFilters);
  }, [profileDefaultsReady, profileRequestDefaults, search, searchParams]);

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

  function toggleCategory(categoryLabel: string) {
    setFilters((prev) => {
      const nextCategories = toggleOwnerConciergeValue(prev.selectedCategories, categoryLabel);
      const nextServices = prev.selectedServices.filter((service) => {
        const serviceCategory = categoriesByService.get(service);
        return !serviceCategory || nextCategories.includes(serviceCategory);
      });

      return {
        ...prev,
        selectedCategories: nextCategories,
        selectedServices: nextServices,
      };
    });
  }

  function toggleService(serviceLabel: string) {
    updateFilters("selectedServices", toggleOwnerConciergeValue(filters.selectedServices, serviceLabel));
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
    setFilters(initialFilters);
    setHasSubmittedSearch(false);
    setFeedback(null);
    setError(null);
    setMobileFiltersOpen(false);
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setHasSubmittedSearch(true);
    setMobileFiltersOpen(false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    void search(filters).then((nextItems) => {
      setSelectedConciergeIds((prev) => prev.filter((id) => nextItems.some((item) => item.id === id)));
    });
  }

  function toggleConciergeSelection(itemId: string) {
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
              requestedServices:
                filters.selectedServices.length > 0 ? filters.selectedServices : filters.selectedCategories,
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
            requested_services:
              filters.selectedServices.length > 0 ? filters.selectedServices : filters.selectedCategories,
            region: filters.region?.trim() || null,
            city: requestForm.city.trim(),
            postal_code: requestForm.postalCode.trim(),
            desired_date: requestForm.desiredDate || null,
            radius_km: filters.radiusKm ? Number(filters.radiusKm) : null,
          urgency: requestForm.urgency,
          budget_max: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
          currency: requestForm.currency,
          recipient_ids: selectedConciergeIds,
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
      setMobileFiltersOpen(false);
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
  const activeRegion = filters.region?.trim() ?? "";
  const cockpitMetrics = [
    {
      label: "Résultats",
      value: `${items.length}`,
      detail: hasSubmittedSearch ? `${stats.totalAvailable} disponible(s)` : "À lancer",
      progress: hasSubmittedSearch ? (items.length > 0 ? Math.min(100, 24 + items.length * 12) : 8) : 0,
      Icon: SearchIcon,
    },
    {
      label: "Zone",
      value: filters.radiusKm.trim() ? `${filters.radiusKm} km` : "Libre",
      detail: filters.city.trim() || activeRegion || "Ville à préciser",
      progress: filters.city.trim() || activeRegion ? 100 : 0,
      Icon: MapPin,
    },
    {
      label: "Sélection",
      value: `${selectedConciergeIds.length}`,
      detail: selectedConciergeIds.length > 0 ? "À contacter" : "Aucun profil",
      progress: selectedConciergeIds.length > 0 ? Math.min(100, selectedConciergeIds.length * 25) : 0,
      Icon: CheckCircle2,
    },
    {
      label: "Devis",
      value: `${requestFollowUp.totalQuotes}`,
      detail:
        requestFollowUp.acceptedRequests.length > 0
          ? `${requestFollowUp.acceptedRequests.length} accepté(s)`
          : "À recevoir",
      progress: requestFollowUp.totalQuotes > 0 ? Math.min(100, 30 + requestFollowUp.totalQuotes * 25) : 0,
      Icon: FileText,
    },
  ];

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <ToastContainer newestOnTop position="top-right" />
        <OwnerJourneyRail activeStep={selectedConciergeIds.length > 0 ? "selection" : "search"} />
        <section className={styles.cockpitStrip} aria-label="Pilotage recherche concierge">
          {cockpitMetrics.map((metric) => (
            <article key={metric.label} className={styles.cockpitCard}>
              <span
                className={styles.cockpitChart}
                style={{ "--progress": `${Math.max(0, Math.min(100, metric.progress)) * 3.6}deg` } as React.CSSProperties}
                aria-hidden="true"
              >
                <metric.Icon size={18} strokeWidth={2.2} />
              </span>
              <span className={styles.cockpitMeta}>
                <span className={styles.cockpitLabel}>{metric.label}</span>
                <strong className={styles.cockpitValue}>{metric.value}</strong>
                <span className={styles.cockpitDetail}>{metric.detail}</span>
              </span>
            </article>
          ))}
        </section>
        <SearchFilters
          styles={styles}
          filters={filters}
          propertyTypeOptions={propertyTypeOptions}
          categoryOptions={categoryOptions}
          visibleServicesByCategory={visibleServicesByCategory}
          openServiceSections={openServiceSections}
          loading={loading}
          viewMode={viewMode}
          onSubmit={handleSubmit}
          onReset={resetFilters}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          onViewModeChange={setViewMode}
          onFilterChange={updateFilters}
          onToggleCategory={toggleCategory}
          onToggleService={toggleService}
          onToggleServiceSection={toggleServiceSection}
          getCitySuggestions={getOwnerCitySuggestions}
          parseSliderValue={parseSliderValue}
        />

        <div className={styles.contentLayout}>
          <div className={styles.resultsColumn} ref={resultsRef}>
            <ResultsHeader
              styles={styles}
              loading={loading}
              hasSubmittedSearch={hasSubmittedSearch}
              itemsCount={items.length}
              sortMode={sortMode}
              viewMode={viewMode}
              onSortModeChange={setSortMode}
              onViewModeChange={setViewMode}
            />
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
              viewMode={viewMode}
              onToggleSelection={toggleConciergeSelection}
              onCreateAlert={handleCreateAlert}
            />
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.requestDock}>
              <div>
                <p className={styles.eyebrow}>Short-list</p>
                <h2 className={styles.requestTitle}>Préparer une demande</h2>
              </div>
              <p className={styles.requestIntro}>
                Sélectionnez les concierges à contacter, puis envoyez un brief court et exploitable.
              </p>
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
              <div className={styles.selectionSummary}>
                <span className={styles.requestSectionLabel}>Sélection</span>
                <strong>{selectedConciergeIds.length} concierge(s) sélectionné(s)</strong>
                {selectedConcierges.length > 0 ? (
                  <div className={styles.summaryChips}>
                    {selectedConcierges.slice(0, 4).map((item) => (
                      <span key={item.id} className={styles.summaryChip}>
                        {item.display_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.tagMuted}>Sélectionnez un profil dans les résultats.</span>
                )}
              </div>
              <Button
                type="button"
                variant="primary"
                className={styles.primaryBtn}
                disabled={selectedConciergeIds.length === 0 || existingHousingRequestIsBlocking}
                onClick={openRequestComposer}
              >
                Lancer la recherche
              </Button>
              <ButtonLink href="/dashboard/owner/demandes" variant="secondary" className={styles.secondaryBtn}>
                Suivre mes demandes
              </ButtonLink>
            </div>

            <div className={styles.followUpPanel}>
              <div className={styles.followUpHeader}>
                <div>
                  <p className={styles.eyebrow}>Suivi</p>
                  <h2 className={styles.requestTitle}>Demandes concierge</h2>
                </div>
                <ButtonLink href="/dashboard/owner/demandes" variant="secondary" className={styles.secondaryBtn}>
                  Ouvrir
                </ButtonLink>
              </div>

              <div className={styles.followUpMetrics}>
                <div className={styles.followUpMetric}>
                  <FilePenLine size={16} aria-hidden="true" />
                  <span>Brouillons</span>
                  <strong>{requestFollowUp.draftRequests.length}</strong>
                </div>
                <div className={styles.followUpMetric}>
                  <Clock3 size={16} aria-hidden="true" />
                  <span>Sans réponse</span>
                  <strong>{requestFollowUp.unansweredRequests.length}</strong>
                </div>
                <div className={styles.followUpMetric}>
                  <FileText size={16} aria-hidden="true" />
                  <span>Devis</span>
                  <strong>{requestFollowUp.totalQuotes}</strong>
                </div>
                <div className={styles.followUpMetric}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>Validées</span>
                  <strong>{requestFollowUp.acceptedRequests.length}</strong>
                </div>
              </div>

              {requestFollowUp.nextRequest ? (
                <article className={styles.followUpNextAction}>
                  <div>
                    <span>Prochaine action</span>
                    <strong>{requestFollowUp.nextRequest.title}</strong>
                    <small>
                      {formatOwnerRequestStatus(requestFollowUp.nextRequest)}
                      {requestFollowUp.nextRequest.property_name ? ` · ${requestFollowUp.nextRequest.property_name}` : ""}
                    </small>
                  </div>
                  <ButtonLink
                    href={buildOwnerRequestActionHref(requestFollowUp.nextRequest)}
                    variant="secondary"
                    className={styles.secondaryBtn}
                  >
                    {getOwnerRequestActionLabel(requestFollowUp.nextRequest)}
                  </ButtonLink>
                </article>
              ) : null}

              {!ownerRequestsLoading && ownerRequests.length === 0 ? (
                <article className={styles.firstRequestCard}>
                  <div className={styles.confettiMark} aria-hidden="true">
                    <PartyPopper size={20} />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div>
                    <strong>Première demande de conciergerie</strong>
                    <p>
                      Choisissez les services utiles, contactez les bons profils, puis gardez la date du devis accepté
                      comme anniversaire de collaboration.
                    </p>
                  </div>
                </article>
              ) : requestFollowUp.acceptedRequest && requestFollowUp.acceptedConcierge ? (
                <article className={styles.acceptedConciergeCard}>
                  <div className={styles.acceptedConciergeTop}>
                    <ConciergeAvatar
                      src={requestFollowUp.acceptedConcierge.avatarUrl}
                      alt={requestFollowUp.acceptedConcierge.name}
                      width={44}
                      height={44}
                      className={styles.acceptedConciergeAvatar}
                    />
                    <div>
                      <span>Devis accepté</span>
                      <strong>{requestFollowUp.acceptedConcierge.name}</strong>
                    </div>
                  </div>
                  <p>{requestFollowUp.acceptedRequest.title}</p>
                  <div className={styles.followUpChips}>
                    {requestFollowUp.acceptedRequest.property_name ? (
                      <span>{requestFollowUp.acceptedRequest.property_name}</span>
                    ) : null}
                    {requestFollowUp.acceptedRequest.city ? <span>{requestFollowUp.acceptedRequest.city}</span> : null}
                    <span>Partenaire retenu</span>
                  </div>
                  <ButtonLink
                    href={buildOwnerRequestActionHref(requestFollowUp.acceptedRequest)}
                    variant="primary"
                    className={styles.primaryBtn}
                  >
                    {getOwnerRequestActionLabel(requestFollowUp.acceptedRequest)}
                  </ButtonLink>
                  {requestFollowUp.acceptedConcierge.id ? (
                    <ButtonLink
                      href={`/concierges/${encodeURIComponent(requestFollowUp.acceptedConcierge.id)}`}
                      variant="secondary"
                      className={styles.secondaryBtn}
                    >
                      Voir la fiche concierge
                    </ButtonLink>
                  ) : null}
                </article>
              ) : (
                <div className={styles.followUpEmpty}>
                  <Handshake size={18} aria-hidden="true" />
                  <span>Aucun devis accepté pour le moment.</span>
                </div>
              )}

              <div className={styles.followUpList}>
                <div className={styles.followUpListHeader}>
                  <span>Dernières demandes</span>
                  {ownerRequestsLoading ? <small>Chargement...</small> : null}
                </div>
                {requestFollowUp.latestRequests.length > 0 ? (
                  requestFollowUp.latestRequests.map((request) => (
                    <article className={styles.followUpRequestRow} key={request.id}>
                      <Send size={15} aria-hidden="true" />
                      <div>
                        <strong>{request.title}</strong>
                        <span>
                          {formatOwnerRequestStatus(request)}
                          {getQuoteCount(request) > 0 ? ` · ${getQuoteCount(request)} devis` : ""}
                        </span>
                      </div>
                      <ButtonLink
                        href={buildOwnerRequestActionHref(request)}
                        variant="secondary"
                        size="sm"
                        className={styles.followUpRowAction}
                      >
                        {getOwnerRequestActionLabel(request)}
                      </ButtonLink>
                    </article>
                  ))
                ) : !ownerRequestsLoading && ownerRequests.length === 0 ? (
                  <p className={styles.followUpEmptyText}>La première recherche apparaîtra ici.</p>
                ) : (
                  <p className={styles.followUpEmptyText}>Aucune demande envoyée.</p>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.mobileSelectionBar}>
          <div className={styles.mobileSelectionCopy}>
            <strong>{selectedConciergeIds.length} concierge(s) sélectionné(s)</strong>
            <span>
              {selectedConciergeIds.length > 0
                ? "Finalisez votre brief ou ajustez votre sélection."
                : "Ajoutez des profils pour envoyer une demande."}
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            className={styles.primaryBtn}
            disabled={selectedConciergeIds.length === 0 || existingHousingRequestIsBlocking}
            onClick={openRequestComposer}
          >
            Lancer la recherche
          </Button>
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
                  <p className={styles.eyebrow}>Recherche concierge</p>
                  <h2 id="owner-request-composer-title" className={styles.requestTitle}>
                    Lancer une recherche concierge
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
                activeSearchSummary={activeSearchSummary}
                requestForm={requestForm}
                submittingRequest={submittingRequest}
                requestFeedback={feedback}
                requestError={error}
                lastSubmittedStatus={lastSubmittedStatus}
                lastSentSummary={lastSentSummary}
                onSubmit={handleSendRequest}
                onRequestFormChange={updateRequestForm}
                getCitySuggestions={getOwnerCitySuggestions}
              />
            </section>
          </div>
        ) : null}

        {mobileFiltersOpen ? (
          <div className={styles.mobileDrawerBackdrop} onClick={() => setMobileFiltersOpen(false)}>
            <div
              className={styles.mobileDrawer}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Filtres de recherche"
            >
              <div className={styles.mobileDrawerHeader}>
                <div>
                  <p className={styles.eyebrow}>Filtres</p>
                  <h2 className={styles.requestTitle}>Affinez votre recherche</h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.secondaryBtn}
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Fermer
                </Button>
              </div>
              <div className={styles.mobileDrawerBody}>
                <SearchFilters
                  styles={styles}
                  mode="compact"
                  filters={filters}
                  propertyTypeOptions={propertyTypeOptions}
                  categoryOptions={categoryOptions}
                  visibleServicesByCategory={visibleServicesByCategory}
                  openServiceSections={openServiceSections}
                  loading={loading}
                  viewMode={viewMode}
                  onSubmit={handleSubmit}
                  onReset={resetFilters}
                  onOpenMobileFilters={() => setMobileFiltersOpen(true)}
                  onViewModeChange={setViewMode}
                  onFilterChange={updateFilters}
                  onToggleCategory={toggleCategory}
                  onToggleService={toggleService}
                  onToggleServiceSection={toggleServiceSection}
                  getCitySuggestions={getOwnerCitySuggestions}
                  parseSliderValue={parseSliderValue}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

