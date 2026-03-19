// src/app/components/dashboard/Concierge/ProUpgradeCTA.tsx
import React from 'react';
import { Zap, Lock } from 'lucide-react';

const ProUpgradeCTA: React.FC = () => {
    return (
        <div className="pro-cta-card">
            <Zap className="pro-cta-icon" size={48} />
            <h3 className="pro-cta-title">Passez à la Conciergerie PRO</h3>
            <p className="pro-cta-description">
                Débloquez les analyses de performance, l&apos;automatisation des emails et l&apos;intégration de calendriers externes pour maximiser vos revenus.
            </p>
            <button
                onClick={() => window.location.href = '/abonnement/concierge-pro'}
                className="pro-cta-button"
            >
                Découvrir l&apos;Offre PRO
            </button>
            <div className="locked-features">
                <Lock size={16} /> Fonctionnalités verrouillées
            </div>
        </div>
    );
};

export default ProUpgradeCTA;