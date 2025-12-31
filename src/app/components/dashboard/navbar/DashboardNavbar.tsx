"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Bell, User, CheckCircle } from "lucide-react";
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

const ROLE_LABELS: Record<KnownRole, string> = {
    owner: "Propriétaire",
    owner_pro: "Propriétaire PRO",
    concierge: "Conciergerie",
    concierge_pro: "Conciergerie PRO",
    providence: "Providence",
    providence_pro: "Providence PRO",
};

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
 * Retourne un message de bienvenue contextuel selon l'heure
 */
const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
};

/**
 * Composant barre de navigation pour le tableau de bord
 */
function DashboardNavbar({ toggleSidebar }: DashboardNavbarProps) {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useCurrentUser();
    const [notificationCount] = useState(3); // Remplacer par vraie logique

    // Mémoïsation des valeurs dérivées
    const isPro = useMemo(
        () => !!user?.role && user.role.endsWith("_pro"),
        [user?.role]
    );

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

    const timeBasedGreeting = useMemo(() => getTimeBasedGreeting(), []);

    // Handlers
    const handleProfileClick = useCallback(() => {
        router.push("/dashboard/profile");
    }, [router]);

    const handleNotificationClick = useCallback(() => {
        router.push("/dashboard/notifications");
    }, [router]);

    const handleMenuClick = useCallback(() => {
        toggleSidebar();
    }, [toggleSidebar]);

    return (
        <header className="dash-navbar" role="banner">
            {/* Section gauche - Menu et identification */}
            <div className={styles.leftSection}>
                <button
                    type="button"
                    onClick={handleMenuClick}
                    className={styles.menuButton}
                    aria-label="Ouvrir/Fermer le menu de navigation"
                    aria-expanded="false"
                >
                    <Menu size={24} aria-hidden="true" />
                </button>

                <span className={styles.logoText} aria-label="Tableau de bord">
                    Tableau de bord
                </span>

                {roleLabel && (
                    <div className={styles.userRole} role="status">
                        <span>{roleLabel}</span>
                    </div>
                )}
            </div>

            {/* Section droite - Infos et actions utilisateur */}
            <div className={styles.rightSection}>
                {/* Bloc accueil avec nom commercial */}
                {isAuthenticated && (
                    <div className={styles.greetingBlock} role="complementary">
                        <p className={styles.companyName} aria-label="Nom de l'entreprise">
                            {companyName}
                        </p>
                        <p className={styles.greeting} aria-label="Message de bienvenue">
                            {timeBasedGreeting} {greetingName}
                        </p>
                    </div>
                )}

                {/* Badge PRO avec animation */}
                {isAuthenticated && isPro && (
                    <div
                        className={styles.proBadge}
                        role="status"
                        aria-label="Compte professionnel actif"
                    >
                        <CheckCircle size={14} aria-hidden="true" />
                        <span>PRO</span>
                    </div>
                )}

                {/* Bouton notifications avec badge de compteur */}
                {isAuthenticated && (
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={handleNotificationClick}
                        aria-label={`${notificationCount} notification${notificationCount > 1 ? "s" : ""
                            } non lue${notificationCount > 1 ? "s" : ""}`}
                        title="Voir les notifications"
                    >
                        <Bell size={20} aria-hidden="true" />
                        {notificationCount > 0 && (
                            <span
                                className={styles.notificationCount}
                                aria-hidden="true"
                            >
                                {notificationCount > 9 ? "9+" : notificationCount}
                            </span>
                        )}
                    </button>
                )}

                {/* Profil utilisateur - Avatar avec effet hover élégant */}
                <button
                    type="button"
                    className={styles.userProfile}
                    onClick={handleProfileClick}
                    aria-label={`Accéder au profil de ${userName}`}
                    title={`Profil de ${userName}`}
                >
                    {!loading && isAuthenticated && user ? (
                        <Image
                            src={avatarSrc}
                            alt=""
                            width={48}
                            height={48}
                            className={styles.avatar}
                            priority
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = AVATAR_FALLBACK;
                            }}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder} aria-label="Avatar par défaut">
                            <User size={22} aria-hidden="true" />
                        </div>
                    )}
                </button>
            </div>
        </header>
    );
}

export default DashboardNavbar;