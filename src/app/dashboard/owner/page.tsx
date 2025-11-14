"use client";

import React, { useState } from "react";

interface Property {
  id: string;
  name: string;
  city: string;
  status?: string;
}

export default function OwnerDashboardPage() {
  // ⚡ Données fictives pour tester l'affichage
  const [properties] = useState<Property[]>([
    { id: "1", name: "Maison de campagne", city: "Lyon", status: "active" },
    { id: "2", name: "Appartement moderne", city: "Paris", status: "draft" },
    { id: "3", name: "Villa bord de mer", city: "Nice", status: "active" },
  ]);

  return (
    <section className="dashboard-grid">
      <h1>Tableau de bord propriétaire</h1>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Biens gérés</h3>
          <p>{properties.length}</p>
        </div>
      </div>

      <div className="main-section">
        <h2>Vos propriétés</h2>
        <ul>
          {properties.map((property) => (
            <li key={property.id}>
              <strong>{property.name}</strong> — {property.city} ({property.status})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
