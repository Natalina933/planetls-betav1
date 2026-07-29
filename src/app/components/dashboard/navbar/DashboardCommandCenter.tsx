"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Command,
  Filter,
  LayoutDashboard,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import styles from "./DashboardCommandCenter.module.scss";

type CommandKind = "route" | "action" | "favorite" | "recent";
type CommandFilter = "all" | "actions" | "favorites" | "recent";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  description: string;
  kind: CommandKind;
  keywords?: string[];
};

type StoredRecentItem = {
  id: string;
  label: string;
  href: string;
  at: string;
};

type Props = {
  role?: string | null;
  pathname?: string | null;
  pageTitle: string;
};

const FAVORITES_KEY = "planetls.dashboard.favorites";
const RECENTS_KEY = "planetls.dashboard.recents";
const COMMAND_FILTERS: Array<{ value: CommandFilter; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "actions", label: "Actions" },
  { value: "favorites", label: "Favoris" },
  { value: "recent", label: "Recents" },
];

const BASE_ROUTES: CommandItem[] = [
  {
    id: "dashboard-home",
    label: "Accueil dashboard",
    href: "/dashboard",
    description: "Revenir au point d entree du tableau de bord.",
    kind: "route",
    keywords: ["home", "tableau", "accueil"],
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/dashboard/notifications",
    description: "Voir les alertes et retours importants.",
    kind: "route",
    keywords: ["alertes", "messages", "retours"],
  },
];

const ROLE_ROUTES: Record<string, CommandItem[]> = {
  owner: [
    route("owner-home", "Cockpit propriétaire", "/dashboard/owner", "Priorités, logements et arbitrages du jour."),
    route("owner-logements", "Logements", "/dashboard/owner/logements/overview", "Parc, annonces et documents."),
    route("owner-planning", "Planning", "/dashboard/owner/planning", "Arrivées, départs, maintenance et validations."),
    route("owner-demandes", "Demandes", "/dashboard/owner/demandes", "Demandes envoyées et devis reçus."),
    route("owner-devis", "Devis", "/dashboard/owner/devis", "Comparer et valider les propositions."),
    route("owner-factures", "Factures", "/dashboard/owner/factures", "Règlements et facturation."),
    route("owner-messages", "Messages", "/dashboard/owner/messages", "Conversations avec les partenaires."),
  ],
  concierge: [
    route("concierge-home", "Dashboard concierge", "/dashboard/concierge", "KPI, missions, revenus et priorités."),
    route("concierge-planning", "Planning", "/dashboard/concierge/planning", "Journée, tournées et missions à cadrer."),
    route("concierge-missions", "Centre des missions", "/dashboard/concierge/missions", "Missions, preuves, checklist et historique."),
    route("concierge-sejours", "Voyageurs et séjours", "/dashboard/concierge/sejours", "Arrivées, départs, préparation et incidents voyageurs."),
    route("concierge-maintenance", "Maintenance + artisans", "/dashboard/concierge/maintenance", "Incidents, photos, devis, facture et trace."),
    route("concierge-equipe", "Équipe", "/dashboard/concierge/equipe", "Disponibilités, rôles et attribution."),
    route("concierge-finances", "Finances", "/dashboard/concierge/finances/overview", "Commissions, objectifs et rentabilité."),
    route("concierge-crm", "CRM propriétaires", "/dashboard/concierge/contacts", "Relations actives, revenus et timeline."),
    route("concierge-messages", "Messages", "/dashboard/concierge/messages", "Conversations propriétaires."),
  ],
  provider: [
    route("provider-home", "Dashboard artisan", "/dashboard/provider", "Demandes, interventions et messages."),
    route("provider-interventions", "Interventions", "/dashboard/provider/interventions", "Missions terrain et statuts."),
    route("provider-planning", "Planning", "/dashboard/provider/planning", "Disponibilité et interventions prévues."),
    route("provider-devis", "Devis", "/dashboard/provider/devis", "Propositions et factures."),
    route("provider-messages", "Messages", "/dashboard/provider/messages", "Conversations clients."),
  ],
  admin: [
    route("admin-home", "Vue plateforme", "/dashboard/admin", "Pilotage global PlanetLS."),
    route(
      "admin-business",
      "Pilotage business et financier",
      "/dashboard/admin/pilotage",
      "Croissance, activation, pipeline et tension financiere.",
    ),
    route("admin-control", "Contrôle détaillé", "/dashboard/admin/controle", "Risques, qualité et signaux faibles."),
    route("admin-users", "Utilisateurs", "/dashboard/admin/utilisateurs", "Comptes et rôles."),
    route("admin-artisans", "Artisans", "/dashboard/admin/artisans", "Profils prestataires."),
  ],
};

