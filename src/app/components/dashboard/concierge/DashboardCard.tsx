// src/app/components/dashboard/Concierge/DashboardCard.tsx
import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';

interface DashboardCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    description: string;
    isLocked?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, description, isLocked = false }) => {
    return (
        <div className={`dashboard-card ${isLocked ? 'locked-card' : ''}`}>
            <div className="card-header">
                <Icon className="card-icon" size={24} />
                <h3 className="card-title">{title}</h3>
            </div>
            <div className="card-content">
                <p className="card-value">{value}</p>
                {isLocked && <Lock className="lock-icon" size={20} />}
            </div>
            <p className="card-description">{description}</p>
        </div>
    );
};

export default DashboardCard;