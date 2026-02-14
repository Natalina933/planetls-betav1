//src/app/components/dashboard/navbar/DashboardNavbar.tsx
"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  concierge: "Conciergerie",
  concierge_pro: "Conciergerie PRO",
  providence: "Providence",
  providence_pro: "Providence PRO",
} as const;

const DEFAULT_COMPANY_NAME = "Ma conciergerie";
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
  notificationCount = 0 
}: DashboardNavbarProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useCurrentUser();

  // Memoized values
  const isPro = useMemo(() => user?.role?.endsWith("_pro"), [user?.role]);
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);
  
  // User display values
  const avatarSrc = user?.avatar_url || AVATAR_FALLBACK;
  const userName = user?.username || user?.email?.split('@')[0] || "Utilisateur";
  const companyName = user?.company_name || DEFAULT_COMPANY_NAME;
  const greetingName = user?.firstName || user?.username || "vous";
  const timeBasedGreeting = getTimeBasedGreeting();

  // Navigation handlers
  const handleProfileClick = useCallback(() => {
    router.push("/dashboard/profile");
  }, [router]);

  const handleNotificationClick = useCallback(() => {
    router.push("/dashboard/notifications");
  }, [router]);

  const handleMenuClick = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  // Notification badge display
  const notificationBadge = notificationCount > 9 ? "9+" : notificationCount.toString();
  const hasNotifications = notificationCount > 0;

  return (
    <header className={styles.dashNavbar} role="banner">
      {/* LEFT SECTION */}
      <div className={styles.leftSection}>
        <button
          type="button"
          onClick={handleMenuClick}
          className={styles.menuButton}
          aria-label="Ouvrir/Fermer le menu"
          aria-expanded="false"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <div className={styles.titleBlock}>
          {/* <span className={styles.logoText}>Tableau de bord</span> */}
          <span className={styles.userNameInline}> {userName}</span>
        </div>

        {roleLabel && (
          <div className={styles.userRole} aria-label={`Rôle: ${roleLabel}`}>
            <span>{roleLabel}</span>
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
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
            aria-label={`Notifications${hasNotifications ? `, ${notificationCount} non lues` : ''}`}
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
            <div 
              className={styles.avatarSkeleton} 
              role="status" 
              aria-label="Chargement du profil"
            />
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
              {/* Uncomment when implementing online status */}
              {/* <span className={styles.avatarStatus} aria-label="En ligne" /> */}
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