function route(id: string, label: string, href: string, description: string): CommandItem {
  return { id, label, href, description, kind: "route", keywords: [label, href] };
}

function normalizeRole(role?: string | null) {
  const value = String(role ?? "").toLowerCase();
  if (value.includes("owner") || value.includes("propriétaire")) return "owner";
  if (value.includes("concierge")) return "concierge";
  if (value.includes("provider") || value.includes("artisan")) return "provider";
  if (value.includes("admin")) return "admin";
  return "owner";
}

function safeJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getQuickActions(role: string): CommandItem[] {
  if (role === "concierge") {
    return [
      action("qa-concierge-mission", "Nouvelle mission", "/dashboard/concierge/missions", "Créer ou cadrer une mission terrain."),
      action("qa-concierge-stay", "Préparer un séjour", "/dashboard/concierge/sejours", "Voir les arrivées, départs et blocages."),
      action("qa-concierge-incident", "Traiter un incident", "/dashboard/concierge/maintenance", "Ouvrir le workflow maintenance."),
      action("qa-concierge-owner", "Ouvrir le CRM", "/dashboard/concierge/contacts", "Retrouver un propriétaire actif."),
      action("qa-concierge-billing", "Créer devis ou facture", "/dashboard/concierge/billing", "Passer au suivi financier."),
    ];
  }
  if (role === "owner") {
    return [
      action("qa-owner-request", "Demander un service", "/dashboard/owner/demandes", "Lancer une demande à une conciergerie."),
      action("qa-owner-stay", "Ajouter un séjour", "/dashboard/owner/missions/voyageurs", "Transformer une réservation en missions."),
      action("qa-owner-invoice", "Vérifier les factures", "/dashboard/owner/factures", "Voir les paiements à traiter."),
      action("qa-owner-message", "Répondre aux messages", "/dashboard/owner/messages", "Ouvrir les conversations actives."),
    ];
  }
  if (role === "provider") {
    return [
      action("qa-provider-intervention", "Voir les interventions", "/dashboard/provider/interventions", "Prioriser les missions terrain."),
      action("qa-provider-planning", "Ouvrir le planning", "/dashboard/provider/planning", "Vérifier les créneaux."),
      action("qa-provider-message", "Répondre aux messages", "/dashboard/provider/messages", "Traiter les demandes clients."),
    ];
  }
  return [
    action(
      "qa-admin-business",
      "Ouvrir le pilotage business",
      "/dashboard/admin/pilotage",
      "Suivre l'activation, le pipeline et la tension financiere.",
    ),
    action("qa-admin-control", "Contrôle plateforme", "/dashboard/admin/controle", "Surveiller les opérations."),
    action("qa-admin-users", "Gérer les utilisateurs", "/dashboard/admin/utilisateurs", "Vérifier les comptes actifs."),
  ];
}

function action(id: string, label: string, href: string, description: string): CommandItem {
  return { id, label, href, description, kind: "action", keywords: [label, href, "quick action"] };
}

