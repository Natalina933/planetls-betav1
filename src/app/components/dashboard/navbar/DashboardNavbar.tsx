"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, User, CheckCircle, Palette, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import {
  getOwnerReplySignature,
  getSeenOwnerReplySignatures,
  isOwnerReplyStatus,
  OWNER_SERVICE_REPLY_SEEN_EVENT,
} from "@/app/components/dashboard/notifications/serviceRequestNotifications";
import { useTheme, type Theme } from "@/app/providers/ThemeProvider";
import styles from "./DashboardNavbar.module.scss";

interface DashboardNavbarProps {
  toggleSidebar: () => void;
  notificationCount?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  kind: "mission" | "quote" | "search" | "message" | "alert" | "request";
}

type NotificationFilter = "all" | "mission" | "quote" | "search" | "message" | "request";

interface MessageNotificationRow {
  id: string;
  source?: string | null;
  subject?: string | null;
  counterpart_name?: string | null;
  last_message_preview?: string | null;
  unread_count?: number;
}

interface ProviderNotificationRow {
  id: string;
  subject?: string | null;
  counterpart_name?: string | null;
  last_message_preview?: string | null;
  unread?: number;
}

interface ConciergeServiceRequestRow {
  id: string;
  title?: string | null;
  description?: string | null;
  owner_name?: string | null;
  recipient_id: string;
  recipient_status?: string | null;
}

interface OwnerServiceRequestRow {
  id: string;
  title?: string | null;
  city?: string | null;
  recipients?: Array<{
    id?: string | null;
    status?: string | null;
    concierge_name?: string | null;
  }>;
}

const ROLE_LABELS = {
  owner: "Propriétaire",
  owner_pro: "Propriétaire PRO",
  concierge: "Concierge",
  concierge_pro: "Concierge PRO",
  provider: "Artisan",
  provider_pro: "Artisan PRO",
  artisan: "Artisan",
  artisan_pro: "Artisan PRO",
} as const;

const DEFAULT_COMPANY_NAME = "Mon espace";
const AVATAR_FALLBACK = "/icons/account-svgrepo-com.svg";

const getRoleLabel = (role?: string | null): string => {
  if (!role) return "Invite";
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS];
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
};

const getNotificationKindLabel = (kind: NotificationItem["kind"]) => {
  if (kind === "mission") return "Mission";
  if (kind === "quote") return "Devis";
  if (kind === "search") return "Recherche";
  if (kind === "request") return "Demande";
  if (kind === "alert") return "Alerte";
  return "Message";
};

const getMessageNotificationKind = (source?: string | null): NotificationItem["kind"] => {
  if (source === "mission") return "mission";
  if (source === "quote") return "quote";
  if (source === "search") return "search";
  return "message";
};

const getNotificationsPageHref = (role?: string | null) => {
  if (role === "owner" || role === "owner_pro") return "/dashboard/owner/alertes";
  if (role === "concierge" || role === "concierge_pro") return "/dashboard/concierge/alertes";
  if (
    role === "provider" ||
    role === "provider_pro" ||
    role === "artisan" ||
    role === "artisan_pro"
  ) {
    return "/dashboard/provider/messages";
  }
  return "/dashboard";
};

const getDashboardHomeHref = (role?: string | null) => {
  if (role === "owner" || role === "owner_pro") return "/dashboard/owner";
  if (role === "concierge" || role === "concierge_pro") return "/dashboard/concierge";
  if (
    role === "provider" ||
    role === "provider_pro" ||
    role === "artisan" ||
    role === "artisan_pro"
  ) {
    return "/dashboard/provider";
  }
  return "/dashboard";
};

const getProfileHref = (role?: string | null) => {
  if (role === "owner" || role === "owner_pro") return "/dashboard/owner/settings?tab=overview";
  if (role === "concierge" || role === "concierge_pro") return "/dashboard/concierge/profile?tab=overview";
  if (
    role === "provider" ||
    role === "provider_pro" ||
    role === "artisan" ||
    role === "artisan_pro"
  ) {
    return "/dashboard/provider/settings?tab=overview";
  }
  return "/dashboard";
};

