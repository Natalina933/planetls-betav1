"use client";

import React, { useState } from "react";

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  service?: string | null;
}

interface ProviderStats {
  quotes: number;
  accepted: number;
  revenue: string;
}

export default function ProviderDashboard() {
  // ⚡ Données fictives pour tester l'affichage
  const [jobs] = useState<Job[]>([
    { id: "1", title: "Installation cuisine", description: "Pose complète", status: "accepted", service: "menuiserie" },
    { id: "2", title: "Peinture salon", description: "Peinture murale", status: "pending", service: "peinture" },
    { id: "3", title: "Réparation toiture", description: "Remplacement tuiles", status: "accepted", service: "toiture" },
  ]);

  const [stats] = useState<ProviderStats>({
    quotes: jobs.length,
    accepted: jobs.filter((j) => j.status === "accepted").length,
    revenue: "1 200 €", // valeur fictive
  });

  return (
    <section className="dashboard-grid">
      <h1>Tableau de bord prestataire</h1>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Devis reçus</h3>
          <p>{stats.quotes}</p>
        </div>
        <div className="stat-card">
          <h3>Chantiers acceptés</h3>
          <p>{stats.accepted}</p>
        </div>
        <div className="stat-card">
          <h3>Revenus</h3>
          <p>{stats.revenue}</p>
        </div>
      </div>

      <div className="main-section">
        <h2>Vos chantiers</h2>
        <ul>
          {jobs.map((job) => (
            <li key={job.id}>
              <strong>{job.title}</strong> — {job.description} ({job.status})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