function itemMatches(item: CommandItem, query: string) {
  if (!query) return true;
  const haystack = [item.label, item.description, item.href, ...(item.keywords ?? [])].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function DashboardCommandCenter({ role, pathname, pageTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CommandFilter>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<StoredRecentItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const roleKey = normalizeRole(role);

  const routeItems = useMemo(() => [...BASE_ROUTES, ...(ROLE_ROUTES[roleKey] ?? [])], [roleKey]);
  const quickActions = useMemo(() => getQuickActions(roleKey), [roleKey]);
  const favoriteItems = useMemo(
    () => routeItems.filter((item) => favorites.includes(item.id)).map((item) => ({ ...item, kind: "favorite" as const })),
    [favorites, routeItems],
  );
  const recentCommandItems = useMemo(
    () =>
      recentItems.map((item) => ({
        id: `recent-${item.id}`,
        label: item.label,
        href: item.href,
        description: "Ouvert recemment",
        kind: "recent" as const,
        keywords: [item.href],
      })),
    [recentItems],
  );

  const allItems = useMemo(
    () => [...quickActions, ...favoriteItems, ...recentCommandItems, ...routeItems],
    [favoriteItems, quickActions, recentCommandItems, routeItems],
  );

  const filteredItems = useMemo(() => {
    const byFilter = allItems.filter((item) => {
      if (filter === "actions") return item.kind === "action";
      if (filter === "favorites") return item.kind === "favorite";
      if (filter === "recent") return item.kind === "recent";
      return true;
    });

    return byFilter
      .filter((item, index, source) => source.findIndex((entry) => entry.href === item.href && entry.label === item.label) === index)
      .filter((item) => itemMatches(item, query))
      .slice(0, 12);
  }, [allItems, filter, query]);

  useEffect(() => {
    setFavorites(safeJsonArray<string>(localStorage.getItem(FAVORITES_KEY)));
    setRecentItems(safeJsonArray<StoredRecentItem>(localStorage.getItem(RECENTS_KEY)).slice(0, 6));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !pathname) return;
    const routeItem = routeItems.find((item) => item.href === pathname);
    const label = routeItem?.label || pageTitle || "Dashboard";
    const next: StoredRecentItem = {
      id: pathname,
      label,
      href: pathname,
      at: new Date().toISOString(),
    };
    setRecentItems((current) => {
      const merged = [next, ...current.filter((item) => item.href !== pathname)].slice(0, 6);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, [hydrated, pageTitle, pathname, routeItems]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (!isTyping && event.key === "/") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  const navigateTo = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [router],
  );

  const toggleFavorite = useCallback((item: CommandItem) => {
    const next = favorites.includes(item.id)
      ? favorites.filter((favoriteId) => favoriteId !== item.id)
      : [item.id, ...favorites].slice(0, 8);
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }, [favorites]);

  return (
    <div className={styles.commandCenter}>
      <button
        type="button"
        className={styles.commandTrigger}
        onClick={() => setOpen(true)}
        aria-label="Ouvrir la recherche globale"
      >
        <Search size={17} aria-hidden="true" />
        <span>Rechercher</span>
        <kbd>âŒ˜K</kbd>
      </button>

      {open ? (
        <div className={styles.overlay} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.palette}
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.searchRow}>
              <Command size={18} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une page, action, favori..."
                aria-label="Rechercher dans le dashboard"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer la recherche">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.filters} aria-label="Filtres de recherche">
              <Filter size={15} aria-hidden="true" />
              {COMMAND_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={filter === item.value ? styles.activeFilter : ""}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.quickStrip} aria-label="Actions rapides">
              {quickActions.slice(0, 4).map((item) => (
                <button key={item.id} type="button" onClick={() => navigateTo(item)}>
                  <Zap size={15} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.results}>
              {!hydrated ? (
                <CommandSkeleton />
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const sourceItem = routeItems.find((entry) => entry.href === item.href) ?? item;
                  const isFavorite = favorites.includes(sourceItem.id);
                  return (
                    <div key={`${item.kind}-${item.id}-${item.href}`} className={styles.resultItem}>
                      <button type="button" className={styles.resultMain} onClick={() => navigateTo(item)}>
                        <span className={styles.resultIcon}>{getKindIcon(item.kind)}</span>
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteButtonActive : ""}`}
                        onClick={() => toggleFavorite(sourceItem)}
                        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Star size={16} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <Sparkles size={26} aria-hidden="true" />
                  <strong>Aucun résultat net</strong>
                  <p>Essayez un terme plus court, ou ouvrez une action rapide pour repartir du bon endroit.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function getKindIcon(kind: CommandKind) {
  if (kind === "action") return <Plus size={17} aria-hidden="true" />;
  if (kind === "favorite") return <Star size={17} aria-hidden="true" />;
  if (kind === "recent") return <Clock3 size={17} aria-hidden="true" />;
  return <LayoutDashboard size={17} aria-hidden="true" />;
}

function CommandSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Chargement des actions">
      {[0, 1, 2, 3].map((item) => (
        <span key={item} />
      ))}
    </div>
  );
}