const PAGE_LABELS: Record<string, string> = {
  owner: "Espace propriétaire",
  concierge: "Espace concierge",
  provider: "Espace artisan",
  messages: "Messages",
  alertes: "Alertes",
  planning: "Planning",
  factures: "Factures",
  devis: "Devis",
  logements: "Logements",
  contacts: "Contacts",
  conciergerie: "Conciergeries",
  recherche: "Recherche",
  demandes: "Demandes",
  objectifs: "Objectifs",
  settings: "Paramètres",
  profile: "Profil",
  clients: "Clients",
  interventions: "Interventions",
};

function formatPathSegment(segment: string) {
  const normalized = segment.trim().toLowerCase();
  if (!normalized) return "Dashboard";
  if (PAGE_LABELS[normalized]) return PAGE_LABELS[normalized];
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, " ");
}

export default function DashboardNavbar({
  toggleSidebar,
  notificationCount = 0,
}: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useCurrentUser();
  const [liveNotificationCount, setLiveNotificationCount] = useState(notificationCount);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("all");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, changeTheme, themes, labels, getCurrentLabel } = useTheme();

  const isPro = useMemo(() => user?.role?.endsWith("_pro"), [user?.role]);
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);

  const avatarSrc = user?.avatar_url || AVATAR_FALLBACK;
  const userName = user?.username || user?.email?.split("@")[0] || "Utilisateur";
  const companyName = user?.company_name || DEFAULT_COMPANY_NAME;
  const greetingName = user?.firstName || user?.username || "vous";
  const timeBasedGreeting = getTimeBasedGreeting();
  const userRole = user?.role ?? null;
  const notificationsPageHref = useMemo(() => getNotificationsPageHref(userRole), [userRole]);
  const dashboardHomeHref = useMemo(() => getDashboardHomeHref(userRole), [userRole]);
  const profileHref = useMemo(() => getProfileHref(userRole), [userRole]);
  const pageTitle = useMemo(() => {
    const segments = (pathname || "")
      .split("/")
      .filter(Boolean)
      .filter((segment) => segment !== "dashboard");

    if (segments.length === 0) return "Dashboard";

    const lastSegment = segments[segments.length - 1];
    if (/^\[.*\]$/.test(lastSegment) || /^[0-9a-f-]{6,}$/i.test(lastSegment)) {
      return formatPathSegment(segments[segments.length - 2] || "dashboard");
    }

    return formatPathSegment(lastSegment);
  }, [pathname]);

  const handleProfileClick = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setAccountMenuOpen((current) => !current);
  }, [isAuthenticated, router]);

  const handleAccountNavigate = useCallback(
    (href: string) => {
      setAccountMenuOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleLogout = useCallback(() => {
    setAccountMenuOpen(false);
    void signOut({ callbackUrl: "/" });
  }, []);

  const handleNotificationClick = useCallback(() => {
    setIsNotificationsOpen((current) => !current);
  }, []);

  const handleMenuClick = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  useEffect(() => {
    setLiveNotificationCount(notificationCount);
  }, [notificationCount]);

  useEffect(() => {
    if (!isAuthenticated || !userRole) {
      setLiveNotificationCount(notificationCount);
      setNotificationItems([]);
      return;
    }

    let cancelled = false;

    async function loadNotifications() {
      try {
        let nextCount = notificationCount;
        let nextItems: NotificationItem[] = [];

        if (userRole === "owner" || userRole === "owner_pro") {
          const [messageResponse, requestResponse] = await Promise.all([
            fetch("/api/messages/conversations?role=owner&limit=40", {
              cache: "no-store",
            }),
            fetch("/api/service-requests?limit=20", {
              cache: "no-store",
            }),
          ]);
          const [messagePayload, requestPayload] = await Promise.all([
            messageResponse.json(),
            requestResponse.json(),
          ]);

          const messageItems: NotificationItem[] = [];
          const requestItems: NotificationItem[] = [];
          let messageCount = 0;
          let requestCount = 0;

          if (messageResponse.ok) {
            messageCount = Number(messagePayload?.summary?.unread ?? 0);
            const rows: MessageNotificationRow[] = Array.isArray(messagePayload?.items)
              ? messagePayload.items
              : [];
            messageItems.push(
              ...rows
                .filter((item) => Number(item?.unread_count ?? 0) > 0)
                .slice(0, 6)
                .map((item) => ({
                  id: item.id,
                  title: item.counterpart_name || item.subject || "Nouvelle réponse",
                  description:
                    item.last_message_preview ||
                    "Une réponse est arrivée dans cette conversation.",
                  href: `/dashboard/owner/messages?conversation=${item.id}`,
                  count: Number(item.unread_count ?? 0),
                  kind: getMessageNotificationKind(item.source),
                })),
            );
          }

          if (requestResponse.ok) {
            const rows: OwnerServiceRequestRow[] = Array.isArray(requestPayload?.items)
              ? requestPayload.items
              : [];
            const seenReplySignatures = getSeenOwnerReplySignatures();
            const repliedRequests = rows.filter(
              (item) =>
                Array.isArray(item.recipients) &&
                item.recipients.some(
                  (recipient) => isOwnerReplyStatus(recipient.status),
                ),
            ).filter((item) => !seenReplySignatures.has(getOwnerReplySignature(item)));

            requestCount = repliedRequests.length;
            requestItems.push(
              ...repliedRequests.slice(0, 6).map((item) => {
                const repliedRecipient = item.recipients?.find(
                  (recipient) =>
                    recipient.status === "quoted" ||
                    recipient.status === "interested" ||
                    recipient.status === "declined",
                );
                const responseLabel =
                  repliedRecipient?.status === "quoted"
                    ? "Devis reçu"
                    : repliedRecipient?.status === "declined"
                      ? "Refus reçu"
                      : "Réponse reçue";

                return {
                  id: item.id,
                  title: repliedRecipient?.concierge_name || item.title || "Réponse concierge",
                  description: `${responseLabel}${item.city ? ` • ${item.city}` : ""}`,
                  href: "/dashboard/owner/demandes",
                  count: 1,
                  kind: repliedRecipient?.status === "quoted" ? "quote" : "request",
                } satisfies NotificationItem;
              }),
            );
          }

          nextCount = messageCount + requestCount;
          nextItems = [...requestItems, ...messageItems]
            .sort((left, right) => right.count - left.count)
            .slice(0, 6);
        } else if (userRole === "concierge" || userRole === "concierge_pro") {
          const [messageResponse, requestResponse] = await Promise.all([
            fetch("/api/messages/conversations?role=concierge&limit=40", {
              cache: "no-store",
            }),
            fetch("/api/service-requests?view=concierge&limit=20", {
              cache: "no-store",
            }),
          ]);

          const [messagePayload, requestPayload] = await Promise.all([
            messageResponse.json(),
            requestResponse.json(),
          ]);

          const messageItems: NotificationItem[] = [];
          const requestItems: NotificationItem[] = [];
          let messageCount = 0;
          let requestCount = 0;

          if (messageResponse.ok) {
            messageCount = Number(messagePayload?.summary?.unread ?? 0);
            const rows: MessageNotificationRow[] = Array.isArray(messagePayload?.items)
              ? messagePayload.items
              : [];
            messageItems.push(
              ...rows
                .filter((item) => Number(item?.unread_count ?? 0) > 0)
                .slice(0, 6)
                .map((item) => ({
                  id: item.id,
                  title: item.counterpart_name || item.subject || "Nouveau message",
                  description:
                    item.last_message_preview ||
                    "Un propriétaire a répondu ou envoyé un nouveau message.",
                  href: `/dashboard/concierge/messages?conversation=${item.id}`,
                  count: Number(item.unread_count ?? 0),
                  kind: getMessageNotificationKind(item.source),
                })),
            );
          }

          if (requestResponse.ok) {
            const rows: ConciergeServiceRequestRow[] = Array.isArray(requestPayload?.items)
              ? requestPayload.items
              : [];
            const pendingRequests = rows.filter(
              (item) => item.recipient_status === "sent" || item.recipient_status === "viewed",
            );

            requestCount = pendingRequests.length;
            requestItems.push(
              ...pendingRequests.slice(0, 6).map((item) => ({
                id: item.recipient_id,
                title: item.owner_name || item.title || "Nouvelle demande",
                description:
                  item.title ||
                  item.description ||
                  "Un propriétaire vous a envoyé une nouvelle demande.",
                href: "/dashboard/concierge/demandes",
                count: 1,
                kind: "request" as const,
              })),
            );
          }

          nextCount = messageCount + requestCount;
          nextItems = [...requestItems, ...messageItems]
            .sort((left, right) => right.count - left.count)
            .slice(0, 6);
        } else if (
          userRole === "provider" ||
          userRole === "provider_pro" ||
          userRole === "artisan" ||
          userRole === "artisan_pro"
        ) {
          const response = await fetch("/api/provider/messages", { cache: "no-store" });
          const payload = await response.json();
          if (response.ok) {
            nextCount = Number(payload?.summary?.unread ?? 0);
            const rows: ProviderNotificationRow[] = Array.isArray(payload?.items) ? payload.items : [];
            nextItems = rows
              .filter((item) => Number(item?.unread ?? 0) > 0)
              .slice(0, 6)
              .map((item) => ({
                id: item.id,
                title: item.counterpart_name || item.subject || "Nouveau message",
                description:
                  item.last_message_preview || "Un client vous a répondu dans ce fil.",
                href: `/dashboard/provider/messages?conversation=${item.id}`,
                count: Number(item.unread ?? 0),
                kind: "message" as const,
              }));
          }
        }

        if (!cancelled) {
          setLiveNotificationCount(nextCount);
          setNotificationItems(nextItems);
        }
      } catch {
        if (!cancelled) {
          setLiveNotificationCount(notificationCount);
          setNotificationItems([]);
        }
      }
    }

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, notificationCount, refreshTick, userRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOwnerRepliesSeen = () => {
      setRefreshTick((current) => current + 1);
    };

    window.addEventListener(OWNER_SERVICE_REPLY_SEEN_EVENT, handleOwnerRepliesSeen);
    return () => {
      window.removeEventListener(OWNER_SERVICE_REPLY_SEEN_EVENT, handleOwnerRepliesSeen);
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    if (themeMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [themeMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  const filteredNotificationItems = useMemo(() => {
    if (notificationFilter === "all") return notificationItems;
    return notificationItems.filter((item) => item.kind === notificationFilter);
  }, [notificationFilter, notificationItems]);

  const handleNotificationItemClick = useCallback((item: NotificationItem) => {
    setNotificationItems((current) => current.filter((entry) => entry.id !== item.id));
    setLiveNotificationCount((current) => Math.max(0, current - item.count));
    setIsNotificationsOpen(false);
  }, []);

  const notificationBadge = liveNotificationCount > 9 ? "9+" : liveNotificationCount.toString();
  const hasNotifications = liveNotificationCount > 0;

  return (
    <header className={styles.dashNavbar} role="banner">
      <div className={styles.leftSection}>
        <button
          type="button"
          onClick={handleMenuClick}
          className={styles.menuButton}
          aria-label="Ouvrir ou fermer le menu"
          aria-expanded="false"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <div className={styles.titleBlock}>
          <div className={styles.pageContext}>
            <span className={styles.pageTitle}>{pageTitle}</span>
            <span className={styles.userNameInline}>{userName}</span>
          </div>
        </div>

        {roleLabel && (
          <div className={styles.userRole} aria-label={`Role: ${roleLabel}`}>
            <span>{roleLabel}</span>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        <div className={styles.themeSwitcher} ref={themeMenuRef}>
          <button
            className={styles.themeTrigger}
            onClick={() => setThemeMenuOpen((prev) => !prev)}
            title="Changer de thème"
            aria-label="Changer de thème"
            type="button"
          >
            <Palette size={18} />
            <span className={styles.themeLabel}>{getCurrentLabel()}</span>
          </button>

          {themeMenuOpen && (
            <div className={styles.themeDropdown}>
              {Object.entries(themes).map(([key, value]) => (
                <button
                  key={key}
                  className={`${styles.themeOption} ${theme === value ? styles.active : ""}`}
                  onClick={() => {
                    changeTheme(value as Theme);
                    setThemeMenuOpen(false);
                  }}
                  aria-label={`Sélectionner thème ${labels[value as Theme]}`}
                  type="button"
                >
                  {labels[value as Theme]}
                </button>
              ))}
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className={styles.rightInfoBlock}>
            <div className={styles.greetingBlock}>
              <p className={styles.companyName}>{companyName}</p>
              <p className={styles.greeting}>
                {timeBasedGreeting} {greetingName}
              </p>
            </div>

            {isPro && (
              <div className={styles.proBadge} role="status" aria-label="Compte professionnel">
                <CheckCircle size={14} aria-hidden="true" />
                <span>PRO</span>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && (
          <div className={styles.notificationsWrapper} ref={notificationRef}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleNotificationClick}
              aria-label={`Notifications${hasNotifications ? `, ${liveNotificationCount} non lues` : ""}`}
              title="Voir les notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={20} aria-hidden="true" />
              {hasNotifications && (
                <span className={styles.notificationCount} aria-hidden="true">
                  {notificationBadge}
                </span>
              )}
            </button>

            {isNotificationsOpen ? (
              <div className={styles.notificationsPanel} role="dialog" aria-label="Notifications">
                <div className={styles.notificationsPanelHeader}>
                  <div>
                    <strong>Notifications</strong>
                    <p>{hasNotifications ? `${liveNotificationCount} retour(s) à traiter` : "Aucun nouveau retour"}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.notificationsPanelClose}
                    onClick={() => setIsNotificationsOpen(false)}
                    aria-label="Fermer les notifications"
                  >
                    Fermer
                  </button>
                </div>

                <div className={styles.notificationsList}>
                  <div className={styles.notificationFilters}>
                    {([
                      ["all", "Tout"],
                      ["request", "Demandes"],
                      ["mission", "Missions"],
                      ["quote", "Devis"],
                      ["message", "Messages"],
                      ["search", "Recherches"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.notificationFilterButton} ${
                          notificationFilter === value ? styles.notificationFilterButtonActive : ""
                        }`}
                        onClick={() => setNotificationFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {filteredNotificationItems.length > 0 ? (
                    filteredNotificationItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={styles.notificationItem}
                        onClick={() => handleNotificationItemClick(item)}
                      >
                        <div className={styles.notificationItemTopline}>
                          <span className={styles.notificationKind}>
                            {getNotificationKindLabel(item.kind)}
                          </span>
                          <span className={styles.notificationItemCount}>{item.count}</span>
                        </div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </Link>
                    ))
                  ) : (
                    <div className={styles.notificationEmpty}>
                      <strong>Rien d&apos;immédiat</strong>
                      <p>Les nouveaux messages, réponses et alertes apparaîtront ici.</p>
                    </div>
                  )}

                  <div className={styles.notificationsFooter}>
                    <button
                      type="button"
                      className={styles.notificationsFooterLink}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        router.push(notificationsPageHref);
                      }}
                    >
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className={styles.accountMenuWrapper} ref={accountMenuRef}>
        <button
          type="button"
          className={styles.userProfile}
          onClick={handleProfileClick}
          aria-label={`Menu du compte de ${userName}`}
          title={`Compte de ${userName}`}
          aria-haspopup="menu"
          aria-expanded={accountMenuOpen}
        >
          {loading ? (
            <div className={styles.avatarSkeleton} role="status" aria-label="Chargement du profil" />
          ) : isAuthenticated && user ? (
            <div className={styles.avatarWrapperOuter}>
              <Image
                src={avatarSrc}
                alt={`Avatar de ${userName}`}
                width={48}
                height={48}
                className={styles.avatar}
                priority
              />
            </div>
          ) : (
            <div className={styles.avatarPlaceholder} aria-label="Non connecté">
              <User size={22} aria-hidden="true" />
            </div>
          )}
        </button>

          {accountMenuOpen && isAuthenticated ? (
            <div className={styles.accountDropdown} role="menu" aria-label="Menu du compte">
              <div className={styles.accountHeader}>
                <strong className={styles.accountName}>{userName}</strong>
                {user?.email ? <span className={styles.accountEmail}>{user.email}</span> : null}
                <span className={styles.accountRole}>{roleLabel}</span>
              </div>

              <div className={styles.accountActions}>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.accountAction}
                  onClick={() => handleAccountNavigate(profileHref)}
                >
                  <UserCircle size={18} aria-hidden="true" />
                  <span>Mon profil</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.accountAction}
                  onClick={() => handleAccountNavigate(dashboardHomeHref)}
                >
                  <LayoutDashboard size={18} aria-hidden="true" />
                  <span>Mon espace</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.accountAction}
                  onClick={() => handleAccountNavigate(notificationsPageHref)}
                >
                  <Bell size={18} aria-hidden="true" />
                  <span>Notifications</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={`${styles.accountAction} ${styles.accountLogout}`}
                  onClick={handleLogout}
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
