"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Bell, User } from "lucide-react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import styles from "./DashboardNavbar.module.scss";

interface DashboardNavbarProps {
    toggleSidebar: () => void;
}

type KnownRole =
    | "owner"
    | "owner_pro"
    | "concierge"
    | "concierge_pro"
    | "providence"
    | "providence_pro";

// Mapping des rôles avec descriptions en français
const ROLE_LABELS: Record<KnownRole, string> = {
    owner: "Propriétaire",
    owner_pro: "Propriétaire PRO",
    concierge: "Conciergerie",
    concierge_pro: "Conciergerie PRO",
    providence: "Providence",
    providence_pro: "Providence PRO",
};

const NOTIFICATION_COUNT = 3;
const DEFAULT_COMPANY_NAME = "Ma conciergerie";
const AVATAR_FALLBACK = "/icons/account-svgrepo-com.svg";

/**
 * Convertit un rôle en label lisible
 */
const getRoleLabel = (role: string | null | undefined): string => {
    if (!role) return "Invité";
    if (role in ROLE_LABELS) return ROLE_LABELS[role as KnownRole];
    return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Composant barre de navigation pour le tableau de bord
 */
function DashboardNavbar({ toggleSidebar }: DashboardNavbarProps) {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useCurrentUser();

    // Mémoïsation des valeurs dérivées pour optimiser les rendus
    const isPro = useMemo(() => !!user?.role && user.role.endsWith("_pro"), [user?.role]);

    const avatarSrc = useMemo(
        () => user?.avatar_url || AVATAR_FALLBACK,
        [user?.avatar_url]
    );

    const userName = useMemo(
        () => user?.firstName || user?.username || "Utilisateur",
        [user?.firstName, user?.username]
    );

    const roleLabel = useMemo(
        () => getRoleLabel(user?.role ?? null),
        [user?.role]
    );

    const companyName = useMemo(
        () => user?.company_name || DEFAULT_COMPANY_NAME,
        [user?.company_name]
    );

    const greetingName = useMemo(
        () => user?.firstName || user?.username || "vous",
        [user?.firstName, user?.username]
    );

    const handleProfileClick = useCallback(() => {
        router.push("/dashboard/profile");
    }, [router]);

    return (
        <header className="dash-navbar">
            {/* Section gauche - Menu et identification */}
            <div className={styles.leftSection}>
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className={styles.menuButton}
                    aria-label="Ouvrir le menu de navigation"
                >
                    <Menu size={24} aria-hidden="true" />
                </button>

                <span className={styles.logoText}>Tableau de bord</span>

                {roleLabel && (
                    <p className={styles.userRole}>{roleLabel}</p>
                )}
            </div>

            {/* Section droite - Infos et actions utilisateur */}
            <div className={styles.rightSection}>
                {/* Bloc accueil avec nom commercial */}
                <div className={styles.greetingBlock}>
                    <p className={styles.companyName}>{companyName}</p>
                    <p className={styles.greeting}>Bonjour {greetingName}</p>
                </div>

                {/* Badge PRO */}
                {isAuthenticated && isPro && (
                    <div
                        className={styles.proBadge}
                        aria-label="Version professionnelle active"
                    >
                        ✓ PRO
                    </div>
                )}

                {/* Bouton notifications */}
                <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`${NOTIFICATION_COUNT} notification${NOTIFICATION_COUNT > 1 ? "s" : ""}`}
                >
                    <Bell size={20} aria-hidden="true" />
                    {NOTIFICATION_COUNT > 0 && (
                        <span className={styles.notificationCount} aria-hidden="true">
                            {NOTIFICATION_COUNT}
                        </span>
                    )}
                </button>

                {/* Profil utilisateur - Avatar uniquement */}
                <button
                    type="button"
                    className={styles.userProfile}
                    onClick={handleProfileClick}
                    aria-label="Accéder au profil utilisateur"
                    title={`Profil de ${userName}`}
                >
                    {!loading && isAuthenticated && user ? (
                        <Image
                            src={avatarSrc}
                            alt={`Avatar de ${userName}`}
                            width={40}
                            height={40}
                            className={styles.avatar}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <User size={20} aria-hidden="true" />
                        </div>
                    )}
                </button>

            </div>
        </header>
    );
};

export default DashboardNavbar;
