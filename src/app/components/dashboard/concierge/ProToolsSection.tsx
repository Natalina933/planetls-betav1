// src/app/components/dashboard/Concierge/ProToolsSection.tsx
import React from 'react';
import { BarChart3, Mail, Calendar } from 'lucide-react';

const ProToolsSection: React.FC = () => {
    return (
        <div className="pro-tools-section">
            <h3 className="section-title">🚀 Outils Premium PRO (Actif)</h3>
            <ul className="tool-list">
                <li><BarChart3 size={20} className="tool-icon" /> Analyse de Performance Avancée</li>
                <li><Mail size={20} className="tool-icon" /> Automatisation des Communications</li>
                <li><Calendar size={20} className="tool-icon" /> Intégration d&apos;Outils Tiers</li>
                <li className="text-sm mt-3 text-green-600">⭐ Votre abonnement PRO est actif et vous fait économiser du temps chaque jour.</li>
            </ul>
        </div>
    );
};

export default ProToolsSection;