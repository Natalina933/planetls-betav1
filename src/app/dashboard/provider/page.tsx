"use client";

import React, { useState, useEffect } from "react";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiDollarSign, 
  FiClock,
  FiAlertCircle,
  FiTrendingUp 
} from "react-icons/fi";
import styles from "./ProviderDashboard.module.scss";

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status?: "pending" | "accepted" | "in_progress" | "completed" | "cancelled" | null;
  service?: string | null;
  client_name?: string;
  deadline?: string;
  budget?: number;
  created_at?: string;
}

interface ProviderStats {
  quotes: number;
  accepted: number;
  in_progress: number;
  completed: number;
  revenue: number;
  monthly_revenue: number;
}

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "#f39c12", icon: FiClock },
  accepted: { label: "Accepté", color: "#3498db", icon: FiCheckCircle },
  in_progress: { label: "En cours", color: "#9b59b6", icon: FiTrendingUp },
  completed: { label: "Terminé", color: "#27ae60", icon: FiCheckCircle },
  cancelled: { label: "Annulé", color: "#e74c3c", icon: FiAlertCircle },
};

export default function ProviderDashboard() {
  const [jobs, setJobs] = useState<Job[]>([
    { 
      id: "1", 
      title: "Installation cuisine complète", 
      description: "Pose de meubles, plans de travail et électroménager", 
      status: "accepted", 
      service: "Menuiserie",
      client_name: "M. Dubois",
      deadline: "2025-01-15",
      budget: 2500,
      created_at: "2024-12-20"
    },
    { 
      id: "2", 
      title: "Peinture salon et couloir", 
      description: "Peinture murale avec lessivage préalable", 
      status: "pending", 
      service: "Peinture",
      client_name: "Mme Martin",
      deadline: "2025-01-10",
      budget: 800,
      created_at: "2024-12-28"
    },
    { 
      id: "3", 
      title: "Réparation toiture urgente", 
      description: "Remplacement de tuiles cassées suite à tempête", 
      status: "in_progress", 
      service: "Toiture",
      client_name: "M. Lefèvre",
      deadline: "2025-01-05",
      budget: 1500,
      created_at: "2024-12-15"
    },
    { 
      id: "4", 
      title: "Installation électrique", 
      description: "Mise aux normes tableau électrique", 
      status: "completed", 
      service: "Électricité",
      client_name: "Mme Rousseau",
      budget: 1200,
      created_at: "2024-11-20"
    },
  ]);

  const [stats, setStats] = useState<ProviderStats>({
    quotes: 0,
    accepted: 0,
    in_progress: 0,
    completed: 0,
    revenue: 0,
    monthly_revenue: 0,
  });

  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "deadline">("date");

  // Calcul des statistiques
  useEffect(() => {
    const newStats: ProviderStats = {
      quotes: jobs.length,
      accepted: jobs.filter((j) => j.status === "accepted").length,
      in_progress: jobs.filter((j) => j.status === "in_progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      revenue: jobs
        .filter((j) => j.status === "completed")
        .reduce((sum, j) => sum + (j.budget || 0), 0),
      monthly_revenue: jobs
        .filter((j) => {
          const createdDate = new Date(j.created_at || "");
          const currentMonth = new Date().getMonth();
          return j.status === "completed" && createdDate.getMonth() === currentMonth;
        })
        .reduce((sum, j) => sum + (j.budget || 0), 0),
    };
    setStats(newStats);
  }, [jobs]);

  // Filtrage des jobs
  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    return job.status === filter;
  });

  // Tri des jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    }
    if (sortBy === "budget") {
      return (b.budget || 0) - (a.budget || 0);
    }
    if (sortBy === "deadline") {
      return new Date(a.deadline || "").getTime() - new Date(b.deadline || "").getTime();
    }
    return 0;
  });

  const handleAcceptJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "accepted" } : job
      )
    );
  };

  const handleStartJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "in_progress" } : job
      )
    );
  };

  const handleCompleteJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "completed" } : job
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Tableau de bord prestataire</h1>
        <p>Gérez vos chantiers et suivez vos performances</p>
      </header>

      {/* Statistiques */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#3498db20", color: "#3498db" }}>
            <FiFileText />
          </div>
          <div className={styles.statContent}>
            <h3>Devis reçus</h3>
            <p className={styles.statValue}>{stats.quotes}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#27ae6020", color: "#27ae60" }}>
            <FiCheckCircle />
          </div>
          <div className={styles.statContent}>
            <h3>Chantiers acceptés</h3>
            <p className={styles.statValue}>{stats.accepted}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#9b59b620", color: "#9b59b6" }}>
            <FiTrendingUp />
          </div>
          <div className={styles.statContent}>
            <h3>En cours</h3>
            <p className={styles.statValue}>{stats.in_progress}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#f39c1220", color: "#f39c12" }}>
            <FiDollarSign />
          </div>
          <div className={styles.statContent}>
            <h3>Revenus totaux</h3>
            <p className={styles.statValue}>{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
      </div>

      {/* Filtres et tri */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          <button
            className={filter === "all" ? styles.filterActive : ""}
            onClick={() => setFilter("all")}
          >
            Tous ({jobs.length})
          </button>
          <button
            className={filter === "pending" ? styles.filterActive : ""}
            onClick={() => setFilter("pending")}
          >
            En attente
          </button>
          <button
            className={filter === "accepted" ? styles.filterActive : ""}
            onClick={() => setFilter("accepted")}
          >
            Acceptés
          </button>
          <button
            className={filter === "in_progress" ? styles.filterActive : ""}
            onClick={() => setFilter("in_progress")}
          >
            En cours
          </button>
          <button
            className={filter === "completed" ? styles.filterActive : ""}
            onClick={() => setFilter("completed")}
          >
            Terminés
          </button>
        </div>

        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "budget" | "deadline")}
        >
          <option value="date">Trier par date</option>
          <option value="budget">Trier par budget</option>
          <option value="deadline">Trier par échéance</option>
        </select>
      </div>

      {/* Liste des chantiers */}
      <div className={styles.jobsList}>
        {sortedJobs.length === 0 ? (
          <div className={styles.emptyState}>
            <FiAlertCircle size={48} />
            <p>Aucun chantier trouvé</p>
          </div>
        ) : (
          sortedJobs.map((job) => {
            const statusInfo = STATUS_CONFIG[job.status || "pending"];
            const StatusIcon = statusInfo.icon;

            return (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <div>
                    <h3>{job.title}</h3>
                    <p className={styles.jobService}>{job.service}</p>
                  </div>
                  <div
                    className={styles.jobStatus}
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                    }}
                  >
                    <StatusIcon size={16} />
                    {statusInfo.label}
                  </div>
                </div>

                <p className={styles.jobDescription}>{job.description}</p>

                <div className={styles.jobDetails}>
                  <div className={styles.jobDetail}>
                    <strong>Client:</strong> {job.client_name}
                  </div>
                  <div className={styles.jobDetail}>
                    <strong>Budget:</strong> {formatCurrency(job.budget || 0)}
                  </div>
                  <div className={styles.jobDetail}>
                    <strong>Échéance:</strong> {formatDate(job.deadline)}
                  </div>
                  <div className={styles.jobDetail}>
                    <strong>Créé le:</strong> {formatDate(job.created_at)}
                  </div>
                </div>

                <div className={styles.jobActions}>
                  {job.status === "pending" && (
                    <button
                      className={styles.btnAccept}
                      onClick={() => handleAcceptJob(job.id)}
                    >
                      Accepter le devis
                    </button>
                  )}
                  {job.status === "accepted" && (
                    <button
                      className={styles.btnStart}
                      onClick={() => handleStartJob(job.id)}
                    >
                      Démarrer le chantier
                    </button>
                  )}
                  {job.status === "in_progress" && (
                    <button
                      className={styles.btnComplete}
                      onClick={() => handleCompleteJob(job.id)}
                    >
                      Marquer comme terminé
                    </button>
                  )}
                  <button className={styles.btnDetails}>Voir détails</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}