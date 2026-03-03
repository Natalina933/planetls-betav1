"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, User, CheckCircle } from "lucide-react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import styles from "./DashboardNavbar.module.scss";

interface DashboardNavbarProps {
  toggleSidebar: () => void;
  notificationCount?: number;
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

const SECTION_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^\/dashboard\/owner\/messages/, label: "Suivi des échanges" },
  { pattern: /^\/dashboard\/owner\/objectifs/, label: "Objectifs de pilotage" },
  { pattern: /^\/dashboard\/owner\/planning/, label: "Suivi des interventions" },
  { pattern: /^\/dashboard\/owner\/factures/, label: "Suivi des factures" },
  { pattern: /^\/dashboard\/owner\/devis/, label: "Suivi des devis" },
  { pattern: /^\/dashboard\/owner\/documents/, label: "Documents et PDF" },
  { pattern: /^\/dashboard\/owner\/logements/, label: "Parc immobilier" },
  { pattern: /^\/dashboard\/owner\/conciergerie/, label: "Suivi de ma conciergerie" },
  { pattern: /^\/dashboard\/owner\/contacts/, label: "Contacts et échanges" },
  { pattern: /^\/dashboard\/owner\/alertes/, label: "Points d'attention" },
  { pattern: /^\/dashboard\/owner\/settings/, label: "Compte et préférences" },
  { pattern: /^\/dashboard\/owner$/, label: "Vue prioritaire" },
  { pattern: /^\/dashboard\/concierge\/messages/, label: "Suivi des conversations" },
  { pattern: /^\/dashboard\/concierge\/objectifs/, label: "Objectifs d'activité" },
  { pattern: /^\/dashboard\/concierge\/planning/, label: "Pilotage terrain" },
  { pattern: /^\/dashboard\/concierge\/billing/, label: "Facturation et revenus" },
  { pattern: /^\/dashboard\/concierge\/contacts/, label: "Contacts et relation" },
  { pattern: /^\/dashboard\/concierge\/alertes/, label: "Points d'attention" },
  { pattern: /^\/dashboard\/concierge\/settings/, label: "Compte et configuration" },
  { pattern: /^\/dashboard\/concierge\/stocks/, label: "Stocks et consommables" },
  { pattern: /^\/dashboard\/concierge$/, label: "Vue prioritaire" },
  { pattern: /^\/dashboard\/provider\/messages/, label: "Suivi des échanges" },
  { pattern: /^\/dashboard\/provider\/planning/, label: "Pilotage planning" },
  { pattern: /^\/dashboard\/provider\/clients/, label: "Suivi clients" },
  { pattern: /^\/dashboard\/provider\/interventions/, label: "Interventions" },
  { pattern: /^\/dashboard\/provider\/alertes/, label: "Points d'attention" },
  { pattern: /^\/dashboard\/provider\/settings/, label: "Compte et configuration" },
  { pattern: /^\/dashboard\/provider\/objectifs/, label: "Objectifs d'activité" },
  { pattern: /^\/dashboard\/provider$/, label: "Vue prioritaire" },
];

const DEFAULT_COMPANY_NAME = "Mon espace";
const AVATAR_FALLBACK = "/icons/account-svgrepo-com.svg";

const getRoleLabel = (role?: string | null): string => {
  if (!role) return "Invité";
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

export default function DashboardNavbar({
  toggleSidebar,
  notificationCount = 0,
}: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useCurrentUser();

  const isPro = useMemo(() => user?.role?.endsWith("_pro"), [user?.role]);
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);
  const sectionLabel = useMemo(() => {
    const match = SECTION_LABELS.find((item) => item.pattern.test(pathname || ""));
    return match?.label || "Dashboard";
  }, [pathname]);

  const avatarSrc = user?.avatar_url || AVATAR_FALLBACK;
  const userName = user?.username || user?.email?.split("@")[0] || "Utilisateur";
  const companyName = user?.company_name || DEFAULT_COMPANY_NAME;
  const greetingName = user?.firstName || user?.username || "vous";
  const timeBasedGreeting = getTimeBasedGreeting();

  const handleProfileClick = useCallback(() => {
    router.push("/dashboard/profile");
  }, [router]);

  const handleNotificationClick = useCallback(() => {
    router.push("/dashboard/notifications");
  }, [router]);

  const handleMenuClick = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const notificationBadge = notificationCount > 9 ? "9+" : notificationCount.toString();
  const hasNotifications = notificationCount > 0;

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
          <span className={styles.userNameInline}>{userName}</span>
          <span className={styles.sectionLabel}>{sectionLabel}</span>
        </div>

        {roleLabel && (
          <div className={styles.userRole} aria-label={`Role: ${roleLabel}`}>
            <span>{roleLabel}</span>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
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
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleNotificationClick}
            aria-label={`Notifications${hasNotifications ? `, ${notificationCount} non lues` : ""}`}
            title="Voir les notifications"
          >
            <Bell size={20} aria-hidden="true" />
            {hasNotifications && (
              <span className={styles.notificationCount} aria-hidden="true">
                {notificationBadge}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          className={styles.userProfile}
          onClick={handleProfileClick}
          aria-label={`Profil de ${userName}`}
          title={`Profil de ${userName}`}
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
      </div>
    </header>
  );
}
