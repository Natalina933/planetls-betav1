// src/app/components/dashboard/Navbar/DashboardNavbar.tsx
'use client';

import React from 'react';
// ⚠️ Importez Image de 'next/image' pour l'optimisation
import Image from 'next/image';
import { Menu, Bell, User } from 'lucide-react';
// Assurez-vous que useCurrentUser renvoie bien un objet avec un champ role de type string | null | undefined
import { useCurrentUser } from '@/app/components/hooks/useCurrentUser'; 
import styles from './DashboardNavbar.module.scss';

interface DashboardNavbarProps {
    toggleSidebar: () => void;
}

// Map pour les libellés de rôle complets (vous pouvez étendre cette liste si besoin)
const roleLabels: Record<string, string> = {
    owner: "Propriétaire",
    owner_pro: "Propriétaire PRO",
    concierge: "Conciergerie",
    concierge_pro: "Conciergerie PRO",
    providence: "Providence",
    providence_pro: "Providence PRO",
    // Ajoutez 'artisan', 'artisan_pro', etc. si nécessaire
};

// 🛠️ Fonction gérant les types string | null | undefined
const getRoleLabel = (role: string | undefined): string => {
    // Si le rôle est null ou undefined, on retourne 'Invité' (ou 'Chargement...')
    if (!role) return 'Invité'; 
    
    // Si le rôle existe dans la map, on le retourne, sinon on met la première lettre en majuscule.
    return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ toggleSidebar }) => {
    const { user, isAuthenticated, loading } = useCurrentUser();
    
    // Détermine si l'utilisateur est PRO (basé sur le suffixe)
    const isPro = user?.role?.endsWith('_pro') || false;

    // Détermine l'URL de l'avatar ou utilise un fallback
    const avatarSrc = user?.avatar_url || '//icons/account-svgrepo-com.svg';
    const userName = user?.firstName || user?.username || 'Utilisateur';

    return (
        // La classe 'dash-navbar' est définie dans le SCSS global
        <header className="dash-navbar"> 
            <div className={styles.leftSection}>
                {/* Bouton pour ouvrir/fermer la sidebar */}
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
                
                {/* Statut PRO */}
                {isAuthenticated && isPro && (
                    <div className={styles.proBadge} aria-label="Version professionnelle active">
                        PRO
                    </div>
                )}

                {/* Notifications */}
                <button className={styles.iconButton} aria-label="Notifications">
                    <Bell size={20} />
                    <span className={styles.notificationCount}>3</span>
                </button>
                
                {/* Profil utilisateur */}
                <div className={styles.userProfile}>
                    {!loading && isAuthenticated && user ? (
                        <>
                            <div className={styles.userInfo}>
                                <p className={styles.userName}>{userName}</p>
                                <p className={styles.userRole}>
                                    {/* 💥 CORRECTION TYPAGE : Utilisation de l'opérateur de coalescence (??) pour transformer null en undefined */}
                                    {getRoleLabel(user.role ?? undefined)}
                                </p>
                            </div>
                            {/* 🚀 CORRECTION PERFORMANCE : Utilisation du composant Image de Next.js */}
                            <Image 
                                src={avatarSrc} 
                                alt={`Avatar de ${userName}`} 
                                width={40} // ⚠️ Obligatoire pour Next/Image
                                height={40} // ⚠️ Obligatoire pour Next/Image
                                className={styles.avatar} // La classe styles.avatar pour le style (bordure/taille/etc.)
                                priority={true} // Chargement rapide car c'est dans la Navbar
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