// components/dashboard/StatCard.tsx
import React from "react";

export default function StatCard({ title, value, small }: { title: string; value: string | number; small?: string }) {
    return (
        <div className="stat-card" role="region" aria-label={title}>
            <div className="stat-card-title">{title}</div>
            <div className="stat-card-value">{value}</div>
            {small && <div className="stat-card-small">{small}</div>}
        </div>
    );
}
