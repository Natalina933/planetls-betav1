// src/app/components/dashboard/Concierge/BaseFeaturesList.tsx
import React from 'react';
import { CheckCircle, Clock, Users } from 'lucide-react';

const BaseFeaturesList: React.FC = () => {
    return (
        <div className="base-features-section">
            <h3 className="section-title">Services Essentiels (Inclus)</h3>
            <ul className="feature-list">
                <li><CheckCircle size={20} className="check-icon" /> Gestion des réservations standard</li>
                <li><Clock size={20} className="check-icon" /> Suivi des demandes de ménage</li>
                <li><Users size={20} className="check-icon" /> Messagerie client de base</li>
            </ul>
        </div>
    );
};

export default BaseFeaturesList;