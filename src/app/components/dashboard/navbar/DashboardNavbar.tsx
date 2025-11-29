'use client';
import React from 'react';
import Image from 'next/image';
import { Menu, Bell, User } from 'lucide-react';
import { useCurrentUser } from '@/app/components/hooks/useCurrentUser';
import styles from './DashboardNavbar.module.scss';

interface DashboardNavbarProps {
    toggleSidebar: () => void;
}

const roleLabels: Record<string, string> = {
    owner: "Propriétaire",
    owner_pro: "Propriétaire PRO",
    concierge: "Conciergerie",
    concierge_pro: "Conciergerie PRO",
    providence: "Providence",
    providence_pro: "Providence PRO",
};

const getRoleLabel = (role: string | undefined): string => {
    if (!role) return 'Invité';
    return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ toggleSidebar }) => {
    const { user, isAuthenticated, loading } = useCurrentUser();
    const isPro = user?.role?.endsWith('_pro') || false;
    const avatarSrc = user?.avatar_url || '/icons/account-svgrepo-com.svg';
const userName = user?.firstName || user?.username || 'Utilisateur'; // ✅ Utiliser firstName au lieu de .name
    return (
        <header className="dash-navbar">
            <div className={styles.leftSection}>
                <button
                    onClick={toggleSidebar}
                    className={styles.menuButton}
                    aria-label="Ouvrir le menu"
                >
                    <Menu size={24} />
                </button>
                <span className={styles.logoText}>Tableau de bord</span>
            </div>
            <div className={styles.rightSection}>
                {isAuthenticated && isPro && (
                    <div className={styles.proBadge} aria-label="Version professionnelle active">
                        PRO
                    </div>
                )}
                <button className={styles.iconButton} aria-label="Notifications">
                    <Bell size={20} />
                    <span className={styles.notificationCount}>3</span>
                </button>
                <div
                    className={styles.userProfile}
                    onClick={() => window.location.href = '/dashboard/profile'}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && (window.location.href = '/dashboard/profile')}
                >
                    {!loading && isAuthenticated && user ? (
                        <>
                            <div className={styles.userInfo}>
                                <p className={styles.userName}>{userName}</p>
                                <p className={styles.userRole}>
                                    {getRoleLabel(user.role ?? undefined)}
                                </p>
                            </div>
                            <Image
                                src={avatarSrc}
                                alt={`Avatar de ${userName}`}
                                width={40}
                                height={40}
                                className={styles.avatar}
                                priority={true}
                            />


                        </>
                    ) : (
                        <div className={styles.userInfo}>
                            <p className={styles.userName}>Chargement...</p>
                            <User size={20} className={styles.avatarPlaceholder} />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardNavbar;
