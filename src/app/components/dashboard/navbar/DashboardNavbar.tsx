"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Bell, User, CheckCircle } from "lucide-react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import styles from "./DashboardNavbar.module.scss";

interface DashboardNavbarProps {
  toggleSidebar: () => void;
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

const getRoleLabel = (role?: string | null) =>
  role && role in ROLE_LABELS
    ? ROLE_LABELS[role as keyof typeof ROLE_LABELS]
    : role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "Invité";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
};

export default function DashboardNavbar({ toggleSidebar }: DashboardNavbarProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useCurrentUser();
  const notificationCount = 3; // TODO

  const isPro = useMemo(() => user?.role?.endsWith("_pro"), [user?.role]);
  const avatarSrc = user?.avatar_url || AVATAR_FALLBACK;
  const userName = user?.username || user?.username || "Utilisateur";
  const roleLabel = getRoleLabel(user?.role);
  const companyName = user?.company_name || DEFAULT_COMPANY_NAME;
  const greetingName = user?.firstName || user?.username || "vous";
  const timeBasedGreeting = useMemo(getTimeBasedGreeting, []);

  const handleProfileClick = useCallback(() => router.push("/dashboard/profile"), [router]);
  const handleNotificationClick = useCallback(() => router.push("/dashboard/notifications"), [router]);
  const handleMenuClick = useCallback(() => toggleSidebar(), [toggleSidebar]);

  return (
    <header className={styles.dashNavbar} role="banner">
      {/* LEFT */}
      <div className={styles.leftSection}>
        <button
          type="button"
          onClick={handleMenuClick}
          className={styles.menuButton}
          aria-label="Ouvrir/Fermer le menu"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <div className={styles.titleBlock}>
          <span className={styles.logoText}>Tableau de bord</span>
          <span className={styles.userNameInline}> {userName}</span>
        </div>

        {roleLabel && (
          <div className={styles.userRole}>
            <span>{roleLabel}</span>
          </div>
        )}
      </div>

      {/* RIGHT */}
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
              <div className={styles.proBadge}>
                <CheckCircle size={14} />
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
            title="Voir les notifications"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className={styles.notificationCount}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          className={styles.userProfile}
          onClick={handleProfileClick}
          title={`Profil de ${userName}`}
        >
          {loading ? (
            <div className={styles.avatarSkeleton} />
          ) : isAuthenticated && user ? (
            <div className={styles.avatarWrapperOuter}>
              <Image
                src={avatarSrc}
                alt=""
                width={48}
                height={48}
                className={styles.avatar}
                priority
              />
              <span className={styles.avatarStatus} />
            </div>
          ) : (
            <div className={styles.avatarPlaceholder}>
              <User size={22} />
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
